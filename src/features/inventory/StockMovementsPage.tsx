import React, { useState, useEffect } from 'react';
import {
  Search,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Clock,
} from 'lucide-react';
import type { StockMovement, MovementType } from '../../types/inventory';
import { inventoryService } from '../../services/inventoryService';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { Modal } from '../../components/common/Modal';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { CustomDropdown, type DropdownOption } from '../../components/common/CustomDropdown';

const MOVEMENT_TYPE_OPTIONS: DropdownOption[] = [
  { value: 'ALL', label: 'All Movement Types' },
  { value: 'IN', label: 'Stock In (Purchases)' },
  { value: 'OUT', label: 'Stock Out (Sales)' },
  { value: 'ADJUST', label: 'Manual Adjustments' },
  { value: 'TRANSFER', label: 'Internal Transfers' },
];

export const StockMovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [typeFilter, setTypeFilter] = useState<MovementType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null);

  const loadMovements = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await inventoryService.getMovements();
      setMovements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMovements();
  }, [loadMovements]);

  const filtered = movements.filter((m) => {
    if (typeFilter !== 'ALL' && m.movementType !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        m.productName.toLowerCase().includes(q) ||
        m.sku.toLowerCase().includes(q) ||
        (m.referenceId && m.referenceId.toLowerCase().includes(q)) ||
        (m.notes && m.notes.toLowerCase().includes(q))
      );
    }
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
    resetDependencies: [search, typeFilter],
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Compact Search & Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--yz-bg-surface)',
          padding: '8px 10px',
          borderRadius: 'var(--yz-radius-sm)',
          border: '1px solid var(--yz-border)',
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flex: 1, minWidth: '240px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
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
              placeholder="Search movements by product, SKU, or reference #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="yz-input"
              style={{ paddingLeft: '26px' }}
            />
          </div>

          <CustomDropdown
            value={typeFilter}
            onChange={(val) => setTypeFilter(val as any)}
            options={MOVEMENT_TYPE_OPTIONS}
            minWidth="155px"
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw size={13} />}
          onClick={loadMovements}
          title="Reload audit records"
        >
          Refresh Log
        </Button>
      </div>

      {/* Compact Single-Line Movements Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={7} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Clock size={24} />}
          title="No movement records found"
          description="There are no inventory entries matching your active filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setTypeFilter('ALL');
          }}
        />
      ) : (
        <div className="yz-table-container">
          <table className="yz-table" style={{ width: '100%', tableLayout: 'fixed' }}>
            <thead>
              <tr>
                <th style={{ width: '140px', paddingLeft: '12px' }}>TIMESTAMP</th>
                <th style={{ width: '84px', textAlign: 'center' }}>TYPE</th>
                <th style={{ width: '26%', minWidth: '180px' }}>PRODUCT & WEAVE</th>
                <th style={{ width: '110px' }}>SKU</th>
                <th style={{ width: '95px', textAlign: 'right' }}>QTY CHANGE</th>
                <th style={{ minWidth: '220px' }}>AUDIT JUSTIFICATION / REF</th>
                <th style={{ width: '90px', textAlign: 'right', paddingRight: '14px' }}>BALANCE</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((m) => {
                const isIn = m.movementType === 'IN';
                const isOut = m.movementType === 'OUT';

                const badgeStyle: React.CSSProperties = {
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  width: '70px',
                  height: '22px',
                  borderRadius: 'var(--yz-radius-sm, 4px)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.02em',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                  padding: '0 4px',
                };

                return (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedMovement(m)}
                    style={{ cursor: 'pointer' }}
                    title="Click to view full movement details"
                  >
                    {/* 1. TIMESTAMP */}
                    <td style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', whiteSpace: 'nowrap', paddingLeft: '12px' }}>
                      {new Date(m.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    {/* 2. TYPE */}
                    <td style={{ textAlign: 'center' }}>
                      {isIn ? (
                        <span
                          style={{
                            ...badgeStyle,
                            backgroundColor: '#ECFDF5',
                            color: '#065F46',
                            border: '1px solid #A7F3D0',
                          }}
                        >
                          <ArrowDownLeft size={11} strokeWidth={2.5} />
                          <span>IN</span>
                        </span>
                      ) : isOut ? (
                        <span
                          style={{
                            ...badgeStyle,
                            backgroundColor: '#FEF2F2',
                            color: '#991B1B',
                            border: '1px solid #FECACA',
                          }}
                        >
                          <ArrowUpRight size={11} strokeWidth={2.5} />
                          <span>OUT</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            ...badgeStyle,
                            backgroundColor: '#FFFBEB',
                            color: '#92400E',
                            border: '1px solid #FDE68A',
                          }}
                        >
                          <SlidersHorizontal size={10} strokeWidth={2.2} />
                          <span>ADJUST</span>
                        </span>
                      )}
                    </td>

                    {/* 3. PRODUCT & WEAVE */}
                    <td>
                      <div
                        className="yz-cell-truncate"
                        style={{ fontWeight: 600, color: 'var(--yz-text-primary)', maxWidth: '100%' }}
                        title={m.productName}
                      >
                        {m.productName}
                      </div>
                    </td>

                    {/* 4. SKU */}
                    <td
                      style={{
                        fontFamily: 'var(--yz-font-mono)',
                        fontSize: '11px',
                        color: 'var(--yz-text-secondary)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {m.sku}
                    </td>

                    {/* 5. QTY CHANGE */}
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        fontFamily: 'var(--yz-font-mono)',
                        fontSize: '12px',
                        whiteSpace: 'nowrap',
                        color: isIn
                          ? 'var(--yz-status-in-stock, #16A34A)'
                          : isOut
                          ? 'var(--yz-status-out-stock, #DC2626)'
                          : 'var(--yz-text-primary)',
                      }}
                      className="tabular-nums"
                    >
                      {isIn ? `+${m.quantity}` : isOut ? `-${m.quantity}` : `Δ ${m.quantity}`}
                    </td>

                    {/* 6. AUDIT JUSTIFICATION / REF */}
                    <td style={{ fontSize: '11px' }}>
                      <div
                        className="yz-cell-truncate"
                        style={{ maxWidth: '100%' }}
                        title={
                          m.reasonCode
                            ? `[${m.reasonCode}] ${m.notes || m.referenceId || ''}`
                            : `${m.referenceType}: ${m.referenceId || ''}${m.notes ? ` (${m.notes})` : ''}`
                        }
                      >
                        {m.reasonCode ? (
                          <>
                            <span
                              style={{
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                color: 'var(--yz-text-secondary)',
                                marginRight: '4px',
                              }}
                            >
                              [{m.reasonCode}]
                            </span>
                            <span>{m.notes || m.referenceId}</span>
                          </>
                        ) : (
                          <span>
                            {m.referenceType}: {m.referenceId}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 7. BALANCE */}
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        fontFamily: 'var(--yz-font-mono)',
                        whiteSpace: 'nowrap',
                        paddingRight: '14px',
                      }}
                      className="tabular-nums"
                    >
                      {m.runningBalance}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Compact Shared Pagination Bar */}
          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            itemLabel="movements"
          />
        </div>
      )}

      {/* Movement Detail Modal */}
      {selectedMovement && (
        <Modal
          isOpen={!!selectedMovement}
          onClose={() => setSelectedMovement(null)}
          title="Stock Audit Record"
          subtitle={`Ledger entry #${selectedMovement.id}`}
          maxWidth="480px"
          footer={
            <Button variant="secondary" size="sm" onClick={() => setSelectedMovement(null)}>
              Close
            </Button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '8px',
                backgroundColor: 'var(--yz-bg-subtle)',
                padding: '10px',
                borderRadius: 'var(--yz-radius-sm)',
              }}
            >
              <div>
                <span className="yz-stat-label">Product Name</span>
                <div style={{ fontWeight: 600, fontSize: '12px', marginTop: '2px' }}>
                  {selectedMovement.productName}
                </div>
              </div>

              <div>
                <span className="yz-stat-label">SKU Code</span>
                <div
                  style={{
                    fontFamily: 'var(--yz-font-mono)',
                    fontWeight: 600,
                    fontSize: '12px',
                    marginTop: '2px',
                  }}
                >
                  {selectedMovement.sku}
                </div>
              </div>

              <div>
                <span className="yz-stat-label">Movement Type</span>
                <div style={{ marginTop: '2px' }}>
                  <span
                    className={`yz-badge ${
                      selectedMovement.movementType === 'IN'
                        ? 'yz-badge-in-stock'
                        : selectedMovement.movementType === 'OUT'
                        ? 'yz-badge-out-stock'
                        : 'yz-badge-gold'
                    }`}
                  >
                    {selectedMovement.movementType}
                  </span>
                </div>
              </div>

              <div>
                <span className="yz-stat-label">Quantity Impact</span>
                <div
                  style={{
                    fontFamily: 'var(--yz-font-mono)',
                    fontWeight: 700,
                    fontSize: '13px',
                    marginTop: '2px',
                  }}
                >
                  {selectedMovement.movementType === 'IN'
                    ? `+${selectedMovement.quantity}`
                    : selectedMovement.movementType === 'OUT'
                    ? `-${selectedMovement.quantity}`
                    : `Δ ${selectedMovement.quantity}`}
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--yz-text-muted)', marginLeft: '6px' }}>
                    (Balance: {selectedMovement.runningBalance})
                  </span>
                </div>
              </div>

              <div>
                <span className="yz-stat-label">Timestamp</span>
                <div style={{ fontSize: '11px', marginTop: '2px', color: 'var(--yz-text-secondary)' }}>
                  {new Date(selectedMovement.timestamp).toLocaleString('en-IN', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </div>
              </div>

              <div>
                <span className="yz-stat-label">Counter / Location</span>
                <div style={{ fontSize: '11px', marginTop: '2px', color: 'var(--yz-text-secondary)' }}>
                  {selectedMovement.locationName}
                </div>
              </div>

              <div>
                <span className="yz-stat-label">Authorized Staff</span>
                <div style={{ fontSize: '11px', marginTop: '2px', color: 'var(--yz-text-secondary)' }}>
                  {selectedMovement.performedBy}
                </div>
              </div>

              <div>
                <span className="yz-stat-label">Reference ID</span>
                <div
                  style={{
                    fontFamily: 'var(--yz-font-mono)',
                    fontSize: '11px',
                    marginTop: '2px',
                    color: 'var(--yz-text-secondary)',
                  }}
                >
                  {selectedMovement.referenceType}: {selectedMovement.referenceId || 'N/A'}
                </div>
              </div>
            </div>

            {selectedMovement.reasonCode && (
              <div
                style={{
                  border: '1px solid var(--yz-border)',
                  padding: '8px 10px',
                  borderRadius: 'var(--yz-radius-sm)',
                }}
              >
                <div className="yz-stat-label" style={{ marginBottom: '3px' }}>
                  Audit Justification & Notes ({selectedMovement.reasonCode})
                </div>
                <p style={{ fontSize: '12px', color: 'var(--yz-text-primary)', lineHeight: 1.4 }}>
                  {selectedMovement.notes || 'No extra notes recorded.'}
                </p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
