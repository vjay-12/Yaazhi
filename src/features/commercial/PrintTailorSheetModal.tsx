import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Printer, Scissors, AlertCircle } from 'lucide-react';
import type { CustomerMeasurementProfile, CustomerMeasurementVersion } from '../../services/customerService';
import { settingsService } from '../../services/settingsService';

export interface PrintTailorSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone?: string;
  profile: CustomerMeasurementProfile | null;
  version?: CustomerMeasurementVersion | null;
  // Stitching order specific metadata (when printing from an order)
  orderNumber?: string | null;
  orderId?: string | null;
  orderDate?: string | null;
  expectedDeliveryDate?: string | null;
  quantity?: number;
  fabricDetails?: string | null;
  designDetails?: string | null;
  availableVersions?: CustomerMeasurementVersion[];
  onSelectVersion?: (version: CustomerMeasurementVersion) => void;
}

export const PrintTailorSheetModal: React.FC<PrintTailorSheetModalProps> = ({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  profile,
  version,
  orderNumber,
  orderDate,
  expectedDeliveryDate,
  quantity = 1,
  fabricDetails,
  designDetails,
  availableVersions,
  onSelectVersion,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Boutique Store Info
  const [boutiqueInfo, setBoutiqueInfo] = useState({
    storeName: 'Yaazhi Boutique & Atelier',
    address: '42 Weaver Colony, Little Kanchipuram',
    phone: '+91 94440 12890',
  });

  // Selected Version for print
  const [activeVer, setActiveVer] = useState<CustomerMeasurementVersion | null>(
    version || profile?.current_version || null
  );

  useEffect(() => {
    settingsService
      .getSettings()
      .then((s) => {
        if (s) {
          setBoutiqueInfo({
            storeName: s.company_name || 'Yaazhi Boutique & Atelier',
            address: s.address || '42 Weaver Colony, Little Kanchipuram',
            phone: s.phone || '+91 94440 12890',
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setActiveVer(version || profile?.current_version || null);
  }, [version, profile]);

  if (!isOpen || !profile) return null;

  const currentVer = activeVer || version || profile.current_version;
  const values = currentVer?.values || [];
  const garmentType = profile.garment_type || 'Blouse';
  const orderRef = orderNumber || currentVer?.order_number || currentVer?.order_id || null;

  const formatDate = (dateVal: string | Date | undefined) => {
    if (!dateVal) return '—';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateVal);
    }
  };

  const formatDateTime = (dateVal: string | Date | undefined) => {
    if (!dateVal) return new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return `${d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })} ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return String(dateVal);
    }
  };

  const handlePrint = () => {
    if (!currentVer || values.length === 0) return;
    window.print();
  };

  const handleVersionChange = (newVerId: string) => {
    const found = (availableVersions || profile.versions || []).find((v) => v.id === newVerId);
    if (found) {
      setActiveVer(found);
      onSelectVersion?.(found);
    }
  };

  const hasVersionsToSelect = availableVersions && availableVersions.length > 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scissors size={15} style={{ color: 'var(--yz-primary, #832729)' }} />
          <span>Print Tailor Measurement Sheet</span>
        </div>
      }
      subtitle={`3-inch thermal printer roll preview (72–80 mm) • ${garmentType}`}
      maxWidth="420px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="gold"
            size="sm"
            icon={<Printer size={13} />}
            onClick={handlePrint}
            disabled={values.length === 0}
          >
            Print Measurement Sheet
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Version Switcher (if multiple versions available) */}
        {hasVersionsToSelect && (
          <div
            className="no-print"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--yz-bg-subtle)',
              border: '1px solid var(--yz-border)',
              borderRadius: 'var(--yz-radius-sm)',
              padding: '6px 10px',
              fontSize: '11px',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
              Measurement Version:
            </span>
            <select
              value={currentVer?.id || ''}
              onChange={(e) => handleVersionChange(e.target.value)}
              className="yz-input"
              style={{
                height: '26px',
                fontSize: '11px',
                padding: '2px 8px',
                fontWeight: 600,
                width: 'auto',
                minWidth: '160px',
              }}
            >
              {availableVersions.map((v) => (
                <option key={v.id} value={v.id}>
                  v{v.version_number} ({formatDate(v.measured_at)}) {v.is_current ? '• Current' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Empty state warning if no measurements exist */}
        {values.length === 0 && (
          <div
            style={{
              padding: '16px',
              textAlign: 'center',
              backgroundColor: 'var(--yz-alert-warning-bg, #FFFBEB)',
              border: '1px solid var(--yz-alert-warning-border, #FDE68A)',
              borderRadius: 'var(--yz-radius-md)',
              fontSize: '11px',
              color: 'var(--yz-alert-warning-text, #92400E)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircle size={20} />
            <strong style={{ fontSize: '12px' }}>No Measurement Data Recorded</strong>
            <p style={{ margin: 0 }}>
              This garment profile does not contain any saved measurement parameters. Please record measurements before printing.
            </p>
          </div>
        )}

        {/* 3-Inch Thermal Receipt Container (Screen Preview + Print Area) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: 'var(--yz-bg-canvas, #F1F5F9)',
            padding: '14px 10px',
            borderRadius: 'var(--yz-radius-md)',
            border: '1px solid var(--yz-border)',
            overflow: 'auto',
            maxHeight: '62vh',
          }}
        >
          <div
            ref={printAreaRef}
            className="yz-thermal-print-slip"
            style={{
              width: '100%',
              maxWidth: '290px', // Exactly 72–76mm printable width
              backgroundColor: '#FFFFFF',
              color: '#000000',
              fontFamily: "'Courier New', Courier, monospace, monospace",
              fontSize: '10.5px',
              lineHeight: '1.32',
              padding: '14px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '2px',
              border: '1px solid #E2E8F0',
              boxSizing: 'border-box',
            }}
          >
            {/* 1. Header: Boutique Branding */}
            <div style={{ textAlign: 'center', paddingBottom: '6px' }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 900,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  color: '#000000',
                  lineHeight: '1.2',
                }}
              >
                {boutiqueInfo.storeName}
              </div>
              <div style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#334155', marginTop: '2px' }}>
                Atelier Bespoke Tailoring
              </div>
              {boutiqueInfo.address && (
                <div style={{ fontSize: '8.5px', color: '#475569', marginTop: '1px', wordBreak: 'break-word' }}>
                  {boutiqueInfo.address}
                </div>
              )}
              {boutiqueInfo.phone && (
                <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#0F172A', marginTop: '1px' }}>
                  Ph: {boutiqueInfo.phone}
                </div>
              )}
            </div>

            {/* Separator */}
            <div style={{ borderTop: '1px dashed #000000', margin: '4px 0' }} />

            {/* 2. Heading: Clear Thermal Title */}
            <div style={{ textAlign: 'center', padding: '3px 0' }}>
              <div
                style={{
                  fontSize: '11.5px',
                  fontWeight: 900,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: '#000000',
                }}
              >
                TAILOR MEASUREMENT SHEET
              </div>
            </div>

            {/* Separator */}
            <div style={{ borderTop: '1px dashed #000000', margin: '4px 0' }} />

            {/* 3. Client, Order & Garment Meta (Vertical Compact Key-Value) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Date / Time:</span>
                <span style={{ fontWeight: 600 }}>{formatDateTime(currentVer?.measured_at)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: '#475569' }}>Customer:</span>
                <strong style={{ textAlign: 'right', maxWidth: '175px', wordBreak: 'break-word' }}>
                  {customerName}
                </strong>
              </div>
              {customerPhone && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>Phone:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{customerPhone}</span>
                </div>
              )}
              {orderRef && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dotted #CBD5E1', paddingTop: '2px', marginTop: '2px' }}>
                  <span style={{ color: '#000000', fontWeight: 700 }}>Order Ref:</span>
                  <strong style={{ fontFamily: 'monospace' }}>{orderRef}</strong>
                </div>
              )}
              {orderDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>Order Date:</span>
                  <span>{formatDate(orderDate)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ color: '#475569' }}>Garment:</span>
                <strong style={{ textTransform: 'uppercase', color: '#000000' }}>
                  {garmentType} {quantity > 1 ? `(Qty: ${quantity})` : ''}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Record Ver:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  v{currentVer?.version_number || 1} {currentVer?.is_current ? '• CURRENT' : '• ORDER REF'}
                </span>
              </div>
              {expectedDeliveryDate && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, marginTop: '2px', color: '#000000' }}>
                  <span>Target Delivery:</span>
                  <span>{formatDate(expectedDeliveryDate)}</span>
                </div>
              )}
              {currentVer?.measured_by && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#475569' }}>Master Tailor:</span>
                  <span>{currentVer.measured_by}</span>
                </div>
              )}
            </div>

            {/* Separator */}
            <div style={{ borderTop: '1px dashed #000000', margin: '5px 0' }} />

            {/* 4. Measurements Section: Simple Vertically Stacked List */}
            <div>
              <div
                style={{
                  fontSize: '9.5px',
                  fontWeight: 900,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                MEASUREMENTS ({values.length} PARAMETERS)
              </div>

              {values.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5px' }}>
                  {values.map((v, i) => {
                    const label = v.field_name || v.field_key || `Parameter ${i + 1}`;
                    const num =
                      v.numeric_value !== null && v.numeric_value !== undefined
                        ? v.numeric_value
                        : (v as any).num_value;
                    const unit = v.unit || 'in';

                    return (
                      <div
                        key={v.id || v.field_id || i}
                        style={{
                          borderBottom: '1px dotted #E2E8F0',
                          paddingBottom: '2px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline',
                            gap: '6px',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 500,
                              color: '#0F172A',
                              maxWidth: '170px',
                              wordBreak: 'break-word',
                              lineHeight: '1.25',
                            }}
                          >
                            {label}
                          </span>
                          <strong
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '11px',
                              whiteSpace: 'nowrap',
                              textAlign: 'right',
                              color: '#000000',
                            }}
                          >
                            {num !== null && num !== undefined ? `${num} ${unit}` : (v.text_value || '—')}
                          </strong>
                        </div>
                        {v.notes && (
                          <div style={{ fontSize: '8.5px', color: '#475569', fontStyle: 'italic', paddingLeft: '4px' }}>
                            * {v.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: '10px', color: '#64748B', fontStyle: 'italic', padding: '4px 0' }}>
                  No measurement values recorded
                </div>
              )}
            </div>

            {/* 5. Fabric, Design & Fitting Details */}
            {(fabricDetails || designDetails || currentVer?.fitting_preferences || currentVer?.tailor_instructions) && (
              <>
                <div style={{ borderTop: '1px dashed #000000', margin: '5px 0' }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '9.5px' }}>
                  {fabricDetails && (
                    <div>
                      <strong style={{ textTransform: 'uppercase', color: '#334155', display: 'block' }}>
                        Fabric Details:
                      </strong>
                      <div style={{ color: '#000000', wordBreak: 'break-word' }}>{fabricDetails}</div>
                    </div>
                  )}

                  {designDetails && (
                    <div>
                      <strong style={{ textTransform: 'uppercase', color: '#334155', display: 'block' }}>
                        Design & Alteration:
                      </strong>
                      <div style={{ color: '#000000', wordBreak: 'break-word' }}>{designDetails}</div>
                    </div>
                  )}

                  {currentVer?.fitting_preferences && (
                    <div>
                      <strong style={{ textTransform: 'uppercase', color: '#334155', display: 'block' }}>
                        Fitting Preference:
                      </strong>
                      <div style={{ color: '#000000', fontWeight: 600, wordBreak: 'break-word' }}>
                        {currentVer.fitting_preferences}
                      </div>
                    </div>
                  )}

                  {currentVer?.tailor_instructions && (
                    <div style={{ backgroundColor: '#F8FAFC', padding: '4px 6px', border: '1px solid #E2E8F0', borderRadius: '3px' }}>
                      <strong style={{ textTransform: 'uppercase', color: '#000000', display: 'block' }}>
                        Tailor Instructions:
                      </strong>
                      <div style={{ color: '#000000', fontWeight: 600, wordBreak: 'break-word' }}>
                        {currentVer.tailor_instructions}
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* 6. Space for Handwritten Tailor Notes */}
            <div style={{ borderTop: '1px dashed #000000', margin: '5px 0' }} />
            <div>
              <div style={{ fontSize: '9px', fontWeight: 800, textTransform: 'uppercase', color: '#334155', marginBottom: '3px' }}>
                Handwritten Tailor Notes:
              </div>
              <div
                style={{
                  border: '1px dashed #94A3B8',
                  height: '38px',
                  borderRadius: '2px',
                  backgroundColor: '#FFFFFF',
                }}
              />
            </div>

            {/* 7. Sign-off Line */}
            <div style={{ borderTop: '1px solid #000000', margin: '6px 0 4px 0' }} />
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '8.5px',
                fontWeight: 600,
                color: '#1E293B',
              }}
            >
              <span>Cutter: __________</span>
              <span>QC: [ ] PASS</span>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px dashed #000000', margin: '4px 0 2px 0' }} />
            <div
              style={{
                textAlign: 'center',
                fontSize: '8px',
                letterSpacing: '0.04em',
                color: '#64748B',
                textTransform: 'uppercase',
              }}
            >
              *** YAAZHI ATELIER WORKSHOP SLIP ***
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
