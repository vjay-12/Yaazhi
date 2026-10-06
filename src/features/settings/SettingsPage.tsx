import React, { useState, useEffect } from 'react';
import { Store, Check, Loader2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { settingsService } from '../../services/settingsService';
import { useToast } from '../../components/common/Toast';

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [storeName, setStoreName] = useState('Yaazhi Boutique & Atelier');
  const [legalName, setLegalName] = useState('Yaazhi Silks & Couture Pvt Ltd');
  const [address, setAddress] = useState('42 Weaver Colony, Little Kanchipuram');
  const [phone, setPhone] = useState('+91 94440 12890');
  const [email, setEmail] = useState('atelier@yaazhi.in');
  const [gstin, setGstin] = useState('33AABCY1234A1Z5');
  const [enableGst, setEnableGst] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    settingsService
      .getSettings()
      .then((s) => {
        if (s) {
          setStoreName(s.company_name);
          setLegalName(s.legal_name || '');
          setAddress(s.address || '');
          setPhone(s.phone || '');
          setEmail(s.email || '');
          setGstin(s.gstin || '');
          setEnableGst(s.enable_gst);
        }
      })
      .catch((e) => console.error('Failed to load settings:', e))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await settingsService.updateSettings({
        company_name: storeName,
        legal_name: legalName,
        address,
        phone,
        email,
        gstin,
        enable_gst: enableGst,
      });
      showToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Boutique profile updated in database.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not save settings',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '8px' }}>
        <Loader2 size={16} className="animate-spin" />
        <span>Loading boutique settings from database...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '720px' }}>
      <form onSubmit={handleSave} className="yz-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--yz-border)', paddingBottom: '6px' }}>
          <Store size={16} color="var(--yz-primary)" />
          <h3 style={{ fontSize: '13px', fontWeight: 600 }}>Boutique Profile & Legal Registration</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '8px' }}>
          <div className="yz-field">
            <label className="yz-label">Boutique Brand Name *</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="yz-input"
              required
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div className="yz-field">
            <label className="yz-label">Legal Entity Name</label>
            <input
              type="text"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="yz-input"
            />
          </div>

          <div className="yz-field">
            <label className="yz-label">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="yz-input"
            />
          </div>
        </div>

        <div className="yz-field">
          <label className="yz-label">Registered Atelier Address</label>
          <textarea
            rows={2}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="yz-textarea"
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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

          <div className="yz-field" style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '20px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px' }}>
              <input
                type="checkbox"
                checked={enableGst}
                onChange={(e) => setEnableGst(e.target.checked)}
              />
              <span>Enable GST Invoicing & Calculations (CGST + SGST)</span>
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
          <Button variant="primary" size="sm" type="submit" icon={<Check size={13} />} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
};
