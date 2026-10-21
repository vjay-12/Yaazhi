import { Router } from 'express';
import type { Request, Response } from 'express';
import { ExpensesSuppliesReportService } from '../services/expensesSuppliesReportService.js';

const router = Router();

// GET /api/expenses-supplies-reports/summary
router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const { period, start_date, end_date } = req.query;
    const summary = await ExpensesSuppliesReportService.getSummary({
      period: period ? String(period) : 'this_month',
      start_date: start_date ? String(start_date) : undefined,
      end_date: end_date ? String(end_date) : undefined,
    });
    res.json({ success: true, data: summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
