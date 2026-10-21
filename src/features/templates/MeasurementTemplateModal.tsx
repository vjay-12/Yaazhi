import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { Plus, Trash2, ArrowUp, ArrowDown, Sparkles, AlertCircle } from 'lucide-react';
import type {
  MeasurementTemplate,
  MeasurementTemplateField,
  GarmentType,
  MeasurementFieldType,
} from '../../types/template';

interface MeasurementTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    garment_type: string;
    category: string;
    description?: string;
    fields: Array<Partial<MeasurementTemplateField>>;
  }) => Promise<void>;
  templateToEdit?: MeasurementTemplate | null;
}

const GARMENT_TYPES: GarmentType[] = [
  'Blouse',
  'Chudidar',
  'Kurti',
  'Shirt',
  'Trousers',
  'Lehenga',
  'Gown',
  'Other',
];

const CATEGORIES = [
  { value: 'WOMEN', label: 'Women' },
  { value: 'MEN', label: 'Men' },
  { value: 'UNISEX', label: 'Unisex' },
  { value: 'KIDS', label: 'Kids' },
];

const FIELD_TYPES: Array<{ value: MeasurementFieldType; label: string }> = [
  { value: 'number', label: 'Numeric Measurement' },
  { value: 'text', label: 'Text Field' },
  { value: 'dropdown', label: 'Dropdown Options' },
  { value: 'tailor_instruction', label: 'Tailor Instruction Box' },
];

const UNIT_OPTIONS = [
  { value: 'in', label: 'Inches (in)' },
  { value: 'cm', label: 'Centimeters (cm)' },
  { value: '', label: 'None' },
];

