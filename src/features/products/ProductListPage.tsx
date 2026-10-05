import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Barcode,
  Edit2,
  Trash2,
  SlidersHorizontal,
  Package,
  RefreshCw,
  Eye,
  AlertTriangle,
} from 'lucide-react';
import type { YaazhiProduct, BoutiqueCategory, StockStatus } from '../../types/product';
import { productService } from '../../services/productService';
import { StockBadge, CategoryBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { TableSkeleton } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { ProductModal } from './ProductModal';
import { BarcodeLabelModal } from '../../components/common/BarcodeLabelModal';
import { StockAdjustmentModal } from '../inventory/StockAdjustmentModal';
import { useToast } from '../../components/common/Toast';

interface ProductListPageProps {
  onViewProductDetail: (product: YaazhiProduct) => void;
  isAddModalOpenInitially?: boolean;
  onCloseInitialAddModal?: () => void;
}

const CATEGORY_LIST: (BoutiqueCategory | 'ALL')[] = [
  'ALL',
  'Kanchipuram Silk',
  'Cotton Handloom',
  'Banarasi Silk',
  'Designer Chudidar',
  'Anarkali Set',
  'Kurtis & Tunics',
  'Designer Blouse',
  'Ethnic Menswear',
  'Kids Ethnic',
  'Dupattas & Shawls',
];

export const ProductListPage: React.FC<ProductListPageProps> = ({
  onViewProductDetail,
  isAddModalOpenInitially = false,
  onCloseInitialAddModal,
}) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<YaazhiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BoutiqueCategory | 'ALL'>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'sellPrice' | 'currentStock' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(isAddModalOpenInitially);
  const [productToEdit, setProductToEdit] = useState<YaazhiProduct | null>(null);
  const [barcodeProduct, setBarcodeProduct] = useState<YaazhiProduct | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<YaazhiProduct | null>(null);
  const [productToDelete, setProductToDelete] = useState<YaazhiProduct | null>(null);

  useEffect(() => {
    if (isAddModalOpenInitially) {
      setIsAddModalOpen(true);
    }
  }, [isAddModalOpenInitially]);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await productService.list({
        search,
        category: selectedCategory,
        stockStatus: stockStatusFilter,
        sortBy,
        sortOrder,
      });
      setProducts(data);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error loading catalog',
        message: err.message || 'Could not fetch boutique items',
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, stockStatusFilter, sortBy, sortOrder, showToast]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleCreateOrUpdate = async (input: any) => {
    if (productToEdit) {
      await productService.update(productToEdit.id, input);
      showToast({
        type: 'success',
        title: 'Product updated',
        message: `Updated catalog record for ${input.name}`,
      });
    } else {
      await productService.create(input);
      showToast({
        type: 'success',
        title: 'Product created',
        message: `Added ${input.name} to boutique inventory`,
      });
    }
    loadProducts();
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await productService.delete(productToDelete.id);
      showToast({
        type: 'info',
        title: 'Product deleted',
        message: `Removed ${productToDelete.name} from catalog`,
      });
      setProductToDelete(null);
      loadProducts();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to delete',
        message: err.message,
      });
    }
  };

  // Metrics summary
  const totalCount = products.length;
  const lowStockCount = products.filter(
    (p) => productService.getStockStatus(p) === 'LOW_STOCK'
  ).length;
  const outOfStockCount = products.filter(
    (p) => productService.getStockStatus(p) === 'OUT_OF_STOCK'
  ).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner & Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        <div className="yz-stat-card">
          <span className="yz-stat-label">Catalog Items</span>
          <span className="yz-stat-value">{totalCount}</span>
          <span className="yz-stat-subtext">Active boutique designs</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Low Stock Alerts</span>
          <span
            className="yz-stat-value"
            style={{ color: lowStockCount > 0 ? 'var(--yz-status-low-stock)' : 'inherit' }}
          >
            {lowStockCount}
          </span>
          <span className="yz-stat-subtext">Items at or below reorder threshold</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Depleted / Out of Stock</span>
          <span
            className="yz-stat-value"
            style={{ color: outOfStockCount > 0 ? 'var(--yz-status-out-stock)' : 'inherit' }}
          >
            {outOfStockCount}
          </span>
          <span className="yz-stat-subtext">Requires procurement PO</span>
        </div>
      </div>

      {/* Filter and Action Bar */}
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
          {/* Search box */}
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
              placeholder="Search by weave name, SKU, or barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="yz-input"
              style={{ paddingLeft: '2rem' }}
            />
          </div>

          {/* Category filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="yz-select"
            style={{ width: 'auto', minWidth: '160px' }}
          >
            {CATEGORY_LIST.map((c) => (
              <option key={c} value={c}>
                {c === 'ALL' ? 'All Weaves & Categories' : c}
              </option>
            ))}
          </select>

          {/* Stock filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as any)}
            className="yz-select"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock Only</option>
            <option value="LOW_STOCK">Low Stock Alert</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>

          {/* Sort dropdown */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('-') as [any, any];
              setSortBy(sb);
              setSortOrder(so);
            }}
            className="yz-select"
            style={{ width: 'auto', minWidth: '150px' }}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="sellPrice-asc">Price: Low to High</option>
            <option value="sellPrice-desc">Price: High to Low</option>
            <option value="currentStock-asc">Stock: Low to High</option>
            <option value="currentStock-desc">Stock: High to Low</option>
            <option value="name-asc">Alphabetical (A-Z)</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={15} />}
            onClick={() => loadProducts()}
            title="Refresh Catalog"
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setProductToEdit(null);
              setIsAddModalOpen(true);
            }}
          >
            Add Boutique Item
          </Button>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <TableSkeleton rows={6} columns={7} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package size={28} />}
          title="No boutique items found"
          description={
            search || selectedCategory !== 'ALL' || stockStatusFilter !== 'ALL'
              ? 'No products match your active search or filter criteria. Try clearing filters.'
              : 'Your boutique catalog has no items yet. Add your first silk weave or designer piece to begin tracking inventory.'
          }
          actionLabel={
            search || selectedCategory !== 'ALL' || stockStatusFilter !== 'ALL'
              ? 'Reset Filters'
              : 'Add Boutique Item'
          }
          onAction={() => {
            if (search || selectedCategory !== 'ALL' || stockStatusFilter !== 'ALL') {
              setSearch('');
              setSelectedCategory('ALL');
              setStockStatusFilter('ALL');
            } else {
              setIsAddModalOpen(true);
            }
          }}
        />
      ) : (
        <div className="yz-table-container">
          <table className="yz-table">
            <thead>
              <tr>
                <th>Product & Weave</th>
                <th>Category</th>
                <th>SKU / Barcode</th>
                <th style={{ textAlign: 'right' }}>Cost</th>
                <th style={{ textAlign: 'right' }}>Selling Price</th>
                <th style={{ textAlign: 'center' }}>Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const status = productService.getStockStatus(product);
                return (
                  <tr key={product.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: 'var(--yz-text-primary)',
                            cursor: 'pointer',
                          }}
                          onClick={() => onViewProductDetail(product)}
                        >
                          {product.name}
                        </span>
                        {product.craft && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--yz-text-muted)' }}>
                            {product.craft} • {product.fabric}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <CategoryBadge category={product.category} />
                    </td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
                        <span style={{ fontFamily: 'var(--yz-font-mono)', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
                          {product.sku}
                        </span>
                        <span style={{ color: 'var(--yz-text-muted)' }}>{product.barcode}</span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right', fontFamily: 'var(--yz-font-mono)' }} className="tabular-nums">
                      ₹{product.costPrice.toLocaleString('en-IN')}
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
                      ₹{product.sellPrice.toLocaleString('en-IN')}
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.9375rem',
                          fontFamily: 'var(--yz-font-mono)',
                        }}
                      >
                        {product.currentStock} {product.unitOfMeasure}
                      </span>
                    </td>

                    <td>
                      <StockBadge status={status} stockCount={product.currentStock} />
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                        <button
                          onClick={() => onViewProductDetail(product)}
                          className="yz-btn yz-btn-ghost yz-btn-sm"
                          title="View details"
                          aria-label={`View details of ${product.name}`}
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => setBarcodeProduct(product)}
                          className="yz-btn yz-btn-ghost yz-btn-sm"
                          title="Print Barcode Hangtags"
                          aria-label={`Print barcode tags for ${product.name}`}
                        >
                          <Barcode size={15} color="var(--yz-primary)" />
                        </button>

                        <button
                          onClick={() => setAdjustProduct(product)}
                          className="yz-btn yz-btn-ghost yz-btn-sm"
                          title="Adjust Stock Count"
                          aria-label={`Adjust stock for ${product.name}`}
                        >
                          <SlidersHorizontal size={15} />
                        </button>

                        <button
                          onClick={() => {
                            setProductToEdit(product);
                            setIsAddModalOpen(true);
                          }}
                          className="yz-btn yz-btn-ghost yz-btn-sm"
                          title="Edit product"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit2 size={15} />
                        </button>

                        <button
                          onClick={() => setProductToDelete(product)}
                          className="yz-btn yz-btn-ghost yz-btn-sm"
                          style={{ color: 'var(--yz-status-out-stock)' }}
                          title="Delete product"
                          aria-label={`Delete ${product.name}`}
                        >
                          <Trash2 size={15} />
                        </button>
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
      <ProductModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setProductToEdit(null);
          if (onCloseInitialAddModal) onCloseInitialAddModal();
        }}
        onSubmit={handleCreateOrUpdate}
        productToEdit={productToEdit}
      />

      <BarcodeLabelModal
        isOpen={!!barcodeProduct}
        onClose={() => setBarcodeProduct(null)}
        product={barcodeProduct}
      />

      <StockAdjustmentModal
        isOpen={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        product={adjustProduct}
        onStockAdjusted={() => {
          showToast({
            type: 'success',
            title: 'Stock Updated',
            message: 'Inventory count reconciled and recorded in audit ledger.',
          });
          loadProducts();
        }}
      />

      {/* Delete Confirmation Dialog */}
      {productToDelete && (
        <div
          className="yz-modal-backdrop"
          onClick={() => setProductToDelete(null)}
          role="dialog"
          aria-modal="true"
        >
          <div className="yz-modal" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--yz-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <AlertTriangle size={20} color="var(--yz-status-out-stock)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Archive Product</h3>
              </div>
            </div>
            <div style={{ padding: '1.25rem 1.5rem' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--yz-text-secondary)', lineHeight: 1.5 }}>
                Are you sure you want to remove <strong>{productToDelete.name}</strong> (SKU: {productToDelete.sku}) from active inventory?
                This action preserves historical sales orders and invoices.
              </p>
            </div>
            <div
              style={{
                padding: '0.85rem 1.5rem',
                borderTop: '1px solid var(--yz-border)',
                backgroundColor: 'var(--yz-bg-subtle)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
              }}
            >
              <Button variant="secondary" onClick={() => setProductToDelete(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteConfirm}>
                Confirm Removal
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
