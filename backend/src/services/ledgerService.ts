import { Prisma, MovementType } from '@prisma/client';
import { prisma } from '../db.js';

export interface RecordMovementParams {
  product_id: string;
  godown_id: string;
  movement_type: MovementType;
  quantity: number; // signed delta: positive for IN/RECEIPT/ADD, negative for OUT/DELIVERY/REDUCE
  unit_cost: number;
  reference_type: string;
  reference_id: string;
  notes?: string;
  created_by?: string;
}

export class LedgerService {
  /**
   * Records a stock movement and updates both the Godown's StockBalance and the product's
   * total stock balance atomically in a database transaction.
   * Can be passed an existing transaction client `tx` or uses standard `prisma`.
   */
  static async recordMovement(
    params: RecordMovementParams,
    tx?: Prisma.TransactionClient
  ) {
    const execute = async (client: Prisma.TransactionClient) => {
      const {
        product_id,
        godown_id,
        movement_type,
        quantity,
        unit_cost,
        reference_type,
        reference_id,
        notes,
        created_by,
      } = params;

      // 1. Get current stock balance for (product, godown)
      let balance = await client.stockBalance.findUnique({
        where: {
          product_id_godown_id: {
            product_id,
            godown_id,
          },
        },
      });

      const prevGodownQty = balance ? Number(balance.current_quantity) : 0;
      const prevCost = balance ? Number(balance.avg_cost) : 0;
      const newGodownQty = prevGodownQty + quantity;

      if (newGodownQty < 0) {
        throw new Error(
          `Negative inventory is prohibited. Insufficient stock in location (current: ${prevGodownQty}, requested adjustment: ${quantity})`
        );
      }

      // 2. Compute total product stock across ALL godowns in the boutique
      const allBalances = await client.stockBalance.findMany({
        where: { product_id },
      });
      const prevTotalStock = allBalances.reduce(
        (sum, b) => sum + Number(b.current_quantity),
        0
      );
      const newTotalStock = prevTotalStock + quantity;

      if (newTotalStock < 0) {
        throw new Error(
          `Negative inventory is prohibited. Total product stock cannot drop below 0 (current total: ${prevTotalStock}, requested adjustment: ${quantity})`
        );
      }

      // Calculate weighted average cost if positive stock receipt into godown
      let newCost = prevCost;
      if (quantity > 0 && newGodownQty > 0) {
        newCost = (prevGodownQty * prevCost + quantity * unit_cost) / newGodownQty;
      }

      // 3. Upsert godown stock balance
      if (balance) {
        balance = await client.stockBalance.update({
          where: { id: balance.id },
          data: {
            current_quantity: newGodownQty,
            avg_cost: newCost,
          },
        });
      } else {
        balance = await client.stockBalance.create({
          data: {
            product_id,
            godown_id,
            current_quantity: newGodownQty,
            avg_cost: unit_cost,
          },
        });
      }

      // 4. Insert immutable stock movement record
      // balance_after reflects the product's authoritative total physical inventory immediately after this movement!
      const movement = await client.stockMovement.create({
        data: {
          movement_type,
          product_id,
          godown_id,
          quantity,
          unit_cost,
          balance_after: newTotalStock,
          reference_type,
          reference_id,
          notes,
          created_by,
        },
      });

      return { movement, balance, totalStock: newTotalStock };
    };

    if (tx) {
      return execute(tx);
    } else {
      return prisma.$transaction((t) => execute(t));
    }
  }

  /**
   * Retrieves the authoritative stock for a product across all locations and broken down by godown.
   */
  static async getProductStock(productId: string, tx?: Prisma.TransactionClient) {
    const client = tx || prisma;
    const balances = await client.stockBalance.findMany({
      where: { product_id: productId },
      include: { godown: true },
    });

    const totalStock = balances.reduce((sum, b) => sum + Number(b.current_quantity), 0);
    const locationStock: Record<string, number> = {};
    for (const b of balances) {
      locationStock[b.godown_id] = Number(b.current_quantity);
      if (b.godown?.code) {
        locationStock[b.godown.code] = Number(b.current_quantity);
      }
    }

    return { totalStock, locationStock, balances };
  }

  /**
   * Deterministically reconstructs chronological running balances for a product.
   * Updates each movement's `balance_after` to ensure mathematical continuity.
   */
  static async recalculateProductBalances(
    productId: string,
    tx?: Prisma.TransactionClient
  ) {
    const client = tx || prisma;

    const movements = await client.stockMovement.findMany({
      where: { product_id: productId },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    });

    let running = 0;
    const updatedMovements = [];

    for (const m of movements) {
      const qty = Number(m.quantity);
      running += qty;
      const currentBalAfter = Number(m.balance_after);

      if (currentBalAfter !== running) {
        const updated = await client.stockMovement.update({
          where: { id: m.id },
          data: { balance_after: running },
        });
        updatedMovements.push(updated);
      } else {
        updatedMovements.push(m);
      }
    }

    return {
      movements: updatedMovements,
      ledgerDerivedTotal: running,
    };
  }
}
