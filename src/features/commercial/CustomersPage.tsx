import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Scissors,
  Loader2,
  SlidersHorizontal,
  Edit,
  Trash2,
  Archive,
  RotateCcw,
  ChevronDown,
  Check,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { customerService, type CustomerData } from '../../services/customerService';
import { useToast } from '../../components/common/Toast';
import { AddCustomerModal } from './AddCustomerModal';
import { TemplateManagerModal } from './TemplateManagerModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';

type CustomerStatusFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED';

const STATUS_FILTER_OPTIONS: { id: CustomerStatusFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'ACTIVE', label: 'Active' },
  { id: 'ARCHIVED', label: 'Archived' },
];

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>('ACTIVE');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Modals state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<CustomerData | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  // Archive, Restore & Permanent Delete confirmation states
  const [customerToArchive, setCustomerToArchive] = useState<CustomerData | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [customerToRestore, setCustomerToRestore] = useState<CustomerData | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [customerToDeletePermanently, setCustomerToDeletePermanently] = useState<CustomerData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const loadCustomers = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiStatus =
        statusFilter === 'ACTIVE'
          ? 'active'
          : statusFilter === 'ARCHIVED'
          ? 'archived'
          : 'all';
      const data = await customerService.list(search, apiStatus);
      setCustomers(data);
    } catch {
      showToast({ type: 'error', title: 'Load Error', message: 'Could not load boutique customers' });
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, showToast]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  // Close custom dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    if (isStatusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  // Archive action
  const handleConfirmArchive = async () => {
    if (!customerToArchive) return;
    try {
      setIsArchiving(true);
      await customerService.archive(customerToArchive.id);
      showToast({
        type: 'info',
        title: 'Customer Archived',
        message: `${customerToArchive.name} moved to archive. All history, orders, and measurements preserved.`,
      });
      setCustomerToArchive(null);
      await loadCustomers();
      if (selectedCustomer?.id === customerToArchive.id) {
        setSelectedCustomer((prev) => (prev ? { ...prev, isArchived: true } : null));
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Archive Failed',
        message: err.message || 'Could not archive customer',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  // Restore action
  const handleConfirmRestore = async () => {
    if (!customerToRestore) return;
    try {
      setIsRestoring(true);
      await customerService.unarchive(customerToRestore.id);
      showToast({
        type: 'success',
        title: 'Customer Restored',
        message: `${customerToRestore.name} restored to active directory.`,
      });
      setCustomerToRestore(null);
      await loadCustomers();
      if (selectedCustomer?.id === customerToRestore.id) {
        setSelectedCustomer((prev) => (prev ? { ...prev, isArchived: false } : null));
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Restore Failed',
        message: err.message || 'Could not restore customer',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Permanent Delete action
  const handleConfirmPermanentDelete = async () => {
    if (!customerToDeletePermanently) return;
    try {
      setIsDeleting(true);
      await customerService.delete(customerToDeletePermanently.id);
      showToast({
        type: 'info',
        title: 'Customer Deleted',
        message: `Permanently removed ${customerToDeletePermanently.name}`,
      });
      if (selectedCustomer?.id === customerToDeletePermanently.id) {
        setSelectedCustomer(null);
      }
      setCustomerToDeletePermanently(null);
      await loadCustomers();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete customer',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleOpenEdit = (c: CustomerData, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCustomerToEdit(c);
    setIsAddModalOpen(true);
  };

  // Filter customers by status
  const filtered = customers.filter((c) => {
    if (statusFilter === 'ACTIVE' && c.isArchived) return false;
    if (statusFilter === 'ARCHIVED' && !c.isArchived) return false;
    return true;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination({
    items: filtered,
    resetDependencies: [search, statusFilter],
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Compact Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--yz-bg-surface)',
          padding: '8px 12px',
          borderRadius: 'var(--yz-radius-md)',
          border: '1px solid var(--yz-border)',
          boxShadow: 'var(--yz-shadow-2xs)',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Search Input & Status Filter Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '270px' }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--yz-text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search customers by name, phone, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="yz-input"
              style={{ paddingLeft: '28px', height: '32px', fontSize: '11.5px', width: '100%' }}
            />
          </div>

          {/* Status Filter Dropdown */}
          <div style={{ position: 'relative' }} ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="yz-input"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                height: '32px',
                padding: '0 10px',
                fontSize: '11.5px',
                cursor: 'pointer',
                backgroundColor: 'var(--yz-bg-surface)',
                border: '1px solid var(--yz-border)',
                borderRadius: 'var(--yz-radius-md)',
                color: 'var(--yz-text-primary)',
                minWidth: '115px',
                userSelect: 'none',
              }}
            >
              <span>
                <span style={{ color: 'var(--yz-text-muted)', marginRight: '4px' }}>Lifecycle:</span>
                <strong>{STATUS_FILTER_OPTIONS.find((s) => s.id === statusFilter)?.label || 'Active'}</strong>
              </span>
              <ChevronDown
                size={13}
                style={{
                  color: 'var(--yz-text-muted)',
                  transform: isStatusDropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>

            {isStatusDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  left: 0,
                  backgroundColor: 'var(--yz-bg-surface)',
                  border: '1px solid var(--yz-border)',
                  borderRadius: 'var(--yz-radius-md)',
                  boxShadow: 'var(--yz-shadow-md)',
                  zIndex: 50,
                  minWidth: '125px',
                  padding: '4px 0',
                }}
              >
                <div
                  style={{
                    padding: '4px 10px 3px 10px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--yz-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  Lifecycle Status
                </div>
                <div style={{ height: '1px', backgroundColor: 'var(--yz-border)', margin: '2px 0 4px 0' }} />
                {STATUS_FILTER_OPTIONS.map((opt) => {
                  const isSelected = statusFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.id);
                        setIsStatusDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '5px 10px',
                        fontSize: '11px',
                        border: 'none',
                        background: isSelected ? 'var(--yz-primary-50, #FDF2F2)' : 'transparent',
                        color: isSelected ? 'var(--yz-primary, #832729)' : 'var(--yz-text-primary)',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--yz-bg-subtle, #F1F5F9)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span
                        style={{
                          width: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected ? <Check size={12} style={{ color: 'var(--yz-primary, #832729)' }} /> : null}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<SlidersHorizontal size={13} />}
            onClick={() => setIsTemplateModalOpen(true)}
            style={{ height: '32px', fontSize: '11.5px', fontWeight: 600 }}
            title="Manage garment templates and measurement parameters"
          >
            Measurement Templates
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setCustomerToEdit(null);
              setIsAddModalOpen(true);
            }}
            style={{ height: '32px', fontSize: '11.5px', fontWeight: 600 }}
          >
            + Add Customer
          </Button>
        </div>
      </div>

      {/* Clean Compact Customers Table */}
      <div className="yz-table-container">
        <table className="yz-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ minWidth: '180px', paddingLeft: '12px' }}>CUSTOMER</th>
              <th style={{ width: '135px' }}>PHONE</th>
              <th style={{ width: '140px' }}>CITY/LOCATION</th>
              <th style={{ width: '75px', textAlign: 'center' }}>VISITS</th>
              <th style={{ width: '120px', textAlign: 'right' }}>TOTAL SPEND</th>
              <th style={{ minWidth: '220px' }}>TAILORING / MEASUREMENT PROFILE</th>
              <th style={{ width: '85px', textAlign: 'center', paddingRight: '12px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading customers from database...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--yz-text-muted)' }}>
                  {statusFilter === 'ARCHIVED'
                    ? 'No archived customers found.'
                    : 'No customers found matching search criteria.'}
                </td>
              </tr>
            ) : (
              paginatedItems.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  style={{ cursor: 'pointer' }}
                  title="Click customer row to view measurements & orders history"
                >
                  <td style={{ fontWeight: 600, paddingLeft: '12px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div className="yz-cell-truncate" style={{ maxWidth: '200px' }} title={c.name}>
                        {c.name}
                      </div>
                      {c.isArchived && (
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 'var(--yz-radius-full)',
                            backgroundColor: 'var(--yz-bg-subtle, #F1F5F9)',
                            color: 'var(--yz-text-muted, #64748B)',
                            border: '1px solid var(--yz-border-strong, #CBD5E1)',
                            lineHeight: 1.2,
                            flexShrink: 0,
                          }}
                        >
                          ARCHIVED
                        </span>
                      )}
                    </div>
                  </td>

                  <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px', whiteSpace: 'nowrap' }}>
                    {c.phone || '—'}
                  </td>

                  <td style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', whiteSpace: 'nowrap' }}>
                    <div className="yz-cell-truncate" style={{ maxWidth: '135px' }} title={c.city || 'Chennai'}>
                      {c.city || 'Chennai'}
                    </div>
                  </td>

                  <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                    {c.visitsCount}
                  </td>

                  <td
                    style={{
                      textAlign: 'right',
                      fontWeight: 600,
                      fontFamily: 'var(--yz-font-mono)',
                      whiteSpace: 'nowrap',
                    }}
                    className="tabular-nums"
                  >
                    ₹{c.totalSpend.toLocaleString('en-IN')}
                  </td>

                  <td style={{ whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10.5px',
                        color: 'var(--yz-primary, #832729)',
                        backgroundColor: 'var(--yz-primary-subtle, #FEF2F2)',
                        border: '1px solid var(--yz-primary-border, #FECACA)',
                        padding: '2px 8px',
                        borderRadius: 'var(--yz-radius-full)',
                        maxWidth: '220px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontWeight: 600,
                      }}
                      title={c.fittingProfile}
                    >
                      <Scissors size={10} style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.fittingProfile}
                      </span>
                    </span>
                  </td>

                  {/* ACTION COLUMN: Edit & Archive for active; Restore & Delete for archived */}
                  <td style={{ textAlign: 'center', paddingRight: '12px', whiteSpace: 'nowrap' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        width: '60px',
                        height: '26px',
                      }}
                    >
                      {!c.isArchived ? (
                        <>
                          <button
                            type="button"
                            className="yz-btn yz-btn-ghost yz-btn-sm"
                            style={{
                              width: '26px',
                              height: '26px',
                              padding: 0,
                              borderRadius: 'var(--yz-radius-sm)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--yz-text-secondary)',
                              flexShrink: 0,
                            }}
                            onClick={(e) => handleOpenEdit(c, e)}
                            title="Edit customer details"
                          >
                            <Edit size={12} />
                          </button>

                          <button
                            type="button"
                            className="yz-btn yz-btn-ghost yz-btn-sm"
                            style={{
                              width: '26px',
                              height: '26px',
                              padding: 0,
                              borderRadius: 'var(--yz-radius-sm)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--yz-text-muted, #64748B)',
                              flexShrink: 0,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomerToArchive(c);
                            }}
                            title="Archive customer"
                          >
                            <Archive size={12} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="yz-btn yz-btn-ghost yz-btn-sm"
                            style={{
                              width: '26px',
                              height: '26px',
                              padding: 0,
                              borderRadius: 'var(--yz-radius-sm)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--yz-status-in-stock, #166534)',
                              flexShrink: 0,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomerToRestore(c);
                            }}
                            title="Restore customer to active directory"
                          >
                            <RotateCcw size={12} />
                          </button>

                          <button
                            type="button"
                            className="yz-btn yz-btn-ghost yz-btn-sm"
                            style={{
                              width: '24px',
                              height: '22px',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--yz-error, #DC2626)',
                              flexShrink: 0,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomerToDeletePermanently(c);
                            }}
                            title="Permanently delete customer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Compact Shared Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="customers"
        />
      </div>

      {/* Customer Details Modal (Opened when clicking entire row) */}
      {selectedCustomer && (
        <CustomerDetailModal
          isOpen={Boolean(selectedCustomer)}
          onClose={() => setSelectedCustomer(null)}
          customer={selectedCustomer}
          onEditCustomer={(c) => {
            setSelectedCustomer(null);
            handleOpenEdit(c);
          }}
          onCustomerUpdated={loadCustomers}
        />
      )}

      {/* Add / Edit Customer Modal */}
      {isAddModalOpen && (
        <AddCustomerModal
          isOpen={isAddModalOpen}
          onClose={() => {
            setIsAddModalOpen(false);
            setCustomerToEdit(null);
          }}
          customerToEdit={customerToEdit}
          onCustomerSaved={loadCustomers}
        />
      )}

      {/* Measurement Templates Manager Modal */}
      {isTemplateModalOpen && (
        <TemplateManagerModal
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          onTemplatesUpdated={loadCustomers}
        />
      )}

      {/* Archive Customer Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(customerToArchive)}
        onClose={() => !isArchiving && setCustomerToArchive(null)}
        onConfirm={handleConfirmArchive}
        title="Archive Customer"
        description={
          customerToArchive ? (
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--yz-text-primary)' }}>
                Are you sure you want to archive <strong>{customerToArchive.name}</strong>?
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--yz-text-secondary)', lineHeight: 1.45 }}>
                The customer will be moved to the <strong>Archived</strong> tab. Their entire profile, tailoring
                measurement profiles, sales orders, payments, and notes will be safely preserved and never deleted.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Archive Customer"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isArchiving}
      />

      {/* Restore Customer Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(customerToRestore)}
        onClose={() => !isRestoring && setCustomerToRestore(null)}
        onConfirm={handleConfirmRestore}
        title="Restore Customer"
        description={
          customerToRestore ? (
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--yz-text-primary)' }}>
                Are you sure you want to restore <strong>{customerToRestore.name}</strong> to the active customer list?
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--yz-text-secondary)', lineHeight: 1.45 }}>
                This customer will reappear in the active customer directory and be available for new sales orders and fitting appointments.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Restore Customer"
        cancelLabel="Cancel"
        variant="primary"
        isLoading={isRestoring}
      />

      {/* Permanent Delete Customer Confirmation Dialog (Archived customers only) */}
      <ConfirmDialog
        isOpen={Boolean(customerToDeletePermanently)}
        onClose={() => !isDeleting && setCustomerToDeletePermanently(null)}
        onConfirm={handleConfirmPermanentDelete}
        title="Permanently Delete Customer"
        description={
          customerToDeletePermanently ? (
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--yz-text-primary)' }}>
                Are you sure you want to permanently delete <strong>{customerToDeletePermanently.name}</strong>?
              </p>
              <p style={{ margin: '8px 0 0', color: 'var(--yz-error, #DC2626)', fontSize: '11.5px', lineHeight: 1.45, fontWeight: 500 }}>
                This action cannot be undone. All tailoring measurements associated with this customer will be removed. Past invoices and sales orders will retain customer records for accounting compliance.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Delete Permanently"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};
