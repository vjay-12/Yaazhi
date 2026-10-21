import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Scissors,
  CreditCard,
  Package,
  Truck,
  Receipt,
  Users,
  RefreshCw,
  Calendar,
  AlertCircle,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { CustomDropdown, type DropdownOption } from '../../components/common/CustomDropdown';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingState';
import { reportService, type ComprehensiveDashboardData } from '../../services/reportService';
import { reportExporter } from '../../utils/reportExporter';

import { BusinessOverviewTab } from './components/BusinessOverviewTab';
import { SalesBillingTab } from './components/SalesBillingTab';
import { StitchingTailoringTab } from './components/StitchingTailoringTab';
import { PaymentsOutstandingTab } from './components/PaymentsOutstandingTab';
import { ProductsInventoryTab } from './components/ProductsInventoryTab';
import { PurchasingSuppliersTab } from './components/PurchasingSuppliersTab';
import { SuppliesExpensesTab } from './components/SuppliesExpensesTab';
import { CustomersTab } from './components/CustomersTab';

// Financial Period Options
const PERIOD_OPTIONS: DropdownOption[] = [
  { value: 'THIS_MONTH', label: 'This Month' },
  { value: 'TODAY', label: 'Today' },
  { value: 'THIS_WEEK', label: 'This Week' },
  { value: 'LAST_MONTH', label: 'Last Month' },
  { value: 'THIS_YEAR', label: 'This Year' },
  { value: 'ALL_TIME', label: 'All Time' },
  { value: 'CUSTOM', label: 'Custom Range' },
];

type ReportTabId =
  | 'overview'
  | 'sales'
  | 'stitching'
  | 'payments'
  | 'inventory'
  | 'purchasing'
  | 'supplies_expenses'
  | 'customers';

interface ReportTabConfig {
  id: ReportTabId;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

const REPORT_TABS: ReportTabConfig[] = [
  { id: 'overview', label: 'Business Overview', icon: LayoutDashboard },
  { id: 'sales', label: 'Sales & Billing', icon: TrendingUp },
  { id: 'stitching', label: 'Stitching & Tailoring', icon: Scissors },
  { id: 'payments', label: 'Payments & Outstanding', icon: CreditCard },
  { id: 'inventory', label: 'Products & Inventory', icon: Package },
  { id: 'purchasing', label: 'Purchasing & Suppliers', icon: Truck },
  { id: 'supplies_expenses', label: 'Supplies & Expenses', icon: Receipt },
  { id: 'customers', label: 'Customers', icon: Users },
];

export const ReportsPage: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<ReportTabId>('overview');

  // Shared Filter State
  const [period, setPeriod] = useState<string>('THIS_MONTH');
  const [customFrom, setCustomFrom] = useState<string>('');
  const [customTo, setCustomTo] = useState<string>('');

