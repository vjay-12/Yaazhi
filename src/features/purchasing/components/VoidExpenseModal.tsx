import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import type { OperatingExpense } from '../../../services/expensesSuppliesService';

interface VoidExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  expense: OperatingExpense | null;
  onConfirmVoid: (expenseId: string, reason: string) => Promise<void>;
}

export const VoidExpenseModal: React.FC<VoidExpenseModalProps> = ({
  isOpen,
  onClose,
  expense,
  onConfirmVoid,
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!expense) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Please provide a valid reason for voiding this expense');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirmVoid(expense.id, reason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to void expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Void Operating Expense: ${expense.expense_number}`}
      size="sm"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--yz-danger, #ef4444)',
              borderRadius: 'var(--yz-radius-sm)',
              color: 'var(--yz-danger, #ef4444)',
              fontSize: '12px',
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            padding: '10px 12px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: 'var(--yz-radius-sm)',
            fontSize: '12px',
            color: 'var(--yz-text-secondary)',
            lineHeight: '1.5',
          }}
        >
          <strong style={{ color: 'var(--yz-danger, #ef4444)' }}>Audit Action:</strong> Voiding will mark this expense as VOIDED, exclude its amount from period expense reports, and retain an immutable audit log.
        </div>

        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div>
            <span style={{ color: 'var(--yz-text-muted)' }}>Title: </span>
            <strong style={{ color: 'var(--yz-text-primary)' }}>{expense.title}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--yz-text-muted)' }}>Amount: </span>
            <strong style={{ color: 'var(--yz-text-primary)' }}>₹{Number(expense.amount).toFixed(2)}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--yz-text-muted)' }}>Date: </span>
            <span>{new Date(expense.expense_date).toLocaleDateString('en-IN')}</span>
          </div>
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
            Reason for Voiding *
          </label>
          <textarea
            rows={2}
            required
            placeholder="e.g. Duplicate entry, bill cancelled by utility board, or entered under incorrect vendor"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="yz-input"
            style={{ width: '100%', boxSizing: 'border-box', resize: 'vertical' }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            paddingTop: '10px',
            borderTop: '1px solid var(--yz-border)',
          }}
        >
          <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            type="submit"
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? 'Voiding...' : 'Confirm Void'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
