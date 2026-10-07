import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Receipt,
  ShoppingBag,
  Package,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
} from 'lucide-react';
import type { YaazhiProduct } from '../../types/product';
import { productService } from '../../services/productService';
import { salesOrderService, type SalesOrderData } from '../../services/salesOrderService';
import { OrderDetailModal } from '../commercial/OrderDetailModal';
import { CardSkeleton } from '../../components/common/LoadingState';
import type { NavTabId } from '../../components/layout/Sidebar';

interface OverviewPageProps {
  onNavigate: (tab: NavTabId) => void;
  onViewProductDetail: (product: YaazhiProduct) => void;
  onOpenAddProduct?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  onViewProductDetail,
}) => {
  const [products, setProducts] = useState<YaazhiProduct[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sales Trend chart type toggle: Line or Bar
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar');
  const [hoveredBar, setHoveredBar] = useState<{
    label: string;
    dateStr: string;
    fullDate: string;
    sales: number;
    orders: number;
  } | null>(null);

  // Selected Order for detail modal
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderData | null>(null);

  // Load canonical platform records
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [prods, orders] = await Promise.all([
        productService.list(),
        salesOrderService.list(),
      ]);
      setProducts(prods);
      setSalesOrders(orders);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Valid, non-voided, non-cancelled sales orders
  const validOrders = useMemo(() => {
    return salesOrders.filter((o) => {
      const isVoided = o.status === 'VOIDED' || o.status === 'CANCELLED' || o.paymentStatus === 'VOIDED';
      return !isVoided;
    });
  }, [salesOrders]);

  // Helper to format order date/time cleanly
  const formatOrderTime = (dateStr: string | Date | undefined): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);

      const now = new Date();
      const isSameDay =
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate();

      if (isSameDay) {
        return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
      }
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    } catch {
      return String(dateStr);
    }
  };

  // 1. TODAY'S METRICS
  const todayStats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = (dateVal: string | Date | undefined) => {
      if (!dateVal) return false;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return false;
      return d.toISOString().split('T')[0] === todayStr || String(dateVal).startsWith(todayStr);
    };

    const ordersToday = validOrders.filter((o) => isToday(o.orderDate || o.date || o.createdAt));
    const salesToday = ordersToday.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    return {
      salesToday,
      ordersTodayCount: ordersToday.length,
    };
  }, [validOrders]);

  // 2. STOCK METRICS (Strictly active products only)
  const stockStats = useMemo(() => {
    const activeProducts = products.filter((p) => p.isActive !== false);

    // Stock value at cost: active inventory quantity × product cost
    const stockValuationCost = activeProducts.reduce((sum, p) => {
      const qty = Number(p.currentStock) || 0;
      const cost = Number(p.costPrice) || 0;
      return sum + qty * cost;
    }, 0);

    // Low stock products: stock > 0 AND stock <= reorder threshold
    const lowStockProducts = activeProducts.filter((p) => {
      const current = Number(p.currentStock) || 0;
      const reorder = Number(p.reorderPoint ?? 3);
      return current > 0 && current <= reorder;
    });

    // Out of stock products: stock <= 0 (stock === 0)
    const outOfStockProducts = activeProducts.filter((p) => {
      const current = Number(p.currentStock) || 0;
      return current <= 0;
    });

    // Attention products: out of stock first, then low stock, sorted by current stock ascending
    const attentionProducts = [...outOfStockProducts, ...lowStockProducts].sort(
      (a, b) => (Number(a.currentStock) || 0) - (Number(b.currentStock) || 0)
    );

    const lowStockCount = lowStockProducts.length;
    const outOfStockCount = outOfStockProducts.length;
    const totalAttentionCount = lowStockCount + outOfStockCount;

    return {
      stockValuationCost,
      attentionProducts,
      lowStockCount,
      outOfStockCount,
      totalAttentionCount,
    };
  }, [products]);

  // 3. SALES TREND DATA (Last 7 Days actual sales)
  const trendData = useMemo(() => {
    const now = new Date();
    const buckets: {
      key: string;
      label: string;
      fullDate: string;
      startDate: Date;
      endDate: Date;
      sales: number;
      orders: number;
    }[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStr = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      buckets.push({
        key: dayStr,
        label,
        fullDate: d.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }),
        startDate: new Date(d.setHours(0, 0, 0, 0)),
        endDate: new Date(d.setHours(23, 59, 59, 999)),
        sales: 0,
        orders: 0,
      });
    }

    // Accumulate valid orders into buckets
    validOrders.forEach((o) => {
      const rawDate = o.orderDate || o.createdAt || o.date;
      if (!rawDate) return;
      const orderTime = new Date(rawDate).getTime();
      const total = Number(o.totalAmount) || 0;

      for (const b of buckets) {
        if (orderTime >= b.startDate.getTime() && orderTime <= b.endDate.getTime()) {
          b.sales += total;
          b.orders += 1;
          break;
        }
      }
    });

    const maxSales = Math.max(...buckets.map((b) => b.sales), 0);
    const totalPeriodSales = buckets.reduce((sum, b) => sum + b.sales, 0);
    const totalPeriodOrders = buckets.reduce((sum, b) => sum + b.orders, 0);

    return {
      buckets,
      maxSales: maxSales > 0 ? maxSales : 10000,
      totalPeriodSales,
      totalPeriodOrders,
      hasSales: totalPeriodSales > 0,
    };
  }, [validOrders]);

  // 4. RECENT SALES (latest 4 valid orders - moved to left column for bottom alignment)
  const recentSales = useMemo(() => {
    return [...validOrders]
      .sort((a, b) => {
        const dateA = new Date(a.orderDate || a.createdAt || a.date).getTime();
        const dateB = new Date(b.orderDate || b.createdAt || b.date).getTime();
        return dateB - dateA;
      })
      .slice(0, 4);
  }, [validOrders]);

  // 5. TOP SELLING PRODUCTS (by actual units sold from valid sales - max 3 rows for balanced grid)
  const topSellingProducts = useMemo(() => {
    const productMap = new Map<string, { id?: string; name: string; sku: string; units: number; revenue: number }>();

    validOrders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const key = item.productId || item.sku || item.productName;
        const existing = productMap.get(key) || {
          id: item.productId,
          name: item.productName,
          sku: item.sku,
          units: 0,
          revenue: 0,
        };
        const qty = Number(item.quantity) || 0;
        const total = Number(item.total ?? qty * item.unitPrice) || 0;
        existing.units += qty;
        existing.revenue += total;
        productMap.set(key, existing);
      });
    });

    return Array.from(productMap.values())
      .filter((p) => p.units > 0)
      .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
      .slice(0, 3);
  }, [validOrders]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '10px' }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '12px' }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  // Calculate coordinates for SVG Sales Trend graph
  // viewBox: 0 0 320 120; plot area: x from 40 to 308, y from 16 to 96
  const plotLeft = 40;
  const plotRight = 308;
  const plotWidth = plotRight - plotLeft;
  const plotBaseY = 96;
  const plotTopY = 16;
  const plotHeight = plotBaseY - plotTopY;

  const chartPoints = trendData.buckets.map((b, idx) => {
    const x = plotLeft + (idx * plotWidth) / (trendData.buckets.length - 1);
    const ratio = trendData.maxSales > 0 ? b.sales / trendData.maxSales : 0;
    const y = plotBaseY - ratio * plotHeight;
    return { x, y, b };
  });

  const linePathD = chartPoints.length > 0
    ? `M ${chartPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`
    : '';

  const areaPathD = chartPoints.length > 0
    ? `M ${chartPoints[0].x.toFixed(1)},${plotBaseY} L ${chartPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)},${plotBaseY} Z`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* =========================================================================
          ROW 1: TOP KPI SUMMARY CARDS
          ========================================================================= */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '10px',
        }}
      >
        {/* KPI 1: TODAY'S SALES */}
        <div
          className="yz-card"
          style={{
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--yz-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Today's Sales
            </span>
            <Receipt size={14} style={{ color: 'var(--yz-primary, #852237)' }} />
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'var(--yz-font-mono)',
              color: 'var(--yz-text-primary)',
              marginTop: '2px',
            }}
            className="tabular-nums"
          >
            ₹{todayStats.salesToday.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Sales recorded today
          </span>
        </div>

        {/* KPI 2: ORDERS TODAY */}
        <div
          className="yz-card"
          style={{
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--yz-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Orders Today
            </span>
            <ShoppingBag size={14} style={{ color: 'var(--yz-text-secondary, #475569)' }} />
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'var(--yz-font-mono)',
              color: 'var(--yz-text-primary)',
              marginTop: '2px',
            }}
            className="tabular-nums"
          >
            {todayStats.ordersTodayCount}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Completed orders today
          </span>
        </div>

        {/* KPI 3: STOCK VALUE */}
        <div
          className="yz-card"
          style={{
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--yz-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Stock Value
            </span>
            <Package size={14} style={{ color: 'var(--yz-text-secondary, #475569)' }} />
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'var(--yz-font-mono)',
              color: 'var(--yz-text-primary)',
              marginTop: '2px',
            }}
            className="tabular-nums"
          >
            ₹{stockStats.stockValuationCost.toLocaleString('en-IN')}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Current inventory at cost
          </span>
        </div>

        {/* KPI 4: LOW STOCK */}
        <div
          className="yz-card"
          onClick={() => onNavigate('products')}
          style={{
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '3px',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease',
          }}
          title="Click to view low stock items in Products & Stock"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 600,
                color: 'var(--yz-text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
              }}
            >
              Low Stock
            </span>
            <AlertTriangle
              size={14}
              style={{
                color:
                  stockStats.totalAttentionCount > 0
                    ? 'var(--yz-status-low-stock, #B45309)'
                    : 'var(--yz-status-in-stock, #15803D)',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              fontFamily: 'var(--yz-font-mono)',
              color:
                stockStats.totalAttentionCount > 0
                  ? 'var(--yz-status-low-stock, #B45309)'
                  : 'var(--yz-text-primary)',
              marginTop: '2px',
            }}
            className="tabular-nums"
          >
            {stockStats.totalAttentionCount}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Products needing attention
          </span>
        </div>
      </div>

      {/* =========================================================================
          BALANCED TWO-COLUMN DASHBOARD LAYOUT
          LEFT:  1. Sales Trend  2. Top Selling Products
          RIGHT: 1. Low Stock    2. Recent Sales
          Mobile stacks: Sales Trend -> Low Stock -> Top Selling -> Recent Sales
          ========================================================================= */}
      <div className="yz-overview-columns">
        {/* =====================================================================
            LEFT COLUMN
            ===================================================================== */}
        <div className="yz-overview-col">
          {/* 1. SALES TREND CARD */}
          <div
            className="yz-card yz-overview-trend"
            style={{
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header: Title + Subtitle on left, [Line] [Bar] toggle on right */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--yz-border-subtle)',
              }}
            >
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-text-primary)', margin: 0 }}>
                  Sales Trend
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                  {trendData.hasSales
                    ? `₹${trendData.totalPeriodSales.toLocaleString('en-IN')} total (${trendData.totalPeriodOrders} orders)`
                    : 'Sales (₹)'}
                </span>
              </div>

              {/* Compact [Line] [Bar] Toggle */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  borderRadius: 'var(--yz-radius-md, 10px)',
                  border: '1px solid var(--yz-border)',
                  padding: '2px',
                  gap: '2px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setChartType('line')}
                  className="yz-btn"
                  style={{
                    height: '24px',
                    padding: '0 8px',
                    fontSize: '11px',
                    fontWeight: chartType === 'line' ? 600 : 500,
                    backgroundColor: chartType === 'line' ? 'var(--yz-bg-surface)' : 'transparent',
                    color: chartType === 'line' ? 'var(--yz-text-primary)' : 'var(--yz-text-muted)',
                    boxShadow: chartType === 'line' ? 'var(--yz-shadow-2xs)' : 'none',
                    borderRadius: 'var(--yz-radius-sm, 8px)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.14s ease',
                  }}
                  title="Line chart view"
                >
                  Line
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('bar')}
                  className="yz-btn"
                  style={{
                    height: '24px',
                    padding: '0 8px',
                    fontSize: '11px',
                    fontWeight: chartType === 'bar' ? 600 : 500,
                    backgroundColor: chartType === 'bar' ? 'var(--yz-bg-surface)' : 'transparent',
                    color: chartType === 'bar' ? 'var(--yz-text-primary)' : 'var(--yz-text-muted)',
                    boxShadow: chartType === 'bar' ? 'var(--yz-shadow-2xs)' : 'none',
                    borderRadius: 'var(--yz-radius-sm, 8px)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    transition: 'all 0.14s ease',
                  }}
                  title="Bar chart view"
                >
                  Bar
                </button>
              </div>
            </div>

            {/* Graph Content */}
            {!trendData.hasSales ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--yz-text-muted)',
                  fontSize: '11.5px',
                  padding: '1.75rem 1rem',
                  textAlign: 'center',
                }}
              >
                <TrendingUp size={20} style={{ marginBottom: '6px', opacity: 0.4 }} />
                <div>No sales recorded for this period.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
                {/* Tooltip on hover */}
                {hoveredBar && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '0px',
                      right: '4px',
                      backgroundColor: 'var(--yz-bg-surface)',
                      border: '1px solid var(--yz-border)',
                      boxShadow: 'var(--yz-shadow-sm)',
                      borderRadius: 'var(--yz-radius-sm, 8px)',
                      padding: '3px 8px',
                      fontSize: '10.5px',
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{hoveredBar.fullDate}: </span>
                    <span
                      style={{
                        fontFamily: 'var(--yz-font-mono)',
                        fontWeight: 700,
                        color: 'var(--yz-primary, #852237)',
                      }}
                    >
                      ₹{hoveredBar.sales.toLocaleString('en-IN')}
                    </span>
                    <span style={{ color: 'var(--yz-text-muted)', marginLeft: '4px' }}>
                      ({hoveredBar.orders} {hoveredBar.orders === 1 ? 'order' : 'orders'})
                    </span>
                  </div>
                )}

                {/* Compact, tightly fitted SVG Chart (~135px height, no wasted vertical whitespace) */}
                <div style={{ width: '100%', height: '135px', marginTop: '4px' }}>
                  <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 320 115"
                    preserveAspectRatio="none"
                    style={{ overflow: 'visible' }}
                  >
                    <defs>
                      <linearGradient id="yzSalesAreaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--yz-primary, #852237)" stopOpacity="0.32" />
                        <stop offset="100%" stopColor="var(--yz-primary, #852237)" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Subtle horizontal grid lines */}
                    <line
                      x1={plotLeft}
                      y1={plotTopY}
                      x2={plotRight}
                      y2={plotTopY}
                      stroke="var(--yz-border-subtle, #F1F5F9)"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <line
                      x1={plotLeft}
                      y1={(plotTopY + plotBaseY) / 2}
                      x2={plotRight}
                      y2={(plotTopY + plotBaseY) / 2}
                      stroke="var(--yz-border-subtle, #F1F5F9)"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <line
                      x1={plotLeft}
                      y1={plotBaseY}
                      x2={plotRight}
                      y2={plotBaseY}
                      stroke="var(--yz-border, #E2E8F0)"
                      strokeWidth="1"
                    />

                    {/* Y-Axis scale labels */}
                    <text
                      x={plotLeft - 6}
                      y={plotTopY + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="var(--yz-text-muted, #94A3B8)"
                      fontFamily="var(--yz-font-mono)"
                    >
                      ₹{trendData.maxSales >= 1000 ? `${Math.round(trendData.maxSales / 1000)}k` : trendData.maxSales}
                    </text>
                    <text
                      x={plotLeft - 6}
                      y={plotBaseY + 3}
                      textAnchor="end"
                      fontSize="9"
                      fill="var(--yz-text-muted, #94A3B8)"
                      fontFamily="var(--yz-font-mono)"
                    >
                      ₹0
                    </text>

                    {/* LINE MODE: Area + Path + Dots */}
                    {chartType === 'line' && (
                      <>
                        <path d={areaPathD} fill="url(#yzSalesAreaGrad)" />
                        <path
                          d={linePathD}
                          fill="none"
                          stroke="var(--yz-primary, #852237)"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {chartPoints.map((pt) => {
                          const isHovered = hoveredBar?.dateStr === pt.b.key;
                          return (
                            <circle
                              key={`dot-${pt.b.key}`}
                              cx={pt.x}
                              cy={pt.y}
                              r={isHovered ? 4.5 : 3.5}
                              fill="var(--yz-bg-surface)"
                              stroke={isHovered ? 'var(--yz-primary-hover, #6E1B2D)' : 'var(--yz-primary, #852237)'}
                              strokeWidth={isHovered ? 2.5 : 2}
                              style={{ transition: 'all 0.12s ease' }}
                            />
                          );
                        })}
                      </>
                    )}

                    {/* BAR MODE: Vertical bars with rounded corners */}
                    {chartType === 'bar' &&
                      chartPoints.map((pt) => {
                        const barWidth = 18;
                        const barHeight = pt.b.sales > 0 ? Math.max(3, plotBaseY - pt.y) : 0;
                        const isHovered = hoveredBar?.dateStr === pt.b.key;
                        const barX = pt.x - barWidth / 2;

                        return (
                          <g key={`bar-${pt.b.key}`}>
                            {pt.b.sales > 0 ? (
                              <rect
                                x={barX}
                                y={pt.y}
                                width={barWidth}
                                height={barHeight}
                                rx="3"
                                fill={isHovered ? 'var(--yz-primary-hover, #6E1B2D)' : 'var(--yz-primary, #852237)'}
                                style={{ transition: 'fill 0.14s ease' }}
                              />
                            ) : (
                              <rect
                                x={pt.x - 3}
                                y={plotBaseY - 2}
                                width={6}
                                height={2}
                                rx="1"
                                fill="var(--yz-border, #CBD5E1)"
                              />
                            )}
                          </g>
                        );
                      })}

                    {/* X-Axis labels & Hit targets (shared by both modes) */}
                    {chartPoints.map((pt) => {
                      const isHovered = hoveredBar?.dateStr === pt.b.key;
                      const colWidth = plotWidth / (trendData.buckets.length - 1);

                      return (
                        <g
                          key={`hit-${pt.b.key}`}
                          onMouseEnter={() =>
                            setHoveredBar({
                              label: pt.b.label,
                              dateStr: pt.b.key,
                              fullDate: pt.b.fullDate,
                              sales: pt.b.sales,
                              orders: pt.b.orders,
                            })
                          }
                          onMouseLeave={() => setHoveredBar(null)}
                          style={{ cursor: 'pointer' }}
                        >
                          {/* Invisible hover hitbox */}
                          <rect
                            x={pt.x - colWidth / 2}
                            y={plotTopY - 4}
                            width={colWidth}
                            height={plotHeight + 20}
                            fill="transparent"
                          />

                          {/* X-Axis date label */}
                          <text
                            x={pt.x}
                            y={110}
                            textAnchor="middle"
                            fontSize="9"
                            fill={isHovered ? 'var(--yz-text-primary)' : 'var(--yz-text-muted)'}
                            fontWeight={isHovered ? 600 : 400}
                          >
                            {pt.b.label}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* 2. RECENT SALES CARD (4 records) */}
          <div
            className="yz-card yz-overview-recentsales"
            style={{
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--yz-border-subtle)',
              }}
            >
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-text-primary)', margin: 0 }}>
                  Recent Sales
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                  Latest completed orders and counter bills
                </span>
              </div>

              <button
                onClick={() => onNavigate('orders')}
                className="yz-btn yz-btn-ghost yz-btn-sm"
                style={{
                  fontSize: '11px',
                  color: 'var(--yz-primary, #852237)',
                  padding: '0 4px',
                  height: '22px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span>View All Sales</span>
                <ArrowRight size={11} />
              </button>
            </div>

            {/* Table or Empty State */}
            {recentSales.length === 0 ? (
              <div
                style={{
                  padding: '1.75rem 1rem',
                  textAlign: 'center',
                  color: 'var(--yz-text-muted)',
                  fontSize: '11.5px',
                }}
              >
                No recent sales.
              </div>
            ) : (
              <div className="yz-table-container">
                <table className="yz-table yz-table-compact" style={{ width: '100%', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '115px' }}>Order</th>
                      <th>Customer</th>
                      <th style={{ width: '65px' }}>Time</th>
                      <th style={{ textAlign: 'right', width: '75px' }}>Amount</th>
                      <th style={{ textAlign: 'center', width: '78px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentSales.map((o) => {
                      const isPaid = o.paymentStatus === 'PAID' || (o.totalAmount > 0 && o.pendingAmount === 0);
                      const isVoided = o.status === 'VOIDED' || o.paymentStatus === 'VOIDED';

                      return (
                        <tr
                          key={o.id}
                          onClick={() => setSelectedOrder(o)}
                          style={{ cursor: 'pointer' }}
                          title="Click to view sales order details"
                        >
                          <td
                            style={{
                              fontWeight: 600,
                              fontFamily: 'var(--yz-font-mono)',
                              color: 'var(--yz-primary, #852237)',
                              fontSize: '11px',
                              width: '115px',
                            }}
                          >
                            {o.orderNumber}
                          </td>
                          <td style={{ fontWeight: 500 }}>
                            <div
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                              title={o.customerName || 'Walk-in Guest'}
                            >
                              {o.customerName || 'Walk-in Guest'}
                            </div>
                          </td>
                          <td style={{ color: 'var(--yz-text-muted)', fontSize: '10.5px', width: '65px' }}>
                            {formatOrderTime(o.orderDate || o.createdAt || o.date)}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 700,
                              fontFamily: 'var(--yz-font-mono)',
                              fontSize: '11px',
                              width: '75px',
                            }}
                            className="tabular-nums"
                          >
                            ₹{Number(o.totalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td style={{ textAlign: 'center', width: '78px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2px 8px',
                                minWidth: '56px',
                                boxSizing: 'border-box',
                                borderRadius: 'var(--yz-radius-full)',
                                fontSize: '10px',
                                fontWeight: 700,
                                whiteSpace: 'nowrap',
                                backgroundColor: isVoided
                                  ? 'var(--yz-status-out-stock-bg, #FEE2E2)'
                                  : isPaid
                                  ? 'var(--yz-status-in-stock-bg, #DCFCE7)'
                                  : 'var(--yz-status-low-stock-bg, #FEF3C7)',
                                color: isVoided
                                  ? 'var(--yz-status-out-stock, #B91C1C)'
                                  : isPaid
                                  ? 'var(--yz-status-in-stock, #166534)'
                                  : 'var(--yz-status-low-stock, #92400E)',
                                border: `1px solid ${
                                  isVoided
                                    ? 'var(--yz-status-out-stock-border, #FECACA)'
                                    : isPaid
                                    ? 'var(--yz-status-in-stock-border, #BBF7D0)'
                                    : 'var(--yz-status-low-stock-border, #FDE68A)'
                                }`,
                              }}
                            >
                              {isVoided ? 'VOIDED' : isPaid ? 'PAID' : 'PENDING'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN
            ===================================================================== */}
        <div className="yz-overview-col">
          {/* 1. LOW STOCK CARD */}
          <div
            className="yz-card yz-overview-lowstock"
            style={{
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--yz-border-subtle)',
              }}
            >
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-text-primary)', margin: 0 }}>
                  Low Stock
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                  Products needing attention
                </span>
              </div>

              <button
                onClick={() => onNavigate('products')}
                className="yz-btn yz-btn-ghost yz-btn-sm"
                style={{
                  fontSize: '11px',
                  color: 'var(--yz-primary, #852237)',
                  padding: '0 4px',
                  height: '22px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span>View Products</span>
                <ArrowRight size={11} />
              </button>
            </div>

            {/* Inventory-Alert Dynamic Summary Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: 'var(--yz-radius-md, 10px)',
                backgroundColor: 'var(--yz-bg-subtle)',
                border: '1px solid var(--yz-border-subtle)',
                fontSize: '11px',
                marginBottom: '8px',
              }}
            >
              <span style={{ color: 'var(--yz-status-low-stock, #B45309)', fontWeight: 600 }}>
                Low Stock: {stockStats.lowStockCount}
              </span>
              <span style={{ color: 'var(--yz-text-muted)', fontSize: '9px' }}>•</span>
              <span style={{ color: 'var(--yz-status-out-stock, #B91C1C)', fontWeight: 600 }}>
                Out of Stock: {stockStats.outOfStockCount}
              </span>
              <span style={{ color: 'var(--yz-text-muted)', fontSize: '9px' }}>•</span>
              <span style={{ color: 'var(--yz-text-secondary)', fontWeight: 600 }}>
                Items: {stockStats.totalAttentionCount}
              </span>
            </div>

            {/* List or Empty State */}
            {stockStats.attentionProducts.length === 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--yz-status-in-stock, #15803D)',
                  fontSize: '11.5px',
                  padding: '1.75rem 1rem',
                  textAlign: 'center',
                }}
              >
                <CheckCircle2 size={20} style={{ marginBottom: '6px' }} />
                <div style={{ fontWeight: 500 }}>All products are above their reorder levels.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Table Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.8fr) 65px 65px',
                    padding: '4px 6px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--yz-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    borderBottom: '1px solid var(--yz-border-subtle)',
                  }}
                >
                  <span>Product</span>
                  <span style={{ textAlign: 'center' }}>Stock</span>
                  <span style={{ textAlign: 'right' }}>Reorder</span>
                </div>

                {/* Rows - Max 3 rows as specified */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                  {stockStats.attentionProducts.slice(0, 3).map((p) => {
                    const current = Number(p.currentStock) || 0;
                    const reorder = Number(p.reorderPoint ?? 3);
                    const isOut = current <= 0;

                    return (
                      <div
                        key={p.id}
                        onClick={() => onViewProductDetail(p)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1.8fr) 65px 65px',
                          alignItems: 'center',
                          padding: '5px 6px',
                          borderRadius: 'var(--yz-radius-sm, 8px)',
                          fontSize: '11.5px',
                          cursor: 'pointer',
                          transition: 'background-color 0.1s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--yz-bg-subtle)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        title={`View details for ${p.name}`}
                      >
                        <div style={{ minWidth: 0, paddingRight: '6px' }}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--yz-text-primary)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {p.name}
                          </div>
                          <div
                            style={{
                              fontSize: '10px',
                              color: 'var(--yz-text-muted)',
                              fontFamily: 'var(--yz-font-mono)',
                              fontWeight: 600,
                            }}
                          >
                            {p.sku}
                          </div>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: 'var(--yz-radius-full)',
                              fontSize: '10px',
                              fontWeight: 700,
                              fontFamily: 'var(--yz-font-mono)',
                              backgroundColor: isOut
                                ? 'var(--yz-status-out-stock-bg, #FEE2E2)'
                                : 'var(--yz-status-low-stock-bg, #FEF3C7)',
                              color: isOut
                                ? 'var(--yz-status-out-stock, #B91C1C)'
                                : 'var(--yz-status-low-stock, #B45309)',
                              border: `1px solid ${
                                isOut
                                  ? 'var(--yz-status-out-stock-border, #FECACA)'
                                  : 'var(--yz-status-low-stock-border, #FDE68A)'
                              }`,
                            }}
                          >
                            {current}
                          </span>
                        </div>

                        <div
                          style={{
                            textAlign: 'right',
                            fontFamily: 'var(--yz-font-mono)',
                            color: 'var(--yz-text-muted)',
                            fontSize: '11px',
                          }}
                        >
                          {reorder}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. TOP SELLING PRODUCTS CARD */}
          <div
            className="yz-card yz-overview-topselling"
            style={{
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--yz-border-subtle)',
              }}
            >
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-text-primary)', margin: 0 }}>
                  Top Selling Products
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                  By units sold from completed sales
                </span>
              </div>

              <button
                onClick={() => onNavigate('reports')}
                className="yz-btn yz-btn-ghost yz-btn-sm"
                style={{
                  fontSize: '11px',
                  color: 'var(--yz-primary, #852237)',
                  padding: '0 4px',
                  height: '22px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <span>View Reports</span>
                <ArrowRight size={11} />
              </button>
            </div>

            {/* Table or Empty State */}
            {topSellingProducts.length === 0 ? (
              <div
                style={{
                  padding: '1.75rem 1rem',
                  textAlign: 'center',
                  color: 'var(--yz-text-muted)',
                  fontSize: '11.5px',
                }}
              >
                No product sales recorded yet.
              </div>
            ) : (
              <div className="yz-table-container">
                <table className="yz-table yz-table-compact" style={{ width: '100%', tableLayout: 'fixed' }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ textAlign: 'center', width: '80px' }}>Units Sold</th>
                      <th style={{ textAlign: 'right', width: '90px' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topSellingProducts.map((p, idx) => {
                      const matchedProd = products.find((prod) => prod.id === p.id || prod.sku === p.sku);
                      return (
                        <tr
                          key={p.sku || idx}
                          onClick={() => matchedProd && onViewProductDetail(matchedProd)}
                          style={{ cursor: matchedProd ? 'pointer' : 'default' }}
                          title={matchedProd ? `View details for ${p.name}` : undefined}
                        >
                          <td style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontWeight: 600,
                                color: 'var(--yz-text-primary)',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {p.name}
                            </div>
                            <div
                              style={{
                                fontSize: '10px',
                                color: 'var(--yz-text-muted)',
                                fontFamily: 'var(--yz-font-mono)',
                                fontWeight: 600,
                              }}
                            >
                              {p.sku}
                            </div>
                          </td>
                          <td
                            style={{
                              textAlign: 'center',
                              fontFamily: 'var(--yz-font-mono)',
                              fontWeight: 600,
                              fontSize: '11px',
                              width: '80px',
                            }}
                            className="tabular-nums"
                          >
                            {p.units}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontFamily: 'var(--yz-font-mono)',
                              fontWeight: 700,
                              fontSize: '11px',
                              width: '90px',
                            }}
                            className="tabular-nums"
                          >
                            ₹{Number(p.revenue || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Informational Sales Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
};
