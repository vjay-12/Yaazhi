import { Router } from 'express';
import type { Request, Response } from 'express';
import { ExpenseService } from '../services/expenseService.js';
import {
  createOperatingExpenseSchema,
  updateOperatingExpenseSchema,
  voidOperatingExpenseSchema,
} from '../validators/schemas.js';

const router = Router();

// GET /api/operating-expenses/categories - get default categories
router.get('/categories', (_req: Request, res: Response): void => {
  try {
    const categories = ExpenseService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/operating-expenses - list operating expenses
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, status, start_date, end_date, vendor_id, search } = req.query;
    const expenses = await ExpenseService.listExpenses({
      category: category ? String(category) : undefined,
      status: status ? (String(status) as any) : undefined,
      start_date: start_date ? String(start_date) : undefined,
      end_date: end_date ? String(end_date) : undefined,
      vendor_id: vendor_id ? String(vendor_id) : undefined,
      search: search ? String(search) : undefined,
    });
    res.json({ success: true, data: expenses });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/operating-expenses/:id - get single operating expense
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = String(req.params.id);
    const expense = await ExpenseService.getExpenseById(id);
    if (!expense) {
      res.status(404).json({ success: false, error: 'Operating expense not found' });
      return;
    }
    res.json({ success: true, data: expense });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/operating-expenses - create operating expense
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = createOperatingExpenseSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const created = await ExpenseService.createExpense(parseResult.data);
    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// PUT /api/operating-expenses/:id - update operating expense
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = updateOperatingExpenseSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const id = String(req.params.id);
    const updated = await ExpenseService.updateExpense(id, parseResult.data);
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// POST /api/operating-expenses/:id/void - void operating expense with audit reason
router.post('/:id/void', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = voidOperatingExpenseSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const id = String(req.params.id);
    const voidReason = parseResult.data.reason || parseResult.data.void_reason || 'Voided by staff';
    const voided = await ExpenseService.voidExpense(id, voidReason);
    res.json({ success: true, data: voided });
  } catch (error: any) {
    res.status(400).json({ success: false, error: error.message });
  }
});



export default router;
