import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import {
  customerService,
  type MeasurementTemplate,
  type CustomerMeasurementProfile,
} from '../../services/customerService';
import { useToast } from '../../components/common/Toast';
import { Loader2 } from 'lucide-react';
import { CustomDropdown } from '../../components/common/CustomDropdown';

interface AddMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onSaved: () => void;
  existingProfile?: CustomerMeasurementProfile | null;
}

interface FieldValueState {
  field_id: string;
  field_name: string;
  field_key: string;
  field_type: 'number' | 'text';
  num_value: string;
  unit: 'in' | 'cm';
  notes: string;
  is_required: boolean;
}

export const AddMeasurementModal: React.FC<AddMeasurementModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  onSaved,
  existingProfile,
}) => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [globalUnit, setGlobalUnit] = useState<'in' | 'cm'>('in');
  const [profileName, setProfileName] = useState<string>('');
  const [profileNotes, setProfileNotes] = useState<string>('');
  const [measuredBy, setMeasuredBy] = useState<string>('');
  const [measuredAt, setMeasuredAt] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [fields, setFields] = useState<FieldValueState[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isNewVersionMode = Boolean(existingProfile);

  // Load templates when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const fetchTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        const data = await customerService.getTemplates();
        setTemplates(data || []);

        if (existingProfile) {
          // Version mode: prefill existing profile details and current version values
          setProfileName(existingProfile.profile_name);
          setProfileNotes(existingProfile.notes || '');
          setSelectedTemplateId(existingProfile.template_id || '');

          const tmpl = (data || []).find((t) => t.id === existingProfile.template_id) || existingProfile.template;
          const currentVer = existingProfile.current_version;
          const firstUnit = (currentVer?.values?.[0]?.unit as 'in' | 'cm') || 'in';
          setGlobalUnit(firstUnit);
          setMeasuredBy(currentVer?.measured_by || '');

          if (tmpl?.fields && tmpl.fields.length > 0) {
            const mapped: FieldValueState[] = tmpl.fields
              .filter((f) => f.is_active !== false)
              .map((f) => {
                const matchedVal = currentVer?.values?.find(
                  (v) => v.field_id === f.id || v.field_key === f.field_key
                );

                const val = matchedVal
                  ? matchedVal.numeric_value !== undefined && matchedVal.numeric_value !== null
                    ? String(matchedVal.numeric_value)
                    : matchedVal.text_value || ''
                  : '';

                return {
                  field_id: f.id,
                  field_name: f.field_name,
                  field_key: f.field_key,
                  field_type: f.field_type || 'number',
                  num_value: val,
                  unit: (f.default_unit as 'in' | 'cm') || firstUnit,
                  notes: matchedVal?.notes || '',
                  is_required: Boolean(f.is_required),
                };
              });
            setFields(mapped);
          }
        } else {
          // New profile mode: select first template by default
          const defaultTmpl = (data || []).find((t) => t.is_default) || data?.[0];
          if (defaultTmpl) {
            setSelectedTemplateId(defaultTmpl.id);
            setProfileName(`${customerName} - ${defaultTmpl.name}`);
            setFields(
              (defaultTmpl.fields || [])
                .filter((f) => f.is_active !== false)
                .map((f) => ({
                  field_id: f.id,
                  field_name: f.field_name,
                  field_key: f.field_key,
                  field_type: f.field_type || 'number',
                  num_value: '',
                  unit: (f.default_unit as 'in' | 'cm') || 'in',
                  notes: '',
                  is_required: Boolean(f.is_required),
                }))
            );
          }
        }
      } catch (err: any) {
        console.error('Failed to load templates in AddMeasurementModal:', err);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [isOpen, existingProfile, customerName]);

  // When changing template in new mode, update fields
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      if (!isNewVersionMode) {
        setProfileName(`${customerName} - ${tmpl.name}`);
      }
      setFields(
        (tmpl.fields || [])
          .filter((f) => f.is_active !== false)
          .map((f) => ({
            field_id: f.id,
            field_name: f.field_name,
            field_key: f.field_key,
            field_type: f.field_type || 'number',
            num_value: '',
            unit: (f.default_unit as 'in' | 'cm') || globalUnit,
            notes: '',
            is_required: Boolean(f.is_required),
          }))
      );
    }
  };

  const handleUnitToggle = (unit: 'in' | 'cm') => {
    setGlobalUnit(unit);
    setFields((prev) => prev.map((f) => ({ ...f, unit })));
  };

  const handleFieldValueChange = (fieldId: string, val: string) => {
    setFields((prev) =>
      prev.map((f) => (f.field_id === fieldId ? { ...f, num_value: val } : f))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setErrorMessage('Profile name is required');
      return;
    }
    if (!selectedTemplateId) {
      setErrorMessage('Garment template is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const formattedValues = fields.map((f) => {
        const isNum = f.field_type === 'number';
        const parsed = parseFloat(f.num_value);
        return {
          field_id: f.field_id,
          numeric_value: isNum && !isNaN(parsed) ? parsed : null,
          text_value: !isNum ? f.num_value || null : null,
          unit: f.unit || globalUnit,
          notes: f.notes || null,
        };
      });

      if (isNewVersionMode && existingProfile) {
        // Add new version (v2, v3...)
        await customerService.addMeasurementVersion(customerId, existingProfile.id, {
          notes: profileNotes.trim() || undefined,
          measured_by: measuredBy.trim() || undefined,
          measured_at: measuredAt,
          values: formattedValues,
        });

        showToast({
          type: 'success',
          title: 'New Version Recorded',
          message: `Updated measurements for ${existingProfile.profile_name}`,
        });
      } else {
        // Create new garment profile
        await customerService.createMeasurementProfile(customerId, {
          template_id: selectedTemplateId,
          profile_name: profileName.trim(),
          notes: profileNotes.trim() || undefined,
          measured_by: measuredBy.trim() || undefined,
          measured_at: measuredAt,
          values: formattedValues,
        });

        showToast({
          type: 'success',
          title: 'Measurement Profile Created',
          message: `Saved garment profile for ${customerName}`,
        });
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Save measurement error:', err);
      const msg = err.message || 'Could not save tailoring measurements';
      setErrorMessage(msg);
      showToast({
        type: 'error',
        title: 'Error Saving Measurements',
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={
        isNewVersionMode
          ? `Record New Version â€” ${existingProfile?.profile_name}`
          : `Add Garment Measurement â€” ${customerName}`
      }
      subtitle={
        isNewVersionMode
          ? `Current Version: v${existingProfile?.current_version?.version_number || 1} â€¢ Previous versions are preserved in audit history`
          : 'Define tailored body parameters using standard South Indian garment specifications'
      }
      maxWidth="680px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {errorMessage && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 'var(--yz-radius-sm)',
              color: '#991B1B',
              fontSize: '11.5px',
              fontWeight: 500,
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Top Configuration Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isNewVersionMode ? '1fr 1fr' : '1.3fr 1fr 120px',
            gap: '10px',
            backgroundColor: 'var(--yz-bg-subtle)',
            padding: '10px 12px',
            borderRadius: 'var(--yz-radius-sm)',
            border: '1px solid var(--yz-border)',
          }}
        >
          {/* Garment Template Selection */}
          {!isNewVersionMode && (
            <div>
              <label className="yz-label">Garment Type / Template *</label>
              <CustomDropdown
                value={selectedTemplateId}
                onChange={(val) => handleTemplateChange(String(val))}
                disabled={isLoadingTemplates}
                options={templates.map((t) => ({
                  value: t.id,
                  label: `${t.name} (${t.category})`,
                }))}
                minWidth="100%"
                style={{ width: '100%' }}
              />
            </div>
          )}

          {/* Profile Name */}
          <div>
            <label className="yz-label">Profile / Garment Name *</label>
            <input
              type="text"
              className="yz-input"
              required
              placeholder="e.g. Saree Blouse - Wedding Zari"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>

          {/* Unit Toggle */}
          <div>
            <label className="yz-label">Units</label>
            <div
              style={{
                display: 'inline-flex',
                borderRadius: 'var(--yz-radius-sm)',
                border: '1px solid var(--yz-border)',
                overflow: 'hidden',
                height: '28px',
                width: '100%',
              }}
            >
              <button
                type="button"
                onClick={() => handleUnitToggle('in')}
                style={{
                  flex: 1,
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: globalUnit === 'in' ? 'var(--yz-primary, #832729)' : 'var(--yz-bg-surface)',
                  color: globalUnit === 'in' ? '#FFFFFF' : 'var(--yz-text-secondary)',
                }}
              >
                Inches (in)
              </button>
              <button
                type="button"
                onClick={() => handleUnitToggle('cm')}
                style={{
                  flex: 1,
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: globalUnit === 'cm' ? 'var(--yz-primary, #832729)' : 'var(--yz-bg-surface)',
                  color: globalUnit === 'cm' ? '#FFFFFF' : 'var(--yz-text-secondary)',
                }}
              >
                CM (cm)
              </button>
            </div>
          </div>
        </div>

        {/* Tailor & Date Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="yz-label">Master Tailor / Measured By</label>
            <input
              type="text"
              className="yz-input"
              placeholder="e.g. Master Tailor Velu, Senior Cutter Muthu"
              value={measuredBy}
              onChange={(e) => setMeasuredBy(e.target.value)}
            />
          </div>
          <div>
            <label className="yz-label">Measurement Date</label>
            <input
              type="date"
              className="yz-input"
              value={measuredAt}
              onChange={(e) => setMeasuredAt(e.target.value)}
            />
          </div>
        </div>

        {/* Dynamic Measurement Fields Grid */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.4px',
                color: 'var(--yz-text-secondary)',
              }}
            >
              Garment Measurement Fields ({fields.length} Parameters)
            </span>
            <span style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)' }}>
              Values in {globalUnit === 'in' ? 'inches' : 'centimeters'}
            </span>
          </div>

          <div
            style={{
              maxHeight: '260px',
              overflowY: 'auto',
              border: '1px solid var(--yz-border)',
              borderRadius: 'var(--yz-radius-sm)',
              padding: '10px',
              backgroundColor: 'var(--yz-bg-surface)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: '8px',
            }}
          >
            {fields.map((f) => (
              <div
                key={f.field_id}
                style={{
                  backgroundColor: 'var(--yz-bg-subtle)',
                  padding: '6px 8px',
                  borderRadius: 'var(--yz-radius-sm)',
                  border: '1px solid var(--yz-border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: 'var(--yz-text-primary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={f.field_name}
                  >
                    {f.field_name} {f.is_required && <span style={{ color: 'var(--yz-primary, #832729)' }}>*</span>}
                  </label>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontFamily: 'var(--yz-font-mono)',
                      color: 'var(--yz-text-muted)',
                    }}
                  >
                    {f.unit}
                  </span>
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type={f.field_type === 'number' ? 'number' : 'text'}
                    step="0.25"
                    className="yz-input font-mono"
                    placeholder="—"
                    value={f.num_value}
                    onChange={(e) => handleFieldValueChange(f.field_id, e.target.value)}
                    style={{
                      height: '26px',
                      fontSize: '11.5px',
                      padding: '2px 6px',
                      fontWeight: 600,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Styling Notes / Cut Details */}
        <div>
          <label className="yz-label">Styling Notes / Tailoring Instructions</label>
          <textarea
            className="yz-input"
            rows={2}
            placeholder="e.g. Back neck deep round with latkan dori, padded cups, 1.5 in extra margin inside"
            value={profileNotes}
            onChange={(e) => setProfileNotes(e.target.value)}
            style={{ height: 'auto', padding: '6px 8px', resize: 'vertical' }}
          />
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            paddingTop: '10px',
            borderTop: '1px solid var(--yz-border)',
          }}
        >
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Loader2 size={13} className="animate-spin" /> Saving...
              </span>
            ) : isNewVersionMode ? (
              'Save New Version'
            ) : (
              'Save Measurement Profile'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
