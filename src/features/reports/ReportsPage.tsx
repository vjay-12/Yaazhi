import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Download,
  RefreshCw,
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  CheckCircle2,
  Truck,
  Calendar,
  Info,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { CustomDropdown, type DropdownOption } from '../../components/common/CustomDropdown';
import { TableSkeleton } from '../../components/common/LoadingState';
import { salesOrderService, type SalesOrderData } from '../../services/salesOrderService';
import { purchaseService, type PurchaseOrderData } from '../../services/purchaseService';
import { productService } from '../../services/productService';
import { customerService, type CustomerData } from '../../services/customerService';
import { supplierService, type VendorData } from '../../services/supplierService';
import type { YaazhiProduct } from '../../types/product';

// Financial Period Options
const PERIOD_OPTIONS: DropdownOption[] = [
  { value: 'ALL_TIME', label: 'All Time' },
  { value: 'TODAY', label: 'Today' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'LAST_MONTH', label: 'Last Month' },
  { value: 'THIS_YEAR', label: 'This Year' },
  { value: 'CUSTOM', label: 'Custom Range' },
];

type TrendPeriod = '7D' | '30D' | '3M' | 'YEAR';

export const ReportsPage: React.FC = () => {
  // Master data from platform canonical services
  const [salesOrders, setSalesOrders] = useState<SalesOrderData[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderData[]>([]);
  const [products, setProducts] = useState<YaazhiProduct[]>([]);
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Period filter state
  const [period, setPeriod] = useState<string>('ALL_TIME');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  // Trend chart period switcher
  const [trendPeriod, setTrendPeriod] = useState<TrendPeriod>('30D');
  const [hoveredTrendBar, setHoveredTrendBar] = useState<{
    date: string;
    sales: number;
    orders: number;
  } | null>(null);

  // Load all foundational platform data
  const loadPlatformData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [salesRes, purchasesRes, productsRes, customersRes, vendorsRes] = await Promise.all([
        salesOrderService.list(),
        purchaseService.list(),
        productService.list(),
        customerService.list(undefined, 'all'),
        supplierService.list(undefined, 'all'),
      ]);

      setSalesOrders(salesRes);
      setPurchaseOrders(purchasesRes);
      setProducts(productsRes);
      setCustomers(customersRes);
      setVendors(vendorsRes);
    } catch (err) {
      console.error('Failed to load live data for reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPlatformData();
  }, [loadPlatformData]);

  // Compute Active Date Range for Selected Financial Period
  const activeDateRange = useMemo(() => {
    const now = new Date();
    if (period === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start, end };
    }
    if (period === 'THIS_WEEK') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start, end };
    }
    if (period === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    if (period === 'LAST_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end };
    }
    if (period === 'THIS_YEAR') {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
    if (period === 'CUSTOM') {
      const start = customFrom ? new Date(`${customFrom}T00:00:00`) : null;
      const end = customTo ? new Date(`${customTo}T23:59:59.999`) : null;
      return { start, end };
    }
    // ALL_TIME
    return { start: null, end: null };
  }, [period, customFrom, customTo]);

  // Date in-range predicate
  const isInPeriod = useCallback(
    (dateVal: string | Date | undefined) => {
      if (!activeDateRange.start && !activeDateRange.end) return true;
      if (!dateVal) return false;
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return false;
      if (activeDateRange.start && d < activeDateRange.start) return false;
      if (activeDateRange.end && d > activeDateRange.end) return false;
      return true;
    },
    [activeDateRange]
  );

  // 1. PRODUCT COST & CATALOG LOOKUP (Single Source of Truth)
  const productCostMap = useMemo(() => {
    const map = new Map<string, number>();
    products.forEach((p) => {
      map.set(p.id, p.costPrice || 0);
      map.set(p.sku, p.costPrice || 0);
    });
    return map;
  }, [products]);

  // 2. PERIOD SALES & COGS RECONCILIATION
  // Exclude CANCELLED and VOIDED orders strictly
  const validPeriodSales = useMemo(() => {
    return salesOrders.filter((s) => {
      if (s.status === 'CANCELLED' || s.status === 'VOIDED') return false;
      return isInPeriod(s.orderDate || s.date);
    });
  }, [salesOrders, isInPeriod]);

  const salesCalculations = useMemo(() => {
    let grossSales = 0;
    let totalDiscounts = 0;
    let totalTax = 0;
    let totalRevenue = 0;
    let cogs = 0;
    let missingCostItems = 0;

    validPeriodSales.forEach((s) => {
      const sub = Number(s.subtotal ?? s.totalAmount);
      const disc = Number(s.discountTotal || 0);
      const tax = Number(s.taxTotal || 0);
      const total = Number(s.totalAmount);

      grossSales += sub;
      totalDiscounts += disc;
      totalTax += tax;
      totalRevenue += total;

      // Item-level COGS based on real product procurement cost
      s.items.forEach((item) => {
        const itemCost = productCostMap.get(item.productId) ?? productCostMap.get(item.sku) ?? 0;
        if (itemCost <= 0) {
          missingCostItems += 1;
        }
        cogs += Number(item.quantity) * itemCost;
      });
    });

    const netSales = Math.max(0, grossSales - totalDiscounts);
    const grossProfit = netSales - cogs;
    const grossMargin = netSales > 0 ? (grossProfit / netSales) * 100 : 0;
    const avgOrderValue = validPeriodSales.length > 0 ? Math.round(totalRevenue / validPeriodSales.length) : 0;

    return {
      grossSales: Math.round(grossSales),
      totalDiscounts: Math.round(totalDiscounts),
      netSales: Math.round(netSales),
      totalTax: Math.round(totalTax),
      totalRevenue: Math.round(totalRevenue),
      cogs: Math.round(cogs),
      grossProfit: Math.round(grossProfit),
      grossMargin,
      missingCostItems,
      ordersCount: validPeriodSales.length,
      avgOrderValue,
    };
  }, [validPeriodSales, productCostMap]);

  // 3. PERIOD RECEIVED PURCHASES RECONCILIATION
  // Strictly only RECEIVED purchases count towards spend (ORDERED and CANCELLED excluded)
  const validPeriodPurchases = useMemo(() => {
    return purchaseOrders.filter((p) => {
      if (p.status !== 'RECEIVED') return false;
      return isInPeriod(p.date || p.createdAt);
    });
  }, [purchaseOrders, isInPeriod]);

  const purchasesSpend = useMemo(() => {
    return validPeriodPurchases.reduce((sum, p) => sum + Number(p.totalAmount), 0);
  }, [validPeriodPurchases]);

  const openPoCount = useMemo(() => {
    return purchaseOrders.filter((p) => p.status === 'ORDERED').length;
  }, [purchaseOrders]);

  // 4. PERIOD PAYMENT COLLECTIONS (Source of truth: Payment records on non-voided orders)
  const paymentSummary = useMemo(() => {
    const validOrderIds = new Set(salesOrders.filter((s) => s.status !== 'VOIDED' && s.status !== 'CANCELLED').map((s) => s.id));
    const allPayments = salesOrders.flatMap((s) => s.payments || []);

    const periodPayments = allPayments.filter((p) => {
      if (!p.orderId || !validOrderIds.has(p.orderId)) return false;
      const statusUpper = (p.status || '').toUpperCase();
      if (statusUpper !== 'SUCCESSFUL' && statusUpper !== 'PAID') return false;
      return isInPeriod(p.paymentDate || p.date || p.createdAt);
    });

    let cashTotal = 0;
    let upiTotal = 0;
    let cardTotal = 0;
    let netBankingTotal = 0;
    let otherTotal = 0;

    periodPayments.forEach((p) => {
      const mode = (p.paymentMode || '').toUpperCase();
      const amt = Number(p.amount);
      if (mode === 'CASH') {
        cashTotal += amt;
      } else if (mode === 'UPI') {
        upiTotal += amt;
      } else if (mode === 'CARD') {
        cardTotal += amt;
      } else if (mode === 'NET BANKING' || mode === 'BANK_TRANSFER' || mode === 'NEFT') {
        netBankingTotal += amt;
      } else {
        otherTotal += amt;
      }
    });

    const totalCollected = periodPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Pending customer payments calculated from valid sales orders in the period
    const pendingCustomerPayments = validPeriodSales.reduce((sum, s) => sum + Number(s.pendingAmount || 0), 0);

    return {
      cashTotal: Math.round(cashTotal),
      upiTotal: Math.round(upiTotal),
      cardTotal: Math.round(cardTotal),
      netBankingTotal: Math.round(netBankingTotal),
      otherTotal: Math.round(otherTotal),
      totalCollected: Math.round(totalCollected),
      pendingCustomerPayments: Math.round(pendingCustomerPayments),
      count: periodPayments.length,
    };
  }, [salesOrders, validPeriodSales, isInPeriod]);

  // 5. CURRENT-STATE INVENTORY & STOCK VALUATION (Active products only)
  const inventorySummary = useMemo(() => {
    const activeProducts = products.filter((p) => !p.isArchived && p.isActive !== false);

    let totalStockUnits = 0;
    let inventoryCostValue = 0;
    let inventoryRetailValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    activeProducts.forEach((p) => {
      const stock = Number(p.currentStock || 0);
      const cost = Number(p.costPrice || 0);
      const retail = Number(p.salePrice || 0);

      totalStockUnits += stock;
      inventoryCostValue += stock * cost;
      inventoryRetailValue += stock * retail;

      if (stock <= 0) {
        outOfStockCount += 1;
      } else if (stock <= Number(p.reorderPoint || 0)) {
        lowStockCount += 1;
      }
    });

    return {
      totalUnits: totalStockUnits,
      valuationCost: Math.round(inventoryCostValue),
      valuationRetail: Math.round(inventoryRetailValue),
      potentialMargin: Math.round(inventoryRetailValue - inventoryCostValue),
      lowStockCount,
      outOfStockCount,
      activeSkusCount: activeProducts.length,
    };
  }, [products]);

  // 6. LOW STOCK REPORT TABLE (Products where currentStock <= reorderPoint)
  const lowStockProducts = useMemo(() => {
    return products
      .filter((p) => !p.isArchived && p.isActive !== false && Number(p.currentStock || 0) <= Number(p.reorderPoint || 0))
      .sort((a, b) => Number(a.currentStock || 0) - Number(b.currentStock || 0));
  }, [products]);

  // 7. CUSTOMER INSIGHTS
  const customerInsights = useMemo(() => {
    const activeCustomers = customers.filter((c) => !c.isArchived);
    const activeCustomerIds = new Set(activeCustomers.map((c) => c.id));

    // Valid non-voided completed orders across the platform
    const allValidSales = salesOrders.filter((s) => s.status !== 'CANCELLED' && s.status !== 'VOIDED');

    // Aggregate spend & order count per customer in selected period
    const customerAgg = new Map<string, { name: string; orders: number; spend: number }>();

    validPeriodSales.forEach((s) => {
      const cid = s.customerId || s.customerName;
      if (!customerAgg.has(cid)) {
        customerAgg.set(cid, {
          name: s.customerName || 'Anonymous Walk-in',
          orders: 1,
          spend: Number(s.totalAmount),
        });
      } else {
        const entry = customerAgg.get(cid)!;
        entry.orders += 1;
        entry.spend += Number(s.totalAmount);
      }
    });

    const topCustomers = Array.from(customerAgg.values())
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);

    // Platform-wide repeat customer count (customers with >1 valid orders)
    const orderCountPerCustomer = new Map<string, number>();
    allValidSales.forEach((s) => {
      const cid = s.customerId || s.customerName;
      orderCountPerCustomer.set(cid, (orderCountPerCustomer.get(cid) || 0) + 1);
    });

    let repeatCustomersCount = 0;
    orderCountPerCustomer.forEach((count, cid) => {
      if (count > 1 && (activeCustomerIds.has(cid) || true)) {
        repeatCustomersCount += 1;
      }
    });

    // New customers in period
    const newCustomersCount = activeCustomers.filter((c) => isInPeriod(c.createdAt)).length;

    return {
      activeCount: activeCustomers.length,
      repeatCount: repeatCustomersCount,
      newCount: newCustomersCount,
      topCustomers,
    };
  }, [customers, salesOrders, validPeriodSales, isInPeriod]);

  // 8. VENDOR INSIGHTS
  const vendorInsights = useMemo(() => {
    const activeVendors = vendors.filter((v) => !v.isArchived);

    // Aggregate spend per vendor from RECEIVED POs in the period
    const vendorAgg = new Map<string, { name: string; pos: number; spend: number }>();

    validPeriodPurchases.forEach((p) => {
      const vname = p.vendorName || 'Direct Loom Guild';
      if (!vendorAgg.has(vname)) {
        vendorAgg.set(vname, {
          name: vname,
          pos: 1,
          spend: Number(p.totalAmount),
        });
      } else {
        const entry = vendorAgg.get(vname)!;
        entry.pos += 1;
        entry.spend += Number(p.totalAmount);
      }
    });

    const topVendors = Array.from(vendorAgg.values())
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);

    return {
      activeCount: activeVendors.length,
      openPoCount,
      receivedPurchasesTotal: purchasesSpend,
      topVendors,
    };
  }, [vendors, validPeriodPurchases, openPoCount, purchasesSpend]);

  // 9. TOP PERFORMING PRODUCTS & WEAVES
  const topProducts = useMemo(() => {
    const productSalesMap = new Map<
      string,
      { name: string; sku: string; units: number; revenue: number }
    >();

    validPeriodSales.forEach((order) => {
      order.items.forEach((item) => {
        const pid = item.productId || item.sku;
        const qty = Number(item.quantity);
        const rev = Number(item.total);

        if (!productSalesMap.has(pid)) {
          productSalesMap.set(pid, {
            name: item.productName,
            sku: item.sku,
            units: qty,
            revenue: rev,
          });
        } else {
          const entry = productSalesMap.get(pid)!;
          entry.units += qty;
          entry.revenue += rev;
        }
      });
    });

    return Array.from(productSalesMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [validPeriodSales]);

  // 10. SALES TREND DATA BUCKETING (Last 7 Days, 30 Days, 3 Months, This Year)
  const trendData = useMemo(() => {
    const now = new Date();
    const days = trendPeriod === '7D' ? 7 : trendPeriod === '30D' ? 30 : trendPeriod === '3M' ? 90 : 365;
    const bucketMap = new Map<string, { label: string; dateStr: string; sales: number; orders: number }>();

    // Generate consecutive dates backwards
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: days <= 30 ? 'short' : '2-digit',
      });
      bucketMap.set(iso, { label, dateStr: iso, sales: 0, orders: 0 });
    }

    // Populate with valid sales orders
    let totalTrendSales = 0;
    let totalTrendOrders = 0;

    salesOrders.forEach((o) => {
      if (o.status === 'CANCELLED' || o.status === 'VOIDED') return;
      const orderDateStr = new Date(o.orderDate || o.date).toISOString().split('T')[0];
      if (bucketMap.has(orderDateStr)) {
        const b = bucketMap.get(orderDateStr)!;
        const amount = Number(o.totalAmount);
        b.sales += amount;
        b.orders += 1;
        totalTrendSales += amount;
        totalTrendOrders += 1;
      }
    });

    const buckets = Array.from(bucketMap.values());
    const maxSales = Math.max(...buckets.map((b) => b.sales), 1000);
    const avgOrderVal = totalTrendOrders > 0 ? Math.round(totalTrendSales / totalTrendOrders) : 0;

    return {
      buckets,
      maxSales,
      totalSales: totalTrendSales,
      ordersCount: totalTrendOrders,
      avgOrderVal,
    };
  }, [salesOrders, trendPeriod]);

  // 11. EXPORT FUNCTIONALITY (Direct source of truth mirror)
  const handleExportJson = () => {
    const exportPayload = {
      reportTitle: 'Yaazhi Boutique & Atelier - Financial & Operational Ledger',
      generatedAt: new Date().toISOString(),
      financialPeriod: period,
      dateRange: {
        start: activeDateRange.start ? activeDateRange.start.toISOString() : 'All Time',
        end: activeDateRange.end ? activeDateRange.end.toISOString() : 'All Time',
      },
      executiveSummary: {
        grossSales: salesCalculations.grossSales,
        discounts: salesCalculations.totalDiscounts,
        netSales: salesCalculations.netSales,
        cogs: salesCalculations.cogs,
        grossProfit: salesCalculations.grossProfit,
        grossMarginPercent: Number(salesCalculations.grossMargin.toFixed(2)),
        totalReceivedPurchases: purchasesSpend,
        inventoryCostValuation: inventorySummary.valuationCost,
        inventoryRetailValuation: inventorySummary.valuationRetail,
        unitsInStock: inventorySummary.totalUnits,
      },
      paymentCollections: paymentSummary,
      inventorySummary,
      lowStockProducts: lowStockProducts.map((p) => ({
        name: p.name,
        sku: p.sku,
        currentStock: p.currentStock,
        reorderPoint: p.reorderPoint,
        costPrice: p.costPrice,
        salePrice: p.salePrice,
      })),
      topCustomers: customerInsights.topCustomers,
      topVendors: vendorInsights.topVendors,
      topProducts,
    };

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `yaazhi_financial_report_${period.toLowerCase()}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const rows: string[][] = [
      ['YAAZHI BOUTIQUE FINANCIAL REPORT', `Period: ${period}`],
      ['Generated At', new Date().toLocaleString('en-IN')],
      [],
      ['EXECUTIVE KPI', 'AMOUNT (INR)'],
      ['Gross Sales', `${salesCalculations.grossSales}`],
      ['Discounts & Adjustments', `${salesCalculations.totalDiscounts}`],
      ['Net Sales', `${salesCalculations.netSales}`],
      ['Cost of Goods Sold (COGS)', `${salesCalculations.cogs}`],
      ['Gross Profit', `${salesCalculations.grossProfit}`],
      ['Gross Margin (%)', `${salesCalculations.grossMargin.toFixed(2)}%`],
      ['Total Received Purchases', `${purchasesSpend}`],
      ['Inventory Cost Valuation', `${inventorySummary.valuationCost}`],
      ['Inventory Retail Valuation', `${inventorySummary.valuationRetail}`],
      ['Current Stock Units', `${inventorySummary.totalUnits}`],
      [],
      ['PAYMENT COLLECTIONS', 'COLLECTED AMOUNT (INR)'],
      ['Cash Collections', `${paymentSummary.cashTotal}`],
      ['UPI Collections', `${paymentSummary.upiTotal}`],
      ['Net Banking / Transfers', `${paymentSummary.netBankingTotal}`],
      ['Card (Historical)', `${paymentSummary.cardTotal}`],
      ['Total Payment Collections', `${paymentSummary.totalCollected}`],
      ['Pending Customer Receivables', `${paymentSummary.pendingCustomerPayments}`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `yaazhi_ledger_${period.toLowerCase()}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* 1. TOP HEADER & FINANCIAL PERIOD TOOLBAR */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--yz-bg-surface)',
          padding: '8px 12px',
          borderRadius: 'var(--yz-radius-sm)',
          border: '1px solid var(--yz-border)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={13} style={{ color: 'var(--yz-text-muted)' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
              Financial Period:
            </span>
          </div>

          <CustomDropdown
            value={period}
            onChange={(val) => setPeriod(val as string)}
            options={PERIOD_OPTIONS}
            minWidth="145px"
          />

          {period === 'CUSTOM' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="yz-input"
                style={{ padding: '3px 6px', fontSize: '11px', width: '130px' }}
                title="From Date"
              />
              <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>to</span>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="yz-input"
                style={{ padding: '3px 6px', fontSize: '11px', width: '130px' }}
                title="To Date"
              />
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={<RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />}
            onClick={loadPlatformData}
            title="Reload latest database records"
          >
            Refresh
          </Button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={13} />}
            onClick={handleExportCsv}
            title="Export ledger summary as CSV"
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Download size={13} />}
            onClick={handleExportJson}
            title="Export audit report as JSON"
          >
            Export JSON
          </Button>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} columns={4} />
      ) : (
        <>
          {/* 2. TOP SUMMARY CARDS (SALES | PURCHASES | GROSS PROFIT | INVENTORY VALUE) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '10px',
            }}
          >
            {/* SALES */}
            <div className="yz-stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="yz-stat-label">SALES</span>
                <ShoppingBag size={14} style={{ color: 'var(--yz-primary)' }} />
              </div>
              <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-primary)' }}>
                ₹{salesCalculations.totalRevenue.toLocaleString('en-IN')}
              </span>
              <span className="yz-stat-subtext">
                {salesCalculations.ordersCount === 0
                  ? 'No sales recorded for this period'
                  : `Total completed sales across ${salesCalculations.ordersCount} orders`}
              </span>
            </div>

            {/* PURCHASES */}
            <div className="yz-stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="yz-stat-label">PURCHASES</span>
                <Truck size={14} style={{ color: 'var(--yz-text-secondary)' }} />
              </div>
              <span className="yz-stat-value tabular-nums">
                ₹{purchasesSpend.toLocaleString('en-IN')}
              </span>
              <span className="yz-stat-subtext">
                {validPeriodPurchases.length === 0
                  ? 'No received purchases for this period'
                  : `Total received purchases across ${validPeriodPurchases.length} POs`}
              </span>
            </div>

            {/* GROSS PROFIT */}
            <div className="yz-stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="yz-stat-label">GROSS PROFIT</span>
                <TrendingUp size={14} style={{ color: '#16A34A' }} />
              </div>
              <span className="yz-stat-value tabular-nums" style={{ color: '#16A34A' }}>
                {salesCalculations.ordersCount === 0 ? '—' : `₹${salesCalculations.grossProfit.toLocaleString('en-IN')}`}
              </span>
              <span className="yz-stat-subtext">
                {salesCalculations.ordersCount === 0
                  ? 'Profit calculated when sales exist'
                  : `${salesCalculations.grossMargin.toFixed(1)}% margin (Net Sales − COGS)`}
              </span>
            </div>

            {/* INVENTORY VALUE */}
            <div className="yz-stat-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="yz-stat-label">INVENTORY VALUE</span>
                <Package size={14} style={{ color: 'var(--yz-gold, #B45309)' }} />
              </div>
              <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-gold, #B45309)' }}>
                ₹{inventorySummary.valuationCost.toLocaleString('en-IN')}
              </span>
              <span className="yz-stat-subtext">
                Current stock at cost ({inventorySummary.totalUnits.toLocaleString('en-IN')} units)
              </span>
            </div>
          </div>

          {/* 3. SALES TREND CHART */}
          <div className="yz-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
                  Sales Trend
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--yz-text-secondary)' }}>
                  Daily completed sales activity (excludes voided/cancelled transactions)
                </span>
              </div>

              {/* Trend KPIs & Period Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'var(--yz-bg-base, #F8FAFC)',
                    padding: '3px 10px',
                    borderRadius: 'var(--yz-radius-sm)',
                    border: '1px solid var(--yz-border)',
                    fontSize: '11px',
                  }}
                >
                  <span>
                    Total Sales:{' '}
                    <strong style={{ color: 'var(--yz-text-primary)' }}>
                      ₹{trendData.totalSales.toLocaleString('en-IN')}
                    </strong>
                  </span>
                  <span>
                    Orders:{' '}
                    <strong style={{ color: 'var(--yz-text-primary)' }}>
                      {trendData.ordersCount}
                    </strong>
                  </span>
                  <span>
                    Avg Order Value:{' '}
                    <strong style={{ color: 'var(--yz-text-primary)' }}>
                      ₹{trendData.avgOrderVal.toLocaleString('en-IN')}
                    </strong>
                  </span>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    border: '1px solid var(--yz-border)',
                    borderRadius: 'var(--yz-radius-sm)',
                    overflow: 'hidden',
                  }}
                >
                  {(['7D', '30D', '3M', 'YEAR'] as TrendPeriod[]).map((tp) => (
                    <button
                      key={tp}
                      type="button"
                      onClick={() => setTrendPeriod(tp)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: trendPeriod === tp ? 600 : 500,
                        backgroundColor: trendPeriod === tp ? 'var(--yz-primary)' : 'var(--yz-bg-surface)',
                        color: trendPeriod === tp ? '#FFFFFF' : 'var(--yz-text-secondary)',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {tp === '7D'
                        ? 'Last 7 Days'
                        : tp === '30D'
                        ? 'Last 30 Days'
                        : tp === '3M'
                        ? 'Last 3 Months'
                        : 'This Year'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* SVG Interactive Trend Bar Chart */}
            {trendData.totalSales === 0 ? (
              <div
                style={{
                  height: '140px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'var(--yz-bg-base, #FAFAFA)',
                  borderRadius: 'var(--yz-radius-sm)',
                  border: '1px dashed var(--yz-border)',
                  color: 'var(--yz-text-muted)',
                  fontSize: '12px',
                }}
              >
                No sales recorded for this trend period.
              </div>
            ) : (
              <div style={{ position: 'relative', marginTop: '4px' }}>
                <svg
                  viewBox={`0 0 ${trendData.buckets.length * 28} 140`}
                  style={{ width: '100%', height: '140px', overflow: 'visible' }}
                >
                  {/* Subtle Guideline Lines */}
                  <line
                    x1="0"
                    y1="30"
                    x2={trendData.buckets.length * 28}
                    y2="30"
                    stroke="var(--yz-border)"
                    strokeDasharray="2,2"
                    strokeWidth="0.8"
                  />
                  <line
                    x1="0"
                    y1="75"
                    x2={trendData.buckets.length * 28}
                    y2="75"
                    stroke="var(--yz-border)"
                    strokeDasharray="2,2"
                    strokeWidth="0.8"
                  />
                  <line
                    x1="0"
                    y1="120"
                    x2={trendData.buckets.length * 28}
                    y2="120"
                    stroke="var(--yz-border)"
                    strokeWidth="1"
                  />

                  {/* Daily / Interval Bars */}
                  {trendData.buckets.map((b, idx) => {
                    const barHeight = b.sales > 0 ? Math.max(6, (b.sales / trendData.maxSales) * 105) : 0;
                    const x = idx * 28 + 4;
                    const y = 120 - barHeight;
                    const isHovered = hoveredTrendBar?.date === b.dateStr;

                    return (
                      <g
                        key={b.dateStr}
                        onMouseEnter={() =>
                          setHoveredTrendBar({
                            date: b.dateStr,
                            sales: b.sales,
                            orders: b.orders,
                          })
                        }
                        onMouseLeave={() => setHoveredTrendBar(null)}
                        style={{ cursor: 'pointer' }}
                      >
                        {/* Interactive backdrop area */}
                        <rect x={idx * 28} y={10} width={28} height={110} fill="transparent" />

                        {/* Bar */}
                        {barHeight > 0 && (
                          <rect
                            x={x}
                            y={y}
                            width={20}
                            height={barHeight}
                            rx={2}
                            fill={isHovered ? 'var(--yz-primary)' : 'rgba(136, 19, 55, 0.78)'}
                            style={{ transition: 'fill 0.15s ease' }}
                          />
                        )}

                        {/* Date label (spaced out) */}
                        {(idx % Math.ceil(trendData.buckets.length / 10) === 0 ||
                          idx === trendData.buckets.length - 1) && (
                          <text
                            x={x + 10}
                            y={134}
                            fontSize="8.5"
                            textAnchor="middle"
                            fill="var(--yz-text-muted)"
                          >
                            {b.label}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Hover Tooltip Overlay */}
                {hoveredTrendBar && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '12px',
                      backgroundColor: 'var(--yz-bg-surface)',
                      padding: '4px 8px',
                      borderRadius: 'var(--yz-radius-sm)',
                      border: '1px solid var(--yz-border)',
                      fontSize: '11px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                      pointerEvents: 'none',
                    }}
                  >
                    <span>
                      <strong>{hoveredTrendBar.date}</strong>: ₹{hoveredTrendBar.sales.toLocaleString('en-IN')}{' '}
                      ({hoveredTrendBar.orders} orders)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4. THIRD ROW: GROSS PROFIT BREAKDOWN | PAYMENT SUMMARY */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '10px',
            }}
          >
            {/* GROSS PROFIT & MARGIN BREAKDOWN */}
            <div className="yz-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
                  Gross Profit & Margin
                </h3>
                <span
                  style={{
                    fontSize: '10.5px',
                    color: '#065F46',
                    backgroundColor: '#ECFDF5',
                    padding: '1px 6px',
                    borderRadius: 'var(--yz-radius-sm)',
                    fontWeight: 600,
                  }}
                >
                  Item-Level Costing
                </span>
              </div>

              {salesCalculations.ordersCount === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
                  No sales recorded for this period.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--yz-text-secondary)' }}>Gross Sales</span>
                    <span className="tabular-nums font-mono" style={{ fontWeight: 600 }}>
                      ₹{salesCalculations.grossSales.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--yz-text-secondary)' }}>Discounts & Price Adjustments</span>
                    <span className="tabular-nums font-mono" style={{ color: '#DC2626' }}>
                      −₹{salesCalculations.totalDiscounts.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      paddingTop: '4px',
                      borderTop: '1px solid var(--yz-border)',
                    }}
                  >
                    <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>Net Sales</span>
                    <span className="tabular-nums font-mono" style={{ fontWeight: 600 }}>
                      ₹{salesCalculations.netSales.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: 'var(--yz-text-secondary)' }}>
                      Cost of Goods Sold (COGS)
                    </span>
                    <span className="tabular-nums font-mono" style={{ color: '#B45309' }}>
                      −₹{salesCalculations.cogs.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      paddingTop: '6px',
                      marginTop: '2px',
                      borderTop: '2px solid var(--yz-border)',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                        Gross Profit
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginLeft: '6px' }}>
                        ({salesCalculations.grossMargin.toFixed(1)}% margin)
                      </span>
                    </div>
                    <span
                      className="tabular-nums font-mono"
                      style={{ fontSize: '15px', fontWeight: 700, color: '#16A34A' }}
                    >
                      ₹{salesCalculations.grossProfit.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {salesCalculations.missingCostItems > 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: '#FFFBEB',
                        padding: '6px 8px',
                        borderRadius: 'var(--yz-radius-sm)',
                        fontSize: '11px',
                        color: '#92400E',
                        marginTop: '4px',
                      }}
                    >
                      <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                      <span>
                        Gross profit unavailable for {salesCalculations.missingCostItems} sold item(s) because product
                        cost data is missing.
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '11px',
                        color: 'var(--yz-text-muted)',
                        marginTop: '4px',
                      }}
                    >
                      <CheckCircle2 size={12} style={{ color: '#16A34A' }} />
                      <span>COGS derived from individual product procurement costs at point of sale.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* PAYMENT SUMMARY */}
            <div className="yz-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
                  Payment Collections
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--yz-text-secondary)' }}>
                  Actual transaction ledger records
                </span>
              </div>

              {paymentSummary.count === 0 && paymentSummary.pendingCustomerPayments === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
                  No payments recorded for this period.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'var(--yz-bg-base, #F8FAFC)',
                      padding: '8px 10px',
                      borderRadius: 'var(--yz-radius-sm)',
                    }}
                  >
                    <div>
                      <span className="yz-stat-label" style={{ fontSize: '10.5px' }}>Total Collections</span>
                      <div
                        className="tabular-nums font-mono"
                        style={{ fontSize: '15px', fontWeight: 700, color: 'var(--yz-primary)' }}
                      >
                        ₹{paymentSummary.totalCollected.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="yz-stat-label" style={{ fontSize: '10.5px' }}>Pending Receivables</span>
                      <div
                        className="tabular-nums font-mono"
                        style={{ fontSize: '13px', fontWeight: 600, color: paymentSummary.pendingCustomerPayments > 0 ? '#DC2626' : 'var(--yz-text-secondary)' }}
                      >
                        ₹{paymentSummary.pendingCustomerPayments.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--yz-text-secondary)' }}>Cash</span>
                      <span className="tabular-nums font-mono" style={{ fontWeight: 600 }}>
                        ₹{paymentSummary.cashTotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: 'var(--yz-text-secondary)' }}>UPI (GPay / PhonePe / QR)</span>
                      <span className="tabular-nums font-mono" style={{ fontWeight: 600 }}>
                        ₹{paymentSummary.upiTotal.toLocaleString('en-IN')}
                      </span>
                    </div>

                    {paymentSummary.netBankingTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--yz-text-secondary)' }}>Net Banking / Bank Transfer</span>
                        <span className="tabular-nums font-mono" style={{ fontWeight: 600 }}>
                          ₹{paymentSummary.netBankingTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}

                    {paymentSummary.cardTotal > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                        <span style={{ color: 'var(--yz-text-secondary)' }}>
                          Card <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>(Historical)</span>
                        </span>
                        <span className="tabular-nums font-mono" style={{ fontWeight: 600 }}>
                          ₹{paymentSummary.cardTotal.toLocaleString('en-IN')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      color: 'var(--yz-text-muted)',
                      marginTop: '4px',
                    }}
                  >
                    <Info size={11} />
                    <span>Payment records are the sole source of truth; voided orders excluded.</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. FOURTH ROW: INVENTORY SUMMARY | LOW STOCK TABLE */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '10px',
            }}
          >
            {/* INVENTORY / STOCK REPORT */}
            <div className="yz-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
                  Inventory & Stock Valuation
                </h3>
                <span
                  style={{
                    fontSize: '10.5px',
                    color: 'var(--yz-text-secondary)',
                    backgroundColor: 'var(--yz-bg-base, #F1F5F9)',
                    padding: '1px 6px',
                    borderRadius: 'var(--yz-radius-sm)',
                    fontWeight: 500,
                  }}
                >
                  Live Catalog Snapshot
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px',
                  backgroundColor: 'var(--yz-bg-base, #F8FAFC)',
                  padding: '8px',
                  borderRadius: 'var(--yz-radius-sm)',
                }}
              >
                <div>
                  <span className="yz-stat-label" style={{ fontSize: '10.5px' }}>Total Units in Stock</span>
                  <div className="tabular-nums font-mono" style={{ fontSize: '14px', fontWeight: 700 }}>
                    {inventorySummary.totalUnits.toLocaleString('en-IN')} units
                  </div>
                </div>

                <div>
                  <span className="yz-stat-label" style={{ fontSize: '10.5px' }}>Active Catalog SKUs</span>
                  <div className="tabular-nums font-mono" style={{ fontSize: '14px', fontWeight: 700 }}>
                    {inventorySummary.activeSkusCount} products
                  </div>
                </div>

                <div>
                  <span className="yz-stat-label" style={{ fontSize: '10.5px' }}>Inventory Cost Value</span>
                  <div className="tabular-nums font-mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-gold, #B45309)' }}>
                    ₹{inventorySummary.valuationCost.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <span className="yz-stat-label" style={{ fontSize: '10.5px' }}>Inventory Retail Value</span>
                  <div className="tabular-nums font-mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                    ₹{inventorySummary.valuationRetail.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', marginTop: '2px' }}>
                <span style={{ color: 'var(--yz-text-secondary)' }}>Unrealized Inventory Margin:</span>
                <strong className="tabular-nums font-mono" style={{ color: '#16A34A' }}>
                  ₹{inventorySummary.potentialMargin.toLocaleString('en-IN')}
                </strong>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    backgroundColor: inventorySummary.lowStockCount > 0 ? '#FFFBEB' : 'var(--yz-bg-base)',
                    borderRadius: 'var(--yz-radius-sm)',
                    fontSize: '11px',
                    color: inventorySummary.lowStockCount > 0 ? '#92400E' : 'var(--yz-text-secondary)',
                  }}
                >
                  <AlertTriangle size={12} />
                  <span>Low Stock: <strong>{inventorySummary.lowStockCount}</strong></span>
                </div>

                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 8px',
                    backgroundColor: inventorySummary.outOfStockCount > 0 ? '#FEF2F2' : 'var(--yz-bg-base)',
                    borderRadius: 'var(--yz-radius-sm)',
                    fontSize: '11px',
                    color: inventorySummary.outOfStockCount > 0 ? '#991B1B' : 'var(--yz-text-secondary)',
                  }}
                >
                  <Package size={12} />
                  <span>Out of Stock: <strong>{inventorySummary.outOfStockCount}</strong></span>
                </div>
              </div>
            </div>

            {/* LOW STOCK REPORT TABLE */}
            <div className="yz-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
                  Low Stock Alert
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--yz-text-secondary)' }}>
                  At or below reorder threshold
                </span>
              </div>

              {lowStockProducts.length === 0 ? (
                <div
                  style={{
                    padding: '28px 0',
                    textAlign: 'center',
                    color: '#065F46',
                    fontSize: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={18} />
                  <span>All products are above their reorder levels.</span>
                </div>
              ) : (
                <div className="yz-table-container">
                  <table className="yz-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>PRODUCT</th>
                        <th style={{ width: '85px' }}>SKU</th>
                        <th style={{ width: '70px', textAlign: 'center' }}>STOCK</th>
                        <th style={{ width: '70px', textAlign: 'center' }}>REORDER</th>
                        <th style={{ width: '85px', textAlign: 'center' }}>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lowStockProducts.map((p) => {
                        const isOut = (p.currentStock || 0) <= 0;
                        return (
                          <tr key={p.id}>
                            <td>
                              <div
                                className="yz-cell-truncate"
                                style={{ fontWeight: 600, color: 'var(--yz-text-primary)', maxWidth: '160px' }}
                                title={p.name}
                              >
                                {p.name}
                              </div>
                            </td>
                            <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px' }}>
                              {p.sku}
                            </td>
                            <td
                              style={{
                                textAlign: 'center',
                                fontWeight: 700,
                                fontFamily: 'var(--yz-font-mono)',
                                color: isOut ? '#DC2626' : '#D97706',
                              }}
                            >
                              {p.currentStock}
                            </td>
                            <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)' }}>
                              {p.reorderPoint}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: 'var(--yz-radius-sm)',
                                  backgroundColor: isOut ? '#FEF2F2' : '#FFFBEB',
                                  color: isOut ? '#991B1B' : '#92400E',
                                  border: isOut ? '1px solid #FECACA' : '1px solid #FDE68A',
                                }}
                              >
                                {isOut ? 'Out of Stock' : 'Low Stock'}
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

          {/* 6. FIFTH ROW: TOP CUSTOMERS | TOP VENDORS */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '10px',
            }}
          >
            {/* TOP CUSTOMERS */}
            <div className="yz-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
                  Customer Insights
                </h3>
                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--yz-text-secondary)' }}>
                  <span>Active: <strong>{customerInsights.activeCount}</strong></span>
                  <span>Repeat: <strong>{customerInsights.repeatCount}</strong></span>
                </div>
              </div>

              {customerInsights.topCustomers.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
                  No customer activity recorded for this period.
                </div>
              ) : (
                <div className="yz-table-container">
                  <table className="yz-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>CUSTOMER</th>
                        <th style={{ width: '75px', textAlign: 'center' }}>ORDERS</th>
                        <th style={{ width: '110px', textAlign: 'right' }}>TOTAL SPEND</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerInsights.topCustomers.map((c, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                              {c.name}
                            </strong>
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)' }}>
                            {c.orders}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 600,
                              fontFamily: 'var(--yz-font-mono)',
                              color: 'var(--yz-text-primary)',
                            }}
                          >
                            ₹{c.spend.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* TOP VENDORS */}
            <div className="yz-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
                  Vendor Insights
                </h3>
                <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--yz-text-secondary)' }}>
                  <span>Active: <strong>{vendorInsights.activeCount}</strong></span>
                  <span>Open POs: <strong>{vendorInsights.openPoCount}</strong></span>
                </div>
              </div>

              {vendorInsights.topVendors.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
                  No vendor purchases recorded for this period.
                </div>
              ) : (
                <div className="yz-table-container">
                  <table className="yz-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th>VENDOR / GUILD</th>
                        <th style={{ width: '75px', textAlign: 'center' }}>RECEIVED</th>
                        <th style={{ width: '115px', textAlign: 'right' }}>PURCHASE VALUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorInsights.topVendors.map((v, idx) => (
                        <tr key={idx}>
                          <td>
                            <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                              {v.name}
                            </strong>
                          </td>
                          <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)' }}>
                            {v.pos}
                          </td>
                          <td
                            style={{
                              textAlign: 'right',
                              fontWeight: 600,
                              fontFamily: 'var(--yz-font-mono)',
                            }}
                          >
                            ₹{v.spend.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* 7. SIXTH ROW: TOP PERFORMING PRODUCTS & WEAVES */}
          <div className="yz-card" style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
                Top Performing Products & Weaves
              </h3>
              <span style={{ fontSize: '11px', color: 'var(--yz-text-secondary)' }}>
                Derived from verified sales orders
              </span>
            </div>

            {topProducts.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
                No product sales recorded for this period.
              </div>
            ) : (
              <div className="yz-table-container">
                <table className="yz-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th>PRODUCT & WEAVE</th>
                      <th style={{ width: '110px' }}>SKU</th>
                      <th style={{ width: '85px', textAlign: 'center' }}>UNITS SOLD</th>
                      <th style={{ width: '130px', textAlign: 'right' }}>REVENUE (₹)</th>
                      <th style={{ width: '120px', textAlign: 'center' }}>PERFORMANCE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, idx) => (
                      <tr key={idx}>
                        <td>
                          <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                            {p.name}
                          </strong>
                        </td>
                        <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px' }}>
                          {p.sku}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)', fontWeight: 600 }}>
                          {p.units}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 600,
                            fontFamily: 'var(--yz-font-mono)',
                          }}
                        >
                          ₹{p.revenue.toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '10.5px',
                              color: '#166534',
                              backgroundColor: '#DCFCE7',
                              padding: '1px 6px',
                              borderRadius: 'var(--yz-radius-sm)',
                              fontWeight: 600,
                            }}
                          >
                            Top Seller #{idx + 1}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
