import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { CustomDropdown } from '../../components/common/CustomDropdown';
import { Modal } from '../../components/common/Modal';
import { useToast } from '../../components/common/Toast';

interface ExpenseItem {
  id: string;
  date: string;
  title: string;
  category: 'Fabric & Linings' | 'Threads & Zari' | 'Trims & Fasteners' | 'Atelier Equipment' | 'Shop Utilities';
  vendor: string;
  amount: number;
  paymentMode: 'UPI' | 'Cash' | 'Bank Transfer';
  status: 'PAID' | 'PENDING';
}

const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'EXP-1001',
    date: '2026-10-20',
    title: 'Pure Cotton Cambric Lining Rolls (100 meters)',
    category: 'Fabric & Linings',
    vendor: 'Coimbatore Handloom Mills',
    amount: 6500,
    paymentMode: 'UPI',
    status: 'PAID',
  },
  {
    id: 'EXP-1002',
    date: '2026-10-19',
    title: 'Kanchipuram Half-Fine Gold Zari Spools (10 Spools)',
    category: 'Threads & Zari',
    vendor: 'Murugan Zari Works, Surat',
    amount: 4800,
    paymentMode: 'Bank Transfer',
    status: 'PAID',
  },
  {
    id: 'EXP-1003',
    date: '2026-10-18',
    title: 'YKK Concealed Invisible Zippers & Metal Hooks (200 pcs)',
    category: 'Trims & Fasteners',
    vendor: 'Madras Trims Agency',
    amount: 2400,
    paymentMode: 'Cash',
    status: 'PAID',
  },
  {
    id: 'EXP-1004',
    date: '2026-10-15',
    title: 'Industrial Heavy-Duty Steam Iron Maintenance & Boiler Descaling',
    category: 'Atelier Equipment',
    vendor: 'SilverStar Machine Works',
    amount: 1800,
    paymentMode: 'UPI',
    status: 'PAID',
  },
  {
    id: 'EXP-1005',
    date: '2026-10-10',
    title: 'Atelier Showroom Electricity Bill (October 2026)',
    category: 'Shop Utilities',
    vendor: 'TANGEDCO Tamil Nadu',
    amount: 4250,
    paymentMode: 'UPI',
    status: 'PAID',
  },
  {
    id: 'EXP-1006',
    date: '2026-10-08',
    title: 'Boutique Packaging Carry Bags & Gold Foil Butter Paper',
    category: 'Shop Utilities',
    vendor: 'Kaveri Print Pack',
    amount: 3200,
    paymentMode: 'Bank Transfer',
    status: 'PAID',
  },
];

const CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Categories' },
  { value: 'Fabric & Linings', label: 'Fabric & Linings' },
  { value: 'Threads & Zari', label: 'Threads & Zari' },
  { value: 'Trims & Fasteners', label: 'Trims & Fasteners' },
  { value: 'Atelier Equipment', label: 'Atelier Equipment' },
  { value: 'Shop Utilities', label: 'Shop Utilities' },
];

