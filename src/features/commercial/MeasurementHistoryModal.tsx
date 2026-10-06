import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import {
  customerService,
  type CustomerMeasurementProfile,
  type CustomerMeasurementVersion,
} from '../../services/customerService';
import { useToast } from '../../components/common/Toast';
import { Loader2, Copy, Plus } from 'lucide-react';

interface MeasurementHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  profile: CustomerMeasurementProfile | null;
  onRecordNewVersion?: () => void;
  onProfileCloned?: () => void;
}

export const MeasurementHistoryModal: React.FC<MeasurementHistoryModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  profile,
  onRecordNewVersion,
  onProfileCloned,
}) => {
  const { showToast } = useToast();
  const [versions, setVersions] = useState<CustomerMeasurementVersion[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCloning, setIsCloning] = useState(false);

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

  if (!profile) return null;

  const activeVersion = versions.find((v) => v.id === selectedVersionId) || versions[0];

  const handleClone = async () => {
    try {
      setIsCloning(true);
      await customerService.cloneMeasurementProfile(customerId, profile.id);
      showToast({
        type: 'success',
        title: 'Profile Cloned',
        message: `Created copy of ${profile.profile_name}`,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Measurement History — ${profile.profile_name}`}
      subtitle={`Customer: ${customerName} • ${versions.length} recorded version${versions.length === 1 ? '' : 's'}`}
      maxWidth="720px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Top Action Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'var(--yz-bg-subtle)',
            padding: '8px 12px',
            borderRadius: 'var(--yz-radius-sm)',
            border: '1px solid var(--yz-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--yz-text-primary)' }}>
              Garment: {profile.template_name || 'Boutique Garment'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <Button
              variant="secondary"
              size="sm"
              icon={<Copy size={12} />}
              onClick={handleClone}
              disabled={isCloning}
              style={{ fontSize: '11px' }}
            >
              {isCloning ? 'Cloning...' : 'Clone Profile'}
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
          <div style={{ display: 'grid', gridTemplateColumns: '190px 1fr', gap: '14px', minHeight: '320px' }}>
            {/* Version Timeline Selector */}
            <div
              style={{
                borderRight: '1px solid var(--yz-border)',
                paddingRight: '10px',
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '300px' }}>
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
                        border: isSelected ? '1px solid var(--yz-primary, #832729)' : '1px solid var(--yz-border)',
                        backgroundColor: isSelected ? '#FEF2F2' : 'var(--yz-bg-surface)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: isSelected ? 700 : 600,
                            color: isSelected ? 'var(--yz-primary, #832729)' : 'var(--yz-text-primary)',
                          }}
                        >
                          Version {ver.version_number}
                        </span>
                        {ver.is_current && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 600,
                              color: '#166534',
                              backgroundColor: '#DCFCE7',
                              padding: '1px 5px',
                              borderRadius: '3px',
                            }}
                          >
                            Current
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
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Version Parameters Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeVersion ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 10px',
                      backgroundColor: 'var(--yz-bg-subtle)',
                      borderRadius: 'var(--yz-radius-sm)',
                      border: '1px solid var(--yz-border)',
                      fontSize: '11px',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--yz-text-primary)' }}>
                        Version {activeVersion.version_number} Specifications
                      </strong>
                      <span style={{ color: 'var(--yz-text-muted)', marginLeft: '8px' }}>
                        Recorded:{' '}
                        {activeVersion.measured_at
                          ? new Date(activeVersion.measured_at).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '-'}
                      </span>
                    </div>
                    {activeVersion.measured_by && (
                      <span style={{ color: 'var(--yz-text-secondary)', fontWeight: 500 }}>
                        Master Tailor: <strong>{activeVersion.measured_by}</strong>
                      </span>
                    )}
                  </div>

                  {activeVersion.notes && (
                    <div
                      style={{
                        padding: '6px 10px',
                        backgroundColor: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: 'var(--yz-radius-sm)',
                        fontSize: '11px',
                        color: '#92400E',
                        fontStyle: 'italic',
                      }}
                    >
                      "{activeVersion.notes}"
                    </div>
                  )}

                  {/* Measurements Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                      gap: '6px',
                      maxHeight: '230px',
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
                              fontSize: '12px',
                              fontWeight: 700,
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
                              <span style={{ color: 'var(--yz-text-muted)', fontWeight: 400 }}>{v.text_value || '—'}</span>
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

        <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--yz-border)', paddingTop: '8px' }}>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
