import React, { useState, useEffect } from 'react';
import {
  Receipt,
  AlertTriangle,
  ArrowRight,
  Plus,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
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
        setRecentMovements(movs.slice(0, 6));
      });
  }, []);

  const lowStockItems = products.filter(
    (p) => productService.getStockStatus(p) !== 'IN_STOCK'
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Clean Invenaro Top Overview Bar */}
      <div
        style={{
          backgroundColor: 'var(--yz-bg-surface)',
          borderRadius: 'var(--yz-radius-sm)',
          padding: '10px 14px',
          border: '1px solid var(--yz-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#16A34A',
              }}
            />
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
              Main Showroom Counter 01 • Active Store Register
            </span>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '2px' }}>
            Yaazhi Atelier Daily Summary
          </div>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <Button
            variant="secondary"
            size="sm"
            icon={<Plus size={13} />}
            onClick={onOpenAddProduct}
          >
            Add Product
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Receipt size={13} />}
            onClick={() => onNavigate('billing')}
          >
            Launch Billing
          </Button>
        </div>
      </div>

      {/* Operational KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '8px',
        }}
      >
        <div className="yz-stat-card">
          <span className="yz-stat-label">Showroom Inventory (Cost)</span>
          <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-primary)' }}>
            ₹{(summary?.inventoryValuationCost || 0).toLocaleString('en-IN')}
          </span>
          <span className="yz-stat-subtext">Acquisition value in active stock</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Retail Gross Value</span>
          <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-gold)' }}>
            ₹{(summary?.inventoryValuationRetail || 0).toLocaleString('en-IN')}
          </span>
          <span className="yz-stat-subtext">Projected showroom turnover</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Active SKUs & Units</span>
          <span className="yz-stat-value tabular-nums">
            {summary?.totalUnits || 0}{' '}
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--yz-text-muted)' }}>
              ({products.length} designs)
            </span>
          </span>
          <span className="yz-stat-subtext">Across boutique counters</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Attention Alerts</span>
          <span
            className="yz-stat-value tabular-nums"
            style={{ color: lowStockItems.length > 0 ? 'var(--yz-status-low-stock)' : 'inherit' }}
          >
            {lowStockItems.length}
          </span>
          <span className="yz-stat-subtext">Items at or below reorder threshold</span>
        </div>
      </div>

      {/* Two Column Layout: Urgent Stock Warnings & Recent Audit Movements */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '10px' }}>
        {/* Urgent Stock Watchlist */}
        <div className="yz-card" style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              paddingBottom: '6px',
              borderBottom: '1px solid var(--yz-border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <AlertTriangle size={14} color="var(--yz-status-low-stock)" />
              <h3 style={{ fontSize: '12px', fontWeight: 600 }}>Stock Depletion Alerts</h3>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="yz-btn yz-btn-ghost yz-btn-sm"
              style={{ fontSize: '11px', color: 'var(--yz-primary)', padding: '0 4px', height: '20px' }}
            >
              <span>Manage Stock</span>
              <ArrowRight size={11} />
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--yz-status-in-stock)', fontSize: '12px' }}>
              All boutique items have healthy stock levels.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
              {lowStockItems.slice(0, 5).map((p) => {
                const status = productService.getStockStatus(p);
                return (
                  <div
                    key={p.id}
                    onClick={() => onViewProductDetail(p)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '5px 8px',
                      backgroundColor: 'var(--yz-bg-subtle)',
                      borderRadius: 'var(--yz-radius-sm)',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--yz-bg-subtle-hover)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--yz-bg-subtle)')}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '12px' }}>{p.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', display: 'flex', gap: '6px' }}>
                        <span style={{ fontFamily: 'var(--yz-font-mono)' }}>{p.sku}</span>
                        <span>•</span>
                        <span>{p.category}</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <StockBadge status={status} stockCount={p.currentStock} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Audit Ledger */}
        <div className="yz-card" style={{ display: 'flex', flexDirection: 'column', padding: '10px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
              paddingBottom: '6px',
              borderBottom: '1px solid var(--yz-border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock size={14} color="var(--yz-text-secondary)" />
              <h3 style={{ fontSize: '12px', fontWeight: 600 }}>Recent Stock Movements</h3>
            </div>
            <button
              onClick={() => onNavigate('movements')}
              className="yz-btn yz-btn-ghost yz-btn-sm"
              style={{ fontSize: '11px', color: 'var(--yz-primary)', padding: '0 4px', height: '20px' }}
            >
              <span>Full Audit Log</span>
              <ArrowRight size={11} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            {recentMovements.map((m) => {
              const isIn = m.movementType === 'IN';
              const isOut = m.movementType === 'OUT';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 6px',
                    borderBottom: '1px solid var(--yz-border-subtle)',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="yz-cell-truncate" style={{ fontWeight: 600, fontSize: '12px', maxWidth: '240px' }}>
                      {m.productName}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>
                      {m.locationName} • {m.performedBy}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      className={`yz-badge ${
                        isIn
                          ? 'yz-badge-in-stock'
                          : isOut
                          ? 'yz-badge-out-stock'
                          : 'yz-badge-gold'
                      }`}
                    >
                      {isIn && <ArrowDownLeft size={10} />}
                      {isOut && <ArrowUpRight size={10} />}
                      {!isIn && !isOut && <SlidersHorizontal size={10} />}
                      {isIn ? `+${m.quantity}` : isOut ? `-${m.quantity}` : `Δ ${m.quantity}`}
                    </span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--yz-font-mono)', fontWeight: 600 }}>
                      Bal: {m.runningBalance}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
