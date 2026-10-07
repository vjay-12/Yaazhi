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
import { CustomDropdown, type DropdownOption } from '../../components/common/CustomDropdown';
import { CardSkeleton } from '../../components/common/LoadingState';
import type { NavTabId } from '../../components/layout/Sidebar';

interface OverviewPageProps {
  onNavigate: (tab: NavTabId) => void;
  onViewProductDetail: (product: YaazhiProduct) => void;
  onOpenAddProduct: () => void;
}

type TrendPeriod = '7D' | '30D' | 'MONTH' | 'YEAR';

const TREND_PERIOD_OPTIONS: DropdownOption[] = [
  { value: '7D', label: 'Last 7 Days' },
  { value: '30D', label: 'Last 30 Days' },
  { value: 'MONTH', label: 'This Month' },
  { value: 'YEAR', label: 'This Year' },
];

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  onViewProductDetail,
}) => {
  const [products, setProducts] = useState<YaazhiProduct[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sales Trend period switcher
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('7D');
  const [hoveredBar, setHoveredBar] = useState<{
    label: string;
    dateStr: string;
    fullDate: string;
    sales: number;
    orders: number;
  } | null>(null);

  // Selected Order for detail modal (reusing existing order detail implementation)
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

  // 2. STOCK METRICS
  const stockStats = useMemo(() => {
    const activeProducts = products.filter((p) => p.isActive !== false);

    // Stock value at cost: active inventory quantity × product cost
    const stockValuationCost = activeProducts.reduce((sum, p) => {
      const qty = Number(p.currentStock) || 0;
      const cost = Number(p.costPrice) || 0;
      return sum + qty * cost;
    }, 0);

    // Low stock products: current stock <= reorder level
    const lowStockItems = activeProducts.filter((p) => {
      const current = Number(p.currentStock) || 0;
      const reorder = Number(p.reorderPoint ?? 3);
      return current <= reorder;
    });

    return {
      stockValuationCost,
      lowStockItems,
      lowStockCount: lowStockItems.length,
    };
  }, [products]);

  // 3. SALES TREND DATA
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

    if (trendPeriod === '7D') {
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
    } else if (trendPeriod === '30D') {
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const label = i % 5 === 0 || i === 0 ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '';
        buckets.push({
          key: dayStr,
          label,
          fullDate: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          startDate: new Date(d.setHours(0, 0, 0, 0)),
          endDate: new Date(d.setHours(23, 59, 59, 999)),
          sales: 0,
          orders: 0,
        });
      }
    } else if (trendPeriod === 'MONTH') {
      const year = now.getFullYear();
      const month = now.getMonth();
      const totalDays = new Date(year, month + 1, 0).getDate();
      for (let day = 1; day <= totalDays; day++) {
        const d = new Date(year, month, day);
        const dayStr = d.toISOString().split('T')[0];
        const label = day === 1 || day % 5 === 0 || day === totalDays ? `${day}` : '';
        buckets.push({
          key: dayStr,
          label,
          fullDate: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
          startDate: new Date(d.setHours(0, 0, 0, 0)),
          endDate: new Date(d.setHours(23, 59, 59, 999)),
          sales: 0,
          orders: 0,
        });
      }
    } else if (trendPeriod === 'YEAR') {
      const year = now.getFullYear();
      for (let m = 0; m < 12; m++) {
        const d = new Date(year, m, 1);
        const label = d.toLocaleDateString('en-GB', { month: 'short' });
        const start = new Date(year, m, 1, 0, 0, 0, 0);
        const end = new Date(year, m + 1, 0, 23, 59, 59, 999);
        buckets.push({
          key: `${year}-${String(m + 1).padStart(2, '0')}`,
          label,
          fullDate: `${d.toLocaleDateString('en-GB', { month: 'long' })} ${year}`,
          startDate: start,
          endDate: end,
          sales: 0,
          orders: 0,
        });
      }
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
  }, [trendPeriod, validOrders]);

  // 4. RECENT SALES (latest 5 valid orders)
  const recentSales = useMemo(() => {
    return [...validOrders]
      .sort((a, b) => {
        const dateA = new Date(a.orderDate || a.createdAt || a.date).getTime();
        const dateB = new Date(b.orderDate || b.createdAt || b.date).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [validOrders]);

  // 5. TOP SELLING PRODUCTS (by actual units sold from valid sales)
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
      .slice(0, 5);
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '12px' }}>
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 1. TOP KPI SUMMARY: Four compact, neutral boxes */}
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
                  stockStats.lowStockCount > 0
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
                stockStats.lowStockCount > 0
                  ? 'var(--yz-status-low-stock, #B45309)'
                  : 'var(--yz-text-primary)',
              marginTop: '2px',
            }}
            className="tabular-nums"
          >
            {stockStats.lowStockCount}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Products needing attention
          </span>
        </div>
      </div>

      {/* 2. MIDDLE ROW: Sales Trend & Low Stock */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Sales Trend Graph */}
        <div
          className="yz-card"
          style={{
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '270px',
          }}
        >
          {/* Header & Controls */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--yz-border-subtle)',
            }}
          >
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                Sales Trend
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                {trendData.hasSales
                  ? `₹${trendData.totalPeriodSales.toLocaleString('en-IN')} total (${trendData.totalPeriodOrders} orders)`
                  : 'Sales (₹)'}
              </span>
            </div>

            <CustomDropdown
              value={trendPeriod}
              onChange={(val) => setTrendPeriod(val as TrendPeriod)}
              options={TREND_PERIOD_OPTIONS}
              minWidth="120px"
              style={{ height: '26px', fontSize: '11px' }}
            />
          </div>

          {/* Graph Content */}
          {!trendData.hasSales ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--yz-text-muted)',
                fontSize: '11.5px',
                padding: '2rem 1rem',
                textAlign: 'center',
              }}
            >
              <TrendingUp size={22} style={{ marginBottom: '6px', opacity: 0.4 }} />
              <div>No sales recorded for this period.</div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
              {/* Tooltip on hover */}
              {hoveredBar && (
                <div
                  style={{
                    position: 'absolute',
                    top: '2px',
                    right: '4px',
                    backgroundColor: 'var(--yz-bg-surface)',
                    border: '1px solid var(--yz-border)',
                    boxShadow: 'var(--yz-shadow-sm)',
                    borderRadius: 'var(--yz-radius-sm)',
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

              {/* Responsive SVG Bar Chart */}
              <div style={{ width: '100%', height: '170px', marginTop: '6px' }}>
                <svg
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${trendData.buckets.length * 36 + 40} 140`}
                  preserveAspectRatio="none"
                  style={{ overflow: 'visible' }}
                >
                  {/* Subtle horizontal grid lines */}
                  <line
                    x1="30"
                    y1="20"
                    x2={trendData.buckets.length * 36 + 30}
                    y2="20"
                    stroke="var(--yz-border-subtle, #F1F5F9)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <line
                    x1="30"
                    y1="65"
                    x2={trendData.buckets.length * 36 + 30}
                    y2="65"
                    stroke="var(--yz-border-subtle, #F1F5F9)"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <line
                    x1="30"
                    y1="110"
                    x2={trendData.buckets.length * 36 + 30}
                    y2="110"
                    stroke="var(--yz-border, #E2E8F0)"
                    strokeWidth="1"
                  />

                  {/* Y-Axis scale label */}
                  <text
                    x="24"
                    y="24"
                    textAnchor="end"
                    fontSize="9"
                    fill="var(--yz-text-muted, #94A3B8)"
                    fontFamily="var(--yz-font-mono)"
                  >
                    ₹{trendData.maxSales >= 1000 ? `${Math.round(trendData.maxSales / 1000)}k` : trendData.maxSales}
                  </text>
                  <text
                    x="24"
                    y="113"
                    textAnchor="end"
                    fontSize="9"
                    fill="var(--yz-text-muted, #94A3B8)"
                    fontFamily="var(--yz-font-mono)"
                  >
                    ₹0
                  </text>

                  {/* Bars & X-Axis labels */}
                  {trendData.buckets.map((b, idx) => {
                    const x = 36 + idx * 36;
                    const barWidth = Math.min(22, 28);
                    const barHeight = b.sales > 0 ? Math.max(3, (b.sales / trendData.maxSales) * 88) : 0;
                    const y = 110 - barHeight;
                    const isHovered = hoveredBar?.dateStr === b.key;

                    return (
                      <g
                        key={b.key}
                        onMouseEnter={() =>
                          setHoveredBar({
                            label: b.label,
                            dateStr: b.key,
                            fullDate: b.fullDate,
                            sales: b.sales,
                            orders: b.orders,
                          })
                        }
                        onMouseLeave={() => setHoveredBar(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Background hover hit target */}
                        <rect
                          x={x - 4}
                          y="10"
                          width={barWidth + 8}
                          height="105"
                          fill="transparent"
                        />

                        {/* Bar */}
                        {b.sales > 0 ? (
                          <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            rx="2"
                            fill={isHovered ? 'var(--yz-primary-hover, #6E1B2D)' : 'var(--yz-primary, #852237)'}
                            style={{ transition: 'fill 0.15s ease' }}
                          />
                        ) : (
                          <rect
                            x={x + barWidth / 2 - 2}
                            y="108"
                            width="4"
                            height="2"
                            rx="1"
                            fill="var(--yz-border, #CBD5E1)"
                          />
                        )}

                        {/* X-Axis label */}
                        {b.label && (
                          <text
                            x={x + barWidth / 2}
                            y="126"
                            textAnchor="middle"
                            fontSize="9"
                            fill={isHovered ? 'var(--yz-text-primary)' : 'var(--yz-text-muted)'}
                            fontWeight={isHovered ? 600 : 400}
                          >
                            {b.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
        </div>

        {/* Low Stock Section */}
        <div
          className="yz-card"
          style={{
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '270px',
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
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-text-primary)' }}>
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

          {/* List or Empty State */}
          {stockStats.lowStockItems.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--yz-status-in-stock, #15803D)',
                fontSize: '11.5px',
                padding: '2rem 1rem',
                textAlign: 'center',
              }}
            >
              <CheckCircle2 size={20} style={{ marginBottom: '6px' }} />
              <div style={{ fontWeight: 500 }}>All products are above their reorder levels.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              {/* Table Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.8fr) 70px 70px',
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

              {/* Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '4px' }}>
                {stockStats.lowStockItems.slice(0, 5).map((p) => {
                  const current = Number(p.currentStock) || 0;
                  const reorder = Number(p.reorderPoint ?? 3);
                  const isOut = current <= 0;

                  return (
                    <div
                      key={p.id}
                      onClick={() => onViewProductDetail(p)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.8fr) 70px 70px',
                        alignItems: 'center',
                        padding: '6px',
                        borderRadius: 'var(--yz-radius-sm)',
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
                        <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', fontFamily: 'var(--yz-font-mono)' }}>
                          {p.sku}
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '1px 6px',
                            borderRadius: 'var(--yz-radius-sm)',
                            fontSize: '10px',
                            fontWeight: 600,
                            fontFamily: 'var(--yz-font-mono)',
                            backgroundColor: isOut ? '#FEE2E2' : '#FEF3C7',
                            color: isOut ? '#B91C1C' : '#B45309',
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
      </div>

      {/* 3. BOTTOM ROW: Recent Sales & Top Selling Products */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Recent Sales Section */}
        <div
          className="yz-card"
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
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-text-primary)' }}>
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
                padding: '2rem 1rem',
                textAlign: 'center',
                color: 'var(--yz-text-muted)',
                fontSize: '11.5px',
              }}
            >
              No recent sales.
            </div>
          ) : (
            <div className="yz-table-container">
              <table className="yz-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Time</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ textAlign: 'center', width: '75px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((o) => {
                    const isPaid = o.paymentStatus === 'PAID' || (o.totalAmount > 0 && o.pendingAmount === 0);
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
                          }}
                        >
                          {o.orderNumber}
                        </td>
                        <td style={{ fontWeight: 500 }}>
                          <span className="yz-cell-truncate" style={{ maxWidth: '120px' }}>
                            {o.customerName || 'Walk-in Guest'}
                          </span>
                        </td>
                        <td style={{ color: 'var(--yz-text-muted)', fontSize: '11px' }}>
                          {formatOrderTime(o.orderDate || o.createdAt || o.date)}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            fontFamily: 'var(--yz-font-mono)',
                          }}
                          className="tabular-nums"
                        >
                          ₹{Number(o.totalAmount || 0).toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '1px 6px',
                              borderRadius: 'var(--yz-radius-sm)',
                              fontSize: '9.5px',
                              fontWeight: 600,
                              backgroundColor: isPaid ? '#DCFCE7' : '#FEF3C7',
                              color: isPaid ? '#166534' : '#92400E',
                              border: `1px solid ${isPaid ? '#BBF7D0' : '#FDE68A'}`,
                            }}
                          >
                            {isPaid ? 'PAID' : 'PENDING'}
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

        {/* Top Selling Products Section */}
        <div
          className="yz-card"
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
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-text-primary)' }}>
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
                padding: '2rem 1rem',
                textAlign: 'center',
                color: 'var(--yz-text-muted)',
                fontSize: '11.5px',
              }}
            >
              No product sales recorded yet.
            </div>
          ) : (
            <div className="yz-table-container">
              <table className="yz-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th style={{ textAlign: 'center', width: '80px' }}>Units Sold</th>
                    <th style={{ textAlign: 'right', width: '95px' }}>Revenue</th>
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
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                            <span className="yz-cell-truncate" style={{ maxWidth: '170px' }}>
                              {p.name}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '10px',
                              color: 'var(--yz-text-muted)',
                              fontFamily: 'var(--yz-font-mono)',
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
                          }}
                          className="tabular-nums"
                        >
                          ₹{p.revenue.toLocaleString('en-IN')}
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

      {/* Informational Sales Order Detail Modal (opens when clicking any Recent Sale row) */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
      />
    </div>
  );
};
