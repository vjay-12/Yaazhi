import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { Plus, Trash2, Sparkles, AlertCircle } from 'lucide-react';
import type {
  StitchingTemplate,
  StitchingAddon,
  GarmentType,
} from '../../types/template';

interface StitchingTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    garment_type: string;
    category: string;
    description?: string;
    base_price: number;
    tax_rate: number;
    hsn_code?: string;
    addons: Array<Partial<StitchingAddon>>;
  }) => Promise<void>;
  templateToEdit?: StitchingTemplate | null;
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

const GST_RATES = [
  { value: 0, label: '0% (Exempt)' },
  { value: 5, label: '5% (Standard Tailoring SAC 9988)' },
  { value: 12, label: '12% (Bespoke Apparel Assembly)' },
  { value: 18, label: '18% (Designer & Hand Embroidery Services)' },
];

const QUICK_ADDON_PRESETS = [
  { name: 'Pure Cotton Breathable Lining', price: 150, description: 'Pre-washed fine cotton inner lining', is_default_selected: true },
  { name: 'Aari & Zardosi Hand Embroidery Work', price: 1200, description: 'Artisan handcrafted gold & beadwork embroidery', is_default_selected: false },
  { name: 'Princess Cut & Padded Cups', price: 350, description: 'Contoured cup inserts for seamless bridal fit', is_default_selected: false },
  { name: 'Designer Sleeve / Neck Pattern Cut', price: 200, description: 'Scalloped, sweetheart, or keyhole pattern cut', is_default_selected: false },
  { name: 'Piping & Dori Latkan Tassels', price: 100, description: 'Handcrafted dori cord and matching latkan tassels', is_default_selected: false },
  { name: 'Express 24-hr Urgent Atelier Delivery', price: 300, description: 'Priority rush queue delivery within 24 hours', is_default_selected: false },
];

