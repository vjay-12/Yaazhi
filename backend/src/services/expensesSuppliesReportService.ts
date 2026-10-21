import { prisma } from '../db.js';

export interface ReportDateRange {
  startDate?: Date;
  endDate?: Date;
}

export interface ExpensesSuppliesSummary {
  period: string;
  date_range: {
    start: string | null;
    end: string | null;
  };
  supplies_stock: {
    total_items_count: number;
    active_items_count: number;
    low_stock_count: number;
    out_of_stock_count: number;
    total_valuation_at_cost: number;
  };
  supplies_purchases: {
    period_total_amount: number;
    period_tax_total: number;
    period_discount_total: number;
    period_purchases_count: number;
    all_time_outstanding_supplier_balance: number;
    unpaid_purchases_count: number;
  };
  operating_expenses: {
    period_total_amount: number;
    active_expenses_count: number;
    voided_expenses_count: number;
    by_category: Array<{
      category: string;
      total_amount: number;
      count: number;
      percentage: number;
    }>;
    by_payment_method: Array<{
      payment_method: string;
      total_amount: number;
      count: number;
    }>;
  };
  consumption_summary: {
    period_consumed_items_count: number;
    period_consumed_estimated_value: number;
    stitching_linked_movements_count: number;
  };
  accounting_note: string;
}

