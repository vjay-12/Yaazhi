import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Plus, Trash2 } from 'lucide-react';
import type { SupplyItem, CreateSupplyPurchaseInput } from '../../../services/expensesSuppliesService';
import type { VendorData } from '../../../services/supplierService';

interface LineItemRow {
  supply_id: string;
  quantity: string;
  unit_cost: string;
  tax_rate: string;
}

interface RecordSupplyPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateSupplyPurchaseInput) => Promise<void>;
  supplies: SupplyItem[];
  suppliers: VendorData[];
}

export const RecordSupplyPurchaseModal: React.FC<RecordSupplyPurchaseModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  supplies,
  suppliers,
}) => {
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [customSupplierName, setCustomSupplierName] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const [items, setItems] = useState<LineItemRow[]>([
    { supply_id: '', quantity: '1', unit_cost: '0', tax_rate: '0' },
  ]);

  const [discountTotal, setDiscountTotal] = useState('0');
  const [paidAmount, setPaidAmount] = useState('0');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedSupplierId(suppliers[0]?.id || '');
      setCustomSupplierName('');
      setSupplierPhone(suppliers[0]?.phone || '');
      setPurchaseDate(new Date().toISOString().split('T')[0]);
      setInvoiceNumber('');
      setDiscountTotal('0');
      setPaymentMethod('UPI');
      setReceiptUrl('');
      setNotes('');
      setError(null);

      if (supplies.length > 0) {
        const first = supplies[0];
        setItems([
          {
            supply_id: first.id,
            quantity: '1',
            unit_cost: String(first.unit_cost || 0),
            tax_rate: '5',
          },
        ]);
      } else {
        setItems([{ supply_id: '', quantity: '1', unit_cost: '0', tax_rate: '0' }]);
      }
    }
  }, [isOpen, supplies, suppliers]);

  // Handle supplier change
  const handleSupplierChange = (val: string) => {
    setSelectedSupplierId(val);
    if (val === 'CUSTOM') {
      setCustomSupplierName('');
      setSupplierPhone('');
    } else {
      const found = suppliers.find((s) => s.id === val);
      if (found) {
        setCustomSupplierName(found.name);
        setSupplierPhone(found.phone || '');
      }
    }
  };

  // Calculations
  const calculatedTotals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;

    for (const item of items) {
      const qty = parseFloat(item.quantity) || 0;
      const cost = parseFloat(item.unit_cost) || 0;
      const taxRate = parseFloat(item.tax_rate) || 0;

      const lineNet = qty * cost;
      const lineTax = lineNet * (taxRate / 100);

      subtotal += lineNet;
      taxTotal += lineTax;
    }

    const discount = Math.max(0, parseFloat(discountTotal) || 0);
    const grandTotal = Math.max(0, subtotal + taxTotal - discount);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      discountTotal: discount,
      grandTotal: Math.round(grandTotal * 100) / 100,
    };
  }, [items, discountTotal]);

  // Auto-fill paidAmount with grand total when totals change if user hasn't explicitly diverged
  const [autoMatchPaid, setAutoMatchPaid] = useState(true);
  useEffect(() => {
    if (autoMatchPaid) {
      setPaidAmount(String(calculatedTotals.grandTotal));
    }
  }, [calculatedTotals.grandTotal, autoMatchPaid]);

  const numPaid = parseFloat(paidAmount) || 0;
  const balanceDue = Math.max(0, calculatedTotals.grandTotal - numPaid);
  const paymentStatus =
    balanceDue <= 0.005 ? 'PAID' : numPaid > 0 ? 'PARTIAL' : 'PENDING';

  // Item row operations
  const handleItemSupplyChange = (index: number, newSupplyId: string) => {
    const supply = supplies.find((s) => s.id === newSupplyId);
    setItems((prev) => {
      const next = [...prev];
      next[index] = {
        ...next[index],
        supply_id: newSupplyId,
        unit_cost: supply ? String(supply.unit_cost || 0) : next[index].unit_cost,
      };
      return next;
    });
  };

  const handleItemFieldChange = (index: number, field: keyof LineItemRow, val: string) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const handleAddItemRow = () => {
    const firstSupply = supplies[0];
    setItems((prev) => [
      ...prev,
      {
        supply_id: firstSupply?.id || '',
        quantity: '1',
        unit_cost: String(firstSupply?.unit_cost || 0),
        tax_rate: '5',
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalSupplierName = '';
    let finalSupplierId: string | null = null;

    if (selectedSupplierId === 'CUSTOM') {
      if (!customSupplierName.trim()) {
        setError('Please enter custom supplier/weaver name');
        return;
      }
      finalSupplierName = customSupplierName.trim();
    } else {
      const found = suppliers.find((s) => s.id === selectedSupplierId);
      if (!found) {
        setError('Please select a supplier or enter custom supplier');
        return;
      }
      finalSupplierName = found.name;
      finalSupplierId = found.id;
    }

    // Validate items
    if (items.length === 0) {
      setError('At least one item is required in the purchase');
      return;
    }

    const parsedItems = [];
    for (const item of items) {
      if (!item.supply_id) {
        setError('Please select a supply item for each line');
        return;
      }
      const qty = parseFloat(item.quantity);
      if (isNaN(qty) || qty <= 0) {
        setError('Item quantity must be greater than zero');
        return;
      }
      const cost = parseFloat(item.unit_cost);
      if (isNaN(cost) || cost < 0) {
        setError('Item unit cost cannot be negative');
        return;
      }
      const taxRate = parseFloat(item.tax_rate) || 0;

      parsedItems.push({
        supply_id: item.supply_id,
        quantity: qty,
        unit_cost: cost,
        tax_rate: taxRate,
      });
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await onSubmit({
        supplier_id: finalSupplierId,
        supplier_name: finalSupplierName,
        supplier_phone: supplierPhone.trim() || null,
        purchase_date: purchaseDate,
        invoice_number: invoiceNumber.trim() || null,
        discount_total: calculatedTotals.discountTotal,
        paid_amount: numPaid,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        receipt_url: receiptUrl.trim() || null,
        notes: notes.trim() || null,
        items: parsedItems,
      });

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record supplies purchase');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Supplies Purchase (Multi-Item)"
      size="xl"
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
          <strong>Automatic Inventory Receipt:</strong> Saving this purchase will increment consumable supply stock balances and record auditable purchase receipt movements exactly once.
        </div>

        {/* Supplier & Invoice Header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
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
              Supplier / Vendor *
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => handleSupplierChange(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            >
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.city ? `(${s.city})` : ''}
                </option>
              ))}
              <option value="CUSTOM">+ Other Vendor / One-off Payee...</option>
            </select>
          </div>

          {selectedSupplierId === 'CUSTOM' && (
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
                Custom Vendor Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Surat Zari Mills Direct"
                value={customSupplierName}
                onChange={(e) => setCustomSupplierName(e.target.value)}
                className="yz-input"
                style={{ width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          )}

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
              Supplier Contact Phone
            </label>
            <input
              type="text"
              placeholder="+91 98765 43210"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
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
              Purchase Date *
            </label>
            <input
              type="date"
              required
              value={purchaseDate}
              onChange={(e) => setPurchaseDate(e.target.value)}
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
              Vendor Bill / Invoice #
            </label>
            <input
              type="text"
              placeholder="e.g. INV-2026-891"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="yz-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
              Purchase Line Items ({items.length})
            </span>
            <Button variant="secondary" size="sm" type="button" onClick={handleAddItemRow}>
              <Plus size={13} style={{ marginRight: '4px' }} /> Add Item Line
            </Button>
          </div>

          <div
            style={{
              border: '1px solid var(--yz-border)',
              borderRadius: 'var(--yz-radius-md)',
              overflow: 'hidden',
            }}
          >
            <table className="yz-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--yz-bg-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '8px 10px', width: '38%' }}>Consumable Supply Item</th>
                  <th style={{ padding: '8px 10px', width: '16%' }}>Qty</th>
                  <th style={{ padding: '8px 10px', width: '18%' }}>Unit Cost (₹)</th>
                  <th style={{ padding: '8px 10px', width: '12%' }}>GST %</th>
                  <th style={{ padding: '8px 10px', width: '16%', textAlign: 'right' }}>Total (₹)</th>
                  <th style={{ padding: '8px 10px', width: '40px' }}></th>
                </tr>
              </thead>
              <tbody>
                {items.map((row, index) => {
                  const qty = parseFloat(row.quantity) || 0;
                  const cost = parseFloat(row.unit_cost) || 0;
                  const tax = parseFloat(row.tax_rate) || 0;
                  const lineTotal = qty * cost * (1 + tax / 100);
                  const selected = supplies.find((s) => s.id === row.supply_id);

                  return (
                    <tr key={index} style={{ borderBottom: '1px solid var(--yz-border)' }}>
                      <td style={{ padding: '6px 10px' }}>
                        <select
                          value={row.supply_id}
                          onChange={(e) => handleItemSupplyChange(index, e.target.value)}
                          className="yz-input"
                          required
                          style={{ width: '100%', fontSize: '12px' }}
                        >
                          <option value="">-- Select Supply --</option>
                          {supplies
                            .filter((s) => !s.is_archived)
                            .map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} ({s.sku}) [{s.unit}]
                              </option>
                            ))}
                        </select>
                      </td>

                      <td style={{ padding: '6px 10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="any"
                            min="0.01"
                            required
                            placeholder="Qty"
                            value={row.quantity}
                            onChange={(e) => handleItemFieldChange(index, 'quantity', e.target.value)}
                            className="yz-input"
                            style={{ width: '100%', fontSize: '12px' }}
                          />
                          {selected?.unit && (
                            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                              {selected.unit}
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '6px 10px' }}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          required
                          placeholder="Cost"
                          value={row.unit_cost}
                          onChange={(e) => handleItemFieldChange(index, 'unit_cost', e.target.value)}
                          className="yz-input"
                          style={{ width: '100%', fontSize: '12px' }}
                        />
                      </td>

                      <td style={{ padding: '6px 10px' }}>
                        <select
                          value={row.tax_rate}
                          onChange={(e) => handleItemFieldChange(index, 'tax_rate', e.target.value)}
                          className="yz-input"
                          style={{ width: '100%', fontSize: '12px' }}
                        >
                          <option value="0">0%</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>

                      <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 600 }}>
                        ₹{lineTotal.toFixed(2)}
                      </td>

                      <td style={{ padding: '6px 10px', textAlign: 'center' }}>
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(index)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--yz-danger, #ef4444)',
                              cursor: 'pointer',
                              padding: '4px',
                            }}
                            title="Remove line item"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Calculation Summary & Payment Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '16px' }}>
          {/* Payment Details */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--yz-bg-subtle)',
              borderRadius: 'var(--yz-radius-md)',
              border: '1px solid var(--yz-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
              Supplier Payment Settlement
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)', marginBottom: '2px' }}>
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="yz-input"
                  style={{ width: '100%', fontSize: '12px' }}
                >
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="BANK_TRANSFER">Bank NEFT / RTGS</option>
                  <option value="CASH">Cash Counter</option>
                  <option value="CARD">Debit / Credit Card</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)', marginBottom: '2px' }}>
                  Amount Paid Now (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={calculatedTotals.grandTotal}
                  value={paidAmount}
                  onChange={(e) => {
                    setAutoMatchPaid(false);
                    setPaidAmount(e.target.value);
                  }}
                  className="yz-input"
                  style={{ width: '100%', fontSize: '12px' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <span style={{ color: 'var(--yz-text-secondary)' }}>Status:</span>
              <span
                style={{
                  fontWeight: 700,
                  color:
                    paymentStatus === 'PAID'
                      ? 'var(--yz-success, #16a34a)'
                      : paymentStatus === 'PARTIAL'
                      ? 'var(--yz-warning, #d97706)'
                      : 'var(--yz-danger, #ef4444)',
                }}
              >
                {paymentStatus} {balanceDue > 0 ? `(Balance Due: ₹${balanceDue.toFixed(2)})` : ''}
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)', marginBottom: '2px' }}>
                Receipt Document / Scan URL
              </label>
              <input
                type="text"
                placeholder="https://... or reference path"
                value={receiptUrl}
                onChange={(e) => setReceiptUrl(e.target.value)}
                className="yz-input"
                style={{ width: '100%', fontSize: '12px' }}
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--yz-bg-surface)',
              borderRadius: 'var(--yz-radius-md)',
              border: '1px solid var(--yz-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
              fontSize: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-text-secondary)' }}>
              <span>Subtotal:</span>
              <span>₹{calculatedTotals.subtotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-text-secondary)' }}>
              <span>Taxes (GST):</span>
              <span>₹{calculatedTotals.taxTotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--yz-text-secondary)' }}>
              <span>Discount (₹):</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={discountTotal}
                onChange={(e) => setDiscountTotal(e.target.value)}
                className="yz-input"
                style={{ width: '90px', padding: '2px 6px', fontSize: '12px', textAlign: 'right' }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: '6px',
                borderTop: '1px solid var(--yz-border)',
                fontWeight: 700,
                fontSize: '15px',
                color: 'var(--yz-text-primary)',
              }}
            >
              <span>Grand Total:</span>
              <span>₹{calculatedTotals.grandTotal.toFixed(2)}</span>
            </div>
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
            Purchase Notes / Remarks
          </label>
          <input
            type="text"
            placeholder="e.g. Bulk order discount applied by weaver; verified roll count at counter"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="yz-input"
            style={{ width: '100%', boxSizing: 'border-box' }}
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
            disabled={isSubmitting || items.length === 0}
          >
            {isSubmitting ? 'Recording Purchase...' : 'Confirm & Receive Stock'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