export const MeasurementTemplateModal: React.FC<MeasurementTemplateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  templateToEdit,
}) => {
  const [name, setName] = useState('');
  const [garmentType, setGarmentType] = useState<GarmentType>('Blouse');
  const [category, setCategory] = useState('WOMEN');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<Array<Partial<MeasurementTemplateField>>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (templateToEdit) {
      setName(templateToEdit.name);
      setGarmentType((templateToEdit.garment_type as GarmentType) || 'Blouse');
      setCategory(templateToEdit.category || 'WOMEN');
      setDescription(templateToEdit.description || '');
      setFields(
        (templateToEdit.fields || []).map((f) => ({
          id: f.id,
          field_key: f.field_key,
          field_name: f.field_name,
          field_type: f.field_type || 'number',
          default_unit: f.default_unit || 'in',
          display_order: f.display_order,
          is_required: Boolean(f.is_required),
          options: f.options || '',
          validation_rules: f.validation_rules || '',
        }))
      );
    } else {
      setName('');
      setGarmentType('Blouse');
      setCategory('WOMEN');
      setDescription('');
      setFields([
        {
          field_key: 'length',
          field_name: 'Garment Length',
          field_type: 'number',
          default_unit: 'in',
          display_order: 1,
          is_required: true,
          validation_rules: '{"min":10,"max":60}',
        },
        {
          field_key: 'shoulder',
          field_name: 'Shoulder Width',
          field_type: 'number',
          default_unit: 'in',
          display_order: 2,
          is_required: true,
          validation_rules: '{"min":10,"max":24}',
        },
        {
          field_key: 'chest_bust',
          field_name: 'Chest / Bust Circumference',
          field_type: 'number',
          default_unit: 'in',
          display_order: 3,
          is_required: true,
          validation_rules: '{"min":24,"max":60}',
        },
        {
          field_key: 'waist',
          field_name: 'Waist Circumference',
          field_type: 'number',
          default_unit: 'in',
          display_order: 4,
          is_required: true,
          validation_rules: '{"min":20,"max":56}',
        },
        {
          field_key: 'neck_cut',
          field_name: 'Neckline & Opening Style',
          field_type: 'dropdown',
          default_unit: '',
          display_order: 5,
          is_required: false,
          options: 'Front Hook, Back Hook, Side Zipper, Round Neck, Sweetheart, Boat Neck',
        },
        {
          field_key: 'tailor_instructions',
          field_name: 'Tailor Fitting Notes',
          field_type: 'tailor_instruction',
          default_unit: '',
          display_order: 6,
          is_required: false,
        },
      ]);
    }
    setErrors({});
  }, [templateToEdit, isOpen]);

  const handleAddField = () => {
    const newIndex = fields.length + 1;
    setFields([
      ...fields,
      {
        field_key: `param_${Date.now().toString().slice(-4)}`,
        field_name: '',
        field_type: 'number',
        default_unit: 'in',
        display_order: newIndex,
        is_required: false,
        options: '',
        validation_rules: '',
      },
    ]);
  };

  const handleRemoveField = (index: number) => {
    const updated = fields.filter((_, idx) => idx !== index);
    const reordered = updated.map((f, idx) => ({ ...f, display_order: idx + 1 }));
    setFields(reordered);
  };

  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= fields.length) return;

    const nextFields = [...fields];
    const [moved] = nextFields.splice(index, 1);
    nextFields.splice(targetIndex, 0, moved);

    const reordered = nextFields.map((f, idx) => ({ ...f, display_order: idx + 1 }));
    setFields(reordered);
  };

  const handleFieldChange = (index: number, key: keyof MeasurementTemplateField, value: any) => {
    const updated = [...fields];
    updated[index] = { ...updated[index], [key]: value };

    // Auto-generate key if label changed and key is default
    if (key === 'field_name' && typeof value === 'string') {
      const currentKey = updated[index].field_key;
      if (!currentKey || currentKey.startsWith('param_')) {
        updated[index].field_key = value.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24);
      }
    }
    setFields(updated);
  };

  const handleLoadPreset = (type: GarmentType) => {
    setGarmentType(type);
    if (type === 'Blouse') {
      setName(templateToEdit ? name : 'Designer Saree Blouse Fitting');
      setFields([
        { field_name: 'Blouse Length', field_key: 'blouse_length', field_type: 'number', default_unit: 'in', is_required: true, display_order: 1, validation_rules: '{"min":10,"max":22}' },
        { field_name: 'Shoulder Width', field_key: 'shoulder', field_type: 'number', default_unit: 'in', is_required: true, display_order: 2, validation_rules: '{"min":10,"max":20}' },
        { field_name: 'Bust (Chest)', field_key: 'bust', field_type: 'number', default_unit: 'in', is_required: true, display_order: 3, validation_rules: '{"min":26,"max":56}' },
        { field_name: 'Under Bust (Waist)', field_key: 'waist', field_type: 'number', default_unit: 'in', is_required: true, display_order: 4, validation_rules: '{"min":22,"max":50}' },
        { field_name: 'Armhole Circumference', field_key: 'armhole', field_type: 'number', default_unit: 'in', is_required: true, display_order: 5, validation_rules: '{"min":10,"max":24}' },
        { field_name: 'Sleeve Length', field_key: 'sleeve_length', field_type: 'number', default_unit: 'in', is_required: false, display_order: 6 },
        { field_name: 'Sleeve Round (Opening)', field_key: 'sleeve_round', field_type: 'number', default_unit: 'in', is_required: false, display_order: 7 },
        { field_name: 'Front Neck Depth', field_key: 'front_neck_depth', field_type: 'number', default_unit: 'in', is_required: false, display_order: 8 },
        { field_name: 'Back Neck Depth', field_key: 'back_neck_depth', field_type: 'number', default_unit: 'in', is_required: false, display_order: 9 },
        { field_name: 'Opening Fastener Style', field_key: 'opening_style', field_type: 'dropdown', default_unit: '', is_required: false, display_order: 10, options: 'Front Hook & Eye, Back Hook & Eye, Side Concealed Zipper, Back Potli Buttons' },
        { field_name: 'Cup & Cut Profile', field_key: 'cup_cut', field_type: 'dropdown', default_unit: '', is_required: false, display_order: 11, options: 'Regular 4-Dart, Princess Cut, Padded Cups, Katori Cut' },
        { field_name: 'Tailor Piping & Artisan Notes', field_key: 'tailor_notes', field_type: 'tailor_instruction', default_unit: '', is_required: false, display_order: 12 },
      ]);
    } else if (type === 'Kurti') {
      setName(templateToEdit ? name : 'Atelier Kurti Fitting');
      setFields([
        { field_name: 'Shoulder', field_key: 'shoulder', field_type: 'number', default_unit: 'in', is_required: true, display_order: 1 },
        { field_name: 'Bust', field_key: 'bust', field_type: 'number', default_unit: 'in', is_required: true, display_order: 2 },
        { field_name: 'Waist', field_key: 'waist', field_type: 'number', default_unit: 'in', is_required: true, display_order: 3 },
        { field_name: 'Hip', field_key: 'hip', field_type: 'number', default_unit: 'in', is_required: true, display_order: 4 },
        { field_name: 'Armhole', field_key: 'armhole', field_type: 'number', default_unit: 'in', is_required: true, display_order: 5 },
        { field_name: 'Kurti Full Length', field_key: 'kurti_length', field_type: 'number', default_unit: 'in', is_required: true, display_order: 6 },
        { field_name: 'Sleeve Length', field_key: 'sleeve_length', field_type: 'number', default_unit: 'in', is_required: false, display_order: 7 },
        { field_name: 'Kurti Silhouette', field_key: 'silhouette', field_type: 'dropdown', default_unit: '', is_required: false, display_order: 8, options: 'Straight Cut with Side Slits, A-Line Flare, Flared Anarkali, High-Low' },
        { field_name: 'Slit & Neck Detailing Notes', field_key: 'tailor_notes', field_type: 'tailor_instruction', default_unit: '', is_required: false, display_order: 9 },
      ]);
    } else if (type === 'Trousers') {
      setName(templateToEdit ? name : 'Cigarette Pant & Trouser Fitting');
      setFields([
        { field_name: 'Waist', field_key: 'waist', field_type: 'number', default_unit: 'in', is_required: true, display_order: 1 },
        { field_name: 'Hip', field_key: 'hip', field_type: 'number', default_unit: 'in', display_order: 2 },
        { field_name: 'Full Length', field_key: 'full_length', field_type: 'number', default_unit: 'in', is_required: true, display_order: 3 },
        { field_name: 'Thigh Round', field_key: 'thigh', field_type: 'number', default_unit: 'in', is_required: false, display_order: 4 },
        { field_key: 'ankle', field_name: 'Ankle / Mori Opening', field_type: 'number', default_unit: 'in', is_required: false, display_order: 5 },
        { field_key: 'waistband_type', field_name: 'Waistband Fastening', field_type: 'dropdown', default_unit: '', is_required: false, display_order: 6, options: 'Full Elastic Band, Front Flat Band & Back Elastic, Side Zipper' },
        { field_key: 'tailor_notes', field_name: 'Pocket & Hem Notes', field_type: 'tailor_instruction', default_unit: '', is_required: false, display_order: 7 },
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Template name is required';
    }
    if (fields.length === 0) {
      newErrors.fields = 'At least one measurement parameter must be defined';
    }
    for (let i = 0; i < fields.length; i++) {
      if (!fields[i].field_name?.trim()) {
        newErrors[`field_${i}`] = 'Parameter label is required';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        garment_type: garmentType,
        category,
        description: description.trim() || undefined,
        fields,
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save measurement template' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600 }}>
            {templateToEdit ? 'Edit Measurement Template' : 'New Measurement Template'}
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 8px',
              borderRadius: '9999px',
              backgroundColor: 'var(--yz-primary-subtle)',
              color: 'var(--yz-primary)',
              fontWeight: 600,
            }}
          >
            Specification Builder
          </span>
        </div>
      }
      subtitle="Configure tailor fitting parameters, input types, and required measurements for client garments."
      maxWidth="780px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '12px', color: 'var(--yz-text-muted)' }}>
            {fields.length} parameter{fields.length !== 1 ? 's' : ''} configured
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting}>
              {templateToEdit ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {errors.form && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--yz-alert-danger-bg)',
              color: 'var(--yz-alert-danger-text)',
              borderRadius: 'var(--yz-radius-md)',
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} />
            <span>{errors.form}</span>
          </div>
        )}

        {/* Top Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Template Name <span style={{ color: 'var(--yz-status-out-stock)' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Designer Saree Blouse Fitting"
              style={{
                width: '100%',
                height: 'var(--yz-control-height-md)',
                padding: '0 10px',
                borderRadius: 'var(--yz-input-radius)',
                border: `1px solid ${errors.name ? 'var(--yz-status-out-stock)' : 'var(--yz-border)'}`,
                backgroundColor: 'var(--yz-bg-surface)',
                color: 'var(--yz-text-primary)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {errors.name && <span style={{ fontSize: '11px', color: 'var(--yz-status-out-stock)' }}>{errors.name}</span>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Garment Type <span style={{ color: 'var(--yz-status-out-stock)' }}>*</span>
            </label>
            <CustomDropdown
              value={garmentType}
              onChange={(val) => setGarmentType(val as GarmentType)}
              options={GARMENT_TYPES.map((g) => ({ value: g, label: g }))}
              placeholder="Select Garment Type"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Client Category
            </label>
            <CustomDropdown
              value={category}
              onChange={(val) => setCategory(val)}
              options={CATEGORIES}
              placeholder="Select Category"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
            Atelier Description & Purpose
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Standard 22-parameter measurement form for bridal and silk blouse bespoke orders"
            style={{
              width: '100%',
              height: 'var(--yz-control-height-md)',
              padding: '0 10px',
              borderRadius: 'var(--yz-input-radius)',
              border: '1px solid var(--yz-border)',
              backgroundColor: 'var(--yz-bg-surface)',
              color: 'var(--yz-text-primary)',
              fontSize: '13px',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Quick Preset Toolbar */}
        {!templateToEdit && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              backgroundColor: 'var(--yz-bg-subtle)',
              borderRadius: 'var(--yz-radius-md)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={12} color="var(--yz-gold)" /> Quick Presets:
            </span>
            <button
              type="button"
              onClick={() => handleLoadPreset('Blouse')}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--yz-radius-sm)',
                border: '1px solid var(--yz-border)',
                backgroundColor: 'var(--yz-bg-surface)',
                cursor: 'pointer',
                color: 'var(--yz-text-primary)',
              }}
            >
              + Saree Blouse
            </button>
            <button
              type="button"
              onClick={() => handleLoadPreset('Kurti')}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--yz-radius-sm)',
                border: '1px solid var(--yz-border)',
                backgroundColor: 'var(--yz-bg-surface)',
                cursor: 'pointer',
                color: 'var(--yz-text-primary)',
              }}
            >
              + Kurti Suit
            </button>
            <button
              type="button"
              onClick={() => handleLoadPreset('Trousers')}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--yz-radius-sm)',
                border: '1px solid var(--yz-border)',
                backgroundColor: 'var(--yz-bg-surface)',
                cursor: 'pointer',
                color: 'var(--yz-text-primary)',
              }}
            >
              + Cigarette Pants
            </button>
          </div>
        )}

        {/* Field List Section */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Measurement Parameters</span>
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  color: 'var(--yz-text-secondary)',
                }}
              >
                {fields.length}
              </span>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={handleAddField}>
              <Plus size={13} style={{ marginRight: '4px' }} /> Add Parameter
            </Button>
          </div>

          {errors.fields && (
            <span style={{ fontSize: '11px', color: 'var(--yz-status-out-stock)', display: 'block', marginBottom: '8px' }}>
              {errors.fields}
            </span>
          )}

          <div
            style={{
              maxHeight: '340px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '4px',
            }}
          >
            {fields.map((field, idx) => (
              <div
                key={idx}
                style={{
                  padding: '10px 12px',
                  borderRadius: 'var(--yz-radius-md)',
                  border: '1px solid var(--yz-border)',
                  backgroundColor: 'var(--yz-bg-canvas)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {/* Field Top Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  {/* Order & Reorder Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        width: '20px',
                        textAlign: 'center',
                        color: 'var(--yz-text-muted)',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMoveField(idx, 'up')}
                      disabled={idx === 0}
                      style={{
                        padding: '2px',
                        background: 'transparent',
                        border: 'none',
                        cursor: idx === 0 ? 'not-allowed' : 'pointer',
                        color: idx === 0 ? 'var(--yz-border-strong)' : 'var(--yz-text-secondary)',
                      }}
                      title="Move up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveField(idx, 'down')}
                      disabled={idx === fields.length - 1}
                      style={{
                        padding: '2px',
                        background: 'transparent',
                        border: 'none',
                        cursor: idx === fields.length - 1 ? 'not-allowed' : 'pointer',
                        color: idx === fields.length - 1 ? 'var(--yz-border-strong)' : 'var(--yz-text-secondary)',
                      }}
                      title="Move down"
                    >
                      <ArrowDown size={13} />
                    </button>
                  </div>

                  {/* Parameter Label */}
                  <div style={{ flex: '2', minWidth: '160px' }}>
                    <input
                      type="text"
                      value={field.field_name || ''}
                      onChange={(e) => handleFieldChange(idx, 'field_name', e.target.value)}
                      placeholder="Parameter Label (e.g. Bust, Armhole)"
                      style={{
                        width: '100%',
                        height: '30px',
                        padding: '0 8px',
                        borderRadius: 'var(--yz-radius-sm)',
                        border: `1px solid ${errors[`field_${idx}`] ? 'var(--yz-status-out-stock)' : 'var(--yz-border)'}`,
                        backgroundColor: 'var(--yz-bg-surface)',
                        color: 'var(--yz-text-primary)',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Type Selector */}
                  <div style={{ width: '150px' }}>
                    <select
                      value={field.field_type || 'number'}
                      onChange={(e) => handleFieldChange(idx, 'field_type', e.target.value)}
                      style={{
                        width: '100%',
                        height: '30px',
                        padding: '0 8px',
                        borderRadius: 'var(--yz-radius-sm)',
                        border: '1px solid var(--yz-border)',
                        backgroundColor: 'var(--yz-bg-surface)',
                        color: 'var(--yz-text-primary)',
                        fontSize: '12px',
                        boxSizing: 'border-box',
                      }}
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unit Selector (if numeric) */}
                  {field.field_type === 'number' && (
                    <div style={{ width: '85px' }}>
                      <select
                        value={field.default_unit || 'in'}
                        onChange={(e) => handleFieldChange(idx, 'default_unit', e.target.value)}
                        style={{
                          width: '100%',
                          height: '30px',
                          padding: '0 6px',
                          borderRadius: 'var(--yz-radius-sm)',
                          border: '1px solid var(--yz-border)',
                          backgroundColor: 'var(--yz-bg-surface)',
                          color: 'var(--yz-text-primary)',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                        }}
                      >
                        {UNIT_OPTIONS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Required Checkbox */}
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(field.is_required)}
                      onChange={(e) => handleFieldChange(idx, 'is_required', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>Required</span>
                  </label>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveField(idx)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--yz-status-out-stock)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Remove parameter"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Dropdown Options Row (if dropdown) */}
                {field.field_type === 'dropdown' && (
                  <div style={{ paddingLeft: '28px' }}>
                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--yz-text-muted)', marginBottom: '2px' }}>
                      Dropdown Options (comma-separated):
                    </label>
                    <input
                      type="text"
                      value={field.options || ''}
                      onChange={(e) => handleFieldChange(idx, 'options', e.target.value)}
                      placeholder="e.g. Front Hook, Back Hook, Side Zipper, Back Potli Buttons"
                      style={{
                        width: '100%',
                        height: '28px',
                        padding: '0 8px',
                        borderRadius: 'var(--yz-radius-xs)',
                        border: '1px solid var(--yz-border)',
                        backgroundColor: 'var(--yz-bg-surface)',
                        color: 'var(--yz-text-primary)',
                        fontSize: '11px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}

                {/* Validation rules / guidance hint */}
                {(field.field_type === 'number' || field.field_type === 'tailor_instruction') && (
                  <div style={{ paddingLeft: '28px' }}>
                    <input
                      type="text"
                      value={field.validation_rules || ''}
                      onChange={(e) => handleFieldChange(idx, 'validation_rules', e.target.value)}
                      placeholder={
                        field.field_type === 'number'
                          ? 'Validation rules or range e.g. {"min":20,"max":56,"placeholder":"e.g. 34.5"}'
                          : 'Artisan guideline hint e.g. Special embroidery or sleeve lining instruction'
                      }
                      style={{
                        width: '100%',
                        height: '26px',
                        padding: '0 8px',
                        borderRadius: 'var(--yz-radius-xs)',
                        border: '1px solid var(--yz-border-subtle)',
                        backgroundColor: 'var(--yz-bg-surface)',
                        color: 'var(--yz-text-secondary)',
                        fontSize: '11px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
