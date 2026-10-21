import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import {
  customerService,
  type CustomerMeasurementProfile,
  type CustomerMeasurementVersion,
} from '../../services/customerService';
import { useToast } from '../../components/common/Toast';
import { Loader2, Copy, Plus, Printer, Scissors, FileText } from 'lucide-react';
import { PrintTailorSheetModal } from './PrintTailorSheetModal';

interface MeasurementHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  profile: CustomerMeasurementProfile | null;
  onRecordNewVersion?: () => void;
  onProfileCloned?: () => void;
}

export const MeasurementHistoryModal: React.FC<MeasurementHistoryModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  customerPhone,
  profile,
  onRecordNewVersion,
  onProfileCloned,
}) => {
  const { showToast } = useToast();
  const [versions, setVersions] = useState<CustomerMeasurementVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    if (!isOpen || !profile) return;

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const historyData = await customerService.getMeasurementHistory(customerId, profile.id);
        const list = Array.isArray(historyData) ? historyData : [];
        setVersions(list);
        if (list.length > 0) {
          const current = list.find((v) => v.is_current) || list[0];
          setSelectedVersionId(current.id);
        }
      } catch (err: any) {
        console.error('Failed to load measurement history:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, customerId, profile]);

  if (!profile || !isOpen) return null;

  const activeVersion = versions.find((v) => v.id === selectedVersionId) || versions[0];
  const garmentType = profile.garment_type || 'Blouse';

  const handleClone = async () => {
    try {
      setIsCloning(true);
      await customerService.cloneMeasurementProfile(customerId, profile.id);
      showToast({
        type: 'success',
        title: 'Profile Cloned',
        message: `Created duplicate copy of ${profile.profile_name}`,
      });
      onProfileCloned?.();
      onClose();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Clone Failed',
        message: err.message || 'Could not clone measurement profile',
      });
    } finally {
      setIsCloning(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scissors size={16} style={{ color: 'var(--yz-primary, #832729)' }} />
            <span>Fitting History — {profile.profile_name}</span>
          </div>
        }
        subtitle={`Client: ${customerName} • ${versions.length} recorded version${versions.length === 1 ? '' : 's'} with historical field snapshot preservation`}
        maxWidth="760px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Top Action Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--yz-bg-subtle)',
              padding: '10px 14px',
              borderRadius: 'var(--yz-radius-md)',
              border: '1px solid var(--yz-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  borderRadius: 'var(--yz-radius-sm)',
                  backgroundColor: 'var(--yz-primary-subtle, #FEF2F2)',
                  color: 'var(--yz-primary, #832729)',
                  border: '1px solid var(--yz-primary-border, #FECACA)',
                }}
              >
                {garmentType}
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
                Template: {profile.template_name || 'Garment Specification'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <Button
                variant="secondary"
                size="sm"
                icon={<Printer size={12} />}
                onClick={() => setIsPrintModalOpen(true)}
                disabled={!activeVersion}
                style={{ fontSize: '11px' }}
                title="Print Measurement Sheet (3-inch thermal printer)"
              >
                Print Measurement Sheet
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<Copy size={12} />}
                onClick={handleClone}
                disabled={isCloning}
                style={{ fontSize: '11px' }}
                title="Clone as new garment profile"
              >
                {isCloning ? 'Cloning...' : 'Duplicate'}
              </Button>
              {onRecordNewVersion && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={12} />}
                  onClick={() => {
                    onClose();
                    onRecordNewVersion();
                  }}
                  style={{ fontSize: '11px' }}
                >
                  Record New Version
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '36px', color: 'var(--yz-text-muted)' }}>
              <Loader2 size={18} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <span>Loading version history...</span>
            </div>
          ) : versions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--yz-text-muted)' }}>
              No recorded versions found for this profile.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: '14px', minHeight: '340px' }}>
              {/* Version Timeline Selector */}
              <div
                style={{
                  borderRight: '1px solid var(--yz-border)',
                  paddingRight: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    color: 'var(--yz-text-secondary)',
                  }}
                >
                  Version Timeline
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto', maxHeight: '340px' }}>
                  {versions.map((ver) => {
                    const isSelected = ver.id === selectedVersionId;
                    const dateStr = ver.measured_at
                      ? new Date(ver.measured_at).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })
                      : 'Recorded Date';

                    return (
                      <button
                        key={ver.id}
                        type="button"
                        onClick={() => setSelectedVersionId(ver.id)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          padding: '8px 10px',
                          borderRadius: 'var(--yz-radius-sm)',
                          border: isSelected ? '1.5px solid var(--yz-primary, #832729)' : '1px solid var(--yz-border)',
                          backgroundColor: isSelected ? '#FEF2F2' : 'var(--yz-bg-surface)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? 'var(--yz-shadow-xs)' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                          <span
                            style={{
                              fontSize: '12px',
                              fontWeight: isSelected ? 800 : 600,
                              color: isSelected ? 'var(--yz-primary, #832729)' : 'var(--yz-text-primary)',
                            }}
                          >
                            Version {ver.version_number}
                          </span>
                          {ver.is_current ? (
                            <span
                              style={{
                                fontSize: '9px',
                                fontWeight: 700,
                                color: '#166534',
                                backgroundColor: '#DCFCE7',
                                padding: '1px 5px',
                                borderRadius: '3px',
                              }}
                            >
                              Current
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: '8.5px',
                                fontWeight: 600,
                                color: 'var(--yz-text-muted)',
                              }}
                            >
                              Snapshot
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
                          {dateStr}
                        </span>
                        {ver.measured_by && (
                          <span style={{ fontSize: '10px', color: 'var(--yz-text-secondary)', marginTop: '1px' }}>
                            Tailor: {ver.measured_by}
                          </span>
                        )}
                        {ver.order_number && (
                          <span style={{ fontSize: '9.5px', color: '#1E40AF', marginTop: '2px', fontWeight: 600 }}>
                            Order: {ver.order_number}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Version Parameters Detail */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeVersion ? (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'var(--yz-bg-subtle)',
                        borderRadius: 'var(--yz-radius-sm)',
                        border: '1px solid var(--yz-border)',
                        fontSize: '11px',
                      }}
                    >
                      <div>
                        <strong style={{ color: 'var(--yz-text-primary)' }}>
                          Version {activeVersion.version_number} Parameters
                        </strong>
                        <span style={{ color: 'var(--yz-text-muted)', marginLeft: '8px' }}>
                          Recorded:{' '}
                          {activeVersion.measured_at
                            ? new Date(activeVersion.measured_at).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : '—'}
                        </span>
                      </div>
                      {activeVersion.measured_by && (
                        <span style={{ color: 'var(--yz-text-secondary)', fontWeight: 600 }}>
                          Tailor: {activeVersion.measured_by}
                        </span>
                      )}
                    </div>

                    {/* Fitting Preferences & Tailor Notes */}
                    {(activeVersion.fitting_preferences || activeVersion.tailor_instructions || activeVersion.notes) && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        {activeVersion.fitting_preferences && (
                          <div
                            style={{
                              padding: '6px 10px',
                              backgroundColor: 'var(--yz-bg-subtle)',
                              border: '1px solid var(--yz-border)',
                              borderRadius: 'var(--yz-radius-sm)',
                              fontSize: '11px',
                            }}
                          >
                            <span style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--yz-text-muted)', display: 'block', textTransform: 'uppercase' }}>
                              Fitting Preference
                            </span>
                            <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                              {activeVersion.fitting_preferences}
                            </span>
                          </div>
                        )}

                        {activeVersion.tailor_instructions && (
                          <div
                            style={{
                              padding: '6px 10px',
                              backgroundColor: '#FFFBEB',
                              border: '1px solid #FED7AA',
                              borderRadius: 'var(--yz-radius-sm)',
                              fontSize: '11px',
                            }}
                          >
                            <span style={{ fontSize: '9.5px', fontWeight: 700, color: '#92400E', display: 'block', textTransform: 'uppercase' }}>
                              Workshop Instructions
                            </span>
                            <span style={{ fontWeight: 600, color: '#78350F' }}>
                              {activeVersion.tailor_instructions}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Linked Order Reference */}
                    {activeVersion.order_number && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 10px',
                          backgroundColor: '#EFF6FF',
                          border: '1px solid #BFDBFE',
                          borderRadius: 'var(--yz-radius-sm)',
                          fontSize: '11px',
                          color: '#1E40AF',
                        }}
                      >
                        <FileText size={13} />
                        <span>Used for Sales Order: <strong>{activeVersion.order_number}</strong></span>
                      </div>
                    )}

                    {/* Measurements Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                        gap: '6px',
                        maxHeight: '220px',
                        overflowY: 'auto',
                        paddingRight: '4px',
                      }}
                    >
                      {activeVersion.values.map((v) => {
                        const displayNum =
                          v.numeric_value !== undefined && v.numeric_value !== null
                            ? v.numeric_value
                            : v.num_value;

                        return (
                          <div
                            key={v.id || v.field_id}
                            style={{
                              padding: '6px 8px',
                              backgroundColor: 'var(--yz-bg-surface)',
                              border: '1px solid var(--yz-border)',
                              borderRadius: 'var(--yz-radius-sm)',
                            }}
                          >
                            <div
                              style={{
                                fontSize: '10px',
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
                                fontSize: '12.5px',
                                fontWeight: 800,
                                color: 'var(--yz-text-primary)',
                                marginTop: '2px',
                              }}
                            >
                              {displayNum !== null && displayNum !== undefined ? (
                                <span>
                                  {displayNum}{' '}
                                  <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)', fontWeight: 400 }}>
                                    {v.unit || 'in'}
                                  </span>
                                </span>
                              ) : (
                                <span style={{ color: 'var(--yz-text-muted)', fontWeight: 400 }}>
                                  {v.text_value || '—'}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--yz-border)', paddingTop: '10px' }}>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Tailor Slip Modal for Active Version */}
      {isPrintModalOpen && activeVersion && (
        <PrintTailorSheetModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          customerName={customerName}
          customerPhone={customerPhone}
          profile={profile}
          version={activeVersion}
          availableVersions={versions.length > 0 ? versions : profile?.versions}
        />
      )}
    </>
  );
};
