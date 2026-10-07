import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Barcode,
  SlidersHorizontal,
  Edit2,
  Clock,
  ShieldCheck,
  Archive,
  RotateCcw,
} from 'lucide-react';
import type { YaazhiProduct } from '../../types/product';
import type { StockMovement } from '../../types/inventory';
import { inventoryService } from '../../services/inventoryService';
import { productService } from '../../services/productService';
import { StockBadge, CategoryBadge, LifecycleBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { BarcodeLabelModal } from '../../components/common/BarcodeLabelModal';
import { StockAdjustmentModal } from '../inventory/StockAdjustmentModal';
import { ProductModal } from './ProductModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { useToast } from '../../components/common/Toast';
import { ProductImage } from '../../components/common/ProductImage';

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
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    if (!product) return;
    try {
      setIsArchiving(true);
      await productService.archive(product.id);
      showToast({
        type: 'info',
        title: 'Product Archived',
        message: `${product.name} moved to archive. Preserved all SKU and audit records.`,
      });
      setIsArchiveConfirmOpen(false);
      await loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Archive Failed',
        message: err.message || 'Failed to archive product',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    if (!product) return;
    try {
      await productService.unarchive(product.id);
      showToast({
        type: 'success',
        title: 'Product Restored',
        message: `${product.name} restored to active catalog.`,
      });
      await loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Restore Failed',
        message: err.message || 'Failed to restore product',
      });
    }
  };

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [prod, movs] = await Promise.all([
        productService.getById(productId),
        inventoryService.getMovements(productId),
      ]);
      setProduct(prod);
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
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--yz-text-secondary)', fontSize: '12px' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Top Navigation & Action Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <button
          onClick={onBack}
          className="yz-btn yz-btn-ghost yz-btn-sm"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--yz-text-secondary)' }}
        >
          <ArrowLeft size={13} />
          <span>Back to Products & Stock</span>
        </button>

        <div style={{ display: 'flex', gap: '6px' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Barcode size={13} />}
            onClick={() => setIsBarcodeOpen(true)}
          >
            Print Labels
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<SlidersHorizontal size={13} />}
            onClick={() => setIsAdjustOpen(true)}
          >
            Adjust Stock
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={product.isArchived ? <RotateCcw size={13} /> : <Archive size={13} />}
            onClick={() => {
              if (product.isArchived) {
                handleUnarchive();
              } else {
                setIsArchiveConfirmOpen(true);
              }
            }}
          >
            {product.isArchived ? 'Restore Product' : 'Archive'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Edit2 size={13} />}
            onClick={() => setIsEditOpen(true)}
          >
            Edit Product
          </Button>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="yz-card" style={{ padding: '12px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              productName={product.name}
              category={product.category}
              width={68}
              height={68}
              rounded="md"
              iconSize={24}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <CategoryBadge category={product.category} />
                <LifecycleBadge status={product.isArchived ? 'ARCHIVED' : 'ACTIVE'} />
                <StockBadge status={status} stockCount={product.currentStock} />
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--yz-font-mono)',
                    color: 'var(--yz-text-muted)',
                  }}
                >
                  SKU: {product.sku}
                </span>
              </div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                {product.name}
              </h2>
              {product.craft && (
                <p style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
                  {product.craft} • {product.fabric}
                </p>
              )}
            </div>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '14px', textAlign: 'right' }}>
            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--yz-text-muted)', fontWeight: 600 }}>
                Selling Price
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--yz-text-primary)' }} className="tabular-nums">
                ₹{product.sellPrice.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--yz-status-in-stock)', fontWeight: 600 }}>
                {profitMargin}% Gross Margin
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--yz-text-muted)', fontWeight: 600 }}>
                Physical Stock
              </div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--yz-text-primary)' }} className="tabular-nums">
                {product.currentStock} {product.unitOfMeasure}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                Reorder at {product.reorderPoint}
              </div>
            </div>
          </div>
        </div>

        {product.description && (
          <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--yz-border-subtle)', fontSize: '12px', color: 'var(--yz-text-secondary)' }}>
            {product.description}
          </div>
        )}
      </div>

      {/* Pricing & GST Specs */}
      <div className="yz-card" style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <ShieldCheck size={14} color="var(--yz-gold)" />
            <h3 style={{ fontSize: '12px', fontWeight: 600, color: 'var(--yz-text-primary)' }}>Pricing & GST Specs</h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Tax & Regulatory Specifications
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '8px',
          }}
        >
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--yz-bg-subtle)',
              borderRadius: 'var(--yz-radius-md)',
              border: '1px solid var(--yz-border-subtle)',
              boxShadow: 'var(--yz-shadow-2xs)',
            }}
          >
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--yz-text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              Weaver Cost Price
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-text-primary)', marginTop: '2px' }} className="tabular-nums">
              ₹{product.costPrice.toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
              Procurement Base Cost
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--yz-bg-subtle)',
              borderRadius: 'var(--yz-radius-md)',
              border: '1px solid var(--yz-border-subtle)',
              boxShadow: 'var(--yz-shadow-2xs)',
            }}
          >
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--yz-text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              Retail MRP
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-text-primary)', marginTop: '2px' }} className="tabular-nums">
              ₹{(product.mrp || product.sellPrice).toLocaleString('en-IN')}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
              Maximum Retail Price
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--yz-bg-subtle)',
              borderRadius: 'var(--yz-radius-md)',
              border: '1px solid var(--yz-border-subtle)',
              boxShadow: 'var(--yz-shadow-2xs)',
            }}
          >
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--yz-text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              HSN / SAC Code
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-text-primary)', marginTop: '2px' }}>
              {product.hsnCode}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
              Tariff Heading
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--yz-bg-subtle)',
              borderRadius: 'var(--yz-radius-md)',
              border: '1px solid var(--yz-border-subtle)',
              boxShadow: 'var(--yz-shadow-2xs)',
            }}
          >
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--yz-text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              GST Rate Applied
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--yz-primary)', marginTop: '2px' }}>
              {product.gstRate}%
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
              CGST {(product.gstRate / 2).toFixed(1)}% + SGST {(product.gstRate / 2).toFixed(1)}%
            </div>
          </div>

          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--yz-bg-subtle)',
              borderRadius: 'var(--yz-radius-md)',
              border: '1px solid var(--yz-border-subtle)',
              boxShadow: 'var(--yz-shadow-2xs)',
            }}
          >
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--yz-text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              Barcode
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-text-primary)', marginTop: '2px', wordBreak: 'break-all' }}>
              {product.barcode}
            </div>
            <div style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
              Boutique Label / SKU
            </div>
          </div>
        </div>
      </div>

      {/* Audit Movements History */}
      <div className="yz-card" style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} color="var(--yz-text-secondary)" />
            <h3 style={{ fontSize: '12px', fontWeight: 600 }}>Stock Movement & Audit History</h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            {movements.length} {movements.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {movements.length === 0 ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
            No recorded movements for this item yet.
          </div>
        ) : (
          <div className="yz-table-container">
            <table className="yz-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '12px' }}>Timestamp</th>
                  <th>Action / Type</th>
                  <th>Quantity</th>
                  <th>Reason / Ref</th>
                  <th style={{ textAlign: 'right', paddingRight: '12px' }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', whiteSpace: 'nowrap', paddingLeft: '12px' }}>
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
                    <td
                      style={{
                        fontWeight: 700,
                        fontFamily: 'var(--yz-font-mono)',
                        color:
                          m.movementType === 'IN'
                            ? 'var(--yz-status-in-stock)'
                            : m.movementType === 'OUT'
                            ? 'var(--yz-status-out-stock)'
                            : 'var(--yz-text-primary)',
                      }}
                      className="tabular-nums"
                    >
                      {m.movementType === 'IN' ? `+${m.quantity}` : m.movementType === 'OUT' ? `-${m.quantity}` : `Δ ${m.quantity}`}
                    </td>
                    <td style={{ fontSize: '11px' }}>
                      {m.reasonCode ? (
                        <span style={{ textTransform: 'uppercase', fontWeight: 600, color: 'var(--yz-text-secondary)', marginRight: '4px' }}>
                          [{m.reasonCode}]
                        </span>
                      ) : null}
                      <span>{m.notes || (m.referenceType ? `${m.referenceType}: ${m.referenceId}` : m.referenceId || 'Stock Record')}</span>
                      {m.performedBy && (
                        <span style={{ color: 'var(--yz-text-muted)', marginLeft: '6px', fontSize: '10px' }}>
                          • {m.performedBy}
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--yz-font-mono)', paddingRight: '12px' }} className="tabular-nums">
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

      {/* Archive Product Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        onClose={() => !isArchiving && setIsArchiveConfirmOpen(false)}
        onConfirm={handleArchive}
        title="Archive Product"
        description={
          product ? (
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--yz-text-primary)' }}>
                Are you sure you want to archive <strong>{product.name}</strong> (SKU: {product.sku})?
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--yz-text-secondary)', lineHeight: 1.45 }}>
                The product will be removed from Billing and moved to the Archived view. All stock balances and audit history will be preserved.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Archive Product"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isArchiving}
      />
    </div>
  );
};
