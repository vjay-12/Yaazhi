import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/godowns - list boutique showrooms / counters
router.get('/', async (_req, res): Promise<void> => {
  try {
    const godowns = await prisma.godown.findMany({
      where: { is_active: true },
      orderBy: { is_default: 'desc' },
      include: {
        stock_balances: {
          select: { current_quantity: true },
        },
      },
    });

    const result = godowns.map((g) => ({
      id: g.id,
      name: g.name,
      code: g.code,
      address: g.address,
      isDefault: g.is_default,
      totalUnits: g.stock_balances.reduce((s, b) => s + Number(b.current_quantity), 0),
    }));

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch showroom locations' });
  }
});

export default router;
