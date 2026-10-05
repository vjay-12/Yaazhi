import React, { useState } from 'react';
import { Search, Plus, MapPin, Phone, FileText } from 'lucide-react';
import { Button } from '../../components/common/Button';

interface VendorItem {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  city: string;
  gstin: string;
  activeOrders: number;
}

const INITIAL_VENDORS: VendorItem[] = [
  {
    id: 'v-1',
    name: 'Kanchipuram Silk Weavers Society (Co-op)',
    category: 'Pure Mulberry Silk',
    contactPerson: 'Thiru. Selvamurugan',
    phone: '+91 94432 10987',
    city: 'Kanchipuram, Tamil Nadu',
    gstin: '33AABCK1234F1Z8',
    activeOrders: 1,
  },
  {
    id: 'v-2',
    name: 'Chettinad Traditional Looms',
    category: 'Handloom Cotton Sarees',
    contactPerson: 'M. Meenakshi Sundaram',
    phone: '+91 98421 55667',
    city: 'Karaikudi, Tamil Nadu',
    gstin: '33AAECK5678M1Z2',
    activeOrders: 0,
  },
  {
    id: 'v-3',
    name: 'Varanasi Brocade & Zari Guild',
    category: 'Banarasi Kadhwa Silk',
    contactPerson: 'Rajesh Mishra',
    phone: '+91 94152 33445',
    city: 'Varanasi, Uttar Pradesh',
    gstin: '09AABCV9012K1Z5',
    activeOrders: 1,
  },
];

export const VendorsPage: React.FC = () => {
  const [vendors] = useState<VendorItem[]>(INITIAL_VENDORS);
  const [search, setSearch] = useState('');

  const filtered = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase()) ||
      v.category.toLowerCase().includes(search.toLowerCase())
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
            placeholder="Search weavers, societies, or cities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="yz-input"
            style={{ paddingLeft: '2rem' }}
          />
        </div>

        <Button variant="primary" icon={<Plus size={16} />}>
          Add Weaver / Supplier
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {filtered.map((v) => (
          <div key={v.id} className="yz-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="yz-badge yz-badge-gold" style={{ marginBottom: '0.35rem' }}>
                  {v.category}
                </span>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{v.name}</h3>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8125rem', color: 'var(--yz-text-secondary)', marginTop: '0.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={14} color="var(--yz-primary)" />
                <span>{v.city}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={14} />
                <span>{v.phone} ({v.contactPerson})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={14} />
                <span style={{ fontFamily: 'var(--yz-font-mono)' }}>GSTIN: {v.gstin}</span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--yz-border-subtle)', paddingTop: '0.75rem', marginTop: '0.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--yz-text-muted)' }}>
                {v.activeOrders} active PO in transit
              </span>
              <Button variant="secondary" size="sm">
                View History
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
