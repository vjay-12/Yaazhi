import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import type {
  OperatingExpense,
  CreateOperatingExpenseInput,
  UpdateOperatingExpenseInput,
} from '../../../services/expensesSuppliesService';
import type { VendorData } from '../../../services/supplierService';

interface RecordExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateOperatingExpenseInput | UpdateOperatingExpenseInput) => Promise<void>;
  expenseToEdit?: OperatingExpense | null;
  categories: string[];
  vendors: VendorData[];
}

export const RecordExpenseModal: React.FC<RecordExpenseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  expenseToEdit,
  categories,
  vendors,
}) => {
  const isEditing = Boolean(expenseToEdit);

  const [category, setCategory] = useState('Rent & Lease');
  const [customCategory, setCustomCategory] = useState('');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('UPI');

  const [vendorChoice, setVendorChoice] = useState<'NONE' | 'EXISTING' | 'CUSTOM'>('CUSTOM');
  const [vendorId, setVendorId] = useState('');
  const [payeeName, setPayeeName] = useState('');

  const [referenceNumber, setReferenceNumber] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (expenseToEdit) {
      setTitle(expenseToEdit.title || '');
      setCategory(expenseToEdit.category || 'Rent & Lease');
      setAmount(String(expenseToEdit.amount || ''));
      setExpenseDate(
        expenseToEdit.expense_date
          ? new Date(expenseToEdit.expense_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      );
      setPaymentMethod(expenseToEdit.payment_method || 'UPI');
      if (expenseToEdit.vendor_id) {
        setVendorChoice('EXISTING');
        setVendorId(expenseToEdit.vendor_id);
        setPayeeName(expenseToEdit.payee_name || '');
      } else if (expenseToEdit.payee_name) {
        setVendorChoice('CUSTOM');
        setPayeeName(expenseToEdit.payee_name);
        setVendorId('');
      } else {
        setVendorChoice('NONE');
        setPayeeName('');
        setVendorId('');
      }
      setReferenceNumber(expenseToEdit.reference_number || '');
      setReceiptUrl(expenseToEdit.receipt_url || '');
      setNotes(expenseToEdit.notes || '');
    } else {
      setTitle('');
      setCategory(categories[0] || 'Rent & Lease');
      setCustomCategory('');
      setAmount('');
      setExpenseDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setVendorChoice('CUSTOM');
      setVendorId('');
      setPayeeName('');
      setReferenceNumber('');
      setReceiptUrl('');
      setNotes('');
    }
    setError(null);
  }, [expenseToEdit, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Expense description or title is required');
      return;
    }

    const finalCat = category === 'CUSTOM' ? customCategory.trim() : category;
    if (!finalCat) {
      setError('Expense category is required');
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Please enter a valid expense amount greater than zero');
      return;
    }

    let finalVendorId: string | null = null;
    let finalPayeeName: string | null = null;

    if (vendorChoice === 'EXISTING') {
      finalVendorId = vendorId || null;
      const found = vendors.find((v) => v.id === vendorId);
      finalPayeeName = found ? found.name : null;
    } else if (vendorChoice === 'CUSTOM') {
      finalPayeeName = payeeName.trim() || null;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        category: finalCat,
        title: title.trim(),
        amount: parsedAmount,
        expense_date: expenseDate,
        payment_method: paymentMethod,
        vendor_id: finalVendorId,
        payee_name: finalPayeeName,
        reference_number: referenceNumber.trim() || null,
        receipt_url: receiptUrl.trim() || null,
        notes: notes.trim() || null,
      };

      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? `Edit Expense: ${expenseToEdit?.expense_number}` : 'Record Boutique Operating Expense'}
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

        {/* Accounting Separation Notice */}
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
          <strong>Operating Expense Segregation:</strong> Operating expenditures (rent, utilities, deliveries, maintenance) are classified separately from inventory assets to prevent mixing cost accounting treatments.
        </div>

        {/* Title */}
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
            Expense Title / Description *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Atelier Showroom Electricity Bill (October 2026)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="yz-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        {/* Category & Amount */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
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
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="CUSTOM">+ Other Custom Category...</option>
            </select>
            {category === 'CUSTOM' && (
              <input
                type="text"
                placeholder="Enter custom category name"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="yz-input"
                style={{ width: '100%', marginTop: '6px', boxSizing: 'border-box' }}
                required
              />
            )}
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
              Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box', fontWeight: 600 }}
            />
          </div>
        </div>

        {/* Date & Payment Method */}
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
              Expense Date *
            </label>
            <input
              type="date"
              required
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
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
              Payment Method *
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="UPI">UPI / GPay / PhonePe</option>
              <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
              <option value="CASH">Cash Counter</option>
              <option value="CARD">Debit / Credit Card</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        {/* Payee / Vendor Selector */}
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
            Payee / Vendor
          </label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="vendorChoice"
                checked={vendorChoice === 'CUSTOM'}
                onChange={() => setVendorChoice('CUSTOM')}
              />
              Payee Name / Agency
            </label>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="vendorChoice"
                checked={vendorChoice === 'EXISTING'}
                onChange={() => setVendorChoice('EXISTING')}
              />
              Registered Vendor
            </label>
            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="vendorChoice"
                checked={vendorChoice === 'NONE'}
                onChange={() => setVendorChoice('NONE')}
              />
              None
            </label>
          </div>

          {vendorChoice === 'CUSTOM' && (
            <input
              type="text"
              placeholder="e.g. TANGEDCO Tamil Nadu or Kaveri Print Pack"
              value={payeeName}
              onChange={(e) => setPayeeName(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          )}

          {vendorChoice === 'EXISTING' && (
            <select
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              <option value="">-- Select Registered Vendor --</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} {v.city ? `(${v.city})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Reference & Receipt */}
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
              Bill Reference # / Voucher
            </label>
            <input
              type="text"
              placeholder="e.g. EB-OCT-9982"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
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
              Receipt Attachment URL
            </label>
            <input
              type="text"
              placeholder="https://... or doc link"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Notes */}
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
            Notes / Audit Remarks
          </label>
          <textarea
            rows={2}
            placeholder="Additional details, approval note, or transaction info"
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
          <Button variant="primary" size="md" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Expense' : 'Record Expense'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
