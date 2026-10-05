import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import type { YaazhiProduct } from '../../types/product';
import type { AdjustmentReasonCode, BoutiqueLocation } from '../../types/inventory';
import { inventoryService } from '../../services/inventoryService';

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
  { code: 'miscount', label: 'Counter Miscount Correction', desc: 'Correcting prior entry error' },
  { code: 'return', label: 'Customer Return Restock', desc: 'Restocking unworn boutique item' },
];

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  product,
  onStockAdjusted,
}) => {
  const [locations, setLocations] = useState<BoutiqueLocation[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [newStock, setNewStock] = useState('');
  const [reasonCode, setReasonCode] = useState<AdjustmentReasonCode>('audit');
  const [notes, setNotes] = useState('');
  const [performedBy, setPerformedBy] = useState('Boutique Manager');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      inventoryService.getLocations().then((locs) => {
        setLocations(locs);
        const defaultLoc = locs.find((l) => l.isDefault) || locs[0];
        if (defaultLoc) {
          setSelectedLocationId(defaultLoc.id);
          const currentCount = product.locationStock[defaultLoc.id] ?? product.currentStock;
          setNewStock(String(currentCount));
        }
      });
      setNotes('');
      setError(null);
    }
  }, [isOpen, product]);

  if (!product) return null;

  const currentCount =
    product.locationStock[selectedLocationId] ?? product.currentStock;
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
        locationId: selectedLocationId,
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
      maxWidth="540px"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            loadingText="Saving Adjustment..."
          >
            Confirm Adjustment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {error && (
          <div
            style={{
              padding: '0.75rem',
              backgroundColor: 'var(--yz-status-out-stock-bg)',
              color: 'var(--yz-status-out-stock)',
              borderRadius: 'var(--yz-radius-md)',
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        <div className="yz-field">
          <label className="yz-label">Stock Location / Counter *</label>
          <select
            value={selectedLocationId}
            onChange={(e) => {
              setSelectedLocationId(e.target.value);
              const count = product.locationStock[e.target.value] ?? product.currentStock;
              setNewStock(String(count));
            }}
            className="yz-select"
          >
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </select>
        </div>

        {/* Current vs New Calculation */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '0.75rem',
            padding: '1rem',
            backgroundColor: 'var(--yz-bg-subtle)',
            borderRadius: 'var(--yz-radius-md)',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--yz-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              System Stock
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'var(--yz-font-display)' }}>
              {currentCount}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--yz-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Physical Count
            </div>
            <input
              type="number"
              min="0"
              value={newStock}
              onChange={(e) => setNewStock(e.target.value)}
              className="yz-input tabular-nums"
              style={{ textAlign: 'center', fontSize: '1.25rem', fontWeight: 700, padding: '0.3rem' }}
            />
          </div>

          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--yz-text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Net Delta
            </div>
            <div
              style={{
                fontSize: '1.4rem',
                fontWeight: 700,
                fontFamily: 'var(--yz-font-display)',
                color: delta > 0 ? 'var(--yz-status-in-stock)' : delta < 0 ? 'var(--yz-status-out-stock)' : 'var(--yz-text-muted)',
              }}
            >
              {delta > 0 ? `+${delta}` : delta}
            </div>
          </div>
        </div>

        <div className="yz-field">
          <label className="yz-label">Adjustment Reason *</label>
          <select
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value as AdjustmentReasonCode)}
            className="yz-select"
          >
            {REASON_OPTIONS.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="yz-field">
          <label className="yz-label">Reason Notes & Justification *</label>
          <textarea
            rows={2}
            placeholder="Explain why this adjustment is being made..."
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
