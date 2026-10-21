import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import type { SupplyItem, RecordConsumptionInput } from '../../../services/expensesSuppliesService';

interface RecordConsumptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: RecordConsumptionInput) => Promise<void>;
  supplies: SupplyItem[];
  preselectedSupply?: SupplyItem | null;
}

export const RecordConsumptionModal: React.FC<RecordConsumptionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  supplies,
  preselectedSupply,
}) => {
  const [supplyId, setSupplyId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [stitchingOrderNumber, setStitchingOrderNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedSupply) {
      setSupplyId(preselectedSupply.id);
    } else if (supplies.length > 0 && !supplyId) {
      setSupplyId(supplies[0].id);
    }
    setQuantity('');
    setStitchingOrderNumber('');
    setNotes('');
    setError(null);
  }, [isOpen, preselectedSupply, supplies]);

  const selectedSupply = supplies.find((s) => s.id === supplyId) || preselectedSupply;
  const currentStock = Number(selectedSupply?.current_quantity ?? 0);
  const unit = selectedSupply?.unit || 'units';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplyId) {
      setError('Please select a supply item');
      return;
    }

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setError('Consumption quantity must be greater than zero');
      return;
    }

    if (qty > currentStock) {
      setError(`Cannot consume ${qty} ${unit}. Available stock is only ${currentStock} ${unit}.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        supply_id: supplyId,
        quantity: qty,
        stitching_order_number: stitchingOrderNumber.trim() || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record consumption');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Atelier Supplies Consumption"
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

        {/* Informational Banner */}
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--yz-bg-subtle)',
            borderRadius: 'var(--yz-radius-sm)',
            border: '1px solid var(--yz-border)',
            fontSize: '12px',
            color: 'var(--yz-text-secondary)',
            lineHeight: '1.5',
          }}
        >
          <strong>Auditable Stock Consumption:</strong> Deducts materials used during tailoring or boutique operations. Consumables inventory is strictly isolated from ready-made garment stock.
        </div>

        {/* Supply Item Picker */}
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
            Consumable Supply Item *
          </label>
          <select
            value={supplyId}
            onChange={(e) => setSupplyId(e.target.value)}
            className="yz-input"
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          >
            {supplies
              .filter((s) => !s.is_archived)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.sku}) — Available: {s.current_quantity} {s.unit}
                </option>
              ))}
          </select>
        </div>

        {/* Available Stock Indicator */}
        {selectedSupply && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              backgroundColor: currentStock > 0 ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)',
              border: `1px solid ${currentStock > 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: 'var(--yz-radius-sm)',
              fontSize: '13px',
            }}
          >
            <span style={{ color: 'var(--yz-text-secondary)' }}>Current Available Balance:</span>
            <span style={{ fontWeight: 700, color: currentStock > 0 ? 'var(--yz-success, #16a34a)' : 'var(--yz-danger, #ef4444)' }}>
              {currentStock} {unit}
            </span>
          </div>
        )}

        {/* Quantity Used */}
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
            Quantity Used ({unit}) *
          </label>
          <input
            type="number"
            step="any"
            min="0.01"
            max={currentStock > 0 ? currentStock : undefined}
            required
            placeholder={`e.g. 2.5`}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="yz-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Remaining balance will be:{' '}
            {currentStock - (parseFloat(quantity) || 0) >= 0
              ? `${(currentStock - (parseFloat(quantity) || 0)).toFixed(2)} ${unit}`
              : 'Insufficient Stock'}
          </span>
        </div>

        {/* Optional Stitching Order Linkage */}
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
            Link to Stitching Order # (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. SO-2026-0012 or Job Sheet ID"
            value={stitchingOrderNumber}
            onChange={(e) => setStitchingOrderNumber(e.target.value)}
            className="yz-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Associate this consumption with a customer stitching job or tailor order.
          </span>
        </div>

        {/* Consumption Notes */}
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
            Notes / Tailoring Purpose
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Lining attached to bridal raw silk blouse; neck piping cord"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="yz-input"
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

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
          <Button
            variant="primary"
            size="md"
            type="submit"
            disabled={isSubmitting || currentStock <= 0}
          >
            {isSubmitting ? 'Recording...' : 'Record Consumption'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
