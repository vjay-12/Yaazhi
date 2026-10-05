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

export const StockMovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [typeFilter, setTypeFilter] = useState<MovementType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--yz-bg-surface)',
          padding: '1rem',
          borderRadius: 'var(--yz-radius-lg)',
          border: '1px solid var(--yz-border)',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '10px',
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
              style={{ paddingLeft: '2rem' }}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="yz-select"
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="ALL">All Movement Types</option>
            <option value="IN">Stock In (Purchases)</option>
            <option value="OUT">Stock Out (Counter Sales)</option>
            <option value="ADJUST">Adjustments & Audits</option>
            <option value="TRANSFER">Inter-store Transfers</option>
          </select>
        </div>

        <Button
          variant="secondary"
          icon={<RefreshCw size={15} />}
          onClick={loadMovements}
          title="Reload audit records"
        >
          Refresh Log
        </Button>
      </div>

      {/* Movements Table */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Clock size={28} />}
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
          <table className="yz-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Movement Type</th>
                <th>Product & Weave</th>
                <th>SKU</th>
                <th style={{ textAlign: 'center' }}>Qty Change</th>
                <th>Location / Counter</th>
                <th>Audit Justification / Ref</th>
                <th>Authorized Staff</th>
                <th style={{ textAlign: 'right' }}>Running Balance</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const isIn = m.movementType === 'IN';
                const isOut = m.movementType === 'OUT';
                return (
                  <tr key={m.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--yz-text-secondary)', whiteSpace: 'nowrap' }}>
                      {new Date(m.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>

                    <td>
                      <span
                        className={`yz-badge ${
                          isIn
                            ? 'yz-badge-in-stock'
                            : isOut
                            ? 'yz-badge-out-stock'
                            : 'yz-badge-gold'
                        }`}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        {isIn && <ArrowDownLeft size={13} />}
                        {isOut && <ArrowUpRight size={13} />}
                        {!isIn && !isOut && <SlidersHorizontal size={13} />}
                        {m.movementType}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{m.productName}</div>
                    </td>

                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '0.8rem', color: 'var(--yz-text-secondary)' }}>
                      {m.sku}
                    </td>

                    <td
                      style={{
                        textAlign: 'center',
                        fontWeight: 700,
                        fontFamily: 'var(--yz-font-mono)',
                        color: isIn
                          ? 'var(--yz-status-in-stock)'
                          : isOut
                          ? 'var(--yz-status-out-stock)'
                          : 'var(--yz-text-primary)',
                      }}
                      className="tabular-nums"
                    >
                      {isIn ? `+${m.quantity}` : isOut ? `-${m.quantity}` : `Δ ${m.quantity}`}
                    </td>

                    <td style={{ fontSize: '0.85rem' }}>{m.locationName}</td>

                    <td style={{ fontSize: '0.8rem' }}>
                      {m.reasonCode ? (
                        <div>
                          <span
                            style={{
                              textTransform: 'uppercase',
                              fontWeight: 700,
                              color: 'var(--yz-text-secondary)',
                              marginRight: '0.35rem',
                            }}
                          >
                            [{m.reasonCode}]
                          </span>
                          <span>{m.notes || m.referenceId}</span>
                        </div>
                      ) : (
                        <span>
                          {m.referenceType}: {m.referenceId}
                        </span>
                      )}
                    </td>

                    <td style={{ fontSize: '0.85rem', color: 'var(--yz-text-secondary)' }}>
                      {m.performedBy}
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        fontFamily: 'var(--yz-font-mono)',
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
        </div>
      )}
    </div>
  );
};
