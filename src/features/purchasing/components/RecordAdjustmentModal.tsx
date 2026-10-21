import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import type { SupplyItem, RecordAdjustmentInput } from '../../../services/expensesSuppliesService';

interface RecordAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: RecordAdjustmentInput) => Promise<void>;
  supplies: SupplyItem[];
  preselectedSupply?: SupplyItem | null;
}

export const RecordAdjustmentModal: React.FC<RecordAdjustmentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  supplies,
  preselectedSupply,
}) => {
  const [supplyId, setSupplyId] = useState('');
  const [physicalCount, setPhysicalCount] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (preselectedSupply) {
      setSupplyId(preselectedSupply.id);
      setPhysicalCount(String(preselectedSupply.current_quantity));
    } else if (supplies.length > 0 && !supplyId) {
      setSupplyId(supplies[0].id);
      setPhysicalCount(String(supplies[0].current_quantity));
    }
    setReason('');
    setError(null);
  }, [isOpen, preselectedSupply, supplies]);

  const selectedSupply = supplies.find((s) => s.id === supplyId) || preselectedSupply;
  const currentStock = Number(selectedSupply?.current_quantity ?? 0);
  const parsedPhysical = parseFloat(physicalCount);
  const difference = !isNaN(parsedPhysical) ? parsedPhysical - currentStock : 0;
  const unit = selectedSupply?.unit || 'units';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplyId) {
      setError('Please select a supply item');
      return;
    }

    if (isNaN(parsedPhysical) || parsedPhysical < 0) {
      setError('Physical count cannot be negative');
      return;
    }

    if (difference === 0) {
      setError('Physical count matches current system stock. No adjustment needed.');
      return;
    }

    if (!reason.trim()) {
      setError('Please provide an audit reason for the stock adjustment.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        supply_id: supplyId,
        physical_count: parsedPhysical,
        reason: reason.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Physical Count & Stock Reconciliation"
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
          <strong>Auditable Movement Ledger:</strong> Stock adjustments record an explicit variance entry rather than silently overwriting numbers. All adjustments are logged with timestamp and user.
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
            onChange={(e) => {
              setSupplyId(e.target.value);
              const found = supplies.find((s) => s.id === e.target.value);
              if (found) setPhysicalCount(String(found.current_quantity));
            }}
            className="yz-input"
            required
            style={{ width: '100%', boxSizing: 'border-box' }}
          >
            {supplies
              .filter((s) => !s.is_archived)
              .map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.sku}) — Current System Stock: {s.current_quantity} {s.unit}
                </option>
              ))}
          </select>
        </div>

        {/* Current vs Physical Comparison */}
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
              Current System Stock
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={`${currentStock} ${unit}`}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box', backgroundColor: 'var(--yz-bg-subtle)' }}
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
              Actual Physical Count *
            </label>
            <input
              type="number"
              step="any"
              min="0"
              required
              placeholder="0"
              value={physicalCount}
              onChange={(e) => setPhysicalCount(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Variance Feedback */}
        {!isNaN(parsedPhysical) && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--yz-radius-sm)',
              fontSize: '13px',
              fontWeight: 500,
              backgroundColor:
                difference === 0
                  ? 'var(--yz-bg-subtle)'
                  : difference > 0
                  ? 'rgba(34, 197, 94, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${
                difference === 0
                  ? 'var(--yz-border)'
                  : difference > 0
                  ? 'var(--yz-success, #16a34a)'
                  : 'var(--yz-danger, #ef4444)'
              }`,
              color:
                difference === 0
                  ? 'var(--yz-text-secondary)'
                  : difference > 0
                  ? 'var(--yz-success, #16a34a)'
                  : 'var(--yz-danger, #ef4444)',
            }}
          >
            {difference === 0 ? (
              'Physical count exactly matches system record.'
            ) : difference > 0 ? (
              `+${difference.toFixed(2)} ${unit} Surplus (System stock will be increased via ADJUSTMENT_ADD)`
            ) : (
              `${difference.toFixed(2)} ${unit} Shortage (System stock will be decreased via ADJUSTMENT_REDUCE)`
            )}
          </div>
        )}

        {/* Reason */}
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
            Audit Reason / Justification *
          </label>
          <textarea
            rows={2}
            required
            placeholder="e.g. Monthly physical stock audit; found 2 unopened rolls misplaced in shelf B"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
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
            disabled={isSubmitting || difference === 0}
          >
            {isSubmitting ? 'Adjusting...' : 'Record Adjustment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
