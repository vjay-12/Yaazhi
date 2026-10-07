import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  Loader2,
  Edit2,
  Archive,
  RotateCcw,
  Landmark,
  ChevronDown,
  Check,
  Eye,
  EyeOff,
  ShoppingBag,
  FileCheck2,
  Calendar,
  AlertTriangle,
  Receipt,
  Package,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { AddVendorModal } from './AddVendorModal';
import {
  supplierService,
  type VendorData,
  type VendorPOHistoryItem,
} from '../../services/supplierService';
import { useToast } from '../../components/common/Toast';

type VendorStatusFilter = 'ALL' | 'ACTIVE' | 'ARCHIVED';

const STATUS_FILTER_OPTIONS: { id: VendorStatusFilter; label: string }[] = [
  { id: 'ACTIVE', label: 'Active' },
  { id: 'ARCHIVED', label: 'Archived' },
  { id: 'ALL', label: 'All Vendors' },
];

export const VendorsPage: React.FC = () => {
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VendorStatusFilter>('ACTIVE');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);

  // Selected vendor for Vendor Profile / Detail Modal
  const [selectedVendor, setSelectedVendor] = useState<VendorData | null>(null);
  const [vendorDetailsLoading, setVendorDetailsLoading] = useState(false);
  const [fullVendorDetails, setFullVendorDetails] = useState<VendorData | null>(null);
  const [profileTab, setProfileTab] = useState<'po_history' | 'grn_history'>('po_history');
  const [showFullAccount, setShowFullAccount] = useState(false);

  // Nested PO Detail Modal from history
  const [activePoDetail, setActivePoDetail] = useState<VendorPOHistoryItem | null>(null);

  // Add / Edit Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [vendorToEdit, setVendorToEdit] = useState<VendorData | null>(null);

  // Archive & Restore confirmation states
  const [vendorToArchive, setVendorToArchive] = useState<VendorData | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [vendorToRestore, setVendorToRestore] = useState<VendorData | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const { showToast } = useToast();

  const loadVendors = useCallback(async () => {
    try {
      setIsLoading(true);
      const apiStatus =
        statusFilter === 'ALL' ? 'all' : statusFilter === 'ARCHIVED' ? 'archived' : 'active';
      const data = await supplierService.list(search, apiStatus);
      setVendors(data);
    } catch {
      showToast({ type: 'error', title: 'Load Error', message: 'Could not load boutique vendors' });
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter, showToast]);

  useEffect(() => {
    loadVendors();
  }, [loadVendors]);

  // Close status dropdown on click outside
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

  // Load detailed single vendor profile when selected
  useEffect(() => {
    if (!selectedVendor?.id) {
      setFullVendorDetails(null);
      return;
    }

    let isMounted = true;
    const fetchVendorDetail = async () => {
      try {
        setVendorDetailsLoading(true);
        const detailed = await supplierService.getById(selectedVendor.id);
        if (isMounted) {
          setFullVendorDetails(detailed);
        }
      } catch {
        if (isMounted) {
          setFullVendorDetails(selectedVendor);
        }
      } finally {
        if (isMounted) {
          setVendorDetailsLoading(false);
        }
      }
    };

    fetchVendorDetail();
    setShowFullAccount(false);
    setProfileTab('po_history');

    return () => {
      isMounted = false;
    };
  }, [selectedVendor]);

  // DATA -> SEARCH -> FILTER -> SORT -> PAGINATE
  // 1. Filtered by search (additional local matching for instant feel)
  const searchedVendors = useMemo(() => {
    if (!search.trim()) return vendors;
    const q = search.toLowerCase().trim();
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
        (v.city && v.city.toLowerCase().includes(q)) ||
        (v.category && v.category.toLowerCase().includes(q)) ||
        (v.gstin && v.gstin.toLowerCase().includes(q)) ||
        (v.bankName && v.bankName.toLowerCase().includes(q)) ||
        (v.upiId && v.upiId.toLowerCase().includes(q))
    );
  }, [vendors, search]);

  // 2. Filtered by status
  const statusFilteredVendors = useMemo(() => {
    if (statusFilter === 'ALL') return searchedVendors;
    if (statusFilter === 'ARCHIVED') return searchedVendors.filter((v) => v.isArchived);
    return searchedVendors.filter((v) => !v.isArchived);
  }, [searchedVendors, statusFilter]);

  // 3. Sorted by name
  const sortedVendors = useMemo(() => {
    return [...statusFilteredVendors].sort((a, b) => a.name.localeCompare(b.name));
  }, [statusFilteredVendors]);

  // 4. Shared Pagination
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination({
    items: sortedVendors,
    resetDependencies: [search, statusFilter],
  });

  // Archive confirmation handler
  const handleConfirmArchive = async () => {
    if (!vendorToArchive) return;
    try {
      setIsArchiving(true);
      await supplierService.archive(vendorToArchive.id);
      showToast({
        type: 'info',
        title: 'Vendor Archived',
        message: `${vendorToArchive.name} moved to archive. Historical POs and GRNs remain linked.`,
      });
      setVendorToArchive(null);
      if (selectedVendor?.id === vendorToArchive.id) {
        setSelectedVendor(null);
      }
      await loadVendors();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Archive Failed',
        message: err.message || 'Could not archive vendor',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  // Restore confirmation handler
  const handleConfirmRestore = async () => {
    if (!vendorToRestore) return;
    try {
      setIsRestoring(true);
      await supplierService.restore(vendorToRestore.id);
      showToast({
        type: 'success',
        title: 'Vendor Restored',
        message: `${vendorToRestore.name} restored to active vendors.`,
      });
      setVendorToRestore(null);
      if (selectedVendor?.id === vendorToRestore.id) {
        setSelectedVendor(null);
      }
      await loadVendors();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Restore Failed',
        message: err.message || 'Could not restore vendor',
      });
    } finally {
      setIsRestoring(false);
    }
  };

  // Format currency
  const formatCurrency = (val?: number) => {
    if (val === undefined || isNaN(val)) return '₹0.00';
    return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Format account number masking
  const formatMaskedAccount = (acc?: string, showFull = false) => {
    if (!acc) return 'Not provided';
    if (showFull) return acc;
    if (acc.length <= 4) return `•••• ${acc}`;
    const lastFour = acc.slice(-4);
    const maskedLength = Math.max(0, acc.length - 4);
    const maskedStars = '•'.repeat(Math.min(maskedLength, 8));
    return `${maskedStars} ${lastFour}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Top Toolbar: [Search] [Status Filter] ... [+ Add Weaver / Vendor] */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Search Input */}
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
              placeholder="Search weavers, craft guilds, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="yz-input"
              style={{ paddingLeft: '28px', height: '32px', fontSize: '11.5px' }}
            />
          </div>

          {/* Status Filter Dropdown */}
          <div style={{ position: 'relative' }} ref={statusDropdownRef}>
            <button
              type="button"
              className="yz-input"
              style={{
                height: '32px',
                padding: '0 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                backgroundColor: 'var(--yz-bg-surface)',
                borderColor: isStatusDropdownOpen ? 'var(--yz-primary, #832729)' : 'var(--yz-border)',
                borderRadius: 'var(--yz-radius-md)',
                minWidth: '130px',
                justifyContent: 'space-between',
                fontSize: '11.5px',
                userSelect: 'none',
              }}
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: 'var(--yz-text-muted)' }}>Status:</span>
                <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                  {STATUS_FILTER_OPTIONS.find((opt) => opt.id === statusFilter)?.label}
                </span>
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
                  zIndex: 50,
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--yz-border)',
                  borderRadius: 'var(--yz-radius-md)',
                  boxShadow: 'var(--yz-shadow-md)',
                  minWidth: '150px',
                  padding: '4px 0',
                }}
              >
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
                        width: '100%',
                        padding: '6px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        border: 'none',
                        background: isSelected ? 'var(--yz-bg-subtle, #F8FAFC)' : 'transparent',
                        color: isSelected ? 'var(--yz-primary, #832729)' : 'var(--yz-text-primary)',
                        fontSize: '11.5px',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#F1F5F9';
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

        {/* Add Vendor Button */}
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => {
            setVendorToEdit(null);
            setIsAddModalOpen(true);
          }}
        >
          Add Weaver / Vendor
        </Button>
      </div>

      {/* Clean Compact Vendors Table - Perfectly aligned, no horizontal scaling */}
      <div className="yz-table-container">
        <table className="yz-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ minWidth: statusFilter === 'ALL' ? '140px' : '170px', paddingLeft: '12px' }}>
                Weaver / Vendor Name
              </th>
              <th style={{ width: statusFilter === 'ALL' ? '110px' : '120px' }}>
                Weave / Specialization
              </th>
              <th style={{ width: statusFilter === 'ALL' ? '125px' : '135px' }}>
                Contact Person
              </th>
              <th style={{ width: '105px' }}>
                Phone
              </th>
              <th style={{ width: '80px' }}>
                City
              </th>
              <th style={{ width: '110px' }}>
                GSTIN
              </th>
              <th style={{ width: '75px', textAlign: 'center', padding: '5px 4px' }}>
                Active POs
              </th>
              {statusFilter === 'ALL' && (
                <th style={{ width: '65px', textAlign: 'center', padding: '5px 4px' }}>Status</th>
              )}
              <th style={{ width: '75px', textAlign: 'center', paddingRight: '12px', paddingLeft: '4px' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={statusFilter === 'ALL' ? 9 : 8} style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading vendors from database...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedItems.length === 0 ? (
              <tr>
                <td
                  colSpan={statusFilter === 'ALL' ? 9 : 8}
                  style={{ textAlign: 'center', padding: '24px', color: 'var(--yz-text-muted)' }}
                >
                  No vendors found matching criteria.
                </td>
              </tr>
            ) : (
              paginatedItems.map((v) => {
                const isArchived = Boolean(v.isArchived);
                return (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVendor(v)}
                    style={{
                      cursor: 'pointer',
                      opacity: isArchived ? 0.75 : 1,
                    }}
                    title="Click row to view vendor profile & purchase history"
                  >
                    {/* Weaver / Vendor Name */}
                    <td style={{ fontWeight: 600, paddingLeft: '12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                        <div
                          className="yz-cell-truncate"
                          style={{ maxWidth: statusFilter === 'ALL' ? '150px' : '205px' }}
                          title={v.name}
                        >
                          {v.name}
                        </div>
                        {v.isArchived && statusFilter === 'ALL' && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 700,
                              padding: '1px 4px',
                              borderRadius: '2px',
                              backgroundColor: 'var(--yz-alert-danger-bg, #FEE2E2)',
                              color: 'var(--yz-alert-danger-text, #991B1B)',
                              flexShrink: 0,
                            }}
                          >
                            ARCHIVED
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Weave / Specialization */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="yz-cell-truncate" style={{ maxWidth: '115px' }} title={v.category}>
                        {v.category}
                      </div>
                    </td>

                    {/* Contact Person */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="yz-cell-truncate" style={{ maxWidth: '130px' }} title={v.contactPerson || '-'}>
                        {v.contactPerson || '-'}
                      </div>
                    </td>

                    {/* Phone */}
                    <td
                      style={{
                        fontFamily: 'var(--yz-font-mono)',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                      }}
                      title={v.phone || '-'}
                    >
                      {v.phone || '-'}
                    </td>

                    {/* City */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div className="yz-cell-truncate" style={{ maxWidth: '75px' }} title={v.city}>
                        {v.city}
                      </div>
                    </td>

                    {/* GSTIN */}
                    <td
                      style={{
                        fontFamily: 'var(--yz-font-mono)',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                      }}
                      title={v.gstin || 'Unregistered'}
                    >
                      {v.gstin || 'Unregistered'}
                    </td>

                    {/* Active POs */}
                    <td style={{ textAlign: 'center', padding: '5px 4px', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          minWidth: '22px',
                          padding: '1px 7px',
                          borderRadius: 'var(--yz-radius-full)',
                          fontSize: '11px',
                          fontWeight: 600,
                          fontFamily: 'var(--yz-font-mono)',
                          backgroundColor: v.activeOrders > 0 ? 'var(--yz-alert-info-bg, #E0F2FE)' : 'var(--yz-bg-subtle)',
                          color: v.activeOrders > 0 ? 'var(--yz-alert-info-text, #0369A1)' : 'var(--yz-text-muted)',
                        }}
                      >
                        {v.activeOrders}
                      </span>
                    </td>

                    {/* Status badge if 'ALL' */}
                    {statusFilter === 'ALL' && (
                      <td style={{ textAlign: 'center', padding: '5px 4px', whiteSpace: 'nowrap' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: 'var(--yz-radius-full)',
                            fontSize: '10.5px',
                            fontWeight: 600,
                            backgroundColor: isArchived ? 'var(--yz-status-out-stock-bg, #FEE2E2)' : 'var(--yz-status-in-stock-bg, #DCFCE7)',
                            color: isArchived ? 'var(--yz-status-out-stock, #991B1B)' : 'var(--yz-status-in-stock, #166534)',
                          }}
                        >
                          {isArchived ? 'Archived' : 'Active'}
                        </span>
                      </td>
                    )}

                    {/* Actions: [Edit] [Archive] or [Restore] - Ghost icon buttons matching other components */}
                    <td style={{ textAlign: 'center', paddingRight: '12px', paddingLeft: '4px', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px',
                          width: '56px',
                          height: '26px',
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Edit Action */}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setVendorToEdit(v);
                            setIsAddModalOpen(true);
                          }}
                          title="Edit vendor details"
                        >
                          <Edit2 size={13} />
                        </button>

                        {/* Archive or Restore Action */}
                        {!isArchived ? (
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
                              setVendorToArchive(v);
                            }}
                            title="Archive vendor"
                          >
                            <Archive size={13} />
                          </button>
                        ) : (
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
                              color: '#166534',
                              flexShrink: 0,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setVendorToRestore(v);
                            }}
                            title="Restore vendor"
                          >
                            <RotateCcw size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Compact Shared Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          pageSizeOptions={[10, 20, 50, 100]}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="vendors"
        />
      </div>

      {/* ========================================================================= */}
      {/* VENDOR PROFILE & DETAIL MODAL                                              */}
      {/* ========================================================================= */}
      {selectedVendor && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedVendor(null)}
          title={`Vendor Profile: ${selectedVendor.name}`}
          subtitle={`Procurement master & financial profile · ${selectedVendor.category || selectedVendor.vendorType}`}
          size="lg"
        >
          {vendorDetailsLoading && !fullVendorDetails ? (
            <div style={{ textAlign: 'center', padding: '30px' }}>
              <Loader2 size={18} className="animate-spin" />
              <div style={{ fontSize: '11.5px', color: 'var(--yz-text-muted)', marginTop: '6px' }}>
                Loading vendor business profile...
              </div>
            </div>
          ) : (
            (() => {
              const vendor = fullVendorDetails || selectedVendor;
              const summary = vendor.summary || {
                totalPurchaseValue: vendor.totalPurchaseValue || 0,
                lastOrderDate: null,
                pendingPoCount: vendor.activeOrders || 0,
                pendingPoValue: 0,
                totalOrders: vendor.totalOrders || 0,
              };
              const poList = vendor.poHistory || [];
              const grnList = vendor.grnHistory || [];

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {/* Top Status Banner if Archived */}
                  {vendor.isArchived && (
                    <div
                      style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--yz-radius-md)',
                        backgroundColor: 'var(--yz-alert-danger-bg, #FEF2F2)',
                        border: '1px solid var(--yz-alert-danger-border, #FECACA)',
                        color: 'var(--yz-alert-danger-text, #991B1B)',
                        fontSize: '11.5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <AlertTriangle size={13} />
                      <span>This vendor is currently archived. Historical records remain fully accessible.</span>
                    </div>
                  )}

                  {/* 1. BASIC VENDOR PROFILE */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '8px',
                      backgroundColor: 'var(--yz-bg-subtle)',
                      padding: '12px 14px',
                      borderRadius: 'var(--yz-radius-md)',
                      border: '1px solid var(--yz-border)',
                      fontSize: '11.5px',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                        Category / Specialization
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--yz-text-primary)', marginTop: '2px' }}>
                        {vendor.category || vendor.vendorType}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                        Contact Person
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--yz-text-primary)', marginTop: '2px' }}>
                        {vendor.contactPerson || '-'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                        Phone
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 600,
                          fontFamily: 'var(--yz-font-mono)',
                          color: 'var(--yz-text-primary)',
                          marginTop: '2px',
                        }}
                      >
                        {vendor.phone || '-'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                        City & State
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--yz-text-primary)', marginTop: '2px' }}>
                        {vendor.city}, {vendor.state || 'Tamil Nadu'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                        GSTIN
                      </div>
                      <div
                        style={{
                          fontSize: '11.5px',
                          fontFamily: 'var(--yz-font-mono)',
                          color: 'var(--yz-text-primary)',
                          marginTop: '2px',
                        }}
                      >
                        {vendor.gstin || 'Unregistered'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                        Email
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--yz-text-primary)', marginTop: '2px' }}>
                        {vendor.email || '-'}
                      </div>
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                        Payment Terms
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
                        {vendor.paymentTerms || 'Net 30 Days (Direct Weavers Guild)'}
                      </div>
                    </div>
                  </div>

                  {/* 2. BANK & PAYMENT SECTION */}
                  <div
                    style={{
                      border: '1px solid var(--yz-border)',
                      borderRadius: 'var(--yz-radius-md)',
                      padding: '12px 14px',
                      backgroundColor: 'var(--yz-bg-surface)',
                      boxShadow: 'var(--yz-shadow-2xs)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                        borderBottom: '1px solid var(--yz-border-subtle, #F1F5F9)',
                        paddingBottom: '4px',
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
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        <Landmark size={13} />
                        <span>BANK & PAYMENT</span>
                      </div>
                      {vendor.accountNumber && (
                        <button
                          type="button"
                          onClick={() => setShowFullAccount(!showFullAccount)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: 'none',
                            border: 'none',
                            fontSize: '10.5px',
                            color: 'var(--yz-text-muted)',
                            cursor: 'pointer',
                            padding: '2px 4px',
                          }}
                          title={showFullAccount ? 'Mask account number' : 'Show full account number'}
                        >
                          {showFullAccount ? <EyeOff size={12} /> : <Eye size={12} />}
                          <span>{showFullAccount ? 'Hide Number' : 'Show Full Number'}</span>
                        </button>
                      )}
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '8px',
                        fontSize: '11.5px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                          Bank Name
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)', marginTop: '2px' }}>
                          {vendor.bankName || 'Not provided'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                          Account Number
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontFamily: 'var(--yz-font-mono)',
                            color: 'var(--yz-text-primary)',
                            marginTop: '2px',
                          }}
                        >
                          {formatMaskedAccount(vendor.accountNumber, showFullAccount)}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                          IFSC Code
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontFamily: 'var(--yz-font-mono)',
                            color: 'var(--yz-text-primary)',
                            marginTop: '2px',
                          }}
                        >
                          {vendor.ifscCode ? vendor.ifscCode.toUpperCase() : 'Not provided'}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
                          UPI ID
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontFamily: 'var(--yz-font-mono)',
                            color: 'var(--yz-text-primary)',
                            marginTop: '2px',
                          }}
                        >
                          {vendor.upiId || 'Not provided'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 3. PURCHASE SUMMARY */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                    }}
                  >
                    {/* Total Purchase Value */}
                    <div
                      style={{
                        backgroundColor: 'var(--yz-bg-surface)',
                        border: '1px solid var(--yz-border)',
                        borderRadius: 'var(--yz-radius-md)',
                        boxShadow: 'var(--yz-shadow-2xs)',
                        padding: '10px 12px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--yz-text-muted)',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <ShoppingBag size={11} style={{ color: 'var(--yz-primary, #832729)' }} />
                        <span>Total Purchase Value</span>
                      </div>
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 700,
                          color: 'var(--yz-text-primary)',
                          fontFamily: 'var(--yz-font-mono)',
                          marginTop: '3px',
                        }}
                      >
                        {formatCurrency(summary.totalPurchaseValue)}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', marginTop: '1px' }}>
                        From {summary.totalOrders} total purchase order(s)
                      </div>
                    </div>

                    {/* Last Order Date */}
                    <div
                      style={{
                        backgroundColor: 'var(--yz-bg-surface)',
                        border: '1px solid var(--yz-border)',
                        borderRadius: 'var(--yz-radius-md)',
                        boxShadow: 'var(--yz-shadow-2xs)',
                        padding: '10px 12px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--yz-text-muted)',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Calendar size={11} style={{ color: '#0284C7' }} />
                        <span>Last Order</span>
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: 'var(--yz-text-primary)',
                          fontFamily: 'var(--yz-font-mono)',
                          marginTop: '3px',
                        }}
                      >
                        {summary.lastOrderDate || 'No orders placed'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', marginTop: '1px' }}>
                        Most recent PO date
                      </div>
                    </div>

                    {/* Pending POs */}
                    <div
                      style={{
                        backgroundColor: 'var(--yz-bg-surface)',
                        border: '1px solid var(--yz-border)',
                        borderRadius: 'var(--yz-radius-md)',
                        boxShadow: 'var(--yz-shadow-2xs)',
                        padding: '10px 12px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '10px',
                          color: 'var(--yz-text-muted)',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Receipt size={11} style={{ color: '#D97706' }} />
                        <span>Pending POs</span>
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: summary.pendingPoCount > 0 ? '#B45309' : 'var(--yz-text-primary)',
                          fontFamily: 'var(--yz-font-mono)',
                          marginTop: '3px',
                        }}
                      >
                        {summary.pendingPoCount} order{summary.pendingPoCount === 1 ? '' : 's'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', marginTop: '1px' }}>
                        Pending value: {formatCurrency(summary.pendingPoValue)}
                      </div>
                    </div>
                  </div>

                  {/* 4. PURCHASE HISTORY (PO History & GRN / Receipt History) */}
                  <div
                    style={{
                      border: '1px solid var(--yz-border)',
                      borderRadius: 'var(--yz-radius-md)',
                      backgroundColor: 'var(--yz-bg-surface)',
                      overflow: 'hidden',
                      boxShadow: 'var(--yz-shadow-2xs)',
                    }}
                  >
                    {/* Navigation Tabs */}
                    <div
                      style={{
                        display: 'flex',
                        borderBottom: '1px solid var(--yz-border)',
                        backgroundColor: 'var(--yz-bg-subtle)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setProfileTab('po_history')}
                        style={{
                          padding: '8px 14px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: 'none',
                          borderBottom:
                            profileTab === 'po_history'
                              ? '2px solid var(--yz-primary, #832729)'
                              : '2px solid transparent',
                          background: profileTab === 'po_history' ? 'var(--yz-bg-surface)' : 'transparent',
                          color:
                            profileTab === 'po_history'
                              ? 'var(--yz-primary, #832729)'
                              : 'var(--yz-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <ShoppingBag size={12} />
                        <span>PO History</span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--yz-bg-subtle)',
                            color: 'var(--yz-text-muted)',
                            border: '1px solid var(--yz-border)',
                          }}
                        >
                          {poList.length}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setProfileTab('grn_history')}
                        style={{
                          padding: '8px 14px',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          border: 'none',
                          borderBottom:
                            profileTab === 'grn_history'
                              ? '2px solid var(--yz-primary, #832729)'
                              : '2px solid transparent',
                          background: profileTab === 'grn_history' ? 'var(--yz-bg-surface)' : 'transparent',
                          color:
                            profileTab === 'grn_history'
                              ? 'var(--yz-primary, #832729)'
                              : 'var(--yz-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        <FileCheck2 size={12} />
                        <span>GRN / Receipt History</span>
                        <span
                          style={{
                            fontSize: '10px',
                            padding: '1px 5px',
                            borderRadius: '10px',
                            backgroundColor: 'var(--yz-bg-subtle)',
                            color: 'var(--yz-text-muted)',
                            border: '1px solid var(--yz-border)',
                          }}
                        >
                          {grnList.length}
                        </span>
                      </button>
                    </div>

                    {/* Tab Content: PO History */}
                    {profileTab === 'po_history' && (
                      <div className="yz-table-container" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        <table className="yz-table">
                          <thead>
                            <tr>
                              <th style={{ width: '130px' }}>PO Number</th>
                              <th style={{ width: '95px' }}>Date</th>
                              <th style={{ width: '75px', textAlign: 'center' }}>Items</th>
                              <th style={{ width: '110px', textAlign: 'right' }}>Total Amount</th>
                              <th style={{ width: '100px', textAlign: 'center' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {poList.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={5}
                                  style={{
                                    textAlign: 'center',
                                    padding: '20px',
                                    color: 'var(--yz-text-muted)',
                                    fontSize: '11.5px',
                                  }}
                                >
                                  No purchase orders found for this vendor.
                                </td>
                              </tr>
                            ) : (
                              poList.map((po) => (
                                <tr
                                  key={po.id}
                                  onClick={() => setActivePoDetail(po)}
                                  style={{ cursor: 'pointer' }}
                                  title="Click to view full purchase order detail"
                                >
                                  <td
                                    style={{
                                      fontFamily: 'var(--yz-font-mono)',
                                      fontWeight: 600,
                                      color: 'var(--yz-primary, #832729)',
                                    }}
                                  >
                                    {po.poNumber}
                                  </td>
                                  <td
                                    style={{
                                      fontFamily: 'var(--yz-font-mono)',
                                      fontSize: '11px',
                                      color: 'var(--yz-text-secondary)',
                                    }}
                                  >
                                    {po.date}
                                  </td>
                                  <td style={{ textAlign: 'center', fontSize: '11px' }}>
                                    {po.itemsCount}
                                  </td>
                                  <td
                                    style={{
                                      textAlign: 'right',
                                      fontWeight: 600,
                                      fontFamily: 'var(--yz-font-mono)',
                                    }}
                                  >
                                    {formatCurrency(po.totalAmount)}
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span
                                      style={{
                                        display: 'inline-block',
                                        padding: '2px 8px',
                                        borderRadius: 'var(--yz-radius-full)',
                                        fontSize: '10.5px',
                                        fontWeight: 600,
                                        backgroundColor:
                                          po.status === 'RECEIVED'
                                            ? 'var(--yz-status-in-stock-bg, #DCFCE7)'
                                            : po.status === 'ORDERED'
                                            ? 'var(--yz-status-low-stock-bg, #FEF3C7)'
                                            : 'var(--yz-status-out-stock-bg, #FEE2E2)',
                                        color:
                                          po.status === 'RECEIVED'
                                            ? 'var(--yz-status-in-stock, #166534)'
                                            : po.status === 'ORDERED'
                                            ? 'var(--yz-status-low-stock, #92400E)'
                                            : 'var(--yz-status-out-stock, #991B1B)',
                                        border:
                                          po.status === 'RECEIVED'
                                            ? '1px solid var(--yz-status-in-stock-border, #BBF7D0)'
                                            : po.status === 'ORDERED'
                                            ? '1px solid var(--yz-status-low-stock-border, #FDE68A)'
                                            : '1px solid var(--yz-status-out-stock-border, #FECACA)',
                                      }}
                                    >
                                      {po.status === 'RECEIVED'
                                        ? 'Received'
                                        : po.status === 'ORDERED'
                                        ? 'Ordered'
                                        : 'Cancelled'}
                                    </span>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Tab Content: GRN / Receipt History */}
                    {profileTab === 'grn_history' && (
                      <div className="yz-table-container" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                        <table className="yz-table">
                          <thead>
                            <tr>
                              <th style={{ width: '130px' }}>GRN / Receipt #</th>
                              <th style={{ width: '130px' }}>PO Reference</th>
                              <th style={{ width: '95px' }}>Receipt Date</th>
                              <th style={{ width: '75px', textAlign: 'center' }}>Qty Recvd</th>
                              <th style={{ width: '110px', textAlign: 'right' }}>Amount / Value</th>
                              <th style={{ width: '90px', textAlign: 'center' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grnList.length === 0 ? (
                              <tr>
                                <td
                                  colSpan={6}
                                  style={{
                                    textAlign: 'center',
                                    padding: '20px',
                                    color: 'var(--yz-text-muted)',
                                    fontSize: '11.5px',
                                  }}
                                >
                                  No goods receipts recorded yet. Received purchase orders appear here.
                                </td>
                              </tr>
                            ) : (
                              grnList.map((grn) => {
                                const matchingPo = poList.find((p) => p.id === grn.poId);
                                return (
                                  <tr
                                    key={grn.id}
                                    onClick={() => matchingPo && setActivePoDetail(matchingPo)}
                                    style={{ cursor: matchingPo ? 'pointer' : 'default' }}
                                    title={matchingPo ? 'Click to inspect PO items' : undefined}
                                  >
                                    <td
                                      style={{
                                        fontFamily: 'var(--yz-font-mono)',
                                        fontWeight: 600,
                                        color: '#0369A1',
                                      }}
                                    >
                                      {grn.grnNumber}
                                    </td>
                                    <td
                                      style={{
                                        fontFamily: 'var(--yz-font-mono)',
                                        fontWeight: 500,
                                        color: 'var(--yz-primary, #832729)',
                                      }}
                                    >
                                      {grn.poNumber}
                                    </td>
                                    <td
                                      style={{
                                        fontFamily: 'var(--yz-font-mono)',
                                        fontSize: '11px',
                                        color: 'var(--yz-text-secondary)',
                                      }}
                                    >
                                      {grn.date}
                                    </td>
                                    <td style={{ textAlign: 'center', fontSize: '11px' }}>
                                      {grn.itemsCount}
                                    </td>
                                    <td
                                      style={{
                                        textAlign: 'right',
                                        fontWeight: 600,
                                        fontFamily: 'var(--yz-font-mono)',
                                      }}
                                    >
                                      {formatCurrency(grn.amount)}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span
                                        style={{
                                          display: 'inline-block',
                                          padding: '2px 8px',
                                          borderRadius: 'var(--yz-radius-full)',
                                          fontSize: '10.5px',
                                          fontWeight: 600,
                                          backgroundColor: 'var(--yz-status-in-stock-bg, #DCFCE7)',
                                          color: 'var(--yz-status-in-stock, #166534)',
                                        }}
                                      >
                                        RECEIVED
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      marginTop: '4px',
                    }}
                  >
                    <Button variant="secondary" size="sm" onClick={() => setSelectedVendor(null)}>
                      Close
                    </Button>
                  </div>
                </div>
              );
            })()
          )}
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* PO DETAIL MODAL (Opened from PO History or GRN History click)               */}
      {/* ========================================================================= */}
      {activePoDetail && (
        <Modal
          isOpen={true}
          onClose={() => setActivePoDetail(null)}
          title={`Purchase Order: ${activePoDetail.poNumber}`}
          subtitle={`Ordered on ${activePoDetail.date} · Destination: ${activePoDetail.location}`}
          size="md"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                backgroundColor: 'var(--yz-bg-subtle)',
                padding: '10px 12px',
                borderRadius: 'var(--yz-radius-md)',
                border: '1px solid var(--yz-border)',
                fontSize: '11px',
              }}
            >
              <div>
                <span style={{ color: 'var(--yz-text-muted)' }}>Status: </span>
                <strong style={{ color: activePoDetail.status === 'RECEIVED' ? 'var(--yz-status-in-stock, #166534)' : 'var(--yz-status-low-stock, #92400E)' }}>
                  {activePoDetail.status}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--yz-text-muted)' }}>Order Date: </span>
                <span style={{ fontFamily: 'var(--yz-font-mono)' }}>{activePoDetail.date}</span>
              </div>
              <div>
                <span style={{ color: 'var(--yz-text-muted)' }}>Total Amount: </span>
                <strong style={{ fontFamily: 'var(--yz-font-mono)' }}>
                  {formatCurrency(activePoDetail.totalAmount)}
                </strong>
              </div>
            </div>

            {/* Line items table */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--yz-text-secondary)',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Package size={12} />
                <span>Procured Line Items</span>
              </div>
              <div className="yz-table-container">
                <table className="yz-table">
                  <thead>
                    <tr>
                      <th>Product Description</th>
                      <th style={{ width: '100px' }}>SKU</th>
                      <th style={{ width: '50px', textAlign: 'center' }}>Qty</th>
                      <th style={{ width: '90px', textAlign: 'right' }}>Unit Cost</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePoDetail.items.map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500 }}>{it.productName}</td>
                        <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px', color: 'var(--yz-text-secondary)' }}>
                          {it.sku}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)' }}>
                          {it.quantity}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--yz-font-mono)' }}>
                          {formatCurrency(it.unitCost)}
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                          {formatCurrency(it.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
              <Button variant="secondary" size="sm" onClick={() => setActivePoDetail(null)}>
                Back to Vendor Profile
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* ARCHIVE CONFIRMATION DIALOG                                               */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={Boolean(vendorToArchive)}
        onClose={() => !isArchiving && setVendorToArchive(null)}
        onConfirm={handleConfirmArchive}
        title="Archive Vendor"
        description={
          vendorToArchive ? (
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--yz-text-primary)' }}>
                Are you sure you want to archive <strong>{vendorToArchive.name}</strong>?
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--yz-text-secondary)', lineHeight: 1.45 }}>
                This vendor will be hidden from the default active procurement list. All existing Purchase Orders,
                Goods Receipt Notes (GRNs), transactions, and inventory references remain permanently linked and intact.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Archive Vendor"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isArchiving}
      />

      {/* ========================================================================= */}
      {/* RESTORE CONFIRMATION DIALOG                                               */}
      {/* ========================================================================= */}
      <ConfirmDialog
        isOpen={Boolean(vendorToRestore)}
        onClose={() => !isRestoring && setVendorToRestore(null)}
        onConfirm={handleConfirmRestore}
        title="Restore Vendor"
        description={
          vendorToRestore ? (
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--yz-text-primary)' }}>
                Are you sure you want to restore <strong>{vendorToRestore.name}</strong>?
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--yz-text-secondary)', lineHeight: 1.45 }}>
                This vendor will be returned to the active vendor directory and available for new Purchase Orders and regular procurement.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Restore Vendor"
        cancelLabel="Cancel"
        variant="primary"
        isLoading={isRestoring}
      />

      {/* ========================================================================= */}
      {/* ADD / EDIT VENDOR MODAL                                                   */}
      {/* ========================================================================= */}
      <AddVendorModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setVendorToEdit(null);
        }}
        vendorToEdit={vendorToEdit}
        onVendorCreated={async () => {
          await loadVendors();
          if (selectedVendor && vendorToEdit && selectedVendor.id === vendorToEdit.id) {
            // refresh active profile view
            const updated = await supplierService.getById(selectedVendor.id);
            setSelectedVendor(updated);
            setFullVendorDetails(updated);
          }
        }}
      />
    </div>
  );
};
