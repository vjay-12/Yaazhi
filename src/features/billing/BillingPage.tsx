import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Printer,
  ShoppingBag,
} from 'lucide-react';
import type { YaazhiProduct, BoutiqueCategory } from '../../types/product';
import { productService } from '../../services/productService';
import { StockBadge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';

interface CartLine {
  product: YaazhiProduct;
  quantity: number;
  unitPrice: number;
  gstRate: number;
}

const CATEGORIES: (BoutiqueCategory | 'ALL')[] = [
  'ALL',
  'Kanchipuram Silk',
  'Cotton Handloom',
  'Banarasi Silk',
  'Designer Chudidar',
  'Kurtis & Tunics',
  'Designer Blouse',
  'Ethnic Menswear',
];

export const BillingPage: React.FC = () => {
  const { showToast } = useToast();
  const [products, setProducts] = useState<YaazhiProduct[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<BoutiqueCategory | 'ALL'>('ALL');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customerName, setCustomerName] = useState<string>('Walk-in Client');
  const [customerPhone, setCustomerPhone] = useState<string>('');

  // Payment Modal State
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI' | 'CARD'>('UPI');
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedBillNo, setCompletedBillNo] = useState<string>('');

  useEffect(() => {
    productService.list().then(setProducts);
  }, []);

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

  const handleCompletePayment = () => {
    const billNo = `YZ-${Date.now().toString().slice(-6)}`;
    setCompletedBillNo(billNo);
    setIsCompleted(true);
    showToast({
      type: 'success',
      title: 'Invoice Issued',
      message: `Bill ${billNo} completed via ${paymentMode}. Total: ₹${grandTotal.toLocaleString('en-IN')}`,
    });
  };

  const handleStartNewBill = () => {
    clearCart();
    setIsCompleted(false);
    setIsPaymentOpen(false);
    setCustomerName('Walk-in Client');
    setCustomerPhone('');
  };

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode.includes(q)
      );
    }
    return true;
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(340px, 1fr)',
        gap: '1.5rem',
        alignItems: 'start',
      }}
    >
      {/* Left Column: Product Selection Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Search & Category Pills */}
        <div className="yz-card" style={{ padding: '1rem' }}>
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--yz-text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Quick search weave name, SKU, or scan barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="yz-input"
              style={{ paddingLeft: '2.4rem' }}
              autoFocus
            />
          </div>

          {/* Category Quick Pills */}
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '4px' }}>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedCategory(c)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--yz-radius-full)',
                  border: '1px solid',
                  borderColor: selectedCategory === c ? 'var(--yz-primary)' : 'var(--yz-border)',
                  backgroundColor: selectedCategory === c ? 'var(--yz-primary-subtle)' : 'var(--yz-bg-surface)',
                  color: selectedCategory === c ? 'var(--yz-primary)' : 'var(--yz-text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: selectedCategory === c ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.12s ease',
                }}
              >
                {c === 'ALL' ? 'All Weaves' : c}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '1rem',
            maxHeight: 'calc(100vh - 250px)',
            overflowY: 'auto',
            paddingRight: '4px',
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
                  borderColor: cartItem ? 'var(--yz-primary)' : 'var(--yz-border)',
                  borderRadius: 'var(--yz-radius-lg)',
                  padding: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  cursor: inStock ? 'pointer' : 'not-allowed',
                  opacity: inStock ? 1 : 0.6,
                  transition: 'all 0.15s ease',
                  boxShadow: cartItem ? '0 0 0 2px var(--yz-primary-subtle)' : 'var(--yz-shadow-xs)',
                  position: 'relative',
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '0.6875rem', fontFamily: 'var(--yz-font-mono)', color: 'var(--yz-text-muted)' }}>
                      {p.sku}
                    </span>
                    <StockBadge status={productService.getStockStatus(p)} stockCount={p.currentStock} />
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.25, color: 'var(--yz-text-primary)' }}>
                    {p.name}
                  </div>
                  {p.fabric && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
                      {p.fabric}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--yz-border-subtle)', paddingTop: '0.5rem' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--yz-font-mono)' }} className="tabular-nums">
                    ₹{p.sellPrice.toLocaleString('en-IN')}
                  </div>

                  {cartItem ? (
                    <span
                      style={{
                        backgroundColor: 'var(--yz-primary)',
                        color: '#FFFFFF',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--yz-radius-full)',
                      }}
                    >
                      {cartItem.quantity} in bill
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--yz-primary)', fontWeight: 600 }}>
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
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 140px)',
          position: 'sticky',
          top: '80px',
        }}
      >
        {/* Cart Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--yz-border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Current Counter Bill</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--yz-text-secondary)' }}>
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items selected
            </span>
          </div>

          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="yz-btn yz-btn-ghost yz-btn-sm"
              style={{ color: 'var(--yz-status-out-stock)', fontSize: '0.75rem' }}
            >
              Clear
            </button>
          )}
        </div>

        {/* Client Tag */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <input
            type="text"
            placeholder="Client Name"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="yz-input"
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.6rem' }}
          />
          <input
            type="text"
            placeholder="Phone Number"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            className="yz-input"
            style={{ fontSize: '0.8125rem', padding: '0.4rem 0.6rem' }}
          />
        </div>

        {/* Cart Item Rows */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '2px' }}>
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
                padding: '2rem 1rem',
              }}
            >
              <ShoppingBag size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Bill is currently empty</div>
              <p style={{ fontSize: '0.78rem', marginTop: '0.2rem' }}>
                Click items from catalog or scan barcode to add to bill.
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
                  padding: '0.6rem 0.75rem',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  borderRadius: 'var(--yz-radius-md)',
                  gap: '0.5rem',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.product.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--yz-text-muted)' }}>
                    ₹{item.unitPrice.toLocaleString('en-IN')} × {item.quantity} (GST {item.gstRate}%)
                  </div>
                </div>

                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    onClick={() => updateQuantity(item.product.id, -1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      border: '1px solid var(--yz-border)',
                      backgroundColor: 'var(--yz-bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Minus size={12} />
                  </button>

                  <span style={{ fontSize: '0.875rem', fontWeight: 700, width: '20px', textAlign: 'center' }}>
                    {item.quantity}
                  </span>

                  <button
                    onClick={() => updateQuantity(item.product.id, 1)}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '4px',
                      border: '1px solid var(--yz-border)',
                      backgroundColor: 'var(--yz-bg-surface)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Plus size={12} />
                  </button>

                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: 'var(--yz-text-muted)',
                      cursor: 'pointer',
                      marginLeft: '4px',
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: '65px', textAlign: 'right', fontFamily: 'var(--yz-font-mono)' }} className="tabular-nums">
                  ₹{(item.unitPrice * item.quantity).toLocaleString('en-IN')}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bill Financial Breakdown */}
        {cart.length > 0 && (
          <div style={{ borderTop: '1px solid var(--yz-border)', paddingTop: '0.75rem', marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8125rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--yz-text-secondary)' }}>
              <span>Items Subtotal</span>
              <span className="tabular-nums">₹{grossSubtotal.toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--yz-text-secondary)' }}>Client Discount</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <select
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', borderRadius: '4px', border: '1px solid var(--yz-border)' }}
                >
                  <option value={0}>0%</option>
                  <option value={5}>5% Boutique Courtesy</option>
                  <option value={10}>10% Festive Privilege</option>
                  <option value={15}>15% Bridal VIP</option>
                </select>
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
                borderTop: '2px dashed var(--yz-border)',
                paddingTop: '0.6rem',
                marginTop: '0.25rem',
                fontSize: '1.25rem',
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
              size="lg"
              onClick={() => setIsPaymentOpen(true)}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Pay ₹{grandTotal.toLocaleString('en-IN')}
            </Button>
          </div>
        )}
      </div>

      {/* Payment & Invoice Modal */}
      <Modal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        title={isCompleted ? 'Invoice Issued Successfully' : 'Boutique POS Payment'}
        subtitle={
          isCompleted
            ? `Invoice #${completedBillNo} generated for ${customerName}`
            : `Total Payable: ₹${grandTotal.toLocaleString('en-IN')}`
        }
        maxWidth="500px"
        footer={
          isCompleted ? (
            <div style={{ display: 'flex', gap: '0.75rem', width: '100%', justifyContent: 'space-between' }}>
              <Button variant="secondary" icon={<Printer size={16} />} onClick={() => window.print()}>
                Print Thermal Bill
              </Button>
              <Button variant="primary" onClick={handleStartNewBill}>
                Start New Bill
              </Button>
            </div>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setIsPaymentOpen(false)}>
                Cancel
              </Button>
              <Button variant="gold" onClick={handleCompletePayment}>
                Confirm & Print Bill
              </Button>
            </>
          )
        }
      >
        {isCompleted ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem', padding: '1rem 0' }}>
            <CheckCircle2 size={54} color="var(--yz-status-in-stock)" />
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>Payment Received</div>
              <p style={{ fontSize: '0.85rem', color: 'var(--yz-text-secondary)', marginTop: '0.2rem' }}>
                ₹{grandTotal.toLocaleString('en-IN')} received via {paymentMode}
              </p>
            </div>

            <div
              style={{
                width: '100%',
                backgroundColor: 'var(--yz-bg-subtle)',
                borderRadius: 'var(--yz-radius-md)',
                padding: '1rem',
                fontSize: '0.8rem',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Boutique:</span>
                <strong>Yaazhi Boutique & Weaves</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Invoice Series:</span>
                <strong>{completedBillNo}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Client:</span>
                <span>{customerName} {customerPhone ? `(${customerPhone})` : ''}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Items Count:</span>
                <span>{cart.reduce((s, i) => s + i.quantity, 0)} pieces</span>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Payment Mode Selector */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <button
                onClick={() => setPaymentMode('UPI')}
                style={{
                  padding: '1rem 0.5rem',
                  borderRadius: 'var(--yz-radius-md)',
                  border: '2px solid',
                  borderColor: paymentMode === 'UPI' ? 'var(--yz-primary)' : 'var(--yz-border)',
                  backgroundColor: paymentMode === 'UPI' ? 'var(--yz-primary-subtle)' : 'var(--yz-bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                <QrCode size={22} color={paymentMode === 'UPI' ? 'var(--yz-primary)' : 'inherit'} />
                <span>UPI / QR</span>
              </button>

              <button
                onClick={() => setPaymentMode('CASH')}
                style={{
                  padding: '1rem 0.5rem',
                  borderRadius: 'var(--yz-radius-md)',
                  border: '2px solid',
                  borderColor: paymentMode === 'CASH' ? 'var(--yz-primary)' : 'var(--yz-border)',
                  backgroundColor: paymentMode === 'CASH' ? 'var(--yz-primary-subtle)' : 'var(--yz-bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                <Banknote size={22} color={paymentMode === 'CASH' ? 'var(--yz-primary)' : 'inherit'} />
                <span>Cash</span>
              </button>

              <button
                onClick={() => setPaymentMode('CARD')}
                style={{
                  padding: '1rem 0.5rem',
                  borderRadius: 'var(--yz-radius-md)',
                  border: '2px solid',
                  borderColor: paymentMode === 'CARD' ? 'var(--yz-primary)' : 'var(--yz-border)',
                  backgroundColor: paymentMode === 'CARD' ? 'var(--yz-primary-subtle)' : 'var(--yz-bg-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.4rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                }}
              >
                <CreditCard size={22} color={paymentMode === 'CARD' ? 'var(--yz-primary)' : 'inherit'} />
                <span>Card</span>
              </button>
            </div>

            {paymentMode === 'UPI' && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '1.25rem',
                  backgroundColor: 'var(--yz-bg-subtle)',
                  borderRadius: 'var(--yz-radius-md)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '140px',
                    height: '140px',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid var(--yz-border)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.75rem',
                  }}
                >
                  <QrCode size={110} color="#1C1817" />
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>yaazhiboutique@okhdfcbank</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--yz-text-secondary)', marginTop: '2px' }}>
                  Ask client to scan and confirm payment of ₹{grandTotal.toLocaleString('en-IN')}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
