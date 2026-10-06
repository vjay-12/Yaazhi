import React, { useState, useEffect } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { CustomDropdown, type DropdownOption } from '../../components/common/CustomDropdown';
import { reportService, type ReportDashboardData } from '../../services/reportService';

const DATE_RANGE_OPTIONS: DropdownOption[] = [
  { value: 'All Time (Live DB)', label: 'All Time (Live DB)' },
  { value: 'Today', label: 'Today' },
  { value: 'This Month', label: 'This Month' },
  { value: 'Financial Year 2026-27', label: 'Financial Year 2026-27' },
];

export const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('All Time (Live DB)');
  const [reportData, setReportData] = useState<ReportDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    reportService
      .getDashboard()
      .then(setReportData)
      .catch((e) => console.error('Error fetching reports:', e))
      .finally(() => setIsLoading(false));
  }, []);

  const summary = reportData?.summary;
  const topProducts = reportData?.topProducts || [];

  const totalSales = summary?.totalSalesRevenue || 0;
  const totalPurchases = summary?.totalPurchasesSpend || 0;
  const totalOrders = summary?.totalOrders || 0;
  const avgBasketSize = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  const estimatedGst = Math.round((totalSales * 0.05) / 1.05);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Header filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--yz-bg-surface)',
          padding: '8px 10px',
          borderRadius: 'var(--yz-radius-sm)',
          border: '1px solid var(--yz-border)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
            Financial Period:
          </span>
          <CustomDropdown
            value={dateRange}
            onChange={(val) => setDateRange(val as string)}
            options={DATE_RANGE_OPTIONS}
            minWidth="160px"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<Download size={13} />}
          onClick={() => {
            const jsonStr = JSON.stringify(reportData, null, 2);
            const blob = new Blob([jsonStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `yaazhi_financial_report_${Date.now()}.json`;
            a.click();
          }}
        >
          Export Financial Ledger (JSON)
        </Button>
      </div>

      {/* Real Live KPI Cards calculated from DB */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px' }}>
        <div className="yz-stat-card">
          <span className="yz-stat-label">Boutique Gross Sales</span>
          <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-primary)' }}>
            {isLoading ? '...' : `₹${totalSales.toLocaleString('en-IN')}`}
          </span>
          <span className="yz-stat-subtext">Across {summary?.totalOrders || 0} customer orders</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Weaver Purchases Billed</span>
          <span className="yz-stat-value tabular-nums">
            {isLoading ? '...' : `₹${totalPurchases.toLocaleString('en-IN')}`}
          </span>
          <span className="yz-stat-subtext">Received into inventory stock</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Inventory Valuation (Cost)</span>
          <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-gold)' }}>
            {isLoading ? '...' : `₹${(summary?.valuationCost || 0).toLocaleString('en-IN')}`}
          </span>
          <span className="yz-stat-subtext">{summary?.totalStockUnits || 0} units on hand across counters</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Average Basket Size</span>
          <span className="yz-stat-value tabular-nums">
            {isLoading ? '...' : `₹${avgBasketSize.toLocaleString('en-IN')}`}
          </span>
          <span className="yz-stat-subtext">Estimated GST collected: ₹{estimatedGst.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Best Performing Weaves Table from DB transactions */}
      <div className="yz-card" style={{ padding: '10px' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 600, marginBottom: '8px' }}>
          Top Performing Saree & Garment Weaves (Database Transactions)
        </h3>
        <div className="yz-table-container">
          <table className="yz-table">
            <thead>
              <tr>
                <th>Product / Weave</th>
                <th style={{ width: '100px' }}>SKU</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Units Sold</th>
                <th style={{ textAlign: 'right', width: '130px' }}>Revenue (₹)</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Performance</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Computing real financial metrics from database...</span>
                    </div>
                  </td>
                </tr>
              ) : topProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--yz-text-muted)' }}>
                    No sales orders or bills recorded yet. Complete a bill or sales order to see live revenue breakdown.
                  </td>
                </tr>
              ) : (
                topProducts.map((p, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                        {p.name}
                      </strong>
                    </td>
                    <td style={{ fontFamily: 'var(--yz-font-mono)' }}>{p.sku}</td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)' }}>{p.units}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
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
                        Active Seller
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
