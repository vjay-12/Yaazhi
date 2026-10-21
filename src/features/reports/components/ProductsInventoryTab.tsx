import React, { useState } from 'react';
import {
  Package,
  Layers,
  AlertTriangle,
  Tag,
} from 'lucide-react';
import type { InventoryReportData } from '../../../services/reportService';

interface ProductsInventoryTabProps {
  inventory: InventoryReportData;
}

export const ProductsInventoryTab: React.FC<ProductsInventoryTabProps> = ({ inventory }) => {
  const [filterHealth, setFilterHealth] = useState<'ALL' | 'HEALTHY' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  const filteredItems = inventory.items.filter((i) => {
    if (filterHealth === 'ALL') return true;
    return i.status === filterHealth;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* 1. INVENTORY VALUATION & STOCK HEALTH KPI CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Active SKUs & Total Units */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Active Ready-Made SKUs
            </span>
            <Package size={15} style={{ color: 'var(--yz-text-muted)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            {inventory.active_sku_count}{' '}
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--yz-text-secondary)' }}>SKUs</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            {inventory.total_stock_units} physical garments in stock
          </div>
        </div>

        {/* Current Inventory Valuation at Cost */}
        <div className="yz-card" style={{ padding: '12px 14px', borderLeft: '3px solid var(--yz-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-primary)', textTransform: 'uppercase' }}>
              Valuation at Cost
            </span>
            <Layers size={15} style={{ color: 'var(--yz-primary)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(inventory.inventory_valuation_cost).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Authoritative cost basis asset valuation
          </div>
        </div>

        {/* Potential Retail Value */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Potential Retail Value
            </span>
            <Tag size={15} style={{ color: '#0284c7' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#0284c7', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            ₹{Math.round(inventory.inventory_valuation_retail).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Unrealized gross potential: ₹{Math.round(inventory.unrealized_retail_potential).toLocaleString('en-IN')}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Low Stock Alerts
            </span>
            <AlertTriangle size={15} style={{ color: inventory.low_stock_count > 0 ? '#d97706' : '#16a34a' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: inventory.low_stock_count > 0 ? '#d97706' : '#16a34a', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            {inventory.low_stock_count}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            Current stock below reorder point
          </div>
        </div>

        {/* Out of Stock (Depleted) */}
        <div className="yz-card" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
              Out of Stock (Zero)
            </span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: inventory.out_of_stock_count > 0 ? '#dc2626' : '#16a34a' }}>
              {inventory.out_of_stock_count > 0 ? 'Replenish' : 'Healthy'}
            </span>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: inventory.out_of_stock_count > 0 ? '#dc2626' : 'var(--yz-text-primary)', marginTop: '4px', fontFamily: 'var(--yz-font-mono)' }}>
            {inventory.out_of_stock_count}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
            SKUs completely sold out
          </div>
        </div>
      </div>

      {/* 2. STOCK HEALTH BREAKDOWN BAR */}
      <div className="yz-card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
          <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
            Stock Health Breakdown ({inventory.active_sku_count} Active SKUs)
          </span>
          <div style={{ display: 'flex', gap: '14px', fontSize: '11.5px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#16a34a' }} />
              Healthy: <strong>{inventory.stock_health.healthy}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#d97706' }} />
              Low Stock: <strong>{inventory.stock_health.low_stock}</strong>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc2626' }} />
              Out of Stock: <strong>{inventory.stock_health.out_of_stock}</strong>
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--yz-bg-subtle)', borderRadius: '4px', display: 'flex', overflow: 'hidden' }}>
          {inventory.active_sku_count > 0 && (
            <>
              <div
                style={{
                  width: `${(inventory.stock_health.healthy / inventory.active_sku_count) * 100}%`,
                  backgroundColor: '#16a34a',
                }}
                title={`Healthy: ${inventory.stock_health.healthy}`}
              />
              <div
                style={{
                  width: `${(inventory.stock_health.low_stock / inventory.active_sku_count) * 100}%`,
                  backgroundColor: '#d97706',
                }}
                title={`Low Stock: ${inventory.stock_health.low_stock}`}
              />
              <div
                style={{
                  width: `${(inventory.stock_health.out_of_stock / inventory.active_sku_count) * 100}%`,
                  backgroundColor: '#dc2626',
                }}
                title={`Out of Stock: ${inventory.stock_health.out_of_stock}`}
              />
            </>
          )}
        </div>
      </div>

      {/* 3. CURRENT STOCK POSITION & VALUATION TABLE */}
      <div className="yz-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
            Current Product Stock Position & Valuation Ledger
          </h3>

          {/* Quick Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setFilterHealth('ALL')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: filterHealth === 'ALL' ? 'var(--yz-primary)' : 'var(--yz-bg-subtle)',
                color: filterHealth === 'ALL' ? '#ffffff' : 'var(--yz-text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              All ({inventory.items.length})
            </button>
            <button
              onClick={() => setFilterHealth('LOW_STOCK')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: filterHealth === 'LOW_STOCK' ? '#d97706' : 'var(--yz-bg-subtle)',
                color: filterHealth === 'LOW_STOCK' ? '#ffffff' : 'var(--yz-text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Low Stock ({inventory.stock_health.low_stock})
            </button>
            <button
              onClick={() => setFilterHealth('OUT_OF_STOCK')}
              style={{
                padding: '4px 10px',
                borderRadius: '4px',
                border: 'none',
                backgroundColor: filterHealth === 'OUT_OF_STOCK' ? '#dc2626' : 'var(--yz-bg-subtle)',
                color: filterHealth === 'OUT_OF_STOCK' ? '#ffffff' : 'var(--yz-text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Out of Stock ({inventory.stock_health.out_of_stock})
            </button>
          </div>
        </div>

        {filteredItems.length === 0 ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
            No products match the selected stock condition.
          </div>
        ) : (
          <div className="yz-table-container">
            <table className="yz-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th style={{ width: '110px' }}>SKU</th>
                  <th style={{ width: '120px' }}>CATEGORY</th>
                  <th style={{ width: '85px', textAlign: 'center' }}>STOCK</th>
                  <th style={{ width: '85px', textAlign: 'center' }}>REORDER</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>COST PRICE</th>
                  <th style={{ width: '100px', textAlign: 'right' }}>RETAIL PRICE</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>COST VALUATION</th>
                  <th style={{ width: '120px', textAlign: 'right' }}>RETAIL POTENTIAL</th>
                  <th style={{ width: '110px', textAlign: 'center' }}>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{prod.name}</strong>
                    </td>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px' }}>
                      {prod.sku}
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>
                      {prod.category}
                    </td>
                    <td
                      style={{
                        textAlign: 'center',
                        fontWeight: 700,
                        fontFamily: 'var(--yz-font-mono)',
                        color:
                          prod.status === 'OUT_OF_STOCK'
                            ? '#dc2626'
                            : prod.status === 'LOW_STOCK'
                            ? '#d97706'
                            : 'var(--yz-text-primary)',
                      }}
                    >
                      {prod.current_quantity}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-text-muted)' }}>
                      {prod.min_stock_level}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--yz-font-mono)' }}>
                      ₹{Math.round(prod.purchase_price).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--yz-font-mono)' }}>
                      ₹{Math.round(prod.sale_price).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-text-primary)' }}>
                      ₹{Math.round(prod.valuation_at_cost).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)', color: '#0284c7' }}>
                      ₹{Math.round(prod.valuation_at_retail).toLocaleString('en-IN')}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--yz-radius-full)',
                          backgroundColor:
                            prod.status === 'HEALTHY'
                              ? 'rgba(22, 163, 74, 0.1)'
                              : prod.status === 'LOW_STOCK'
                              ? 'rgba(217, 119, 6, 0.1)'
                              : 'rgba(220, 38, 38, 0.1)',
                          color:
                            prod.status === 'HEALTHY'
                              ? '#16a34a'
                              : prod.status === 'LOW_STOCK'
                              ? '#d97706'
                              : '#dc2626',
                        }}
                      >
                        {prod.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. RECENT STOCK MOVEMENTS LEDGER */}
      <div className="yz-card" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, margin: 0, color: 'var(--yz-text-primary)' }}>
            Recent Stock Movements & Ledger Audit ({inventory.recent_movements.length} Entries)
          </h3>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
            Authoritative inventory ledger trail
          </span>
        </div>

        {inventory.recent_movements.length === 0 ? (
          <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '12px' }}>
            No stock movements recorded in ledger.
          </div>
        ) : (
          <div className="yz-table-container">
            <table className="yz-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>TIMESTAMP</th>
                  <th style={{ width: '140px' }}>MOVEMENT TYPE</th>
                  <th>PRODUCT</th>
                  <th style={{ width: '110px' }}>SKU</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>CHANGE</th>
                  <th style={{ width: '100px', textAlign: 'center' }}>BALANCE AFTER</th>
                  <th style={{ width: '130px' }}>LOCATION / GODOWN</th>
                  <th>AUDIT NOTES</th>
                </tr>
              </thead>
              <tbody>
                {inventory.recent_movements.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: '11px', color: 'var(--yz-text-secondary)' }}>{m.created_at}</td>
                    <td>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 600,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor:
                            m.type.includes('PURCHASE') || m.type.includes('IN')
                              ? 'rgba(22, 163, 74, 0.1)'
                              : m.type.includes('SALE') || m.type.includes('OUT')
                              ? 'rgba(2, 132, 199, 0.1)'
                              : 'rgba(217, 119, 6, 0.1)',
                          color:
                            m.type.includes('PURCHASE') || m.type.includes('IN')
                              ? '#16a34a'
                              : m.type.includes('SALE') || m.type.includes('OUT')
                              ? '#0284c7'
                              : '#d97706',
                        }}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{m.product_name}</strong>
                    </td>
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px' }}>{m.sku}</td>
                    <td
                      style={{
                        textAlign: 'center',
                        fontWeight: 700,
                        fontFamily: 'var(--yz-font-mono)',
                        color: m.quantity > 0 ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)', fontWeight: 600 }}>
                      {m.balance_after}
                    </td>
                    <td style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)' }}>
                      {m.godown_name}
                    </td>
                    <td style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                      {m.notes || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
