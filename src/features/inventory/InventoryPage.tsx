import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Barcode,
} from 'lucide-react';
import type { YaazhiProduct, StockStatus } from '../../types/product';
import type { StockSummary, BoutiqueLocation } from '../../types/inventory';
import { productService } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { StockBadge, CategoryBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { StockAdjustmentModal } from './StockAdjustmentModal';
import { BarcodeLabelModal } from '../../components/common/BarcodeLabelModal';
import { useToast } from '../../components/common/Toast';

interface InventoryPageProps {
  onViewProductDetail: (product: YaazhiProduct) => void;
  onNavigateToMovements: () => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  onViewProductDetail,
  onNavigateToMovements,
}) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<YaazhiProduct[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [locations, setLocations] = useState<BoutiqueLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StockStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [adjustProduct, setAdjustProduct] = useState<YaazhiProduct | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<YaazhiProduct | null>(null);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allProducts, stockSummary, allLocations] = await Promise.all([
        productService.list(),
        inventoryService.getStockSummary(),
        inventoryService.getLocations(),
      ]);
      setProducts(allProducts);
      setSummary(stockSummary);
      setLocations(allLocations);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error loading inventory',
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const filteredProducts = products.filter((p) => {
    const status = productService.getStockStatus(p);
    if (statusFilter !== 'ALL' && status !== statusFilter) return false;

    if (selectedLocation !== 'ALL') {
      const locStock = p.locationStock[selectedLocation] || 0;
      if (locStock <= 0) return false;
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Valuation & Stock Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="yz-stat-card">
          <span className="yz-stat-label">Total Inventory Valuation (Cost)</span>
          <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-primary)' }}>
            ₹{(summary?.inventoryValuationCost || 0).toLocaleString('en-IN')}
          </span>
          <span className="yz-stat-subtext">Capital tied in active weaves</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Retail Potential Value</span>
          <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-gold)' }}>
            ₹{(summary?.inventoryValuationRetail || 0).toLocaleString('en-IN')}
          </span>
          <span className="yz-stat-subtext">Projected gross retail value</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Total Physical Units</span>
          <span className="yz-stat-value tabular-nums">
            {summary?.totalUnits || 0}
          </span>
          <span className="yz-stat-subtext">Across all boutique counters</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Attention Required</span>
          <span
            className="yz-stat-value"
            style={{
              color:
                (summary?.lowStockCount || 0) + (summary?.outOfStockCount || 0) > 0
                  ? 'var(--yz-status-low-stock)'
                  : 'inherit',
            }}
          >
            {(summary?.lowStockCount || 0) + (summary?.outOfStockCount || 0)}
          </span>
          <span className="yz-stat-subtext">
            {summary?.lowStockCount || 0} low stock • {summary?.outOfStockCount || 0} out of stock
          </span>
        </div>
      </div>

      {/* Control Bar */}
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
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
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
              placeholder="Search inventory by title or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="yz-input"
              style={{ paddingLeft: '2rem' }}
            />
          </div>

          {/* Location filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="yz-select"
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="ALL">All Boutique Locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name} ({loc.code})
              </option>
            ))}
          </select>

          {/* Stock state filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="yz-select"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="IN_STOCK">In Stock Only</option>
            <option value="LOW_STOCK">Low Stock Warning</option>
            <option value="OUT_OF_STOCK">Depleted / 0 Stock</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            onClick={onNavigateToMovements}
            title="View Immutable Audit Movement Ledger"
          >
            View Audit Log
          </Button>

          <Button
            variant="secondary"
            icon={<RefreshCw size={15} />}
            onClick={() => loadInventory()}
            title="Refresh inventory counts"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Inventory Table */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={<Layers size={28} />}
          title="No stock records found"
          description="No inventory items match your current location and stock level filter."
          actionLabel="Clear Filters"
          onAction={() => {
            setSearch('');
            setSelectedLocation('ALL');
            setStatusFilter('ALL');
          }}
        />
      ) : (
        <div className="yz-table-container">
          <table className="yz-table">
            <thead>
              <tr>
                <th>Product / Weave</th>
                <th>Category</th>
                <th>SKU</th>
                <th style={{ textAlign: 'center' }}>Physical Stock</th>
                <th style={{ textAlign: 'center' }}>Threshold</th>
                <th style={{ textAlign: 'right' }}>Valuation (Cost)</th>
                <th style={{ textAlign: 'right' }}>Valuation (Retail)</th>
                <th>Health Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const status = productService.getStockStatus(p);
                const displayCount =
                  selectedLocation === 'ALL'
                    ? p.currentStock
                    : p.locationStock[selectedLocation] || 0;

                const valuationCost = displayCount * p.costPrice;
                const valuationRetail = displayCount * p.sellPrice;

                return (
                  <tr key={p.id}>
                    <td>
                      <div
                        style={{ fontWeight: 600, color: 'var(--yz-text-primary)', cursor: 'pointer' }}
                        onClick={() => onViewProductDetail(p)}
                      >
                        {p.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--yz-text-muted)' }}>
                        {p.craft || p.fabric || 'Standard Weave'}
                      </div>
                    </td>

                    <td>
                      <CategoryBadge category={p.category} />
                    </td>

                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '0.8rem', color: 'var(--yz-text-secondary)' }}>
                      {p.sku}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9375rem', fontFamily: 'var(--yz-font-mono)' }}>
                        {displayCount} {p.unitOfMeasure}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '0.85rem' }}>
                      {p.reorderPoint}
                    </td>

                    <td style={{ textAlign: 'right', fontFamily: 'var(--yz-font-mono)' }} className="tabular-nums">
                      ₹{valuationCost.toLocaleString('en-IN')}
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        color: 'var(--yz-text-primary)',
                        fontFamily: 'var(--yz-font-mono)',
                      }}
                      className="tabular-nums"
                    >
                      ₹{valuationRetail.toLocaleString('en-IN')}
                    </td>

                    <td>
                      <StockBadge status={status} stockCount={displayCount} />
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<SlidersHorizontal size={14} />}
                          onClick={() => setAdjustProduct(p)}
                        >
                          Adjust
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Barcode size={14} />}
                          onClick={() => setBarcodeProduct(p)}
                          title="Print Barcode Tag"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <StockAdjustmentModal
        isOpen={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        product={adjustProduct}
        onStockAdjusted={() => {
          showToast({
            type: 'success',
            title: 'Stock Adjusted',
            message: 'Physical inventory updated and audit entry recorded.',
          });
          loadInventory();
        }}
      />

      <BarcodeLabelModal
        isOpen={!!barcodeProduct}
        onClose={() => setBarcodeProduct(null)}
        product={barcodeProduct}
      />
    </div>
  );
};
