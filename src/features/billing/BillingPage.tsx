import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  QrCode,
  Banknote,
  CheckCircle2,
  Printer,
  ShoppingBag,
  ChevronDown,
} from 'lucide-react';
import type { YaazhiProduct } from '../../types/product';
import { productService } from '../../services/productService';
import { billingService } from '../../services/billingService';
import { customerService } from '../../services/customerService';
import { settingsService } from '../../services/settingsService';
import { StockBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';
import { ProductImage } from '../../components/common/ProductImage';
import { AddCustomerModal } from '../commercial/AddCustomerModal';
import { CustomDropdown } from '../../components/common/CustomDropdown';

interface CartLine {
  product: YaazhiProduct;
  quantity: number;
  unitPrice: number;
  gstRate: number;
}

export const BillingPage: React.FC = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<YaazhiProduct[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isAddCustomerModalOpen, setIsAddCustomerModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dynamically derive unique categories from real product data
  const availableCategories = React.useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && typeof p.category === 'string' && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return ['ALL', ...Array.from(set).sort()];
  }, [products]);

  // Reset selected category if it no longer exists
  useEffect(() => {
    if (selectedCategory !== 'ALL' && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory('ALL');
    }
  }, [availableCategories, selectedCategory]);

  // Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [billPaymentStatus, setBillPaymentStatus] = useState<'PAID' | 'PARTIAL' | 'PENDING'>('PAID');
  const [receivedAmountInput, setReceivedAmountInput] = useState<string>('');
  const [cashTenderedInput, setCashTenderedInput] = useState<string>('');
  const [upiReference, setUpiReference] = useState<string>('');
  const [lastChangeReturned, setLastChangeReturned] = useState<number>(0);
  const [paymentSettings, setPaymentSettings] = useState<{ upiId: string; upiQrUrl: string }>({
    upiId: 'yaazhi@oksbi',
    upiQrUrl: '/images/payment/yaazhi-upi-qr.png',
  });
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedBillNo, setCompletedBillNo] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [recentCustomers, setRecentCustomers] = useState<any[]>([]);

  useEffect(() => {
    productService.list().then(setProducts);
    customerService.list().then(setRecentCustomers).catch(() => {});
    settingsService
      .getSettings()
      .then((s) => {
        if (s) {
          setPaymentSettings({
            upiId: s.upi_id || 'yaazhi@oksbi',
            upiQrUrl: s.upi_qr_url || '/images/payment/yaazhi-upi-qr.png',
          });
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCustomerCreated = (newCust: any) => {
    setRecentCustomers((prev) => [newCust, ...prev.filter((c) => c.id !== newCust.id)]);
    setSelectedCustomerId(newCust.id);
    setCustomerName(newCust.name);
    setCustomerPhone(newCust.phone || '');
    setIsCustomerDropdownOpen(false);
    showToast({
      type: 'success',
      title: 'Customer Selected',
      message: `${newCust.name} selected for current bill`,
    });
  };

  const filteredCustomers = recentCustomers.filter((c) => {
    if (!customerSearch.trim()) return true;
    const q = customerSearch.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.phone && c.phone.includes(q)) ||
      (c.city && c.city.toLowerCase().includes(q))
    );
  });

  const addToCart = (product: YaazhiProduct) => {
    if (product.currentStock <= 0) {
      showToast({
        type: 'warning',
        title: 'Depleted Stock',
        message: `${product.name} is currently out of stock.`,
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          showToast({
            type: 'warning',
            title: 'Stock Limit Reached',
            message: `Only ${product.currentStock} units available in showroom.`,
          });
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          unitPrice: product.sellPrice,
          gstRate: product.gstRate,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            if (newQty > item.product.currentStock) {
              showToast({
                type: 'warning',
                title: 'Insufficient Stock',
                message: `Maximum available showroom stock is ${item.product.currentStock}`,
              });
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
  };

  // Billing Calculations
  const grossSubtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const discountAmount = Math.round((grossSubtotal * discountPercent) / 100);
  const netTaxable = grossSubtotal - discountAmount;

  // Calculate weighted GST
  const totalTax = cart.reduce((sum, item) => {
    const itemSubtotal = item.unitPrice * item.quantity;
    const itemShare = grossSubtotal > 0 ? itemSubtotal / grossSubtotal : 0;
    const itemTaxable = netTaxable * itemShare;
    return sum + (itemTaxable * item.gstRate) / 100;
  }, 0);

  const grandTotal = Math.round(netTaxable + totalTax);

  const computedReceivedAmount =
    billPaymentStatus === 'PAID'
      ? grandTotal
      : billPaymentStatus === 'PENDING'
      ? 0
      : Number(receivedAmountInput) || 0;

  const computedPendingAmount = Math.max(0, grandTotal - computedReceivedAmount);

  const handleCompletePayment = async () => {
    if (cart.length === 0 || isSubmittingPayment) return;

    if (!selectedCustomerId || !customerName.trim()) {
      showToast({
        type: 'warning',
        title: 'Customer Required',
        message: 'Please select an existing customer or create a new customer before completing checkout.',
      });
      setIsCustomerDropdownOpen(true);
      return;
    }

    if (billPaymentStatus === 'PARTIAL') {
      if (computedReceivedAmount <= 0) {
        showToast({
          type: 'warning',
          title: 'Invalid Payment Amount',
          message: 'Received amount must be greater than ₹0 for partial payment.',
        });
        return;
      }
      if (computedReceivedAmount >= grandTotal) {
        showToast({
          type: 'warning',
          title: 'Invalid Payment Amount',
          message: 'Received amount cannot equal or exceed total bill. Select "Paid" for full settlement.',
        });
        return;
      }
    }

    let calculatedChange = 0;
    if (computedReceivedAmount > 0 && paymentMode === 'CASH') {
      const tenderedStr = cashTenderedInput.trim();
      const tendered = tenderedStr === '' ? computedReceivedAmount : Number(tenderedStr);
      if (isNaN(tendered) || tendered < 0) {
        showToast({
          type: 'warning',
          title: 'Invalid Cash Received',
          message: 'Cash received amount cannot be negative or invalid.',
        });
        return;
      }
      if (tendered < computedReceivedAmount) {
        showToast({
          type: 'warning',
          title: 'Insufficient Cash',
          message: `Cash received (₹${tendered.toLocaleString('en-IN')}) is less than required amount (₹${computedReceivedAmount.toLocaleString('en-IN')}).`,
        });
        return;
      }
      calculatedChange = Math.max(0, tendered - computedReceivedAmount);
      setLastChangeReturned(calculatedChange);
    }

    try {
      setIsSubmittingPayment(true);
      const matched = recentCustomers.find(
        (c) =>
          c.name.toLowerCase() === customerName.toLowerCase() ||
          (customerPhone && c.phone === customerPhone)
      );

      const res = await billingService.checkout({
        customer_id: selectedCustomerId || matched?.id,
        customer_name: customerName,
        customer_phone: customerPhone || undefined,
        payment_mode: paymentMode,
        payment_reference: paymentMode === 'UPI' ? (upiReference.trim() || undefined) : undefined,
        payment_status: billPaymentStatus,
        paid_amount: computedReceivedAmount,
        pending_amount: computedPendingAmount,
        discount_total: discountAmount,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          tax_rate: item.gstRate,
        })),
      });

      setCompletedBillNo(res.billNo);
      setIsCompleted(true);
      showToast({
        type: 'success',
        title: 'Invoice Issued',
        message: `Bill ${res.billNo} registered (${billPaymentStatus}). Total: ₹${res.totalAmount.toLocaleString('en-IN')}`,
      });

      // Refresh product stock
      productService.list().then(setProducts);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Checkout Failed',
        message: err.message || 'Could not complete bill transaction',
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleStartNewBill = () => {
    clearCart();
    setIsCompleted(false);
    setIsPaymentOpen(false);
    setSelectedCustomerId(null);
    setCustomerName('');
    setCustomerPhone('');
    setBillPaymentStatus('PAID');
    setReceivedAmountInput('');
    setCashTenderedInput('');
    setUpiReference('');
    setLastChangeReturned(0);
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category?.trim().toLowerCase() !== selectedCategory.toLowerCase()) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        p.name?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(320px, 1fr)',
        gap: '10px',
        alignItems: 'start',
      }}
    >
      {/* Left Column: Product Selection Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Search & Category Pills */}
        <div className="yz-card" style={{ padding: '8px 10px' }}>
          <div style={{ position: 'relative', marginBottom: '6px' }}>
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
              placeholder="Search weave name, SKU, or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="yz-input"
              style={{ paddingLeft: '26px' }}
              autoFocus
            />
          </div>

          {/* Dynamic Category Quick Pills */}
          <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
            {availableCategories.map((c) => {
              const isSelected = selectedCategory === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setSelectedCategory(c)}
                  style={{
                    padding: '2px 9px',
                    borderRadius: 'var(--yz-radius-full)',
                    border: '1px solid',
                    borderColor: isSelected ? 'var(--yz-primary, #832729)' : 'var(--yz-border)',
                    backgroundColor: isSelected ? 'var(--yz-primary-subtle, #FDF2F2)' : 'var(--yz-bg-surface)',
                    color: isSelected ? 'var(--yz-primary, #832729)' : 'var(--yz-text-secondary)',
                    fontSize: '11px',
                    fontWeight: isSelected ? 600 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.1s ease',
                    height: '24px',
                  }}
                >
                  {c === 'ALL' ? 'All' : c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '8px',
            maxHeight: 'calc(100vh - 200px)',
            overflowY: 'auto',
            paddingRight: '2px',
          }}
        >
          {filteredProducts.map((p) => {
            const inStock = p.currentStock > 0;
            const cartItem = cart.find((i) => i.product.id === p.id);
            return (
              <div
                key={p.id}
                onClick={() => inStock && addToCart(p)}
                style={{
                  backgroundColor: 'var(--yz-bg-surface)',
                  border: '1px solid',
                  borderColor: cartItem ? 'var(--yz-primary, #832729)' : 'var(--yz-border)',
                  borderRadius: 'var(--yz-radius-sm)',
                  padding: '6px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '4px',
                  cursor: inStock ? 'pointer' : 'not-allowed',
                  opacity: inStock ? 1 : 0.55,
                  transition: 'all 0.12s ease',
                  boxShadow: cartItem ? '0 0 0 1px var(--yz-primary, #832729)' : 'none',
                  position: 'relative',
                  userSelect: 'none',
                }}
                onMouseEnter={(e) => {
                  if (inStock && !cartItem) {
                    e.currentTarget.style.borderColor = 'var(--yz-border-strong)';
                    e.currentTarget.style.backgroundColor = 'var(--yz-bg-surface-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (inStock && !cartItem) {
                    e.currentTarget.style.borderColor = 'var(--yz-border)';
                    e.currentTarget.style.backgroundColor = 'var(--yz-bg-surface)';
                  }
                }}
              >
                <div>
                  <ProductImage
                    src={p.imageUrl}
                    alt={p.name}
                    productName={p.name}
                    category={p.category}
                    height={80}
                    width="100%"
                    rounded="sm"
                    iconSize={18}
                    style={{ marginBottom: '5px' }}
                  />

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '3px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontFamily: 'var(--yz-font-mono)',
                        color: 'var(--yz-text-muted)',
                        letterSpacing: '0.2px',
                      }}
                    >
                      {p.sku}
                    </span>
                    <StockBadge
                      status={productService.getStockStatus(p)}
                      stockCount={p.currentStock}
                    />
                  </div>

                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: '11.5px',
                      lineHeight: 1.3,
                      color: 'var(--yz-text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: '4px',
                    }}
                    title={p.name}
                  >
                    {p.name}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTop: '1px solid var(--yz-border-subtle)',
                    paddingTop: '4px',
                    marginTop: 'auto',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      fontFamily: 'var(--yz-font-mono)',
                      color: 'var(--yz-text-primary)',
                    }}
                    className="tabular-nums"
                  >
                    ₹{p.sellPrice.toLocaleString('en-IN')}
                  </div>

                  {cartItem ? (
                    <span
                      style={{
                        backgroundColor: 'var(--yz-primary, #832729)',
                        color: '#FFFFFF',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: 'var(--yz-radius-full)',
                      }}
                    >
                      {cartItem.quantity} in bill
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '10.5px',
                        color: inStock ? 'var(--yz-primary, #832729)' : 'var(--yz-text-muted)',
                        fontWeight: 600,
                      }}
                    >
                      + Add
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Active Cart / Bill Summary */}
      <div
        className="yz-card"
        style={{
          padding: '10px',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 120px)',
          position: 'sticky',
          top: '56px',
        }}
      >
        {/* Cart Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--yz-border)', paddingBottom: '6px', marginBottom: '6px' }}>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600 }}>Counter Bill</h3>
            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items selected
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="yz-btn yz-btn-ghost yz-btn-sm"
              style={{ color: 'var(--yz-status-out-stock)', fontSize: '11px', padding: '0 4px', height: '20px' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Customer Section */}
        <div ref={dropdownRef} style={{ position: 'relative', marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
              Customer
            </span>
            {selectedCustomerId && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomerId(null);
                  setCustomerName('');
                  setCustomerPhone('');
                }}
                className="yz-btn yz-btn-ghost yz-btn-sm"
                style={{ fontSize: '10px', height: '16px', padding: '0 2px', color: 'var(--yz-text-muted)' }}
                title="Clear selected customer"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsCustomerDropdownOpen((prev) => !prev)}
            className="yz-input"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
              height: '28px',
              padding: '0 8px',
              fontSize: '11px',
              backgroundColor: 'var(--yz-bg-surface)',
              width: '100%',
              textAlign: 'left',
              border: '1px solid var(--yz-border)',
              borderRadius: 'var(--yz-radius-sm)',
            }}
          >
            <span
              style={{
                fontWeight: selectedCustomerId ? 600 : 400,
                color: selectedCustomerId ? 'var(--yz-text-primary)' : 'var(--yz-text-muted)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedCustomerId ? (
                `${customerName}${customerPhone ? ` (${customerPhone})` : ''}`
              ) : (
                'Select customer'
              )}
            </span>
            <ChevronDown
              size={13}
              style={{
                flexShrink: 0,
                color: 'var(--yz-text-muted)',
                transform: isCustomerDropdownOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.15s ease',
              }}
            />
          </button>

          {/* Customer Dropdown Menu */}
          {isCustomerDropdownOpen && (
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
              {/* Search customers... */}
              <div style={{ position: 'relative' }}>
                <Search
                  size={12}
                  style={{
                    position: 'absolute',
                    left: '7px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--yz-text-muted)',
                  }}
                />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search customers..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="yz-input"
                  style={{ height: '26px', fontSize: '11px', paddingLeft: '24px' }}
                />
              </div>

              {/* Customer List */}
              <div
                style={{
                  overflowY: 'auto',
                  maxHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1px',
                }}
              >
                {filteredCustomers.length === 0 ? (
                  <div style={{ padding: '8px', fontSize: '11px', color: 'var(--yz-text-muted)', textAlign: 'center' }}>
                    No matching customer found
                  </div>
                ) : (
                  filteredCustomers.map((c) => {
                    const isSelected = selectedCustomerId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedCustomerId(c.id);
                          setCustomerName(c.name);
                          setCustomerPhone(c.phone || '');
                          setIsCustomerDropdownOpen(false);
                          setCustomerSearch('');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '5px 8px',
                          borderRadius: 'var(--yz-radius-sm)',
                          border: 'none',
                          backgroundColor: isSelected ? 'var(--yz-primary-subtle, #FDF2F2)' : 'transparent',
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
                          <div style={{ fontWeight: isSelected ? 600 : 500 }}>{c.name}</div>
                          {c.phone && (
                            <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)', fontFamily: 'var(--yz-font-mono)' }}>{c.phone}</div>
                          )}
                        </div>
                        {isSelected && <span style={{ fontSize: '10px', color: 'var(--yz-primary, #832729)' }}>✓</span>}
                      </button>
                    );
                  })
                )}
              </div>

              {/* + Create New Customer */}
              <div style={{ borderTop: '1px solid var(--yz-border)', paddingTop: '4px', marginTop: '2px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsCustomerDropdownOpen(false);
                    setIsAddCustomerModalOpen(true);
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
                  <span>Create New Customer</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Cart Item Rows */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', paddingRight: '2px' }}>
          {cart.length === 0 ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                color: 'var(--yz-text-muted)',
                padding: '1.5rem 1rem',
              }}
            >
              <ShoppingBag size={24} style={{ marginBottom: '4px', opacity: 0.5 }} />
              <div style={{ fontWeight: 600, fontSize: '12px' }}>Bill is currently empty</div>
              <p style={{ fontSize: '11px', marginTop: '2px' }}>
                Select items from catalog to add to bill.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.product.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 6px',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  borderRadius: 'var(--yz-radius-sm)',
                  gap: '6px',
                }}
              >
                <ProductImage
                  src={item.product.imageUrl}
                  alt={item.product.name}
                  productName={item.product.name}
                  category={item.product.category}
                  width={30}
                  height={30}
                  rounded="sm"
                  iconSize={13}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>
                    ₹{item.unitPrice.toLocaleString('en-IN')} × {item.quantity} (GST {item.gstRate}%)
                  </div>
                </div>

                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '3px',
                      border: '1px solid var(--yz-border)',
                      backgroundColor: 'var(--yz-bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Minus size={10} />
                  </button>

                  <span style={{ fontSize: '11px', fontWeight: 700, width: '18px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '3px',
                      border: '1px solid var(--yz-border)',
                      backgroundColor: 'var(--yz-bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Plus size={10} />
                  </button>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--yz-text-muted)',
                      cursor: 'pointer',
                      marginLeft: '2px',
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div style={{ fontWeight: 700, fontSize: '11px', minWidth: '55px', textAlign: 'right', fontFamily: 'var(--yz-font-mono)' }} className="tabular-nums">
                  ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Financial Breakdown */}
        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid var(--yz-border)', paddingTop: '6px', marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-text-secondary)' }}>
              <span>Items Subtotal</span>
              <span className="tabular-nums">₹{grossSubtotal.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--yz-text-secondary)' }}>Courtesy Discount</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CustomDropdown
                  value={discountPercent}
                  onChange={(val) => setDiscountPercent(Number(val))}
                  options={[
                    { value: 0, label: '0%' },
                    { value: 5, label: '5% Courtesy' },
                    { value: 10, label: '10% Festive' },
                    { value: 15, label: '15% VIP' },
                  ]}
                  minWidth="105px"
                  style={{ height: '24px' }}
                />
                <span className="tabular-nums" style={{ color: 'var(--yz-primary)' }}>
                  -₹{discountAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-text-secondary)' }}>
              <span>GST (CGST + SGST)</span>
              <span className="tabular-nums">₹{Math.round(totalTax).toLocaleString('en-IN')}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                borderTop: '1px dashed var(--yz-border)',
                paddingTop: '4px',
                marginTop: '2px',
                fontSize: '14px',
                fontWeight: 700,
                color: 'var(--yz-text-primary)',
              }}
            >
              <span>Grand Total</span>
              <span className="tabular-nums" style={{ color: 'var(--yz-primary)' }}>
                ₹{grandTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (!selectedCustomerId || !customerName.trim()) {
                  showToast({
                    type: 'warning',
                    title: 'Customer Required',
                    message: 'Please select an existing customer or create a new customer before collecting payment.',
                  });
                  setIsCustomerDropdownOpen(true);
                  return;
                }
                setCashTenderedInput(String(grandTotal));
                setIsPaymentOpen(true);
              }}
              style={{ width: '100%', marginTop: '4px', height: '32px' }}
            >
              Collect ₹{grandTotal.toLocaleString('en-IN')}
            </Button>
          </div>
        )}
      </div>

      {/* Payment & Invoice Modal */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title={isCompleted ? 'Invoice Issued Successfully' : 'Payment & Checkout'}
        subtitle={
          isCompleted
            ? `Invoice #${completedBillNo} generated for ${customerName}`
            : `Total Payable: ₹${grandTotal.toLocaleString('en-IN')}`
        }
        maxWidth="440px"
        footer={
          isCompleted ? (
            <div style={{ display: 'flex', gap: '6px', width: '100%', justifyContent: 'space-between' }}>
              <Button variant="secondary" size="sm" icon={<Printer size={13} />} onClick={() => window.print()}>
                Print Bill
              </Button>
              <Button variant="primary" size="sm" onClick={handleStartNewBill}>
                Start New Bill
              </Button>
            </div>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsPaymentOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                onClick={handleCompletePayment}
                disabled={isSubmittingPayment}
              >
                {isSubmittingPayment ? 'Processing...' : 'Confirm & Print Bill'}
              </Button>
            </>
          )
        }
      >
        {isCompleted ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '8px', padding: '6px 0' }}>
            <CheckCircle2 size={36} color="var(--yz-status-in-stock)" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700 }}>
                {billPaymentStatus === 'PAID'
                  ? 'Payment Settled'
                  : billPaymentStatus === 'PARTIAL'
                  ? 'Partial Payment Recorded'
                  : 'Order Recorded (Pending Payment)'}
              </div>
              <p style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
                {billPaymentStatus === 'PAID'
                  ? paymentMode === 'CASH' && lastChangeReturned > 0
                    ? `₹${grandTotal.toLocaleString('en-IN')} received via Cash • ₹${lastChangeReturned.toLocaleString('en-IN')} change returned`
                    : `₹${grandTotal.toLocaleString('en-IN')} received via ${paymentMode}`
                  : billPaymentStatus === 'PARTIAL'
                  ? `₹${computedReceivedAmount.toLocaleString('en-IN')} received via ${paymentMode} • ₹${computedPendingAmount.toLocaleString('en-IN')} pending balance`
                  : `₹${grandTotal.toLocaleString('en-IN')} outstanding balance`}
              </p>
            </div>

            <div
              style={{
                width: '100%',
                backgroundColor: 'var(--yz-bg-subtle)',
                borderRadius: 'var(--yz-radius-sm)',
                padding: '8px 10px',
                fontSize: '11px',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Boutique:</span>
                <strong>Yaazhi Boutique & Weaves</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Bill / SO Number:</span>
                <strong style={{ fontFamily: 'var(--yz-font-mono)' }}>{completedBillNo}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Client:</span>
                <span>{customerName} {customerPhone ? `(${customerPhone})` : ''}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Payment Status:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: billPaymentStatus === 'PAID' ? '#166534' : '#B45309',
                  }}
                >
                  {billPaymentStatus === 'PAID' ? 'PAID' : billPaymentStatus === 'PARTIAL' ? `PARTIAL · ₹${computedPendingAmount.toLocaleString('en-IN')} DUE` : `PENDING · ₹${grandTotal.toLocaleString('en-IN')} DUE`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Items Count:</span>
                <span>{cart.reduce((s, i) => s + i.quantity, 0)} pieces</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Payment Summary & Status */}
            <div
              style={{
                backgroundColor: 'var(--yz-bg-subtle)',
                border: '1px solid var(--yz-border)',
                borderRadius: 'var(--yz-radius-sm)',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--yz-text-secondary)', fontWeight: 500 }}>
                  Total Bill Amount
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-text-primary)' }}>
                  ₹{grandTotal.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Payment Status Dropdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
                  Payment Status
                </label>
                <CustomDropdown
                  value={billPaymentStatus}
                  onChange={(val) => {
                    const next = val as 'PAID' | 'PARTIAL' | 'PENDING';
                    setBillPaymentStatus(next);
                    if (next === 'PAID') {
                      setReceivedAmountInput(String(grandTotal));
                      setCashTenderedInput(String(grandTotal));
                    } else if (next === 'PENDING') {
                      setReceivedAmountInput('0');
                      setCashTenderedInput('0');
                    } else {
                      const half = Math.round(grandTotal / 2);
                      setReceivedAmountInput(String(half));
                      setCashTenderedInput(String(half));
                    }
                  }}
                  options={[
                    { value: 'PAID', label: 'Paid (Full Amount Received)' },
                    { value: 'PARTIAL', label: 'Partial (Advance Received / Balance Due)' },
                    { value: 'PENDING', label: 'Pending (No Payment Received / Full Due)' },
                  ]}
                  minWidth="100%"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Dynamic Amount Inputs */}
              {billPaymentStatus === 'PARTIAL' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '2px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
                      Amount Received Now (₹) *
                    </label>
                    <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>
                      Max ₹{(grandTotal - 1).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    max={grandTotal - 1}
                    value={receivedAmountInput}
                    onChange={(e) => {
                      setReceivedAmountInput(e.target.value);
                      setCashTenderedInput(e.target.value);
                    }}
                    className="yz-input tabular-nums"
                    placeholder="Enter received advance amount"
                    style={{ height: '28px', fontSize: '12px', fontWeight: 600 }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '11px',
                      backgroundColor: 'var(--yz-bg-surface)',
                      padding: '5px 8px',
                      borderRadius: 'var(--yz-radius-sm)',
                      border: '1px solid var(--yz-border-subtle)',
                      marginTop: '2px',
                    }}
                  >
                    <span>Pending Amount Due:</span>
                    <strong style={{ color: '#B45309', fontFamily: 'var(--yz-font-mono)' }}>
                      ₹{computedPendingAmount.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              ) : billPaymentStatus === 'PAID' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--yz-text-secondary)' }}>
                  <span>Amount Received:</span>
                  <strong style={{ color: '#166534', fontFamily: 'var(--yz-font-mono)' }}>
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </strong>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--yz-text-secondary)' }}>
                    <span>Amount Received:</span>
                    <strong style={{ fontFamily: 'var(--yz-font-mono)' }}>₹0</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--yz-text-secondary)' }}>
                    <span>Pending Amount:</span>
                    <strong style={{ color: '#B45309', fontFamily: 'var(--yz-font-mono)' }}>
                      ₹{grandTotal.toLocaleString('en-IN')}
                    </strong>
                  </div>
                </div>
              )}
            </div>

            {/* Received Payment Mode (only needed if received amount > 0) */}
            {computedReceivedAmount > 0 && (
              <>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
                  Payment Method:
                </div>
                {/* 2 Payment Methods: Cash and UPI (Card removed) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('CASH')}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 'var(--yz-radius-sm)',
                      border: '1px solid',
                      borderColor: paymentMode === 'CASH' ? 'var(--yz-primary)' : 'var(--yz-border)',
                      backgroundColor: paymentMode === 'CASH' ? 'var(--yz-primary-subtle)' : 'var(--yz-bg-surface)',
                      color: paymentMode === 'CASH' ? 'var(--yz-primary)' : 'var(--yz-text-primary)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '3px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '11px',
                    }}
                  >
                    <Banknote size={18} color={paymentMode === 'CASH' ? 'var(--yz-primary)' : 'inherit'} />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('UPI')}
                    style={{
                      padding: '8px 4px',
                      borderRadius: 'var(--yz-radius-sm)',
                      border: '1px solid',
                      borderColor: paymentMode === 'UPI' ? 'var(--yz-primary)' : 'var(--yz-border)',
                      backgroundColor: paymentMode === 'UPI' ? 'var(--yz-primary-subtle)' : 'var(--yz-bg-surface)',
                      color: paymentMode === 'UPI' ? 'var(--yz-primary)' : 'var(--yz-text-primary)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '3px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '11px',
                    }}
                  >
                    <QrCode size={18} color={paymentMode === 'UPI' ? 'var(--yz-primary)' : 'inherit'} />
                    <span>UPI / QR</span>
                  </button>
                </div>

                {/* Cash Flow Panel (BillFlow inspired) */}
                {paymentMode === 'CASH' && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      backgroundColor: 'var(--yz-bg-subtle)',
                      padding: '10px 12px',
                      borderRadius: 'var(--yz-radius-sm)',
                      border: '1px solid var(--yz-border)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
                        Amount Due
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-text-primary)' }}>
                        ₹{computedReceivedAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-secondary)' }}>
                          Cash Received (Tendered)
                        </label>
                        <span style={{ fontSize: '10px', color: 'var(--yz-text-muted)' }}>Physical cash received</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={cashTenderedInput}
                        onChange={(e) => setCashTenderedInput(e.target.value)}
                        className="yz-input tabular-nums"
                        placeholder={`₹${computedReceivedAmount.toLocaleString('en-IN')}`}
                        style={{ height: '30px', fontSize: '13px', fontWeight: 700, fontFamily: 'var(--yz-font-mono)' }}
                      />
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setCashTenderedInput(String(computedReceivedAmount))}
                        style={{
                          padding: '3px 8px',
                          fontSize: '10.5px',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: '1px solid var(--yz-primary)',
                          backgroundColor: 'var(--yz-primary-subtle)',
                          color: 'var(--yz-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        Exact (₹{computedReceivedAmount.toLocaleString('en-IN')})
                      </button>
                      {[500, 1000, 2000, 5000]
                        .filter((val) => val >= computedReceivedAmount)
                        .map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setCashTenderedInput(String(preset))}
                            style={{
                              padding: '3px 8px',
                              fontSize: '10.5px',
                              borderRadius: '4px',
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

                    {/* Change Calculation Box */}
                    {(() => {
                      const tenderNum = cashTenderedInput.trim() === '' ? computedReceivedAmount : Number(cashTenderedInput);
                      if (isNaN(tenderNum)) return null;
                      if (tenderNum >= computedReceivedAmount) {
                        const change = tenderNum - computedReceivedAmount;
                        return (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: '#DCFCE7',
                              border: '1px solid #86EFAC',
                              borderRadius: '4px',
                              padding: '6px 10px',
                              fontSize: '11.5px',
                              color: '#166534',
                            }}
                          >
                            <span style={{ fontWeight: 600 }}>Change to Return:</span>
                            <strong style={{ fontSize: '13px', fontFamily: 'var(--yz-font-mono)' }}>
                              ₹{change.toLocaleString('en-IN')}
                            </strong>
                          </div>
                        );
                      } else {
                        const short = computedReceivedAmount - tenderNum;
                        return (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: '#FEF2F2',
                              border: '1px solid #FECACA',
                              borderRadius: '4px',
                              padding: '6px 10px',
                              fontSize: '11px',
                              color: '#991B1B',
                            }}
                          >
                            <span>Remaining / Shortfall:</span>
                            <strong style={{ fontFamily: 'var(--yz-font-mono)' }}>
                              -₹{short.toLocaleString('en-IN')}
                            </strong>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}

                {/* UPI Panel (Store QR & Merchant details) */}
                {paymentMode === 'UPI' && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      padding: '10px 12px',
                      backgroundColor: 'var(--yz-bg-subtle)',
                      borderRadius: 'var(--yz-radius-sm)',
                      border: '1px solid var(--yz-border)',
                      textAlign: 'center',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '110px',
                        height: '110px',
                        backgroundColor: '#FFFFFF',
                        border: '1px solid var(--yz-border)',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '6px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                      }}
                    >
                      <img
                        src={paymentSettings.upiQrUrl || '/images/payment/yaazhi-upi-qr.png'}
                        alt="Store UPI QR Code"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '11.5px', color: 'var(--yz-text-primary)', fontFamily: 'var(--yz-font-mono)' }}>
                        {paymentSettings.upiId || 'yaazhi@oksbi'}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--yz-text-secondary)', marginTop: '1px' }}>
                        Scan & pay ₹{computedReceivedAmount.toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div style={{ width: '100%', textAlign: 'left', marginTop: '2px' }}>
                      <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--yz-text-secondary)', display: 'block', marginBottom: '2px' }}>
                        UPI Reference / UTR Number (Optional)
                      </label>
                      <input
                        type="text"
                        value={upiReference}
                        onChange={(e) => setUpiReference(e.target.value)}
                        className="yz-input"
                        placeholder="e.g. 428910482910"
                        style={{ height: '26px', fontSize: '11px' }}
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>

      {/* + Create New Customer Modal */}
      <AddCustomerModal
        isOpen={isAddCustomerModalOpen}
        onClose={() => setIsAddCustomerModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  );
};
