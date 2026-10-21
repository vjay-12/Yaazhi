import React, { useRef } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Printer, Scissors, FileText } from 'lucide-react';
import type { CustomerMeasurementProfile, CustomerMeasurementVersion } from '../../services/customerService';

interface PrintTailorSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  customerPhone?: string;
  profile: CustomerMeasurementProfile | null;
  version?: CustomerMeasurementVersion | null;
}

export const PrintTailorSheetModal: React.FC<PrintTailorSheetModalProps> = ({
  isOpen,
  onClose,
  customerName,
  customerPhone,
  profile,
  version,
}) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !profile) return null;

  const currentVer = version || profile.current_version;
  const values = currentVer?.values || [];
  const garmentType = profile.garment_type || 'Blouse';
  const orderRef = currentVer?.order_number || currentVer?.order_id || null;
  const dateStr = currentVer?.measured_at
    ? new Date(currentVer.measured_at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scissors size={16} style={{ color: 'var(--yz-primary, #832729)' }} />
          <span>Tailor Fitting Slip — {profile.profile_name}</span>
        </div>
      }
      subtitle="Atelier job card ready for workshop cutting & stitching masters"
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Printable Card Area */}
        <div
          ref={printAreaRef}
          className="yaazhi-tailor-job-sheet"
          style={{
            backgroundColor: '#FFFFFF',
            color: '#0F172A',
            border: '2px solid #E2E8F0',
            borderRadius: 'var(--yz-radius-md)',
            padding: '20px 24px',
            fontFamily: 'var(--yz-font-sans, system-ui, sans-serif)',
          }}
        >
          {/* Atelier Brand Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              borderBottom: '2px solid #0F172A',
              paddingBottom: '12px',
            }}
          >
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '0.08em', color: '#832729', textTransform: 'uppercase' }}>
                YAAZHI ATELIER
              </div>
              <div style={{ fontSize: '10.5px', color: '#475569', letterSpacing: '0.04em', textTransform: 'uppercase', fontWeight: 600 }}>
                Custom Tailoring & Bespoke Workshop Job Card
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  display: 'inline-block',
                  backgroundColor: '#832729',
                  color: '#FFFFFF',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  textTransform: 'uppercase',
                }}
              >
                {garmentType} SLIP
              </div>
              <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#64748B', marginTop: '4px' }}>
                Ver: v{currentVer?.version_number || 1} • {currentVer?.is_current ? 'LATEST' : 'HISTORICAL'}
              </div>
            </div>
          </div>

          {/* Client & Fitting Metadata Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '6px',
              padding: '10px 14px',
              margin: '14px 0',
              fontSize: '11.5px',
            }}
          >
            <div>
              <span style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', display: 'block' }}>
                Client Name
              </span>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                {customerName}
              </div>
              {customerPhone && (
                <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '1px' }}>
                  Ph: {customerPhone}
                </div>
              )}
            </div>

            <div>
              <span style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', display: 'block' }}>
                Garment Profile
              </span>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                {profile.profile_name}
              </div>
              <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '1px' }}>
                Type: {garmentType}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '9.5px', fontWeight: 700, textTransform: 'uppercase', color: '#64748B', display: 'block' }}>
                Fitting Date & Tailor
              </span>
              <div style={{ fontWeight: 700, color: '#0F172A', marginTop: '2px' }}>
                {dateStr}
              </div>
              <div style={{ fontSize: '10.5px', color: '#475569', marginTop: '1px' }}>
                Tailor: {currentVer?.measured_by || 'Showroom Master'}
              </div>
            </div>
          </div>

          {/* Linked Order Reference */}
          {orderRef && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#1E40AF',
                marginBottom: '14px',
              }}
            >
              <FileText size={13} />
              <span><strong>Linked Stitching Order:</strong> {orderRef}</span>
            </div>
          )}

          {/* Measurements Table */}
          <div style={{ margin: '14px 0' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: '#334155',
                borderBottom: '1px solid #CBD5E1',
                paddingBottom: '4px',
                marginBottom: '8px',
              }}
            >
              Exact Tailoring Parameters ({values.length} Measurements)
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
              }}
            >
              {values.map((v, i) => {
                const num = v.numeric_value !== null && v.numeric_value !== undefined ? v.numeric_value : v.num_value;
                return (
                  <div
                    key={v.id || v.field_id || i}
                    style={{
                      border: '1px solid #E2E8F0',
                      borderRadius: '4px',
                      padding: '6px 8px',
                      backgroundColor: '#FAFAFA',
                    }}
                  >
                    <div style={{ fontSize: '10px', color: '#64748B', fontWeight: 600 }}>
                      {v.field_name || v.field_key || `Field ${i + 1}`}
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#0F172A',
                        marginTop: '2px',
                      }}
                    >
                      {num !== null && num !== undefined ? (
                        <span>
                          {num} <span style={{ fontSize: '10px', fontWeight: 500, color: '#64748B' }}>{v.unit || 'in'}</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>{v.text_value || '—'}</span>
                      )}
                    </div>
                    {v.notes && (
                      <div style={{ fontSize: '9px', color: '#64748B', fontStyle: 'italic', marginTop: '2px' }}>
                        Note: {v.notes}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Fitting Preferences & Tailor Instructions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '14px' }}>
            <div
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '10px 12px',
                backgroundColor: '#F8FAFC',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#475569', marginBottom: '4px' }}>
                Client Fitting Preference
              </div>
              <div style={{ fontSize: '11px', color: '#0F172A', fontWeight: 600 }}>
                {currentVer?.fitting_preferences || profile.notes || 'Standard boutique fit with standard comfort allowance.'}
              </div>
            </div>

            <div
              style={{
                border: '1px solid #FED7AA',
                borderRadius: '6px',
                padding: '10px 12px',
                backgroundColor: '#FFFBEB',
              }}
            >
              <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: '#92400E', marginBottom: '4px' }}>
                Special Workshop Instructions
              </div>
              <div style={{ fontSize: '11px', color: '#78350F', fontWeight: 600 }}>
                {currentVer?.tailor_instructions || 'Leave 2-inch inner side margins for future sizing adjustments. Finish seams with French piping.'}
              </div>
            </div>
          </div>

          {/* Workshop Sign-Off Block */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              borderTop: '1px dashed #94A3B8',
              marginTop: '18px',
              paddingTop: '12px',
              fontSize: '10px',
              color: '#64748B',
            }}
          >
            <div>
              <span style={{ display: 'block', fontWeight: 700 }}>Master Cutter Sign:</span>
              <div style={{ borderBottom: '1px solid #CBD5E1', height: '24px', marginTop: '4px' }} />
            </div>
            <div>
              <span style={{ display: 'block', fontWeight: 700 }}>Stitching Master Sign:</span>
              <div style={{ borderBottom: '1px solid #CBD5E1', height: '24px', marginTop: '4px' }} />
            </div>
            <div>
              <span style={{ display: 'block', fontWeight: 700 }}>Quality Check (QC):</span>
              <div style={{ borderBottom: '1px solid #CBD5E1', height: '24px', marginTop: '4px' }} />
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button variant="primary" icon={<Printer size={14} />} onClick={handlePrint}>
            Print Tailor Job Card
          </Button>
        </div>
      </div>
    </Modal>
  );
};