export const ExpensesSuppliesPage: React.FC = () => {
  const { showToast } = useToast();
  const [expenses, setExpenses] = useState<ExpenseItem[]>(INITIAL_EXPENSES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ExpenseItem['category']>('Fabric & Linings');
  const [newVendor, setNewVendor] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newPaymentMode, setNewPaymentMode] = useState<'UPI' | 'Cash' | 'Bank Transfer'>('UPI');

  const filteredExpenses = expenses.filter((item) => {
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchVendor = item.vendor.toLowerCase().includes(q);
      const matchId = item.id.toLowerCase().includes(q);
      if (!matchTitle && !matchVendor && !matchId) return false;
    }
    return true;
  });

  const totalExpenseAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount) return;

    const created: ExpenseItem = {
      id: `EXP-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString().split('T')[0],
      title: newTitle.trim(),
      category: newCategory,
      vendor: newVendor.trim() || 'Local Atelier Supplier',
      amount: parseFloat(newAmount) || 0,
      paymentMode: newPaymentMode,
      status: 'PAID',
    };

    setExpenses([created, ...expenses]);
    showToast({
      type: 'success',
      title: 'Expense Recorded',
      message: `Recorded ₹${created.amount.toLocaleString('en-IN')} for ${created.title}`,
    });

    setIsModalOpen(false);
    setNewTitle('');
    setNewVendor('');
    setNewAmount('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--yz-text-primary)',
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Expenses & Supplies
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--yz-text-secondary)', margin: 0 }}>
            Track fabric sourcing, atelier lining materials, trims, artisan consumables, and boutique operating expenses.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <Plus size={15} style={{ marginRight: '6px' }} /> Record Expense
        </Button>
      </div>

      {/* KPI Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-card-radius)',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
            Monthly Total Expenses
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-primary)', marginTop: '4px' }}>
            ₹{totalExpenseAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-card-radius)',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
            Fabric & Linings
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px' }}>
            ₹6,500.00
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-card-radius)',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
            Zari & Trims Sourcing
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px' }}>
            ₹7,200.00
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-card-radius)',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
            Atelier Utilities
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px' }}>
            ₹9,250.00
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div
        style={{
          backgroundColor: 'var(--yz-bg-surface)',
          border: '1px solid var(--yz-border)',
          borderRadius: 'var(--yz-card-radius)',
          boxShadow: 'var(--yz-shadow-2xs)',
          overflow: 'hidden',
        }}
      >
        {/* Filter Controls */}
        <div
          style={{
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            borderBottom: '1px solid var(--yz-border-subtle)',
          }}
        >
          <div style={{ position: 'relative', flex: '1', minWidth: '220px' }}>
            <Search
              size={15}
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search supplies, vendors, or invoices..."
              style={{
                width: '100%',
                height: 'var(--yz-control-height-md)',
                paddingLeft: '32px',
                paddingRight: '12px',
                borderRadius: 'var(--yz-input-radius)',
                border: '1px solid var(--yz-border)',
                backgroundColor: 'var(--yz-bg-canvas)',
                color: 'var(--yz-text-primary)',
                fontSize: '13px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ width: '200px' }}>
            <CustomDropdown
              value={selectedCategory}
              onChange={(val) => setSelectedCategory(val as string)}
              options={CATEGORY_OPTIONS}
              placeholder="Expense Category"
            />
          </div>
        </div>

        {/* Expenses Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr
                style={{
                  backgroundColor: 'var(--yz-bg-subtle)',
                  borderBottom: '1px solid var(--yz-border)',
                  color: 'var(--yz-text-secondary)',
                  fontWeight: 600,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <th style={{ padding: '10px 16px' }}>Date & ID</th>
                <th style={{ padding: '10px 14px' }}>Item / Description</th>
                <th style={{ padding: '10px 14px' }}>Category</th>
                <th style={{ padding: '10px 14px' }}>Vendor / Source</th>
                <th style={{ padding: '10px 14px' }}>Payment Mode</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount (₹)</th>
                <th style={{ padding: '10px 16px', textAlign: 'center' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((item) => (
                <tr
                  key={item.id}
                  style={{
                    borderBottom: '1px solid var(--yz-border-subtle)',
                    backgroundColor: 'var(--yz-bg-surface)',
                  }}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{item.date}</div>
                    <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', fontFamily: 'var(--yz-font-mono)' }}>
                      {item.id}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>{item.title}</div>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <Badge variant="neutral">{item.category}</Badge>
                  </td>
                  <td style={{ padding: '12px 14px', color: 'var(--yz-text-secondary)' }}>
                    {item.vendor}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--yz-text-secondary)' }}>{item.paymentMode}</span>
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                    <strong style={{ color: 'var(--yz-text-primary)' }}>
                      ₹{item.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </strong>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                    <Badge variant={item.status === 'PAID' ? 'success' : 'warning'}>{item.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Atelier Supply / Expense"
        subtitle="Log consumable purchases, thread sourcing, or utility overheads"
        maxWidth="520px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', width: '100%' }}>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateExpense}>
              Record Expense
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Item / Description <span style={{ color: 'var(--yz-status-out-stock)' }}>*</span>
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Cotton Lining Fabric 50m Roll"
              style={{
                width: '100%',
                height: 'var(--yz-control-height-md)',
                padding: '0 10px',
                borderRadius: 'var(--yz-input-radius)',
                border: '1px solid var(--yz-border)',
                backgroundColor: 'var(--yz-bg-surface)',
                color: 'var(--yz-text-primary)',
                fontSize: '13px',
                boxSizing: 'border-box',
              }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Category
              </label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as any)}
                style={{
                  width: '100%',
                  height: 'var(--yz-control-height-md)',
                  padding: '0 8px',
                  borderRadius: 'var(--yz-input-radius)',
                  border: '1px solid var(--yz-border)',
                  backgroundColor: 'var(--yz-bg-surface)',
                  color: 'var(--yz-text-primary)',
                  fontSize: '13px',
                }}
              >
                <option value="Fabric & Linings">Fabric & Linings</option>
                <option value="Threads & Zari">Threads & Zari</option>
                <option value="Trims & Fasteners">Trims & Fasteners</option>
                <option value="Atelier Equipment">Atelier Equipment</option>
                <option value="Shop Utilities">Shop Utilities</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Amount (₹) <span style={{ color: 'var(--yz-status-out-stock)' }}>*</span>
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="2500"
                style={{
                  width: '100%',
                  height: 'var(--yz-control-height-md)',
                  padding: '0 10px',
                  borderRadius: 'var(--yz-input-radius)',
                  border: '1px solid var(--yz-border)',
                  backgroundColor: 'var(--yz-bg-surface)',
                  color: 'var(--yz-text-primary)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Vendor / Supplier
              </label>
              <input
                type="text"
                value={newVendor}
                onChange={(e) => setNewVendor(e.target.value)}
                placeholder="e.g. Kaveri Silk Mills"
                style={{
                  width: '100%',
                  height: 'var(--yz-control-height-md)',
                  padding: '0 10px',
                  borderRadius: 'var(--yz-input-radius)',
                  border: '1px solid var(--yz-border)',
                  backgroundColor: 'var(--yz-bg-surface)',
                  color: 'var(--yz-text-primary)',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
                Payment Mode
              </label>
              <select
                value={newPaymentMode}
                onChange={(e) => setNewPaymentMode(e.target.value as any)}
                style={{
                  width: '100%',
                  height: 'var(--yz-control-height-md)',
                  padding: '0 8px',
                  borderRadius: 'var(--yz-input-radius)',
                  border: '1px solid var(--yz-border)',
                  backgroundColor: 'var(--yz-bg-surface)',
                  color: 'var(--yz-text-primary)',
                  fontSize: '13px',
                }}
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};
