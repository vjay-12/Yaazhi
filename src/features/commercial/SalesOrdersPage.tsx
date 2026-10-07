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

  const formatDisplayDate = (dateStr: string | Date | undefined): string => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return String(dateStr);
    }
  };

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
    let bg = '#F1F5F9';
    let color = '#475569';
    let border = '#CBD5E1';

    if (isVoided) {
      label = 'VOIDED';
      bg = '#F8FAFC';
      color = '#64748B';
      border = '#CBD5E1';
    } else if (isPaid) {
      label = 'PAID';
      bg = '#DCFCE7';
      color = '#166534';
      border = '#BBF7D0';
    }

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '20px',
          boxSizing: 'border-box',
          borderRadius: '3px',
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.3px',
          lineHeight: 1,
          backgroundColor: bg,
          color: color,
          border: `1px solid ${border}`,
          whiteSpace: 'nowrap',
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

    // Shared void icon button (exact same 22px x 22px footprint whether enabled or disabled)
    const renderVoidButton = () => {
      if (isVoided) {
        return (
          <button
            type="button"
            className="yz-btn yz-btn-ghost yz-btn-sm"
            disabled
            style={{
              width: '22px',
              height: '22px',
              padding: 0,
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
              width: '22px',
              height: '22px',
              padding: 0,
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
            width: '22px',
            height: '22px',
            padding: 0,
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

    // Primary action button (exact same 66px x 22px footprint across all states)
    const renderPrimaryButton = () => {
      if (isPaid || isVoided) {
        return (
          <button
            type="button"
            className="yz-btn yz-btn-secondary yz-btn-sm"
            style={{
              width: '66px',
              height: '22px',
              padding: '0 4px',
              fontSize: '10.5px',
              gap: '3px',
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
            width: '66px',
            height: '22px',
            padding: '0 4px',
            fontSize: '10.5px',
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
          gap: '4px',
          width: '92px',
          height: '22px',
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
          padding: '8px 10px',
          borderRadius: 'var(--yz-radius-sm)',
          border: '1px solid var(--yz-border)',
          gap: '10px',
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Search Box */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
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
              placeholder="Search SO #, client, or items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="yz-input"
              style={{ paddingLeft: '26px', height: '28px', fontSize: '11px', width: '100%' }}
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
                height: '28px',
                padding: '0 8px',
                fontSize: '11px',
                cursor: 'pointer',
                backgroundColor: 'var(--yz-bg-surface)',
                border: '1px solid var(--yz-border)',
                borderRadius: 'var(--yz-radius-sm)',
                color: 'var(--yz-text-primary)',
                minWidth: '110px',
                userSelect: 'none',
              }}
            >
              <span>
                <span style={{ color: 'var(--yz-text-muted)', marginRight: '4px' }}>Status:</span>
                <strong>{STATUS_FILTER_OPTIONS.find((s) => s.id === statusFilter)?.label || 'All'}</strong>
              </span>
              <ChevronDown
                size={12}
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
                  borderRadius: 'var(--yz-radius-sm)',
                  boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
                  zIndex: 50,
                  minWidth: '130px',
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
                        if (!isSelected) e.currentTarget.style.backgroundColor = '#F1F5F9';
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
        <table className="yz-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '130px', minWidth: '125px', paddingLeft: '12px' }}>ORDER NUMBER</th>
              <th style={{ width: '180px', minWidth: '150px' }}>CUSTOMER</th>
              <th style={{ width: '95px' }}>DATE</th>
              <th style={{ minWidth: '220px' }}>PRODUCTS</th>
              <th style={{ width: '120px', textAlign: 'right' }}>TOTAL AMOUNT</th>
              <th style={{ width: '85px', textAlign: 'center' }}>STATUS</th>
              <th style={{ width: '110px', textAlign: 'center', paddingRight: '12px' }}>ACTION</th>
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
                    style={{ cursor: 'pointer' }}
                    title="Click row to view sales order details"
                  >
                    <td
                      style={{
                        fontWeight: 600,
                        fontFamily: 'var(--yz-font-mono)',
                        paddingLeft: '12px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {o.orderNumber}
                    </td>

                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div
                        className="yz-cell-truncate"
                        style={{ maxWidth: '180px', fontWeight: 500 }}
                        title={o.customerName}
                      >
                        {o.customerName}
                      </div>
                    </td>

                    <td style={{ fontSize: '11px', color: 'var(--yz-text-muted)', whiteSpace: 'nowrap' }}>
                      {o.date}
                    </td>

                    {/* PRODUCTS: single-line, First Product +N, CSS ellipsis, full tooltip */}
                    <td style={{ minWidth: 0, overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          whiteSpace: 'nowrap',
                          verticalAlign: 'middle',
                        }}
                        title={fullProductsTooltip}
                      >
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: 500,
                            color: 'var(--yz-text-primary)',
                            display: 'inline-block',
                          }}
                        >
                          {firstProduct}
                        </span>
                        {extraCount > 0 && (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '0 4px',
                              height: '16px',
                              fontSize: '10px',
                              fontWeight: 600,
                              color: 'var(--yz-text-secondary, #475569)',
                              backgroundColor: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              borderRadius: '3px',
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
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
                      }}
                      className="tabular-nums"
                    >
                      ₹{o.totalAmount.toLocaleString('en-IN')}
                    </td>

                    <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                      {renderStatusBadge(o)}
                    </td>

                    <td style={{ textAlign: 'center', paddingRight: '12px', whiteSpace: 'nowrap' }}>
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

      {/* Informational Sales Order Detail Modal (NO ACTION BUTTONS IN FOOTER) */}
      {selectedOrder && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedOrder(null)}
          title={`Sales Order ${selectedOrder.orderNumber}`}
          subtitle={`Customer: ${selectedOrder.customerName} • Source: ${selectedOrder.location || 'Main Showroom Counter'}`}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Top Order Information (Billing Details & Shipping Details) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
                backgroundColor: 'var(--yz-bg-subtle)',
                padding: '10px 12px',
                borderRadius: 'var(--yz-radius-sm)',
                border: '1px solid var(--yz-border)',
                fontSize: '11.5px',
              }}
            >
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
                  Billing Details:
                </strong>
                <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                  {selectedOrder.customerName}
                </div>
                {selectedOrder.customerPhone && (
                  <div style={{ color: 'var(--yz-text-secondary)', fontSize: '11px', marginTop: '1px' }}>
                    Phone: {selectedOrder.customerPhone}
                  </div>
                )}
                <div style={{ color: 'var(--yz-text-muted)', fontSize: '11px', marginTop: '1px' }}>
                  {selectedOrder.customerAddress || 'Showroom In-Store Counter'}
                </div>
                <div style={{ color: 'var(--yz-text-muted)', fontSize: '10.5px', marginTop: '3px' }}>
                  Showroom: {selectedOrder.location || 'Main Showroom Counter'}
                </div>
              </div>

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
                  Shipping & Showroom Details:
                </strong>
                <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                  Warehouse: {selectedOrder.location}
                </div>
                <div style={{ color: 'var(--yz-text-secondary)', fontSize: '11px', marginTop: '1px' }}>
                  Order Date: {selectedOrder.date}
                </div>
                <div style={{ color: 'var(--yz-text-muted)', fontSize: '11px', marginTop: '1px' }}>
                  Reference SO: {selectedOrder.orderNumber}
                </div>
              </div>
            </div>

            {/* Itemized Garments Table */}
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--yz-text-secondary)',
                  marginBottom: '4px',
                }}
              >
                Products & Garments
              </div>
              <div className="yz-table-container">
                <table className="yz-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th style={{ width: '90px' }}>SKU</th>
                      <th style={{ width: '50px', textAlign: 'center' }}>Qty</th>
                      <th style={{ width: '90px', textAlign: 'right' }}>Price</th>
                      <th style={{ width: '90px', textAlign: 'right' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((it, idx) => (
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
                          ₹{it.unitPrice.toLocaleString('en-IN')}
                        </td>
                        <td
                          style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--yz-font-mono)' }}
                          className="tabular-nums"
                        >
                          ₹{(it.total || it.quantity * it.unitPrice).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary & Totals */}
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
                {selectedOrder.notes && (
                  <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', fontStyle: 'italic' }}>
                    Notes: {selectedOrder.notes}
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
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-text-secondary)' }}>
                  <span>Subtotal:</span>
                  <span style={{ fontFamily: 'var(--yz-font-mono)' }}>
                    ₹{(selectedOrder.subtotal || selectedOrder.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>
                {selectedOrder.discountTotal ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#166534' }}>
                    <span>Discount:</span>
                    <span style={{ fontFamily: 'var(--yz-font-mono)' }}>
                      - ₹{selectedOrder.discountTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : null}
                {selectedOrder.taxTotal ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-text-secondary)' }}>
                    <span>GST Tax:</span>
                    <span style={{ fontFamily: 'var(--yz-font-mono)' }}>
                      ₹{selectedOrder.taxTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                ) : null}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: 'var(--yz-text-primary)',
                    borderTop: '1px solid var(--yz-border)',
                    paddingTop: '4px',
                    marginTop: '2px',
                  }}
                >
                  <span>Grand Total:</span>
                  <span style={{ fontFamily: 'var(--yz-font-mono)' }}>
                    ₹{selectedOrder.totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Summary Box */}
            <div
              style={{
                backgroundColor: 'var(--yz-bg-surface)',
                border: '1px solid var(--yz-border)',
                borderRadius: 'var(--yz-radius-sm)',
                padding: '8px 12px',
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                textAlign: 'center',
                fontSize: '11px',
              }}
            >
              <div>
                <span style={{ color: 'var(--yz-text-muted)', display: 'block', fontSize: '10px' }}>
                  TOTAL AMOUNT
                </span>
                <strong style={{ fontSize: '13px', fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{selectedOrder.totalAmount.toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--yz-text-muted)', display: 'block', fontSize: '10px' }}>
                  PAID AMOUNT
                </span>
                <strong style={{ fontSize: '13px', color: '#166534', fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{selectedOrder.paidAmount.toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--yz-text-muted)', display: 'block', fontSize: '10px' }}>
                  PENDING DUE
                </span>
                <strong
                  style={{
                    fontSize: '13px',
                    color: selectedOrder.pendingAmount > 0 ? '#B45309' : 'var(--yz-text-secondary)',
                    fontFamily: 'var(--yz-font-mono)',
                  }}
                >
                  ₹{selectedOrder.pendingAmount.toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--yz-text-muted)', display: 'block', fontSize: '10px' }}>
                  PAYMENT STATUS
                </span>
                <div style={{ marginTop: '2px' }}>{renderStatusBadge(selectedOrder)}</div>
              </div>
            </div>

            {/* PENDING Order Status Differentiation: Clearly displays whether unpaid or partially paid */}
            {selectedOrder.status !== 'VOIDED' && selectedOrder.paymentStatus !== 'VOIDED' && (
              selectedOrder.pendingAmount > 0 || selectedOrder.paymentStatus === 'PENDING'
            ) && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px',
                  borderRadius: 'var(--yz-radius-sm)',
                  backgroundColor: selectedOrder.paidAmount > 0 ? '#FFFBEB' : '#F8FAFC',
                  border: `1px solid ${selectedOrder.paidAmount > 0 ? '#FDE68A' : '#E2E8F0'}`,
                  fontSize: '11px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      fontSize: '10px',
                      fontWeight: 600,
                      backgroundColor: selectedOrder.paidAmount > 0 ? '#FEF3C7' : '#E2E8F0',
                      color: selectedOrder.paidAmount > 0 ? '#92400E' : '#475569',
                    }}
                  >
                    {selectedOrder.paidAmount > 0 ? 'PARTIALLY PAID' : 'UNPAID'}
                  </span>
                  <span style={{ color: selectedOrder.paidAmount > 0 ? '#78350F' : 'var(--yz-text-secondary)' }}>
                    {selectedOrder.paidAmount > 0
                      ? `Paid: ₹${selectedOrder.paidAmount.toLocaleString('en-IN')} • Balance: ₹${selectedOrder.pendingAmount.toLocaleString('en-IN')}`
                      : `Unpaid: ₹0 paid • Balance: ₹${selectedOrder.pendingAmount.toLocaleString('en-IN')} pending`}
                  </span>
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontFamily: 'var(--yz-font-mono)',
                    color: selectedOrder.paidAmount > 0 ? '#92400E' : '#475569',
                  }}
                >
                  Balance: ₹{selectedOrder.pendingAmount.toLocaleString('en-IN')}
                </div>
              </div>
            )}

            {/* Dedicated PAYMENT HISTORY Section */}
            <div style={{ marginTop: '2px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '6px',
                }}
              >
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                  Payment History
                </div>
                {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                  <span style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', fontFamily: 'var(--yz-font-mono)' }}>
                    {selectedOrder.payments.length} {selectedOrder.payments.length === 1 ? 'payment recorded' : 'payments recorded'}
                  </span>
                )}
              </div>

              {selectedOrder.status === 'VOIDED' && (
                <div
                  style={{
                    backgroundColor: '#FEF2F2',
                    border: '1px solid #FECACA',
                    borderRadius: 'var(--yz-radius-sm)',
                    padding: '6px 10px',
                    fontSize: '11px',
                    color: '#991B1B',
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Ban size={12} />
                  <span>This order was voided. Historical payments are preserved in the audit log.</span>
                </div>
              )}

              {selectedOrder.payments && selectedOrder.payments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedOrder.payments.map((pay, idx) => (
                    <div
                      key={pay.id || idx}
                      style={{
                        backgroundColor: 'var(--yz-bg-surface)',
                        border: '1px solid var(--yz-border)',
                        borderRadius: 'var(--yz-radius-sm)',
                        padding: '8px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '11px',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            backgroundColor: '#DCFCE7',
                            color: '#166534',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          #{pay.index || idx + 1}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                              Payment #{pay.index || idx + 1}
                            </span>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '1px 6px',
                                borderRadius: 'var(--yz-radius-sm)',
                                fontSize: '9.5px',
                                fontWeight: 600,
                                backgroundColor: '#DCFCE7',
                                color: '#166534',
                              }}
                            >
                              {pay.status || 'Successful'}
                            </span>
                          </div>
                          <div style={{ fontSize: '10.5px', color: 'var(--yz-text-muted)', marginTop: '1px' }}>
                            <span>Date: {formatDisplayDate(pay.date || pay.paymentDate)}</span>
                            <span style={{ margin: '0 5px' }}>•</span>
                            <span>Method: {pay.paymentMode}</span>
                            {pay.referenceNumber && (
                              <>
                                <span style={{ margin: '0 5px' }}>•</span>
                                <span style={{ fontFamily: 'var(--yz-font-mono)' }}>Ref: {pay.referenceNumber}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontFamily: 'var(--yz-font-mono)',
                            color: '#166534',
                            fontSize: '12.5px',
                          }}
                        >
                          ₹{pay.amount.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Remaining Balance Summary */}
                  {selectedOrder.pendingAmount > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '6px 10px',
                        backgroundColor: '#FFFBEB',
                        border: '1px solid #FDE68A',
                        borderRadius: 'var(--yz-radius-sm)',
                        fontSize: '11px',
                        fontWeight: 600,
                        color: '#92400E',
                      }}
                    >
                      <span>Remaining Balance:</span>
                      <span style={{ fontFamily: 'var(--yz-font-mono)', fontSize: '12px' }}>
                        ₹{selectedOrder.pendingAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: '12px',
                    textAlign: 'center',
                    backgroundColor: 'var(--yz-bg-subtle)',
                    borderRadius: 'var(--yz-radius-sm)',
                    border: '1px dashed var(--yz-border)',
                    fontSize: '11px',
                    color: 'var(--yz-text-muted)',
                  }}
                >
                  No payments recorded • Full balance due: ₹{selectedOrder.totalAmount.toLocaleString('en-IN')}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Settle Balance Payment Modal */}
      {orderToSettle && (
        <Modal
          isOpen={true}
          onClose={() => !isSubmittingSettle && setOrderToSettle(null)}
          title={`Settle Balance — ${orderToSettle.orderNumber}`}
          subtitle={`Customer: ${orderToSettle.customerName} • Source: ${orderToSettle.location}`}
          maxWidth="460px"
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Overview Card */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                backgroundColor: 'var(--yz-bg-subtle)',
                border: '1px solid var(--yz-border)',
                borderRadius: 'var(--yz-radius-sm)',
                padding: '8px 10px',
                textAlign: 'center',
                fontSize: '11px',
              }}
            >
              <div>
                <span style={{ color: 'var(--yz-text-muted)', fontSize: '10px', display: 'block' }}>
                  TOTAL AMOUNT
                </span>
                <strong style={{ fontSize: '13px', fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{orderToSettle.totalAmount.toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--yz-text-muted)', fontSize: '10px', display: 'block' }}>
                  ALREADY PAID
                </span>
                <strong style={{ fontSize: '13px', color: '#166534', fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{orderToSettle.paidAmount.toLocaleString('en-IN')}
                </strong>
              </div>
              <div>
                <span style={{ color: 'var(--yz-text-muted)', fontSize: '10px', display: 'block' }}>
                  PENDING DUE
                </span>
                <strong style={{ fontSize: '13px', color: '#B45309', fontFamily: 'var(--yz-font-mono)' }}>
                  ₹{orderToSettle.pendingAmount.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>

            {/* Settlement Input */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '4px',
                }}
              >
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                  Amount to Settle (₹)
                </label>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    type="button"
                    className="yz-btn yz-btn-ghost yz-btn-sm"
                    style={{ height: '20px', padding: '0 5px', fontSize: '10px' }}
                    onClick={() => setSettleAmount(orderToSettle.pendingAmount.toString())}
                  >
                    Full (₹{orderToSettle.pendingAmount.toLocaleString('en-IN')})
                  </button>
                  {orderToSettle.pendingAmount > 1000 && (
                    <button
                      type="button"
                      className="yz-btn yz-btn-ghost yz-btn-sm"
                      style={{ height: '20px', padding: '0 5px', fontSize: '10px' }}
                      onClick={() =>
                        setSettleAmount((Math.round(orderToSettle.pendingAmount / 2)).toString())
                      }
                    >
                      50% (₹{Math.round(orderToSettle.pendingAmount / 2).toLocaleString('en-IN')})
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
                  height: '30px',
                  fontSize: '13px',
                  fontFamily: 'var(--yz-font-mono)',
                  fontWeight: 600,
                }}
                autoFocus
              />
              <div style={{ marginTop: '4px', fontSize: '10.5px' }}>
                {Number(settleAmount) >= orderToSettle.pendingAmount ? (
                  <span style={{ color: '#166534', fontWeight: 600 }}>
                    ✓ Order will be fully PAID with ₹0 remaining due.
                  </span>
                ) : Number(settleAmount) > 0 && Number(settleAmount) < orderToSettle.pendingAmount ? (
                  <span style={{ color: '#92400E' }}>
                    Remaining due: ₹{(orderToSettle.pendingAmount - Number(settleAmount)).toLocaleString('en-IN')} (will remain PENDING).
                  </span>
                ) : Number(settleAmount) > orderToSettle.pendingAmount ? (
                  <span style={{ color: '#DC2626', fontWeight: 600 }}>
                    Amount exceeds pending due of ₹{orderToSettle.pendingAmount.toLocaleString('en-IN')}.
                  </span>
                ) : null}
              </div>
            </div>

            {/* Payment Mode (Cash and UPI only, Card removed) */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--yz-text-primary)',
                  marginBottom: '4px',
                }}
              >
                Payment Mode
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
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
                        ? 'var(--yz-primary-50, #FDF2F2)'
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
                  }}
                >
                  <Banknote size={14} />
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
                        ? 'var(--yz-primary-50, #FDF2F2)'
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
                  }}
                >
                  <QrCode size={14} />
                  <span>UPI</span>
                </button>
              </div>
            </div>

            {/* Cash Flow Details (Tendered & Change Calculation) */}
            {settlePaymentMode === 'CASH' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  padding: '8px 10px',
                  borderRadius: 'var(--yz-radius-sm)',
                  border: '1px solid var(--yz-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
                    Cash Received (Tendered)
                  </label>
                  <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>Amount given by client</span>
                </div>
                <input
                  type="number"
                  min="0"
                  value={settleCashTendered}
                  onChange={(e) => setSettleCashTendered(e.target.value)}
                  className="yz-input tabular-nums"
                  placeholder={`₹${Number(settleAmount || 0).toLocaleString('en-IN')}`}
                  style={{ height: '28px', fontSize: '12px', fontWeight: 600 }}
                />

                {/* Presets */}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => setSettleCashTendered(settleAmount)}
                    style={{
                      padding: '2px 6px',
                      fontSize: '10px',
                      fontWeight: 600,
                      borderRadius: '3px',
                      border: '1px solid var(--yz-primary)',
                      backgroundColor: 'var(--yz-primary-subtle)',
                      color: 'var(--yz-primary)',
                      cursor: 'pointer',
                    }}
                  >
                    Exact (₹{Number(settleAmount || 0).toLocaleString('en-IN')})
                  </button>
                  {[500, 1000, 2000, 5000]
                    .filter((val) => val >= Number(settleAmount || 0))
                    .map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setSettleCashTendered(String(preset))}
                        style={{
                          padding: '2px 6px',
                          fontSize: '10px',
                          borderRadius: '3px',
                          border: '1px solid var(--yz-border)',
                          backgroundColor: 'var(--yz-bg-surface)',
                          color: 'var(--yz-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        ₹{preset.toLocaleString('en-IN')}
                      </button>
                    ))}
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
                          backgroundColor: '#DCFCE7',
                          border: '1px solid #86EFAC',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          color: '#166534',
                        }}
                      >
                        <span style={{ fontWeight: 600 }}>Change to Return:</span>
                        <strong style={{ fontSize: '12px', fontFamily: 'var(--yz-font-mono)' }}>
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
                          backgroundColor: '#FEF2F2',
                          border: '1px solid #FECACA',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '10.5px',
                          color: '#991B1B',
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
                  gap: '6px',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  padding: '8px 10px',
                  borderRadius: 'var(--yz-radius-sm)',
                  border: '1px solid var(--yz-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                  <span style={{ color: 'var(--yz-text-secondary)' }}>Merchant UPI ID:</span>
                  <strong style={{ fontFamily: 'var(--yz-font-mono)' }}>
                    {storePaymentSettings.upiId || 'yaazhi@oksbi'}
                  </strong>
                </div>
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: 'var(--yz-text-secondary)',
                      marginBottom: '2px',
                    }}
                  >
                    UPI Reference / UTR Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. UPI UTR number / transaction ID..."
                    className="yz-input"
                    value={settleReference}
                    onChange={(e) => setSettleReference(e.target.value)}
                    style={{ height: '28px', fontSize: '11px' }}
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
