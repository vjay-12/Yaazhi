import { Router } from 'express';
import { prisma } from '../db.js';
import { OrderStatus } from '@prisma/client';

const router = Router();

// GET /api/reports/dashboard - live aggregated statistics calculated from database
router.get('/dashboard', async (_req, res): Promise<void> => {
  try {
    const [
      totalProductsCount,
      totalOrdersCount,
      totalCustomersCount,
      totalVendorsCount,
      stockBalances,
      salesOrders,
      purchaseOrders,
      recentMovements,
    ] = await Promise.all([
      prisma.product.count({ where: { is_active: true } }),
      prisma.salesOrder.count(),
      prisma.customer.count(),
      prisma.supplier.count({ where: { is_active: true } }),
      prisma.stockBalance.findMany({
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              purchase_price: true,
              sale_price: true,
              min_stock_level: true,
            },
          },
          godown: { select: { id: true, name: true } },
        },
      }),
      prisma.salesOrder.findMany({
        where: { status: OrderStatus.DELIVERED },
        include: { items: { include: { product: true } } },
      }),
      prisma.purchaseOrder.findMany({
        where: { status: 'RECEIVED' },
      }),
      prisma.stockMovement.findMany({
        take: 6,
        orderBy: { created_at: 'desc' },
        include: { product: true, godown: true },
      }),
    ]);

    // Calculate inventory units, valuation at cost and retail
    let totalStockUnits = 0;
    let valuationCost = 0;
    let valuationRetail = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    // Aggregate by product across godowns
    const productStockMap = new Map<string, { product: any; totalQty: number }>();

    for (const b of stockBalances) {
      const qty = Number(b.current_quantity);
      const cost = Number(b.avg_cost || b.product.purchase_price || 0);
      const retail = Number(b.product.sale_price || 0);

      totalStockUnits += qty;
      valuationCost += qty * cost;
      valuationRetail += qty * retail;

      if (!productStockMap.has(b.product_id)) {
        productStockMap.set(b.product_id, { product: b.product, totalQty: qty });
      } else {
        productStockMap.get(b.product_id)!.totalQty += qty;
      }
    }

    for (const [, item] of productStockMap) {
      if (item.totalQty <= 0) {
        outOfStockCount++;
      } else if (item.totalQty <= Number(item.product.min_stock_level)) {
        lowStockCount++;
      }
    }

    // Calculate total sales revenue
    const totalSalesRevenue = salesOrders.reduce(
      (sum, o) => sum + Number(o.grand_total),
      0
    );

    // Calculate total procurement spend
    const totalPurchasesSpend = purchaseOrders.reduce(
      (sum, p) => sum + Number(p.grand_total),
      0
    );

    // Calculate top selling weaves / products
    const productSalesMap = new Map<string, { name: string; sku: string; units: number; revenue: number }>();
    for (const order of salesOrders) {
      for (const item of order.items) {
        const pid = item.product_id;
        const qty = Number(item.quantity);
        const rev = Number(item.total);
        if (!productSalesMap.has(pid)) {
          productSalesMap.set(pid, {
            name: item.product.name,
            sku: item.product.sku,
            units: qty,
            revenue: rev,
          });
        } else {
          const entry = productSalesMap.get(pid)!;
          entry.units += qty;
          entry.revenue += rev;
        }
      }
    }

    const topProducts = Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    res.json({
      summary: {
        totalProducts: totalProductsCount,
        totalOrders: totalOrdersCount,
        totalCustomers: totalCustomersCount,
        totalVendors: totalVendorsCount,
        totalStockUnits,
        valuationCost: Math.round(valuationCost),
        valuationRetail: Math.round(valuationRetail),
        totalSalesRevenue: Math.round(totalSalesRevenue),
        totalPurchasesSpend: Math.round(totalPurchasesSpend),
        lowStockCount,
        outOfStockCount,
      },
      topProducts,
      recentMovements: recentMovements.map((m) => ({
        id: m.id,
        type: m.movement_type,
        productName: m.product.name,
        sku: m.product.sku,
        godownName: m.godown.name,
        quantity: Number(m.quantity),
        balanceAfter: Number(m.balance_after),
        createdAt: m.created_at,
        notes: m.notes,
      })),
    });
  } catch (err: any) {
    console.error('Reports calculation error:', err);
    res.status(500).json({ error: 'Failed to generate live reports' });
  }
});

export default router;
