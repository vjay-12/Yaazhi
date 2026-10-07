import { Router } from 'express';
import { prisma } from '../db.js';
import { stockAdjustmentSchema } from '../validators/schemas.js';
import { LedgerService } from '../services/ledgerService.js';
import { MovementType } from '@prisma/client';

const router = Router();

// POST /api/adjustments - Adjust stock count with audit reason
router.post('/', async (req, res): Promise<void> => {
  try {
    const rawBody = {
      ...req.body,
      product_id: req.body.product_id || req.body.productId,
      godown_id: req.body.godown_id || req.body.godownId || req.body.locationId,
      new_stock: Number(req.body.new_stock !== undefined ? req.body.new_stock : req.body.newStock),
    };

    const parsed = stockAdjustmentSchema.safeParse(rawBody);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues?.[0]?.message || (parsed.error as any).errors?.[0]?.message || 'Invalid adjustment data';
      res.status(400).json({ error: errorMsg });
      return;
    }

    const { product_id, godown_id, new_stock, reason, notes } = parsed.data;

    // Get current balance
    const balance = await prisma.stockBalance.findUnique({
      where: {
        product_id_godown_id: {
          product_id,
          godown_id,
        },
      },
      include: { product: true },
    });

    const currentQty = balance ? Number(balance.current_quantity) : 0;
    const diff = new_stock - currentQty;

    if (diff === 0) {
      res.json({ success: true, message: 'Stock already at requested quantity', currentStock: new_stock });
      return;
    }

    const movementType = diff > 0 ? MovementType.ADJUSTMENT_ADD : MovementType.ADJUSTMENT_REDUCE;
    const unitCost = balance?.product.purchase_price ? Number(balance.product.purchase_price) : 0;

    const adjYear = new Date().getFullYear();
    const count = await prisma.stockAdjustment.count();
    let nextAdjNum = count + 1;
    let adjNumber = `ADJ-${adjYear}-${String(nextAdjNum).padStart(4, '0')}`;
    while (await prisma.stockAdjustment.findUnique({ where: { adjustment_number: adjNumber } })) {
      nextAdjNum++;
      adjNumber = `ADJ-${adjYear}-${String(nextAdjNum).padStart(4, '0')}`;
    }

    // Execute adjustment inside transaction
    const result = await prisma.$transaction(async (tx) => {
      const adjustment = await tx.stockAdjustment.create({
        data: {
          adjustment_number: adjNumber,
          godown_id,
          reason,
          notes,
          created_by: 'Boutique Auditor',
          items: {
            create: [
              {
                product_id,
                system_qty: currentQty,
                counted_qty: new_stock,
                diff_qty: diff,
                unit_cost: unitCost,
              },
            ],
          },
        },
      });

      const { movement, balance: updatedBalance } = await LedgerService.recordMovement(
        {
          product_id,
          godown_id,
          movement_type: movementType,
          quantity: diff,
          unit_cost: unitCost,
          reference_type: 'STOCK_ADJUSTMENT',
          reference_id: adjNumber,
          notes: `Reason [${reason}]: ${notes || 'Manual audit count reconciliation'}`,
          created_by: 'Boutique Auditor',
        },
        tx
      );

      return { adjustment, movement, updatedBalance };
    });

    res.json({
      success: true,
      message: `Stock adjusted by ${diff > 0 ? '+' + diff : diff} units`,
      adjustmentNumber: result.adjustment.adjustment_number,
      newStock: Number(result.updatedBalance.current_quantity),
    });
  } catch (err: any) {
    console.error('Stock adjustment error:', err);
    res.status(400).json({ error: err.message || 'Failed to adjust stock' });
  }
});

export default router;
