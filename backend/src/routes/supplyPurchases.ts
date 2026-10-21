import { Router } from 'express';
import type { Request, Response } from 'express';
import { SupplyPurchaseService } from '../services/supplyPurchaseService.js';
import { createSupplyPurchaseSchema } from '../validators/schemas.js';

const router = Router();

// GET /api/supply-purchases - list purchase orders
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { supplier_id, payment_status, search, start_date, end_date } = req.query;
    const purchases = await SupplyPurchaseService.listPurchases({
      supplier_id: supplier_id ? String(supplier_id) : undefined,
      payment_status: payment_status ? String(payment_status) : undefined,
      search: search ? String(search) : undefined,
      start_date: start_date ? String(start_date) : undefined,
      end_date: end_date ? String(end_date) : undefined,
    });
    res.json({ success: true, data: purchases });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/supply-purchases/:id - get single purchase details
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const purchase = await SupplyPurchaseService.getPurchaseById(id);
    if (!purchase) {
      res.status(404).json({ success: false, error: 'Purchase record not found' });
      return;
    }
    res.json({ success: true, data: purchase });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/supply-purchases - record new supplies purchase
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = createSupplyPurchaseSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const created = await SupplyPurchaseService.createPurchase(parseResult.data);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/supply-purchases/:id/cancel - cancel purchase and reverse stock
router.post('/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const { reason } = req.body;
    const id = String(req.params.id);
    const cancelled = await SupplyPurchaseService.cancelPurchase(id, reason);
    res.json({ success: true, data: cancelled });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/supply-purchases/:id/payment - record payment
router.post('/:id/payment', async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, payment_method, notes } = req.body;
    if (!amount || Number(amount) <= 0) {
      res.status(400).json({ success: false, error: 'Valid payment amount is required' });
      return;
    }

    const id = String(req.params.id);
    const updated = await SupplyPurchaseService.recordPayment(id, {
      amount: Number(amount),
      payment_method,
      notes,
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});


export default router;
