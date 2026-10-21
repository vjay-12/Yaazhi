import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import {
  customerService,
  type MeasurementTemplate,
  type CustomerMeasurementProfile,
} from '../../services/customerService';
import { templateService } from '../../services/templateService';
import { useToast } from '../../components/common/Toast';
import {
  Loader2,
  AlertCircle,
  Sparkles,
  Scissors,
} from 'lucide-react';
import { CustomDropdown } from '../../components/common/CustomDropdown';

export const GARMENT_TYPES = [
  'Blouse',
  'Chudidar',
  'Kurti',
  'Shirt',
  'Trousers',
  'Lehenga',
  'Salwar Kameez',
  'Anarkali',
  'Sherwani',
  'Other',
];

const PRESET_FITTING_CHIPS = [
  'Comfort Fit',
  'Snug / Fitted',
  'Relaxed / Loose',
  'Princess Cut Padded',
  'Bridal Heavy Lining',
  'High Neck Classic',
];

const PRESET_TAILOR_SUGGESTIONS = [
  'Leave 2-inch inner side margins for future adjustment',
  'Deep U-shaped back neck with latkan piping',
  'French seam finishing with cotton lining',
  'Side zipper with hook reinforcement',
  'Padded cups with princess cut stitch line',
];

interface AddMeasurementModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  onSaved: () => void;
  existingProfile?: CustomerMeasurementProfile | null;
  mode?: 'new_profile' | 'new_version' | 'edit_profile';
  availableOrders?: Array<{ id: string; orderNumber: string; date?: string }>;
}

interface FieldValueState {
  field_id: string;
  field_name: string;
  field_key: string;
  field_type: 'number' | 'text' | 'dropdown' | 'tailor_instruction' | string;
  num_value: string;
  unit: 'in' | 'cm';
  notes: string;
  is_required: boolean;
  options?: string[];
  validation_rules?: { min?: number; max?: number; step?: number } | null;
  error?: string | null;
}

