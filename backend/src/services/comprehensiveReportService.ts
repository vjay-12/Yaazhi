import { prisma } from '../db.js';
import { OrderStatus, SupplyMovementType } from '@prisma/client';

export interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export class ComprehensiveReportService {
  /**
   * Helper to parse period into Date range
   */
  static parsePeriod(period?: string, customStart?: string, customEnd?: string): {
    period: string;
    startDate?: Date;
    endDate?: Date;
  } {
    const p = (period || 'THIS_MONTH').toUpperCase();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (p) {
      case 'TODAY':
        return { period: p, startDate: startOfToday, endDate: endOfToday };

      case 'THIS_WEEK': {
        const dayOfWeek = now.getDay();
        const distanceToMonday = (dayOfWeek + 6) % 7;
        const monday = new Date(startOfToday);
        monday.setDate(monday.getDate() - distanceToMonday);
        return { period: p, startDate: monday, endDate: endOfToday };
      }

      case 'THIS_MONTH': {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        return { period: p, startDate: firstDay, endDate: endOfToday };
      }

      case 'LAST_MONTH': {
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return { period: p, startDate: firstDayLastMonth, endDate: lastDayLastMonth };
      }

      case 'THIS_YEAR': {
        const firstDayOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        return { period: p, startDate: firstDayOfYear, endDate: endOfToday };
      }

      case 'CUSTOM':
        return {
          period: p,
          startDate: customStart ? new Date(customStart) : undefined,
          endDate: customEnd ? new Date(new Date(customEnd).setHours(23, 59, 59, 999)) : undefined,
        };

      case 'ALL_TIME':
      case 'ALL':
      default:
        return { period: 'ALL_TIME', startDate: undefined, endDate: undefined };
    }
  }

  /**
   * Helper to format date boundaries for Prisma where clause
   */
  static dateFilter(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) return undefined;
    const filter: any = {};
    if (startDate) filter.gte = startDate;
    if (endDate) filter.lte = endDate;
    return filter;
  }

  // ==========================================================================
  // 1. BUSINESS OVERVIEW
  // ==========================================================================
  static async getBusinessOverview(range: DateRange) {
    const orderDateFilter = this.dateFilter(range.startDate, range.endDate);

    // 1. Valid sales orders
    const validSalesOrders = await prisma.salesOrder.findMany({
      where: {
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.VOIDED] },
        ...(orderDateFilter ? { order_date: orderDateFilter } : {}),
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });

    let grossSales = 0;
    let discountTotal = 0;
    let netSales = 0;
    let outstandingCustomerBalances = 0;
    let cogsTotal = 0;

    for (const order of validSalesOrders) {
      const orderGrand = Number(order.grand_total) || 0;
      const orderDiscount = Number(order.discount_total) || 0;
      const orderPending = Number(order.pending_amount) || 0;

      netSales += orderGrand;
      discountTotal += orderDiscount;
      outstandingCustomerBalances += orderPending;
      grossSales += orderGrand + orderDiscount;

      for (const item of order.items) {
        const qty = Number(item.quantity) || 0;

        // COGS for physical products (ignore services without unit cost)
        const isService = item.product.unit === 'SERVICE' || item.product.sku?.startsWith('SRV-');
        if (!isService) {
          const cost = Number(item.product.purchase_price) || 0;
          cogsTotal += qty * cost;
        }
      }
    }

    // 2. Successful collections in period
    const paymentDateFilter = this.dateFilter(range.startDate, range.endDate);
    const successfulPayments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESSFUL',
        ...(paymentDateFilter ? { payment_date: paymentDateFilter } : {}),
      },
      select: { amount: true, payment_mode: true },
    });

    const totalCollected = successfulPayments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );

    // 3. Operating expenses in period
    const expenseDateFilter = this.dateFilter(range.startDate, range.endDate);
    const operatingExpenses = await prisma.operatingExpense.findMany({
      where: {
        status: 'ACTIVE',
        ...(expenseDateFilter ? { expense_date: expenseDateFilter } : {}),
      },
      select: { amount: true },
    });

    const totalOperatingExpenses = operatingExpenses.reduce(
      (sum, e) => sum + (Number(e.amount) || 0),
      0
    );

    // 4. Current inventory valuation (current state)
    const stockBalances = await prisma.stockBalance.findMany({
      include: {
        product: { select: { purchase_price: true, min_stock_level: true } },
      },
    });

    let currentInventoryValuationCost = 0;
    let totalStockUnits = 0;
    const productQtyMap = new Map<string, { totalQty: number; minStock: number }>();

    for (const b of stockBalances) {
      const qty = Number(b.current_quantity) || 0;
      const avgCost = Number(b.avg_cost) || 0;
      const cost = avgCost > 0 ? avgCost : Number(b.product.purchase_price) || 0;

      totalStockUnits += qty;
      currentInventoryValuationCost += qty * cost;

      if (!productQtyMap.has(b.product_id)) {
        productQtyMap.set(b.product_id, {
          totalQty: qty,
          minStock: Number(b.product.min_stock_level) || 0,
        });
      } else {
        productQtyMap.get(b.product_id)!.totalQty += qty;
      }
    }

    let lowStockCount = 0;
    let outOfStockCount = 0;
    for (const [, item] of productQtyMap) {
      if (item.totalQty <= 0) {
        outOfStockCount++;
      } else if (item.totalQty <= item.minStock) {
        lowStockCount++;
      }
    }

    // 5. Consumable supplies stock valuation (current state)
    const activeSupplies = await prisma.supplyItem.findMany({
      where: { is_archived: false },
      select: { current_quantity: true, unit_cost: true },
    });
    const suppliesStockValuation = activeSupplies.reduce(
      (sum, s) => sum + (Number(s.current_quantity) || 0) * (Number(s.unit_cost) || 0),
      0
    );

    // Profitability
    const grossProfit = Math.max(0, netSales - cogsTotal);
    const grossMarginPct = netSales > 0 ? Math.round((grossProfit / netSales) * 1000) / 10 : 0;
    const operatingSurplus = grossProfit - totalOperatingExpenses;

    return {
      gross_sales: Math.round(grossSales * 100) / 100,
      discounts_total: Math.round(discountTotal * 100) / 100,
      net_sales: Math.round(netSales * 100) / 100,
      successful_collections: Math.round(totalCollected * 100) / 100,
      outstanding_customer_balances: Math.round(outstandingCustomerBalances * 100) / 100,
      cost_of_goods_sold: Math.round(cogsTotal * 100) / 100,
      gross_profit: Math.round(grossProfit * 100) / 100,
      gross_margin_pct: grossMarginPct,
      operating_expenses: Math.round(totalOperatingExpenses * 100) / 100,
      operating_surplus: Math.round(operatingSurplus * 100) / 100,
      current_inventory_valuation_cost: Math.round(currentInventoryValuationCost * 100) / 100,
      current_supplies_stock_valuation: Math.round(suppliesStockValuation * 100) / 100,
      total_stock_units: totalStockUnits,
      low_stock_items_count: lowStockCount,
      out_of_stock_items_count: outOfStockCount,
      orders_count: validSalesOrders.length,
      average_order_value:
        validSalesOrders.length > 0 ? Math.round((netSales / validSalesOrders.length) * 100) / 100 : 0,
      accounting_note:
        'Revenue reflects recognized sales orders excluding voided bills. Collections represent actual cash/UPI receipts. Cost of goods sold reflects physical inventory purchase rates. Consumable supplies and store operating costs are accounted for separately to prevent double-counting inventory assets as period expenses.',
    };
  }

  // ==========================================================================
  // 2. SALES & BILLING REPORTS
  // ==========================================================================
  static async getSalesReports(range: DateRange) {
    const orderDateFilter = this.dateFilter(range.startDate, range.endDate);

    // Valid orders
    const validOrders = await prisma.salesOrder.findMany({
      where: {
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.VOIDED] },
        ...(orderDateFilter ? { order_date: orderDateFilter } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        items: {
          include: {
            product: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { order_date: 'desc' },
    });

    // Voided / cancelled orders
    const voidedOrders = await prisma.salesOrder.findMany({
      where: {
        status: { in: [OrderStatus.CANCELLED, OrderStatus.VOIDED] },
        ...(orderDateFilter ? { order_date: orderDateFilter } : {}),
      },
      select: { id: true, order_number: true, grand_total: true, status: true, order_date: true, notes: true },
    });

    let readyMadeRevenue = 0;
    let stitchingRevenue = 0;
    let readyMadeUnits = 0;
    let stitchingUnits = 0;
    let totalTaxCollected = 0;
    let totalDiscount = 0;

    const categoryMap = new Map<string, { category: string; revenue: number; units: number }>();
    const productPerformanceMap = new Map<
      string,
      { id: string; name: string; sku: string; category: string; type: 'PRODUCT' | 'SERVICE'; units: number; revenue: number }
    >();

    // Daily trend aggregation
    const dailyMap = new Map<string, { date: string; sales: number; orders: number }>();

    for (const order of validOrders) {
      totalTaxCollected += Number(order.tax_total) || 0;
      totalDiscount += Number(order.discount_total) || 0;

      const dayKey = order.order_date.toISOString().split('T')[0];
      if (!dailyMap.has(dayKey)) {
        dailyMap.set(dayKey, { date: dayKey, sales: 0, orders: 0 });
      }
      const dayEntry = dailyMap.get(dayKey)!;
      dayEntry.sales += Number(order.grand_total) || 0;
      dayEntry.orders += 1;

      for (const item of order.items) {
        const isService = item.product.unit === 'SERVICE' || item.product.sku?.startsWith('SRV-');
        const qty = Number(item.quantity) || 0;
        const lineTotal = Number(item.total) || 0;
        const catName = item.product.category?.name || (isService ? 'Tailoring & Stitching' : 'Ready-made Silk');

        if (isService) {
          stitchingRevenue += lineTotal;
          stitchingUnits += qty;
        } else {
          readyMadeRevenue += lineTotal;
          readyMadeUnits += qty;
        }

        // Category breakdown
        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, { category: catName, revenue: 0, units: 0 });
        }
        const cEntry = categoryMap.get(catName)!;
        cEntry.revenue += lineTotal;
        cEntry.units += qty;

        // Best seller tracking
        const prodId = item.product_id;
        if (!productPerformanceMap.has(prodId)) {
          productPerformanceMap.set(prodId, {
            id: prodId,
            name: item.product.name,
            sku: item.product.sku,
            category: catName,
            type: isService ? 'SERVICE' : 'PRODUCT',
            units: 0,
            revenue: 0,
          });
        }
        const pEntry = productPerformanceMap.get(prodId)!;
        pEntry.units += qty;
        pEntry.revenue += lineTotal;
      }
    }

    const totalValidRevenue = validOrders.reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0);
    const averageOrderValue =
      validOrders.length > 0 ? Math.round((totalValidRevenue / validOrders.length) * 100) / 100 : 0;

    const salesTrend = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    const categoryBreakdown = Array.from(categoryMap.values())
      .map((c) => ({
        ...c,
        revenue: Math.round(c.revenue * 100) / 100,
        percentage: totalValidRevenue > 0 ? Math.round((c.revenue / totalValidRevenue) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const bestSellers = Array.from(productPerformanceMap.values())
      .map((p) => ({
        ...p,
        revenue: Math.round(p.revenue * 100) / 100,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const voidedSummary = {
      voided_count: voidedOrders.length,
      voided_value: Math.round(
        voidedOrders.reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0) * 100
      ) / 100,
      orders: voidedOrders,
    };

    const transactions = validOrders.slice(0, 50).map((o) => ({
      id: o.id,
      order_number: o.order_number,
      order_date: o.order_date.toISOString(),
      customer_id: o.customer_id,
      customer_name: o.customer_name,
      customer_phone: o.customer_phone,
      items_count: o.items.length,
      subtotal: Number(o.subtotal),
      tax_total: Number(o.tax_total),
      discount_total: Number(o.discount_total),
      grand_total: Number(o.grand_total),
      paid_amount: Number(o.paid_amount),
      pending_amount: Number(o.pending_amount),
      status: o.status,
      payment_status: o.payment_status,
      notes: o.notes,
    }));

    return {
      total_sales_revenue: Math.round(totalValidRevenue * 100) / 100,
      order_count: validOrders.length,
      average_order_value: averageOrderValue,
      ready_made_revenue: Math.round(readyMadeRevenue * 100) / 100,
      ready_made_units: readyMadeUnits,
      stitching_revenue: Math.round(stitchingRevenue * 100) / 100,
      stitching_units: stitchingUnits,
      tax_total_collected: Math.round(totalTaxCollected * 100) / 100,
      discount_total: Math.round(totalDiscount * 100) / 100,
      sales_trend: salesTrend,
      revenue_by_category: categoryBreakdown,
      best_sellers: bestSellers,
      voided_summary: voidedSummary,
      transactions,
    };
  }

  // ==========================================================================
  // 3. STITCHING & TAILORING REPORTS
  // ==========================================================================
  static async getStitchingReports(range: DateRange) {
    const orderDateFilter = this.dateFilter(range.startDate, range.endDate);

    // Query sales orders that contain custom stitching services or linked measurements
    const ordersWithServices = await prisma.salesOrder.findMany({
      where: {
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.VOIDED] },
        ...(orderDateFilter ? { order_date: orderDateFilter } : {}),
        items: {
          some: {
            OR: [
              { product: { unit: 'SERVICE' } },
              { product: { sku: { startsWith: 'SRV-' } } },
            ],
          },
        },
      },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        measurement_versions: {
          include: {
            profile: { include: { template: true } },
          },
        },
      },
      orderBy: { order_date: 'desc' },
    });

    let totalStitchingRevenue = 0;
    let totalServicesCount = 0;
    const garmentMap = new Map<string, { garment_type: string; count: number; revenue: number }>();
    const templateMap = new Map<string, { name: string; count: number; revenue: number }>();

    // Work Pipeline
    let pendingCount = 0;
    let inProgressCount = 0;
    let completedCount = 0;
    let overdueCount = 0;
    const overdueOrders: any[] = [];
    const now = new Date();

    const stitchingOrdersList = ordersWithServices.map((o) => {
      // Find service items in this order
      const serviceItems = o.items.filter(
        (it) => it.product.unit === 'SERVICE' || it.product.sku?.startsWith('SRV-')
      );

      const orderStitchingRevenue = serviceItems.reduce(
        (sum, it) => sum + (Number(it.total) || 0),
        0
      );
      totalStitchingRevenue += orderStitchingRevenue;

      let extractedGarmentType = 'Custom Garment';
      let expectedDeliveryDate: Date | null = null;

      // Extract delivery date and garment type from notes or measurement versions
      if (o.measurement_versions && o.measurement_versions.length > 0) {
        extractedGarmentType =
          o.measurement_versions[0].profile?.garment_type ||
          o.measurement_versions[0].profile?.template?.garment_type ||
          'Custom Garment';
      }

      if (o.notes) {
        const matchDelivery = o.notes.match(/Expected Delivery:\s*([0-9\-\/]+)/i);
        if (matchDelivery?.[1]) {
          const parsed = new Date(matchDelivery[1]);
          if (!isNaN(parsed.getTime())) expectedDeliveryDate = parsed;
        }
      }

      for (const s of serviceItems) {
        const qty = Number(s.quantity) || 0;
        const rev = Number(s.total) || 0;
        totalServicesCount += qty;

        // Garment breakdown
        const gName = extractedGarmentType;
        if (!garmentMap.has(gName)) {
          garmentMap.set(gName, { garment_type: gName, count: 0, revenue: 0 });
        }
        const gEntry = garmentMap.get(gName)!;
        gEntry.count += qty;
        gEntry.revenue += rev;

        // Template breakdown
        const tName = s.product.name;
        if (!templateMap.has(tName)) {
          templateMap.set(tName, { name: tName, count: 0, revenue: 0 });
        }
        const tEntry = templateMap.get(tName)!;
        tEntry.count += qty;
        tEntry.revenue += rev;
      }

      // Pipeline status (based on delivery status and delivery date)
      const isDelivered = o.status === OrderStatus.DELIVERED;
      const isOverdue = !isDelivered && expectedDeliveryDate && expectedDeliveryDate < now;

      if (isDelivered) {
        completedCount++;
      } else if (isOverdue) {
        overdueCount++;
        overdueOrders.push({
          id: o.id,
          order_number: o.order_number,
          customer_name: o.customer_name,
          customer_phone: o.customer_phone,
          garment_type: extractedGarmentType,
          order_date: o.order_date.toISOString(),
          expected_delivery: expectedDeliveryDate?.toISOString(),
          revenue: orderStitchingRevenue,
        });
      } else {
        inProgressCount++;
      }

      return {
        id: o.id,
        order_number: o.order_number,
        customer_name: o.customer_name,
        customer_phone: o.customer_phone,
        garment_type: extractedGarmentType,
        service_count: serviceItems.length,
        stitching_revenue: Math.round(orderStitchingRevenue * 100) / 100,
        order_date: o.order_date.toISOString(),
        expected_delivery: expectedDeliveryDate ? expectedDeliveryDate.toISOString() : null,
        status: isDelivered ? 'DELIVERED' : isOverdue ? 'OVERDUE' : 'IN_PROGRESS',
        has_measurements: Boolean(o.measurement_versions && o.measurement_versions.length > 0),
        measurement_profile_id: o.measurement_versions?.[0]?.profile_id || null,
        notes: o.notes,
      };
    });

    const garmentBreakdown = Array.from(garmentMap.values())
      .map((g) => ({ ...g, revenue: Math.round(g.revenue * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue);

    const templateBreakdown = Array.from(templateMap.values())
      .map((t) => ({ ...t, revenue: Math.round(t.revenue * 100) / 100 }))
      .sort((a, b) => b.revenue - a.revenue);

    return {
      total_stitching_revenue: Math.round(totalStitchingRevenue * 100) / 100,
      total_services_ordered: totalServicesCount,
      total_stitching_orders: ordersWithServices.length,
      pipeline: {
        pending_work: pendingCount,
        in_progress: inProgressCount,
        completed_delivered: completedCount,
        overdue_work: overdueCount,
      },
      garment_breakdown: garmentBreakdown,
      template_breakdown: templateBreakdown,
      overdue_orders: overdueOrders,
      orders: stitchingOrdersList,
    };
  }

  // ==========================================================================
  // 4. PAYMENTS & OUTSTANDING BALANCES
  // ==========================================================================
  static async getPaymentsReports(range: DateRange) {
    const paymentDateFilter = this.dateFilter(range.startDate, range.endDate);

    // Successful payments in period
    const payments = await prisma.payment.findMany({
      where: {
        status: 'SUCCESSFUL',
        ...(paymentDateFilter ? { payment_date: paymentDateFilter } : {}),
      },
      include: {
        customer: { select: { id: true, name: true, phone: true } },
        sales_order: { select: { id: true, order_number: true, grand_total: true } },
      },
      orderBy: { payment_date: 'desc' },
    });

    let totalCollected = 0;
    const modeMap = new Map<string, { mode: string; amount: number; count: number }>();
    const timelineMap = new Map<string, { date: string; amount: number; count: number }>();

    for (const p of payments) {
      const amt = Number(p.amount) || 0;
      totalCollected += amt;

      const mode = p.payment_mode || 'CASH';
      if (!modeMap.has(mode)) {
        modeMap.set(mode, { mode, amount: 0, count: 0 });
      }
      const mEntry = modeMap.get(mode)!;
      mEntry.amount += amt;
      mEntry.count += 1;

      const day = p.payment_date.toISOString().split('T')[0];
      if (!timelineMap.has(day)) {
        timelineMap.set(day, { date: day, amount: 0, count: 0 });
      }
      const tEntry = timelineMap.get(day)!;
      tEntry.amount += amt;
      tEntry.count += 1;
    }

    const byMode = Array.from(modeMap.values())
      .map((m) => ({
        ...m,
        amount: Math.round(m.amount * 100) / 100,
        percentage: totalCollected > 0 ? Math.round((m.amount / totalCollected) * 1000) / 10 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const collectionTrend = Array.from(timelineMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // Outstanding customer balances (current state)
    const unpaidOrders = await prisma.salesOrder.findMany({
      where: {
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.VOIDED] },
        pending_amount: { gt: 0 },
      },
      include: {
        customer: true,
      },
      orderBy: { order_date: 'asc' },
    });

    const customerOutstandingMap = new Map<
      string,
      {
        customer_id: string;
        customer_name: string;
        customer_phone?: string | null;
        total_outstanding: number;
        orders_count: number;
        oldest_order_date: string;
      }
    >();

    let totalOutstandingReceivables = 0;
    for (const o of unpaidOrders) {
      const pending = Number(o.pending_amount) || 0;
      totalOutstandingReceivables += pending;

      const cid = o.customer_id || `walkin-${o.customer_name}`;
      if (!customerOutstandingMap.has(cid)) {
        customerOutstandingMap.set(cid, {
          customer_id: cid,
          customer_name: o.customer_name,
          customer_phone: o.customer_phone,
          total_outstanding: pending,
          orders_count: 1,
          oldest_order_date: o.order_date.toISOString(),
        });
      } else {
        const cEntry = customerOutstandingMap.get(cid)!;
        cEntry.total_outstanding += pending;
        cEntry.orders_count += 1;
      }
    }

    const outstandingByCustomer = Array.from(customerOutstandingMap.values())
      .map((c) => ({
        ...c,
        total_outstanding: Math.round(c.total_outstanding * 100) / 100,
      }))
      .sort((a, b) => b.total_outstanding - a.total_outstanding);

    return {
      total_collections: Math.round(totalCollected * 100) / 100,
      payments_count: payments.length,
      by_payment_mode: byMode,
      collection_trend: collectionTrend,
      total_outstanding_receivables: Math.round(totalOutstandingReceivables * 100) / 100,
      unpaid_orders_count: unpaidOrders.length,
      outstanding_by_customer: outstandingByCustomer,
      recent_payments: payments.slice(0, 50).map((p) => ({
        id: p.id,
        payment_number: p.payment_number,
        payment_date: p.payment_date.toISOString(),
        amount: Number(p.amount),
        payment_mode: p.payment_mode,
        reference_number: p.reference_number,
        customer_name: p.customer?.name || 'Walk-in Client',
        order_number: p.sales_order?.order_number || 'N/A',
        notes: p.notes,
      })),
    };
  }

  // ==========================================================================
  // 5. PRODUCTS & INVENTORY
  // ==========================================================================
  static async getInventoryReports() {
    const products = await prisma.product.findMany({
      where: { is_active: true, unit: { not: 'SERVICE' } },
      include: {
        category: true,
        stock_balances: true,
      },
      orderBy: { name: 'asc' },
    });

    let totalStockUnits = 0;
    let valuationCost = 0;
    let valuationRetail = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const inventoryList = products.map((p) => {
      const totalQty = p.stock_balances.reduce(
        (sum, b) => sum + (Number(b.current_quantity) || 0),
        0
      );
      const purchasePrice = Number(p.purchase_price) || 0;
      const salePrice = Number(p.sale_price) || 0;
      const minStock = Number(p.min_stock_level) || 0;

      const itemCostVal = totalQty * purchasePrice;
      const itemRetailVal = totalQty * salePrice;

      totalStockUnits += totalQty;
      valuationCost += itemCostVal;
      valuationRetail += itemRetailVal;

      const isOutOfStock = totalQty <= 0;
      const isLowStock = !isOutOfStock && totalQty <= minStock;

      if (isOutOfStock) outOfStockCount++;
      if (isLowStock) lowStockCount++;

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        category: p.category?.name || 'Sarees & Weaves',
        unit: p.unit,
        current_quantity: totalQty,
        min_stock_level: minStock,
        purchase_price: purchasePrice,
        sale_price: salePrice,
        valuation_at_cost: Math.round(itemCostVal * 100) / 100,
        valuation_at_retail: Math.round(itemRetailVal * 100) / 100,
        potential_gross_margin:
          salePrice > 0 ? Math.round(((salePrice - purchasePrice) / salePrice) * 1000) / 10 : 0,
        status: isOutOfStock ? 'OUT_OF_STOCK' : isLowStock ? 'LOW_STOCK' : 'HEALTHY',
      };
    });

    // Recent stock movements
    const recentMovements = await prisma.stockMovement.findMany({
      take: 25,
      orderBy: { created_at: 'desc' },
      include: {
        product: { select: { name: true, sku: true, unit: true } },
        godown: { select: { name: true } },
      },
    });

    return {
      active_sku_count: products.length,
      total_stock_units: totalStockUnits,
      inventory_valuation_cost: Math.round(valuationCost * 100) / 100,
      inventory_valuation_retail: Math.round(valuationRetail * 100) / 100,
      unrealized_retail_potential: Math.round((valuationRetail - valuationCost) * 100) / 100,
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
      stock_health: {
        healthy: products.length - lowStockCount - outOfStockCount,
        low_stock: lowStockCount,
        out_of_stock: outOfStockCount,
      },
      items: inventoryList,
      recent_movements: recentMovements.map((m) => ({
        id: m.id,
        type: m.movement_type,
        product_name: m.product.name,
        sku: m.product.sku,
        quantity: Number(m.quantity),
        balance_after: Number(m.balance_after),
        godown_name: m.godown.name,
        created_at: m.created_at.toISOString(),
        notes: m.notes,
      })),
    };
  }

  // ==========================================================================
  // 6. PURCHASING & SUPPLIERS
  // ==========================================================================
  static async getPurchasingReports(range: DateRange) {
    const poDateFilter = this.dateFilter(range.startDate, range.endDate);

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        ...(poDateFilter ? { order_date: poDateFilter } : {}),
      },
      include: {
        supplier: true,
        items: { include: { product: true } },
      },
      orderBy: { order_date: 'desc' },
    });

    let receivedValue = 0;
    let orderedPendingValue = 0;
    let cancelledValue = 0;
    let receivedCount = 0;
    let orderedPendingCount = 0;
    let cancelledCount = 0;

    const supplierSpendMap = new Map<
      string,
      { supplier_id: string; name: string; phone?: string | null; total_received_spend: number; orders_count: number }
    >();

    for (const po of purchaseOrders) {
      const grandTotal = Number(po.grand_total) || 0;
      const sid = po.supplier_id || `direct-${po.supplier_name}`;

      if (po.status === 'RECEIVED') {
        receivedValue += grandTotal;
        receivedCount++;

        if (!supplierSpendMap.has(sid)) {
          supplierSpendMap.set(sid, {
            supplier_id: sid,
            name: po.supplier_name,
            phone: po.supplier_phone,
            total_received_spend: grandTotal,
            orders_count: 1,
          });
        } else {
          const sEntry = supplierSpendMap.get(sid)!;
          sEntry.total_received_spend += grandTotal;
          sEntry.orders_count += 1;
        }
      } else if (po.status === 'CANCELLED') {
        cancelledValue += grandTotal;
        cancelledCount++;
      } else {
        orderedPendingValue += grandTotal;
        orderedPendingCount++;
      }
    }

    const topSuppliers = Array.from(supplierSpendMap.values())
      .map((s) => ({
        ...s,
        total_received_spend: Math.round(s.total_received_spend * 100) / 100,
      }))
      .sort((a, b) => b.total_received_spend - a.total_received_spend);

    return {
      total_orders_count: purchaseOrders.length,
      received_value: Math.round(receivedValue * 100) / 100,
      received_count: receivedCount,
      open_ordered_value: Math.round(orderedPendingValue * 100) / 100,
      open_ordered_count: orderedPendingCount,
      cancelled_value: Math.round(cancelledValue * 100) / 100,
      cancelled_count: cancelledCount,
      top_suppliers: topSuppliers,
      purchase_orders: purchaseOrders.slice(0, 50).map((po) => ({
        id: po.id,
        po_number: po.po_number,
        supplier_name: po.supplier_name,
        order_date: po.order_date.toISOString(),
        expected_date: po.expected_date ? po.expected_date.toISOString() : null,
        status: po.status,
        subtotal: Number(po.subtotal),
        tax_total: Number(po.tax_total),
        grand_total: Number(po.grand_total),
        items_count: po.items.length,
        items_summary: po.items.map((it) => `${it.product.name} (x${it.quantity})`).join(', '),
      })),
    };
  }

  // ==========================================================================
  // 7. SUPPLIES & EXPENSES
  // ==========================================================================
  static async getSuppliesExpensesReports(range: DateRange) {
    const dateFilter = this.dateFilter(range.startDate, range.endDate);

    // Consumable inventory snapshot
    const activeSupplies = await prisma.supplyItem.findMany({
      where: { is_archived: false },
    });

    let currentValuation = 0;
    let lowStockCount = 0;
    for (const item of activeSupplies) {
      const qty = Number(item.current_quantity) || 0;
      const cost = Number(item.unit_cost) || 0;
      const minStock = Number(item.min_stock_level) || 0;
      currentValuation += qty * cost;
      if (qty <= minStock) lowStockCount++;
    }

    // Purchases in period
    const supplyPurchases = await prisma.supplyPurchase.findMany({
      where: {
        status: 'RECEIVED',
        ...(dateFilter ? { purchase_date: dateFilter } : {}),
      },
      include: { items: { include: { supply: true } } },
    });

    let suppliesPurchasedAmount = 0;
    for (const p of supplyPurchases) {
      suppliesPurchasedAmount += Number(p.grand_total) || 0;
    }

    // Outstanding supplier payables for supplies
    const unpaidPurchases = await prisma.supplyPurchase.findMany({
      where: {
        status: 'RECEIVED',
        payment_status: { in: ['PENDING', 'PARTIAL'] },
      },
      select: { balance_amount: true },
    });
    const outstandingSupplierDue = unpaidPurchases.reduce(
      (sum, p) => sum + (Number(p.balance_amount) || 0),
      0
    );

    // Operating expenses in period
    const activeExpenses = await prisma.operatingExpense.findMany({
      where: {
        status: 'ACTIVE',
        ...(dateFilter ? { expense_date: dateFilter } : {}),
      },
      orderBy: { expense_date: 'desc' },
    });

    let operatingExpensesTotal = 0;
    const catMap = new Map<string, { category: string; amount: number; count: number }>();
    const monthTrendMap = new Map<string, { month: string; amount: number }>();

    for (const exp of activeExpenses) {
      const amt = Number(exp.amount) || 0;
      operatingExpensesTotal += amt;

      const cat = exp.category || 'Other Operating Expenses';
      if (!catMap.has(cat)) {
        catMap.set(cat, { category: cat, amount: 0, count: 0 });
      }
      const cEntry = catMap.get(cat)!;
      cEntry.amount += amt;
      cEntry.count += 1;

      const monthKey = exp.expense_date.toISOString().substring(0, 7); // YYYY-MM
      if (!monthTrendMap.has(monthKey)) {
        monthTrendMap.set(monthKey, { month: monthKey, amount: 0 });
      }
      monthTrendMap.get(monthKey)!.amount += amt;
    }

    const expensesByCategory = Array.from(catMap.values())
      .map((c) => ({
        ...c,
        amount: Math.round(c.amount * 100) / 100,
        percentage:
          operatingExpensesTotal > 0
            ? Math.round((c.amount / operatingExpensesTotal) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const expenseTrend = Array.from(monthTrendMap.values())
      .map((m) => ({ ...m, amount: Math.round(m.amount * 100) / 100 }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Consumptions in period
    const consumptionMovements = await prisma.supplyMovement.findMany({
      where: {
        movement_type: SupplyMovementType.CONSUMPTION,
        ...(dateFilter ? { created_at: dateFilter } : {}),
      },
      include: { supply: true },
    });

    let consumedUnits = 0;
    let consumedEstValue = 0;
    let stitchingLinkedCount = 0;
    for (const m of consumptionMovements) {
      const q = Math.abs(Number(m.quantity)) || 0;
      const c = Number(m.unit_cost) || Number(m.supply?.unit_cost) || 0;
      consumedUnits += q;
      consumedEstValue += q * c;
      if (m.stitching_order_number) stitchingLinkedCount++;
    }

    return {
      current_consumables_stock_valuation: Math.round(currentValuation * 100) / 100,
      total_active_supplies: activeSupplies.length,
      low_stock_supplies_count: lowStockCount,
      supplies_purchased_in_period: Math.round(suppliesPurchasedAmount * 100) / 100,
      supplies_purchases_count: supplyPurchases.length,
      outstanding_supplier_payables: Math.round(outstandingSupplierDue * 100) / 100,
      operating_expenses_total: Math.round(operatingExpensesTotal * 100) / 100,
      expenses_by_category: expensesByCategory,
      monthly_expense_trend: expenseTrend,
      consumed_units_in_period: consumedUnits,
      consumed_estimated_value: Math.round(consumedEstValue * 100) / 100,
      stitching_linked_consumptions_count: stitchingLinkedCount,
      recent_expenses: activeExpenses.slice(0, 25).map((e) => ({
        id: e.id,
        expense_number: e.expense_number,
        title: e.title,
        category: e.category,
        amount: Number(e.amount),
        expense_date: e.expense_date.toISOString(),
        payment_method: e.payment_method,
        payee_name: e.payee_name,
        reference_number: e.reference_number,
      })),
    };
  }

  // ==========================================================================
  // 8. CUSTOMER INSIGHTS
  // ==========================================================================
  static async getCustomerReports(range: DateRange) {
    const orderDateFilter = this.dateFilter(range.startDate, range.endDate);

    const totalCustomersCount = await prisma.customer.count();
    const activeCustomersCount = await prisma.customer.count({ where: { is_archived: false } });
    const archivedCustomersCount = totalCustomersCount - activeCustomersCount;

    // Valid orders in period
    const periodOrders = await prisma.salesOrder.findMany({
      where: {
        status: { notIn: [OrderStatus.CANCELLED, OrderStatus.VOIDED] },
        ...(orderDateFilter ? { order_date: orderDateFilter } : {}),
      },
      include: {
        customer: true,
      },
    });

    const customerPerformanceMap = new Map<
      string,
      {
        id: string;
        name: string;
        phone?: string | null;
        city?: string | null;
        orders_count: number;
        total_spend: number;
        total_paid: number;
        pending_balance: number;
        is_archived: boolean;
      }
    >();

    for (const order of periodOrders) {
      const cid = order.customer_id || `walkin-${order.customer_name}`;
      const grand = Number(order.grand_total) || 0;
      const paid = Number(order.paid_amount) || 0;
      const pending = Number(order.pending_amount) || 0;

      if (!customerPerformanceMap.has(cid)) {
        customerPerformanceMap.set(cid, {
          id: cid,
          name: order.customer?.name || order.customer_name,
          phone: order.customer?.phone || order.customer_phone,
          city: order.customer?.city,
          orders_count: 1,
          total_spend: grand,
          total_paid: paid,
          pending_balance: pending,
          is_archived: Boolean(order.customer?.is_archived),
        });
      } else {
        const cEntry = customerPerformanceMap.get(cid)!;
        cEntry.orders_count += 1;
        cEntry.total_spend += grand;
        cEntry.total_paid += paid;
        cEntry.pending_balance += pending;
      }
    }

    const topCustomers = Array.from(customerPerformanceMap.values())
      .map((c) => ({
        ...c,
        total_spend: Math.round(c.total_spend * 100) / 100,
        total_paid: Math.round(c.total_paid * 100) / 100,
        pending_balance: Math.round(c.pending_balance * 100) / 100,
      }))
      .sort((a, b) => b.total_spend - a.total_spend);

    // New vs Repeat customers in period
    let newCustomersInPeriod = 0;
    if (range.startDate || range.endDate) {
      newCustomersInPeriod = await prisma.customer.count({
        where: {
          created_at: this.dateFilter(range.startDate, range.endDate),
        },
      });
    }

    return {
      total_registered_customers: totalCustomersCount,
      active_customers_count: activeCustomersCount,
      archived_customers_count: archivedCustomersCount,
      purchasing_customers_in_period: customerPerformanceMap.size,
      new_customers_in_period: newCustomersInPeriod,
      top_customers: topCustomers.slice(0, 20),
    };
  }

  // ==========================================================================
  // UNIFIED COMPREHENSIVE DASHBOARD
  // ==========================================================================
  static async getComprehensiveDashboard(period?: string, customStart?: string, customEnd?: string) {
    const { period: resolvedPeriod, startDate, endDate } = this.parsePeriod(
      period,
      customStart,
      customEnd
    );
    const range: DateRange = { startDate, endDate };

    const [
      overview,
      sales,
      stitching,
      payments,
      inventory,
      purchasing,
      suppliesExpenses,
      customers,
    ] = await Promise.all([
      this.getBusinessOverview(range),
      this.getSalesReports(range),
      this.getStitchingReports(range),
      this.getPaymentsReports(range),
      this.getInventoryReports(),
      this.getPurchasingReports(range),
      this.getSuppliesExpensesReports(range),
      this.getCustomerReports(range),
    ]);

    return {
      period: resolvedPeriod,
      date_range: {
        start: startDate ? startDate.toISOString() : null,
        end: endDate ? endDate.toISOString() : null,
      },
      overview,
      sales,
      stitching,
      payments,
      inventory,
      purchasing,
      supplies_expenses: suppliesExpenses,
      customers,
    };
  }
}
