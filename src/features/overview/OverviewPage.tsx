import React, { useState, useEffect } from 'react';
import {
  Receipt,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
} from 'lucide-react';
import type { YaazhiProduct } from '../../types/product';
import type { StockMovement, StockSummary } from '../../types/inventory';
import { productService } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { StockBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import type { NavTabId } from '../../components/layout/Sidebar';

interface OverviewPageProps {
  onNavigate: (tab: NavTabId) => void;
  onViewProductDetail: (product: YaazhiProduct) => void;
  onOpenAddProduct: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  onViewProductDetail,
  onOpenAddProduct,
}) => {
  const [products, setProducts] = useState<YaazhiProduct[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [recentMovements, setRecentMovements] = useState<StockMovement[]>([]);

  useEffect(() => {
    Promise.all([
      productService.list(),
      inventoryService.getStockSummary(),
      inventoryService.getMovements(),
    ])
      .then(([prods, sum, movs]) => {
        setProducts(prods);
        setSummary(sum);
        setRecentMovements(movs.slice(0, 5));
      });
  }, []);

  const lowStockItems = products.filter(
    (p) => productService.getStockStatus(p) !== 'IN_STOCK'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome Banner with Operational Context */}
      <div
        style={{
          background: 'linear-gradient(135deg, #241C1B 0%, #171312 100%)',
          borderRadius: 'var(--yz-radius-xl)',
          padding: '1.75rem 2rem',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
          border: '1px solid #3A2F2E',
          boxShadow: 'var(--yz-shadow-md)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span
              style={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--yz-gold)',
                fontWeight: 700,
              }}
            >
              Main Boutique Floor • Counter 01
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            Good afternoon, Yaazhi Atelier
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#B3AAA6', marginTop: '0.25rem', maxWidth: '520px' }}>
            Showroom registers are synchronized. You have {lowStockItems.length} items flagged for attention and {summary?.totalUnits || 0} pieces active in inventory.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button
            variant="gold"
            icon={<Receipt size={16} />}
            onClick={() => onNavigate('billing')}
            size="lg"
          >
            Launch POS Counter
          </Button>

          <Button
            variant="secondary"
            icon={<Plus size={16} />}
            onClick={onOpenAddProduct}
            size="lg"
            style={{ backgroundColor: '#2E2423', color: '#FFFFFF', borderColor: '#453836' }}
          >
            Add Weave / Item
          </Button>
        </div>
      </div>

      {/* Operational KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="yz-stat-card">
          <span className="yz-stat-label">Showroom Inventory (Cost)</span>
          <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-primary)' }}>
            ₹{(summary?.inventoryValuationCost || 0).toLocaleString('en-IN')}
          </span>
          <span className="yz-stat-subtext">Acquisition value in catalog</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Retail Potential Gross</span>
          <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-gold)' }}>
            ₹{(summary?.inventoryValuationRetail || 0).toLocaleString('en-IN')}
          </span>
          <span className="yz-stat-subtext">Projected showroom turnover</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Active Boutique SKUs</span>
          <span className="yz-stat-value tabular-nums">{summary?.totalSkus || 0}</span>
          <span className="yz-stat-subtext">Across {products.length > 0 ? 8 : 0} distinct categories</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Stock Warnings</span>
          <span
            className="yz-stat-value tabular-nums"
            style={{ color: lowStockItems.length > 0 ? 'var(--yz-status-low-stock)' : 'inherit' }}
          >
            {lowStockItems.length}
          </span>
          <span className="yz-stat-subtext">Requires replenishment</span>
        </div>
      </div>

      {/* Two Column Layout: Urgent Stock Warnings & Recent Audit Movements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Urgent Stock Watchlist */}
        <div className="yz-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--yz-border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} color="var(--yz-status-low-stock)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Stock Depletion Alerts</h3>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="yz-btn yz-btn-ghost yz-btn-sm"
              style={{ fontSize: '0.75rem', color: 'var(--yz-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Manage Stock</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--yz-status-in-stock)', fontSize: '0.875rem' }}>
              All boutique items have healthy stock levels above reorder thresholds.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flex: 1 }}>
              {lowStockItems.slice(0, 4).map((p) => {
                const status = productService.getStockStatus(p);
                return (
                  <div
                    key={p.id}
                    onClick={() => onViewProductDetail(p)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem 0.85rem',
                      backgroundColor: 'var(--yz-bg-subtle)',
                      borderRadius: 'var(--yz-radius-md)',
                      cursor: 'pointer',
                      transition: 'background-color 0.12s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--yz-bg-subtle-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--yz-bg-subtle)')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--yz-text-secondary)', display: 'flex', gap: '0.5rem' }}>
                        <span>SKU: {p.sku}</span>
                        <span>•</span>
                        <span>{p.category}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <StockBadge status={status} stockCount={p.currentStock} />
                      <div style={{ fontSize: '0.7rem', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
                        Threshold: {p.reorderPoint}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Audit Ledger */}
        <div className="yz-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--yz-border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--yz-text-secondary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Recent Stock Movements</h3>
            </div>
            <button
              onClick={() => onNavigate('movements')}
              className="yz-btn yz-btn-ghost yz-btn-sm"
              style={{ fontSize: '0.75rem', color: 'var(--yz-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Full Ledger</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', flex: 1 }}>
            {recentMovements.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.65rem 0.85rem',
                  borderBottom: '1px solid var(--yz-border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{m.productName}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--yz-text-muted)' }}>
                    {m.locationName} • {m.performedBy}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span
                    className={`yz-badge ${
                      m.movementType === 'IN'
                        ? 'yz-badge-in-stock'
                        : m.movementType === 'OUT'
                        ? 'yz-badge-out-stock'
                        : 'yz-badge-gold'
                    }`}
                  >
                    {m.movementType === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                  </span>
                  <div style={{ fontSize: '0.7rem', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
                    Bal: {m.runningBalance}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
