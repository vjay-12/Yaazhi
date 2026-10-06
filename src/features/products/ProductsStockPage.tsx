import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Edit2,
  Archive,
  RotateCcw,
  SlidersHorizontal,
  Package,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import type { YaazhiProduct, BoutiqueCategory, StockStatus } from '../../types/product';
import type { StockSummary, BoutiqueLocation } from '../../types/inventory';
import { productService } from '../../services/productService';
import { inventoryService } from '../../services/inventoryService';
import { StockBadge, CategoryBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { TableSkeleton } from '../../components/common/LoadingState';
import { EmptyState } from '../../components/common/EmptyState';
import { CustomDropdown, type DropdownOption } from '../../components/common/CustomDropdown';
import { ProductModal } from './ProductModal';
import { StockAdjustmentModal } from '../inventory/StockAdjustmentModal';
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

const CATEGORY_OPTIONS: DropdownOption[] = CATEGORY_LIST.map((c) => ({
  value: c,
  label: c === 'ALL' ? 'All Weaves' : c,
}));

const STATUS_OPTIONS: DropdownOption<StockStatus | 'ARCHIVED' | 'ALL'>[] = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'IN_STOCK', label: 'In Stock' },
  { value: 'LOW_STOCK', label: 'Low Stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of Stock' },
  { value: 'ARCHIVED', label: 'Archived' },
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
  const [locations, setLocations] = useState<BoutiqueLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BoutiqueCategory | 'ALL'>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState<StockStatus | 'ARCHIVED' | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'sellPrice' | 'currentStock' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals & Action states
  const [isAddModalOpen, setIsAddModalOpen] = useState(isAddModalOpenInitially);
  const [productToEdit, setProductToEdit] = useState<YaazhiProduct | null>(null);
  const [adjustProduct, setAdjustProduct] = useState<YaazhiProduct | null>(null);
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
      const [allProducts, stockSummary, allLocations] = await Promise.all([
        productService.list({
          search,
          category: selectedCategory,
          stockStatus: stockStatusFilter,
          sortBy,
          sortOrder,
        }),
        inventoryService.getStockSummary(),
        inventoryService.getLocations(),
      ]);

      setProducts(allProducts);
      setSummary(stockSummary);
      setLocations(allLocations);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error loading products',
        message: err.message || 'Could not fetch catalog and stock data',
      });
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedCategory, stockStatusFilter, sortBy, sortOrder, showToast]);

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

  // Filter products by location if selected
  const displayedProducts = products.filter((p) => {
    if (selectedLocation === 'ALL') return true;
    const locStock = p.locationStock[selectedLocation] || 0;
    return locStock > 0;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination({
    items: displayedProducts,
    resetDependencies: [search, selectedCategory, selectedLocation, stockStatusFilter, sortBy, sortOrder],
  });

  const lowStockCount = summary?.lowStockCount || 0;
  const outOfStockCount = summary?.outOfStockCount || 0;

  // Active products count
  const activeProductsCount = products.filter((p) => !p.isArchived && p.isActive !== false).length;

  const locationOptions: DropdownOption[] = [
    { value: 'ALL', label: 'All Counters & Vaults' },
    ...locations.map((loc) => ({ value: loc.id, label: loc.name })),
  ];

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
          padding: '8px 10px',
          borderRadius: 'var(--yz-radius-sm)',
          border: '1px solid var(--yz-border)',
          gap: '8px',
        }}
      >
        {/* Left: Search & Custom Dropdowns */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}>
          {/* Search box */}
          <div style={{ position: 'relative', width: '210px', flexShrink: 0 }}>
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
              placeholder="Search by weave, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="yz-input"
              style={{ paddingLeft: '26px', height: '28px', fontSize: '11px', width: '100%' }}
            />
          </div>

          {/* Weave Dropdown */}
          <CustomDropdown
            value={selectedCategory}
            onChange={(val) => setSelectedCategory(val as any)}
            options={CATEGORY_OPTIONS}
            minWidth="125px"
          />

          {/* Counter / Vault Dropdown */}
          <CustomDropdown
            value={selectedLocation}
            onChange={(val) => setSelectedLocation(String(val))}
            options={locationOptions}
            minWidth="145px"
          />

          {/* Status Dropdown */}
          <CustomDropdown
            value={stockStatusFilter}
            onChange={(val) => setStockStatusFilter(val as any)}
            options={STATUS_OPTIONS}
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
            minWidth="125px"
          />
        </div>

        {/* Right: Refresh & Add Product */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => loadData()}
            title="Refresh Catalog & Stock"
            style={{ height: '28px', width: '28px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCw size={12} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setProductToEdit(null);
              setIsAddModalOpen(true);
            }}
            style={{ height: '28px', fontSize: '11px', fontWeight: 600 }}
          >
            + Add Product
          </Button>
        </div>
      </div>

      {/* Main Dense Table */}
      {isLoading ? (
        <TableSkeleton rows={8} columns={9} />
      ) : displayedProducts.length === 0 ? (
        <EmptyState
          icon={<Package size={24} />}
          title={stockStatusFilter === 'ARCHIVED' ? 'No archived products' : 'No products found'}
          description={
            stockStatusFilter === 'ARCHIVED'
              ? 'There are currently no archived products in the boutique catalog.'
              : search || selectedCategory !== 'ALL' || stockStatusFilter !== 'ALL' || selectedLocation !== 'ALL'
              ? 'No products match your active search or filter criteria.'
              : 'Your boutique catalog is empty. Add your first silk weave or designer garment to begin.'
          }
          actionLabel={
            search || selectedCategory !== 'ALL' || stockStatusFilter !== 'ALL' || selectedLocation !== 'ALL'
              ? 'Reset Filters'
              : 'Add Product'
          }
          onAction={() => {
            if (search || selectedCategory !== 'ALL' || stockStatusFilter !== 'ALL' || selectedLocation !== 'ALL') {
              setSearch('');
              setSelectedCategory('ALL');
              setSelectedLocation('ALL');
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
                <th style={{ minWidth: '260px', paddingLeft: '12px' }}>PRODUCT & WEAVE</th>
                <th style={{ width: '115px' }}>CATEGORY</th>
                <th style={{ width: '95px' }}>SKU</th>
                <th style={{ width: '65px', textAlign: 'center' }}>UNITS</th>
                <th style={{ width: '85px', textAlign: 'right' }}>COST</th>
                <th style={{ width: '85px', textAlign: 'right' }}>RETAIL</th>
                <th style={{ width: '65px', textAlign: 'center' }}>REORDER</th>
                <th style={{ width: '110px' }}>STATUS</th>
                <th style={{ width: '85px', textAlign: 'center', paddingRight: '12px' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.map((product) => {
                const status = productService.getStockStatus(product);
                const displayStock =
                  selectedLocation === 'ALL'
                    ? product.currentStock
                    : product.locationStock[selectedLocation] || 0;

                return (
                  <tr
                    key={product.id}
                    onClick={() => onViewProductDetail(product)}
                    title="Click row to open details"
                    style={{ cursor: 'pointer', height: '35px' }}
                  >
                    {/* PRODUCT & WEAVE: Single-line with ellipsis */}
                    <td style={{ paddingLeft: '12px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                        <ProductImage
                          src={product.imageUrl}
                          alt={product.name}
                          productName={product.name}
                          category={product.category}
                          width={26}
                          height={26}
                          rounded="sm"
                          iconSize={12}
                        />
                        <div
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '300px',
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
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <CategoryBadge category={product.category} />
                    </td>

                    {/* SKU */}
                    <td style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '11px', color: 'var(--yz-text-secondary)', whiteSpace: 'nowrap' }}>
                      {product.sku}
                    </td>

                    {/* UNITS */}
                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '12px',
                          fontFamily: 'var(--yz-font-mono)',
                        }}
                      >
                        {displayStock}
                      </span>
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

                    {/* STATUS */}
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <StockBadge status={status} stockCount={displayStock} />
                    </td>

                    {/* ACTIONS: Fixed width */}
                    <td style={{ textAlign: 'center', paddingRight: '12px', whiteSpace: 'nowrap' }} onClick={(e) => e.stopPropagation()}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                          width: '76px',
                          height: '22px',
                        }}
                      >
                        {!product.isArchived ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setAdjustProduct(product)}
                              className="yz-btn yz-btn-ghost yz-btn-sm"
                              title="Adjust Stock Count"
                              style={{ width: '22px', height: '22px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <SlidersHorizontal size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setProductToEdit(product);
                                setIsAddModalOpen(true);
                              }}
                              className="yz-btn yz-btn-ghost yz-btn-sm"
                              title="Edit Product"
                              style={{ width: '22px', height: '22px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Edit2 size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setProductToArchive(product)}
                              className="yz-btn yz-btn-ghost yz-btn-sm"
                              style={{ color: '#64748B', width: '22px', height: '22px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Archive Product"
                            >
                              <Archive size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleRestoreProduct(product, e)}
                              className="yz-btn yz-btn-ghost yz-btn-sm"
                              style={{ color: '#166534', width: '22px', height: '22px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                              title="Restore to Active Catalog"
                            >
                              <RotateCcw size={12} />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setProductToEdit(product);
                                setIsAddModalOpen(true);
                              }}
                              className="yz-btn yz-btn-ghost yz-btn-sm"
                              title="Edit Product"
                              style={{ width: '22px', height: '22px', padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Edit2 size={12} />
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

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={!!adjustProduct}
        onClose={() => setAdjustProduct(null)}
        product={adjustProduct}
        onStockAdjusted={() => {
          showToast({
            type: 'success',
            title: 'Stock Reconciled',
            message: 'Physical stock updated and recorded in audit ledger.',
          });
          loadData();
        }}
      />

      {/* Archive Product Confirmation Modal */}
      {productToArchive && (
        <Modal
          isOpen={Boolean(productToArchive)}
          onClose={() => !isArchiving && setProductToArchive(null)}
          title="Archive Product"
          maxWidth="460px"
          footer={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setProductToArchive(null)}
                disabled={isArchiving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmArchive}
                disabled={isArchiving}
              >
                {isArchiving ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Loader2 size={13} className="animate-spin" /> Archiving...
                  </span>
                ) : (
                  'Archive Product'
                )}
              </Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
            <p style={{ margin: 0, color: 'var(--yz-text-primary)' }}>
              Are you sure you want to archive <strong>{productToArchive.name}</strong> (SKU: {productToArchive.sku})?
            </p>
            <p style={{ margin: 0, color: 'var(--yz-text-secondary)', fontSize: '11px', lineHeight: 1.4 }}>
              The product will be removed from the active catalog and moved to the <strong>Archived</strong> view. All SKU data, stock history, and transaction references will remain fully preserved.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
};
