import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { Ruler, Scissors, Check, Calculator } from 'lucide-react';
import type { MeasurementTemplate, StitchingTemplate } from '../../types/template';

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  measurementTemplate?: MeasurementTemplate | null;
  stitchingTemplate?: StitchingTemplate | null;
}

export const TemplatePreviewModal: React.FC<TemplatePreviewModalProps> = ({
  isOpen,
  onClose,
  measurementTemplate,
  stitchingTemplate,
}) => {
  // Addon selection state for interactive price calculator in stitching preview
  const [selectedAddonIds, setSelectedAddonIds] = useState<Record<string, boolean>>({});

  // Reset or initialize addons when stitching template opens
  React.useEffect(() => {
    if (stitchingTemplate?.addons) {
      const initial: Record<string, boolean> = {};
      stitchingTemplate.addons.forEach((a) => {
        if (a.id) initial[a.id] = Boolean(a.is_default_selected);
      });
      setSelectedAddonIds(initial);
    }
  }, [stitchingTemplate]);

  if (!isOpen) return null;

  const isMeasurement = Boolean(measurementTemplate);
  const title = isMeasurement
    ? measurementTemplate?.name || 'Measurement Specification'
    : stitchingTemplate?.name || 'Stitching Service Rate';

  // Stitching calculation
  const basePrice = stitchingTemplate ? parseFloat(String(stitchingTemplate.base_price)) || 0 : 0;
  const taxRate = stitchingTemplate ? parseFloat(String(stitchingTemplate.tax_rate)) || 5 : 5;
  const selectedAddonsTotal = stitchingTemplate?.addons
    ? stitchingTemplate.addons.reduce((acc, a) => {
        if (a.id && selectedAddonIds[a.id]) {
          return acc + (parseFloat(String(a.price)) || 0);
        }
        return acc;
      }, 0)
    : 0;
  const subtotal = basePrice + selectedAddonsTotal;
  const taxAmount = (subtotal * taxRate) / 100;
  const grandTotal = subtotal + taxAmount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isMeasurement ? (
            <Ruler size={18} color="var(--yz-primary)" />
          ) : (
            <Scissors size={18} color="var(--yz-primary)" />
          )}
          <span style={{ fontWeight: 600 }}>{title}</span>
          <Badge
            variant={
              (isMeasurement ? measurementTemplate?.is_archived : stitchingTemplate?.is_archived)
                ? 'danger'
                : 'success'
            }
          >
            {(isMeasurement ? measurementTemplate?.is_archived : stitchingTemplate?.is_archived)
              ? 'Archived'
              : 'Active'}
          </Badge>
          {(isMeasurement ? measurementTemplate?.is_default : stitchingTemplate?.is_default) && (
            <Badge variant="warning">Atelier Default</Badge>
          )}
        </div>
      }
      subtitle={
        isMeasurement
          ? `Specification for ${measurementTemplate?.garment_type || 'Boutique'} • ${measurementTemplate?.category || 'WOMEN'} fitting profile`
          : `Atelier Rate Card for ${stitchingTemplate?.garment_type || 'Boutique'} • HSN SAC ${stitchingTemplate?.hsn_code || '9988'}`
      }
      maxWidth="740px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Description Banner */}
        {(isMeasurement ? measurementTemplate?.description : stitchingTemplate?.description) && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--yz-bg-subtle)',
              borderRadius: 'var(--yz-radius-md)',
              fontSize: '12px',
              color: 'var(--yz-text-secondary)',
              lineHeight: 1.5,
            }}
          >
            {isMeasurement ? measurementTemplate?.description : stitchingTemplate?.description}
          </div>
        )}

        {/* ======================================================== */}
        {/* MEASUREMENT TEMPLATE PREVIEW                            */}
        {/* ======================================================== */}
        {isMeasurement && measurementTemplate && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px',
                paddingBottom: '6px',
                borderBottom: '1px solid var(--yz-border-subtle)',
              }}
            >
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                Fitting Sheet Parameters ({measurementTemplate.fields?.length || 0})
              </span>
              <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                Client Profiles Linked: {measurementTemplate._count?.profiles ?? 0}
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '10px',
                maxHeight: '380px',
                overflowY: 'auto',
                paddingRight: '4px',
              }}
            >
              {(measurementTemplate.fields || []).map((field, idx) => (
                <div
                  key={field.id || idx}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--yz-radius-md)',
                    border: '1px solid var(--yz-border)',
                    backgroundColor: 'var(--yz-bg-canvas)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--yz-text-muted)' }}>
                        #{idx + 1}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 600 }}>{field.field_name}</span>
                      {field.is_required && (
                        <span style={{ color: 'var(--yz-status-out-stock)', fontWeight: 700 }}>*</span>
                      )}
                    </div>
                    <Badge variant={field.field_type === 'number' ? 'info' : 'neutral'}>
                      {field.field_type === 'number'
                        ? `Number (${field.default_unit || 'in'})`
                        : field.field_type === 'dropdown'
                        ? 'Dropdown'
                        : field.field_type === 'tailor_instruction'
                        ? 'Tailor Note'
                        : 'Text'}
                    </Badge>
                  </div>

                  {field.field_type === 'dropdown' && field.options && (
                    <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
                      <strong>Options:</strong> {field.options}
                    </div>
                  )}

                  {field.validation_rules && (
                    <div style={{ fontSize: '10px', color: 'var(--yz-text-secondary)', fontFamily: 'var(--yz-font-mono)' }}>
                      Rules: {field.validation_rules}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STITCHING TEMPLATE PREVIEW & INTERACTIVE ESTIMATOR       */}
        {/* ======================================================== */}
        {!isMeasurement && stitchingTemplate && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Rate Breakdown Header */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                padding: '14px',
                backgroundColor: 'var(--yz-bg-canvas)',
                borderRadius: 'var(--yz-radius-md)',
                border: '1px solid var(--yz-border)',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', display: 'block' }}>
                  Standard Base Rate
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                  ₹{basePrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', display: 'block' }}>
                  GST Tax Rate
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--yz-text-secondary)' }}>
                  {taxRate}% <span style={{ fontSize: '12px', fontWeight: 400 }}>(SAC 9988)</span>
                </span>
              </div>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', display: 'block' }}>
                  Configured Add-ons
                </span>
                <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--yz-text-secondary)' }}>
                  {stitchingTemplate.addons?.length || 0} Options
                </span>
              </div>
            </div>

            {/* Interactive Add-ons Sheet */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                }}
              >
                <span style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calculator size={15} color="var(--yz-primary)" /> Interactive Service Rate Simulator
                </span>
                <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                  Toggle add-ons to simulate client billing estimate
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {(stitchingTemplate.addons || []).map((addon, idx) => {
                  const isChecked = addon.id ? Boolean(selectedAddonIds[addon.id]) : false;
                  return (
                    <div
                      key={addon.id || idx}
                      onClick={() => {
                        if (addon.id) {
                          setSelectedAddonIds((prev) => ({
                            ...prev,
                            [addon.id!]: !prev[addon.id!],
                          }));
                        }
                      }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 'var(--yz-radius-md)',
                        border: `1px solid ${isChecked ? 'var(--yz-primary-border)' : 'var(--yz-border)'}`,
                        backgroundColor: isChecked ? 'var(--yz-primary-subtle)' : 'var(--yz-bg-canvas)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: `1px solid ${isChecked ? 'var(--yz-primary)' : 'var(--yz-border-strong)'}`,
                            backgroundColor: isChecked ? 'var(--yz-primary)' : 'var(--yz-bg-surface)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#FFFFFF',
                          }}
                        >
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '12px', fontWeight: 600 }}>{addon.name}</div>
                          {addon.description && (
                            <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                              {addon.description}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                          +₹{parseFloat(String(addon.price)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </span>
                        {addon.is_default_selected && (
                          <div style={{ fontSize: '10px', color: 'var(--yz-gold)', fontWeight: 600 }}>
                            Default Included
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Estimated Total Calculation Box */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--yz-radius-md)',
                backgroundColor: 'var(--yz-bg-subtle)',
                border: '1px solid var(--yz-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', display: 'block' }}>
                  Base ₹{basePrice} + Add-ons ₹{selectedAddonsTotal} + {taxRate}% GST (₹{taxAmount.toFixed(2)})
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
                  Total Estimated Atelier Quote
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--yz-primary)' }}>
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        {/* Template Code & System ID */}
        <div
          style={{
            paddingTop: '10px',
            borderTop: '1px solid var(--yz-border)',
            fontSize: '11px',
            color: 'var(--yz-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            Template Code: <code style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>{isMeasurement ? measurementTemplate?.code : stitchingTemplate?.code}</code>
          </span>
          <span style={{ fontSize: '10.5px' }}>
            {isMeasurement
              ? `${measurementTemplate?.fields?.length || 0} tailor parameters configured`
              : `${stitchingTemplate?.addons?.length || 0} atelier finish options`}
          </span>
        </div>
      </div>
    </Modal>
  );
};
