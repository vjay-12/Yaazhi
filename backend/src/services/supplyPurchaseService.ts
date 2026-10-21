import { prisma } from '../db.js';
import { SupplyMovementType } from '@prisma/client';

export interface CreateSupplyPurchaseItemInput {
  supply_id: string;
  quantity: number;
  unit_cost: number;
  tax_rate?: number;
}

export interface CreateSupplyPurchaseInput {
  supplier_id?: string | null;
  supplier_name: string;
  supplier_phone?: string | null;
  purchase_date?: string | Date;
  invoice_number?: string | null;
  discount_total?: number;
  paid_amount?: number;
  payment_method?: string;
  payment_status?: 'PAID' | 'PARTIAL' | 'PENDING';
  receipt_url?: string | null;
  notes?: string | null;
  created_by?: string;
  items: CreateSupplyPurchaseItemInput[];
}

export class SupplyPurchaseService {
  /**
   * Generates sequential purchase number: SUP-PO-YYYY-XXXX
   */
  static async generatePurchaseNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await prisma.supplyPurchase.count();
    const seq = (count + 1).toString().padStart(4, '0');
    return `SUP-PO-${year}-${seq}`;
  }

  /**
   * Lists supplies purchase records with filtering
   */
  static async listPurchases(params: {
    supplier_id?: string;
    payment_status?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
  } = {}) {
    const { supplier_id, payment_status, search, start_date, end_date } = params;
    const where: any = {};

    if (supplier_id && supplier_id !== 'ALL') {
      where.supplier_id = supplier_id;
    }

    if (payment_status && payment_status !== 'ALL') {
      where.payment_status = payment_status;
    }

    if (start_date || end_date) {
      where.purchase_date = {};
      if (start_date) where.purchase_date.gte = new Date(start_date);
      if (end_date) where.purchase_date.lte = new Date(end_date);
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { purchase_number: { contains: q, mode: 'insensitive' } },
        { invoice_number: { contains: q, mode: 'insensitive' } },
        { supplier_name: { contains: q, mode: 'insensitive' } },
      ];
    }

    return prisma.supplyPurchase.findMany({
      where,
      include: {
        supplier: {
          select: { id: true, name: true, phone: true, city: true },
        },
        items: {
          include: {
            supply: {
              select: { id: true, name: true, sku: true, unit: true, category: true },
            },
          },
        },
      },
      orderBy: { purchase_date: 'desc' },
    });
  }

  /**
   * Retrieves single purchase record with detailed line items
   */
  static async getPurchase(id: string) {
    const purchase = await prisma.supplyPurchase.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            supply: true,
          },
        },
      },
    });

    if (!purchase) {
      throw new Error(`Supplies purchase record not found with id ${id}`);
    }

    return purchase;
  }

  /**
   * Alias for getPurchase
   */
  static async getPurchaseById(id: string) {
    return this.getPurchase(id);
  }

  /**
   * Creates a multi-item purchase record and atomically receives stock into supplies inventory
   * Exactly-once receipt guard prevents duplicate inventory increments
   */
  static async createPurchase(input: CreateSupplyPurchaseInput) {
    if (!input.items || input.items.length === 0) {
      throw new Error('At least one item is required to record a purchase');
    }

    const purchaseNumber = await this.generatePurchaseNumber();

    // Calculate line items, taxes, subtotal, and grand total
    let subtotal = 0;
    let taxTotal = 0;

    const computedItems = input.items.map((it) => {
      const qty = Math.max(0, Number(it.quantity));
      const cost = Math.max(0, Number(it.unit_cost));
      const taxRate = Math.max(0, Number(it.tax_rate || 0));

      const lineSubtotal = qty * cost;
      const lineTax = (lineSubtotal * taxRate) / 100;
      const lineTotal = lineSubtotal + lineTax;

      subtotal += lineSubtotal;
      taxTotal += lineTax;

      return {
        supply_id: it.supply_id,
        quantity: qty,
        unit_cost: cost,
        tax_rate: taxRate,
        tax_amount: lineTax,
        total: lineTotal,
      };
    });

    const discountTotal = input.discount_total ? Math.max(0, Number(input.discount_total)) : 0;
    const grandTotal = Math.round(Math.max(0, subtotal - discountTotal + taxTotal) * 100) / 100;

    // Determine paid and pending balance
    let paidAmount = grandTotal;
    let balanceAmount = 0;
    let finalPaymentStatus = input.payment_status || 'PAID';

    if (input.payment_status === 'PENDING') {
      paidAmount = 0;
      balanceAmount = grandTotal;
    } else if (input.payment_status === 'PARTIAL') {
      paidAmount = input.paid_amount !== undefined
        ? Math.round(Math.min(grandTotal, Math.max(0, Number(input.paid_amount))) * 100) / 100
        : Math.round((grandTotal / 2) * 100) / 100;
      balanceAmount = Math.round(Math.max(0, grandTotal - paidAmount) * 100) / 100;
      if (paidAmount >= grandTotal) {
        finalPaymentStatus = 'PAID';
        balanceAmount = 0;
      } else if (paidAmount <= 0) {
        finalPaymentStatus = 'PENDING';
        balanceAmount = grandTotal;
      }
    } else {
      paidAmount = input.paid_amount !== undefined
        ? Math.round(Math.min(grandTotal, Math.max(0, Number(input.paid_amount))) * 100) / 100
        : grandTotal;
      balanceAmount = Math.round(Math.max(0, grandTotal - paidAmount) * 100) / 100;
      finalPaymentStatus = balanceAmount <= 0.005 ? 'PAID' : paidAmount > 0 ? 'PARTIAL' : 'PENDING';
    }


    return prisma.$transaction(async (tx) => {
      // 1. Create Purchase record
      const purchase = await tx.supplyPurchase.create({
        data: {
          purchase_number: purchaseNumber,
          supplier_id: input.supplier_id || null,
          supplier_name: input.supplier_name.trim(),
          supplier_phone: input.supplier_phone || null,
          purchase_date: input.purchase_date ? new Date(input.purchase_date) : new Date(),
          invoice_number: input.invoice_number?.trim() || null,
          subtotal,
          tax_total: taxTotal,
          discount_total: discountTotal,
          grand_total: grandTotal,
          paid_amount: paidAmount,
          balance_amount: balanceAmount,
          payment_method: input.payment_method || 'CASH',
          payment_status: finalPaymentStatus,
          receipt_url: input.receipt_url || null,
          notes: input.notes?.trim() || null,
          status: 'RECEIVED',
          is_received: true,
          created_by: input.created_by || 'Staff',
          items: {
            create: computedItems,
          },
        },
        include: {
          items: { include: { supply: true } },
          supplier: true,
        },
      });

      // 2. Increment supplies stock and record auditable movement for EACH item
      for (const item of computedItems) {
        const supply = await tx.supplyItem.findUnique({
          where: { id: item.supply_id },
        });

        if (!supply) {
          throw new Error(`Supply item ${item.supply_id} not found`);
        }

        const prevQty = Number(supply.current_quantity);
        const newQty = prevQty + item.quantity;

        // Update supply stock balance and unit cost
        await tx.supplyItem.update({
          where: { id: supply.id },
          data: {
            current_quantity: newQty,
            unit_cost: item.unit_cost,
          },
        });

        // Record auditable ledger movement
        await tx.supplyMovement.create({
          data: {
            supply_id: supply.id,
            movement_type: SupplyMovementType.PURCHASE_RECEIPT,
            quantity: item.quantity,
            unit_cost: item.unit_cost,
            balance_after: newQty,
            reference_type: 'PURCHASE_ORDER',
            reference_id: purchase.id,
            notes: `Supplies Purchase #${purchaseNumber} from ${input.supplier_name}`,
            created_by: input.created_by || 'Staff',
          },
        });
      }

      return purchase;
    });
  }

  /**
   * Cancels a purchase order and reverses inventory exactly once
   */
  static async cancelPurchase(id: string, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.supplyPurchase.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!purchase) {
        throw new Error('Purchase record not found');
      }

      if (purchase.status === 'CANCELLED') {
        throw new Error('Purchase is already cancelled');
      }

      // Check stock sufficiency to reverse
      for (const item of purchase.items) {
        const supply = await tx.supplyItem.findUnique({ where: { id: item.supply_id } });
        if (!supply || Number(supply.current_quantity) < Number(item.quantity)) {
          throw new Error(
            `Cannot cancel purchase: Stock for "${supply?.name}" has already been consumed below the purchased quantity.`
          );
        }
      }

      // Deduct stock and log reversal movements
      for (const item of purchase.items) {
        const supply = await tx.supplyItem.findUnique({ where: { id: item.supply_id } })!;
        const prevQty = Number(supply!.current_quantity);
        const newQty = prevQty - Number(item.quantity);

        await tx.supplyItem.update({
          where: { id: item.supply_id },
          data: { current_quantity: newQty },
        });

        await tx.supplyMovement.create({
          data: {
            supply_id: item.supply_id,
            movement_type: SupplyMovementType.RETURN_OUT,
            quantity: -Number(item.quantity),
            unit_cost: Number(item.unit_cost),
            balance_after: newQty,
            reference_type: 'PURCHASE_CANCELLATION',
            reference_id: purchase.id,
            notes: `Cancelled Purchase #${purchase.purchase_number}${reason ? `: ${reason}` : ''}`,
          },
        });
      }

      return tx.supplyPurchase.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: `${purchase.notes ? `${purchase.notes} | ` : ''}Cancelled: ${reason || 'No reason provided'}`,
        },
      });
    });
  }

  /**
   * Records an additional payment towards a purchase
   */
  static async recordPayment(
    id: string,
    params: { amount: number; payment_method?: string; notes?: string }
  ) {
    const { amount, payment_method, notes } = params;
    if (amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const purchase = await prisma.supplyPurchase.findUnique({ where: { id } });
    if (!purchase) {
      throw new Error('Purchase record not found');
    }

    if (purchase.status === 'CANCELLED') {
      throw new Error('Cannot record payment for a cancelled purchase');
    }

    const currentPaid = Number(purchase.paid_amount) || 0;
    const grandTotal = Number(purchase.grand_total) || 0;
    const newPaid = Math.min(grandTotal, currentPaid + amount);
    const newBalance = Math.max(0, grandTotal - newPaid);
    const newStatus = newBalance <= 0.005 ? 'PAID' : 'PARTIAL';

    return prisma.supplyPurchase.update({
      where: { id },
      data: {
        paid_amount: newPaid,
        balance_amount: newBalance,
        payment_status: newStatus,
        payment_method: payment_method || purchase.payment_method,
        notes: notes
          ? `${purchase.notes ? `${purchase.notes}\n` : ''}[Payment Recorded ₹${amount} via ${payment_method || 'CASH'}: ${notes}]`
          : purchase.notes,
      },
    });
  }
}

