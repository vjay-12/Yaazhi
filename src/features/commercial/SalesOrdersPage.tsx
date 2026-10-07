import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Download, Ban, Loader2, ChevronDown, Check, Banknote, QrCode } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { Pagination } from '../../components/common/Pagination';
import { usePagination } from '../../hooks/usePagination';
import { salesOrderService, type SalesOrderData } from '../../services/salesOrderService';
import { settingsService } from '../../services/settingsService';
import { useToast } from '../../components/common/Toast';
import { downloadSalesOrderPdf } from '../../utils/invoicePdfGenerator';
import { OrderDetailModal } from './OrderDetailModal';

type StatusFilterType = 'ALL' | 'PAID' | 'PENDING' | 'VOIDED';

const STATUS_FILTER_OPTIONS: { id: StatusFilterType; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'PAID', label: 'Paid' },
  { id: 'PENDING', label: 'Pending' },
  { id: 'VOIDED', label: 'Voided' },
];

export const SalesOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrderData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrderData | null>(null);

  // Settle modal state
  const [orderToSettle, setOrderToSettle] = useState<SalesOrderData | null>(null);
  const [settleAmount, setSettleAmount] = useState<string>('');
  const [settleCashTendered, setSettleCashTendered] = useState<string>('');
  const [settlePaymentMode, setSettlePaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [settleReference, setSettleReference] = useState<string>('');
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);
  const [storePaymentSettings, setStorePaymentSettings] = useState<{ upiId: string; upiQrUrl: string }>({
    upiId: 'yaazhi@oksbi',
    upiQrUrl: '/images/payment/yaazhi-upi-qr.png',
  });

  // Void confirmation state
  const [orderToVoid, setOrderToVoid] = useState<SalesOrderData | null>(null);
  const [isVoiding, setIsVoiding] = useState(false);

  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const soList = await salesOrderService.list();
      setOrders(soList);
    } catch {
      showToast({ type: 'error', title: 'Load Error', message: 'Could not load sales orders' });
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
    settingsService
      .getSettings()
      .then((s) => {
        if (s) {
          setStorePaymentSettings({
            upiId: s.upi_id || 'yaazhi@oksbi',
            upiQrUrl: s.upi_qr_url || '/images/payment/yaazhi-upi-qr.png',
          });
        }
      })
      .catch(() => {});
  }, [loadData]);

  // Click outside to close custom status dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
    };
    if (isStatusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStatusDropdownOpen]);

  // Settle action openers
  const handleOpenSettle = (order: SalesOrderData) => {
    setOrderToSettle(order);
    setSettleAmount(order.pendingAmount.toString());
    setSettleCashTendered(order.pendingAmount.toString());
    setSettlePaymentMode('CASH');
    setSettleReference('');
  };

  const handleConfirmSettle = async () => {
    if (!orderToSettle) return;
    const numAmount = Number(settleAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Please enter a valid settlement amount greater than 0.',
      });
      return;
    }

    if (numAmount > orderToSettle.pendingAmount + 0.01) {
      showToast({
        type: 'error',
        title: 'Amount Exceeds Due',
        message: `Settlement amount cannot exceed pending due of ₹${orderToSettle.pendingAmount.toLocaleString('en-IN')}.`,
      });
      return;
    }

    if (settlePaymentMode === 'CASH') {
      const tenderedStr = settleCashTendered.trim();
      const tendered = tenderedStr === '' ? numAmount : Number(tenderedStr);
      if (isNaN(tendered) || tendered < 0) {
        showToast({
          type: 'error',
          title: 'Invalid Cash Input',
          message: 'Cash received cannot be negative or invalid.',
        });
        return;
      }
      if (tendered < numAmount) {
        showToast({
          type: 'error',
          title: 'Insufficient Cash',
          message: `Cash received (₹${tendered.toLocaleString('en-IN')}) is less than required settlement amount (₹${numAmount.toLocaleString('en-IN')}).`,
        });
        return;
      }
    }

    try {
      setIsSubmittingSettle(true);
      await salesOrderService.settle(orderToSettle.id, {
        amount: numAmount,
        payment_mode: settlePaymentMode,
        reference_number: settlePaymentMode === 'UPI' ? (settleReference.trim() || undefined) : undefined,
        notes: `Balance settlement from Sales Orders table`,
      });

      showToast({
        type: 'success',
        title: 'Payment Recorded',
        message: `Successfully settled ₹${numAmount.toLocaleString('en-IN')} for order ${orderToSettle.orderNumber}.`,
      });

      setOrderToSettle(null);
      const updatedList = await salesOrderService.list();
      setOrders(updatedList);
      if (selectedOrder && selectedOrder.id === orderToSettle.id) {
        const updated = updatedList.find((x) => x.id === orderToSettle.id);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Settlement Failed',
        message: err.message || 'Failed to record settlement payment',
      });
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  const handleConfirmVoid = async () => {
    if (!orderToVoid) return;
    try {
      setIsVoiding(true);
      await salesOrderService.void(orderToVoid.id);
      showToast({
        type: 'info',
        title: 'Sales Order Voided',
        message: `Order ${orderToVoid.orderNumber} has been voided and preserved in history.`,
      });
      if (selectedOrder?.id === orderToVoid.id) {
        setSelectedOrder({ ...selectedOrder, status: 'VOIDED' });
      }
      setOrderToVoid(null);
      await loadData();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Void Error',
        message: err.message || 'Failed to void sales order',
      });
    } finally {
      setIsVoiding(false);
    }
  };

  const handleDownloadInvoice = async (order: SalesOrderData) => {
    try {
      await downloadSalesOrderPdf(order);
      showToast({
        type: 'success',
        title: 'Invoice Downloaded',
        message: `Saved Yaazhi invoice for ${order.orderNumber}`,
      });
    } catch (err: any) {
      console.error('Invoice generation failed:', err);
      showToast({
        type: 'error',
        title: 'Download Failed',
        message: err.message || 'Could not generate invoice PDF',
      });
    }
  };

  const renderStatusBadge = (o: SalesOrderData) => {
    const isVoided = o.status === 'VOIDED' || o.status === 'CANCELLED' || o.paymentStatus === 'VOIDED';
    const isPaid = !isVoided && (o.paymentStatus === 'PAID' || (o.totalAmount > 0 && o.pendingAmount === 0));

    let label = 'PENDING';
    let bg = 'var(--yz-bg-subtle, #F1F5F9)';
    let color = 'var(--yz-text-secondary, #475569)';
    let border = 'var(--yz-border-strong, #CBD5E1)';

    if (isVoided) {
      label = 'VOIDED';
      bg = 'var(--yz-bg-subtle, #F8FAFC)';
      color = 'var(--yz-text-muted, #64748B)';
      border = 'var(--yz-border, #CBD5E1)';
    } else if (isPaid) {
      label = 'PAID';
      bg = 'var(--yz-status-in-stock-bg, #DCFCE7)';
      color = 'var(--yz-status-in-stock, #166534)';
      border = 'var(--yz-status-in-stock-border, #BBF7D0)';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '66px',
          height: '22px',
          boxSizing: 'border-box',
          borderRadius: 'var(--yz-radius-full)',
          fontSize: '10.5px',
          fontWeight: 700,
          letterSpacing: '0.02em',
          lineHeight: 1,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          whiteSpace: 'nowrap',
          padding: '0 8px',
          userSelect: 'none',
        }}
      >
        {label}
      </span>
    );
  };

  const renderActionButtons = (o: SalesOrderData) => {
    const isVoided = o.status === 'VOIDED' || o.status === 'CANCELLED' || o.paymentStatus === 'VOIDED';
    const isPaid = !isVoided && (o.paymentStatus === 'PAID' || (o.totalAmount > 0 && o.pendingAmount === 0));

    // Shared void icon button (26px x 26px footprint)
    const renderVoidButton = () => {
      if (isVoided) {
        return (
          <button
            type="button"
            className="yz-btn yz-btn-ghost yz-btn-sm"
            disabled
            style={{
              width: '26px',
              height: '26px',
              padding: 0,
              borderRadius: 'var(--yz-radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--yz-text-muted, #94A3B8)',
              opacity: 0.35,
              cursor: 'not-allowed',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
            onClick={(e) => e.stopPropagation()}
            title="Order already voided"
          >
            <Ban size={12} />
          </button>
        );
      }

      if (isPaid) {
        return (
          <button
            type="button"
            className="yz-btn yz-btn-ghost yz-btn-sm"
            style={{
              width: '26px',
              height: '26px',
              padding: 0,
              borderRadius: 'var(--yz-radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--yz-error, #DC2626)',
              boxSizing: 'border-box',
              flexShrink: 0,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setOrderToVoid(o);
            }}
            title="Void Sales Order"
          >
            <Ban size={12} />
          </button>
        );
      }

      // For PENDING orders: void is disabled
      return (
        <button
          type="button"
          className="yz-btn yz-btn-ghost yz-btn-sm"
          disabled
          style={{
            width: '26px',
            height: '26px',
            padding: 0,
            borderRadius: 'var(--yz-radius-sm)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--yz-text-muted, #94A3B8)',
            opacity: 0.35,
            cursor: 'not-allowed',
            boxSizing: 'border-box',
            flexShrink: 0,
          }}
          onClick={(e) => e.stopPropagation()}
          title="Voiding not allowed for pending orders"
        >
          <Ban size={12} />
        </button>
      );
    };

    // Primary action button (exact same 70px x 26px footprint across all states)
    const renderPrimaryButton = () => {
      if (isPaid || isVoided) {
        return (
          <button
            type="button"
            className="yz-btn yz-btn-secondary yz-btn-sm"
            style={{
              width: '70px',
              height: '26px',
              padding: '0 6px',
              fontSize: '11px',
              borderRadius: 'var(--yz-radius-sm)',
              gap: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleDownloadInvoice(o);
            }}
            title={isVoided ? 'Download Voided Invoice' : 'Download Invoice'}
          >
            <Download size={11} style={{ flexShrink: 0 }} />
            <span>Invoice</span>
          </button>
        );
      }

      // PENDING order -> Settle button
      return (
        <button
          type="button"
          className="yz-btn yz-btn-primary yz-btn-sm"
          style={{
            width: '70px',
            height: '26px',
            padding: '0 6px',
            fontSize: '11px',
            borderRadius: 'var(--yz-radius-sm)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxSizing: 'border-box',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
          onClick={(e) => {
            e.stopPropagation();
            handleOpenSettle(o);
          }}
          title={o.paidAmount > 0 ? 'Settle Remaining Balance' : 'Settle Payment'}
        >
          <span>Settle</span>
        </button>
      );
    };

    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '5px',
          width: '102px',
          height: '26px',
        }}
      >
        {renderPrimaryButton()}
        {renderVoidButton()}
      </div>
    );
  };

  // Filter combined search and custom status dropdown
  const filtered = orders.filter((o) => {
    // 1. Text Search matching
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      o.items.some((it) => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)) ||
      (o.itemsSummary && o.itemsSummary.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // 2. Status Filter matching (Only PAID, PENDING, VOIDED)
    const isVoided = o.status === 'VOIDED' || o.status === 'CANCELLED' || o.paymentStatus === 'VOIDED';
    const isPaid = !isVoided && (o.paymentStatus === 'PAID' || (o.totalAmount > 0 && o.pendingAmount === 0));
    const isPending = !isVoided && !isPaid;

    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'PAID') return isPaid;
    if (statusFilter === 'PENDING') return isPending;
    if (statusFilter === 'VOIDED') return isVoided;

    return true;
  });

  const {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalItems,
    paginatedItems,
  } = usePagination({
    items: filtered,
    resetDependencies: [search, statusFilter],
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Compact Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--yz-bg-surface)',
          padding: '8px 12px',
          borderRadius: 'var(--yz-radius-md)',
          border: '1px solid var(--yz-border)',
          boxShadow: 'var(--yz-shadow-2xs)',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Search Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
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
              placeholder="Search SO #, client, or items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="yz-input"
              style={{ paddingLeft: '28px', height: '32px', fontSize: '11.5px', width: '100%' }}
            />
          </div>
        </div>

        {/* Right: Showing orders count & Status Filter Dropdown on TOP-RIGHT */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', whiteSpace: 'nowrap' }}>
            Showing <strong>{filtered.length}</strong> sales orders
          </div>

          <div style={{ position: 'relative' }} ref={statusDropdownRef}>
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="yz-input"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                height: '32px',
                padding: '0 10px',
                fontSize: '11.5px',
                cursor: 'pointer',
                backgroundColor: 'var(--yz-bg-surface)',
                border: '1px solid var(--yz-border)',
                borderRadius: 'var(--yz-radius-md)',
                color: 'var(--yz-text-primary)',
                minWidth: '115px',
                userSelect: 'none',
              }}
            >
              <span>
                <span style={{ color: 'var(--yz-text-muted)', marginRight: '4px' }}>Status:</span>
                <strong>{STATUS_FILTER_OPTIONS.find((s) => s.id === statusFilter)?.label || 'All'}</strong>
              </span>
              <ChevronDown
                size={13}
                style={{
                  color: 'var(--yz-text-muted)',
                  transform: isStatusDropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>

            {isStatusDropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 4px)',
                  right: 0,
                  backgroundColor: 'var(--yz-bg-surface)',
                  border: '1px solid var(--yz-border)',
                  borderRadius: 'var(--yz-radius-md)',
                  boxShadow: 'var(--yz-shadow-md)',
                  zIndex: 50,
                  minWidth: '135px',
                  padding: '4px 0',
                }}
              >
                <div
                  style={{
                    padding: '4px 10px 3px 10px',
                    fontSize: '10px',
                    fontWeight: 600,
                    color: 'var(--yz-text-muted)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                  }}
                >
                  Status
                </div>
                <div style={{ height: '1px', backgroundColor: 'var(--yz-border)', margin: '2px 0 4px 0' }} />
                {STATUS_FILTER_OPTIONS.map((opt) => {
                  const isSelected = statusFilter === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setStatusFilter(opt.id);
                        setIsStatusDropdownOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        padding: '5px 10px',
                        fontSize: '11px',
                        border: 'none',
                        background: isSelected ? 'var(--yz-primary-50, #FDF2F2)' : 'transparent',
                        color: isSelected ? 'var(--yz-primary, #832729)' : 'var(--yz-text-primary)',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        textAlign: 'left',
                        gap: '6px',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--yz-bg-subtle, #F1F5F9)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span
                        style={{
                          width: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {isSelected ? <Check size={12} style={{ color: 'var(--yz-primary, #832729)' }} /> : null}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sales Orders Table */}
      <div className="yz-table-container">
        <table className="yz-table" style={{ width: '100%', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ width: '115px', paddingLeft: '12px', textAlign: 'left' }}>ORDER NUMBER</th>
              <th style={{ width: '20%', textAlign: 'left' }}>CUSTOMER</th>
              <th style={{ width: '85px', textAlign: 'left' }}>DATE</th>
              <th style={{ textAlign: 'left' }}>PRODUCTS</th>
              <th style={{ width: '105px', textAlign: 'right' }}>TOTAL AMOUNT</th>
              <th style={{ width: '85px', textAlign: 'center' }}>STATUS</th>
              <th style={{ width: '108px', textAlign: 'center', paddingRight: '12px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Loading sales orders from database...</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: 'var(--yz-text-muted)' }}>
                  No sales orders found matching current filters.
                </td>
              </tr>
            ) : (
              paginatedItems.map((o) => {
                const productNames = o.items && o.items.length > 0
                  ? Array.from(new Set(o.items.map((it) => it.productName?.trim() || it.sku?.trim()).filter(Boolean)))
                  : (o.itemsSummary
                      ? o.itemsSummary.split(', ').map(s => s.replace(/\s*\(x\d+\)$/, '').trim()).filter(Boolean)
                      : ['Boutique Item']);

                const firstProduct = productNames[0] || 'Boutique Item';
                const extraCount = Math.max(0, productNames.length - 1);
                const fullProductsTooltip = productNames.join(', ');

                return (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOrder(o)}
                    style={{ cursor: 'pointer', height: '38px' }}
                    title="Click row to view sales order details"
                  >
                    <td
                      style={{
                        paddingLeft: '12px',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 600,
                          fontFamily: 'var(--yz-font-mono)',
                          fontSize: '11.5px',
                        }}
                        title={o.orderNumber}
                      >
                        {o.orderNumber}
                      </div>
                    </td>

                    <td style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontWeight: 500,
                          width: '100%',
                        }}
                        title={o.customerName}
                      >
                        {o.customerName}
                      </div>
                    </td>

                    <td style={{ fontSize: '11px', color: 'var(--yz-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {o.date}
                    </td>

                    {/* PRODUCTS: single-line, First Product +N, CSS ellipsis, full tooltip */}
                    <td style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          width: '100%',
                          minWidth: 0,
                        }}
                        title={fullProductsTooltip}
                      >
                        <span
                          style={{
                            flex: 1,
                            minWidth: 0,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: 500,
                            color: 'var(--yz-text-primary)',
                          }}
                        >
                          {firstProduct}
                        </span>
                        {extraCount > 0 && (
                          <span
                            style={{
                              flexShrink: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 4px',
                              height: '16px',
                              fontSize: '10px',
                              fontWeight: 700,
                              color: 'var(--yz-text-secondary, #475569)',
                              backgroundColor: 'var(--yz-bg-subtle, #F1F5F9)',
                              border: '1px solid var(--yz-border-strong, #CBD5E1)',
                              borderRadius: '3px',
                              lineHeight: 1,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            +{extraCount}
                          </span>
                        )}
                      </div>
                    </td>

                    <td
                      style={{
                        textAlign: 'right',
                        fontWeight: 600,
                        fontFamily: 'var(--yz-font-mono)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                      className="tabular-nums"
                    >
                      ₹{o.totalAmount.toLocaleString('en-IN')}
                    </td>

                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {renderStatusBadge(o)}
                    </td>

                    <td style={{ textAlign: 'center', paddingRight: '12px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                      {renderActionButtons(o)}
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
          itemLabel="sales orders"
        />
      </div>

      {/* Informational Sales Order Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        onDownloadInvoice={handleDownloadInvoice}
      />

      {/* Settle Balance Payment Modal */}
      {orderToSettle && (
        <Modal
          isOpen={true}
          onClose={() => !isSubmittingSettle && setOrderToSettle(null)}
          title={`Settle Balance — ${orderToSettle.orderNumber}`}
          subtitle={`Customer: ${orderToSettle.customerName} • Source: ${orderToSettle.location}`}
          maxWidth="480px"
          bodyPadding="14px 16px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setOrderToSettle(null)}
                disabled={isSubmittingSettle}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmSettle}
                disabled={
                  isSubmittingSettle ||
                  !Number(settleAmount) ||
                  Number(settleAmount) <= 0 ||
                  Number(settleAmount) > orderToSettle.pendingAmount + 0.01
                }
              >
                {isSubmittingSettle ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Loader2 size={12} className="animate-spin" /> Recording...
                  </span>
                ) : (
                  `Confirm Payment · ₹${Number(settleAmount || 0).toLocaleString('en-IN')}`
                )}
              </Button>
            </div>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Overview Card */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                backgroundColor: 'var(--yz-bg-subtle)',
                border: '1px solid var(--yz-border)',
                borderRadius: 'var(--yz-radius-sm)',
                padding: '6px 8px',
                textAlign: 'center',
                fontSize: '11px',
              }}
            >
              <div>
                <span style={{ color: 'var(--yz-text-muted)', fontSize: '9.5px', fontWeight: 600, display: 'block', letterSpacing: '0.2px' }}>
                  TOTAL AMOUNT
                </span>
                <strong style={{ fontSize: '12.5px', fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{orderToSettle.totalAmount.toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--yz-text-muted)', fontSize: '9.5px', fontWeight: 600, display: 'block', letterSpacing: '0.2px' }}>
                  ALREADY PAID
                </span>
                <strong style={{ fontSize: '12.5px', color: 'var(--yz-status-in-stock, #166534)', fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{orderToSettle.paidAmount.toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--yz-text-muted)', fontSize: '9.5px', fontWeight: 600, display: 'block', letterSpacing: '0.2px' }}>
                  PENDING DUE
                </span>
                <strong style={{ fontSize: '12.5px', color: 'var(--yz-status-low-stock, #B45309)', fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{orderToSettle.pendingAmount.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* 2-Column Grid: Settlement Input + Payment Mode */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '10px', alignItems: 'start' }}>
              {/* Settlement Input */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '3px',
                  }}
                >
                  <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                    Amount to Settle (₹)
                  </label>
                  <div style={{ display: 'flex', gap: '3px' }}>
                    <button
                      type="button"
                      className="yz-btn yz-btn-ghost yz-btn-sm"
                      style={{ height: '18px', padding: '0 4px', fontSize: '9.5px' }}
                      onClick={() => setSettleAmount(orderToSettle.pendingAmount.toString())}
                    >
                      Full
                    </button>
                    {orderToSettle.pendingAmount > 1000 && (
                      <button
                        type="button"
                        className="yz-btn yz-btn-ghost yz-btn-sm"
                        style={{ height: '18px', padding: '0 4px', fontSize: '9.5px' }}
                        onClick={() =>
                          setSettleAmount((Math.round(orderToSettle.pendingAmount / 2)).toString())
                        }
                      >
                        50%
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="number"
                  min="1"
                  max={orderToSettle.pendingAmount}
                  step="any"
                  className="yz-input"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  style={{
                    height: '28px',
                    fontSize: '12px',
                    fontFamily: 'var(--yz-font-mono)',
                    fontWeight: 600,
                  }}
                  autoFocus
                />
                <div style={{ marginTop: '2px', fontSize: '10px', lineHeight: 1.25 }}>
                  {Number(settleAmount) >= orderToSettle.pendingAmount ? (
                    <span style={{ color: 'var(--yz-status-in-stock, #166534)', fontWeight: 600 }}>
                      ✓ Order will be fully PAID
                    </span>
                  ) : Number(settleAmount) > 0 && Number(settleAmount) < orderToSettle.pendingAmount ? (
                    <span style={{ color: 'var(--yz-status-low-stock, #92400E)' }}>
                      Remaining due: ₹{(orderToSettle.pendingAmount - Number(settleAmount)).toLocaleString('en-IN')}
                    </span>
                  ) : Number(settleAmount) > orderToSettle.pendingAmount ? (
                    <span style={{ color: 'var(--yz-status-out-stock, #DC2626)', fontWeight: 600 }}>
                      Exceeds due of ₹{orderToSettle.pendingAmount.toLocaleString('en-IN')}
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    color: 'var(--yz-text-primary)',
                    marginBottom: '3px',
                  }}
                >
                  Payment Mode
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                  <button
                    type="button"
                    onClick={() => setSettlePaymentMode('CASH')}
                    style={{
                      height: '28px',
                      fontSize: '11px',
                      borderRadius: 'var(--yz-radius-sm)',
                      border:
                        settlePaymentMode === 'CASH'
                          ? '1px solid var(--yz-primary, #832729)'
                          : '1px solid var(--yz-border)',
                      backgroundColor:
                        settlePaymentMode === 'CASH'
                          ? 'var(--yz-primary-subtle, #FDF2F2)'
                          : 'var(--yz-bg-surface)',
                      color:
                        settlePaymentMode === 'CASH'
                          ? 'var(--yz-primary, #832729)'
                          : 'var(--yz-text-secondary)',
                      fontWeight: settlePaymentMode === 'CASH' ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <Banknote size={13} />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSettlePaymentMode('UPI')}
                    style={{
                      height: '28px',
                      fontSize: '11px',
                      borderRadius: 'var(--yz-radius-sm)',
                      border:
                        settlePaymentMode === 'UPI'
                          ? '1px solid var(--yz-primary, #832729)'
                          : '1px solid var(--yz-border)',
                      backgroundColor:
                        settlePaymentMode === 'UPI'
                          ? 'var(--yz-primary-subtle, #FDF2F2)'
                          : 'var(--yz-bg-surface)',
                      color:
                        settlePaymentMode === 'UPI'
                          ? 'var(--yz-primary, #832729)'
                          : 'var(--yz-text-secondary)',
                      fontWeight: settlePaymentMode === 'UPI' ? 600 : 400,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    <QrCode size={13} />
                    <span>UPI</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Cash Flow Details (Tendered & Change Calculation) */}
            {settlePaymentMode === 'CASH' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  padding: '6px 8px',
                  borderRadius: 'var(--yz-radius-sm)',
                  border: '1px solid var(--yz-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
                    Cash Received (Tendered)
                  </label>
                  <span style={{ fontSize: '9.5px', color: 'var(--yz-text-muted)' }}>Amount given by client</span>
                </div>
                <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    value={settleCashTendered}
                    onChange={(e) => setSettleCashTendered(e.target.value)}
                    className="yz-input tabular-nums"
                    placeholder={`₹${Number(settleAmount || 0).toLocaleString('en-IN')}`}
                    style={{ height: '26px', fontSize: '11.5px', fontWeight: 600, flex: 1 }}
                  />

                  {/* Presets */}
                  <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setSettleCashTendered(settleAmount)}
                      style={{
                        padding: '2px 5px',
                        fontSize: '9.5px',
                        fontWeight: 600,
                        borderRadius: '3px',
                        border: '1px solid var(--yz-primary)',
                        backgroundColor: 'var(--yz-primary-subtle)',
                        color: 'var(--yz-primary)',
                        cursor: 'pointer',
                        height: '24px',
                      }}
                    >
                      Exact
                    </button>
                    {[500, 1000, 2000, 5000]
                      .filter((val) => val >= Number(settleAmount || 0))
                      .slice(0, 3)
                      .map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setSettleCashTendered(String(preset))}
                          style={{
                            padding: '2px 5px',
                            fontSize: '9.5px',
                            borderRadius: '3px',
                            border: '1px solid var(--yz-border)',
                            backgroundColor: 'var(--yz-bg-surface)',
                            color: 'var(--yz-text-secondary)',
                            cursor: 'pointer',
                            height: '24px',
                          }}
                        >
                          ₹{preset.toLocaleString('en-IN')}
                        </button>
                      ))}
                  </div>
                </div>

                {/* Change calculation */}
                {(() => {
                  const targetNum = Number(settleAmount) || 0;
                  const tendered = settleCashTendered.trim() === '' ? targetNum : Number(settleCashTendered);
                  if (isNaN(tendered)) return null;
                  if (tendered >= targetNum) {
                    const change = tendered - targetNum;
                    return (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: 'var(--yz-alert-success-bg, #DCFCE7)',
                          border: '1px solid var(--yz-alert-success-border, #86EFAC)',
                          borderRadius: '4px',
                          padding: '3px 6px',
                          fontSize: '10.5px',
                          color: 'var(--yz-alert-success-text, #166534)',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>Change to Return:</span>
                        <strong style={{ fontSize: '11.5px', fontFamily: 'var(--yz-font-mono)' }}>
                          ₹{change.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    );
                  } else {
                    const short = targetNum - tendered;
                    return (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          backgroundColor: 'var(--yz-alert-danger-bg, #FEF2F2)',
                          border: '1px solid var(--yz-alert-danger-border, #FECACA)',
                          borderRadius: '4px',
                          padding: '3px 6px',
                          fontSize: '10px',
                          color: 'var(--yz-alert-danger-text, #991B1B)',
                        }}
                      >
                        <span>Remaining Shortfall:</span>
                        <strong style={{ fontFamily: 'var(--yz-font-mono)' }}>
                          -₹{short.toLocaleString('en-IN')}
                        </strong>
                      </div>
                    );
                  }
                })()}
              </div>
            )}

            {/* UPI Flow Details */}
            {settlePaymentMode === 'UPI' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '5px',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  padding: '6px 8px',
                  borderRadius: 'var(--yz-radius-sm)',
                  border: '1px solid var(--yz-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px' }}>
                  <span style={{ color: 'var(--yz-text-secondary)' }}>Merchant UPI ID:</span>
                  <strong style={{ fontFamily: 'var(--yz-font-mono)' }}>
                    {storePaymentSettings.upiId || 'yaazhi@oksbi'}
                  </strong>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10px',
                      fontWeight: 600,
                      color: 'var(--yz-text-secondary)',
                      marginBottom: '2px',
                    }}
                  >
                    UPI Reference / UTR Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI transaction ID..."
                    className="yz-input"
                    value={settleReference}
                    onChange={(e) => setSettleReference(e.target.value)}
                    style={{ height: '26px', fontSize: '10.5px' }}
                  />
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Void Order Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(orderToVoid)}
        onClose={() => !isVoiding && setOrderToVoid(null)}
        onConfirm={handleConfirmVoid}
        title="Void Sales Order"
        description={
          orderToVoid ? (
            <div>
              <p style={{ margin: 0, fontWeight: 500, color: 'var(--yz-text-primary)' }}>
                Are you sure you want to void <strong>{orderToVoid.orderNumber}</strong>?
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '11.5px', color: 'var(--yz-text-secondary)', lineHeight: 1.45 }}>
                This will void <strong>{orderToVoid.orderNumber}</strong> and preserve it in the order history.
                Any previously deducted stock will be reversed and returned to the showroom inventory ledger with an immutable audit record.
              </p>
            </div>
          ) : null
        }
        confirmLabel="Void Order"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={isVoiding}
      />
    </div>
  );
};
