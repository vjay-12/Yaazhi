import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Badge } from '../../../components/common/Badge';
import { RefreshCw, Filter } from 'lucide-react';
import { expensesSuppliesService } from '../../../services/expensesSuppliesService';
import type { SupplyItem, SupplyMovement, SupplyMovementType } from '../../../services/expensesSuppliesService';

interface SupplyMovementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSupply?: SupplyItem | null;
}

export const SupplyMovementsModal: React.FC<SupplyMovementsModalProps> = ({
  isOpen,
  onClose,
  selectedSupply,
}) => {
  const [movements, setMovements] = useState<SupplyMovement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [movementTypeFilter, setMovementTypeFilter] = useState<string>('ALL');
  const [stitchingSearch, setStitchingSearch] = useState('');

  const loadMovements = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await expensesSuppliesService.getMovements({
        supply_id: selectedSupply?.id,
        movement_type: movementTypeFilter !== 'ALL' ? (movementTypeFilter as SupplyMovementType) : undefined,
        stitching_order_number: stitchingSearch.trim() || undefined,
        limit: 100,
      });
      setMovements(data);
    } catch (err) {
      console.error('Failed to load supply movements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSupply, movementTypeFilter, stitchingSearch]);

  useEffect(() => {
    if (isOpen) {
      loadMovements();
    }
  }, [isOpen, loadMovements]);

  const getMovementBadge = (type: SupplyMovementType) => {
    switch (type) {
      case 'PURCHASE_RECEIPT':
        return <Badge variant="success">PURCHASE RECEIPT</Badge>;
      case 'CONSUMPTION':
        return <Badge variant="danger">CONSUMPTION</Badge>;
      case 'ADJUSTMENT_ADD':
        return <Badge variant="info">STOCK AUDIT (+)</Badge>;
      case 'ADJUSTMENT_REDUCE':
        return <Badge variant="warning">STOCK AUDIT (-)</Badge>;
      case 'RETURN_OUT':
        return <Badge variant="neutral">RETURN / CANCEL</Badge>;
      default:
        return <Badge variant="neutral">{type}</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        selectedSupply
          ? `Movement Ledger: ${selectedSupply.name} (${selectedSupply.sku})`
          : 'Atelier Supplies — Complete Movement Audit Ledger'
      }
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '70vh' }}>
        {/* Filter Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            flexWrap: 'wrap',
            padding: '8px 12px',
            backgroundColor: 'var(--yz-bg-subtle)',
            borderRadius: 'var(--yz-radius-md)',
            border: '1px solid var(--yz-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <Filter size={14} style={{ color: 'var(--yz-text-muted)' }} />
            <select
              value={movementTypeFilter}
              onChange={(e) => setMovementTypeFilter(e.target.value)}
              className="yz-input"
              style={{ padding: '4px 8px', fontSize: '12px' }}
            >
              <option value="ALL">All Movement Types</option>
              <option value="PURCHASE_RECEIPT">Purchase Receipt</option>
              <option value="CONSUMPTION">Consumption (Tailoring/Atelier)</option>
              <option value="ADJUSTMENT_ADD">Audit Adjustment (+)</option>
              <option value="ADJUSTMENT_REDUCE">Audit Adjustment (-)</option>
              <option value="RETURN_OUT">Return / Cancellation</option>
            </select>

            <input
              type="text"
              placeholder="Filter by Stitching Order #"
              value={stitchingSearch}
              onChange={(e) => setStitchingSearch(e.target.value)}
              className="yz-input"
              style={{ padding: '4px 8px', fontSize: '12px', width: '180px' }}
            />
          </div>

          <Button variant="secondary" size="sm" onClick={loadMovements} disabled={isLoading}>
            <RefreshCw size={12} className={isLoading ? 'yz-spin' : ''} style={{ marginRight: '4px' }} />
            Refresh Log
          </Button>
        </div>

        {/* Ledger Table */}
        <div
          style={{
            overflowY: 'auto',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-radius-md)',
          }}
        >
          <table className="yz-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--yz-bg-subtle)', textAlign: 'left' }}>
                <th style={{ padding: '8px 10px' }}>Date & Time</th>
                {!selectedSupply && <th style={{ padding: '8px 10px' }}>Supply Item</th>}
                <th style={{ padding: '8px 10px' }}>Type</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Qty Change</th>
                <th style={{ padding: '8px 10px', textAlign: 'right' }}>Balance After</th>
                <th style={{ padding: '8px 10px' }}>Reference / Stitching Order</th>
                <th style={{ padding: '8px 10px' }}>Notes</th>
                <th style={{ padding: '8px 10px' }}>Staff</th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td
                    colSpan={selectedSupply ? 7 : 8}
                    style={{ textAlign: 'center', padding: '30px', color: 'var(--yz-text-muted)' }}
                  >
                    {isLoading ? 'Loading audit records...' : 'No movement ledger records found.'}
                  </td>
                </tr>
              ) : (
                movements.map((m) => {
                  const qty = Number(m.quantity);
                  const isPositive = qty > 0;
                  const formattedDate = new Date(m.created_at).toLocaleString('en-IN', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  });

                  return (
                    <tr key={m.id} style={{ borderBottom: '1px solid var(--yz-border)' }}>
                      <td style={{ padding: '8px 10px', whiteSpace: 'nowrap', color: 'var(--yz-text-secondary)' }}>
                        {formattedDate}
                      </td>

                      {!selectedSupply && (
                        <td style={{ padding: '8px 10px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                            {m.supply?.name || 'Supply Item'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', display: 'block' }}>
                            {m.supply?.sku}
                          </span>
                        </td>
                      )}

                      <td style={{ padding: '8px 10px' }}>{getMovementBadge(m.movement_type)}</td>

                      <td
                        style={{
                          padding: '8px 10px',
                          textAlign: 'right',
                          fontWeight: 700,
                          color: isPositive ? 'var(--yz-success, #16a34a)' : 'var(--yz-danger, #ef4444)',
                        }}
                      >
                        {isPositive ? `+${qty}` : qty} {m.supply?.unit || ''}
                      </td>

                      <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 600 }}>
                        {Number(m.balance_after)} {m.supply?.unit || ''}
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        {m.stitching_order_number ? (
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(99, 102, 241, 0.12)',
                              color: 'var(--yz-primary)',
                              fontWeight: 600,
                              fontSize: '11px',
                            }}
                          >
                            🧵 {m.stitching_order_number}
                          </span>
                        ) : m.reference_type ? (
                          <span style={{ fontSize: '11px', color: 'var(--yz-text-secondary)' }}>
                            {m.reference_type}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--yz-text-muted)' }}>—</span>
                        )}
                      </td>

                      <td
                        style={{
                          padding: '8px 10px',
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--yz-text-secondary)',
                        }}
                        title={m.notes || ''}
                      >
                        {m.notes || '—'}
                      </td>

                      <td style={{ padding: '8px 10px', color: 'var(--yz-text-muted)', fontSize: '11px' }}>
                        {m.created_by || 'Staff'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '8px' }}>
          <Button variant="secondary" size="md" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
