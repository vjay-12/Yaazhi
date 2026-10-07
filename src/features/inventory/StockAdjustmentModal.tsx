import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import type { YaazhiProduct } from '../../types/product';
import type { AdjustmentReasonCode } from '../../types/inventory';
import { inventoryService } from '../../services/inventoryService';
import { CustomDropdown } from '../../components/common/CustomDropdown';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: YaazhiProduct | null;
  onStockAdjusted: () => void;
}

const REASON_OPTIONS: { code: AdjustmentReasonCode; label: string; desc: string }[] = [
  { code: 'audit', label: 'Physical Audit (Periodic Count)', desc: 'Reconciling physical boutique count' },
  { code: 'damage', label: 'Damaged / Defective', desc: 'Zari snag, fabric discoloration, tear' },
  { code: 'loss', label: 'Loss / Shrinkage', desc: 'Discrepancy or unexplained loss' },
  { code: 'miscount', label: 'Miscount Correction', desc: 'Correcting prior inventory entry error' },
  { code: 'return', label: 'Customer Return Restock', desc: 'Restocking unworn boutique item' },
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  onStockAdjusted,
}) => {
  const [defaultLocationId, setDefaultLocationId] = useState('sr-01');
  const [newStock, setNewStock] = useState('');
  const [reasonCode, setReasonCode] = useState<AdjustmentReasonCode>('audit');
  const [notes, setNotes] = useState('');
  const [performedBy, setPerformedBy] = useState('Boutique Manager');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      inventoryService.getLocations().then((locs) => {
        const defaultLoc = locs.find((l) => l.isDefault) || locs[0];
        if (defaultLoc) {
          setDefaultLocationId(defaultLoc.id);
        }
      }).catch(() => {});
      setNewStock(String(product.currentStock));
      setNotes('');
      setError(null);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const currentCount = product.currentStock;
  const delta = Number(newStock) - currentCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStock === '' || isNaN(Number(newStock)) || Number(newStock) < 0) {
      setError('Please enter a valid non-negative physical stock count.');
      return;
    }
    if (delta === 0) {
      setError('New stock count is identical to existing recorded stock.');
      return;
    }
    if (!notes.trim()) {
      setError('Please provide a brief reason or justification note for this adjustment.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await inventoryService.adjustStock({
        productId: product.id,
        locationId: defaultLocationId,
        newStock: Number(newStock),
        reasonCode,
        notes: notes.trim(),
        performedBy,
      });
      onStockAdjusted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record stock adjustment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Inventory Stock"
      subtitle={`Product: ${product.name} (SKU: ${product.sku})`}
      maxWidth="460px"
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
            loadingText="Saving..."
          >
            Confirm Adjustment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {error && (
          <div
            style={{
              padding: '6px 10px',
              backgroundColor: 'var(--yz-status-out-stock-bg)',
              color: 'var(--yz-status-out-stock)',
              borderRadius: 'var(--yz-radius-sm)',
              fontSize: '11px',
            }}
          >
            {error}
          </div>
        )}

        {/* Current vs New Calculation */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            padding: '8px 10px',
            backgroundColor: 'var(--yz-bg-subtle)',
            borderRadius: 'var(--yz-radius-sm)',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              System Stock
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--yz-font-display)', marginTop: '2px' }}>
              {currentCount}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Physical Count
            </div>
            <input
              type="number"
              min="0"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              className="yz-input tabular-nums"
              style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, height: '26px', marginTop: '2px' }}
            />
          </div>

          <div>
            <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
              Net Delta
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                fontFamily: 'var(--yz-font-display)',
                marginTop: '2px',
                color: delta > 0 ? 'var(--yz-status-in-stock)' : delta < 0 ? 'var(--yz-status-out-stock)' : 'var(--yz-text-muted)',
              }}
            >
              {delta > 0 ? `+${delta}` : delta}
            </div>
          </div>
        </div>

        <div className="yz-field">
          <label className="yz-label">Adjustment Reason *</label>
          <CustomDropdown
            value={reasonCode}
            onChange={(val) => setReasonCode(val as AdjustmentReasonCode)}
            options={REASON_OPTIONS.map((r) => ({
              value: r.code,
              label: r.label,
            }))}
            minWidth="100%"
            style={{ width: '100%' }}
          />
        </div>

        <div className="yz-field">
          <label className="yz-label">Reason Notes & Justification *</label>
          <textarea
            rows={2}
            placeholder="Explain reason for stock difference..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="yz-textarea"
          />
        </div>

        <div className="yz-field">
          <label className="yz-label">Authorized Staff Member</label>
          <input
            type="text"
            value={performedBy}
            onChange={(e) => setPerformedBy(e.target.value)}
            className="yz-input"
          />
        </div>
      </form>
    </Modal>
  );
};
