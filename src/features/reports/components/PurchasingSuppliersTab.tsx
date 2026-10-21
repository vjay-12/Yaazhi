import React from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  Ban,
  Info,
} from 'lucide-react';
import type { PurchasingReportData } from '../../../services/reportService';

interface PurchasingSuppliersTabProps {
  purchasing: PurchasingReportData;
  periodLabel: string;
}

export const PurchasingSuppliersTab: React.FC<PurchasingSuppliersTabProps> = ({
  purchasing,
  periodLabel,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. PURCHASING KPI CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Received Purchase Value (Realized Stock Receipts) */}
        <div className="yz-card" style={{ padding: '12px 14px', borderLeft: '3px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', textTransform: 'uppercase' }}>
              Received Goods Value
            </span>
            <CheckCircle2 size={15} style={{ color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(purchasing.received_value).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            {purchasing.received_count} purchase orders received
          </div>
        </div>

        {/* Open / In-Transit POs */}
        <div className="yz-card" style={{ padding: '12px 14px', borderLeft: '3px solid #d97706' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#d97706', textTransform: 'uppercase' }}>
              Open / In-Transit Orders
            </span>
            <Clock size={15} style={{ color: '#d97706' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#d97706', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(purchasing.open_ordered_value).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            {purchasing.open_ordered_count} pending supplier delivery
          </div>
        </div>

        {/* Cancelled POs */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Cancelled POs
            </span>
            <Ban size={15} style={{ color: '#dc2626' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(purchasing.cancelled_value).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            {purchasing.cancelled_count} cancelled purchase orders
          </div>
        </div>

        {/* Total Purchasing Volume */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Total POs Handled
            </span>
            <Truck size={15} style={{ color: 'var(--yz-text-muted)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            {purchasing.total_orders_count}{' '}
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--yz-text-secondary)' }}>orders</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Across all suppliers in {periodLabel}
          </div>
        </div>
      </div>

      {/* 2. ACCOUNTING EXCLUSION AUDIT NOTICE */}
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
          <strong style={{ color: 'var(--yz-text-primary)' }}>Receipt Capitalization Rule:</strong>{' '}
          Only verified <strong>RECEIVED</strong> purchase orders are added to stock ledger assets and inventory valuation. Open orders (₹{Math.round(purchasing.open_ordered_value).toLocaleString('en-IN')}) are tracked as committed pipeline purchases until physical delivery.
        </div>
      </div>

      {/* 3. TOP SUPPLIERS BY RECEIVED SPEND */}
      <div className="yz-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
            Top Suppliers & Weavers by Received Spend ({purchasing.top_suppliers.length} Suppliers)
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Spend realized upon physical inventory receipt
          </span>
        </div>

        {purchasing.top_suppliers.length === 0 ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
            No supplier purchase receipts recorded in this period.
          </div>
        ) : (
          <div className="yz-table-container">
            <table className="yz-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                  <th>SUPPLIER / WEAVING GUILD</th>
                  <th style={{ width: '140px' }}>PHONE</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>ORDERS RECEIVED</th>
                  <th style={{ width: '160px', textAlign: 'right' }}>RECEIVED PURCHASE SPEND</th>
                </tr>
              </thead>
              <tbody>
                {purchasing.top_suppliers.map((s, idx) => (
                  <tr key={s.supplier_id}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--yz-text-muted)' }}>
                      {idx + 1}
                    </td>
                    <td>
                      <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{s.name}</strong>
                    </td>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px' }}>
                      {s.phone || '-'}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)', fontWeight: 600 }}>
                      {s.orders_count}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-text-primary)' }}>
                      ₹{Math.round(s.total_received_spend).toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. PURCHASE ORDERS LEDGER */}
      <div className="yz-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
            Purchase Orders History & Receiving Ledger ({purchasing.purchase_orders.length} Orders)
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Track order delivery status and received amounts
          </span>
        </div>

        {purchasing.purchase_orders.length === 0 ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
            No purchase orders found for this period.
          </div>
        ) : (
          <div className="yz-table-container">
            <table className="yz-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>PO #</th>
                  <th style={{ width: '100px' }}>DATE</th>
                  <th>SUPPLIER / GUILD</th>
                  <th style={{ width: '110px' }}>EXPECTED</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>STATUS</th>
                  <th>ITEMS SUMMARY</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>GRAND TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {purchasing.purchase_orders.map((po) => (
                  <tr key={po.id}>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                      {po.po_number}
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>
                      {po.order_date}
                    </td>
                    <td>
                      <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{po.supplier_name}</strong>
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>
                      {po.expected_date || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--yz-radius-full)',
                          backgroundColor:
                            po.status === 'RECEIVED'
                              ? 'rgba(22, 163, 74, 0.1)'
                              : po.status === 'CANCELLED'
                              ? 'rgba(220, 38, 38, 0.1)'
                              : 'rgba(217, 119, 6, 0.1)',
                          color:
                            po.status === 'RECEIVED'
                              ? '#16a34a'
                              : po.status === 'CANCELLED'
                              ? '#dc2626'
                              : '#d97706',
                        }}
                      >
                        {po.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', maxWidth: '240px' }} className="yz-cell-truncate" title={po.items_summary}>
                      {po.items_summary}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-text-primary)' }}>
                      ₹{Math.round(po.grand_total).toLocaleString('en-IN')}
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
