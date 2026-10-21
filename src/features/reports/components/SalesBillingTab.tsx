import React, { useState } from 'react';
import {
  TrendingUp,
  Package,
  Scissors,
  Receipt,
  AlertTriangle,
  Percent,
} from 'lucide-react';
import type { SalesReportData } from '../../../services/reportService';

interface SalesBillingTabProps {
  sales: SalesReportData;
  periodLabel: string;
}

export const SalesBillingTab: React.FC<SalesBillingTabProps> = ({ sales, periodLabel }) => {
  const [hoveredTrendBar, setHoveredTrendBar] = useState<{
    date: string;
    sales: number;
    orders: number;
  } | null>(null);

  const [activeSubView, setActiveSubView] = useState<'transactions' | 'bestsellers' | 'voided'>('transactions');

  // Find max daily sales for relative bar chart heights
  const maxDailySales = Math.max(1, ...sales.sales_trend.map((d) => d.sales));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. SALES KPI SUMMARY CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Valid Sales Revenue */}
        <div className="yz-card" style={{ padding: '12px 14px', borderLeft: '3px solid var(--yz-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-primary)', textTransform: 'uppercase' }}>
              Valid Sales Revenue
            </span>
            <TrendingUp size={15} style={{ color: 'var(--yz-primary)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(sales.total_sales_revenue).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Excludes voided/cancelled orders
          </div>
        </div>

        {/* Order Volume & AOV */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Orders & Average Order Value
            </span>
            <Receipt size={15} style={{ color: 'var(--yz-text-muted)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            {sales.order_count}{' '}
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--yz-text-secondary)' }}>orders</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            AOV: <strong style={{ fontFamily: 'var(--yz-font-mono)' }}>₹{Math.round(sales.average_order_value).toLocaleString('en-IN')}</strong>
          </div>
        </div>

        {/* Ready-Made Product Sales */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Ready-Made Revenue
            </span>
            <Package size={15} style={{ color: 'var(--yz-text-muted)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(sales.ready_made_revenue).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            {sales.ready_made_units} physical units sold
          </div>
        </div>

        {/* Tailoring & Custom Stitching */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Tailoring & Stitching Revenue
            </span>
            <Scissors size={15} style={{ color: '#0284c7' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0284c7', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(sales.stitching_revenue).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            {sales.stitching_units} service items ordered
          </div>
        </div>

        {/* Discounts & Tax (GST) Summary */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              GST Tax & Discounts
            </span>
            <Percent size={15} style={{ color: 'var(--yz-text-muted)' }} />
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-text-primary)', marginTop: '4px' }}>
            Tax: <span style={{ fontFamily: 'var(--yz-font-mono)' }}>₹{Math.round(sales.tax_total_collected).toLocaleString('en-IN')}</span>
          </div>
          <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px' }}>
            Discounts: ₹{Math.round(sales.discount_total).toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* 2. SALES TREND CHART & CATEGORY BREAKDOWN */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Trend Bar Chart */}
        <div className="yz-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
              Sales Activity Timeline ({periodLabel})
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
              {sales.sales_trend.length} recorded intervals
            </span>
          </div>

          {sales.sales_trend.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
              No sales transactions recorded in this period.
            </div>
          ) : (
            <div>
              {/* Tooltip display */}
              <div
                style={{
                  minHeight: '24px',
                  fontSize: '11px',
                  color: 'var(--yz-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {hoveredTrendBar ? (
                  <span>
                    <strong>{hoveredTrendBar.date}:</strong> ₹{Math.round(hoveredTrendBar.sales).toLocaleString('en-IN')} ({hoveredTrendBar.orders} orders)
                  </span>
                ) : (
                  <span style={{ color: 'var(--yz-text-muted)' }}>Hover over bars to inspect daily revenue</span>
                )}
              </div>

              {/* Bar visualization */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '4px',
                  height: '140px',
                  paddingTop: '10px',
                  borderBottom: '1px solid var(--yz-border)',
                }}
              >
                {sales.sales_trend.map((pt, idx) => {
                  const heightPct = Math.max(4, Math.round((pt.sales / maxDailySales) * 100));
                  return (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredTrendBar(pt)}
                      onMouseLeave={() => setHoveredTrendBar(null)}
                      style={{
                        flex: 1,
                        height: `${heightPct}%`,
                        backgroundColor: hoveredTrendBar?.date === pt.date ? 'var(--yz-primary)' : 'rgba(120, 20, 50, 0.45)',
                        borderRadius: '3px 3px 0 0',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        minWidth: '4px',
                      }}
                    />
                  );
                })}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--yz-text-muted)', marginTop: '4px' }}>
                <span>{sales.sales_trend[0]?.date}</span>
                <span>{sales.sales_trend[sales.sales_trend.length - 1]?.date}</span>
              </div>
            </div>
          )}
        </div>

        {/* Category Revenue Breakdown */}
        <div className="yz-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
              Revenue by Product / Service Category
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
              {sales.revenue_by_category.length} categories
            </span>
          </div>

          {sales.revenue_by_category.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
              No category sales data for this period.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
              {sales.revenue_by_category.map((cat, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: 500, color: 'var(--yz-text-primary)' }}>{cat.category}</span>
                    <span style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600 }}>
                      ₹{Math.round(cat.revenue).toLocaleString('en-IN')}{' '}
                      <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', fontWeight: 400 }}>
                        ({cat.percentage.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--yz-bg-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.round(cat.percentage))}%`,
                        height: '100%',
                        backgroundColor: 'var(--yz-primary)',
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. SUB-VIEW TABS (Transactions / Best Sellers / Voided Summary) */}
      <div className="yz-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--yz-border)',
            paddingBottom: '8px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setActiveSubView('transactions')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--yz-radius-sm)',
                border: 'none',
                backgroundColor: activeSubView === 'transactions' ? 'var(--yz-primary)' : 'var(--yz-bg-subtle)',
                color: activeSubView === 'transactions' ? '#ffffff' : 'var(--yz-text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Order Transactions ({sales.transactions.length})
            </button>

            <button
              onClick={() => setActiveSubView('bestsellers')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--yz-radius-sm)',
                border: 'none',
                backgroundColor: activeSubView === 'bestsellers' ? 'var(--yz-primary)' : 'var(--yz-bg-subtle)',
                color: activeSubView === 'bestsellers' ? '#ffffff' : 'var(--yz-text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Top Performing Products & Services ({sales.best_sellers.length})
            </button>

            <button
              onClick={() => setActiveSubView('voided')}
              style={{
                padding: '6px 12px',
                borderRadius: 'var(--yz-radius-sm)',
                border: 'none',
                backgroundColor: activeSubView === 'voided' ? '#dc2626' : 'var(--yz-bg-subtle)',
                color: activeSubView === 'voided' ? '#ffffff' : 'var(--yz-text-secondary)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Voided / Cancelled Orders ({sales.voided_summary.voided_count})
            </button>
          </div>

          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Showing verified database records
          </span>
        </div>

        {/* SUBVIEW 1: TRANSACTIONS TABLE */}
        {activeSubView === 'transactions' && (
          <div>
            {sales.transactions.length === 0 ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
                No sales order transactions found for this period.
              </div>
            ) : (
              <div className="yz-table-container">
                <table className="yz-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '120px' }}>ORDER #</th>
                      <th style={{ width: '100px' }}>DATE</th>
                      <th>CUSTOMER</th>
                      <th style={{ width: '70px', textAlign: 'center' }}>ITEMS</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>GRAND TOTAL</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>PAID</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>PENDING</th>
                      <th style={{ width: '110px', textAlign: 'center' }}>PAYMENT STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.transactions.map((tx) => (
                      <tr key={tx.id}>
                        <td style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                          {tx.order_number}
                        </td>
                        <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>
                          {tx.order_date}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{tx.customer_name}</div>
                          {tx.customer_phone && (
                            <div style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', fontFamily: 'var(--yz-font-mono)' }}>
                              {tx.customer_phone}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)' }}>
                          {tx.items_count}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                          ₹{Math.round(tx.grand_total).toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: '#16a34a', fontFamily: 'var(--yz-font-mono)' }}>
                          ₹{Math.round(tx.paid_amount).toLocaleString('en-IN')}
                        </td>
                        <td
                          style={{
                            textAlign: 'right',
                            fontWeight: 600,
                            fontFamily: 'var(--yz-font-mono)',
                            color: tx.pending_amount > 0 ? '#dc2626' : 'var(--yz-text-muted)',
                          }}
                        >
                          ₹{Math.round(tx.pending_amount).toLocaleString('en-IN')}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: 'var(--yz-radius-full)',
                              backgroundColor:
                                tx.payment_status === 'PAID'
                                  ? 'rgba(22, 163, 74, 0.1)'
                                  : tx.payment_status === 'PARTIALLY_PAID'
                                  ? 'rgba(217, 119, 6, 0.1)'
                                  : 'rgba(220, 38, 38, 0.1)',
                              color:
                                tx.payment_status === 'PAID'
                                  ? '#16a34a'
                                  : tx.payment_status === 'PARTIALLY_PAID'
                                  ? '#d97706'
                                  : '#dc2626',
                            }}
                          >
                            {tx.payment_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SUBVIEW 2: BEST SELLERS TABLE */}
        {activeSubView === 'bestsellers' && (
          <div>
            {sales.best_sellers.length === 0 ? (
              <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
                No best seller sales recorded for this period.
              </div>
            ) : (
              <div className="yz-table-container">
                <table className="yz-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                      <th>ITEM NAME</th>
                      <th style={{ width: '110px' }}>SKU / CODE</th>
                      <th style={{ width: '100px', textAlign: 'center' }}>TYPE</th>
                      <th style={{ width: '130px' }}>CATEGORY</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>UNITS / WORK</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>REVENUE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.best_sellers.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--yz-text-muted)' }}>
                          {idx + 1}
                        </td>
                        <td>
                          <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{item.name}</strong>
                        </td>
                        <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px' }}>
                          {item.sku}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: item.type === 'SERVICE' ? 'rgba(2, 132, 199, 0.1)' : 'rgba(120, 20, 50, 0.1)',
                              color: item.type === 'SERVICE' ? '#0284c7' : 'var(--yz-primary)',
                            }}
                          >
                            {item.type}
                          </span>
                        </td>
                        <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>
                          {item.category}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                          {item.units}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                          ₹{Math.round(item.revenue).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* SUBVIEW 3: VOIDED / CANCELLED ORDERS */}
        {activeSubView === 'voided' && (
          <div>
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: 'rgba(220, 38, 38, 0.05)',
                border: '1px solid rgba(220, 38, 38, 0.2)',
                borderRadius: '6px',
                marginBottom: '10px',
                fontSize: '11.5px',
                color: '#991b1b',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertTriangle size={15} />
              <span>
                <strong>Operational Audit Notice:</strong> Voided and cancelled orders ({sales.voided_summary.voided_count} orders, total value ₹{Math.round(sales.voided_summary.voided_value).toLocaleString('en-IN')}) are strictly excluded from net sales revenue.
              </span>
            </div>

            {sales.voided_summary.orders.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
                No voided or cancelled orders in this period.
              </div>
            ) : (
              <div className="yz-table-container">
                <table className="yz-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>ORDER #</th>
                      <th style={{ width: '110px' }}>DATE</th>
                      <th style={{ width: '110px', textAlign: 'center' }}>STATUS</th>
                      <th style={{ width: '120px', textAlign: 'right' }}>VOIDED AMOUNT</th>
                      <th>CANCELLATION NOTES / REASON</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.voided_summary.orders.map((vo) => (
                      <tr key={vo.id}>
                        <td style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600 }}>{vo.order_number}</td>
                        <td style={{ fontSize: '11.5px' }}>{vo.order_date}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#dc2626', backgroundColor: '#fee2e2', padding: '2px 8px', borderRadius: '4px' }}>
                            {vo.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                          ₹{Math.round(vo.grand_total).toLocaleString('en-IN')}
                        </td>
                        <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>
                          {vo.notes || 'Order cancelled before fulfillment'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
