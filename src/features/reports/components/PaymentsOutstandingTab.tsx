import React from 'react';
import {
  Wallet,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { PaymentReportData } from '../../../services/reportService';

interface PaymentsOutstandingTabProps {
  payments: PaymentReportData;
  periodLabel: string;
}

export const PaymentsOutstandingTab: React.FC<PaymentsOutstandingTabProps> = ({
  payments,
  periodLabel,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. PAYMENTS & COLLECTIONS KPI CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Total Collections Cleared */}
        <div className="yz-card" style={{ padding: '12px 14px', borderLeft: '3px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', textTransform: 'uppercase' }}>
              Total Collections Cleared
            </span>
            <Wallet size={15} style={{ color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(payments.total_collections).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            {payments.payments_count} verified transactions in {periodLabel}
          </div>
        </div>

        {/* Total Outstanding Customer Receivables */}
        <div className="yz-card" style={{ padding: '12px 14px', borderLeft: '3px solid #dc2626' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#dc2626', textTransform: 'uppercase' }}>
              Customer Receivables
            </span>
            <AlertTriangle size={15} style={{ color: '#dc2626' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#dc2626', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(payments.total_outstanding_receivables).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Across {payments.unpaid_orders_count} pending / partial orders
          </div>
        </div>

        {/* Cash Collections */}
        {(() => {
          const cash = payments.by_payment_mode.find((m) => m.mode.toUpperCase() === 'CASH');
          return (
            <div className="yz-card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                  Cash Collections
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                  {cash ? `${cash.percentage.toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
                ₹{cash ? Math.round(cash.amount).toLocaleString('en-IN') : '0'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
                {cash ? cash.count : 0} counter transactions
              </div>
            </div>
          );
        })()}

        {/* UPI / Digital Collections */}
        {(() => {
          const upi = payments.by_payment_mode.find((m) => m.mode.toUpperCase().includes('UPI'));
          return (
            <div className="yz-card" style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                  UPI / QR Collections
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#0284c7' }}>
                  {upi ? `${upi.percentage.toFixed(1)}%` : '0%'}
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#0284c7', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
                ₹{upi ? Math.round(upi.amount).toLocaleString('en-IN') : '0'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
                {upi ? upi.count : 0} instant QR transfers
              </div>
            </div>
          );
        })()}
      </div>

      {/* 2. PAYMENT METHODS & COLLECTION TIMELINE */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '14px',
        }}
      >
        {/* Payment Modes Breakdown */}
        <div className="yz-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
              Collections by Payment Method
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>Realized in {periodLabel}</span>
          </div>

          {payments.by_payment_mode.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
              No payments collected in this period.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {payments.by_payment_mode.map((mode, idx) => (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                      {mode.mode} <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', fontWeight: 400 }}>({mode.count} payments)</span>
                    </span>
                    <span style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600 }}>
                      ₹{Math.round(mode.amount).toLocaleString('en-IN')}{' '}
                      <span style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', fontWeight: 400 }}>
                        ({mode.percentage.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--yz-bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${Math.min(100, Math.round(mode.percentage))}%`,
                        height: '100%',
                        backgroundColor:
                          mode.mode.toUpperCase() === 'CASH'
                            ? '#16a34a'
                            : mode.mode.toUpperCase().includes('UPI')
                            ? '#0284c7'
                            : 'var(--yz-primary)',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Collection Timeline */}
        <div className="yz-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
              Collections Timeline
            </h3>
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
              {payments.collection_trend.length} recorded dates
            </span>
          </div>

          {payments.collection_trend.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
              No collection records for this timeline.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {payments.collection_trend.map((pt, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: idx % 2 === 0 ? 'var(--yz-bg-subtle)' : 'transparent',
                  }}
                >
                  <span style={{ color: 'var(--yz-text-secondary)' }}>{pt.date}</span>
                  <span style={{ fontWeight: 500, color: 'var(--yz-text-muted)', fontSize: '11px' }}>
                    {pt.count} payment{pt.count !== 1 ? 's' : ''}
                  </span>
                  <strong style={{ fontFamily: 'var(--yz-font-mono)', color: '#16a34a' }}>
                    ₹{Math.round(pt.amount).toLocaleString('en-IN')}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. CUSTOMER OUTSTANDING BALANCES (RECEIVABLES AGING) */}
      <div className="yz-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
            Customer Receivables & Outstanding Balances ({payments.outstanding_by_customer.length} Customers)
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Calculated strictly from successful payment logs vs order invoices
          </span>
        </div>

        {payments.outstanding_by_customer.length === 0 ? (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: '#16a34a',
              backgroundColor: 'rgba(22, 163, 74, 0.05)',
              borderRadius: '6px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <CheckCircle2 size={16} />
            <span>Zero pending customer balances. All active orders are fully collected!</span>
          </div>
        ) : (
          <div className="yz-table-container">
            <table className="yz-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>CUSTOMER</th>
                  <th style={{ width: '120px' }}>PHONE</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>UNPAID ORDERS</th>
                  <th style={{ width: '130px' }}>OLDEST DUE DATE</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>OUTSTANDING BALANCE</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {payments.outstanding_by_customer.map((cust) => (
                  <tr key={cust.customer_id}>
                    <td>
                      <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{cust.customer_name}</strong>
                    </td>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px' }}>
                      {cust.customer_phone || '-'}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)' }}>
                      {cust.orders_count}
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>
                      {cust.oldest_order_date}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626', fontFamily: 'var(--yz-font-mono)' }}>
                      ₹{Math.round(cust.total_outstanding).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--yz-radius-full)',
                          backgroundColor: 'rgba(220, 38, 38, 0.1)',
                          color: '#dc2626',
                        }}
                      >
                        RECEIVABLE
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. RECENT PAYMENT TRANSACTIONS LEDGER */}
      <div className="yz-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
            Recent Payment Settlements ({payments.recent_payments.length} Transactions)
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Cleared and reconciled payment vouchers
          </span>
        </div>

        {payments.recent_payments.length === 0 ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
            No recent payment transactions in this period.
          </div>
        ) : (
          <div className="yz-table-container">
            <table className="yz-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>RECEIPT #</th>
                  <th style={{ width: '100px' }}>DATE</th>
                  <th>CUSTOMER</th>
                  <th style={{ width: '120px' }}>ORDER #</th>
                  <th style={{ width: '110px' }}>PAYMENT MODE</th>
                  <th style={{ width: '120px' }}>REFERENCE #</th>
                  <th style={{ width: '110px', textAlign: 'right' }}>AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {payments.recent_payments.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600 }}>{p.payment_number}</td>
                    <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>{p.payment_date}</td>
                    <td>
                      <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{p.customer_name}</strong>
                    </td>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11.5px' }}>{p.order_number}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor:
                            p.payment_mode.toUpperCase() === 'CASH'
                              ? 'rgba(22, 163, 74, 0.1)'
                              : 'rgba(2, 132, 199, 0.1)',
                          color: p.payment_mode.toUpperCase() === 'CASH' ? '#16a34a' : '#0284c7',
                        }}
                      >
                        {p.payment_mode}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px', color: 'var(--yz-text-secondary)' }}>
                      {p.reference_number || '-'}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: '#16a34a', fontFamily: 'var(--yz-font-mono)' }}>
                      ₹{Math.round(p.amount).toLocaleString('en-IN')}
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
