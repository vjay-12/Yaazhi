import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import type {
  YaazhiProduct,
  CreateProductInput,
  BoutiqueCategory,
  UnitOfMeasure,
} from '../../types/product';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductInput) => Promise<void>;
  productToEdit?: YaazhiProduct | null;
}

const CATEGORIES: BoutiqueCategory[] = [
  'Kanchipuram Silk',
  'Cotton Handloom',
  'Banarasi Silk',
  'Designer Chudidar',
  'Anarkali Set',
  'Kurtis & Tunics',
  'Designer Blouse',
  'Ethnic Menswear',
  'Kids Ethnic',
  'Dupattas & Shawls',
  'Fabrics & Unstitched',
  'Accessories',
];

const GST_SLABS = [
  { rate: 0, label: '0% (Exempt / Khadi)' },
  { rate: 5, label: '5% (Apparel ≤ ₹1000 / Raw Silk)' },
  { rate: 12, label: '12% (Standard Apparel & Chudidar Sets)' },
  { rate: 18, label: '18% (Designer & Embroidered Goods)' },
  { rate: 28, label: '28% (Luxury Accessories)' },
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productToEdit,
}) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<BoutiqueCategory>('Kanchipuram Silk');
  const [fabric, setFabric] = useState('');
  const [craft, setCraft] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [openingStock, setOpeningStock] = useState('5');
  const [reorderPoint, setReorderPoint] = useState('2');
  const [unitOfMeasure, setUnitOfMeasure] = useState<UnitOfMeasure>('pcs');
  const [hsnCode, setHsnCode] = useState('5007');
  const [gstRate, setGstRate] = useState(5);
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setBarcode(productToEdit.barcode);
      setCategory(productToEdit.category);
      setFabric(productToEdit.fabric || '');
      setCraft(productToEdit.craft || '');
      setCostPrice(String(productToEdit.costPrice));
      setSellPrice(String(productToEdit.sellPrice));
      setMrp(productToEdit.mrp ? String(productToEdit.mrp) : '');
      setOpeningStock(String(productToEdit.currentStock));
      setReorderPoint(String(productToEdit.reorderPoint));
      setUnitOfMeasure(productToEdit.unitOfMeasure);
      setHsnCode(productToEdit.hsnCode);
      setGstRate(productToEdit.gstRate);
      setDescription(productToEdit.description || '');
    } else {
      setName('');
      setSku(`YZ-${Math.floor(100 + Math.random() * 900)}`);
      setBarcode(`890${Math.floor(100000000 + Math.random() * 900000000)}`);
      setCategory('Kanchipuram Silk');
      setFabric('Pure Mulberry Silk');
      setCraft('Handloom Korvai');
      setCostPrice('');
      setSellPrice('');
      setMrp('');
      setOpeningStock('5');
      setReorderPoint('2');
      setUnitOfMeasure('pcs');
      setHsnCode('5007');
      setGstRate(5);
      setDescription('');
    }
    setErrors({});
  }, [productToEdit, isOpen]);

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Product name is required for boutique catalog.';
    if (!sku.trim()) errs.sku = 'Unique SKU code is required.';
    if (!costPrice || Number(costPrice) <= 0) errs.costPrice = 'Please enter a valid cost price (> 0).';
    if (!sellPrice || Number(sellPrice) <= 0) errs.sellPrice = 'Please enter a valid selling price (> 0).';
    if (Number(sellPrice) < Number(costPrice)) {
      errs.sellPrice = 'Selling price should not be lower than cost price.';
    }
    if (openingStock === '' || Number(openingStock) < 0) {
      errs.openingStock = 'Stock cannot be negative.';
    }
    if (!hsnCode.trim()) errs.hsnCode = 'HSN Code is required for GST compliance.';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name,
        sku,
        barcode,
        category,
        fabric,
        craft,
        description,
        costPrice: Number(costPrice),
        sellPrice: Number(sellPrice),
        mrp: mrp ? Number(mrp) : Number(sellPrice) * 1.1,
        openingStock: Number(openingStock),
        reorderPoint: Number(reorderPoint),
        unitOfMeasure,
        hsnCode,
        gstRate,
      });
      onClose();
    } catch (err: any) {
      setErrors({ form: err.message || 'Failed to save product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? 'Edit Boutique Product' : 'Add New Boutique Item'}
      subtitle="Configure weave details, retail pricing, GST category, and inventory levels"
      maxWidth="680px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText={productToEdit ? 'Updating Product...' : 'Saving Product...'}
          >
            {productToEdit ? 'Update Product' : 'Save Product'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {errors.form && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--yz-status-out-stock-bg)',
              color: 'var(--yz-status-out-stock)',
              borderRadius: 'var(--yz-radius-md)',
              fontSize: '0.85rem',
            }}
          >
            {errors.form}
          </div>
        )}

        {/* Section 1: Basic Information */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
          <div className="yz-field">
            <label className="yz-label">Product Title / Weave Name *</label>
            <input
              type="text"
              placeholder="e.g. Kanchipuram Silk Saree (Korvai Border)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="yz-input"
            />
            {errors.name && <span className="yz-error-text">{errors.name}</span>}
          </div>

          <div className="yz-field">
            <label className="yz-label">Boutique SKU *</label>
            <input
              type="text"
              placeholder="YZ-KAN-001"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              className="yz-input"
            />
            {errors.sku && <span className="yz-error-text">{errors.sku}</span>}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div className="yz-field">
            <label className="yz-label">Category *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as BoutiqueCategory)}
              className="yz-select"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="yz-field">
            <label className="yz-label">Fabric / Material</label>
            <input
              type="text"
              placeholder="e.g. Mulberry Silk, Linen, Cotton"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              className="yz-input"
            />
          </div>

          <div className="yz-field">
            <label className="yz-label">Craft / Technique</label>
            <input
              type="text"
              placeholder="e.g. Handloom, Zari, Aari Work"
              value={craft}
              onChange={(e) => setCraft(e.target.value)}
              className="yz-input"
            />
          </div>
        </div>

        {/* Section 2: Pricing & GST */}
        <div
          style={{
            padding: '1rem',
            backgroundColor: 'var(--yz-bg-subtle)',
            borderRadius: 'var(--yz-radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--yz-text-secondary)', letterSpacing: '0.05em' }}>
            Pricing & Tax Compliance (GST)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <div className="yz-field" style={{ margin: 0 }}>
              <label className="yz-label">Cost Price (₹) *</label>
              <input
                type="number"
                placeholder="₹ Weaver purchase price"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="yz-input tabular-nums"
              />
              {errors.costPrice && <span className="yz-error-text">{errors.costPrice}</span>}
            </div>

            <div className="yz-field" style={{ margin: 0 }}>
              <label className="yz-label">Selling Price (₹) *</label>
              <input
                type="number"
                placeholder="₹ Retail tag price"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="yz-input tabular-nums"
              />
              {errors.sellPrice && <span className="yz-error-text">{errors.sellPrice}</span>}
            </div>

            <div className="yz-field" style={{ margin: 0 }}>
              <label className="yz-label">Max Retail Price (MRP)</label>
              <input
                type="number"
                placeholder="₹ Printed MRP"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="yz-input tabular-nums"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
            <div className="yz-field" style={{ margin: 0 }}>
              <label className="yz-label">HSN Code *</label>
              <input
                type="text"
                placeholder="e.g. 5007 or 6204"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="yz-input"
              />
              {errors.hsnCode && <span className="yz-error-text">{errors.hsnCode}</span>}
            </div>

            <div className="yz-field" style={{ margin: 0 }}>
              <label className="yz-label">GST Tax Slab *</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="yz-select"
              >
                {GST_SLABS.map((s) => (
                  <option key={s.rate} value={s.rate}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Stock Levels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div className="yz-field">
            <label className="yz-label">Initial Stock Count *</label>
            <input
              type="number"
              min="0"
              value={openingStock}
              onChange={(e) => setOpeningStock(e.target.value)}
              className="yz-input tabular-nums"
              disabled={!!productToEdit}
            />
            {productToEdit && (
              <span className="yz-hint">Use Stock Adjustment to change active stock</span>
            )}
            {errors.openingStock && <span className="yz-error-text">{errors.openingStock}</span>}
          </div>

          <div className="yz-field">
            <label className="yz-label">Low Stock Threshold</label>
            <input
              type="number"
              min="1"
              value={reorderPoint}
              onChange={(e) => setReorderPoint(e.target.value)}
              className="yz-input tabular-nums"
            />
            <span className="yz-hint">Triggers low-stock warning tag</span>
          </div>

          <div className="yz-field">
            <label className="yz-label">Unit of Measure</label>
            <select
              value={unitOfMeasure}
              onChange={(e) => setUnitOfMeasure(e.target.value as UnitOfMeasure)}
              className="yz-select"
            >
              <option value="pcs">Pieces (pcs)</option>
              <option value="meters">Meters (m)</option>
              <option value="sets">Sets (3-piece)</option>
              <option value="pairs">Pairs</option>
              <option value="box">Box</option>
            </select>
          </div>
        </div>

        <div className="yz-field">
          <label className="yz-label">Boutique Notes / Styling Advice</label>
          <textarea
            rows={2}
            placeholder="Special care instructions, dry clean notes, weaving pedigree..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="yz-textarea"
          />
        </div>
      </form>
    </Modal>
  );
};
