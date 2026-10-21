import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import {
  customerService,
  type CustomerData,
  type CustomerDetailData,
  type CustomerMeasurementProfile,
} from '../../services/customerService';
import { useToast } from '../../components/common/Toast';
import {
  SlidersHorizontal,
  FileText,
  User,
  Plus,
  Clock,
  Edit,
  Copy,
  Loader2,
  Trash2,
  Archive,
  RotateCcw,
  Printer,
  Search,
} from 'lucide-react';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { AddMeasurementModal } from './AddMeasurementModal';
import { MeasurementHistoryModal } from './MeasurementHistoryModal';
import { PrintTailorSheetModal } from './PrintTailorSheetModal';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: CustomerData | null;
  onEditCustomer?: (customer: CustomerData) => void;
  onCustomerUpdated?: () => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEditCustomer,
  onCustomerUpdated,
}) => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'measurements' | 'orders' | 'profile'>('measurements');
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(customer);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetailData | null>(null);
  const [profiles, setProfiles] = useState<CustomerMeasurementProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sub-modal states
  const [isAddMeasurementOpen, setIsAddMeasurementOpen] = useState(false);
  const [measurementModalMode, setMeasurementModalMode] = useState<'new_profile' | 'new_version' | 'edit_profile'>('new_profile');
  const [profileForNewVersion, setProfileForNewVersion] = useState<CustomerMeasurementProfile | null>(null);
  const [profileForHistory, setProfileForHistory] = useState<CustomerMeasurementProfile | null>(null);
  const [profileToPrint, setProfileToPrint] = useState<CustomerMeasurementProfile | null>(null);
  const [isCloningId, setIsCloningId] = useState<string | null>(null);

  // Measurement filtering & search
  const [selectedGarmentFilter, setSelectedGarmentFilter] = useState<string>('ALL');
  const [measurementSearchQuery, setMeasurementSearchQuery] = useState<string>('');

  // Confirmation dialog states
  const [profileToArchive, setProfileToArchive] = useState<CustomerMeasurementProfile | null>(null);
  const [isArchivingProfile, setIsArchivingProfile] = useState(false);
  const [isRestoreCustomerOpen, setIsRestoreCustomerOpen] = useState(false);
  const [isRestoringCustomer, setIsRestoringCustomer] = useState(false);
  const [isArchiveCustomerOpen, setIsArchiveCustomerOpen] = useState(false);
  const [isArchivingCustomer, setIsArchivingCustomer] = useState(false);

  useEffect(() => {
    if (customer) {
      setCurrentCustomer(customer);
    }
  }, [customer]);

  const loadData = useCallback(async () => {
    if (!customer) return;
    setIsLoading(true);
    try {
      const [details, profs] = await Promise.all([
        customerService.getById(customer.id),
        customerService.getMeasurementProfiles(customer.id),
      ]);
      setCustomerDetails(details);
      if (details) {
        setCurrentCustomer((prev) => (prev ? {
          ...prev,
          isArchived: details.isArchived,
          archivedAt: details.archivedAt,
          archivedBy: details.archivedBy,
        } : null));
      }
      setProfiles(profs || []);
    } catch (err: any) {
      console.error('Failed to load customer details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [customer]);

  useEffect(() => {
    if (isOpen && customer) {
      loadData();
    }
  }, [isOpen, customer, loadData]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      const matchGarment =
        selectedGarmentFilter === 'ALL' ||
        (p.garment_type || '').toLowerCase() === selectedGarmentFilter.toLowerCase();
      const matchSearch =
        !measurementSearchQuery.trim() ||
        p.profile_name.toLowerCase().includes(measurementSearchQuery.toLowerCase()) ||
        (p.notes || '').toLowerCase().includes(measurementSearchQuery.toLowerCase()) ||
        (p.garment_type || '').toLowerCase().includes(measurementSearchQuery.toLowerCase());
      return matchGarment && matchSearch;
    });
  }, [profiles, selectedGarmentFilter, measurementSearchQuery]);

  if (!isOpen || !customer || !currentCustomer) return null;

  const handleOpenAddMeasurement = () => {
    setProfileForNewVersion(null);
    setMeasurementModalMode('new_profile');
    setIsAddMeasurementOpen(true);
  };

  const handleOpenEditProfile = (prof: CustomerMeasurementProfile) => {
    setProfileForNewVersion(prof);
    setMeasurementModalMode('edit_profile');
    setIsAddMeasurementOpen(true);
  };

  const handleOpenNewVersion = (prof: CustomerMeasurementProfile) => {
    setProfileForNewVersion(prof);
    setMeasurementModalMode('new_version');
    setIsAddMeasurementOpen(true);
  };

  const handleOpenHistory = (prof: CustomerMeasurementProfile) => {
    setProfileForHistory(prof);
  };

  const handleOpenPrint = (prof: CustomerMeasurementProfile) => {
    setProfileToPrint(prof);
  };

  const handleCloneProfile = async (prof: CustomerMeasurementProfile) => {
    try {
      setIsCloningId(prof.id);
      await customerService.cloneMeasurementProfile(customer.id, prof.id);
      showToast({
        type: 'success',
        title: 'Profile Cloned',
        message: `Created duplicate profile for ${prof.profile_name}`,
      });
      await loadData();
      onCustomerUpdated?.();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Clone Failed',
        message: err.message || 'Could not clone measurement profile',
      });
    } finally {
      setIsCloningId(null);
    }
  };

  const handleConfirmArchiveProfile = async () => {
    if (!profileToArchive) return;
    try {
      setIsArchivingProfile(true);
      await customerService.deleteMeasurementProfile(currentCustomer.id, profileToArchive.id);
      showToast({
        type: 'info',
        title: 'Profile Archived',
        message: `Archived ${profileToArchive.profile_name}`,
      });
      setProfileToArchive(null);
      await loadData();
      onCustomerUpdated?.();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Archive Failed',
        message: err.message || 'Could not archive profile',
      });
    } finally {
      setIsArchivingProfile(false);
    }
  };

  const handleConfirmRestoreCustomer = async () => {
    try {
      setIsRestoringCustomer(true);
      await customerService.unarchive(currentCustomer.id);
      showToast({
        type: 'success',
        title: 'Customer Restored',
        message: `${currentCustomer.name} restored to active directory.`,
      });
      setCurrentCustomer((prev) => (prev ? {
        ...prev,
        isArchived: false,
        archivedAt: null,
        archivedBy: null,
      } : null));
      setIsRestoreCustomerOpen(false);
      await loadData();
      onCustomerUpdated?.();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Restore Failed',
        message: err.message || 'Could not restore customer',
      });
    } finally {
      setIsRestoringCustomer(false);
    }
  };

  const handleConfirmArchiveCustomer = async () => {
    try {
      setIsArchivingCustomer(true);
      await customerService.archive(currentCustomer.id);
      showToast({
        type: 'info',
        title: 'Customer Archived',
        message: `${currentCustomer.name} moved to archive. All history, orders, and measurements preserved.`,
      });
      setCurrentCustomer((prev) => (prev ? {
        ...prev,
        isArchived: true,
        archivedAt: new Date().toISOString(),
        archivedBy: 'Boutique Manager',
      } : null));
      setIsArchiveCustomerOpen(false);
      await loadData();
      onCustomerUpdated?.();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Archive Failed',
        message: err.message || 'Could not archive customer',
      });
    } finally {
      setIsArchivingCustomer(false);
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateStr);
    }
  };

  const orders = customerDetails?.sales_orders || [];
  const totalSpent = customerDetails?.totalSpent ?? customer.totalSpend ?? 0;
  const totalOrders = customerDetails?.totalOrders ?? customer.visitsCount ?? 0;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>Customer: {currentCustomer.name}</span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                padding: '2px 7px',
                borderRadius: '4px',
                ...(currentCustomer.isArchived
                  ? {
                      backgroundColor: 'var(--yz-bg-subtle, #F1F5F9)',
                      color: 'var(--yz-text-secondary, #475569)',
                      border: '1px solid var(--yz-border-strong, #CBD5E1)',
                    }
                  : {
                      backgroundColor: 'var(--yz-status-in-stock-bg, #ECFDF5)',
                      color: 'var(--yz-status-in-stock, #065F46)',
                      border: '1px solid var(--yz-status-in-stock-border, #A7F3D0)',
                    }),
              }}
            >
              {currentCustomer.isArchived ? 'ARCHIVED' : 'ACTIVE'}
            </span>
          </div>
        }
        subtitle={`Phone: ${currentCustomer.phone || 'No phone recorded'} • Boutique Loyalty & Measurements`}
        maxWidth="820px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Navigation Tabs Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderBottom: '1px solid var(--yz-border)',
              paddingBottom: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('measurements')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--yz-radius-md)',
                border: activeTab === 'measurements' ? '1px solid var(--yz-primary, #832729)' : '1px solid transparent',
                backgroundColor: activeTab === 'measurements' ? '#FEF2F2' : 'transparent',
                color: activeTab === 'measurements' ? 'var(--yz-primary, #832729)' : 'var(--yz-text-secondary)',
                fontWeight: activeTab === 'measurements' ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
              }}
            >
              <SlidersHorizontal size={13} />
              <span>Boutique Measurements</span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--yz-font-mono)',
                  padding: '1px 6px',
                  borderRadius: 'var(--yz-radius-full)',
                  backgroundColor: activeTab === 'measurements' ? '#FDE8E8' : 'var(--yz-bg-subtle)',
                  color: activeTab === 'measurements' ? 'var(--yz-primary, #832729)' : 'var(--yz-text-muted)',
                }}
              >
                {profiles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('orders')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--yz-radius-md)',
                border: activeTab === 'orders' ? '1px solid var(--yz-primary, #832729)' : '1px solid transparent',
                backgroundColor: activeTab === 'orders' ? '#FEF2F2' : 'transparent',
                color: activeTab === 'orders' ? 'var(--yz-primary, #832729)' : 'var(--yz-text-secondary)',
                fontWeight: activeTab === 'orders' ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
              }}
            >
              <FileText size={13} />
              <span>Sales Orders & History</span>
              <span
                style={{
                  fontSize: '10px',
                  fontFamily: 'var(--yz-font-mono)',
                  padding: '1px 6px',
                  borderRadius: 'var(--yz-radius-full)',
                  backgroundColor: activeTab === 'orders' ? '#FDE8E8' : 'var(--yz-bg-subtle)',
                  color: activeTab === 'orders' ? 'var(--yz-primary, #832729)' : 'var(--yz-text-muted)',
                }}
              >
                {totalOrders}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--yz-radius-md)',
                border: activeTab === 'profile' ? '1px solid var(--yz-primary, #832729)' : '1px solid transparent',
                backgroundColor: activeTab === 'profile' ? '#FEF2F2' : 'transparent',
                color: activeTab === 'profile' ? 'var(--yz-primary, #832729)' : 'var(--yz-text-secondary)',
                fontWeight: activeTab === 'profile' ? 700 : 500,
                fontSize: '11.5px',
                cursor: 'pointer',
              }}
            >
              <User size={13} />
              <span>Customer Profile & Address</span>
            </button>
          </div>

          {/* Subtle Archived Status Bar */}
          {currentCustomer.isArchived && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                borderRadius: 'var(--yz-radius-sm)',
                backgroundColor: 'var(--yz-bg-subtle, #F8FAFC)',
                border: '1px solid var(--yz-border, #E2E8F0)',
                fontSize: '11.5px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--yz-text-muted)', display: 'block', textTransform: 'uppercase' }}>
                    Customer Status
                  </span>
                  <span
                    style={{
                      display: 'inline-block',
                      marginTop: '2px',
                      fontSize: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      backgroundColor: '#F1F5F9',
                      color: '#475569',
                      border: '1px solid #CBD5E1',
                    }}
                  >
                    ARCHIVED
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--yz-text-muted)', display: 'block', textTransform: 'uppercase' }}>
                    Archived on
                  </span>
                  <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)', fontFamily: 'var(--yz-font-mono)', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                    {formatDate(currentCustomer.archivedAt || currentCustomer.updatedAt)}
                  </span>
                </div>
                {currentCustomer.archivedBy && (
                  <div>
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--yz-text-muted)', display: 'block', textTransform: 'uppercase' }}>
                      Archived by
                    </span>
                    <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)', fontSize: '11px', marginTop: '2px', display: 'block' }}>
                      {currentCustomer.archivedBy}
                    </span>
                  </div>
                )}
              </div>

              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCcw size={12} />}
                onClick={() => setIsRestoreCustomerOpen(true)}
                style={{ fontSize: '11px' }}
              >
                Restore Customer
              </Button>
            </div>
          )}

          {/* TAB 1: BOUTIQUE MEASUREMENTS */}
          {activeTab === 'measurements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Header bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  borderRadius: 'var(--yz-radius-md)',
                  border: '1px solid var(--yz-border)',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                      Tailored Garment Profiles
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        backgroundColor: 'var(--yz-primary-subtle, #FEF2F2)',
                        color: 'var(--yz-primary, #832729)',
                        border: '1px solid var(--yz-primary-border, #FECACA)',
                        padding: '1px 8px',
                        borderRadius: 'var(--yz-radius-full)',
                      }}
                    >
                      {profiles.length} Recorded
                    </span>
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)' }}>
                    Garment-specific tailored fitting records with permanent historical version preservation.
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={12} />}
                  onClick={handleOpenAddMeasurement}
                  style={{ fontSize: '11px', height: '32px' }}
                >
                  Record Measurement
                </Button>
              </div>

              {/* Garment Filters & Search Bar */}
              {profiles.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '10px',
                    flexWrap: 'wrap',
                    padding: '8px 12px',
                    backgroundColor: 'var(--yz-bg-surface)',
                    border: '1px solid var(--yz-border)',
                    borderRadius: 'var(--yz-radius-md)',
                  }}
                >
                  {/* Garment Type Pills */}
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--yz-text-muted)', textTransform: 'uppercase', marginRight: '4px' }}>
                      Garment:
                    </span>
                    {['ALL', 'Blouse', 'Chudidar', 'Kurti', 'Shirt', 'Trousers', 'Lehenga'].map((g) => {
                      const isSelected = selectedGarmentFilter === g;
                      return (
                        <button
                          key={g}
                          type="button"
                          onClick={() => setSelectedGarmentFilter(g)}
                          style={{
                            padding: '2px 8px',
                            borderRadius: 'var(--yz-radius-full)',
                            fontSize: '10.5px',
                            fontWeight: isSelected ? 700 : 500,
                            border: isSelected ? '1px solid var(--yz-primary, #832729)' : '1px solid var(--yz-border)',
                            backgroundColor: isSelected ? 'var(--yz-primary, #832729)' : 'transparent',
                            color: isSelected ? '#FFFFFF' : 'var(--yz-text-secondary)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {g === 'ALL' ? 'All' : g}
                        </button>
                      );
                    })}
                  </div>

                  {/* Search Input */}
                  <div style={{ position: 'relative', width: '200px' }}>
                    <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--yz-text-muted)' }} />
                    <input
                      type="text"
                      className="yz-input"
                      placeholder="Search profiles..."
                      value={measurementSearchQuery}
                      onChange={(e) => setMeasurementSearchQuery(e.target.value)}
                      style={{ height: '26px', fontSize: '10.5px', paddingLeft: '26px' }}
                    />
                  </div>
                </div>
              )}

              {/* Profiles Cards Grid */}
              {isLoading ? (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--yz-text-muted)' }}>
                  <Loader2 size={18} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                  <span>Loading tailored measurements...</span>
                </div>
              ) : profiles.length === 0 ? (
                <div
                  style={{
                    padding: '36px',
                    textAlign: 'center',
                    border: '1.5px dashed var(--yz-border)',
                    borderRadius: 'var(--yz-radius-md)',
                    backgroundColor: 'var(--yz-bg-surface)',
                  }}
                >
                  <SlidersHorizontal size={26} style={{ color: 'var(--yz-text-muted)', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                    No Measurement Profiles Recorded Yet
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--yz-text-muted)', marginTop: '4px', maxWidth: '380px', margin: '4px auto 12px' }}>
                    Record custom measurements for {customer.name} across Saree Blouse, Churidar, Kurti, or Trousers using active boutique templates.
                  </p>
                  <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={handleOpenAddMeasurement}>
                    Record First Measurement
                  </Button>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div
                  style={{
                    padding: '28px',
                    textAlign: 'center',
                    border: '1px dashed var(--yz-border)',
                    borderRadius: 'var(--yz-radius-md)',
                    backgroundColor: 'var(--yz-bg-surface)',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
                    No measurement profiles match your selected filters.
                  </span>
                  <div style={{ marginTop: '8px' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setSelectedGarmentFilter('ALL');
                        setMeasurementSearchQuery('');
                      }}
                      style={{ fontSize: '11px' }}
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '10px' }}>
                  {filteredProfiles.map((prof) => {
                    const currentVer = prof.current_version;
                    const dateStr = currentVer?.measured_at
                      ? new Date(currentVer.measured_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Initial';

                    const values = currentVer?.values || [];
                    const filled = values.filter((v) => {
                      const num = v.numeric_value !== undefined && v.numeric_value !== null ? v.numeric_value : v.num_value;
                      return num !== null && num !== undefined && (typeof num === 'string' ? (num as string).trim() !== '' : true);
                    });
                    const previewValues = (filled.length > 0 ? filled : values).slice(0, 6);
                    const garment = prof.garment_type || 'Blouse';

                    return (
                      <div
                        key={prof.id}
                        style={{
                          backgroundColor: 'var(--yz-bg-surface)',
                          border: '1px solid var(--yz-border)',
                          borderRadius: 'var(--yz-radius-md)',
                          padding: '12px 14px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: 'var(--yz-shadow-2xs)',
                        }}
                      >
                        <div>
                          {/* Card Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--yz-border)', paddingBottom: '6px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                                  {prof.profile_name}
                                </span>
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    fontFamily: 'var(--yz-font-mono)',
                                    backgroundColor: 'var(--yz-primary-subtle, #FEF2F2)',
                                    color: 'var(--yz-primary, #832729)',
                                    border: '1px solid var(--yz-primary-border, #FECACA)',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                  }}
                                >
                                  v{currentVer?.version_number || 1} • CURRENT
                                </span>
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
                                Measured: {dateStr}
                                {currentVer?.measured_by && ` • Tailor: ${currentVer.measured_by}`}
                              </div>
                            </div>

                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                                color: 'var(--yz-text-secondary)',
                                backgroundColor: 'var(--yz-bg-subtle)',
                                border: '1px solid var(--yz-border)',
                                padding: '2px 7px',
                                borderRadius: 'var(--yz-radius-sm)',
                              }}
                            >
                              {garment}
                            </span>
                          </div>

                          {/* Linked Order Badge if attached */}
                          {currentVer?.order_number && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '6px',
                                padding: '2px 7px',
                                backgroundColor: '#EFF6FF',
                                border: '1px solid #BFDBFE',
                                borderRadius: '3px',
                                fontSize: '10px',
                                color: '#1E40AF',
                                fontWeight: 600,
                              }}
                            >
                              <FileText size={11} />
                              <span>Stitching Order: {currentVer.order_number}</span>
                            </div>
                          )}

                          {/* Fitting Preferences / Workshop Instructions Callout */}
                          {(currentVer?.fitting_preferences || currentVer?.tailor_instructions || currentVer?.notes || prof.notes) && (
                            <div
                              style={{
                                marginTop: '6px',
                                padding: '6px 8px',
                                backgroundColor: 'var(--yz-bg-subtle)',
                                border: '1px solid var(--yz-border)',
                                borderRadius: 'var(--yz-radius-sm)',
                                fontSize: '10.5px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                              }}
                            >
                              {currentVer?.fitting_preferences && (
                                <div style={{ color: 'var(--yz-text-primary)' }}>
                                  <strong style={{ color: 'var(--yz-text-muted)', fontSize: '9.5px', textTransform: 'uppercase' }}>Fit: </strong>
                                  {currentVer.fitting_preferences}
                                </div>
                              )}
                              {currentVer?.tailor_instructions && (
                                <div style={{ color: '#92400E', fontStyle: 'italic' }}>
                                  <strong style={{ color: '#B45309', fontSize: '9.5px', textTransform: 'uppercase' }}>Workshop Note: </strong>
                                  {currentVer.tailor_instructions}
                                </div>
                              )}
                              {!currentVer?.fitting_preferences && !currentVer?.tailor_instructions && (currentVer?.notes || prof.notes) && (
                                <div style={{ color: 'var(--yz-text-secondary)', fontStyle: 'italic' }}>
                                  "{currentVer?.notes || prof.notes}"
                                </div>
                              )}
                            </div>
                          )}

                          {/* Parameters Preview Grid */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: '6px',
                              margin: '8px 0',
                            }}
                          >
                            {previewValues.map((v) => {
                              const displayNum =
                                v.numeric_value !== undefined && v.numeric_value !== null
                                  ? v.numeric_value
                                  : v.num_value;

                              return (
                                <div
                                  key={v.id || v.field_id}
                                  style={{
                                    padding: '4px 6px',
                                    backgroundColor: 'var(--yz-bg-subtle)',
                                    border: '1px solid var(--yz-border)',
                                    borderRadius: 'var(--yz-radius-sm)',
                                  }}
                                >
                                  <div
                                    style={{
                                      fontSize: '9.5px',
                                      color: 'var(--yz-text-muted)',
                                      whiteSpace: 'nowrap',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                    }}
                                    title={v.field_name}
                                  >
                                    {v.field_name}
                                  </div>
                                  <div
                                    style={{
                                      fontFamily: 'var(--yz-font-mono)',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      color: 'var(--yz-text-primary)',
                                      marginTop: '1px',
                                    }}
                                  >
                                    {displayNum !== null && displayNum !== undefined ? (
                                      <span>
                                        {displayNum}{' '}
                                        <span style={{ fontSize: '9px', color: 'var(--yz-text-muted)', fontWeight: 400 }}>
                                          {v.unit || 'in'}
                                        </span>
                                      </span>
                                    ) : (
                                      <span style={{ color: 'var(--yz-text-muted)', fontWeight: 400 }}>{v.text_value || '—'}</span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {values.length > 6 && (
                            <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', textAlign: 'right', marginBottom: '6px' }}>
                              + {values.length - 6} more parameters
                            </div>
                          )}
                        </div>

                        {/* Card Actions Footer */}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderTop: '1px solid var(--yz-border)',
                            paddingTop: '6px',
                            marginTop: '4px',
                            flexWrap: 'wrap',
                            gap: '4px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenPrint(prof)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                color: 'var(--yz-primary, #832729)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                              title="Print tailor workshop job slip"
                            >
                              <Printer size={12} />
                              <span>Print Slip</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenHistory(prof)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px',
                                fontSize: '10.5px',
                                fontWeight: 600,
                                color: 'var(--yz-text-secondary)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                            >
                              <Clock size={12} />
                              <span>History ({prof.total_versions || 1})</span>
                            </button>
                          </div>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Copy size={11} />}
                              onClick={() => handleCloneProfile(prof)}
                              disabled={isCloningId === prof.id}
                              style={{ padding: '2px 6px', height: '22px', fontSize: '10.5px' }}
                              title="Duplicate as new garment profile"
                            >
                              Clone
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={<Edit size={11} />}
                              onClick={() => handleOpenEditProfile(prof)}
                              style={{ padding: '2px 6px', height: '22px', fontSize: '10.5px' }}
                              title="Edit current profile"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              icon={<Plus size={11} />}
                              onClick={() => handleOpenNewVersion(prof)}
                              style={{ padding: '2px 8px', height: '22px', fontSize: '10.5px' }}
                              title="Record new version of measurements"
                            >
                              New Ver
                            </Button>
                            <button
                              type="button"
                              onClick={() => setProfileToArchive(prof)}
                              style={{
                                border: 'none',
                                background: 'none',
                                color: 'var(--yz-text-muted)',
                                cursor: 'pointer',
                                padding: '2px 4px',
                              }}
                              title="Archive profile"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SALES ORDERS & HISTORY */}
          {activeTab === 'orders' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Financial Summary */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  padding: '8px 12px',
                  borderRadius: 'var(--yz-radius-sm)',
                  border: '1px solid var(--yz-border)',
                  textAlign: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>TAX REGISTRATION / GSTIN</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--yz-font-mono)', marginTop: '2px' }}>
                    {customer.gstin || 'Consumer / Unregistered'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>TOTAL ORDERS PLACED</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--yz-font-mono)', marginTop: '2px' }}>
                    {totalOrders} Orders
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>LIFETIME SPEND</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-primary, #832729)', marginTop: '2px' }}>
                    ₹{totalSpent.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              <div className="yz-table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                <table className="yz-table" style={{ width: '100%' }}>
                  <thead>
                    <tr>
                      <th style={{ width: '130px' }}>ORDER NUMBER</th>
                      <th style={{ width: '95px' }}>DATE</th>
                      <th>ITEMS / PRODUCTS</th>
                      <th style={{ width: '110px', textAlign: 'right' }}>TOTAL AMOUNT</th>
                      <th style={{ width: '90px', textAlign: 'center' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: 'var(--yz-text-muted)' }}>
                          No sales orders placed by this customer yet.
                        </td>
                      </tr>
                    ) : (
                      orders.map((o: any) => {
                        const itemsSummary = o.items && o.items.length
                          ? o.items.map((it: any) => `${it.product?.name || it.productName || 'Garment'} (x${it.quantity})`).join(', ')
                          : 'Boutique counter purchase';

                        return (
                          <tr key={o.id}>
                            <td style={{ fontWeight: 600, fontFamily: 'var(--yz-font-mono)', fontSize: '11.5px' }}>
                              {o.order_number || o.orderNumber}
                            </td>
                            <td style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                              {o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : '-'}
                            </td>
                            <td>
                              <div className="yz-cell-truncate" style={{ maxWidth: '280px', fontSize: '11px' }} title={itemsSummary}>
                                {itemsSummary}
                              </div>
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}>
                              ₹{Number(o.grand_total || o.totalAmount || 0).toLocaleString('en-IN')}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '1px 6px',
                                  borderRadius: 'var(--yz-radius-sm)',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  backgroundColor: o.status === 'DELIVERED' || o.payment_status === 'PAID' ? 'var(--yz-status-in-stock-bg, #DCFCE7)' : 'var(--yz-status-low-stock-bg, #FEF3C7)',
                                  color: o.status === 'DELIVERED' || o.payment_status === 'PAID' ? 'var(--yz-status-in-stock, #166534)' : 'var(--yz-status-low-stock, #92400E)',
                                }}
                              >
                                {o.payment_status || o.status || 'PAID'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOMER PROFILE & ADDRESS */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  padding: '10px 12px',
                  borderRadius: 'var(--yz-radius-sm)',
                  border: '1px solid var(--yz-border)',
                }}
              >
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)', display: 'block' }}>PHONE NUMBER</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--yz-font-mono)', marginTop: '2px', display: 'block' }}>
                    {customer.phone || 'No phone recorded'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)', display: 'block' }}>EMAIL ADDRESS</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                    {customer.email || 'No email recorded'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)', display: 'block' }}>CITY / LOCATION</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                    {customer.city || 'Chennai'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)', display: 'block' }}>GSTIN / TAX ID</span>
                  <span style={{ fontSize: '12px', fontWeight: 600, fontFamily: 'var(--yz-font-mono)', marginTop: '2px', display: 'block' }}>
                    {customer.gstin || 'Consumer / Unregistered'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--yz-radius-sm)',
                    border: '1px solid var(--yz-border)',
                    backgroundColor: 'var(--yz-bg-surface)',
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--yz-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '4px' }}>
                    Billing Address
                  </span>
                  <p style={{ fontSize: '11.5px', color: 'var(--yz-text-primary)', margin: 0 }}>
                    {customer.billingAddress || customer.address || 'No billing address recorded'}
                  </p>
                </div>

                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--yz-radius-sm)',
                    border: '1px solid var(--yz-border)',
                    backgroundColor: 'var(--yz-bg-surface)',
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--yz-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '4px' }}>
                    Shipping / Delivery Address
                  </span>
                  <p style={{ fontSize: '11.5px', color: 'var(--yz-text-primary)', margin: 0 }}>
                    {customer.shippingAddress || customer.billingAddress || customer.address || 'Same as billing address'}
                  </p>
                </div>
              </div>

              {customer.notes && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--yz-radius-sm)',
                    border: '1px solid var(--yz-border)',
                    backgroundColor: 'var(--yz-bg-surface)',
                  }}
                >
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--yz-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', marginBottom: '4px' }}>
                    Notes & Styling Preferences
                  </span>
                  <p style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)', fontStyle: 'italic', margin: 0 }}>
                    "{customer.notes}"
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Edit size={12} />}
                  onClick={() => {
                    onClose();
                    onEditCustomer?.(currentCustomer);
                  }}
                >
                  Edit Customer Profile
                </Button>

                {currentCustomer.isArchived ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<RotateCcw size={12} />}
                    onClick={() => setIsRestoreCustomerOpen(true)}
                  >
                    Restore Customer
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Archive size={12} />}
                    onClick={() => setIsArchiveCustomerOpen(true)}
                    style={{ color: 'var(--yz-status-low-stock, #B45309)', borderColor: 'var(--yz-status-low-stock-border, #FDE68A)' }}
                  >
                    Archive Customer
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--yz-border)', paddingTop: '8px' }}>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add / Edit / New Version Measurement Modal */}
      {isAddMeasurementOpen && (
        <AddMeasurementModal
          isOpen={isAddMeasurementOpen}
          onClose={() => {
            setIsAddMeasurementOpen(false);
            setProfileForNewVersion(null);
          }}
          customerId={customer.id}
          customerName={customer.name}
          customerPhone={customer.phone}
          existingProfile={profileForNewVersion}
          mode={measurementModalMode}
          availableOrders={(orders || []).map((o: any) => ({
            id: o.id,
            orderNumber: o.order_number || o.orderNumber || 'Order',
            date: o.order_date ? new Date(o.order_date).toLocaleDateString('en-IN') : undefined,
          }))}
          onSaved={async () => {
            await loadData();
            onCustomerUpdated?.();
          }}
        />
      )}

      {/* Measurement History Modal */}
      {profileForHistory && (
        <MeasurementHistoryModal
          isOpen={Boolean(profileForHistory)}
          onClose={() => setProfileForHistory(null)}
          customerId={currentCustomer.id}
          customerName={currentCustomer.name}
          customerPhone={currentCustomer.phone}
          profile={profileForHistory}
          onRecordNewVersion={() => {
            const p = profileForHistory;
            setProfileForHistory(null);
            handleOpenNewVersion(p);
          }}
          onProfileCloned={async () => {
            await loadData();
            onCustomerUpdated?.();
          }}
        />
      )}

      {/* Print Tailor Workshop Job Sheet Modal */}
      {profileToPrint && (
        <PrintTailorSheetModal
          isOpen={Boolean(profileToPrint)}
          onClose={() => setProfileToPrint(null)}
          customerName={currentCustomer.name}
          customerPhone={currentCustomer.phone}
          profile={profileToPrint}
        />
      )}

      {/* Archive Garment Profile Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(profileToArchive)}
        onClose={() => !isArchivingProfile && setProfileToArchive(null)}
        onConfirm={handleConfirmArchiveProfile}
        title="Archive Garment Profile"
        description={
          profileToArchive ? (
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--yz-text-primary)' }}>
                Are you sure you want to archive <strong>"{profileToArchive.profile_name}"</strong>?
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--yz-text-secondary)', lineHeight: 1.45 }}>
                This tailored garment profile will be moved to archived status. All historical versions and linked order records remain intact.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Archive"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isArchivingProfile}
      />

      {/* Restore Customer Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isRestoreCustomerOpen}
        onClose={() => !isRestoringCustomer && setIsRestoreCustomerOpen(false)}
        onConfirm={handleConfirmRestoreCustomer}
        title="Restore Customer"
        description={
          <div>
            <p style={{ margin: 0, fontWeight: 500, color: 'var(--yz-text-primary)' }}>
              Are you sure you want to restore <strong>{currentCustomer.name}</strong>?
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--yz-text-secondary)', lineHeight: 1.45 }}>
              This customer will reappear in the active customer directory. All tailoring measurements, orders, and payment records remain preserved.
            </p>
          </div>
        }
        confirmLabel="Restore Customer"
        cancelLabel="Cancel"
        variant="primary"
        isLoading={isRestoringCustomer}
      />

      {/* Archive Customer Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isArchiveCustomerOpen}
        onClose={() => !isArchivingCustomer && setIsArchiveCustomerOpen(false)}
        onConfirm={handleConfirmArchiveCustomer}
        title="Archive Customer"
        description={
          <div>
            <p style={{ margin: 0, fontWeight: 500, color: 'var(--yz-text-primary)' }}>
              Are you sure you want to archive <strong>"{currentCustomer.name}"</strong>?
            </p>
            <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--yz-text-secondary)', lineHeight: 1.45 }}>
              This customer will be moved to Archived and won't appear in the active customer list. All measurements, orders, and payment records are preserved.
            </p>
          </div>
        }
        confirmLabel="Archive"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isArchivingCustomer}
      />
    </>
  );
};
