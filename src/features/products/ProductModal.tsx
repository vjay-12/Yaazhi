import React, { useState, useEffect, useRef } from 'react';
import { UploadCloud, Trash2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { getValidatedProductImage } from '../../components/common/ProductImage';
import { CustomDropdown } from '../../components/common/CustomDropdown';
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
  'Churidars & Salwars',
  'Kids Ethnic',
  'Sarees',
  'Dupattas & Stoles',
  'Kanchipuram Silk',
  'Cotton Handloom',
  'Banarasi Silk',
  'Designer Chudidar',
  'Anarkali Set',
  'Kurtis & Tunics',
  'Designer Blouse',
  'Ethnic Menswear',
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
  const [imageUrl, setImageUrl] = useState('');
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
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
      setImageUrl(productToEdit.imageUrl || getValidatedProductImage(productToEdit.name, productToEdit.category, productToEdit.imageUrl) || '');
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
      setImageUrl('');
    }
    setImageUploadError(null);
    setErrors({});
  }, [productToEdit, isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('Image size should be under 5MB.');
      return;
    }

    setImageUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(String(event.target.result));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setImageUploadError('Please drop an image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setImageUploadError('Image size should be under 5MB.');
      return;
    }

    setImageUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(String(event.target.result));
      }
    };
    reader.readAsDataURL(file);
  };

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
        imageUrl: imageUrl.trim()
          ? imageUrl.trim()
          : getValidatedProductImage(name, category, undefined),
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
      maxWidth="600px"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText={productToEdit ? 'Updating Product...' : 'Saving Product...'}
          >
            {productToEdit ? 'Update Product' : 'Save Product'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {errors.form && (
          <div
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--yz-status-out-stock-bg)',
              color: 'var(--yz-status-out-stock)',
              borderRadius: 'var(--yz-radius-sm)',
              fontSize: '11px',
            }}
          >
            {errors.form}
          </div>
        )}

        {/* Section 1: Basic Information */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px' }}>
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

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          <div className="yz-field">
            <label className="yz-label">Category *</label>
            <CustomDropdown
              value={category}
              onChange={(val) => setCategory(val as BoutiqueCategory)}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
              minWidth="100%"
              style={{ width: '100%' }}
            />
          </div>

          <div className="yz-field">
            <label className="yz-label">Fabric / Material</label>
            <input
              type="text"
              placeholder="e.g. Mulberry Silk, Cotton"
              value={fabric}
              onChange={(e) => setFabric(e.target.value)}
              className="yz-input"
            />
          </div>

          <div className="yz-field">
            <label className="yz-label">Craft / Technique</label>
            <input
              type="text"
              placeholder="e.g. Handloom, Zari"
              value={craft}
              onChange={(e) => setCraft(e.target.value)}
              className="yz-input"
            />
          </div>
        </div>

        {/* Section 2: Pricing & GST */}
        <div
          style={{
            padding: '8px 10px',
            backgroundColor: 'var(--yz-bg-subtle)',
            borderRadius: 'var(--yz-radius-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--yz-text-secondary)', letterSpacing: '0.04em' }}>
            Pricing & Tax Compliance (GST)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div className="yz-field" style={{ margin: 0 }}>
              <label className="yz-label">Cost Price (₹) *</label>
              <input
                type="number"
                placeholder="₹ Weaver cost"
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
                placeholder="₹ Retail price"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="yz-input tabular-nums"
              />
              {errors.sellPrice && <span className="yz-error-text">{errors.sellPrice}</span>}
            </div>

            <div className="yz-field" style={{ margin: 0 }}>
              <label className="yz-label">Max Retail (MRP)</label>
              <input
                type="number"
                placeholder="₹ Printed MRP"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                className="yz-input tabular-nums"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '8px' }}>
            <div className="yz-field" style={{ margin: 0 }}>
              <label className="yz-label">HSN Code *</label>
              <input
                type="text"
                placeholder="e.g. 5007"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                className="yz-input"
              />
              {errors.hsnCode && <span className="yz-error-text">{errors.hsnCode}</span>}
            </div>

            <div className="yz-field" style={{ margin: 0 }}>
              <label className="yz-label">GST Tax Slab *</label>
              <CustomDropdown
                value={gstRate}
                onChange={(val) => setGstRate(Number(val))}
                options={GST_SLABS.map((s) => ({ value: s.rate, label: s.label }))}
                minWidth="100%"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Stock Levels */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
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
              <span className="yz-hint">Use Stock Adjustment to change</span>
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
          </div>

          <div className="yz-field">
            <label className="yz-label">Unit of Measure</label>
            <CustomDropdown
              value={unitOfMeasure}
              onChange={(val) => setUnitOfMeasure(val as UnitOfMeasure)}
              options={[
                { value: 'pcs', label: 'Pieces (pcs)' },
                { value: 'meters', label: 'Meters (m)' },
                { value: 'sets', label: 'Sets (3-piece)' },
                { value: 'pairs', label: 'Pairs' },
                { value: 'box', label: 'Box' },
              ]}
              minWidth="100%"
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div className="yz-field">
          <label className="yz-label">Boutique Notes / Pedigree</label>
          <textarea
            rows={2}
            placeholder="Special care instructions, dry clean notes, weaving pedigree..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="yz-textarea"
          />
        </div>

        {/* Product Image Upload, Preview, Replace, and Clear */}
        <div className="yz-field">
          <label className="yz-label">Product Photography</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp"
            style={{ display: 'none' }}
          />

          {imageUrl ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                border: '1px solid var(--yz-border)',
                borderRadius: 'var(--yz-radius-sm)',
                backgroundColor: 'var(--yz-bg-surface)',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <img
                  src={imageUrl}
                  alt="Product preview"
                  style={{
                    width: '46px',
                    height: '46px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid var(--yz-border)',
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 600,
                      color: 'var(--yz-text-primary)',
                      display: 'block',
                    }}
                  >
                    {productToEdit && productToEdit.imageUrl === imageUrl
                      ? 'Current Catalog Photo'
                      : 'Photo Uploaded'}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--yz-text-muted)',
                      display: 'block',
                    }}
                  >
                    Storage-agnostic local preview
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ height: '26px', fontSize: '11px', padding: '0 8px' }}
                >
                  Replace Image
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="yz-btn yz-btn-ghost yz-btn-sm"
                  style={{ height: '26px', padding: '0 6px', color: 'var(--yz-error, #DC2626)' }}
                  title="Remove image"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                padding: '12px 14px',
                border: '1.5px dashed var(--yz-border)',
                borderRadius: 'var(--yz-radius-sm)',
                backgroundColor: 'var(--yz-bg-subtle)',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--yz-primary, #832729)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--yz-border)';
              }}
            >
              <UploadCloud size={20} style={{ color: 'var(--yz-primary, #832729)', flexShrink: 0 }} />
              <div>
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 600,
                    color: 'var(--yz-text-primary)',
                    display: 'block',
                  }}
                >
                  Click or drag photo here to upload
                </span>
                <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)', display: 'block' }}>
                  Supports PNG, JPG, or WebP up to 5MB (storage-agnostic)
                </span>
              </div>
            </div>
          )}

          {imageUploadError && (
            <span className="yz-error-text" style={{ marginTop: '4px', display: 'block' }}>
              {imageUploadError}
            </span>
          )}
        </div>
      </form>
    </Modal>
  );
};
