import React, { useState } from 'react';
import { Search, Plus, Eye } from 'lucide-react';
import { Button } from '../../components/common/Button';

interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  date: string;
  itemsCount: number;
  totalAmount: number;
  status: 'Draft' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Paid' | 'Pending' | 'Advance Received';
}

const INITIAL_ORDERS: OrderItem[] = [
  {
    id: 'so-001',
    orderNumber: 'SO-2026-104',
    customerName: 'Anitha Sundaram',
    customerPhone: '+91 98401 23456',
    date: '2026-10-04',
    itemsCount: 2,
    totalAmount: 31400,
    status: 'Confirmed',
    paymentStatus: 'Advance Received',
  },
  {
    id: 'so-002',
    orderNumber: 'SO-2026-103',
    customerName: 'Priya Narayanan (Bridal)',
    customerPhone: '+91 94440 98765',
    date: '2026-10-02',
    itemsCount: 4,
    totalAmount: 58200,
    status: 'Delivered',
    paymentStatus: 'Paid',
  },
  {
    id: 'so-003',
    orderNumber: 'SO-2026-102',
    customerName: 'Meenakshi Boutique',
    customerPhone: '+91 98842 11223',
    date: '2026-09-29',
    itemsCount: 1,
    totalAmount: 6900,
    status: 'Delivered',
    paymentStatus: 'Paid',
  },
];

export const SalesOrdersPage: React.FC = () => {
  const [orders] = useState<OrderItem[]>(INITIAL_ORDERS);
  const [search, setSearch] = useState('');

  const filtered = orders.filter(
    (o) =>
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--yz-bg-surface)',
          padding: '1rem',
          borderRadius: 'var(--yz-radius-lg)',
          border: '1px solid var(--yz-border)',
        }}
      >
        <div style={{ position: 'relative', width: '320px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--yz-text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search orders by client or order #..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="yz-input"
            style={{ paddingLeft: '2rem' }}
          />
        </div>

        <Button variant="primary" icon={<Plus size={16} />}>
          Create Sales Order
        </Button>
      </div>

      <div className="yz-table-container">
        <table className="yz-table">
          <thead>
            <tr>
              <th>Order Number</th>
              <th>Client / Bride</th>
              <th>Date</th>
              <th>Items</th>
              <th style={{ textAlign: 'right' }}>Total Amount</th>
              <th>Order Status</th>
              <th>Payment State</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id}>
                <td style={{ fontWeight: 700, fontFamily: 'var(--yz-font-mono)' }}>
                  {order.orderNumber}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--yz-text-muted)' }}>
                    {order.customerPhone}
                  </div>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--yz-text-secondary)' }}>
                  {order.date}
                </td>
                <td>{order.itemsCount} pieces</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{order.totalAmount.toLocaleString('en-IN')}
                </td>
                <td>
                  <span
                    className={`yz-badge ${
                      order.status === 'Delivered'
                        ? 'yz-badge-in-stock'
                        : order.status === 'Confirmed'
                        ? 'yz-badge-gold'
                        : 'yz-badge-category'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td>
                  <span
                    className={`yz-badge ${
                      order.paymentStatus === 'Paid'
                        ? 'yz-badge-in-stock'
                        : 'yz-badge-low-stock'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Button variant="ghost" size="sm" icon={<Eye size={14} />}>
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