export class ExpensesSuppliesReportService {
  /**
   * Helper to parse period into Date range
   */
  static getDateRange(period: string, customStart?: string, customEnd?: string): ReportDateRange {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (period?.toLowerCase()) {
      case 'today':
        return { startDate: startOfToday, endDate: endOfToday };

      case 'this_week': {
        const dayOfWeek = now.getDay();
        const distanceToMonday = (dayOfWeek + 6) % 7;
        const monday = new Date(startOfToday);
        monday.setDate(monday.getDate() - distanceToMonday);
        return { startDate: monday, endDate: endOfToday };
      }

      case 'this_month': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        return { startDate: firstDay, endDate: endOfToday };
      }

      case 'this_quarter': {
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
        const firstDayOfQuarter = new Date(now.getFullYear(), quarterMonth, 1, 0, 0, 0, 0);
        return { startDate: firstDayOfQuarter, endDate: endOfToday };
      }

      case 'this_year': {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        return { startDate: firstDayOfYear, endDate: endOfToday };
      }

      case 'custom':
        return {
          startDate: customStart ? new Date(customStart) : undefined,
          endDate: customEnd ? new Date(customEnd) : undefined,
        };

      case 'all':
      default:
        return { startDate: undefined, endDate: undefined };
    }
  }

  /**
   * Generate comprehensive report for Supplies & Expenses
   */
  static async getSummary(params: {
    period?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<ExpensesSuppliesSummary> {
    const period = params.period || 'this_month';
    const { startDate, endDate } = this.getDateRange(period, params.start_date, params.end_date);

    // 1. Supplies Stock Valuation & Low Stock (Current snapshot)
    const supplies = await prisma.supplyItem.findMany({
      where: { is_archived: false },
    });

    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const item of supplies) {
      const qty = Number(item.current_quantity) || 0;
      const cost = Number(item.unit_cost) || 0;
      const minStock = Number(item.min_stock_level) || 0;

      totalValuation += qty * cost;
      if (qty <= 0) {
        outOfStockCount++;
      }
      if (qty <= minStock) {
        lowStockCount++;
      }
    }

    const totalSuppliesCount = await prisma.supplyItem.count();

    // 2. Supplies Purchases in Period
    const purchaseWhere: any = { status: 'RECEIVED' };
    if (startDate || endDate) {
      purchaseWhere.purchase_date = {};
      if (startDate) purchaseWhere.purchase_date.gte = startDate;
      if (endDate) purchaseWhere.purchase_date.lte = endDate;
    }

    const periodPurchases = await prisma.supplyPurchase.findMany({
      where: purchaseWhere,
    });

    let periodPurchaseAmount = 0;
    let periodTaxTotal = 0;
    let periodDiscountTotal = 0;

    for (const p of periodPurchases) {
      periodPurchaseAmount += Number(p.grand_total) || 0;
      periodTaxTotal += Number(p.tax_total) || 0;
      periodDiscountTotal += Number(p.discount_total) || 0;
    }

    // All-time outstanding supplier balances
    const unpaidPurchases = await prisma.supplyPurchase.findMany({
      where: {
        status: 'RECEIVED',
        payment_status: { in: ['PENDING', 'PARTIAL'] },
      },
      select: { balance_amount: true },
    });


    const outstandingBalance = unpaidPurchases.reduce(
      (sum, p) => sum + (Number(p.balance_amount) || 0),
      0
    );

    // 3. Operating Expenses in Period
    const expenseWhere: any = { status: 'ACTIVE' };
    if (startDate || endDate) {
      expenseWhere.expense_date = {};
      if (startDate) expenseWhere.expense_date.gte = startDate;
      if (endDate) expenseWhere.expense_date.lte = endDate;
    }

    const activeExpenses = await prisma.operatingExpense.findMany({
      where: expenseWhere,
    });

    const voidedCount = await prisma.operatingExpense.count({
      where: {
        status: 'VOIDED',
        ...(startDate || endDate ? { expense_date: expenseWhere.expense_date } : {}),
      },
    });

    let periodExpenseAmount = 0;
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    const paymentTotals: Record<string, { total: number; count: number }> = {};

    for (const exp of activeExpenses) {
      const amt = Number(exp.amount) || 0;
      periodExpenseAmount += amt;

      const cat = exp.category || 'Other Operating Expenses';
      if (!categoryTotals[cat]) {
        categoryTotals[cat] = { total: 0, count: 0 };
      }
      categoryTotals[cat].total += amt;
      categoryTotals[cat].count += 1;

      const pMethod = exp.payment_method || 'CASH';
      if (!paymentTotals[pMethod]) {
        paymentTotals[pMethod] = { total: 0, count: 0 };
      }
      paymentTotals[pMethod].total += amt;
      paymentTotals[pMethod].count += 1;
    }

    const byCategory = Object.entries(categoryTotals)
      .map(([category, val]) => ({
        category,
        total_amount: Math.round(val.total * 100) / 100,
        count: val.count,
        percentage: periodExpenseAmount > 0 ? Math.round((val.total / periodExpenseAmount) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.total_amount - a.total_amount);

    const byPaymentMethod = Object.entries(paymentTotals)
      .map(([payment_method, val]) => ({
        payment_method,
        total_amount: Math.round(val.total * 100) / 100,
        count: val.count,
      }))
      .sort((a, b) => b.total_amount - a.total_amount);

    // 4. Consumption Summary in Period
    const movementWhere: any = { movement_type: 'CONSUMPTION' };
    if (startDate || endDate) {
      movementWhere.created_at = {};
      if (startDate) movementWhere.created_at.gte = startDate;
      if (endDate) movementWhere.created_at.lte = endDate;
    }

    const consumptionMovements = await prisma.supplyMovement.findMany({
      where: movementWhere,
      include: {
        supply: {
          select: { unit_cost: true },
        },
      },
    });

    let consumedQtyTotal = 0;
    let consumedValueTotal = 0;
    let stitchingLinkedCount = 0;

    for (const m of consumptionMovements) {
      const qty = Math.abs(Number(m.quantity)) || 0;
      const cost = Number(m.unit_cost) || Number(m.supply?.unit_cost) || 0;
      consumedQtyTotal += qty;
      consumedValueTotal += qty * cost;
      if (m.stitching_order_number) {
        stitchingLinkedCount++;
      }
    }

    return {
      period,
      date_range: {
        start: startDate ? startDate.toISOString() : null,
        end: endDate ? endDate.toISOString() : null,
      },
      supplies_stock: {
        total_items_count: totalSuppliesCount,
        active_items_count: supplies.length,
        low_stock_count: lowStockCount,
        out_of_stock_count: outOfStockCount,
        total_valuation_at_cost: Math.round(totalValuation * 100) / 100,
      },
      supplies_purchases: {
        period_total_amount: Math.round(periodPurchaseAmount * 100) / 100,
        period_tax_total: Math.round(periodTaxTotal * 100) / 100,
        period_discount_total: Math.round(periodDiscountTotal * 100) / 100,
        period_purchases_count: periodPurchases.length,
        all_time_outstanding_supplier_balance: Math.round(outstandingBalance * 100) / 100,
        unpaid_purchases_count: unpaidPurchases.length,
      },
      operating_expenses: {
        period_total_amount: Math.round(periodExpenseAmount * 100) / 100,
        active_expenses_count: activeExpenses.length,
        voided_expenses_count: voidedCount,
        by_category: byCategory,
        by_payment_method: byPaymentMethod,
      },
      consumption_summary: {
        period_consumed_items_count: consumedQtyTotal,
        period_consumed_estimated_value: Math.round(consumedValueTotal * 100) / 100,
        stitching_linked_movements_count: stitchingLinkedCount,
      },
      accounting_note:
        'Consumable supplies purchases increase atelier stock asset value and are capitalized into inventory until consumed. Operating expenses are recognized immediately as period expenses. They are separated to prevent double-counting and maintain accounting integrity.',
    };
  }
}
