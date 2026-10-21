import React from 'react';
import {
  Package,
  Receipt,
  AlertTriangle,
  TrendingDown,
  Layers,
  Info,
  Calendar,
} from 'lucide-react';
import type { SuppliesExpensesReportData } from '../../../services/reportService';

interface SuppliesExpensesTabProps {
  suppliesExpenses: SuppliesExpensesReportData;
  periodLabel: string;
}

export const SuppliesExpensesTab: React.FC<SuppliesExpensesTabProps> = ({
  suppliesExpenses,
  periodLabel,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. SUPPLIES & EXPENSES KPI CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Consumables Stock Valuation (Asset) */}
        <div className="yz-card" style={{ padding: '12px 14px', borderLeft: '3px solid #0284c7' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#0284c7', textTransform: 'uppercase' }}>
              Consumables Stock Value
            </span>
            <Layers size={15} style={{ color: '#0284c7' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(suppliesExpenses.current_consumables_stock_valuation).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            {suppliesExpenses.total_active_supplies} active items (buttons, zips, lining)
          </div>
        </div>

        {/* Low Stock Consumables */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Low Stock Supplies
            </span>
            <AlertTriangle
              size={15}
              style={{
                color: suppliesExpenses.low_stock_supplies_count > 0 ? '#d97706' : '#16a34a',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: suppliesExpenses.low_stock_supplies_count > 0 ? '#d97706' : '#16a34a',
              marginTop: '4px',
              fontFamily: 'var(--yz-font-mono)',
            }}
          >
            {suppliesExpenses.low_stock_supplies_count}{' '}
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--yz-text-secondary)' }}>items</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Below minimum reorder threshold
          </div>
        </div>

        {/* Period Supplies Purchases */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Period Supplies Purchased
            </span>
            <Package size={15} style={{ color: 'var(--yz-text-muted)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(suppliesExpenses.supplies_purchased_in_period).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            {suppliesExpenses.supplies_purchases_count} purchase orders received
          </div>
        </div>

        {/* Operating Expenses Total (Period Expense) */}
        <div className="yz-card" style={{ padding: '12px 14px', borderLeft: '3px solid #dc2626' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase' }}>
              Boutique Operating Expenses
            </span>
            <Receipt size={15} style={{ color: '#dc2626' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(suppliesExpenses.operating_expenses_total).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Expensed immediately in {periodLabel}
          </div>
        </div>

        {/* Consumables Used in Stitching */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Stitching Consumptions
            </span>
            <TrendingDown size={15} style={{ color: 'var(--yz-text-muted)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(suppliesExpenses.consumed_estimated_value).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            {suppliesExpenses.stitching_linked_consumptions_count} consumptions linked to orders
          </div>
        </div>
      </div>

      {/* 2. ACCOUNTING SEPARATION NOTICE */}
      <div
        style={{
          padding: '12px 16px',
          borderRadius: 'var(--yz-radius-md)',
          backgroundColor: 'var(--yz-bg-surface)',
          border: '1px solid var(--yz-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Info size={16} style={{ color: 'var(--yz-primary)' }} />
          <strong style={{ fontSize: '12.5px', color: 'var(--yz-text-primary)' }}>
            Explicit Accounting Separation: Asset Capitalization vs Period Operating Expense
          </strong>
        </div>
        <p style={{ margin: 0, fontSize: '11.5px', color: 'var(--yz-text-secondary)', lineHeight: 1.5 }}>
          To prevent double-counting: <strong>Consumable supplies purchases</strong> (₹{Math.round(suppliesExpenses.supplies_purchased_in_period).toLocaleString('en-IN')}) are capitalized as current inventory assets upon receipt and recognized as costs only when consumed in tailoring. <strong>Operating expenses</strong> (₹{Math.round(suppliesExpenses.operating_expenses_total).toLocaleString('en-IN')} covering rent, electricity, maintenance, logistics) are non-capital overheads expensed immediately against operating surplus.
        </p>
      </div>

      {/* 3. OPERATING EXPENSES BY CATEGORY & MONTHLY TREND */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Expenses by Category */}
        <div className="yz-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
              Operating Expenses by Category
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
              {suppliesExpenses.expenses_by_category.length} categories
            </span>
          </div>

          {suppliesExpenses.expenses_by_category.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
              No operating expenses recorded for this period.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {suppliesExpenses.expenses_by_category.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                      {cat.category} <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', fontWeight: 400 }}>({cat.count} vouchers)</span>
                    </span>
                    <span style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600 }}>
                      ₹{Math.round(cat.amount).toLocaleString('en-IN')}{' '}
                      <span style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', fontWeight: 400 }}>
                        ({cat.percentage.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--yz-bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.round(cat.percentage))}%`,
                        height: '100%',
                        backgroundColor: '#dc2626',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Expense Trend */}
        <div className="yz-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
              Monthly Operating Expense Trend
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
              Overhead evolution
            </span>
          </div>

          {suppliesExpenses.monthly_expense_trend.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
              No monthly expense trend data.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {suppliesExpenses.monthly_expense_trend.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--yz-bg-subtle)',
                    fontSize: '12px',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} style={{ color: 'var(--yz-text-muted)' }} /> {m.month}
                  </span>
                  <strong style={{ fontFamily: 'var(--yz-font-mono)', color: '#dc2626' }}>
                    ₹{Math.round(m.amount).toLocaleString('en-IN')}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. RECENT OPERATING EXPENSES LEDGER */}
      <div className="yz-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
            Recent Operating Expense Vouchers ({suppliesExpenses.recent_expenses.length} Records)
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Active operating costs
          </span>
        </div>

        {suppliesExpenses.recent_expenses.length === 0 ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
            No expense vouchers found for this period.
          </div>
        ) : (
          <div className="yz-table-container">
            <table className="yz-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>VOUCHER #</th>
                  <th style={{ width: '100px' }}>DATE</th>
                  <th>EXPENSE TITLE</th>
                  <th style={{ width: '130px' }}>CATEGORY</th>
                  <th style={{ width: '140px' }}>PAYEE / VENDOR</th>
                  <th style={{ width: '110px' }}>METHOD</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {suppliesExpenses.recent_expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600 }}>{exp.expense_number}</td>
                    <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>{exp.expense_date}</td>
                    <td>
                      <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{exp.title}</strong>
                    </td>
                    <td style={{ fontSize: '11.5px' }}>{exp.category}</td>
                    <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>{exp.payee_name || '-'}</td>
                    <td>
                      <span style={{ fontSize: '10.5px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--yz-bg-subtle)' }}>
                        {exp.payment_method}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#dc2626', fontFamily: 'var(--yz-font-mono)' }}>
                      ₹{Math.round(exp.amount).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
