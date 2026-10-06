import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { AddMeasurementModal } from './AddMeasurementModal';
import { MeasurementHistoryModal } from './MeasurementHistoryModal';

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
  const [customerDetails, setCustomerDetails] = useState<CustomerDetailData | null>(null);
  const [profiles, setProfiles] = useState<CustomerMeasurementProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Sub-modal states
  const [isAddMeasurementOpen, setIsAddMeasurementOpen] = useState(false);
  const [profileForNewVersion, setProfileForNewVersion] = useState<CustomerMeasurementProfile | null>(null);
  const [profileForHistory, setProfileForHistory] = useState<CustomerMeasurementProfile | null>(null);
  const [isCloningId, setIsCloningId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!customer) return;
    setIsLoading(true);
    try {
      const [details, profs] = await Promise.all([
        customerService.getById(customer.id),
        customerService.getMeasurementProfiles(customer.id),
      ]);
      setCustomerDetails(details);
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

  if (!isOpen || !customer) return null;

  const handleOpenAddMeasurement = () => {
    setProfileForNewVersion(null);
    setIsAddMeasurementOpen(true);
  };

  const handleOpenNewVersion = (prof: CustomerMeasurementProfile) => {
    setProfileForNewVersion(prof);
    setIsAddMeasurementOpen(true);
  };

  const handleOpenHistory = (prof: CustomerMeasurementProfile) => {
    setProfileForHistory(prof);
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

  const handleDeleteProfile = async (prof: CustomerMeasurementProfile) => {
    if (!confirm(`Are you sure you want to archive "${prof.profile_name}"?`)) return;
    try {
      await customerService.deleteMeasurementProfile(customer.id, prof.id);
      showToast({
        type: 'info',
        title: 'Profile Archived',
        message: `Archived ${prof.profile_name}`,
      });
      await loadData();
      onCustomerUpdated?.();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Archive Failed',
        message: err.message || 'Could not archive profile',
      });
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
        title={`Customer: ${customer.name}`}
        subtitle={`Phone: ${customer.phone || 'No phone recorded'} • Boutique Loyalty & Measurements`}
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
                padding: '6px 12px',
                borderRadius: 'var(--yz-radius-sm)',
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
                  padding: '1px 5px',
                  borderRadius: '10px',
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
                padding: '6px 12px',
                borderRadius: 'var(--yz-radius-sm)',
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
                  padding: '1px 5px',
                  borderRadius: '10px',
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
                padding: '6px 12px',
                borderRadius: 'var(--yz-radius-sm)',
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

          {/* TAB 1: BOUTIQUE MEASUREMENTS */}
          {activeTab === 'measurements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Header bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  borderRadius: 'var(--yz-radius-sm)',
                  border: '1px solid var(--yz-border)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                      Tailored Garment Profiles
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        backgroundColor: '#FEF2F2',
                        color: 'var(--yz-primary, #832729)',
                        border: '1px solid #FECACA',
                        padding: '1px 6px',
                        borderRadius: '10px',
                      }}
                    >
                      {profiles.length} Garments
                    </span>
                  </div>
                  <span style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)' }}>
                    Custom tailored garment measurements with versioned historical audit trail.
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={12} />}
                  onClick={handleOpenAddMeasurement}
                  style={{ fontSize: '11px' }}
                >
                  + Add Measurement
                </Button>
              </div>

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
                    border: '1px dashed var(--yz-border)',
                    borderRadius: 'var(--yz-radius-sm)',
                    backgroundColor: 'var(--yz-bg-surface)',
                  }}
                >
                  <SlidersHorizontal size={24} style={{ color: 'var(--yz-text-muted)', margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                    No Measurement Profiles Recorded Yet
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--yz-text-muted)', marginTop: '4px', maxWidth: '380px', margin: '4px auto 12px' }}>
                    Record custom measurements for {customer.name} across Saree Blouse, Churidar, Kurti, or Bottom pants.
                  </p>
                  <Button variant="primary" size="sm" icon={<Plus size={12} />} onClick={handleOpenAddMeasurement}>
                    Record First Measurement
                  </Button>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '10px' }}>
                  {profiles.map((prof) => {
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

                    return (
                      <div
                        key={prof.id}
                        style={{
                          backgroundColor: 'var(--yz-bg-surface)',
                          border: '1px solid var(--yz-border)',
                          borderRadius: 'var(--yz-radius-sm)',
                          padding: '10px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: 'var(--yz-shadow-sm)',
                        }}
                      >
                        <div>
                          {/* Card Header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--yz-border)', paddingBottom: '6px' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                                  {prof.profile_name}
                                </span>
                                <span
                                  style={{
                                    fontSize: '9.5px',
                                    fontWeight: 700,
                                    fontFamily: 'var(--yz-font-mono)',
                                    backgroundColor: '#FEF2F2',
                                    color: 'var(--yz-primary, #832729)',
                                    border: '1px solid #FECACA',
                                    padding: '1px 5px',
                                    borderRadius: '3px',
                                  }}
                                >
                                  v{currentVer?.version_number || 1}
                                </span>
                              </div>
                              <div style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
                                Updated: {dateStr}
                                {currentVer?.measured_by && ` • Tailor: ${currentVer.measured_by}`}
                              </div>
                            </div>

                            <span
                              style={{
                                fontSize: '10px',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px',
                                color: 'var(--yz-text-secondary)',
                                backgroundColor: 'var(--yz-bg-subtle)',
                                padding: '2px 6px',
                                borderRadius: 'var(--yz-radius-sm)',
                              }}
                            >
                              {prof.template_name || 'Garment'}
                            </span>
                          </div>

                          {/* Styling Notes if present */}
                          {(currentVer?.notes || prof.notes) && (
                            <div
                              style={{
                                marginTop: '6px',
                                padding: '4px 8px',
                                backgroundColor: 'var(--yz-bg-subtle)',
                                borderRadius: 'var(--yz-radius-sm)',
                                fontSize: '10.5px',
                                color: 'var(--yz-text-secondary)',
                                fontStyle: 'italic',
                              }}
                            >
                              "{currentVer?.notes || prof.notes}"
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
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenHistory(prof)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
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
                              variant="primary"
                              size="sm"
                              icon={<Edit size={11} />}
                              onClick={() => handleOpenNewVersion(prof)}
                              style={{ padding: '2px 8px', height: '22px', fontSize: '10.5px' }}
                              title="Record new version of measurements"
                            >
                              New Version
                            </Button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProfile(prof)}
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
                                  backgroundColor: o.status === 'DELIVERED' || o.payment_status === 'PAID' ? '#DCFCE7' : '#FEF3C7',
                                  color: o.status === 'DELIVERED' || o.payment_status === 'PAID' ? '#166534' : '#92400E',
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

              <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '4px' }}>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Edit size={12} />}
                  onClick={() => {
                    onClose();
                    onEditCustomer?.(customer);
                  }}
                >
                  Edit Customer Profile
                </Button>
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

      {/* Add / Edit Measurement Modal */}
      {isAddMeasurementOpen && (
        <AddMeasurementModal
          isOpen={isAddMeasurementOpen}
          onClose={() => {
            setIsAddMeasurementOpen(false);
            setProfileForNewVersion(null);
          }}
          customerId={customer.id}
          customerName={customer.name}
          existingProfile={profileForNewVersion}
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
          customerId={customer.id}
          customerName={customer.name}
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
    </>
  );
};
