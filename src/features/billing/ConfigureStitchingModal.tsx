import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import {
  Scissors,
  Plus,
  Ruler,
  AlertCircle,
} from 'lucide-react';
import type { StitchingTemplate, StitchingAddon } from '../../types/template';
import {
  customerService,
  type CustomerMeasurementProfile,
} from '../../services/customerService';
import { AddMeasurementModal } from '../commercial/AddMeasurementModal';
import { AddCustomerModal } from '../commercial/AddCustomerModal';
import { useToast } from '../../components/common/Toast';

export interface ConfiguredStitchingService {
  templateId: string;
  name: string;
  sku: string;
  garmentType: string;
  defaultPrice: number;
  chargedPrice: number;
  quantity: number;
  discount: number;
  taxRate: number;
  selectedAddons: StitchingAddon[];
  measurementProfileId?: string;
  measurementProfileName?: string;
  measurementVersionId?: string;
  measurementVersionNumber?: number;
  fittingPreferences?: string;
  tailorInstructions?: string;
  expectedDeliveryDate?: string;
}

interface ConfigureStitchingModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: StitchingTemplate | null;
  customerId: string | null;
  customerName: string;
  customerPhone?: string;
  recentCustomers: any[];
  onSelectCustomer: (customer: any) => void;
  onAddService: (service: ConfiguredStitchingService) => void;
}

