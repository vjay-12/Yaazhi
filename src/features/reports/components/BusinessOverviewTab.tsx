import React from 'react';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Package,
  Layers,
  ArrowUpRight,
  Info,
  CheckCircle2,
  Receipt,
  Scissors,
} from 'lucide-react';
import type { BusinessOverviewData, SalesReportData, SuppliesExpensesReportData } from '../../../services/reportService';

interface BusinessOverviewTabProps {
  overview: BusinessOverviewData;
  sales: SalesReportData;
  suppliesExpenses: SuppliesExpensesReportData;
  periodLabel: string;
}

export const BusinessOverviewTab: React.FC<BusinessOverviewTabProps> = ({
  overview,
  sales,
  suppliesExpenses,
  periodLabel,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. TOP EXECUTIVE KPI GRID (10 Compact Cards) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Card 1: Gross Sales */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Gross Sales
            </span>
            <TrendingUp size={15} style={{ color: 'var(--yz-text-muted)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(overview.gross_sales).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            {overview.orders_count} valid orders in {periodLabel}
          </div>
        </div>

        {/* Card 2: Discounts & Returns */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Discounts Given
            </span>
            <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>Deduction</span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: overview.discounts_total > 0 ? '#b45309' : 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(overview.discounts_total).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Applied across billing transactions
          </div>
        </div>

        {/* Card 3: Net Sales */}
        <div className="yz-card" style={{ padding: '12px 14px', borderLeft: '3px solid var(--yz-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-primary)', textTransform: 'uppercase' }}>
              Net Sales (Revenue)
            </span>
            <ArrowUpRight size={15} style={{ color: 'var(--yz-primary)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(overview.net_sales).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            AOV: ₹{Math.round(overview.average_order_value).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Card 4: Successful Payments Collected */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Collections Cleared
            </span>
            <CreditCard size={15} style={{ color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(overview.successful_collections).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Verified Cash, UPI & Card payments
          </div>
        </div>

        {/* Card 5: Outstanding Customer Balances */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Customer Receivables
            </span>
            <AlertTriangle size={15} style={{ color: overview.outstanding_customer_balances > 0 ? '#dc2626' : '#16a34a' }} />
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: overview.outstanding_customer_balances > 0 ? '#dc2626' : 'var(--yz-text-primary)',
              marginTop: '4px',
              fontFamily: 'var(--yz-font-mono)',
            }}
          >
            ₹{Math.round(overview.outstanding_customer_balances).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Pending balance on sales orders
          </div>
        </div>

        {/* Card 6: Cost of Goods Sold (COGS) */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Cost of Goods Sold
            </span>
            <Package size={15} style={{ color: 'var(--yz-text-muted)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(overview.cost_of_goods_sold).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Physical product purchase cost
          </div>
        </div>

        {/* Card 7: Gross Profit & Margin */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Gross Profit & Margin
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(22, 163, 74, 0.1)' }}>
              {overview.gross_margin_pct.toFixed(1)}%
            </span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(overview.gross_profit).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Net Sales less Inventory COGS
          </div>
        </div>

        {/* Card 8: Operating Expenses */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Operating Expenses
            </span>
            <Receipt size={15} style={{ color: '#d97706' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(overview.operating_expenses).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Rent, utilities, tailor wages, logistics
          </div>
        </div>

        {/* Card 9: Current Inventory Valuation at Cost */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Stock Value at Cost
            </span>
            <Layers size={15} style={{ color: 'var(--yz-text-muted)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(overview.current_inventory_valuation_cost).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            {overview.total_stock_units} units ready-made inventory
          </div>
        </div>

        {/* Card 10: Low Stock Alerts */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Low Stock Items
            </span>
            <AlertTriangle
              size={15}
              style={{
                color: overview.low_stock_items_count > 0 ? '#d97706' : '#16a34a',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: overview.low_stock_items_count > 0 ? '#d97706' : '#16a34a',
              marginTop: '4px',
              fontFamily: 'var(--yz-font-mono)',
            }}
          >
            {overview.low_stock_items_count}{' '}
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--yz-text-muted)' }}>
              ({overview.out_of_stock_items_count} depleted)
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Current SKUs below reorder threshold
          </div>
        </div>
      </div>

      {/* 2. REVENUE VS PROFITABILITY & EXPENSE SURPLUS BREAKDOWN */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Card A: Financial Performance & Operating Surplus */}
        <div className="yz-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
              Operating Surplus & Profit Reconciliation
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>{periodLabel}</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--yz-border)' }}>
              <span style={{ color: 'var(--yz-text-secondary)' }}>Net Sales Revenue</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>₹{Math.round(overview.net_sales).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--yz-border)' }}>
              <span style={{ color: 'var(--yz-text-secondary)' }}>Less: Cost of Goods Sold (Physical Stock)</span>
              <span style={{ fontWeight: 600, color: '#dc2626', fontFamily: 'var(--yz-font-mono)' }}>- ₹{Math.round(overview.cost_of_goods_sold).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--yz-border)', backgroundColor: 'var(--yz-bg-subtle)', borderRadius: '4px', paddingLeft: '8px', paddingRight: '8px' }}>
              <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>Gross Profit (Margin: {overview.gross_margin_pct.toFixed(1)}%)</span>
              <span style={{ fontWeight: 700, color: '#16a34a', fontFamily: 'var(--yz-font-mono)' }}>₹{Math.round(overview.gross_profit).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--yz-border)' }}>
              <span style={{ color: 'var(--yz-text-secondary)' }}>Less: Boutique Operating Expenses</span>
              <span style={{ fontWeight: 600, color: '#dc2626', fontFamily: 'var(--yz-font-mono)' }}>- ₹{Math.round(overview.operating_expenses).toLocaleString('en-IN')}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '6px',
                backgroundColor: overview.operating_surplus >= 0 ? 'rgba(22, 163, 74, 0.08)' : 'rgba(220, 38, 38, 0.08)',
                border: overview.operating_surplus >= 0 ? '1px solid rgba(22, 163, 74, 0.2)' : '1px solid rgba(220, 38, 38, 0.2)',
              }}
            >
              <span style={{ fontWeight: 700, color: overview.operating_surplus >= 0 ? '#166534' : '#991b1b' }}>
                Net Operating Surplus
              </span>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '14px',
                  fontFamily: 'var(--yz-font-mono)',
                  color: overview.operating_surplus >= 0 ? '#166534' : '#991b1b',
                }}
              >
                ₹{Math.round(overview.operating_surplus).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            <Info size={13} />
            <span>Operating surplus represents Gross Profit after boutique operating overheads.</span>
          </div>
        </div>

        {/* Card B: Revenue Streams & Asset Valuation Breakdown */}
        <div className="yz-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
              Boutique Revenue Mix & Current Assets
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>Current Status</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Ready Made vs Stitching bar */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Package size={13} style={{ color: 'var(--yz-primary)' }} /> Ready-Made Products
                </span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{Math.round(sales.ready_made_revenue).toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Scissors size={13} style={{ color: '#0284c7' }} /> Tailoring & Custom Stitching
                </span>
                <span style={{ fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{Math.round(sales.stitching_revenue).toLocaleString('en-IN')}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--yz-bg-subtle)', borderRadius: '4px', display: 'flex', overflow: 'hidden' }}>
                {overview.net_sales > 0 && (
                  <>
                    <div
                      style={{
                        width: `${Math.round((sales.ready_made_revenue / overview.net_sales) * 100)}%`,
                        backgroundColor: 'var(--yz-primary)',
                      }}
                      title={`Ready-Made: ₹${Math.round(sales.ready_made_revenue).toLocaleString('en-IN')}`}
                    />
                    <div
                      style={{
                        width: `${Math.round((sales.stitching_revenue / overview.net_sales) * 100)}%`,
                        backgroundColor: '#0284c7',
                      }}
                      title={`Stitching: ₹${Math.round(sales.stitching_revenue).toLocaleString('en-IN')}`}
                    />
                  </>
                )}
              </div>
            </div>

            {/* Asset Valuation Block */}
            <div style={{ padding: '10px', backgroundColor: 'var(--yz-bg-subtle)', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                Boutique Capitalized Current Assets (At Cost)
              </span>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>Ready-Made Garments Stock:</span>
                <strong style={{ fontFamily: 'var(--yz-font-mono)' }}>₹{Math.round(overview.current_inventory_valuation_cost).toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>Consumables & Supplies Stock ({suppliesExpenses.total_active_supplies} items):</span>
                <strong style={{ fontFamily: 'var(--yz-font-mono)' }}>₹{Math.round(overview.current_supplies_stock_valuation).toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', borderTop: '1px solid var(--yz-border)', paddingTop: '4px' }}>
                <span style={{ fontWeight: 600 }}>Total Asset Valuation at Cost:</span>
                <strong style={{ fontWeight: 700, color: 'var(--yz-primary)', fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{Math.round(overview.current_inventory_valuation_cost + overview.current_supplies_stock_valuation).toLocaleString('en-IN')}
                </strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            <CheckCircle2 size={13} style={{ color: '#16a34a' }} />
            <span>Inventory is valued at cost; stock purchases are capitalized rather than treated as period expenses.</span>
          </div>
        </div>
      </div>

      {/* 3. ACCOUNTING SOURCE-OF-TRUTH NOTICE */}
      <div
        style={{
          padding: '10px 14px',
          borderRadius: 'var(--yz-radius-md)',
          backgroundColor: 'var(--yz-bg-surface)',
          border: '1px solid var(--yz-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '11.5px',
          color: 'var(--yz-text-secondary)',
        }}
      >
        <Info size={16} style={{ color: 'var(--yz-primary)', flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--yz-text-primary)' }}>Financial Audit Integrity:</strong>{' '}
          {overview.accounting_note}
        </div>
      </div>
    </div>
  );
};
