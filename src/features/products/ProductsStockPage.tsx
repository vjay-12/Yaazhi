import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Edit2,
  Archive,
  RotateCcw,
  Package,
  RefreshCw,
} from 'lucide-react';
import type {
  YaazhiProduct,
  ProductLifecycleFilter,
  StockStatusFilter,
} from '../../types/product';
import type { StockSummary } from '../../types/inventory';
import { productService } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { StockBadge, CategoryBadge, LifecycleBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { TableSkeleton } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { CustomDropdown, type DropdownOption } from '../../components/common/CustomDropdown';
import { ProductModal } from './ProductModal';
import { useToast } from '../../components/common/Toast';
import { ProductImage } from '../../components/common/ProductImage';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';

interface ProductsStockPageProps {
  onViewProductDetail: (product: YaazhiProduct) => void;
  onNavigateToAuditLog?: () => void;
  isAddModalOpenInitially?: boolean;
  onCloseInitialAddModal?: () => void;
}

const LIFECYCLE_OPTIONS: DropdownOption<ProductLifecycleFilter>[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ARCHIVED', label: 'Archived' },
  { value: 'ALL', label: 'All Lifecycle' },
];

const STOCK_OPTIONS: DropdownOption<StockStatusFilter>[] = [
  { value: 'ALL', label: 'All Stock' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
];

const SORT_OPTIONS: DropdownOption[] = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'sellPrice-asc', label: 'Price: Low to High' },
  { value: 'sellPrice-desc', label: 'Price: High to Low' },
  { value: 'currentStock-asc', label: 'Stock: Low to High' },
  { value: 'currentStock-desc', label: 'Stock: High to Low' },
  { value: 'name-asc', label: 'Alphabetical (A-Z)' },
];

