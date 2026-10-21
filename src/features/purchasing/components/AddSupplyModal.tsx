import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import type { SupplyItem, CreateSupplyInput, UpdateSupplyInput } from '../../../services/expensesSuppliesService';
import type { VendorData } from '../../../services/supplierService';

interface AddSupplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSupplyInput | UpdateSupplyInput) => Promise<void>;
  supplyToEdit?: SupplyItem | null;
  suppliers: VendorData[];
  existingCategories: string[];
}

const COMMON_UNITS = [
  'meters',
  'pcs',
  'spools',
  'rolls',
  'boxes',
  'packets',
  'sets',
  'dozens',
  'yards',
  'kg',
];

const DEFAULT_SUPPLY_CATEGORIES = [
  'Fabric & Linings',
  'Threads & Zari',
  'Trims & Fasteners',
  'Hooks & Eyelets',
  'Zippers & Sliders',
  'Buttons & Rivets',
  'Lace & Borders',
  'Needles & Atelier Consumables',
  'Packaging & Carry Bags',
  'Other Atelier Supplies',
];

export const AddSupplyModal: React.FC<AddSupplyModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  supplyToEdit,
  suppliers,
  existingCategories,
}) => {
  const isEditing = Boolean(supplyToEdit);

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Fabric & Linings');
  const [customCategory, setCustomCategory] = useState('');
  const [unit, setUnit] = useState('meters');
  const [minStockLevel, setMinStockLevel] = useState('10');
  const [unitCost, setUnitCost] = useState('0');
  const [initialQuantity, setInitialQuantity] = useState('0');
  const [defaultSupplierId, setDefaultSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available categories merged
  const categoriesList = Array.from(
    new Set([...DEFAULT_SUPPLY_CATEGORIES, ...existingCategories.filter(Boolean)])
  );

  useEffect(() => {
    if (supplyToEdit) {
      setName(supplyToEdit.name || '');
      setSku(supplyToEdit.sku || '');
      setCategory(supplyToEdit.category || 'Fabric & Linings');
      setUnit(supplyToEdit.unit || 'meters');
      setMinStockLevel(String(supplyToEdit.min_stock_level ?? 10));
      setUnitCost(String(supplyToEdit.unit_cost ?? 0));
      setDefaultSupplierId(supplyToEdit.default_supplier_id || '');
      setNotes(supplyToEdit.notes || '');
      setInitialQuantity('0');
    } else {
      setName('');
      setSku('');
      setCategory('Fabric & Linings');
      setCustomCategory('');
      setUnit('meters');
      setMinStockLevel('10');
      setUnitCost('0');
      setInitialQuantity('0');
      setDefaultSupplierId('');
      setNotes('');
    }
    setError(null);
  }, [supplyToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Item name is required');
      return;
    }

    const finalCategory = category === 'CUSTOM' ? customCategory.trim() : category;
    if (!finalCategory) {
      setError('Category is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      if (isEditing) {
        await onSubmit({
          name: name.trim(),
          category: finalCategory,
          unit: unit.trim() || 'pcs',
          min_stock_level: Math.max(0, parseFloat(minStockLevel) || 0),
          unit_cost: Math.max(0, parseFloat(unitCost) || 0),
          default_supplier_id: defaultSupplierId || null,
        } as UpdateSupplyInput);
      } else {
        await onSubmit({
          name: name.trim(),
          sku: sku.trim() || undefined,
          category: finalCategory,
          unit: unit.trim() || 'pcs',
          min_stock_level: Math.max(0, parseFloat(minStockLevel) || 0),
          unit_cost: Math.max(0, parseFloat(unitCost) || 0),
          initial_quantity: Math.max(0, parseFloat(initialQuantity) || 0),
          default_supplier_id: defaultSupplierId || null,
          notes: notes.trim() || null,
        } as CreateSupplyInput);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save supply item');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Supply: ${supplyToEdit?.name}` : 'Add New Atelier Consumable Supply'}
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--yz-danger, #ef4444)',
              borderRadius: 'var(--yz-radius-sm)',
              color: 'var(--yz-danger, #ef4444)',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}

        {/* Item Name & SKU */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--yz-text-secondary)',
                marginBottom: '4px',
              }}
            >
              Item Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Pure Cotton Cambric Lining 60s"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--yz-text-secondary)',
                marginBottom: '4px',
              }}
            >
              SKU / Code {isEditing && '(read-only)'}
            </label>
            <input
              type="text"
              disabled={isEditing}
              placeholder="Auto-generated if empty"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="yz-input"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                backgroundColor: isEditing ? 'var(--yz-bg-subtle)' : undefined,
              }}
            />
          </div>
        </div>

        {/* Category & Unit of Measure */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--yz-text-secondary)',
                marginBottom: '4px',
              }}
            >
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="CUSTOM">+ Add New Category...</option>
            </select>
            {category === 'CUSTOM' && (
              <input
                type="text"
                placeholder="Enter custom category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="yz-input"
                style={{ width: '100%', marginTop: '6px', boxSizing: 'border-box' }}
                required
              />
            )}
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--yz-text-secondary)',
                marginBottom: '4px',
              }}
            >
              Unit of Measure *
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="yz-input"
                style={{ flex: 1, boxSizing: 'border-box' }}
              >
                {COMMON_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="or custom"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="yz-input"
                style={{ width: '90px', boxSizing: 'border-box' }}
              />
            </div>
          </div>
        </div>

        {/* Quantities & Pricing */}
        <div style={{ display: 'grid', gridTemplateColumns: isEditing ? '1fr 1fr' : '1fr 1fr 1fr', gap: '12px' }}>
          {!isEditing && (
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: 'var(--yz-text-secondary)',
                  marginBottom: '4px',
                }}
              >
                Initial Stock Qty
              </label>
              <input
                type="number"
                step="any"
                min="0"
                placeholder="0"
                value={initialQuantity}
                onChange={(e) => setInitialQuantity(e.target.value)}
                className="yz-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>Opening physical count</span>
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--yz-text-secondary)',
                marginBottom: '4px',
              }}
            >
              Reorder Threshold *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="10"
              value={minStockLevel}
              onChange={(e) => setMinStockLevel(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>Alerts when stock falls at/below</span>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--yz-text-secondary)',
                marginBottom: '4px',
              }}
            >
              Cost Per Unit (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              value={unitCost}
              onChange={(e) => setUnitCost(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>Latest purchase/valuation rate</span>
          </div>
        </div>

        {/* Default Supplier */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--yz-text-secondary)',
              marginBottom: '4px',
            }}
          >
            Default Vendor / Supplier
          </label>
          <select
            value={defaultSupplierId}
            onChange={(e) => setDefaultSupplierId(e.target.value)}
            className="yz-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
          >
            <option value="">-- No default supplier assigned --</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} {s.city ? `(${s.city})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Notes */}
        {!isEditing && (
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--yz-text-secondary)',
                marginBottom: '4px',
              }}
            >
              Notes / Technical Specs
            </label>
            <textarea
              rows={2}
              placeholder="Color codes, material grade, weave density, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
            />
          </div>
        )}

        {/* Modal Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '8px',
            paddingTop: '14px',
            borderTop: '1px solid var(--yz-border)',
          }}
        >
          <Button variant="secondary" size="md" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Supply' : 'Save Supply Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
