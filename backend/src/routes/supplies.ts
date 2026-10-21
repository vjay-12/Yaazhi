import { Router } from 'express';
import type { Request, Response } from 'express';
import { SuppliesService } from '../services/suppliesService.js';
import {
  createSupplyItemSchema,
  updateSupplyItemSchema,
  recordSupplyConsumptionSchema,
  recordSupplyAdjustmentSchema,
} from '../validators/schemas.js';

const router = Router();

// GET /api/supplies/categories - get distinct categories
router.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await SuppliesService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/supplies/movements/log - movement audit trail
router.get('/movements/log', async (req: Request, res: Response): Promise<void> => {
  try {
    const { supply_id, movement_type, stitching_order_number, limit } = req.query;
    const movements = await SuppliesService.getMovements({
      supply_id: supply_id ? String(supply_id) : undefined,
      movement_type: movement_type ? (String(movement_type) as any) : undefined,
      stitching_order_number: stitching_order_number ? String(stitching_order_number) : undefined,
      limit: limit ? Number(limit) : 50,
    });
    res.json({ success: true, data: movements });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/supplies - list all supplies
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, status, low_stock_only, supplier_id } = req.query;
    const supplies = await SuppliesService.listSupplies({
      category: category ? String(category) : undefined,
      search: search ? String(search) : undefined,
      status: status ? (String(status) as any) : 'ACTIVE',
      low_stock_only: low_stock_only === 'true',
      supplier_id: supplier_id ? String(supplier_id) : undefined,
    });
    res.json({ success: true, data: supplies });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/supplies/:id - get single supply item
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const supply = await SuppliesService.getSupplyById(id);
    if (!supply) {
      res.status(404).json({ success: false, error: 'Supply item not found' });
      return;
    }
    res.json({ success: true, data: supply });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/supplies - create supply item
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = createSupplyItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const created = await SuppliesService.createSupply(parseResult.data);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/supplies/:id - update supply item
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = updateSupplyItemSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const id = String(req.params.id);
    const updated = await SuppliesService.updateSupply(id, parseResult.data);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/supplies/:id/archive - archive / unarchive
router.post('/:id/archive', async (req: Request, res: Response): Promise<void> => {
  try {
    const { is_archived } = req.body;
    const id = String(req.params.id);
    const archived = await SuppliesService.setArchiveStatus(
      id,
      typeof is_archived === 'boolean' ? is_archived : true
    );
    res.json({ success: true, data: archived });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});


// POST /api/supplies/consume - record stock consumption (optionally linked to stitching order)
router.post('/consume', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = recordSupplyConsumptionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await SuppliesService.recordConsumption(parseResult.data);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/supplies/adjust - manual stock reconciliation adjustment
router.post('/adjust', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = recordSupplyAdjustmentSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const result = await SuppliesService.recordAdjustment(parseResult.data);
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

export default router;
