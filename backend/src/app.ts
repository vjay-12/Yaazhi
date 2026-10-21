import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieSession from 'cookie-session';

import { prisma } from './db.js';
import productsRouter from './routes/products.js';
import customersRouter from './routes/customers.js';
import suppliersRouter from './routes/suppliers.js';
import purchaseOrdersRouter from './routes/purchaseOrders.js';
import salesOrdersRouter from './routes/salesOrders.js';
import billingRouter from './routes/billing.js';
import ledgerRouter from './routes/ledger.js';
import adjustmentsRouter from './routes/adjustments.js';
import reportsRouter from './routes/reports.js';
import godownsRouter from './routes/godowns.js';
import settingsRouter from './routes/settings.js';
import measurementTemplatesRouter from './routes/measurementTemplates.js';
import stitchingTemplatesRouter from './routes/stitchingTemplates.js';
import suppliesRouter from './routes/supplies.js';
import supplyPurchasesRouter from './routes/supplyPurchases.js';
import operatingExpensesRouter from './routes/operatingExpenses.js';
import expensesSuppliesReportsRouter from './routes/expensesSuppliesReports.js';

const isProduction = process.env.NODE_ENV === 'production';

// Fail fast in production if SESSION_SECRET is missing
if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('FATAL: SESSION_SECRET environment variable is required in production.');
}

const app = express();

// Trust proxy for Vercel and reverse proxies
app.set('trust proxy', 1);

// Stateless signed cookie session
app.use(
  cookieSession({
    name: 'yaazhi_session',
    keys: [process.env.SESSION_SECRET || 'yaazhi_boutique_dev_session_secret_2026_secure'],
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  })
);

// CORS: Permissive only for local dev (same-origin on Vercel)
if (!isProduction) {
  app.use(cors({ origin: true, credentials: true }));
}

app.use(express.json());

// Request logger for local development
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check with DB query
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    res.json({
      ok: true,
      db: true,
      app: 'Yaazhi Boutique & Atelier Backend',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error('Health check DB connection error:', err?.message || err);
    res.status(503).json({
      ok: false,
      db: false,
      error: 'Database connection failed',
      timestamp: new Date().toISOString(),
    });
  }
});

// Routes
app.use('/api/products', productsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/purchase-orders', purchaseOrdersRouter);
app.use('/api/sales-orders', salesOrdersRouter);
app.use('/api/billing', billingRouter);
app.use('/api/movements', ledgerRouter);
app.use('/api/ledger', ledgerRouter);
app.use('/api/adjustments', adjustmentsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/godowns', godownsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/measurement-templates', measurementTemplatesRouter);
app.use('/api/stitching-templates', stitchingTemplatesRouter);
app.use('/api/supplies', suppliesRouter);
app.use('/api/supply-purchases', supplyPurchasesRouter);
app.use('/api/operating-expenses', operatingExpensesRouter);
app.use('/api/expenses', operatingExpensesRouter);
app.use('/api/expenses-supplies-reports', expensesSuppliesReportsRouter);

// Central error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

export { app };
export default app;
