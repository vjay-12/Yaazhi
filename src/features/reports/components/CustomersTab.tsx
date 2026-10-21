import React from 'react';
import {
  Users,
  UserCheck,
  UserPlus,
  Archive,
  ShoppingBag,
} from 'lucide-react';
import type { CustomerReportData } from '../../../services/reportService';

interface CustomersTabProps {
  customers: CustomerReportData;
  periodLabel: string;
}

export const CustomersTab: React.FC<CustomersTabProps> = ({ customers, periodLabel }) => {
  const repeatCustomersCount = Math.max(
    0,
    customers.purchasing_customers_in_period - customers.new_customers_in_period
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. CUSTOMER KPI CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Total Registered Customers */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Total Registered
            </span>
            <Users size={15} style={{ color: 'var(--yz-text-muted)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            {customers.total_registered_customers}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Lifetime boutique client directory
          </div>
        </div>

        {/* Active Customers */}
        <div className="yz-card" style={{ padding: '12px 14px', borderLeft: '3px solid #16a34a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#16a34a', textTransform: 'uppercase' }}>
              Active Customers
            </span>
            <UserCheck size={15} style={{ color: '#16a34a' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#16a34a', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            {customers.active_customers_count}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Active clients (excluding archived)
          </div>
        </div>

        {/* Purchasing Clients in Period */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Purchased in Period
            </span>
            <ShoppingBag size={15} style={{ color: 'var(--yz-text-muted)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            {customers.purchasing_customers_in_period}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Placed orders in {periodLabel}
          </div>
        </div>

        {/* New Clients vs Repeat */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              New vs Repeat Clients
            </span>
            <UserPlus size={15} style={{ color: '#0284c7' }} />
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            <span style={{ color: '#0284c7' }}>{customers.new_customers_in_period} new</span>
            <span style={{ color: 'var(--yz-text-muted)', fontWeight: 400, margin: '0 6px' }}>/</span>
            <span style={{ color: '#16a34a' }}>{repeatCustomersCount} repeat</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Client acquisition in {periodLabel}
          </div>
        </div>

        {/* Archived Historical Accounts */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Archived Clients
            </span>
            <Archive size={15} style={{ color: 'var(--yz-text-muted)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            {customers.archived_customers_count}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Retained for financial history integrity
          </div>
        </div>
      </div>

      {/* 2. TOP CUSTOMERS BY VALID SALES & RECEIVABLES */}
      <div className="yz-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
            Top Customers by Valid Sales & Spend ({customers.top_customers.length} Clients)
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Tracked by stable customer ID
          </span>
        </div>

        {customers.top_customers.length === 0 ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
            No customer order activity found for this period.
          </div>
        ) : (
          <div className="yz-table-container">
            <table className="yz-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>#</th>
                  <th>CUSTOMER NAME</th>
                  <th style={{ width: '120px' }}>PHONE</th>
                  <th style={{ width: '120px' }}>CITY</th>
                  <th style={{ width: '80px', textAlign: 'center' }}>ORDERS</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>TOTAL SPEND</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>TOTAL PAID</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>PENDING DUE</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {customers.top_customers.map((c, idx) => (
                  <tr key={c.id}>
                    <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--yz-text-muted)' }}>
                      {idx + 1}
                    </td>
                    <td>
                      <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{c.name}</strong>
                    </td>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px' }}>
                      {c.phone || '-'}
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>
                      {c.city || '-'}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)', fontWeight: 600 }}>
                      {c.orders_count}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-text-primary)' }}>
                      ₹{Math.round(c.total_spend).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)', color: '#16a34a' }}>
                      ₹{Math.round(c.total_paid).toLocaleString('en-IN')}
                    </td>
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        fontFamily: 'var(--yz-font-mono)',
                        color: c.pending_balance > 0 ? '#dc2626' : 'var(--yz-text-muted)',
                      }}
                    >
                      ₹{Math.round(c.pending_balance).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--yz-radius-full)',
                          backgroundColor: c.is_archived ? 'rgba(100, 116, 139, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                          color: c.is_archived ? '#64748b' : '#16a34a',
                        }}
                      >
                        {c.is_archived ? 'ARCHIVED' : 'ACTIVE'}
                      </span>
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