export const AddMeasurementModal: React.FC<AddMeasurementModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  customerPhone,
  onSaved,
  existingProfile,
  mode = existingProfile ? 'new_version' : 'new_profile',
  availableOrders = [],
}) => {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [selectedGarmentFilter, setSelectedGarmentFilter] = useState<string>('ALL');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [globalUnit, setGlobalUnit] = useState<'in' | 'cm'>('in');
  const [profileName, setProfileName] = useState<string>('');
  const [garmentType, setGarmentType] = useState<string>('Blouse');
  const [profileNotes, setProfileNotes] = useState<string>('');
  const [fittingPreferences, setFittingPreferences] = useState<string>('Comfort Fit');
  const [tailorInstructions, setTailorInstructions] = useState<string>('Leave 2-inch inner side margins for future adjustment');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [measuredBy, setMeasuredBy] = useState<string>('Showroom Master');
  const [measuredAt, setMeasuredAt] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [fields, setFields] = useState<FieldValueState[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);

  const draftKey = `yaazhi_measurement_draft_${customerId}`;

  // Filter templates: only ACTIVE and UNARCHIVED templates can be selected for new profiles
  const selectableTemplates = useMemo(() => {
    return templates.filter((t) => !t.is_archived && t.is_active !== false);
  }, [templates]);

  // Secondary filter by garment type if selected
  const filteredTemplates = useMemo(() => {
    if (selectedGarmentFilter === 'ALL') return selectableTemplates;
    return selectableTemplates.filter(
      (t) => (t.garment_type || '').toLowerCase() === selectedGarmentFilter.toLowerCase()
    );
  }, [selectableTemplates, selectedGarmentFilter]);

  // Helper to map template fields to form state
  const populateFieldsFromTemplate = (tmpl: MeasurementTemplate, unit: 'in' | 'cm') => {
    const mapped: FieldValueState[] = (tmpl.fields || [])
      .filter((f) => f.is_active !== false)
      .map((f) => {
        let parsedOptions: string[] | undefined;
        if (f.options) {
          try {
            parsedOptions = typeof f.options === 'string' ? JSON.parse(f.options) : f.options;
          } catch {
            parsedOptions = undefined;
          }
        }

        let parsedRules: any = null;
        if (f.validation_rules) {
          try {
            parsedRules = typeof f.validation_rules === 'string' ? JSON.parse(f.validation_rules) : f.validation_rules;
          } catch {
            parsedRules = null;
          }
        }

        return {
          field_id: f.id || f.field_key || '',
          field_name: f.field_name,
          field_key: f.field_key,
          field_type: f.field_type || 'number',
          num_value: '',
          unit: (f.default_unit as 'in' | 'cm') || unit,
          notes: '',
          is_required: Boolean(f.is_required),
          options: parsedOptions,
          validation_rules: parsedRules,
          error: null,
        };
      });
    setFields(mapped);
  };

  // Load active templates and initialize fields
  useEffect(() => {
    if (!isOpen) return;

    const fetchTemplates = async () => {
      setIsLoadingTemplates(true);
      try {
        // Fetch only active, non-archived templates
        const tmpls = await templateService.getMeasurementTemplates({ include_archived: false });
        setTemplates(tmpls || []);

        if (existingProfile) {
          // Version or Edit mode
          setProfileName(existingProfile.profile_name);
          setGarmentType(existingProfile.garment_type || 'Blouse');
          setSelectedTemplateId(existingProfile.template_id || '');

          const currentVer = existingProfile.current_version;
          const firstUnit = (currentVer?.values?.[0]?.unit as 'in' | 'cm') || 'in';
          setGlobalUnit(firstUnit);
          setProfileNotes(currentVer?.notes || existingProfile.notes || '');
          setFittingPreferences(currentVer?.fitting_preferences || 'Comfort Fit');
          setTailorInstructions(currentVer?.tailor_instructions || 'Leave 2-inch inner side margins for future adjustment');
          setMeasuredBy(currentVer?.measured_by || 'Showroom Master');
          setSelectedOrderId(currentVer?.order_id || '');

          // Find template fields (or fallback to snapshot in current version)
          const tmpl = (tmpls || []).find((t) => t.id === existingProfile.template_id);
          const rawFields = tmpl?.fields?.length
            ? tmpl.fields
            : currentVer?.field_snapshots || [];

          if (rawFields && rawFields.length > 0) {
            const mapped: FieldValueState[] = rawFields
              .filter((f: any) => f.is_active !== false)
              .map((f: any) => {
                const matchedVal = currentVer?.values?.find(
                  (v) => v.field_id === f.id || v.field_key === f.field_key
                );

                const val = matchedVal
                  ? matchedVal.numeric_value !== undefined && matchedVal.numeric_value !== null
                    ? String(matchedVal.numeric_value)
                    : matchedVal.text_value || ''
                  : '';

                let parsedOptions: string[] | undefined;
                if (f.options) {
                  try {
                    parsedOptions = typeof f.options === 'string' ? JSON.parse(f.options) : f.options;
                  } catch {
                    parsedOptions = undefined;
                  }
                }

                let parsedRules: any = null;
                if (f.validation_rules) {
                  try {
                    parsedRules = typeof f.validation_rules === 'string' ? JSON.parse(f.validation_rules) : f.validation_rules;
                  } catch {
                    parsedRules = null;
                  }
                }

                return {
                  field_id: f.id || f.field_key || '',
                  field_name: f.field_name,
                  field_key: f.field_key,
                  field_type: f.field_type || 'number',
                  num_value: val,
                  unit: (f.default_unit as 'in' | 'cm') || firstUnit,
                  notes: matchedVal?.notes || '',
                  is_required: Boolean(f.is_required),
                  options: parsedOptions,
                  validation_rules: parsedRules,
                  error: null,
                };
              });
            setFields(mapped);
          }
        } else {
          // New Profile Mode
          // Check for existing draft in localStorage
          const savedDraftStr = localStorage.getItem(draftKey);
          if (savedDraftStr) {
            try {
              const draft = JSON.parse(savedDraftStr);
              if (draft && draft.fields && draft.fields.length > 0) {
                setHasDraftNotice(true);
              }
            } catch {
              // Ignore invalid draft
            }
          }

          const defaultTmpl = tmpls.find((t) => t.is_default) || tmpls[0];
          if (defaultTmpl) {
            setSelectedTemplateId(defaultTmpl.id);
            const garment = defaultTmpl.garment_type || 'Blouse';
            setGarmentType(garment);
            setProfileName(`${customerName} — ${defaultTmpl.name}`);
            populateFieldsFromTemplate(defaultTmpl, 'in');
          }
        }
      } catch (err: any) {
        console.error('Failed to load templates in AddMeasurementModal:', err);
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    fetchTemplates();
  }, [isOpen, existingProfile, customerName, draftKey]);


  // When changing template in new mode, update fields
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const tmpl = templates.find((t) => t.id === templateId);
    if (tmpl) {
      if (mode === 'new_profile') {
        setProfileName(`${customerName} — ${tmpl.name}`);
        setGarmentType(tmpl.garment_type || 'Blouse');
      }
      populateFieldsFromTemplate(tmpl, globalUnit);
    }
  };

  // Unit switch
  const handleUnitToggle = (unit: 'in' | 'cm') => {
    setGlobalUnit(unit);
    setFields((prev) => prev.map((f) => ({ ...f, unit })));
  };

  // Field change & auto-save draft
  const handleFieldValueChange = (fieldId: string, val: string) => {
    setFields((prev) =>
      prev.map((f) => {
        if (f.field_id !== fieldId) return f;
        return { ...f, num_value: val, error: null };
      })
    );

    // Save draft in localStorage if in new profile mode
    if (mode === 'new_profile') {
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            profileName,
            garmentType,
            selectedTemplateId,
            globalUnit,
            fittingPreferences,
            tailorInstructions,
            measuredBy,
            fields: fields.map((f) => (f.field_id === fieldId ? { ...f, num_value: val } : f)),
            updatedAt: new Date().toISOString(),
          })
        );
      } catch {
        // quota exceeded or private mode, safe to ignore
      }
    }
  };

  // Restore draft handler
  const handleRestoreDraft = () => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const d = JSON.parse(saved);
        if (d.profileName) setProfileName(d.profileName);
        if (d.garmentType) setGarmentType(d.garmentType);
        if (d.selectedTemplateId) setSelectedTemplateId(d.selectedTemplateId);
        if (d.globalUnit) setGlobalUnit(d.globalUnit);
        if (d.fittingPreferences) setFittingPreferences(d.fittingPreferences);
        if (d.tailorInstructions) setTailorInstructions(d.tailorInstructions);
        if (d.measuredBy) setMeasuredBy(d.measuredBy);
        if (d.fields && Array.isArray(d.fields)) setFields(d.fields);
        setHasDraftNotice(false);
        showToast({
          type: 'info',
          title: 'Draft Restored',
          message: 'Restored your in-progress measurements.',
        });
      }
    } catch {
      showToast({ type: 'error', title: 'Draft Error', message: 'Could not restore draft' });
    }
  };

  // Clear draft handler
  const handleClearDraft = () => {
    localStorage.removeItem(draftKey);
    setHasDraftNotice(false);
  };

  // Validation & Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!profileName.trim()) {
      setErrorMessage('Profile name is required');
      return;
    }
    if (!selectedTemplateId) {
      setErrorMessage('Garment template is required');
      return;
    }

    // Dynamic field validation
    let hasValidationError = false;
    const validatedFields = fields.map((f) => {
      let fieldError: string | null = null;
      const trimmedVal = f.num_value.trim();

      // Required check
      if (f.is_required && !trimmedVal) {
        fieldError = `${f.field_name} is required`;
        hasValidationError = true;
      } else if (f.field_type === 'number' && trimmedVal) {
        const num = parseFloat(trimmedVal);
        if (isNaN(num)) {
          fieldError = 'Must be a valid number';
          hasValidationError = true;
        } else if (f.validation_rules) {
          if (f.validation_rules.min !== undefined && num < f.validation_rules.min) {
            fieldError = `Min value: ${f.validation_rules.min} ${f.unit}`;
            hasValidationError = true;
          } else if (f.validation_rules.max !== undefined && num > f.validation_rules.max) {
            fieldError = `Max value: ${f.validation_rules.max} ${f.unit}`;
            hasValidationError = true;
          }
        }
      }

      return { ...f, error: fieldError };
    });

    if (hasValidationError) {
      setFields(validatedFields);
      setErrorMessage('Please correct the validation errors in the highlighted measurement fields.');
      return;
    }

    try {
      setIsSubmitting(true);

      const formattedValues = validatedFields.map((f) => {
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

      if (mode === 'edit_profile' && existingProfile) {
        // Edit current profile
        await customerService.updateMeasurementProfile(customerId, existingProfile.id, {
          profile_name: profileName.trim(),
          garment_type: garmentType,
          notes: profileNotes.trim() || undefined,
          fitting_preferences: fittingPreferences.trim() || undefined,
          tailor_instructions: tailorInstructions.trim() || undefined,
          measured_by: measuredBy.trim() || undefined,
          order_id: selectedOrderId || undefined,
          values: formattedValues,
        });

        showToast({
          type: 'success',
          title: 'Measurement Updated',
          message: `Saved changes for ${profileName}`,
        });
      } else if (mode === 'new_version' && existingProfile) {
        // Record new version (v2, v3...)
        await customerService.addMeasurementVersion(customerId, existingProfile.id, {
          notes: profileNotes.trim() || undefined,
          fitting_preferences: fittingPreferences.trim() || undefined,
          tailor_instructions: tailorInstructions.trim() || undefined,
          order_id: selectedOrderId || undefined,
          measured_by: measuredBy.trim() || undefined,
          measured_at: measuredAt,
          values: formattedValues,
        });

        showToast({
          type: 'success',
          title: 'New Version Recorded',
          message: `Recorded updated measurements for ${existingProfile.profile_name}`,
        });
      } else {
        // Create new garment profile
        await customerService.createMeasurementProfile(customerId, {
          template_id: selectedTemplateId,
          profile_name: profileName.trim(),
          garment_type: garmentType,
          notes: profileNotes.trim() || undefined,
          fitting_preferences: fittingPreferences.trim() || undefined,
          tailor_instructions: tailorInstructions.trim() || undefined,
          order_id: selectedOrderId || undefined,
          measured_by: measuredBy.trim() || undefined,
          measured_at: measuredAt,
          values: formattedValues,
        });

        showToast({
          type: 'success',
          title: 'Measurement Record Created',
          message: `Saved ${garmentType} measurements for ${customerName}`,
        });
      }

      // Clear draft on successful save
      localStorage.removeItem(draftKey);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Scissors size={17} style={{ color: 'var(--yz-primary, #832729)' }} />
          <span>
            {mode === 'edit_profile'
              ? `Edit Measurements — ${existingProfile?.profile_name}`
              : mode === 'new_version'
              ? `Record New Version — ${existingProfile?.profile_name}`
              : `Add Garment Measurement — ${customerName}`}
          </span>
        </div>
      }
      subtitle={
        mode === 'new_version'
          ? `Current Version: v${existingProfile?.current_version?.version_number || 1} • Historical versions remain permanently preserved`
          : 'Dynamic tailoring specification with garment-specific guidelines, validation, and atelier job instructions'
      }
      maxWidth="780px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Draft Notice Banner */}
        {hasDraftNotice && mode === 'new_profile' && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 'var(--yz-radius-sm)',
              fontSize: '11.5px',
              color: '#1E40AF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} />
              <span>You have unsaved measurement draft for this customer.</span>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <Button variant="secondary" size="sm" type="button" onClick={handleClearDraft} style={{ fontSize: '10.5px' }}>
                Discard Draft
              </Button>
              <Button variant="primary" size="sm" type="button" onClick={handleRestoreDraft} style={{ fontSize: '10.5px' }}>
                Restore Draft
              </Button>
            </div>
          </div>
        )}

        {/* Error Alert Box */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 'var(--yz-radius-sm)',
              color: '#991B1B',
              fontSize: '11.5px',
              fontWeight: 500,
            }}
          >
            <AlertCircle size={15} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Garment Type & Template Filter Bar (New Profile Mode) */}
        {mode === 'new_profile' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              backgroundColor: 'var(--yz-bg-subtle)',
              padding: '10px 12px',
              borderRadius: 'var(--yz-radius-sm)',
              border: '1px solid var(--yz-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="yz-label" style={{ marginBottom: 0 }}>
                1. Select Garment Type & Active Template *
              </label>
              <span style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)' }}>
                {selectableTemplates.length} active templates available
              </span>
            </div>

            {/* Garment Quick Chips */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {['ALL', 'Blouse', 'Chudidar', 'Kurti', 'Shirt', 'Trousers', 'Lehenga'].map((g) => {
                const isSelected = selectedGarmentFilter === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setSelectedGarmentFilter(g)}
                    style={{
                      padding: '3px 9px',
                      borderRadius: 'var(--yz-radius-full)',
                      fontSize: '10.5px',
                      fontWeight: isSelected ? 700 : 500,
                      border: isSelected
                        ? '1px solid var(--yz-primary, #832729)'
                        : '1px solid var(--yz-border)',
                      backgroundColor: isSelected ? 'var(--yz-primary, #832729)' : 'var(--yz-bg-surface)',
                      color: isSelected ? '#FFFFFF' : 'var(--yz-text-secondary)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {g === 'ALL' ? 'All Garments' : g}
                  </button>
                );
              })}
            </div>

            {/* Template Dropdown */}
            <CustomDropdown
              value={selectedTemplateId}
              onChange={(val) => handleTemplateChange(String(val))}
              disabled={isLoadingTemplates}
              options={filteredTemplates.map((t) => ({
                value: t.id,
                label: `${t.name} (${t.garment_type || t.category}) — ${t.fields?.length || 0} fields`,
              }))}
              minWidth="100%"
              style={{ width: '100%', marginTop: '2px' }}
            />
          </div>
        )}

        {/* Profile Name & Units Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 140px',
            gap: '10px',
            alignItems: 'flex-end',
          }}
        >
          {/* Profile Name */}
          <div>
            <label className="yz-label">Garment / Fitting Profile Name *</label>
            <input
              type="text"
              className="yz-input"
              required
              placeholder="e.g. Saree Blouse — Wedding Zari"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
            />
          </div>

          {/* Garment Type */}
          <div>
            <label className="yz-label">Garment Category</label>
            <CustomDropdown
              value={garmentType}
              onChange={(val) => setGarmentType(String(val))}
              options={GARMENT_TYPES.map((gt) => ({ value: gt, label: gt }))}
              minWidth="100%"
              style={{ width: '100%' }}
            />
          </div>

          {/* Global Units Toggle */}
          <div>
            <label className="yz-label">Fitting Units</label>
            <div
              style={{
                display: 'inline-flex',
                borderRadius: 'var(--yz-radius-sm)',
                border: '1px solid var(--yz-border)',
                overflow: 'hidden',
                height: '32px',
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
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: globalUnit === 'in' ? 'var(--yz-primary, #832729)' : 'var(--yz-bg-surface)',
                  color: globalUnit === 'in' ? '#FFFFFF' : 'var(--yz-text-secondary)',
                  transition: 'all 0.15s ease',
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
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: globalUnit === 'cm' ? 'var(--yz-primary, #832729)' : 'var(--yz-bg-surface)',
                  color: globalUnit === 'cm' ? '#FFFFFF' : 'var(--yz-text-secondary)',
                  transition: 'all 0.15s ease',
                }}
              >
                CM (cm)
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Measurement Fields Form */}
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
              2. Tailoring Parameter Values ({fields.length} Fields)
            </span>
            <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>
              Standard Atelier Tape ({globalUnit === 'in' ? 'Inches' : 'Centimeters'}) • * Indicates required field
            </span>
          </div>

          <div
            style={{
              maxHeight: '270px',
              overflowY: 'auto',
              border: '1px solid var(--yz-border)',
              borderRadius: 'var(--yz-radius-md)',
              padding: '12px',
              backgroundColor: 'var(--yz-bg-surface)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '10px',
            }}
          >
            {fields.map((f) => {
              const hasErr = Boolean(f.error);

              return (
                <div
                  key={f.field_id}
                  style={{
                    backgroundColor: hasErr ? '#FEF2F2' : 'var(--yz-bg-subtle)',
                    padding: '8px 10px',
                    borderRadius: 'var(--yz-radius-sm)',
                    border: hasErr ? '1.5px solid #EF4444' : '1px solid var(--yz-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        color: hasErr ? '#991B1B' : 'var(--yz-text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={f.field_name}
                    >
                      {f.field_name} {f.is_required && <span style={{ color: '#DC2626' }}>*</span>}
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

                  {/* Render based on field type */}
                  {f.field_type === 'dropdown' && f.options && f.options.length > 0 ? (
                    <select
                      className="yz-input"
                      value={f.num_value}
                      onChange={(e) => handleFieldValueChange(f.field_id, e.target.value)}
                      style={{
                        height: '28px',
                        fontSize: '11px',
                        padding: '2px 6px',
                        backgroundColor: 'var(--yz-bg-surface)',
                      }}
                    >
                      <option value="">Select style / cut...</option>
                      {f.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : f.field_type === 'tailor_instruction' ? (
                    <input
                      type="text"
                      className="yz-input"
                      placeholder="Special workshop notes"
                      value={f.num_value}
                      onChange={(e) => handleFieldValueChange(f.field_id, e.target.value)}
                      style={{ height: '28px', fontSize: '11px', padding: '2px 6px' }}
                    />
                  ) : (
                    <input
                      type={f.field_type === 'number' ? 'number' : 'text'}
                      step="0.25"
                      min={f.validation_rules?.min}
                      max={f.validation_rules?.max}
                      className="yz-input font-mono"
                      placeholder={f.validation_rules?.min ? `Min: ${f.validation_rules.min}` : '—'}
                      value={f.num_value}
                      onChange={(e) => handleFieldValueChange(f.field_id, e.target.value)}
                      style={{
                        height: '28px',
                        fontSize: '12px',
                        padding: '2px 6px',
                        fontWeight: 700,
                        backgroundColor: 'var(--yz-bg-surface)',
                      }}
                    />
                  )}

                  {/* Inline Error Notice */}
                  {f.error && (
                    <span style={{ fontSize: '9.5px', color: '#DC2626', fontWeight: 600 }}>
                      {f.error}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fitting Preferences & Tailor Instructions Section */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            backgroundColor: 'var(--yz-bg-subtle)',
            padding: '12px',
            borderRadius: 'var(--yz-radius-md)',
            border: '1px solid var(--yz-border)',
          }}
        >
          {/* Fitting Preferences */}
          <div>
            <label className="yz-label">Client Fitting Preference</label>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
              {PRESET_FITTING_CHIPS.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setFittingPreferences(chip)}
                  style={{
                    fontSize: '9.5px',
                    padding: '2px 7px',
                    borderRadius: 'var(--yz-radius-full)',
                    border: '1px solid var(--yz-border)',
                    backgroundColor: fittingPreferences === chip ? '#FEF2F2' : 'var(--yz-bg-surface)',
                    color: fittingPreferences === chip ? 'var(--yz-primary, #832729)' : 'var(--yz-text-secondary)',
                    fontWeight: fittingPreferences === chip ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="yz-input"
              value={fittingPreferences}
              onChange={(e) => setFittingPreferences(e.target.value)}
              placeholder="e.g. Snug fitted with 1.5 in inner margins"
            />
          </div>

          {/* Workshop Tailor Instructions */}
          <div>
            <label className="yz-label">Atelier Workshop Instructions</label>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
              {PRESET_TAILOR_SUGGESTIONS.slice(0, 2).map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setTailorInstructions(sug)}
                  style={{
                    fontSize: '9px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid #FED7AA',
                    backgroundColor: '#FFFBEB',
                    color: '#92400E',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '180px',
                  }}
                  title={sug}
                >
                  + {sug}
                </button>
              ))}
            </div>
            <textarea
              className="yz-input"
              rows={2}
              value={tailorInstructions}
              onChange={(e) => setTailorInstructions(e.target.value)}
              placeholder="Specific notes for cutting and stitching masters"
              style={{ height: 'auto', resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Tailor & Order Linking Metadata */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          <div>
            <label className="yz-label">Master Tailor / Measured By</label>
            <input
              type="text"
              className="yz-input"
              placeholder="Master Tailor Velu"
              value={measuredBy}
              onChange={(e) => setMeasuredBy(e.target.value)}
            />
          </div>

          <div>
            <label className="yz-label">Fitting Date</label>
            <input
              type="date"
              className="yz-input"
              value={measuredAt}
              onChange={(e) => setMeasuredAt(e.target.value)}
            />
          </div>

          <div>
            <label className="yz-label">Link Stitching Order (Optional)</label>
            <select
              className="yz-input"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
            >
              <option value="">None (Stand-alone Fitting)</option>
              {availableOrders.map((ord) => (
                <option key={ord.id} value={ord.id}>
                  {ord.orderNumber} {ord.date ? `(${ord.date})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid var(--yz-border)',
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Client: <strong>{customerName}</strong> {customerPhone && `• ${customerPhone}`}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Loader2 size={13} className="animate-spin" /> Saving...
                </span>
              ) : mode === 'edit_profile' ? (
                'Save Changes'
              ) : mode === 'new_version' ? (
                'Record New Version'
              ) : (
                'Save Measurement Profile'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
