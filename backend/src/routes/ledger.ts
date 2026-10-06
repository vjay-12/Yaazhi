import { Router } from 'express';
import { prisma } from '../db.js';
import { MovementType } from '@prisma/client';

const router = Router();

// GET /api/movements or /api/ledger - list stock audit movements with filters
router.get('/', async (req, res): Promise<void> => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const movementType = req.query.type ? String(req.query.type).trim() : undefined;
    const godownId = req.query.godownId ? String(req.query.godownId).trim() : undefined;

    const where: any = {};

    if (movementType && movementType !== 'ALL') {
      where.movement_type = movementType as MovementType;
    }

    if (godownId && godownId !== 'ALL') {
      where.godown_id = godownId;
    }

    if (search) {
      where.OR = [
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { reference_id: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
      ];
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: 100,
      include: {
        product: { select: { id: true, name: true, sku: true, craft: true, fabric: true } },
        godown: { select: { id: true, name: true, code: true } },
      },
    });

    const result = movements.map((m) => {
      // Map movement type to human readable UI type
      let type: 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER' = 'ADJUST';
      if (m.movement_type === MovementType.PURCHASE_RECEIPT || m.movement_type === MovementType.RETURN_IN) {
        type = 'IN';
      } else if (m.movement_type === MovementType.SALES_DELIVERY || m.movement_type === MovementType.RETURN_OUT) {
        type = 'OUT';
      }

      return {
        id: m.id,
        timestamp: m.created_at.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }),
        createdAt: m.created_at,
        type,
        movementType: m.movement_type,
        productId: m.product_id,
        productName: m.product.name,
        weave: m.product.craft || m.product.fabric || 'Pure Handloom',
        sku: m.product.sku,
        qtyChange: Number(m.quantity),
        balanceAfter: Number(m.balance_after),
        location: m.godown.name,
        locationCode: m.godown.code,
        reference: m.reference_id,
        referenceType: m.reference_type,
        notes: m.notes || '-',
        performedBy: m.created_by || 'Boutique Operator',
      };
    });

    res.json(result);
  } catch (err: any) {
    console.error('Fetch ledger movements error:', err);
    res.status(500).json({ error: 'Failed to fetch stock audit movements' });
  }
});

export default router;
