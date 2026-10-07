import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  Loader2,
  Trash2,
  ChevronDown,
  Check,
  CheckCircle2,
  Clock,
  PackageCheck,
  XCircle,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Pagination } from '../../components/common/Pagination';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { ProductSearchDropdown } from '../../components/common/ProductSearchDropdown';
import { AddVendorModal } from './AddVendorModal';
import { purchaseService, type PurchaseOrderData, type PurchaseOrderStatus } from '../../services/purchaseService';
import { supplierService, type VendorData } from '../../services/supplierService';
import { productService } from '../../services/productService';
import type { YaazhiProduct } from '../../types/product';
import { useToast } from '../../components/common/Toast';
import { usePagination } from '../../hooks/usePagination';

interface POLineItemDraft {
  productId: string;
  productName: string;
  sku: string;
  orderedQty: number;
  unitCost: number;
  taxRate: number;
}

export const PurchasesPage: React.FC = () => {
  const [purchases, setPurchases] = useState<PurchaseOrderData[]>([]);
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [products, setProducts] = useState<YaazhiProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PurchaseOrderStatus>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc' | 'po_asc'>('newest');

  // Selected PO Details Modal
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderData | null>(null);

  // Cancel PO Confirmation Modal State
  const [poToCancel, setPoToCancel] = useState<PurchaseOrderData | null>(null);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  // Create PO Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedVendorId, setSelectedVendorId] = useState('');
  const [orderDate, setOrderDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [orderNotes, setOrderNotes] = useState('');
  const [lineItems, setLineItems] = useState<POLineItemDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Vendor Selector Dropdown State
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false);
  const [vendorSearch, setVendorSearch] = useState('');
  const vendorDropdownRef = useRef<HTMLDivElement>(null);

  // Add Vendor Modal on top of PO
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState(false);

  // Receiving PO State
  const [isReceiving, setIsReceiving] = useState<string | null>(null);

  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [pos, vList, pList] = await Promise.all([
        purchaseService.list(),
        supplierService.list(),
        productService.list(),
      ]);
      setPurchases(pos);
      setVendors(vList);
      setProducts(pList);

      // Default first vendor if not yet selected
      if (vList.length > 0 && !selectedVendorId) {
        setSelectedVendorId(vList[0].id);
      }
    } catch {
      showToast({ type: 'error', title: 'Load Error', message: 'Could not load purchase orders' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedVendorId, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Click outside to close vendor dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target as Node)) {
        setIsVendorDropdownOpen(false);
      }
    };
    if (isVendorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVendorDropdownOpen]);

  // Initialize draft items when Create Modal opens
  const handleOpenCreateModal = () => {
    const initialProduct = products[0];
    setOrderDate(new Date().toISOString().split('T')[0]);
    setOrderNotes('');
    if (initialProduct) {
      setLineItems([
        {
          productId: initialProduct.id,
          productName: initialProduct.name,
          sku: initialProduct.sku,
          orderedQty: 5,
          unitCost: initialProduct.costPrice || 0,
          taxRate: initialProduct.taxRate || 5.0,
        },
      ]);
    } else {
      setLineItems([]);
    }
    setIsCreateModalOpen(true);
  };

  // Add line item row
  const handleAddLineItem = () => {
    // Find first product that is not already in lineItems
    const existingIds = new Set(lineItems.map((it) => it.productId));
    const nextAvailableProduct = products.find((p) => !existingIds.has(p.id)) || products[0];

    if (!nextAvailableProduct) {
      showToast({
        type: 'warning',
        title: 'Catalog Empty',
        message: 'No products available in catalog to add.',
      });
      return;
    }

    setLineItems((prev) => [
      ...prev,
      {
        productId: nextAvailableProduct.id,
        productName: nextAvailableProduct.name,
        sku: nextAvailableProduct.sku,
        orderedQty: 5,
        unitCost: nextAvailableProduct.costPrice || 0,
        taxRate: nextAvailableProduct.taxRate || 5.0,
      },
    ]);
  };

  // Update line item
  const handleUpdateLineItem = (index: number, updates: Partial<POLineItemDraft>) => {
    setLineItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updates };
      return copy;
    });
  };

  // Select product for line item
  const handleSelectProduct = (index: number, prod: YaazhiProduct) => {
    // Prevent accidental duplicate product rows
    const isAlreadyAdded = lineItems.some((it, idx) => idx !== index && it.productId === prod.id);
    if (isAlreadyAdded) {
      showToast({
        type: 'warning',
        title: 'Duplicate SKU',
        message: `${prod.name} (${prod.sku}) is already in this purchase order. Update its quantity instead.`,
      });
      return;
    }

    handleUpdateLineItem(index, {
      productId: prod.id,
      productName: prod.name,
      sku: prod.sku,
      unitCost: prod.costPrice || 0,
      taxRate: prod.taxRate || 5.0,
    });
  };

  // Remove line item
  const handleRemoveLineItem = (index: number) => {
    if (lineItems.length <= 1) return;
    setLineItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Dynamic calculations for Create PO
  const draftSubtotal = useMemo(() => {
    return lineItems.reduce((sum, it) => sum + (it.orderedQty || 0) * (it.unitCost || 0), 0);
  }, [lineItems]);

  const draftTaxTotal = useMemo(() => {
    return lineItems.reduce((sum, it) => {
      const lineSubtotal = (it.orderedQty || 0) * (it.unitCost || 0);
      return sum + (lineSubtotal * (it.taxRate || 5.0)) / 100;
    }, 0);
  }, [lineItems]);

  const draftGrandTotal = draftSubtotal + draftTaxTotal;

  // Submit PO
  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId) {
      showToast({ type: 'warning', title: 'Vendor Required', message: 'Please select a supplier or vendor.' });
      return;
    }

    if (lineItems.length === 0 || lineItems.some((it) => !it.productId || it.orderedQty <= 0)) {
      showToast({
        type: 'warning',
        title: 'Invalid Line Items',
        message: 'Please ensure every row has a product selected and quantity greater than 0.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const vendor = vendors.find((v) => v.id === selectedVendorId);

      await purchaseService.create({
        supplier_id: selectedVendorId,
        supplier_name: vendor?.name || 'Boutique Vendor',
        order_date: orderDate,
        notes: orderNotes.trim() || undefined,
        items: lineItems.map((it) => ({
          product_id: it.productId,
          quantity: it.orderedQty,
          unit_cost: it.unitCost,
          tax_rate: it.taxRate,
        })),
      });

      showToast({
        type: 'success',
        title: 'Purchase Order Issued',
        message: `Successfully created PO for ${vendor?.name || 'supplier'}`,
      });

      setIsCreateModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Failed to create purchase order',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Receive goods into inventory (GRN)
  const handleReceivePO = async (po: PurchaseOrderData) => {
    if (po.status === 'RECEIVED') return;

    try {
      setIsReceiving(po.id);
      await purchaseService.receive(po.id, 'Counter receipt verified & stock posted to showroom ledger');
      showToast({
        type: 'success',
        title: 'Goods Inward Completed',
        message: `PO ${po.poNumber} stock received into showroom inventory successfully.`,
      });
      await loadData();
      if (selectedPO?.id === po.id) {
        setSelectedPO((prev) => (prev ? { ...prev, status: 'RECEIVED' } : null));
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Receipt Failed',
        message: err.message || 'Could not receive goods into stock',
      });
    } finally {
      setIsReceiving(null);
    }
  };

  // Cancel PO handler
  const handleConfirmCancelPO = async () => {
    if (!poToCancel) return;
    try {
      setIsCancelling(poToCancel.id);
      await purchaseService.cancel(poToCancel.id, 'Cancelled by showroom manager');
      showToast({
        type: 'success',
        title: 'Purchase Order Cancelled',
        message: `PO ${poToCancel.poNumber} has been cancelled successfully.`,
      });
      await loadData();
      if (selectedPO?.id === poToCancel.id) {
        setSelectedPO((prev) => (prev ? { ...prev, status: 'CANCELLED' } : null));
      }
      setPoToCancel(null);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Cancellation Failed',
        message: err.message || 'Could not cancel purchase order',
      });
    } finally {
      setIsCancelling(null);
    }
  };

  // Pipeline: DATA -> SEARCH -> FILTER -> SORT -> PAGINATE
  // 1. Filtered by search
  const searchedPurchases = useMemo(() => {
    if (!search.trim()) return purchases;
    const q = search.toLowerCase().trim();
    return purchases.filter(
      (p) =>
        p.poNumber.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q) ||
        p.itemsSummary.toLowerCase().includes(q) ||
        p.items.some(
          (it) => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)
        ) ||
        (p.notes && p.notes.toLowerCase().includes(q))
    );
  }, [purchases, search]);

  // 2. Filtered by status
  const statusFilteredPurchases = useMemo(() => {
    if (statusFilter === 'ALL') return searchedPurchases;
    return searchedPurchases.filter((p) => p.status === statusFilter);
  }, [searchedPurchases, statusFilter]);

  // 3. Sorted
  const sortedPurchases = useMemo(() => {
    const list = [...statusFilteredPurchases];
    switch (sortBy) {
      case 'newest':
        return list.sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
      case 'oldest':
        return list.sort((a, b) => new Date(a.date || a.createdAt).getTime() - new Date(b.date || b.createdAt).getTime());
      case 'amount_desc':
        return list.sort((a, b) => b.totalAmount - a.totalAmount);
      case 'amount_asc':
        return list.sort((a, b) => a.totalAmount - b.totalAmount);
      case 'po_asc':
        return list.sort((a, b) => a.poNumber.localeCompare(b.poNumber));
      default:
        return list;
    }
  }, [statusFilteredPurchases, sortBy]);

  // 4. Paginated
  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination({
    items: sortedPurchases,
    resetDependencies: [search, statusFilter, sortBy],
  });

  // Selected vendor object for create modal
  const selectedVendor = useMemo(() => {
    return vendors.find((v) => v.id === selectedVendorId);
  }, [vendors, selectedVendorId]);

  // Filtered vendors in dropdown
  const filteredVendors = useMemo(() => {
    if (!vendorSearch.trim()) return vendors;
    const q = vendorSearch.toLowerCase().trim();
    return vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.category.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        (v.contactPerson && v.contactPerson.toLowerCase().includes(q)) ||
        (v.phone && v.phone.includes(q))
    );
  }, [vendors, vendorSearch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Compact Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--yz-bg-surface)',
          padding: '8px 10px',
          borderRadius: 'var(--yz-radius-sm)',
          border: '1px solid var(--yz-border)',
          gap: '8px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '280px', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', width: '260px' }}>
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
              placeholder="Search PO #, vendor, products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="yz-input"
              style={{ paddingLeft: '26px' }}
            />
          </div>

          {/* Status Filter */}
          <CustomDropdown
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as any)}
            options={[
              { value: 'ALL', label: 'All Statuses' },
              { value: 'ORDERED', label: 'Ordered' },
              { value: 'RECEIVED', label: 'Received' },
              { value: 'CANCELLED', label: 'Cancelled' },
            ]}
            prefixLabel="Status:"
            minWidth="140px"
          />

          {/* Sort By */}
          <CustomDropdown
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
            options={[
              { value: 'newest', label: 'Newest First' },
              { value: 'oldest', label: 'Oldest First' },
              { value: 'amount_desc', label: 'Highest Amount' },
              { value: 'amount_asc', label: 'Lowest Amount' },
              { value: 'po_asc', label: 'PO # (A-Z)' },
            ]}
            prefixLabel="Sort:"
            minWidth="140px"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', fontFamily: 'var(--yz-font-mono)' }}>
            {totalItems} {totalItems === 1 ? 'order' : 'orders'}
          </span>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={handleOpenCreateModal}
          >
            Create Purchase Order
          </Button>
        </div>
      </div>

      {/* Clean Compact ERP Purchases Table (NO ACTIONS COLUMN, ENTIRE ROW CLICKABLE) */}
      <div className="yz-table-container">
        <table className="yz-table">
          <thead>
            <tr>
              <th style={{ width: '130px' }}>PO NUMBER</th>
              <th style={{ minWidth: '180px' }}>VENDOR</th>
              <th style={{ width: '105px' }}>DATE</th>
              <th>PRODUCTS</th>
              <th style={{ width: '120px', textAlign: 'right' }}>TOTAL AMOUNT</th>
              <th style={{ width: '125px', textAlign: 'center' }}>STATUS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '28px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading purchase orders from database...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedItems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '28px', color: 'var(--yz-text-muted)' }}>
                  No purchase orders found matching search criteria.
                </td>
              </tr>
            ) : (
              paginatedItems.map((p) => {
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedPO(p)}
                    style={{ cursor: 'pointer' }}
                    title="Click row to view purchase order details"
                  >
                    {/* PO NUMBER */}
                    <td style={{ fontWeight: 700, fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-primary, #832729)' }}>
                      {p.poNumber}
                    </td>

                    {/* VENDOR */}
                    <td>
                      <div className="yz-cell-truncate" style={{ maxWidth: '240px', fontWeight: 600 }}>
                        {p.vendorName}
                      </div>
                    </td>

                    {/* DATE */}
                    <td style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', fontFamily: 'var(--yz-font-mono)' }}>
                      {p.date}
                    </td>

                    {/* PRODUCTS */}
                    <td>
                      <div className="yz-cell-truncate" style={{ maxWidth: '340px' }} title={p.itemsSummary}>
                        {p.itemsSummary || `${p.itemsCount} line items`}
                      </div>
                    </td>

                    {/* TOTAL AMOUNT */}
                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 700,
                        fontFamily: 'var(--yz-font-mono)',
                      }}
                      className="tabular-nums"
                    >
                      ₹{p.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* STATUS */}
                    <td style={{ textAlign: 'center' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '2px 8px',
                          borderRadius: 'var(--yz-radius-sm)',
                          fontSize: '10.5px',
                          fontWeight: 700,
                          backgroundColor:
                            p.status === 'RECEIVED'
                              ? '#DCFCE7'
                              : p.status === 'ORDERED'
                              ? '#FEF3C7'
                              : '#FEE2E2',
                          color:
                            p.status === 'RECEIVED'
                              ? '#166534'
                              : p.status === 'ORDERED'
                              ? '#92400E'
                              : '#991B1B',
                          border:
                            p.status === 'RECEIVED'
                              ? '1px solid #BBF7D0'
                              : p.status === 'ORDERED'
                              ? '1px solid #FDE68A'
                              : '1px solid #FECACA',
                        }}
                      >
                        {p.status === 'RECEIVED' ? (
                          <>
                            <CheckCircle2 size={11} />
                            <span>Received</span>
                          </>
                        ) : p.status === 'ORDERED' ? (
                          <>
                            <Clock size={11} />
                            <span>Ordered</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={11} />
                            <span>Cancelled</span>
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Compact Shared Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          itemLabel="purchase orders"
        />
      </div>

      {/* Informational Purchase Order Detail Modal */}
      {selectedPO && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedPO(null)}
          title={`Purchase Order ${selectedPO.poNumber}`}
          subtitle={`Vendor: ${selectedPO.vendorName} • Order Date: ${selectedPO.date}`}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Top Order Information Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '10px',
                backgroundColor: 'var(--yz-bg-subtle)',
                padding: '10px 12px',
                borderRadius: 'var(--yz-radius-sm)',
                border: '1px solid var(--yz-border)',
                fontSize: '11.5px',
              }}
            >
              {/* Supplier / Vendor Details */}
              <div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    color: 'var(--yz-text-muted)',
                    marginBottom: '3px',
                  }}
                >
                  Vendor & Guild Details:
                </strong>
                <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                  {selectedPO.vendorName}
                </div>
                {selectedPO.supplierPhone && (
                  <div style={{ color: 'var(--yz-text-secondary)', fontSize: '11px', marginTop: '1px' }}>
                    Phone: {selectedPO.supplierPhone}
                  </div>
                )}
                {selectedPO.supplierAddress && (
                  <div style={{ color: 'var(--yz-text-muted)', fontSize: '11px', marginTop: '1px' }}>
                    Address: {selectedPO.supplierAddress}
                  </div>
                )}
                {selectedPO.supplierGstin && (
                  <div style={{ color: 'var(--yz-text-muted)', fontSize: '10.5px', marginTop: '1px', fontFamily: 'var(--yz-font-mono)' }}>
                    GSTIN: {selectedPO.supplierGstin}
                  </div>
                )}
              </div>

              {/* Order & Showroom Details */}
              <div>
                <strong
                  style={{
                    display: 'block',
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    color: 'var(--yz-text-muted)',
                    marginBottom: '3px',
                  }}
                >
                  Order & Warehouse Details:
                </strong>
                <div style={{ color: 'var(--yz-text-secondary)', fontSize: '11px' }}>
                  Order Date: <strong style={{ color: 'var(--yz-text-primary)' }}>{selectedPO.date}</strong>
                </div>
                <div style={{ color: 'var(--yz-text-secondary)', fontSize: '11px', marginTop: '1px' }}>
                  Receiving Desk: <strong style={{ color: 'var(--yz-text-primary)' }}>{selectedPO.location}</strong>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>Status:</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 8px',
                      borderRadius: 'var(--yz-radius-sm)',
                      fontSize: '10.5px',
                      fontWeight: 700,
                      backgroundColor:
                        selectedPO.status === 'RECEIVED'
                          ? '#DCFCE7'
                          : selectedPO.status === 'ORDERED'
                          ? '#FEF3C7'
                          : '#FEE2E2',
                      color:
                        selectedPO.status === 'RECEIVED'
                          ? '#166534'
                          : selectedPO.status === 'ORDERED'
                          ? '#92400E'
                          : '#991B1B',
                      border:
                        selectedPO.status === 'RECEIVED'
                          ? '1px solid #BBF7D0'
                          : selectedPO.status === 'ORDERED'
                          ? '1px solid #FDE68A'
                          : '1px solid #FECACA',
                    }}
                  >
                    {selectedPO.status === 'RECEIVED' ? (
                      <>
                        <CheckCircle2 size={11} />
                        <span>Received</span>
                      </>
                    ) : selectedPO.status === 'ORDERED' ? (
                      <>
                        <Clock size={11} />
                        <span>Ordered</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={11} />
                        <span>Cancelled</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Itemized Procurement Lines */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--yz-text-secondary)',
                  marginBottom: '4px',
                }}
              >
                Itemized Procurement Lines
              </div>
              <div className="yz-table-container">
                <table className="yz-table">
                  <thead>
                    <tr>
                      <th>Product Description</th>
                      <th style={{ width: '100px' }}>SKU</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>Qty</th>
                      <th style={{ width: '100px', textAlign: 'right' }}>Unit Cost</th>
                      <th style={{ width: '110px', textAlign: 'right' }}>Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPO.items.map((it, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 500 }}>{it.productName}</td>
                        <td
                          style={{
                            fontFamily: 'var(--yz-font-mono)',
                            fontSize: '11px',
                            color: 'var(--yz-text-secondary)',
                          }}
                        >
                          {it.sku}
                        </td>
                        <td style={{ textAlign: 'center', fontFamily: 'var(--yz-font-mono)' }}>
                          {it.quantity}
                        </td>
                        <td
                          style={{ textAlign: 'right', fontFamily: 'var(--yz-font-mono)' }}
                          className="tabular-nums"
                        >
                          ₹{it.unitCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td
                          style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}
                          className="tabular-nums"
                        >
                          ₹{(it.total || it.quantity * it.unitCost).toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & Notes */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                borderTop: '1px solid var(--yz-border)',
                paddingTop: '8px',
              }}
            >
              <div style={{ flex: 1 }}>
                {selectedPO.notes && (
                  <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', fontStyle: 'italic' }}>
                    Procurement Notes: {selectedPO.notes}
                  </div>
                )}
                {selectedPO.status === 'RECEIVED' ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      color: '#166534',
                      backgroundColor: '#F0FDF4',
                      padding: '4px 8px',
                      borderRadius: 'var(--yz-radius-sm)',
                      border: '1px solid #BBF7D0',
                      marginTop: '6px',
                    }}
                  >
                    <PackageCheck size={13} />
                    <span>Stock verified & credited to showroom inventory ledger.</span>
                  </div>
                ) : selectedPO.status === 'ORDERED' ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      color: '#92400E',
                      backgroundColor: '#FEF3C7',
                      padding: '4px 8px',
                      borderRadius: 'var(--yz-radius-sm)',
                      border: '1px solid #FDE68A',
                      marginTop: '6px',
                    }}
                  >
                    <Clock size={13} />
                    <span>Awaiting shipment delivery from artisan loom guild.</span>
                  </div>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '11px',
                      color: '#991B1B',
                      backgroundColor: '#FEF2F2',
                      padding: '4px 8px',
                      borderRadius: 'var(--yz-radius-sm)',
                      border: '1px solid #FECACA',
                      marginTop: '6px',
                    }}
                  >
                    <XCircle size={13} />
                    <span>This purchase order has been cancelled. No inventory or financial postings were made.</span>
                  </div>
                )}
              </div>

              <div
                style={{
                  width: '220px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                  fontSize: '11.5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--yz-text-muted)' }}>Subtotal:</span>
                  <span style={{ fontFamily: 'var(--yz-font-mono)' }}>
                    ₹{(selectedPO.subtotal || selectedPO.totalAmount * 0.9523).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--yz-text-muted)' }}>GST (5%):</span>
                  <span style={{ fontFamily: 'var(--yz-font-mono)' }}>
                    ₹{(selectedPO.taxTotal || selectedPO.totalAmount * 0.0477).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--yz-border)',
                    paddingTop: '3px',
                    marginTop: '2px',
                  }}
                >
                  <strong style={{ color: 'var(--yz-text-primary)' }}>Grand Total:</strong>
                  <strong
                    style={{
                      fontFamily: 'var(--yz-font-mono)',
                      color: 'var(--yz-primary, #832729)',
                      fontSize: '12px',
                    }}
                  >
                    ₹{selectedPO.totalAmount.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              </div>
            </div>

            {/* Footer with Actions (Only when actionable) */}
            {selectedPO.status === 'ORDERED' && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '12px',
                  borderTop: '1px solid var(--yz-border)',
                  paddingTop: '10px',
                }}
              >
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<XCircle size={13} />}
                  onClick={() => setPoToCancel(selectedPO)}
                  disabled={isCancelling === selectedPO.id || isReceiving === selectedPO.id}
                  style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                >
                  Cancel Purchase Order
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PackageCheck size={14} />}
                  onClick={() => handleReceivePO(selectedPO)}
                  disabled={isReceiving === selectedPO.id || isCancelling === selectedPO.id}
                  style={{ backgroundColor: '#166534', borderColor: '#166534' }}
                >
                  {isReceiving === selectedPO.id ? 'Processing Receipt...' : 'Receive Goods into Stock (GRN)'}
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Cancel Purchase Order Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(poToCancel)}
        onClose={() => !isCancelling && setPoToCancel(null)}
        onConfirm={handleConfirmCancelPO}
        title="Cancel Purchase Order"
        description={
          poToCancel ? (
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--yz-text-primary)' }}>
                Are you sure you want to cancel purchase order <strong>"{poToCancel.poNumber}"</strong>?
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--yz-text-secondary)', lineHeight: 1.45 }}>
                This will mark order <strong>{poToCancel.poNumber}</strong> ({poToCancel.vendorName}) as Cancelled.
                No goods will be received into showroom inventory and the order becomes read-only history.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Cancel Purchase Order"
        cancelLabel="Keep Order"
        variant="danger"
        isLoading={Boolean(isCancelling)}
      />

      {/* Reworked Invenaro-Style Create Purchase Order Modal */}
      {isCreateModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => !isSubmitting && setIsCreateModalOpen(false)}
          title="Create Purchase Order (PO)"
          subtitle="Issues a formal procurement order to an artisanal supplier or weaver guild"
          maxWidth="720px"
        >
          <form onSubmit={handleCreatePO} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Top Fields: Vendor Selector & Order Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '10px' }}>
              {/* Supplier / Vendor with custom dropdown + Create New Vendor */}
              <div ref={vendorDropdownRef} style={{ position: 'relative' }}>
                <label className="yz-label">Supplier / Vendor *</label>
                <button
                  id="po-vendor-dropdown-btn"
                  type="button"
                  onClick={() => setIsVendorDropdownOpen((prev) => !prev)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '6px',
                    height: '30px',
                    padding: '0 8px',
                    borderRadius: 'var(--yz-radius-sm)',
                    border: '1px solid var(--yz-border)',
                    backgroundColor: 'var(--yz-bg-surface)',
                    cursor: 'pointer',
                    fontSize: '11px',
                    color: 'var(--yz-text-primary)',
                    textAlign: 'left',
                    boxSizing: 'border-box',
                  }}
                >
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: selectedVendor ? 600 : 400,
                    }}
                  >
                    {selectedVendor ? `${selectedVendor.name} (${selectedVendor.city || selectedVendor.category})` : 'Select vendor / supplier...'}
                  </span>
                  <ChevronDown
                    size={13}
                    style={{
                      flexShrink: 0,
                      color: 'var(--yz-text-muted)',
                      transform: isVendorDropdownOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                    }}
                  />
                </button>

                {/* Vendor Dropdown Menu */}
                {isVendorDropdownOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 3px)',
                      left: 0,
                      right: 0,
                      backgroundColor: 'var(--yz-bg-surface)',
                      border: '1px solid var(--yz-border)',
                      borderRadius: 'var(--yz-radius-sm)',
                      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
                      zIndex: 80,
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      maxHeight: '260px',
                    }}
                  >
                    {/* Search vendors... */}
                    <div style={{ position: 'relative' }}>
                      <Search
                        size={12}
                        style={{
                          position: 'absolute',
                          left: '7px',
                          top: '50%',
                          transform: 'translateY(-50)',
                          color: 'var(--yz-text-muted)',
                        }}
                      />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search vendors..."
                        value={vendorSearch}
                        onChange={(e) => setVendorSearch(e.target.value)}
                        className="yz-input"
                        style={{ height: '26px', fontSize: '11px', paddingLeft: '24px', width: '100%', boxSizing: 'border-box' }}
                      />
                    </div>

                    {/* Vendors List */}
                    <div
                      style={{
                        overflowY: 'auto',
                        maxHeight: '160px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1px',
                      }}
                    >
                      {filteredVendors.length === 0 ? (
                        <div style={{ padding: '8px', fontSize: '11px', color: 'var(--yz-text-muted)', textAlign: 'center' }}>
                          No matching vendor found
                        </div>
                      ) : (
                        filteredVendors.map((v) => {
                          const isSelected = selectedVendorId === v.id;
                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => {
                                setSelectedVendorId(v.id);
                                setIsVendorDropdownOpen(false);
                                setVendorSearch('');
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '5px 8px',
                                borderRadius: 'var(--yz-radius-sm)',
                                border: 'none',
                                backgroundColor: isSelected ? 'var(--yz-primary-subtle, #FDF2F4)' : 'transparent',
                                cursor: 'pointer',
                                textAlign: 'left',
                                fontSize: '11px',
                                color: isSelected ? 'var(--yz-primary, #832729)' : 'var(--yz-text-primary)',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = '#F1F5F9';
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                              }}
                            >
                              <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <div style={{ fontWeight: isSelected ? 600 : 500 }}>{v.name}</div>
                                <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>
                                  {v.category} {v.city ? `• ${v.city}` : ''} {v.phone ? `• ${v.phone}` : ''}
                                </div>
                              </div>
                              {isSelected && <Check size={13} style={{ color: 'var(--yz-primary, #832729)' }} />}
                            </button>
                          );
                        })
                      )}
                    </div>

                    {/* + Create New Vendor Action Button */}
                    <div style={{ borderTop: '1px solid var(--yz-border)', paddingTop: '4px', marginTop: '2px' }}>
                      <button
                        id="po-create-vendor-btn"
                        type="button"
                        onClick={() => {
                          setIsVendorDropdownOpen(false);
                          setIsAddVendorModalOpen(true);
                        }}
                        className="yz-btn yz-btn-ghost yz-btn-sm"
                        style={{
                          width: '100%',
                          justifyContent: 'flex-start',
                          color: 'var(--yz-primary, #832729)',
                          fontWeight: 600,
                          fontSize: '11px',
                          height: '26px',
                          padding: '0 6px',
                          gap: '4px',
                        }}
                      >
                        <Plus size={12} />
                        <span>Create New Vendor</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Date */}
              <div>
                <label className="yz-label">Order Date *</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="yz-input"
                  required
                  style={{ height: '30px', fontSize: '11px', fontFamily: 'var(--yz-font-mono)' }}
                />
              </div>
            </div>

            {/* Line Items Editor */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--yz-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Line Items ({lineItems.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddLineItem}
                  className="yz-btn yz-btn-ghost yz-btn-sm"
                  style={{
                    color: 'var(--yz-primary, #832729)',
                    fontWeight: 700,
                    fontSize: '11px',
                    height: '24px',
                    padding: '0 6px',
                    gap: '4px',
                  }}
                >
                  <Plus size={13} />
                  <span>Add SKU</span>
                </button>
              </div>

              {/* Table Column Headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 70px 95px 95px 28px',
                  gap: '6px',
                  padding: '0 4px',
                  fontSize: '10px',
                  fontWeight: 600,
                  color: 'var(--yz-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <span>Product Catalog</span>
                <span style={{ textAlign: 'center' }}>Qty</span>
                <span style={{ textAlign: 'right' }}>Unit Cost</span>
                <span style={{ textAlign: 'right' }}>Line Total</span>
                <span></span>
              </div>

              {/* Line Item Rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {lineItems.map((item, index) => {
                  const lineTotal = (item.orderedQty || 0) * (item.unitCost || 0);

                  return (
                    <div
                      key={index}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 70px 95px 95px 28px',
                        gap: '6px',
                        alignItems: 'center',
                        backgroundColor: '#F8FAFC',
                        padding: '6px 8px',
                        borderRadius: 'var(--yz-radius-sm)',
                        border: '1px solid var(--yz-border)',
                      }}
                    >
                      {/* Product Catalog Search Dropdown */}
                      <ProductSearchDropdown
                        products={products}
                        selectedProductId={item.productId}
                        disabledProductIds={lineItems
                          .map((l, i) => (i !== index ? l.productId : ''))
                          .filter(Boolean)}
                        onSelect={(prod) => handleSelectProduct(index, prod)}
                      />

                      {/* Quantity Input */}
                      <input
                        type="number"
                        min="1"
                        value={item.orderedQty || ''}
                        onChange={(e) =>
                          handleUpdateLineItem(index, {
                            orderedQty: parseInt(e.target.value, 10) || 1,
                          })
                        }
                        className="yz-input"
                        style={{
                          height: '30px',
                          textAlign: 'center',
                          fontSize: '11px',
                          fontFamily: 'var(--yz-font-mono)',
                          padding: '0 4px',
                        }}
                      />

                      {/* Unit Cost Input */}
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitCost}
                        onChange={(e) =>
                          handleUpdateLineItem(index, {
                            unitCost: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="yz-input"
                        style={{
                          height: '30px',
                          textAlign: 'right',
                          fontSize: '11px',
                          fontFamily: 'var(--yz-font-mono)',
                          padding: '0 6px',
                        }}
                      />

                      {/* Line Total */}
                      <div
                        style={{
                          textAlign: 'right',
                          fontWeight: 700,
                          fontFamily: 'var(--yz-font-mono)',
                          fontSize: '11px',
                          color: 'var(--yz-text-primary)',
                        }}
                        className="tabular-nums"
                      >
                        ₹{lineTotal.toLocaleString('en-IN', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>

                      {/* Remove Button */}
                      <div style={{ textAlign: 'center' }}>
                        {lineItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLineItem(index)}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              color: 'var(--yz-text-muted)',
                              padding: '2px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '2px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#DC2626')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--yz-text-muted)')}
                            title="Remove SKU"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Procurement Notes & Dynamic Totals Summary */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr',
                gap: '12px',
                borderTop: '1px solid var(--yz-border)',
                paddingTop: '8px',
              }}
            >
              <div>
                <label className="yz-label">Procurement & Loom Notes</label>
                <textarea
                  className="yz-input"
                  rows={2}
                  placeholder="e.g. Traditional loom order, certified mulberry silk lot"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  style={{ height: 'auto', padding: '6px', fontSize: '11px', width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              {/* Totals Box */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  backgroundColor: '#F8FAFC',
                  padding: '8px 10px',
                  borderRadius: 'var(--yz-radius-sm)',
                  border: '1px solid var(--yz-border)',
                  fontSize: '11.5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--yz-text-muted)' }}>Subtotal:</span>
                  <span style={{ fontFamily: 'var(--yz-font-mono)' }}>
                    ₹{draftSubtotal.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--yz-text-muted)' }}>GST (5%):</span>
                  <span style={{ fontFamily: 'var(--yz-font-mono)' }}>
                    ₹{draftTaxTotal.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--yz-border)',
                    paddingTop: '4px',
                    marginTop: '2px',
                  }}
                >
                  <strong style={{ color: 'var(--yz-text-primary)' }}>Grand Total:</strong>
                  <strong
                    style={{
                      fontFamily: 'var(--yz-font-mono)',
                      color: 'var(--yz-primary, #832729)',
                      fontSize: '12px',
                    }}
                  >
                    ₹{draftGrandTotal.toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </strong>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSubmitting || !selectedVendorId || lineItems.length === 0}
              >
                {isSubmitting ? 'Issuing PO...' : 'Issue Purchase Order'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Embedded Add Vendor Modal triggered directly from PO vendor selector */}
      <AddVendorModal
        isOpen={isAddVendorModalOpen}
        onClose={() => setIsAddVendorModalOpen(false)}
        onVendorCreated={(newVendor) => {
          // Add to vendors list and auto-select
          setVendors((prev) => [newVendor, ...prev]);
          setSelectedVendorId(newVendor.id);
          setIsAddVendorModalOpen(false);
        }}
      />
    </div>
  );
};
