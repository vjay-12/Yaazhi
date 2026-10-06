import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { supplierService, type VendorData } from '../../services/supplierService';
import { useToast } from '../../components/common/Toast';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVendorCreated?: (vendor: VendorData) => void;
}

export const AddVendorModal: React.FC<AddVendorModalProps> = ({
  isOpen,
  onClose,
  onVendorCreated,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [category, setCategory] = useState('Fabric Supplier');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Kanchipuram');
  const [gstin, setGstin] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName('');
    setContactPerson('');
    setCategory('Fabric Supplier');
    setPhone('');
    setEmail('');
    setCity('Kanchipuram');
    setGstin('');
    setNotes('');
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      const created = await supplierService.create({
        name: name.trim(),
        contactPerson: contactPerson.trim() || undefined,
        category,
        vendorType: category,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        city: city.trim(),
        gstin: gstin.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      showToast({
        type: 'success',
        title: 'Vendor Added',
        message: `Registered ${created.name} in procurement master`,
      });

      resetForm();
      onVendorCreated?.(created);
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Could not register vendor',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Weaver / Vendor"
      subtitle="Register an artisanal weaver, mill, or fabric supplier"
      size="sm"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div>
          <label className="yz-label">Vendor / Weaver Guild Name *</label>
          <input
            type="text"
            className="yz-input"
            required
            autoFocus
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
              onChange={(e) => setGstin(e.target.value)}
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
            {isSubmitting ? 'Saving...' : 'Save Vendor'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
