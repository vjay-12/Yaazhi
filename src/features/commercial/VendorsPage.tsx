import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, Loader2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { supplierService, type VendorData } from '../../services/supplierService';
import { useToast } from '../../components/common/Toast';
import { CustomDropdown } from '../../components/common/CustomDropdown';

export const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null);

  // Add Vendor Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newCategory, setNewCategory] = useState('Fabric Supplier');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('Kanchipuram');
  const [newGstin, setNewGstin] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { showToast } = useToast();

  const loadVendors = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await supplierService.list(search);
      setVendors(data);
    } catch {
      showToast({ type: 'error', title: 'Load Error', message: 'Could not load boutique vendors' });
    } finally {
      setIsLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      setIsSubmitting(true);
      const created = await supplierService.create({
        name: newName.trim(),
        contactPerson: newContactPerson.trim() || undefined,
        category: newCategory,
        vendorType: newCategory,
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        city: newCity.trim(),
        gstin: newGstin.trim() || undefined,
        notes: newNotes.trim() || undefined,
      });

      showToast({
        type: 'success',
        title: 'Vendor Added',
        message: `Registered ${created.name} in procurement master`,
      });

      setIsAddModalOpen(false);
      setNewName('');
      setNewContactPerson('');
      setNewPhone('');
      setNewEmail('');
      setNewGstin('');
      setNewNotes('');
      loadVendors();
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Compact Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--yz-bg-surface)',
          padding: '8px 10px',
          borderRadius: 'var(--yz-radius-sm)',
          border: '1px solid var(--yz-border)',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', width: '260px' }}>
          <Search
            size={13}
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--yz-text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search weavers, craft guilds, or city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="yz-input"
            style={{ paddingLeft: '26px' }}
          />
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setIsAddModalOpen(true)}
        >
          Add Weaver / Vendor
        </Button>
      </div>

      {/* Clean Compact Single-Line Vendors Table */}
      <div className="yz-table-container">
        <table className="yz-table">
          <thead>
            <tr>
              <th>Weaver / Vendor Name</th>
              <th style={{ width: '150px' }}>Weave / Specialization</th>
              <th style={{ width: '130px' }}>Contact Person</th>
              <th style={{ width: '110px' }}>Phone</th>
              <th style={{ width: '110px' }}>City</th>
              <th style={{ width: '130px' }}>GSTIN</th>
              <th style={{ width: '70px', textAlign: 'center' }}>Active POs</th>
              <th style={{ width: '60px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading vendors from database...</span>
                  </div>
                </td>
              </tr>
            ) : vendors.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '24px', color: 'var(--yz-text-muted)' }}>
                  No vendors found matching search criteria.
                </td>
              </tr>
            ) : (
              vendors.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => setSelectedVendor(v)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view vendor details"
                >
                  <td style={{ fontWeight: 600 }}>
                    <div className="yz-cell-truncate" style={{ maxWidth: '200px' }}>
                      {v.name}
                    </div>
                  </td>
                  <td>
                    <div className="yz-cell-truncate" style={{ maxWidth: '140px' }}>
                      {v.category}
                    </div>
                  </td>
                  <td>{v.contactPerson || '-'}</td>
                  <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px' }}>
                    {v.phone || '-'}
                  </td>
                  <td>{v.city}</td>
                  <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px' }}>
                    {v.gstin || 'Unregistered'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span
                      style={{
                        padding: '1px 6px',
                        borderRadius: 'var(--yz-radius-sm)',
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: v.activeOrders > 0 ? '#E0F2FE' : 'var(--yz-bg-subtle)',
                        color: v.activeOrders > 0 ? '#0369A1' : 'var(--yz-text-muted)',
                      }}
                    >
                      {v.activeOrders}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="yz-btn yz-btn-secondary yz-btn-sm"
                      style={{ padding: '2px 5px', height: '22px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedVendor(v);
                      }}
                      title="View Vendor Card"
                    >
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Vendor Detail Modal */}
      {selectedVendor && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedVendor(null)}
          title={`Vendor Profile: ${selectedVendor.name}`}
          size="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                backgroundColor: 'var(--yz-bg-subtle)',
                padding: '8px 10px',
                borderRadius: 'var(--yz-radius-sm)',
                border: '1px solid var(--yz-border)',
              }}
            >
              <div>
                <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>CATEGORY</div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{selectedVendor.category}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>CONTACT PERSON</div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{selectedVendor.contactPerson || '-'}</div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>PHONE</div>
                <div style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                  {selectedVendor.phone || '-'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>CITY</div>
                <div style={{ fontSize: '12px', fontWeight: 600 }}>{selectedVendor.city}</div>
              </div>
            </div>

            <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>
                <span style={{ color: 'var(--yz-text-muted)' }}>GSTIN: </span>
                <span style={{ fontFamily: 'var(--yz-font-mono)' }}>{selectedVendor.gstin || 'Not registered'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--yz-text-muted)' }}>Payment Terms: </span>
                <span>{selectedVendor.paymentTerms}</span>
              </div>
              {selectedVendor.notes && (
                <div>
                  <span style={{ color: 'var(--yz-text-muted)' }}>Notes: </span>
                  <span style={{ fontStyle: 'italic' }}>{selectedVendor.notes}</span>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <Button variant="secondary" size="sm" onClick={() => setSelectedVendor(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Vendor Modal */}
      {isAddModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => !isSubmitting && setIsAddModalOpen(false)}
          title="Add New Weaver / Vendor"
          size="sm"
        >
          <form onSubmit={handleCreateVendor} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label className="yz-label">Vendor / Weaver Guild Name *</label>
              <input
                type="text"
                className="yz-input"
                required
                placeholder="e.g. Arani Silk Weavers Cooperative"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label className="yz-label">Specialization / Type</label>
                <CustomDropdown
                  value={newCategory}
                  onChange={(val) => setNewCategory(String(val))}
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
                  value={newContactPerson}
                  onChange={(e) => setNewContactPerson(e.target.value)}
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
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="yz-label">City / Town</label>
                <input
                  type="text"
                  className="yz-input"
                  placeholder="Kanchipuram"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
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
                  value={newGstin}
                  onChange={(e) => setNewGstin(e.target.value)}
                />
              </div>
              <div>
                <label className="yz-label">Email Address</label>
                <input
                  type="email"
                  className="yz-input"
                  placeholder="vendor@guild.in"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="yz-label">Notes & Looms Details</label>
              <textarea
                className="yz-input"
                rows={2}
                placeholder="e.g. Traditional pit looms, certified mulberry silk lot provider"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                style={{ height: 'auto', padding: '6px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsAddModalOpen(false)}
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
      )}
    </div>
  );
};
