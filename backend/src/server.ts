import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';

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

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Request logger for local development
if (process.env.NODE_ENV === 'development') {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Yaazhi Boutique & Atelier Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
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

// Central error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
  });
});

const server = app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`✨ Yaazhi Boutique Backend API running on http://localhost:${PORT}`);
  console.log(`✨ Network access enabled on 0.0.0.0:${PORT}`);
  console.log(`✨ Database: PostgreSQL (Port 5436)`);
});

export { app, server };
