import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { FileText, Ban, DollarSign } from 'lucide-react';
import type { SupplyPurchase } from '../../../services/expensesSuppliesService';

interface SupplyPurchaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchase: SupplyPurchase | null;
  onCancelPurchase: (purchaseId: string, reason: string) => Promise<void>;
  onRecordPayment: (purchaseId: string, amount: number, method?: string, notes?: string) => Promise<void>;
}

export const SupplyPurchaseDetailModal: React.FC<SupplyPurchaseDetailModalProps> = ({
  isOpen,
  onClose,
  purchase,
  onCancelPurchase,
  onRecordPayment,
}) => {
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isPaying, setIsPaying] = useState(false);

  if (!purchase) return null;

  const isCancelled = purchase.status === 'CANCELLED';
  const balanceDue = Number(purchase.balance_amount) || 0;

  const handleCancel = async () => {
    if (!cancelReason.trim()) return;
    try {
      setIsCancelling(true);
      await onCancelPurchase(purchase.id, cancelReason.trim());
      setShowCancelPrompt(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCancelling(false);
    }
  };

  const handlePayment = async () => {
    const amt = parseFloat(paymentAmount);
    if (isNaN(amt) || amt <= 0) return;
    try {
      setIsPaying(true);
      await onRecordPayment(purchase.id, amt, paymentMethod, paymentNotes.trim());
      setShowPaymentPrompt(false);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Purchase Record: ${purchase.purchase_number}`}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Status Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            backgroundColor: isCancelled ? 'rgba(239, 68, 68, 0.08)' : 'var(--yz-bg-subtle)',
            border: `1px solid ${isCancelled ? 'rgba(239, 68, 68, 0.3)' : 'var(--yz-border)'}`,
            borderRadius: 'var(--yz-radius-md)',
          }}
        >
          <div>
            <span style={{ fontSize: '12px', color: 'var(--yz-text-muted)' }}>Supplier / Vendor:</span>
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
              {purchase.supplier_name}
            </div>
            {purchase.supplier_phone && (
              <span style={{ fontSize: '12px', color: 'var(--yz-text-secondary)' }}>
                Phone: {purchase.supplier_phone}
              </span>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '12px', color: 'var(--yz-text-muted)' }}>Status:</span>
            <div style={{ marginTop: '2px' }}>
              {isCancelled ? (
                <Badge variant="danger">CANCELLED / VOIDED</Badge>
              ) : purchase.payment_status === 'PAID' ? (
                <Badge variant="success">PAID IN FULL</Badge>
              ) : purchase.payment_status === 'PARTIAL' ? (
                <Badge variant="warning">PARTIAL PAYMENT</Badge>
              ) : (
                <Badge variant="danger">PAYMENT PENDING</Badge>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Info Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px',
            fontSize: '12px',
            padding: '10px 14px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-radius-md)',
          }}
        >
          <div>
            <span style={{ color: 'var(--yz-text-muted)' }}>Purchase Date:</span>
            <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)', marginTop: '2px' }}>
              {new Date(purchase.purchase_date).toLocaleDateString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--yz-text-muted)' }}>Invoice / Bill Reference:</span>
            <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)', marginTop: '2px' }}>
              {purchase.invoice_number || 'N/A'}
            </div>
          </div>

          <div>
            <span style={{ color: 'var(--yz-text-muted)' }}>Payment Method:</span>
            <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)', marginTop: '2px' }}>
              {purchase.payment_method}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ border: '1px solid var(--yz-border)', borderRadius: 'var(--yz-radius-md)', overflow: 'hidden' }}>
          <table className="yz-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--yz-bg-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px' }}>Item</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Unit Cost</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>GST Rate</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--yz-border)' }}>
                  <td style={{ padding: '8px 10px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                      {item.supply?.name || 'Supply Item'}
                    </span>
                    {item.supply?.sku && (
                      <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', display: 'block' }}>
                        {item.supply.sku}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    {item.quantity} {item.supply?.unit || ''}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    ₹{Number(item.unit_cost).toFixed(2)}
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right' }}>
                    {Number(item.tax_rate ?? 0)}%
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                    ₹{Number(item.total_cost).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            fontSize: '13px',
          }}
        >
          <div style={{ flex: 1, fontSize: '12px', color: 'var(--yz-text-secondary)' }}>
            {purchase.notes && (
              <div style={{ marginBottom: '6px' }}>
                <strong>Notes / Audit:</strong>
                <div style={{ whiteSpace: 'pre-wrap', marginTop: '2px', color: 'var(--yz-text-muted)' }}>
                  {purchase.notes}
                </div>
              </div>
            )}
            {purchase.receipt_url && (
              <div>
                <a
                  href={purchase.receipt_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--yz-primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <FileText size={13} /> View Attached Bill / Invoice
                </a>
              </div>
            )}
          </div>

          <div
            style={{
              width: '260px',
              backgroundColor: 'var(--yz-bg-subtle)',
              padding: '12px 14px',
              borderRadius: 'var(--yz-radius-md)',
              border: '1px solid var(--yz-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-text-secondary)' }}>
              <span>Subtotal:</span>
              <span>₹{Number(purchase.subtotal).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-text-secondary)' }}>
              <span>Tax Total:</span>
              <span>₹{Number(purchase.tax_total).toFixed(2)}</span>
            </div>
            {Number(purchase.discount_total) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-success, #16a34a)' }}>
                <span>Discount:</span>
                <span>-₹{Number(purchase.discount_total).toFixed(2)}</span>
              </div>
            )}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: '15px',
                color: 'var(--yz-text-primary)',
                paddingTop: '6px',
                borderTop: '1px solid var(--yz-border)',
              }}
            >
              <span>Grand Total:</span>
              <span>₹{Number(purchase.grand_total).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-text-secondary)', fontSize: '12px' }}>
              <span>Amount Paid:</span>
              <span>₹{Number(purchase.paid_amount).toFixed(2)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: balanceDue > 0 ? 'var(--yz-danger, #ef4444)' : 'var(--yz-success, #16a34a)',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              <span>Outstanding Balance:</span>
              <span>₹{balanceDue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Cancel Prompt Dialog */}
        {showCancelPrompt && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--yz-danger, #ef4444)',
              borderRadius: 'var(--yz-radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--yz-danger, #ef4444)', fontSize: '13px' }}>
              Cancel Purchase & Reverse Inventory Stock
            </span>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--yz-text-secondary)' }}>
              Cancelling this purchase will deduct the received quantities from consumable inventory and record RETURN_OUT movements.
            </p>
            <input
              type="text"
              placeholder="Reason for cancellation (required)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="yz-input"
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <Button variant="secondary" size="sm" onClick={() => setShowCancelPrompt(false)}>
                Back
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancel}
                disabled={isCancelling || !cancelReason.trim()}
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </Button>
            </div>
          </div>
        )}

        {/* Record Payment Prompt Dialog */}
        {showPaymentPrompt && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--yz-bg-subtle)',
              border: '1px solid var(--yz-primary)',
              borderRadius: 'var(--yz-radius-md)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <span style={{ fontWeight: 700, color: 'var(--yz-primary)', fontSize: '13px' }}>
              Record Supplier Payment (Remaining Due: ₹{balanceDue.toFixed(2)})
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={balanceDue}
                placeholder={`Amount (max ₹${balanceDue.toFixed(2)})`}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="yz-input"
              />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="yz-input"
              >
                <option value="UPI">UPI</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="CHEQUE">Cheque</option>
              </select>
            </div>
            <input
              type="text"
              placeholder="Payment reference / notes (optional)"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              className="yz-input"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <Button variant="secondary" size="sm" onClick={() => setShowPaymentPrompt(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handlePayment}
                disabled={isPaying || !paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                {isPaying ? 'Saving...' : 'Record Payment'}
              </Button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '12px',
            borderTop: '1px solid var(--yz-border)',
          }}
        >
          <div>
            {!isCancelled && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setShowCancelPrompt(true);
                  setShowPaymentPrompt(false);
                }}
                style={{ color: 'var(--yz-danger, #ef4444)' }}
              >
                <Ban size={13} style={{ marginRight: '4px' }} /> Cancel Purchase
              </Button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {!isCancelled && balanceDue > 0 && !showPaymentPrompt && (
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  setPaymentAmount(String(balanceDue));
                  setShowPaymentPrompt(true);
                  setShowCancelPrompt(false);
                }}
              >
                <DollarSign size={14} style={{ marginRight: '4px' }} /> Record Payment
              </Button>
            )}
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
