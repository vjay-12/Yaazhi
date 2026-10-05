import React, { useState } from 'react';
import { Search, Plus, Phone, Scissors } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';

interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  totalVisits: number;
  totalSpend: number;
  measurementProfile?: {
    template: 'Bridal Blouse' | 'Chudidar / Kurti' | 'Lehenga';
    updatedAt: string;
    specs: Record<string, string>;
  };
}

const INITIAL_CUSTOMERS: CustomerProfile[] = [
  {
    id: 'c-1',
    name: 'Anitha Sundaram',
    phone: '+91 98401 23456',
    email: 'anitha.sundaram@gmail.com',
    city: 'Alwarpet, Chennai',
    totalVisits: 8,
    totalSpend: 142500,
    measurementProfile: {
      template: 'Bridal Blouse',
      updatedAt: '2026-09-24',
      specs: {
        'Bust / Chest': '36 in',
        'Under Bust': '31 in',
        'Blouse Length': '14.5 in',
        'Shoulder Width': '14 in',
        'Front Neck Depth': '7 in (Sweetheart)',
        'Back Neck Depth': '9.5 in (Deep U)',
        'Sleeve Length': '11 in (Elbow)',
        'Arm Round': '12 in',
      },
    },
  },
  {
    id: 'c-2',
    name: 'Priya Narayanan (Bridal Client)',
    phone: '+91 94440 98765',
    email: 'priya.narayanan@yahoo.co.in',
    city: 'Besant Nagar, Chennai',
    totalVisits: 3,
    totalSpend: 86400,
    measurementProfile: {
      template: 'Bridal Blouse',
      updatedAt: '2026-10-01',
      specs: {
        'Bust / Chest': '38 in',
        'Under Bust': '32.5 in',
        'Blouse Length': '15 in',
        'Shoulder Width': '14.5 in',
        'Front Neck Depth': '7.5 in (Boat Neck)',
        'Back Neck Depth': '10 in (Cutwork Window)',
        'Sleeve Length': '12 in',
        'Arm Round': '13 in',
      },
    },
  },
  {
    id: 'c-3',
    name: 'Meenakshi Raman',
    phone: '+91 98842 11223',
    email: 'meenakshi.r@outlook.com',
    city: 'T. Nagar, Chennai',
    totalVisits: 12,
    totalSpend: 215000,
  },
];

export const CustomersPage: React.FC = () => {
  const [customers] = useState<CustomerProfile[]>(INITIAL_CUSTOMERS);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.city.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Search clients by name, phone, or neighborhood..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="yz-input"
            style={{ paddingLeft: '2rem' }}
          />
        </div>

        <Button variant="primary" icon={<Plus size={16} />}>
          Add Client & Measurements
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filtered.map((c) => (
          <div key={c.id} className="yz-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{c.name}</h3>
                <div style={{ fontSize: '0.8125rem', color: 'var(--yz-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                  <Phone size={13} />
                  <span>{c.phone}</span>
                </div>
              </div>

              <span className="yz-badge yz-badge-gold">
                {c.totalVisits} Visits
              </span>
            </div>

            <div style={{ fontSize: '0.8125rem', color: 'var(--yz-text-secondary)' }}>
              <div>{c.city}</div>
              <div style={{ marginTop: '0.25rem', fontWeight: 600, color: 'var(--yz-primary)' }}>
                Lifetime Spend: ₹{c.totalSpend.toLocaleString('en-IN')}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--yz-border-subtle)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {c.measurementProfile ? (
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: 'var(--yz-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: 600,
                  }}
                >
                  <Scissors size={14} color="var(--yz-primary)" />
                  {c.measurementProfile.template} Active
                </span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: 'var(--yz-text-muted)' }}>
                  No tailoring specs recorded
                </span>
              )}

              {c.measurementProfile && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedCustomer(c)}
                >
                  View Fitting Card
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Measurement Fitting Card Modal */}
      {selectedCustomer && selectedCustomer.measurementProfile && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Tailoring Specs: ${selectedCustomer.name}`}
          subtitle={`Fitting Template: ${selectedCustomer.measurementProfile.template} (Last recorded ${selectedCustomer.measurementProfile.updatedAt})`}
          maxWidth="520px"
          footer={
            <Button variant="primary" onClick={() => setSelectedCustomer(null)}>
              Close Card
            </Button>
          }
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
            {Object.entries(selectedCustomer.measurementProfile.specs).map(([key, val]) => (
              <div
                key={key}
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  borderRadius: 'var(--yz-radius-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--yz-text-muted)', fontWeight: 600 }}>
                  {key}
                </span>
                <span style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--yz-text-primary)', fontFamily: 'var(--yz-font-mono)' }}>
                  {val}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};
