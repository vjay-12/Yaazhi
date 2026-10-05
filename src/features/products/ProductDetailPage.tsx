import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Barcode,
  SlidersHorizontal,
  Edit2,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import type { YaazhiProduct } from '../../types/product';
import type { StockMovement, BoutiqueLocation } from '../../types/inventory';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { StockBadge, CategoryBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { BarcodeLabelModal } from '../../components/common/BarcodeLabelModal';
import { StockAdjustmentModal } from '../inventory/StockAdjustmentModal';
import { ProductModal } from './ProductModal';
import { useToast } from '../../components/common/Toast';

interface ProductDetailPageProps {
  productId: string;
  onBack: () => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({
  productId,
  onBack,
}) => {
  const { showToast } = useToast();
  const [product, setProduct] = useState<YaazhiProduct | null>(null);
  const [locations, setLocations] = useState<BoutiqueLocation[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [prod, locs, movs] = await Promise.all([
        productService.getById(productId),
        inventoryService.getLocations(),
        inventoryService.getMovements(productId),
      ]);
      setProduct(prod);
      setLocations(locs);
      setMovements(movs);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error loading product',
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [productId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading || !product) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--yz-text-secondary)' }}>
        Loading boutique product details...
      </div>
    );
  }

  const status = productService.getStockStatus(product);
  const profitMargin =
    product.sellPrice > 0
      ? Math.round(((product.sellPrice - product.costPrice) / product.sellPrice) * 100)
      : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Navigation & Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <button
          onClick={onBack}
          className="yz-btn yz-btn-ghost yz-btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--yz-text-secondary)' }}
        >
          <ArrowLeft size={16} />
          <span>Back to Product Catalog</span>
        </button>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            icon={<Barcode size={16} />}
            onClick={() => setIsBarcodeOpen(true)}
          >
            Print Labels
          </Button>

          <Button
            variant="secondary"
            icon={<SlidersHorizontal size={16} />}
            onClick={() => setIsAdjustOpen(true)}
          >
            Adjust Stock
          </Button>

          <Button
            variant="primary"
            icon={<Edit2 size={16} />}
            onClick={() => setIsEditOpen(true)}
          >
            Edit Product
          </Button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="yz-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <CategoryBadge category={product.category} />
              <StockBadge status={status} stockCount={product.currentStock} />
              <span
                style={{
                  fontSize: '0.75rem',
                  fontFamily: 'var(--yz-font-mono)',
                  color: 'var(--yz-text-muted)',
                }}
              >
                SKU: {product.sku}
              </span>
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
              {product.name}
            </h2>
            {product.craft && (
              <p style={{ fontSize: '0.85rem', color: 'var(--yz-text-secondary)', marginTop: '0.2rem' }}>
                {product.craft} • {product.fabric}
              </p>
            )}
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--yz-text-muted)', fontWeight: 600 }}>
                Selling Price
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--yz-text-primary)' }} className="tabular-nums">
                ₹{product.sellPrice.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--yz-status-in-stock)', fontWeight: 600 }}>
                {profitMargin}% Gross Margin
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--yz-text-muted)', fontWeight: 600 }}>
                Total Physical Stock
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--yz-text-primary)' }} className="tabular-nums">
                {product.currentStock} {product.unitOfMeasure}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--yz-text-muted)' }}>
                Reorder at {product.reorderPoint}
              </div>
            </div>
          </div>
        </div>

        {product.description && (
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--yz-border-subtle)', fontSize: '0.875rem', color: 'var(--yz-text-secondary)' }}>
            {product.description}
          </div>
        )}
      </div>

      {/* Two Column Layout: Stock Locations & Pricing Compliance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {/* Location Stock Breakdown */}
        <div className="yz-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <MapPin size={18} color="var(--yz-primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Stock by Location</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {locations.map((loc) => {
              const count = product.locationStock[loc.id] || 0;
              return (
                <div
                  key={loc.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    backgroundColor: 'var(--yz-bg-subtle)',
                    borderRadius: 'var(--yz-radius-md)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{loc.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--yz-text-muted)' }}>Code: {loc.code}</div>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--yz-font-mono)' }}>
                    {count} {product.unitOfMeasure}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* GST & Regulatory Details */}
        <div className="yz-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <ShieldCheck size={18} color="var(--yz-gold)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Pricing & GST Specs</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--yz-border-subtle)' }}>
              <span style={{ color: 'var(--yz-text-secondary)' }}>Weaver Cost Price</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>₹{product.costPrice.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--yz-border-subtle)' }}>
              <span style={{ color: 'var(--yz-text-secondary)' }}>Retail MRP</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>₹{(product.mrp || product.sellPrice).toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--yz-border-subtle)' }}>
              <span style={{ color: 'var(--yz-text-secondary)' }}>HSN / SAC Code</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>{product.hsnCode}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--yz-border-subtle)' }}>
              <span style={{ color: 'var(--yz-text-secondary)' }}>GST Rate Applied</span>
              <span style={{ fontWeight: 600, color: 'var(--yz-primary)' }}>{product.gstRate}% (CGST {product.gstRate / 2}% + SGST {product.gstRate / 2}%)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0' }}>
              <span style={{ color: 'var(--yz-text-secondary)' }}>Barcode EAN-13</span>
              <span style={{ fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>{product.barcode}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Movements History */}
      <div className="yz-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Clock size={18} color="var(--yz-text-secondary)" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Stock Movement & Audit History</h3>
        </div>

        {movements.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '0.85rem' }}>
            No recorded movements for this item yet.
          </div>
        ) : (
          <div className="yz-table-container" style={{ border: 'none', boxShadow: 'none' }}>
            <table className="yz-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Quantity</th>
                  <th>Location</th>
                  <th>Reason / Ref</th>
                  <th>Staff Member</th>
                  <th style={{ textAlign: 'right' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--yz-text-secondary)' }}>
                      {new Date(m.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span
                        className={`yz-badge ${
                          m.movementType === 'IN'
                            ? 'yz-badge-in-stock'
                            : m.movementType === 'OUT'
                            ? 'yz-badge-out-stock'
                            : 'yz-badge-gold'
                        }`}
                      >
                        {m.movementType}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--yz-font-mono)' }}>
                      {m.movementType === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{m.locationName}</td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {m.reasonCode ? (
                        <span style={{ textTransform: 'uppercase', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
                          [{m.reasonCode}] {m.notes}
                        </span>
                      ) : (
                        <span>{m.referenceType}: {m.referenceId}</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--yz-text-secondary)' }}>{m.performedBy}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--yz-font-mono)' }}>
                      {m.runningBalance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <BarcodeLabelModal
        isOpen={isBarcodeOpen}
        onClose={() => setIsBarcodeOpen(false)}
        product={product}
      />

      <StockAdjustmentModal
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        product={product}
        onStockAdjusted={() => {
          showToast({
            type: 'success',
            title: 'Stock Updated',
            message: 'Physical stock adjusted and recorded in audit ledger.',
          });
          loadData();
        }}
      />

      <ProductModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={async (input) => {
          await productService.update(product.id, input);
          showToast({
            type: 'success',
            title: 'Product Updated',
            message: `Updated specs for ${product.name}`,
          });
          loadData();
        }}
        productToEdit={product}
      />
    </div>
  );
};