export const StitchingTemplateModal: React.FC<StitchingTemplateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  templateToEdit,
}) => {
  const [name, setName] = useState('');
  const [garmentType, setGarmentType] = useState<GarmentType>('Blouse');
  const [category, setCategory] = useState('WOMEN');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<string>('450');
  const [taxRate, setTaxRate] = useState<number>(5);
  const [hsnCode, setHsnCode] = useState('9988');
  const [addons, setAddons] = useState<Array<Partial<StitchingAddon>>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (templateToEdit) {
      setName(templateToEdit.name);
      setGarmentType((templateToEdit.garment_type as GarmentType) || 'Blouse');
      setCategory(templateToEdit.category || 'WOMEN');
      setDescription(templateToEdit.description || '');
      setBasePrice(String(templateToEdit.base_price || 0));
      setTaxRate(Number(templateToEdit.tax_rate ?? 5));
      setHsnCode(templateToEdit.hsn_code || '9988');
      setAddons(
        (templateToEdit.addons || []).map((a) => ({
          id: a.id,
          name: a.name,
          description: a.description || '',
          price: a.price,
          is_default_selected: Boolean(a.is_default_selected),
          display_order: a.display_order,
        }))
      );
    } else {
      setName('');
      setGarmentType('Blouse');
      setCategory('WOMEN');
      setDescription('');
      setBasePrice('450');
      setTaxRate(5);
      setHsnCode('9988');
      setAddons([
        {
          name: 'Pure Cotton Breathable Lining',
          description: 'Pre-washed fine cotton inner lining',
          price: 150,
          is_default_selected: true,
          display_order: 1,
        },
        {
          name: 'Designer Neck / Back Cutout Pattern',
          description: 'Custom cutout or sweetheart neckline styling',
          price: 200,
          is_default_selected: false,
          display_order: 2,
        },
        {
          name: 'Express 24-hr Urgent Atelier Delivery',
          description: 'Rush priority queue turnaround',
          price: 300,
          is_default_selected: false,
          display_order: 3,
        },
      ]);
    }
    setErrors({});
  }, [templateToEdit, isOpen]);

  const handleAddAddon = () => {
    setAddons([
      ...addons,
      {
        name: '',
        description: '',
        price: 100,
        is_default_selected: false,
        display_order: addons.length + 1,
      },
    ]);
  };

  const handleApplyPreset = (preset: typeof QUICK_ADDON_PRESETS[0]) => {
    if (addons.some((a) => a.name?.toLowerCase() === preset.name.toLowerCase())) {
      return; // Already added
    }
    setAddons([
      ...addons,
      {
        name: preset.name,
        description: preset.description,
        price: preset.price,
        is_default_selected: preset.is_default_selected,
        display_order: addons.length + 1,
      },
    ]);
  };

  const handleRemoveAddon = (index: number) => {
    const updated = addons.filter((_, idx) => idx !== index);
    setAddons(updated.map((a, idx) => ({ ...a, display_order: idx + 1 })));
  };

  const handleAddonChange = (index: number, key: keyof StitchingAddon, value: any) => {
    const updated = [...addons];
    updated[index] = { ...updated[index], [key]: value };
    setAddons(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Service name is required';
    }
    const numBase = parseFloat(basePrice);
    if (isNaN(numBase) || numBase < 0) {
      newErrors.basePrice = 'Enter a valid base standard price (≥ 0)';
    }

    for (let i = 0; i < addons.length; i++) {
      if (!addons[i].name?.trim()) {
        newErrors[`addon_name_${i}`] = 'Add-on name is required';
      }
      const p = parseFloat(String(addons[i].price));
      if (isNaN(p) || p < 0) {
        newErrors[`addon_price_${i}`] = 'Invalid price';
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
        base_price: numBase,
        tax_rate: taxRate,
        hsn_code: hsnCode.trim() || '9988',
        addons,
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save stitching template' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedBase = parseFloat(basePrice) || 0;
  const calculatedTax = (calculatedBase * taxRate) / 100;
  const calculatedTotal = calculatedBase + calculatedTax;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600 }}>
            {templateToEdit ? 'Edit Stitching Price Template' : 'New Stitching Price Template'}
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
            Service Catalog Rate
          </span>
        </div>
      }
      subtitle="Configure standard tailoring service rates, GST tax rules, and optional add-on finishes."
      maxWidth="780px"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div style={{ fontSize: '12px', color: 'var(--yz-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Standard Price:</span>
            <strong style={{ color: 'var(--yz-primary)' }}>
              ₹{calculatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </strong>
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
              (₹{calculatedBase} + {taxRate}% GST)
            </span>
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

        {/* Pricing Policy Reminder Banner */}
        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'var(--yz-alert-info-bg)',
            border: '1px solid var(--yz-alert-info-border)',
            borderRadius: 'var(--yz-radius-md)',
            color: 'var(--yz-alert-info-text)',
            fontSize: '12px',
            lineHeight: 1.4,
          }}
        >
          <strong>Rate Protection:</strong> The standard base price set here serves as the default catalog rate.
          Tailors can customize or discount order rates during customer checkout without overwriting this baseline template.
        </div>

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
              Service Name <span style={{ color: 'var(--yz-status-out-stock)' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Classic Saree Blouse Tailoring"
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
              Target Category
            </label>
            <CustomDropdown
              value={category}
              onChange={(val) => setCategory(val)}
              options={CATEGORIES}
              placeholder="Select Category"
            />
          </div>
        </div>

        {/* Pricing & GST Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            padding: '12px',
            backgroundColor: 'var(--yz-bg-canvas)',
            borderRadius: 'var(--yz-radius-md)',
            border: '1px solid var(--yz-border-subtle)',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Standard Base Price (₹) <span style={{ color: 'var(--yz-status-out-stock)' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--yz-text-muted)',
                  fontSize: '13px',
                }}
              >
                ₹
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={basePrice}
                onChange={(e) => {
                  setBasePrice(e.target.value);
                  if (errors.basePrice) setErrors((prev) => ({ ...prev, basePrice: '' }));
                }}
                placeholder="450.00"
                style={{
                  width: '100%',
                  height: 'var(--yz-control-height-md)',
                  paddingLeft: '26px',
                  paddingRight: '10px',
                  borderRadius: 'var(--yz-input-radius)',
                  border: `1px solid ${errors.basePrice ? 'var(--yz-status-out-stock)' : 'var(--yz-border)'}`,
                  backgroundColor: 'var(--yz-bg-surface)',
                  color: 'var(--yz-text-primary)',
                  fontSize: '13px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            {errors.basePrice && <span style={{ fontSize: '11px', color: 'var(--yz-status-out-stock)' }}>{errors.basePrice}</span>}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Applicable GST Rate
            </label>
            <CustomDropdown
              value={taxRate}
              onChange={(val) => setTaxRate(Number(val))}
              options={GST_RATES}
              placeholder="Select GST Rate"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              HSN / SAC Code
            </label>
            <input
              type="text"
              value={hsnCode}
              onChange={(e) => setHsnCode(e.target.value)}
              placeholder="9988"
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
        </div>

        {/* Description */}
        <div>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
            Service Scope & Atelier Notes
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Includes custom neckline cut, dart fitting, hook-and-eye fastening, and steam press"
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

        {/* Quick Add-on Presets */}
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
            <Sparkles size={12} color="var(--yz-gold)" /> Add-on Suggestions:
          </span>
          {QUICK_ADDON_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
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
              + {p.name.split(' ')[0]} (₹{p.price})
            </button>
          ))}
        </div>

        {/* Add-on Services Builder */}
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
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Optional Add-on Services & Finishes</span>
              <span
                style={{
                  fontSize: '11px',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  color: 'var(--yz-text-secondary)',
                }}
              >
                {addons.length}
              </span>
            </div>
            <Button type="button" size="sm" variant="secondary" onClick={handleAddAddon}>
              <Plus size={13} style={{ marginRight: '4px' }} /> Add Service Add-on
            </Button>
          </div>

          <div
            style={{
              maxHeight: '280px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              paddingRight: '4px',
            }}
          >
            {addons.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px',
                  color: 'var(--yz-text-muted)',
                  fontSize: '12px',
                  border: '1px dashed var(--yz-border)',
                  borderRadius: 'var(--yz-radius-md)',
                }}
              >
                No add-on finishes configured. Click "+ Add Service Add-on" or use suggestions above.
              </div>
            ) : (
              addons.map((addon, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--yz-radius-md)',
                    border: '1px solid var(--yz-border)',
                    backgroundColor: 'var(--yz-bg-canvas)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, width: '18px', color: 'var(--yz-text-muted)' }}>
                      {idx + 1}
                    </span>

                    {/* Add-on Name */}
                    <div style={{ flex: '2', minWidth: '180px' }}>
                      <input
                        type="text"
                        value={addon.name || ''}
                        onChange={(e) => handleAddonChange(idx, 'name', e.target.value)}
                        placeholder="Add-on Name (e.g. Cotton Lining, Embroidery)"
                        style={{
                          width: '100%',
                          height: '30px',
                          padding: '0 8px',
                          borderRadius: 'var(--yz-radius-sm)',
                          border: `1px solid ${errors[`addon_name_${idx}`] ? 'var(--yz-status-out-stock)' : 'var(--yz-border)'}`,
                          backgroundColor: 'var(--yz-bg-surface)',
                          color: 'var(--yz-text-primary)',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Add-on Price */}
                    <div style={{ width: '110px', position: 'relative' }}>
                      <span
                        style={{
                          position: 'absolute',
                          left: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          fontSize: '11px',
                          color: 'var(--yz-text-muted)',
                        }}
                      >
                        ₹
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={addon.price ?? 0}
                        onChange={(e) => handleAddonChange(idx, 'price', e.target.value)}
                        placeholder="Price"
                        style={{
                          width: '100%',
                          height: '30px',
                          paddingLeft: '22px',
                          paddingRight: '6px',
                          borderRadius: 'var(--yz-radius-sm)',
                          border: `1px solid ${errors[`addon_price_${idx}`] ? 'var(--yz-status-out-stock)' : 'var(--yz-border)'}`,
                          backgroundColor: 'var(--yz-bg-surface)',
                          color: 'var(--yz-text-primary)',
                          fontSize: '12px',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    {/* Default Selected Checkbox */}
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        userSelect: 'none',
                        color: 'var(--yz-text-secondary)',
                      }}
                      title="Pre-select this add-on automatically during order creation"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(addon.is_default_selected)}
                        onChange={(e) => handleAddonChange(idx, 'is_default_selected', e.target.checked)}
                        style={{ cursor: 'pointer' }}
                      />
                      <span>Default Included</span>
                    </label>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveAddon(idx)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--yz-status-out-stock)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                      title="Remove add-on"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* Add-on description */}
                  <div style={{ paddingLeft: '26px' }}>
                    <input
                      type="text"
                      value={addon.description || ''}
                      onChange={(e) => handleAddonChange(idx, 'description', e.target.value)}
                      placeholder="Add-on specification / material description (optional)"
                      style={{
                        width: '100%',
                        height: '24px',
                        padding: '0 8px',
                        borderRadius: 'var(--yz-radius-xs)',
                        border: '1px solid var(--yz-border-subtle)',
                        backgroundColor: 'var(--yz-bg-surface)',
                        color: 'var(--yz-text-muted)',
                        fontSize: '11px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </form>
    </Modal>
  );
};