export const ConfigureStitchingModal: React.FC<ConfigureStitchingModalProps> = ({
  isOpen,
  onClose,
  template,
  customerId,
  customerName,
  customerPhone,
  recentCustomers: _recentCustomers,
  onSelectCustomer,
  onAddService,
}) => {
  const { showToast } = useToast();

  // Price & Quantity
  const [chargedPrice, setChargedPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [discount, setDiscount] = useState<number>(0);

  // Add-ons
  const [selectedAddonIds, setSelectedAddonIds] = useState<Set<string>>(new Set());

  // Customer Measurement Profiles for this customer & garment
  const [measurementProfiles, setMeasurementProfiles] = useState<CustomerMeasurementProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [_isLoadingProfiles, setIsLoadingProfiles] = useState(false);

  // Tailoring notes & Delivery date
  const [fittingPreferences, setFittingPreferences] = useState('');
  const [tailorInstructions, setTailorInstructions] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');

  // Child Modals
  const [isNewMeasurementOpen, setIsNewMeasurementOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Initialize form when template opens
  useEffect(() => {
    if (!template || !isOpen) return;

    const base = Number(template.base_price) || 0;
    setChargedPrice(base);
    setQuantity(1);
    setDiscount(0);

    // Auto-select default add-ons
    const defaultIds = new Set<string>();
    if (template.addons && template.addons.length > 0) {
      template.addons.forEach((ad) => {
        if (ad.is_default_selected && ad.id) {
          defaultIds.add(ad.id);
        }
      });
    }
    setSelectedAddonIds(defaultIds);

    // Default expected delivery date: 7 calendar days from today
    const d = new Date();
    d.setDate(d.getDate() + 7);
    setExpectedDeliveryDate(d.toISOString().split('T')[0]);

    setFittingPreferences('');
    setTailorInstructions('');
    setSelectedProfileId('');
    setSelectedVersionId('');
  }, [template, isOpen]);

  // Load customer measurement profiles
  const loadCustomerMeasurements = React.useCallback(async (targetCustomerId: string) => {
    if (!targetCustomerId) return;
    try {
      setIsLoadingProfiles(true);
      const profiles = await customerService.getMeasurementProfiles(targetCustomerId);
      setMeasurementProfiles(profiles);

      // Try matching the garment type of the template
      const matched = profiles.find(
        (p) =>
          template?.garment_type &&
          p.garment_type?.toLowerCase() === template.garment_type.toLowerCase()
      );
      if (matched) {
        setSelectedProfileId(matched.id);
        const currVer = matched.current_version || (matched.versions && matched.versions[0]);
        if (currVer) {
          setSelectedVersionId(currVer.id);
          if (currVer.fitting_preferences) setFittingPreferences(currVer.fitting_preferences);
          if (currVer.tailor_instructions) setTailorInstructions(currVer.tailor_instructions);
        }
      } else if (profiles.length > 0) {
        setSelectedProfileId(profiles[0].id);
        const currVer = profiles[0].current_version || (profiles[0].versions && profiles[0].versions[0]);
        if (currVer) {
          setSelectedVersionId(currVer.id);
          if (currVer.fitting_preferences) setFittingPreferences(currVer.fitting_preferences);
          if (currVer.tailor_instructions) setTailorInstructions(currVer.tailor_instructions);
        }
      }
    } catch (err) {
      console.error('Failed to load customer measurement profiles:', err);
    } finally {
      setIsLoadingProfiles(false);
    }
  }, [template?.garment_type]);

  useEffect(() => {
    if (customerId && isOpen) {
      loadCustomerMeasurements(customerId);
    } else {
      setMeasurementProfiles([]);
      setSelectedProfileId('');
      setSelectedVersionId('');
    }
  }, [customerId, isOpen, loadCustomerMeasurements]);

  if (!template || !isOpen) return null;

  // Addon calculations
  const availableAddons = template.addons || [];
  const selectedAddonsList = availableAddons.filter((ad) => ad.id && selectedAddonIds.has(ad.id));
  const addonsTotalPerUnit = selectedAddonsList.reduce((sum, ad) => sum + Number(ad.price || 0), 0);

  const effectiveUnitCharged = chargedPrice + addonsTotalPerUnit;
  const lineSubtotal = Math.max(0, effectiveUnitCharged * quantity - discount);

  const handleToggleAddon = (addonId: string) => {
    setSelectedAddonIds((prev) => {
      const next = new Set(prev);
      if (next.has(addonId)) {
        next.delete(addonId);
      } else {
        next.add(addonId);
      }
      return next;
    });
  };

  const handleProfileChange = (profileId: string) => {
    setSelectedProfileId(profileId);
    const prof = measurementProfiles.find((p) => p.id === profileId);
    if (prof) {
      const currVer = prof.current_version || (prof.versions && prof.versions[0]);
      if (currVer) {
        setSelectedVersionId(currVer.id);
        if (currVer.fitting_preferences) setFittingPreferences(currVer.fitting_preferences);
        if (currVer.tailor_instructions) setTailorInstructions(currVer.tailor_instructions);
      } else {
        setSelectedVersionId('');
      }
    } else {
      setSelectedVersionId('');
    }
  };

  const handleConfirmAdd = () => {
    if (chargedPrice < 0) {
      showToast({
        type: 'error',
        title: 'Invalid Price',
        message: 'Base charged price cannot be negative.',
      });
      return;
    }

    if (quantity <= 0) {
      showToast({
        type: 'error',
        title: 'Invalid Quantity',
        message: 'Quantity must be at least 1.',
      });
      return;
    }

    const activeProfile = measurementProfiles.find((p) => p.id === selectedProfileId);
    const activeVersion =
      activeProfile?.versions?.find((v) => v.id === selectedVersionId) ||
      activeProfile?.current_version;

    const serviceData: ConfiguredStitchingService = {
      templateId: template.id,
      name: template.name,
      sku: template.code || `STITCH-${template.id.substring(0, 8).toUpperCase()}`,
      garmentType: template.garment_type,
      defaultPrice: Number(template.base_price) || 0,
      chargedPrice: effectiveUnitCharged,
      quantity,
      discount,
      taxRate: Number(template.tax_rate) || 5,
      selectedAddons: selectedAddonsList,
      measurementProfileId: activeProfile?.id,
      measurementProfileName: activeProfile?.profile_name,
      measurementVersionId: activeVersion?.id,
      measurementVersionNumber: activeVersion?.version_number,
      fittingPreferences: fittingPreferences.trim() || undefined,
      tailorInstructions: tailorInstructions.trim() || undefined,
      expectedDeliveryDate: expectedDeliveryDate || undefined,
    };

    onAddService(serviceData);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: 'var(--yz-radius-full)',
                backgroundColor: 'var(--yz-primary-subtle, #FDF2F4)',
                color: 'var(--yz-primary, #852237)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scissors size={15} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                Configure Custom Stitching
              </div>
              <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', fontWeight: 500 }}>
                {template.garment_type} Atelier Service • Default Rate: ₹{Number(template.base_price).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        }
        maxWidth="540px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', display: 'block' }}>Line Total:</span>
              <strong style={{ fontSize: '15px', color: 'var(--yz-primary, #852237)', fontFamily: 'var(--yz-font-mono)' }}>
                ₹{lineSubtotal.toLocaleString('en-IN')}
              </strong>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={13} />}
                onClick={handleConfirmAdd}
              >
                Add Service to Bill
              </Button>
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Header Banner */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--yz-radius-md, 10px)',
              backgroundColor: 'var(--yz-bg-subtle)',
              border: '1px solid var(--yz-border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                {template.name}
              </div>
              {template.description && (
                <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
                  {template.description}
                </div>
              )}
            </div>
            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 'var(--yz-radius-full)',
                backgroundColor: 'var(--yz-primary-subtle, #FDF2F4)',
                color: 'var(--yz-primary, #852237)',
                border: '1px solid var(--yz-primary-border, #F3D2D9)',
              }}
            >
              GST {template.tax_rate}%
            </span>
          </div>

          {/* Pricing Adjustments & Quantity Grid */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--yz-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
              Pricing & Service Quantity
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {/* Default Template Rate */}
              <div>
                <label className="yz-label" style={{ fontSize: '10.5px' }}>Template Base Rate</label>
                <div
                  style={{
                    height: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 10px',
                    backgroundColor: 'var(--yz-bg-subtle)',
                    border: '1px solid var(--yz-border)',
                    borderRadius: 'var(--yz-radius-md, 8px)',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--yz-text-muted)',
                    fontFamily: 'var(--yz-font-mono)',
                  }}
                >
                  ₹{Number(template.base_price).toLocaleString('en-IN')}
                </div>
              </div>

              {/* Charged Price (Editable) */}
              <div>
                <label className="yz-label" style={{ fontSize: '10.5px' }}>Charged Base Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  value={chargedPrice}
                  onChange={(e) => setChargedPrice(Math.max(0, Number(e.target.value) || 0))}
                  className="yz-input font-mono tabular-nums"
                  style={{ height: '32px', fontSize: '12px', fontWeight: 700 }}
                />
              </div>

              {/* Quantity */}
              <div>
                <label className="yz-label" style={{ fontSize: '10.5px' }}>Service Quantity</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="yz-btn yz-btn-secondary yz-btn-sm"
                    style={{ width: '28px', height: '32px', padding: 0 }}
                  >
                    -
                  </button>
                  <span
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      fontFamily: 'var(--yz-font-mono)',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="yz-btn yz-btn-secondary yz-btn-sm"
                    style={{ width: '28px', height: '32px', padding: 0 }}
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Optional Addons */}
          {availableAddons.length > 0 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--yz-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Optional Atelier Add-ons
                </span>
                {addonsTotalPerUnit > 0 && (
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-primary, #852237)', fontFamily: 'var(--yz-font-mono)' }}>
                    +₹{addonsTotalPerUnit.toLocaleString('en-IN')}/unit
                  </span>
                )}
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  maxHeight: '140px',
                  overflowY: 'auto',
                  border: '1px solid var(--yz-border)',
                  borderRadius: 'var(--yz-radius-md, 8px)',
                  padding: '6px 8px',
                  backgroundColor: 'var(--yz-bg-surface)',
                }}
              >
                {availableAddons.map((ad) => {
                  const isChecked = ad.id ? selectedAddonIds.has(ad.id) : false;
                  return (
                    <label
                      key={ad.id || ad.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 6px',
                        borderRadius: 'var(--yz-radius-sm)',
                        backgroundColor: isChecked ? 'var(--yz-primary-subtle, #FDF2F4)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => ad.id && handleToggleAddon(ad.id)}
                          style={{ cursor: 'pointer', accentColor: 'var(--yz-primary, #852237)' }}
                        />
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: isChecked ? 700 : 500, color: 'var(--yz-text-primary)' }}>
                            {ad.name}
                          </div>
                          {ad.description && (
                            <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>{ad.description}</div>
                          )}
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isChecked ? 'var(--yz-primary, #852237)' : 'var(--yz-text-secondary)',
                          fontFamily: 'var(--yz-font-mono)',
                        }}
                      >
                        +₹{Number(ad.price || 0).toLocaleString('en-IN')}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer Measurement Linking */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--yz-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Customer & Fitting Measurements
              </span>
              {customerId && (
                <button
                  type="button"
                  onClick={() => setIsNewMeasurementOpen(true)}
                  className="yz-btn yz-btn-ghost yz-btn-sm"
                  style={{ fontSize: '10.5px', height: '22px', padding: '0 6px', color: 'var(--yz-primary, #852237)', fontWeight: 700, gap: '4px' }}
                >
                  <Plus size={12} />
                  <span>New Measurement</span>
                </button>
              )}
            </div>

            {/* Customer status */}
            {!customerId ? (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--yz-radius-md, 8px)',
                  backgroundColor: 'var(--yz-alert-warning-bg, #FFFBEB)',
                  border: '1px solid var(--yz-alert-warning-border, #FED7AA)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--yz-alert-warning-text, #92400E)' }}>
                  <AlertCircle size={14} />
                  <span>No customer selected. Link a customer to attach measurements.</span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsAddCustomerOpen(true)}
                  style={{ height: '24px', fontSize: '10.5px' }}
                >
                  Select / Add Customer
                </Button>
              </div>
            ) : measurementProfiles.length === 0 ? (
              <div
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--yz-radius-md, 8px)',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  border: '1px solid var(--yz-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)' }}>
                  No saved measurement profiles found for <strong>{customerName}</strong>.
                </div>
                <Button
                  size="sm"
                  variant="gold"
                  icon={<Plus size={11} />}
                  onClick={() => setIsNewMeasurementOpen(true)}
                  style={{ height: '24px', fontSize: '10.5px' }}
                >
                  Take Measurements
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <CustomDropdown
                  value={selectedProfileId}
                  onChange={handleProfileChange}
                  options={[
                    { value: '', label: '— Proceed without measurement linkage —' },
                    ...measurementProfiles.map((p) => {
                      const verNum = p.current_version?.version_number || 1;
                      return {
                        value: p.id,
                        label: `${p.profile_name} (${p.garment_type || 'Custom'} • v${verNum})`,
                      };
                    }),
                  ]}
                  minWidth="100%"
                  style={{ width: '100%' }}
                />

                {/* Selected measurement preview badge */}
                {selectedProfileId && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '5px 8px',
                      borderRadius: 'var(--yz-radius-sm)',
                      backgroundColor: 'var(--yz-bg-subtle)',
                      border: '1px solid var(--yz-border-subtle)',
                      fontSize: '11px',
                    }}
                  >
                    <Ruler size={13} style={{ color: 'var(--yz-primary, #852237)' }} />
                    <span style={{ color: 'var(--yz-text-secondary)' }}>
                      Linked Version: <strong>v{measurementProfiles.find((p) => p.id === selectedProfileId)?.current_version?.version_number || 1}</strong>
                    </span>
                    <span style={{ color: 'var(--yz-text-muted)' }}>•</span>
                    <span style={{ color: 'var(--yz-text-secondary)' }}>
                      Recorded: {measurementProfiles.find((p) => p.id === selectedProfileId)?.current_version?.measured_at ? new Date(measurementProfiles.find((p) => p.id === selectedProfileId)!.current_version!.measured_at!).toLocaleDateString('en-IN') : 'Recent'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Workshop Details & Delivery Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Fitting Preference */}
            <div>
              <label className="yz-label" style={{ fontSize: '10.5px' }}>Client Fitting Preference</label>
              <input
                type="text"
                placeholder="e.g. Snug Princess Cut, 2-inch side margin"
                value={fittingPreferences}
                onChange={(e) => setFittingPreferences(e.target.value)}
                className="yz-input"
                style={{ height: '30px', fontSize: '11.5px' }}
              />
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="yz-label" style={{ fontSize: '10.5px' }}>Expected Delivery Date</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="date"
                  value={expectedDeliveryDate}
                  onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                  className="yz-input font-mono"
                  style={{ height: '30px', fontSize: '11.5px' }}
                />
              </div>
            </div>
          </div>

          {/* Workshop Tailor Instructions */}
          <div>
            <label className="yz-label" style={{ fontSize: '10.5px' }}>Workshop Tailor Instructions (Optional)</label>
            <input
              type="text"
              placeholder="e.g. Leave deep back neck, double stitch lining, contrast piping on cuffs"
              value={tailorInstructions}
              onChange={(e) => setTailorInstructions(e.target.value)}
              className="yz-input"
              style={{ height: '30px', fontSize: '11.5px' }}
            />
          </div>
        </div>
      </Modal>

      {/* Child Modal: New Measurement Record */}
      {isNewMeasurementOpen && customerId && (
        <AddMeasurementModal
          isOpen={isNewMeasurementOpen}
          onClose={() => setIsNewMeasurementOpen(false)}
          customerId={customerId}
          customerName={customerName}
          customerPhone={customerPhone}
          onSaved={() => {
            setIsNewMeasurementOpen(false);
            loadCustomerMeasurements(customerId);
            showToast({
              type: 'success',
              title: 'Measurement Saved',
              message: 'Measurement profile created and linked to this stitching job',
            });
          }}
        />
      )}

      {/* Child Modal: Create / Select Customer */}
      {isAddCustomerOpen && (
        <AddCustomerModal
          isOpen={isAddCustomerOpen}
          onClose={() => setIsAddCustomerOpen(false)}
          onCustomerCreated={(newCust) => {
            setIsAddCustomerOpen(false);
            onSelectCustomer(newCust);
            loadCustomerMeasurements(newCust.id);
          }}
        />
      )}
    </>
  );
};
