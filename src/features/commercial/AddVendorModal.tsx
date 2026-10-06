import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Landmark } from 'lucide-react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { supplierService, type VendorData } from '../../services/supplierService';
import { useToast } from '../../components/common/Toast';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorCreated?: (vendor: VendorData) => void;
  vendorToEdit?: VendorData | null;
}

export const AddVendorModal: React.FC<AddVendorModalProps> = ({
  isOpen,
  onClose,
  onVendorCreated,
  vendorToEdit,
}) => {
  const { showToast } = useToast();
  const isEditing = Boolean(vendorToEdit);

  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [category, setCategory] = useState('Fabric Supplier');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Kanchipuram');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');

  // Bank & Payment fields
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [upiId, setUpiId] = useState('');
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  // Validation errors
  const [ifscError, setIfscError] = useState('');
  const [upiError, setUpiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (vendorToEdit) {
      setName(vendorToEdit.name || '');
      setContactPerson(vendorToEdit.contactPerson || '');
      setCategory(vendorToEdit.category || 'Fabric Supplier');
      setPhone(vendorToEdit.phone || '');
      setEmail(vendorToEdit.email || '');
      setCity(vendorToEdit.city || 'Kanchipuram');
      setGstin(vendorToEdit.gstin || '');
      setNotes(vendorToEdit.notes || '');
      setBankName(vendorToEdit.bankName || '');
      setAccountNumber(vendorToEdit.accountNumber || '');
      setIfscCode(vendorToEdit.ifscCode || '');
      setUpiId(vendorToEdit.upiId || '');
    } else {
      setName('');
      setContactPerson('');
      setCategory('Fabric Supplier');
      setPhone('');
      setEmail('');
      setCity('Kanchipuram');
      setGstin('');
      setNotes('');
      setBankName('');
      setAccountNumber('');
      setIfscCode('');
      setUpiId('');
    }
    setIfscError('');
    setUpiError('');
    setShowAccountNumber(false);
  }, [vendorToEdit, isOpen]);

  const validateIfsc = (val: string): boolean => {
    const trimmed = val.trim().toUpperCase();
    if (!trimmed) {
      setIfscError('');
      return true;
    }
    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(trimmed)) {
      setIfscError('Format: 4 letters, 0, 6 alphanumeric (e.g. SBIN0001234)');
      return false;
    }
    setIfscError('');
    return true;
  };

  const validateUpi = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setUpiError('');
      return true;
    }
    const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
    if (!upiRegex.test(trimmed)) {
      setUpiError('Format: username@bank (e.g. weaver@oksbi)');
      return false;
    }
    setUpiError('');
    return true;
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const isIfscValid = validateIfsc(ifscCode);
    const isUpiValid = validateUpi(upiId);

    if (!isIfscValid || !isUpiValid) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please resolve errors in Bank & Payment details',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        category,
        vendorType: category,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        city: city.trim(),
        gstin: gstin.trim() || undefined,
        notes: notes.trim() || undefined,
        bankName: bankName.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        ifscCode: ifscCode.trim() ? ifscCode.trim().toUpperCase() : undefined,
        upiId: upiId.trim() || undefined,
      };

      if (isEditing && vendorToEdit) {
        const updated = await supplierService.update(vendorToEdit.id, payload);
        showToast({
          type: 'success',
          title: 'Vendor Updated',
          message: `Saved details and bank profile for ${updated.name}`,
        });
        onVendorCreated?.(updated);
      } else {
        const created = await supplierService.create(payload);
        showToast({
          type: 'success',
          title: 'Vendor Added',
          message: `Registered ${created.name} with procurement master`,
        });
        onVendorCreated?.(created);
      }

      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || `Could not ${isEditing ? 'update' : 'register'} vendor`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? `Edit Weaver / Vendor: ${vendorToEdit?.name}` : 'Add New Weaver / Vendor'}
      subtitle={isEditing ? 'Update vendor details, contact info, and bank credentials' : 'Register an artisanal weaver, mill, or fabric supplier'}
      size="md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Basic Vendor Info */}
        <div>
          <label className="yz-label">Vendor / Weaver Guild Name *</label>
          <input
            type="text"
            className="yz-input"
            required
            autoFocus={!isEditing}
            placeholder="e.g. Arani Silk Weavers Cooperative"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label className="yz-label">Specialization / Type</label>
            <CustomDropdown
              value={category}
              onChange={(val) => setCategory(String(val))}
              options={[
                { value: 'Fabric Supplier', label: 'Fabric Supplier' },
                { value: 'Master Weaver', label: 'Master Weaver' },
                { value: 'Lace / Border Supplier', label: 'Lace / Border Supplier' },
                { value: 'Textile Mill', label: 'Textile Mill' },
                { value: 'Zari Artisan', label: 'Zari Artisan' },
              ]}
              minWidth="100%"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label className="yz-label">Contact Person</label>
            <input
              type="text"
              className="yz-input"
              placeholder="Master Weaver Shanmugam"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label className="yz-label">Phone Number</label>
            <input
              type="text"
              className="yz-input"
              placeholder="+91 94432 12345"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="yz-label">City / Town</label>
            <input
              type="text"
              className="yz-input"
              placeholder="Kanchipuram"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <div>
            <label className="yz-label">GSTIN</label>
            <input
              type="text"
              className="yz-input"
              placeholder="33AAAAA1234A1Z5"
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
            />
          </div>
          <div>
            <label className="yz-label">Email Address</label>
            <input
              type="email"
              className="yz-input"
              placeholder="vendor@guild.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* BANK & PAYMENT SECTION */}
        <div
          style={{
            borderTop: '1px solid var(--yz-border)',
            paddingTop: '10px',
            marginTop: '2px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--yz-primary, #832729)',
              letterSpacing: '0.04em',
              marginBottom: '8px',
              textTransform: 'uppercase',
            }}
          >
            <Landmark size={13} />
            <span>Bank & Payment Details</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <div>
              <label className="yz-label">Bank Name</label>
              <input
                type="text"
                className="yz-input"
                placeholder="e.g. State Bank of India / HDFC"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
            </div>
            <div>
              <label className="yz-label">Account Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showAccountNumber ? 'text' : 'password'}
                  className="yz-input"
                  placeholder="e.g. 50100234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value.replace(/\s+/g, ''))}
                  style={{ paddingRight: '30px', fontFamily: 'var(--yz-font-mono)' }}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setShowAccountNumber(!showAccountNumber)}
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--yz-text-muted)',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={showAccountNumber ? 'Hide account number' : 'Show account number'}
                >
                  {showAccountNumber ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label className="yz-label">IFSC Code</label>
              <input
                type="text"
                className="yz-input"
                placeholder="e.g. SBIN0001234"
                value={ifscCode}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setIfscCode(val);
                  validateIfsc(val);
                }}
                style={{
                  fontFamily: 'var(--yz-font-mono)',
                  borderColor: ifscError ? 'var(--yz-error, #DC2626)' : undefined,
                }}
                maxLength={11}
              />
              {ifscError && (
                <div style={{ fontSize: '10px', color: 'var(--yz-error, #DC2626)', marginTop: '2px' }}>
                  {ifscError}
                </div>
              )}
            </div>
            <div>
              <label className="yz-label">UPI ID</label>
              <input
                type="text"
                className="yz-input"
                placeholder="e.g. weaver@oksbi"
                value={upiId}
                onChange={(e) => {
                  setUpiId(e.target.value.trim());
                  validateUpi(e.target.value.trim());
                }}
                style={{
                  fontFamily: 'var(--yz-font-mono)',
                  borderColor: upiError ? 'var(--yz-error, #DC2626)' : undefined,
                }}
              />
              {upiError && (
                <div style={{ fontSize: '10px', color: 'var(--yz-error, #DC2626)', marginTop: '2px' }}>
                  {upiError}
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="yz-label">Notes & Looms Details</label>
          <textarea
            className="yz-input"
            rows={2}
            placeholder="e.g. Traditional pit looms, certified mulberry silk lot provider"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            style={{ height: 'auto', padding: '6px' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEditing ? 'Update Vendor' : 'Save Vendor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
