import React, { useState } from 'react';
import { Store, RefreshCw, Check } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { productService } from '../../services/productService';
import { useToast } from '../../components/common/Toast';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [storeName, setStoreName] = useState('Yaazhi Boutique & Atelier');
  const [tagline, setTagline] = useState('Heirloom Silk Weaves & Bespoke Ethnic Couture');
  const [address, setAddress] = useState('42 Cathedral Road, Gopalapuram, Chennai, Tamil Nadu 600086');
  const [phone, setPhone] = useState('+91 44 2811 5566');
  const [gstin, setGstin] = useState('33AAFCY1928J1ZB');
  const [pan, setPan] = useState('AAFCY1928J');
  const [invoicePrefix, setInvoicePrefix] = useState('YZ-2026-');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    showToast({
      type: 'success',
      title: 'Settings Saved',
      message: 'Boutique business parameters updated.',
    });
  };

  const handleResetData = async () => {
    if (window.confirm('Reset all catalog and inventory back to initial seed data?')) {
      await productService.resetToSeedData();
      localStorage.removeItem('yaazhi_movements_v1');
      showToast({
        type: 'info',
        title: 'Catalog Reset',
        message: 'Boutique database restored to initial sample weaves.',
      });
      setTimeout(() => window.location.reload(), 600);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
      <form onSubmit={handleSave} className="yz-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', borderBottom: '1px solid var(--yz-border)', paddingBottom: '0.75rem' }}>
          <Store size={20} color="var(--yz-primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Boutique Profile & GSTIN</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem' }}>
          <div className="yz-field">
            <label className="yz-label">Boutique Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="yz-input"
            />
          </div>

          <div className="yz-field">
            <label className="yz-label">Phone Contact</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="yz-input"
            />
          </div>
        </div>

        <div className="yz-field">
          <label className="yz-label">Tagline / Brand Signature</label>
          <input
            type="text"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="yz-input"
          />
        </div>

        <div className="yz-field">
          <label className="yz-label">Registered Showroom Address</label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="yz-textarea"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div className="yz-field">
            <label className="yz-label">GSTIN Identification</label>
            <input
              type="text"
              value={gstin}
              onChange={(e) => setGstin(e.target.value)}
              className="yz-input"
              style={{ fontFamily: 'var(--yz-font-mono)' }}
            />
          </div>

          <div className="yz-field">
            <label className="yz-label">Business PAN</label>
            <input
              type="text"
              value={pan}
              onChange={(e) => setPan(e.target.value)}
              className="yz-input"
              style={{ fontFamily: 'var(--yz-font-mono)' }}
            />
          </div>

          <div className="yz-field">
            <label className="yz-label">Invoice Series Prefix</label>
            <input
              type="text"
              value={invoicePrefix}
              onChange={(e) => setInvoicePrefix(e.target.value)}
              className="yz-input"
              style={{ fontFamily: 'var(--yz-font-mono)' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--yz-border-subtle)', paddingTop: '1rem' }}>
          <Button variant="primary" type="submit" icon={<Check size={16} />}>
            Save Changes
          </Button>
        </div>
      </form>

      {/* QA Diagnostics & Reset Section */}
      <div className="yz-card" style={{ borderColor: 'var(--yz-border-strong)' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.35rem' }}>
          QA Test Environment & Seed Data
        </h4>
        <p style={{ fontSize: '0.8125rem', color: 'var(--yz-text-secondary)', marginBottom: '1rem' }}>
          Restore catalog and physical stock balances back to original Kanchipuram and Chettinad sample data.
        </p>
        <Button variant="secondary" icon={<RefreshCw size={15} />} onClick={handleResetData}>
          Reset Catalog to Initial Sample Weaves
        </Button>
      </div>
    </div>
  );
};
