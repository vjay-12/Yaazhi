import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Eye, Loader2 } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { AddVendorModal } from './AddVendorModal';
import { supplierService, type VendorData } from '../../services/supplierService';
import { useToast } from '../../components/common/Toast';

export const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null);

  // Add Vendor Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onVendorCreated={() => loadVendors()}
      />
    </div>
  );
};
