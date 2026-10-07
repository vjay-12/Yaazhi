import React, { useState, useEffect, useRef } from 'react';
import { Store, Check, Loader2, QrCode, Upload, Trash2, RotateCcw, Palette, Sun, Moon } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { settingsService } from '../../services/settingsService';
import { useToast } from '../../components/common/Toast';
import { useTheme } from '../../context/ThemeContext';

const DEFAULT_SETTINGS = {
  storeName: 'Yaazhi Boutique & Atelier',
  legalName: 'Yaazhi Silks & Couture Pvt Ltd',
  address: '42 Weaver Colony, Little Kanchipuram',
  phone: '+91 94440 12890',
  email: 'atelier@yaazhi.in',
  gstin: '33AABCY1234A1Z5',
  enableGst: true,
  upiId: 'yaazhi@oksbi',
  upiQrUrl: '/images/payment/yaazhi-upi-qr.png',
};

export const SettingsPage: React.FC = () => {
  const { showToast } = useToast();
  const { theme, setTheme } = useTheme();
  const [storeName, setStoreName] = useState(DEFAULT_SETTINGS.storeName);
  const [legalName, setLegalName] = useState(DEFAULT_SETTINGS.legalName);
  const [address, setAddress] = useState(DEFAULT_SETTINGS.address);
  const [phone, setPhone] = useState(DEFAULT_SETTINGS.phone);
  const [email, setEmail] = useState(DEFAULT_SETTINGS.email);
  const [gstin, setGstin] = useState(DEFAULT_SETTINGS.gstin);
  const [enableGst, setEnableGst] = useState(DEFAULT_SETTINGS.enableGst);
  const [upiId, setUpiId] = useState(DEFAULT_SETTINGS.upiId);
  const [upiQrUrl, setUpiQrUrl] = useState(DEFAULT_SETTINGS.upiQrUrl);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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
          if (s.upi_id) setUpiId(s.upi_id);
          if (s.upi_qr_url) setUpiQrUrl(s.upi_qr_url);
        }
      })
      .catch((e) => console.error('Failed to load settings:', e))
      .finally(() => setIsLoading(false));
  }, []);

  const handleQrFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast({
        type: 'error',
        title: 'Invalid File',
        message: 'Please upload an image file (PNG, JPG, or WebP).',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast({
        type: 'error',
        title: 'File Too Large',
        message: 'QR code image must be under 5MB.',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUpiQrUrl(String(event.target.result));
        showToast({
          type: 'info',
          title: 'QR Code Loaded',
          message: 'Preview updated. Click "Save Settings" to persist.',
        });
      }
    };
    reader.readAsDataURL(file);
  };

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
        upi_id: upiId.trim() || 'yaazhi@oksbi',
        upi_qr_url: upiQrUrl || undefined,
      });
      showToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Boutique profile and UPI payment configuration updated.',
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

  const handleResetConfirm = async () => {
    try {
      setIsResetting(true);
      await settingsService.updateSettings({
        company_name: DEFAULT_SETTINGS.storeName,
        legal_name: DEFAULT_SETTINGS.legalName,
        address: DEFAULT_SETTINGS.address,
        phone: DEFAULT_SETTINGS.phone,
        email: DEFAULT_SETTINGS.email,
        gstin: DEFAULT_SETTINGS.gstin,
        enable_gst: DEFAULT_SETTINGS.enableGst,
        upi_id: DEFAULT_SETTINGS.upiId,
        upi_qr_url: DEFAULT_SETTINGS.upiQrUrl,
      });

      setStoreName(DEFAULT_SETTINGS.storeName);
      setLegalName(DEFAULT_SETTINGS.legalName);
      setAddress(DEFAULT_SETTINGS.address);
      setPhone(DEFAULT_SETTINGS.phone);
      setEmail(DEFAULT_SETTINGS.email);
      setGstin(DEFAULT_SETTINGS.gstin);
      setEnableGst(DEFAULT_SETTINGS.enableGst);
      setUpiId(DEFAULT_SETTINGS.upiId);
      setUpiQrUrl(DEFAULT_SETTINGS.upiQrUrl);

      setIsResetDialogOpen(false);
      showToast({
        type: 'success',
        title: 'Settings Reset',
        message: 'Boutique settings restored to default Yaazhi configuration.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Reset Error',
        message: err.message || 'Could not reset settings to defaults',
      });
    } finally {
      setIsResetting(false);
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
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Boutique Profile & Legal Registration */}
        <div className="yz-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
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
        </div>

        {/* Appearance Settings */}
        <div className="yz-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--yz-border)', paddingBottom: '6px' }}>
            <Palette size={16} color="var(--yz-primary)" />
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600 }}>Appearance</h3>
              <span style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)' }}>
                Customize interface theme for daylight showroom counter or ambient evening operations.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Light Theme Option */}
            <div
              onClick={() => setTheme('light')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--yz-radius-md)',
                border: `1.5px solid ${theme === 'light' ? 'var(--yz-primary)' : 'var(--yz-border)'}`,
                backgroundColor: theme === 'light' ? 'var(--yz-primary-subtle)' : 'var(--yz-bg-subtle)',
                cursor: 'pointer',
                transition: 'all 0.14s ease',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--yz-radius-sm)',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#B45309',
                  boxShadow: 'var(--yz-shadow-2xs)',
                  flexShrink: 0,
                }}
              >
                <Sun size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                  Light Theme
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)' }}>
                  Crisp daylight boutique contrast
                </div>
              </div>
              <input
                type="radio"
                name="theme"
                checked={theme === 'light'}
                onChange={() => setTheme('light')}
                style={{ accentColor: 'var(--yz-primary)' }}
              />
            </div>

            {/* Dark Theme Option */}
            <div
              onClick={() => setTheme('dark')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: 'var(--yz-radius-md)',
                border: `1.5px solid ${theme === 'dark' ? 'var(--yz-primary)' : 'var(--yz-border)'}`,
                backgroundColor: theme === 'dark' ? 'var(--yz-primary-subtle)' : 'var(--yz-bg-subtle)',
                cursor: 'pointer',
                transition: 'all 0.14s ease',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--yz-radius-sm)',
                  backgroundColor: '#181B1D',
                  border: '1px solid #30363A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60A5FA',
                  boxShadow: 'var(--yz-shadow-2xs)',
                  flexShrink: 0,
                }}
              >
                <Moon size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                  Dark Theme
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)' }}>
                  Subtle, eye-friendly evening ambient
                </div>
              </div>
              <input
                type="radio"
                name="theme"
                checked={theme === 'dark'}
                onChange={() => setTheme('dark')}
                style={{ accentColor: 'var(--yz-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Payment / UPI Settings */}
        <div className="yz-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid var(--yz-border)', paddingBottom: '6px' }}>
            <QrCode size={16} color="var(--yz-primary)" />
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 600 }}>Payment / UPI Settings</h3>
              <span style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)' }}>
                Configure merchant UPI details and printable QR code for counter checkout and bills.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div className="yz-field">
                <label className="yz-label">Merchant UPI ID (VPA) *</label>
                <input
                  type="text"
                  placeholder="e.g. yaazhi@oksbi or atelier@upi"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="yz-input"
                  style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600 }}
                  required
                />
                <span className="yz-hint" style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', marginTop: '3px', display: 'block' }}>
                  This QR is used for UPI payment display on bills/invoices.
                </span>
              </div>

              <div>
                <input
                  type="file"
                  ref={qrInputRef}
                  onChange={handleQrFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                />

                <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    icon={<Upload size={12} />}
                    onClick={() => qrInputRef.current?.click()}
                  >
                    {upiQrUrl ? 'Replace QR Code' : 'Upload QR Code'}
                  </Button>

                  {upiQrUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 size={12} />}
                      onClick={() => setUpiQrUrl('')}
                      style={{ color: 'var(--yz-status-out-stock)' }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* QR Preview Area */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span className="yz-label" style={{ alignSelf: 'flex-start' }}>UPI QR Code Preview</span>
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--yz-border)',
                  borderRadius: 'var(--yz-radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  boxShadow: 'var(--yz-shadow-2xs)',
                  position: 'relative',
                }}
              >
                {upiQrUrl ? (
                  <img
                    src={upiQrUrl}
                    alt="Merchant UPI QR Code Preview"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      borderRadius: '2px',
                    }}
                  />
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: 'var(--yz-text-muted)' }}>
                    <QrCode size={36} opacity={0.4} />
                    <span style={{ fontSize: '9px', textAlign: 'center' }}>No QR Uploaded</span>
                  </div>
                )}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textAlign: 'center' }}>
                Square ratio (PNG, JPG, WebP)
              </span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <Button
            type="button"
            variant="ghost"
            size="md"
            icon={<RotateCcw size={14} />}
            onClick={() => setIsResetDialogOpen(true)}
            disabled={isSaving || isResetting}
          >
            Reset to Defaults
          </Button>

          <Button variant="primary" size="md" type="submit" icon={<Check size={14} />} disabled={isSaving || isResetting}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={isResetDialogOpen}
        onClose={() => setIsResetDialogOpen(false)}
        onConfirm={handleResetConfirm}
        title="Reset Boutique Settings?"
        description="Are you sure you want to revert all boutique profile and UPI payment settings to the Yaazhi default configuration? Any custom store details and uploaded QR code will be replaced."
        confirmLabel="Reset to Defaults"
        cancelLabel="Cancel"
        variant="warning"
        isLoading={isResetting}
      />
    </div>
  );
};
