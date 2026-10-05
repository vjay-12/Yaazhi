import React, { useState } from 'react';
import { Search, Plus, Eye } from 'lucide-react';
import { Button } from '../../components/common/Button';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string;
  totalUnits: number;
  totalCost: number;
  status: 'Draft' | 'Ordered' | 'Partially Received' | 'Received' | 'Cancelled';
}

const INITIAL_POS: PurchaseOrder[] = [
  {
    id: 'po-1',
    poNumber: 'PO-2026-089',
    supplierName: 'Kanchipuram Silk Weavers Society (Co-op)',
    orderDate: '2026-09-28',
    expectedDate: '2026-10-01',
    totalUnits: 6,
    totalCost: 99000,
    status: 'Received',
  },
  {
    id: 'po-2',
    poNumber: 'PO-2026-090',
    supplierName: 'Chettinad Traditional Looms',
    orderDate: '2026-09-30',
    expectedDate: '2026-10-02',
    totalUnits: 15,
    totalCost: 16500,
    status: 'Received',
  },
  {
    id: 'po-3',
    poNumber: 'PO-2026-091',
    supplierName: 'Varanasi Brocade Guild',
    orderDate: '2026-10-03',
    expectedDate: '2026-10-08',
    totalUnits: 8,
    totalCost: 96000,
    status: 'Ordered',
  },
];

export const PurchasesPage: React.FC = () => {
  const [pos] = useState<PurchaseOrder[]>(INITIAL_POS);
  const [search, setSearch] = useState('');

  const filtered = pos.filter(
    (p) =>
      p.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      p.poNumber.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Search POs or weavers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="yz-input"
            style={{ paddingLeft: '2rem' }}
          />
        </div>

        <Button variant="primary" icon={<Plus size={16} />}>
          New Purchase Order
        </Button>
      </div>

      <div className="yz-table-container">
        <table className="yz-table">
          <thead>
            <tr>
              <th>PO Number</th>
              <th>Weaver / Supplier Cooperative</th>
              <th>Order Date</th>
              <th>Units</th>
              <th style={{ textAlign: 'right' }}>Total Cost (₹)</th>
              <th>Fulfillment Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((po) => (
              <tr key={po.id}>
                <td style={{ fontWeight: 700, fontFamily: 'var(--yz-font-mono)' }}>
                  {po.poNumber}
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{po.supplierName}</div>
                </td>
                <td style={{ fontSize: '0.85rem', color: 'var(--yz-text-secondary)' }}>
                  {po.orderDate}
                </td>
                <td>{po.totalUnits} items</td>
                <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{po.totalCost.toLocaleString('en-IN')}
                </td>
                <td>
                  <span
                    className={`yz-badge ${
                      po.status === 'Received'
                        ? 'yz-badge-in-stock'
                        : po.status === 'Ordered'
                        ? 'yz-badge-gold'
                        : 'yz-badge-category'
                    }`}
                  >
                    {po.status}
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
