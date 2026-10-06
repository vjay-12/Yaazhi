import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { customerService, type CustomerData } from '../../services/customerService';
import { useToast } from '../../components/common/Toast';
import { Loader2 } from 'lucide-react';

interface AddCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerSaved?: (customer: CustomerData) => void;
  onCustomerCreated?: (customer: CustomerData) => void;
  customerToEdit?: CustomerData | null;
}

export const AddCustomerModal: React.FC<AddCustomerModalProps> = ({
  isOpen,
  onClose,
  onCustomerSaved,
  onCustomerCreated,
  customerToEdit,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstin, setGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [city, setCity] = useState('');
  const [shippingSameAsBilling, setShippingSameAsBilling] = useState(true);
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isEditing = Boolean(customerToEdit);

  useEffect(() => {
    if (customerToEdit) {
      setName(customerToEdit.name || '');
      setPhone(customerToEdit.phone || '');
      setEmail(customerToEdit.email || '');
      setGstin(customerToEdit.gstin || '');
      const addr = customerToEdit.billingAddress || customerToEdit.address || '';
      const shipAddr = customerToEdit.shippingAddress || '';
      setBillingAddress(addr);
      setCity(customerToEdit.city || '');
      setShippingAddress(shipAddr);
      setShippingSameAsBilling(!shipAddr || shipAddr === addr);
      setNotes(customerToEdit.notes || '');
    } else {
      setName('');
      setPhone('');
      setEmail('');
      setGstin('');
      setBillingAddress('');
      setCity('');
      setShippingAddress('');
      setShippingSameAsBilling(true);
      setNotes('');
    }
    setErrorMessage(null);
  }, [customerToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Customer name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const resolvedShipping = shippingSameAsBilling ? billingAddress.trim() : shippingAddress.trim();

      if (isEditing && customerToEdit) {
        const updated = await customerService.update(customerToEdit.id, {
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          gstin: gstin.trim() ? gstin.trim().toUpperCase() : undefined,
          address: billingAddress.trim() || undefined,
          city: city.trim() || undefined,
          shipping_address: resolvedShipping || undefined,
          notes: notes.trim() || undefined,
        });

        showToast({
          type: 'success',
          title: 'Customer Updated',
          message: `Saved changes for ${updated.name}`,
        });

        onCustomerSaved?.(updated);
        onCustomerCreated?.(updated);
        onClose();
      } else {
        const created = await customerService.create({
          name: name.trim(),
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
          gstin: gstin.trim() ? gstin.trim().toUpperCase() : undefined,
          address: billingAddress.trim() || undefined,
          city: city.trim() || undefined,
          shipping_address: resolvedShipping || undefined,
          notes: notes.trim() || undefined,
        });

        showToast({
          type: 'success',
          title: 'Customer Created',
          message: `Registered ${created.name} in boutique directory`,
        });

        onCustomerSaved?.(created);
        onCustomerCreated?.(created);
        onClose();
      }
    } catch (err: any) {
      console.error('Customer save error:', err);
      const msg = err.message || 'Could not save customer profile';
      setErrorMessage(msg);
      showToast({
        type: 'error',
        title: 'Error Saving Customer',
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !isSubmitting && onClose()}
      title={isEditing ? 'Edit Customer / Client' : 'Add New Customer / Client'}
      subtitle="Register customer profile for direct use across sales orders, invoices, and quotations"
      maxWidth="600px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {errorMessage && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 'var(--yz-radius-sm)',
              color: '#991B1B',
              fontSize: '11.5px',
              fontWeight: 500,
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Customer / Business Legal Name * */}
        <div>
          <label className="yz-label">Customer / Business Legal Name *</label>
          <input
            type="text"
            className="yz-input"
            required
            autoFocus
            placeholder="e.g. Acme Industrial Labs Ltd / Priyadharshini Sundaram"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Email Address & Phone / WhatsApp Number */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label className="yz-label">Email Address</label>
            <input
              type="email"
              className="yz-input"
              placeholder="accounts@customer.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="yz-label">Phone / WhatsApp Number</label>
            <input
              type="text"
              className="yz-input"
              placeholder="+91 98401 23456"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        {/* Tax Identification Number / GSTIN (Optional) */}
        <div>
          <label className="yz-label">Tax Identification Number / GSTIN (Optional)</label>
          <input
            type="text"
            className="yz-input font-mono"
            style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
            placeholder="29ABCDE1234F1Z5 (LEAVE BLANK FOR UNREGISTERED CONSUMERS)"
            value={gstin}
            onChange={(e) => setGstin(e.target.value.toUpperCase())}
          />
        </div>

        {/* Billing Address (Optional) & City / Location */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
          <div>
            <label className="yz-label">Billing Address (Optional)</label>
            <textarea
              className="yz-input"
              rows={2}
              placeholder="Street address, building, postal code"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
              style={{ height: 'auto', padding: '6px 8px', resize: 'vertical' }}
            />
          </div>
          <div>
            <label className="yz-label">City / Location</label>
            <input
              type="text"
              className="yz-input"
              placeholder="e.g. Chennai, Coimbatore, Vellore"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={{ height: '32px' }}
            />
          </div>
        </div>

        {/* Shipping address checkbox */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0' }}>
          <input
            type="checkbox"
            id="shippingSame"
            checked={shippingSameAsBilling}
            onChange={(e) => setShippingSameAsBilling(e.target.checked)}
            style={{ cursor: 'pointer', accentColor: 'var(--yz-primary, #832729)' }}
          />
          <label
            htmlFor="shippingSame"
            style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)', cursor: 'pointer', userSelect: 'none' }}
          >
            Shipping address same as billing
          </label>
        </div>

        {/* Shipping Address (Optional if different) */}
        {!shippingSameAsBilling && (
          <div>
            <label className="yz-label">Shipping / Delivery Address</label>
            <textarea
              className="yz-input"
              rows={2}
              placeholder="Warehouse / delivery point address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              style={{ height: 'auto', padding: '6px 8px', resize: 'vertical' }}
            />
          </div>
        )}

        {/* Notes / Styling Preferences */}
        <div>
          <label className="yz-label">Notes / Preferences</label>
          <textarea
            className="yz-input"
            rows={2}
            placeholder="e.g. Bridal client, prefers antique zari borders and tailored high-neck blouses"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ height: 'auto', padding: '6px 8px', resize: 'vertical' }}
          />
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '8px',
            paddingTop: '10px',
            borderTop: '1px solid var(--yz-border)',
          }}
        >
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Loader2 size={13} className="animate-spin" /> Saving...
              </span>
            ) : isEditing ? (
              'Save Customer'
            ) : (
              'Create Customer'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