  // Dashboard Data State
  const [data, setData] = useState<ComprehensiveDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Comprehensive Report Data from Live Database
  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await reportService.getComprehensiveDashboard(
        period,
        period === 'CUSTOM' ? customFrom : undefined,
        period === 'CUSTOM' ? customTo : undefined
      );
      setData(res);
    } catch (err: any) {
      console.error('Failed to load comprehensive analytics report:', err);
      setError(err?.message || 'Failed to retrieve report data from server.');
    } finally {
      setIsLoading(false);
    }
  }, [period, customFrom, customTo]);

  // Load data on mount and whenever filters change
  useEffect(() => {
    // Only auto-fetch custom range if both dates are selected or cleared
    if (period === 'CUSTOM' && (!customFrom || !customTo)) {
      return;
    }
    fetchReportData();
  }, [fetchReportData, period, customFrom, customTo]);

  // Human-readable period label
  const periodLabel = useMemo(() => {
    const opt = PERIOD_OPTIONS.find((o) => o.value === period);
    if (period === 'CUSTOM') {
      return customFrom && customTo ? `${customFrom} to ${customTo}` : 'Custom Range';
    }
    return opt?.label || 'This Month';
  }, [period, customFrom, customTo]);

  // Handle CSV Export for active tab
  const handleExportCsv = () => {
    if (!data) return;
    reportExporter.exportCsv(activeTab, periodLabel, data);
  };

  // Handle PDF Export for active tab
  const handleExportPdf = () => {
    if (!data) return;
    reportExporter.exportPdf(activeTab, periodLabel, data);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '16px',
        maxWidth: '1600px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. TOP HEADER & SHARED CONTROLS BAR */}
      <div
        className="yz-card"
        style={{
          padding: '14px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          {/* Title & Description */}
          <div>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--yz-text-primary)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Business Analytics & Performance Reports
            </h1>
            <p
              style={{
                fontSize: '12px',
                color: 'var(--yz-text-secondary)',
                margin: '2px 0 0 0',
              }}
            >
              Authoritative financial intelligence across ready-made sales, custom stitching, collections, inventory, purchases, supplies, and operating expenses.
            </p>
          </div>

          {/* Action Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Financial Period Dropdown */}
            <div style={{ width: '150px' }}>
              <CustomDropdown
                options={PERIOD_OPTIONS}
                value={period}
                onChange={(val) => setPeriod(val)}
              />
            </div>

            {/* Refresh Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchReportData}
              disabled={isLoading}
              title="Refresh Live Financial Data"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={isLoading ? 'yz-spin' : ''} />
              <span>Refresh</span>
            </Button>

            {/* Export CSV Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
              disabled={isLoading || !data}
              title="Export Current Tab Data to CSV Spreadsheet"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileSpreadsheet size={13} style={{ color: '#16a34a' }} />
              <span>Export CSV</span>
            </Button>

            {/* Export PDF Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportPdf}
              disabled={isLoading || !data}
              title="Export Current Tab Data to PDF Report Document"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <FileText size={13} style={{ color: 'var(--yz-primary)' }} />
              <span>Export PDF</span>
            </Button>
          </div>
        </div>

        {/* Custom Date Range Selector (Rendered only when period === 'CUSTOM') */}
        {period === 'CUSTOM' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              backgroundColor: 'var(--yz-bg-subtle)',
              borderRadius: 'var(--yz-radius-md)',
              border: '1px solid var(--yz-border)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--yz-text-secondary)' }}>
              <Calendar size={14} />
              <span>Custom Date Range:</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)' }}>FROM</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--yz-radius-sm)',
                  border: '1px solid var(--yz-border)',
                  backgroundColor: 'var(--yz-bg-surface)',
                  color: 'var(--yz-text-primary)',
                  fontSize: '12px',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)' }}>TO</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{
                  padding: '4px 8px',
                  borderRadius: 'var(--yz-radius-sm)',
                  border: '1px solid var(--yz-border)',
                  backgroundColor: 'var(--yz-bg-surface)',
                  color: 'var(--yz-text-primary)',
                  fontSize: '12px',
                }}
              />
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={fetchReportData}
              disabled={!customFrom || !customTo || isLoading}
            >
              Apply Filter
            </Button>
          </div>
        )}

        {/* 2. REPORT NAVIGATION TABS BAR (8 Modules) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            overflowX: 'auto',
            borderTop: '1px solid var(--yz-border)',
            paddingTop: '10px',
            scrollbarWidth: 'none',
          }}
        >
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 14px',
                  borderRadius: 'var(--yz-radius-md)',
                  border: 'none',
                  backgroundColor: isActive ? 'var(--yz-primary)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--yz-text-secondary)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
              >
                <Icon size={14} style={{ color: isActive ? '#ffffff' : 'currentColor' }} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ERROR BANNER */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'rgba(220, 38, 38, 0.08)',
            border: '1px solid rgba(220, 38, 38, 0.25)',
            borderRadius: 'var(--yz-card-radius)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            color: '#991b1b',
            fontSize: '12.5px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchReportData}>
            Retry Loading
          </Button>
        </div>
      )}

      {/* 4. LOADING STATE */}
      {isLoading && !data && (
        <div style={{ padding: '24px 0' }}>
          <TableSkeleton />
        </div>
      )}

      {/* 5. TAB CONTENT DISPLAY */}
      {data && (
        <div>
          {activeTab === 'overview' && (
            <BusinessOverviewTab
              overview={data.overview}
              sales={data.sales}
              suppliesExpenses={data.supplies_expenses}
              periodLabel={periodLabel}
            />
          )}

          {activeTab === 'sales' && (
            <SalesBillingTab sales={data.sales} periodLabel={periodLabel} />
          )}

          {activeTab === 'stitching' && (
            <StitchingTailoringTab
              stitching={data.stitching}
              periodLabel={periodLabel}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsOutstandingTab
              payments={data.payments}
              periodLabel={periodLabel}
            />
          )}

          {activeTab === 'inventory' && (
            <ProductsInventoryTab inventory={data.inventory} />
          )}

          {activeTab === 'purchasing' && (
            <PurchasingSuppliersTab
              purchasing={data.purchasing}
              periodLabel={periodLabel}
            />
          )}

          {activeTab === 'supplies_expenses' && (
            <SuppliesExpensesTab
              suppliesExpenses={data.supplies_expenses}
              periodLabel={periodLabel}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersTab customers={data.customers} periodLabel={periodLabel} />
          )}
        </div>
      )}
    </div>
  );
};
export default ReportsPage;