export const ProductsStockPage: React.FC<ProductsStockPageProps> = ({
  onViewProductDetail,
  isAddModalOpenInitially = false,
  onCloseInitialAddModal,
}) => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<YaazhiProduct[]>([]);
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters: Lifecycle defaults to ACTIVE, Stock defaults to ALL
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [lifecycleFilter, setLifecycleFilter] = useState<ProductLifecycleFilter>('ACTIVE');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatusFilter>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'sellPrice' | 'currentStock' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);

  // Dynamically derive category options from actual catalog data
  const categoryOptions: DropdownOption[] = React.useMemo(() => [
    { value: 'ALL', label: 'All Weaves' },
    ...catalogCategories.map((c) => ({ value: c, label: c })),
  ], [catalogCategories]);

  // Modals & Action states
  const [isAddModalOpen, setIsAddModalOpen] = useState(isAddModalOpenInitially);
  const [productToEdit, setProductToEdit] = useState<YaazhiProduct | null>(null);
  const [productToArchive, setProductToArchive] = useState<YaazhiProduct | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    if (isAddModalOpenInitially) {
      setIsAddModalOpen(true);
    }
  }, [isAddModalOpenInitially]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allProducts, stockSummary] = await Promise.all([
        productService.list({
          search,
          category: selectedCategory,
          lifecycle: lifecycleFilter,
          stockStatus: stockStatusFilter,
          sortBy,
          sortOrder,
        }),
        inventoryService.getStockSummary(),
      ]);

      setProducts(allProducts);
      setSummary(stockSummary);

      // Keep catalog categories updated when viewing active all
      if (selectedCategory === 'ALL' && !search && lifecycleFilter === 'ACTIVE' && stockStatusFilter === 'ALL') {
        const uniqueCats = Array.from(new Set(allProducts.map((p) => p.category).filter(Boolean))).sort();
        setCatalogCategories(uniqueCats);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error loading products',
        message: err.message || 'Could not fetch catalog and stock data',
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, lifecycleFilter, stockStatusFilter, sortBy, sortOrder, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    loadData();
  };

  const handleConfirmArchive = async () => {
    if (!productToArchive) return;
    try {
      setIsArchiving(true);
      await productService.archive(productToArchive.id);
      showToast({
        type: 'info',
        title: 'Product Archived',
        message: `${productToArchive.name} moved to archive. All stock history and references preserved.`,
      });
      setProductToArchive(null);
      await loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Archive Failed',
        message: err.message || 'Failed to archive product',
      });
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestoreProduct = async (product: YaazhiProduct, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await productService.unarchive(product.id);
      showToast({
        type: 'success',
        title: 'Product Restored',
        message: `${product.name} restored to active boutique catalog.`,
      });
      await loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Restore Failed',
        message: err.message || 'Failed to restore product',
      });
    }
  };

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination({
    items: products,
    resetDependencies: [search, selectedCategory, lifecycleFilter, stockStatusFilter, sortBy, sortOrder],
  });

  const lowStockCount = summary?.lowStockCount || 0;
  const outOfStockCount = summary?.outOfStockCount || 0;

  // Active products count
  const activeProductsCount = products.filter((p) => !p.isArchived && p.isActive !== false).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Compact Invenaro KPI Banner */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '8px',
        }}
      >
        <div className="yz-stat-card">
          <span className="yz-stat-label">Catalog SKUs</span>
          <span className="yz-stat-value tabular-nums">{activeProductsCount}</span>
          <span className="yz-stat-subtext">Active boutique designs</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Physical Units</span>
          <span className="yz-stat-value tabular-nums">{summary?.totalUnits || 0}</span>
          <span className="yz-stat-subtext">Across all store counters</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Cost Valuation</span>
          <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-primary)' }}>
            ₹{(summary?.inventoryValuationCost || 0).toLocaleString('en-IN')}
          </span>
          <span className="yz-stat-subtext">Capital investment</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Retail Potential</span>
          <span className="yz-stat-value tabular-nums" style={{ color: 'var(--yz-gold)' }}>
            ₹{(summary?.inventoryValuationRetail || 0).toLocaleString('en-IN')}
          </span>
          <span className="yz-stat-subtext">Gross sales projection</span>
        </div>

        <div className="yz-stat-card">
          <span className="yz-stat-label">Stock Alerts</span>
          <span
            className="yz-stat-value tabular-nums"
            style={{
              color:
                lowStockCount + outOfStockCount > 0
                  ? 'var(--yz-status-low-stock)'
                  : 'inherit',
            }}
          >
            {lowStockCount + outOfStockCount}
          </span>
          <span className="yz-stat-subtext">
            {lowStockCount} low • {outOfStockCount} depleted
          </span>
        </div>
      </div>

      {/* Clean Compact Filter & Action Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--yz-bg-surface)',
          padding: '8px 12px',
          borderRadius: 'var(--yz-radius-md)',
          border: '1px solid var(--yz-border)',
          boxShadow: 'var(--yz-shadow-2xs)',
          gap: '8px',
        }}
      >
        {/* Left: Search & Custom Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          {/* Search box */}
          <div style={{ position: 'relative', width: '220px', flexShrink: 0 }}>
            <Search
              size={14}
              style={{
                position: 'absolute',
                left: '9px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--yz-text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search by weave, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="yz-input"
              style={{ paddingLeft: '28px', height: '32px', fontSize: '11.5px', width: '100%' }}
            />
          </div>

          {/* Weave Dropdown */}
          <CustomDropdown
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val as any)}
            options={categoryOptions}
            minWidth="120px"
          />

          {/* Lifecycle Status Dropdown (Active, Archived, All) */}
          <CustomDropdown
            value={lifecycleFilter}
            onChange={(val) => setLifecycleFilter(val as ProductLifecycleFilter)}
            options={LIFECYCLE_OPTIONS}
            minWidth="100px"
          />

          {/* Stock Status Dropdown (All Stock, In Stock, Low Stock, Out of Stock) */}
          <CustomDropdown
            value={stockStatusFilter}
            onChange={(val) => setStockStatusFilter(val as StockStatusFilter)}
            options={STOCK_OPTIONS}
            minWidth="110px"
          />

          {/* Sort Dropdown */}
          <CustomDropdown
            value={`${sortBy}-${sortOrder}`}
            onChange={(val) => {
              const [sb, so] = String(val).split('-') as [any, any];
              setSortBy(sb);
              setSortOrder(so);
            }}
            options={SORT_OPTIONS}
            minWidth="130px"
          />
        </div>

        {/* Right: Refresh & Add Product */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadData()}
            title="Refresh Catalog & Stock"
            style={{ height: '32px', width: '32px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCw size={13} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setProductToEdit(null);
              setIsAddModalOpen(true);
            }}
            style={{ height: '32px', fontSize: '11.5px', fontWeight: 600 }}
          >
            + Add Product
          </Button>
        </div>
      </div>

      {/* Main Dense Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={8} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package size={24} />}
          title={lifecycleFilter === 'ARCHIVED' ? 'No archived products' : 'No products found'}
          description={
            lifecycleFilter === 'ARCHIVED'
              ? 'There are currently no archived products in the boutique catalog.'
              : search || selectedCategory !== 'ALL' || stockStatusFilter !== 'ALL' || lifecycleFilter !== 'ACTIVE'
              ? 'No products match your active search or filter criteria.'
              : 'Your boutique catalog is empty. Add your first silk weave or designer garment to begin.'
          }
          actionLabel={
            search || selectedCategory !== 'ALL' || stockStatusFilter !== 'ALL' || lifecycleFilter !== 'ACTIVE'
              ? 'Reset Filters'
              : 'Add Product'
          }
          onAction={() => {
            if (search || selectedCategory !== 'ALL' || stockStatusFilter !== 'ALL' || lifecycleFilter !== 'ACTIVE') {
              setSearch('');
              setSelectedCategory('ALL');
              setLifecycleFilter('ACTIVE');
              setStockStatusFilter('ALL');
            } else {
              setIsAddModalOpen(true);
            }
          }}
        />
      ) : (
        <div className="yz-table-container">
          <table className="yz-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th style={{ minWidth: '180px', paddingLeft: '12px', textAlign: 'left' }}>PRODUCT & WEAVE</th>
                <th style={{ width: '110px', textAlign: 'left' }}>CATEGORY</th>
                <th style={{ width: '95px', textAlign: 'left' }}>SKU</th>
                <th style={{ width: '80px', textAlign: 'right' }}>COST</th>
                <th style={{ width: '80px', textAlign: 'right' }}>RETAIL</th>
                <th style={{ width: '60px', textAlign: 'center' }}>REORDER</th>
                <th style={{ width: '105px', textAlign: 'left' }}>STATUS</th>
                <th style={{ width: '65px', textAlign: 'right', paddingRight: '12px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((product) => {
                const status = productService.getStockStatus(product);

                return (
                  <tr
                    key={product.id}
                    onClick={() => onViewProductDetail(product)}
                    title="Click row to open details"
                    style={{ cursor: 'pointer', height: '38px' }}
                  >
                    {/* PRODUCT & WEAVE: Single-line with ellipsis */}
                    <td style={{ paddingLeft: '12px', textAlign: 'left', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          productName={product.name}
                          category={product.category}
                          width={28}
                          height={28}
                          rounded="sm"
                          iconSize={13}
                        />
                        <div
                          className="yz-cell-truncate"
                          style={{
                            maxWidth: '260px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={`${product.name}${product.craft ? ` (${product.craft})` : ''}`}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                            {product.name}
                          </span>
                          {product.craft && (
                            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', marginLeft: '6px' }}>
                              ({product.craft})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* CATEGORY */}
                    <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                      <CategoryBadge category={product.category} />
                    </td>

                    {/* SKU */}
                    <td style={{ textAlign: 'left', fontFamily: 'var(--yz-font-mono)', fontSize: '11px', color: 'var(--yz-text-secondary)', whiteSpace: 'nowrap' }}>
                      {product.sku}
                    </td>

                    {/* COST */}
                    <td style={{ textAlign: 'right', fontFamily: 'var(--yz-font-mono)', whiteSpace: 'nowrap' }} className="tabular-nums">
                      ₹{product.costPrice.toLocaleString('en-IN')}
                    </td>

                    {/* RETAIL */}
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        color: 'var(--yz-text-primary)',
                        fontFamily: 'var(--yz-font-mono)',
                        whiteSpace: 'nowrap',
                      }}
                      className="tabular-nums"
                    >
                      ₹{product.sellPrice.toLocaleString('en-IN')}
                    </td>

                    {/* REORDER */}
                    <td style={{ textAlign: 'center', color: 'var(--yz-text-muted)', fontSize: '11px', fontFamily: 'var(--yz-font-mono)', whiteSpace: 'nowrap' }}>
                      {product.reorderPoint}
                    </td>

                    {/* STATUS: Stock badge + Lifecycle badge */}
                    <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <StockBadge status={status} stockCount={product.currentStock} />
                        {product.isArchived ? (
                          <LifecycleBadge status="ARCHIVED" />
                        ) : lifecycleFilter === 'ALL' ? (
                          <LifecycleBadge status="ACTIVE" />
                        ) : null}
                      </div>
                    </td>

                    {/* ACTIONS: Fixed width, right-aligned */}
                    <td
                      style={{
                        textAlign: 'right',
                        paddingRight: '12px',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '4px',
                          width: '100%',
                          height: '26px',
                        }}
                      >
                        {!product.isArchived ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setProductToEdit(product);
                                setIsAddModalOpen(true);
                              }}
                              className="yz-btn yz-btn-ghost yz-btn-sm"
                              title="Edit Product"
                              style={{ width: '26px', height: '26px', padding: 0, borderRadius: 'var(--yz-radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setProductToArchive(product)}
                              className="yz-btn yz-btn-ghost yz-btn-sm"
                              style={{ color: 'var(--yz-text-muted, #64748B)', width: '26px', height: '26px', padding: 0, borderRadius: 'var(--yz-radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Archive Product"
                            >
                              <Archive size={13} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleRestoreProduct(product, e)}
                              className="yz-btn yz-btn-ghost yz-btn-sm"
                              style={{ color: 'var(--yz-status-in-stock, #166534)', width: '26px', height: '26px', padding: 0, borderRadius: 'var(--yz-radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Restore to Active Catalog"
                            >
                              <RotateCcw size={13} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setProductToEdit(product);
                                setIsAddModalOpen(true);
                              }}
                              className="yz-btn yz-btn-ghost yz-btn-sm"
                              title="Edit Product"
                              style={{ width: '26px', height: '26px', padding: 0, borderRadius: 'var(--yz-radius-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Edit2 size={13} />
                            </button>
                          </>
                        )}
                      </div>
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
            itemLabel="products"
          />
        </div>
      )}

      {/* Add / Edit Product Modal */}
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

      {/* Archive Product Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(productToArchive)}
        onClose={() => !isArchiving && setProductToArchive(null)}
        onConfirm={handleConfirmArchive}
        title="Archive Product"
        description={
          productToArchive ? (
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--yz-text-primary)' }}>
                Are you sure you want to archive <strong>{productToArchive.name}</strong> (SKU: {productToArchive.sku})?
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--yz-text-secondary)', lineHeight: 1.45 }}>
                The product will be removed from the active catalog and moved to the <strong>Archived</strong> view. All SKU data, stock history, and transaction references will remain fully preserved.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Archive Product"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isArchiving}
      />
    </div>
  );
};
