import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const ReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState('This Month');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header filter */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--yz-bg-surface)',
          padding: '1rem',
          borderRadius: 'var(--yz-radius-lg)',
          border: '1px solid var(--yz-border)',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Reporting Period:</span>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="yz-select"
            style={{ width: 'auto' }}
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>Q3 (Oct - Dec 2026)</option>
            <option>Financial Year 2026-27</option>
          </select>
        </div>

        <Button variant="secondary" icon={<Download size={15} />}>
          Export GST GSTR-1 Summary
        </Button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="yz-stat-card">
          <span className="yz-stat-label">Boutique Gross Sales</span>
          <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-primary)' }}>
            ₹3,48,200
          </span>
          <span className="yz-stat-subtext">Across 42 completed counter bills</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Weaver Purchases Billed</span>
          <span className="yz-stat-value tabular-nums">₹1,95,000</span>
          <span className="yz-stat-subtext">Received into stock</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Output GST Collected</span>
          <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-gold)' }}>
            ₹18,450
          </span>
          <span className="yz-stat-subtext">CGST ₹9,225 + SGST ₹9,225</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Average Basket Size</span>
          <span className="yz-stat-value tabular-nums">₹8,290</span>
          <span className="yz-stat-subtext">Per visiting client</span>
        </div>
      </div>

      {/* Best Performing Weaves Table */}
      <div className="yz-card">
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>
          Best Selling Weave Categories
        </h3>
        <div className="yz-table-container" style={{ border: 'none', boxShadow: 'none' }}>
          <table className="yz-table">
            <thead>
              <tr>
                <th>Category</th>
                <th style={{ textAlign: 'center' }}>Units Sold</th>
                <th style={{ textAlign: 'right' }}>Revenue (₹)</th>
                <th style={{ textAlign: 'right' }}>Gross Margin</th>
                <th>Stock Velocity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Kanchipuram Silk Sarees</strong>
                </td>
                <td style={{ textAlign: 'center' }}>12</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-nums">
                  ₹2,14,000
                </td>
                <td style={{ textAlign: 'right', color: 'var(--yz-status-in-stock)', fontWeight: 600 }}>
                  36%
                </td>
                <td>
                  <span className="yz-badge yz-badge-in-stock">Fast Moving</span>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Designer Raw Silk Chudidar Sets</strong>
                </td>
                <td style={{ textAlign: 'center' }}>16</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-nums">
                  ₹84,200
                </td>
                <td style={{ textAlign: 'right', color: 'var(--yz-status-in-stock)', fontWeight: 600 }}>
                  41%
                </td>
                <td>
                  <span className="yz-badge yz-badge-in-stock">Fast Moving</span>
                </td>
              </tr>
              <tr>
                <td>
                  <strong>Chettinad Cotton Sarees</strong>
                </td>
                <td style={{ textAlign: 'center' }}>18</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }} className="tabular-nums">
                  ₹33,300
                </td>
                <td style={{ textAlign: 'right', color: 'var(--yz-status-in-stock)', fontWeight: 600 }}>
                  38%
                </td>
                <td>
                  <span className="yz-badge yz-badge-gold">Steady</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
