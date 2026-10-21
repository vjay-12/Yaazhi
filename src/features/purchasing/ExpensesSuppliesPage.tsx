import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Package,
  ShoppingCart,
  Receipt,
  Plus,
  Search,
  RefreshCw,
  AlertTriangle,
  FileText,
  TrendingDown,
  Layers,
  Archive,
  Edit,
  History,
  Ban,
  CheckCircle,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Pagination } from '../../components/common/Pagination';
import { useToast } from '../../components/common/Toast';
import { supplierService, type VendorData } from '../../services/supplierService';
import {
  expensesSuppliesService,
  type SupplyItem,
  type SupplyPurchase,
  type OperatingExpense,
  type ExpensesSuppliesSummary,
  type CreateSupplyInput,
  type UpdateSupplyInput,
  type RecordConsumptionInput,
  type RecordAdjustmentInput,
  type CreateSupplyPurchaseInput,
  type CreateOperatingExpenseInput,
  type UpdateOperatingExpenseInput,
} from '../../services/expensesSuppliesService';

import { AddSupplyModal } from './components/AddSupplyModal';
import { RecordConsumptionModal } from './components/RecordConsumptionModal';
import { RecordAdjustmentModal } from './components/RecordAdjustmentModal';
import { SupplyMovementsModal } from './components/SupplyMovementsModal';
import { RecordSupplyPurchaseModal } from './components/RecordSupplyPurchaseModal';
import { SupplyPurchaseDetailModal } from './components/SupplyPurchaseDetailModal';
import { RecordExpenseModal } from './components/RecordExpenseModal';
import { VoidExpenseModal } from './components/VoidExpenseModal';

type ActiveTab = 'supplies' | 'purchases' | 'expenses';
type PeriodFilter = 'today' | 'this_week' | 'this_month' | 'this_quarter' | 'this_year' | 'all';

export const ExpensesSuppliesPage: React.FC = () => {
  const { showToast } = useToast();

  // Active top tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('supplies');

  // Period filter for reporting summary
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('this_month');

  // Data states
  const [supplies, setSupplies] = useState<SupplyItem[]>([]);
  const [purchases, setPurchases] = useState<SupplyPurchase[]>([]);
  const [expenses, setExpenses] = useState<OperatingExpense[]>([]);
  const [summary, setSummary] = useState<ExpensesSuppliesSummary | null>(null);
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);

  // Loading & refresh
  const [isLoading, setIsLoading] = useState(false);

  // Tab 1 (Supplies) Filters
  const [supplySearch, setSupplySearch] = useState('');
  const [supplyCategoryFilter, setSupplyCategoryFilter] = useState('ALL');
  const [supplyStatusFilter, setSupplyStatusFilter] = useState<'ACTIVE' | 'ARCHIVED' | 'ALL'>('ACTIVE');
  const [supplyLowStockOnly, setSupplyLowStockOnly] = useState(false);

  // Tab 2 (Purchases) Filters
  const [purchaseSearch, setPurchaseSearch] = useState('');
  const [purchaseStatusFilter, setPurchaseStatusFilter] = useState('ALL');
  const [purchaseSupplierFilter, setPurchaseSupplierFilter] = useState('ALL');

  // Tab 3 (Operating Expenses) Filters
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState('ALL');
  const [expenseStatusFilter, setExpenseStatusFilter] = useState<'ACTIVE' | 'VOIDED' | 'ALL'>('ACTIVE');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    supplySearch,
    supplyCategoryFilter,
    supplyStatusFilter,
    supplyLowStockOnly,
    purchaseSearch,
    purchaseStatusFilter,
    purchaseSupplierFilter,
    expenseSearch,
    expenseCategoryFilter,
    expenseStatusFilter,
  ]);

  // Modals state
  const [isAddSupplyOpen, setIsAddSupplyOpen] = useState(false);
  const [supplyToEdit, setSupplyToEdit] = useState<SupplyItem | null>(null);

  const [isConsumptionOpen, setIsConsumptionOpen] = useState(false);
  const [consumptionSupply, setConsumptionSupply] = useState<SupplyItem | null>(null);

  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [adjustmentSupply, setAdjustmentSupply] = useState<SupplyItem | null>(null);

  const [isMovementsOpen, setIsMovementsOpen] = useState(false);
  const [movementsSupply, setMovementsSupply] = useState<SupplyItem | null>(null);

  const [isRecordPurchaseOpen, setIsRecordPurchaseOpen] = useState(false);
  const [activePurchaseDetail, setActivePurchaseDetail] = useState<SupplyPurchase | null>(null);

  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState<OperatingExpense | null>(null);
  const [expenseToVoid, setExpenseToVoid] = useState<OperatingExpense | null>(null);

  // Load initial static references: vendors, categories
  const loadReferences = useCallback(async () => {
    try {
      const [vList, supplyCats, expCats] = await Promise.all([
        supplierService.list(),
        expensesSuppliesService.getSupplyCategories(),
        expensesSuppliesService.getExpenseCategories(),
      ]);
      setVendors(vList);
      setCategories(supplyCats);
      setExpenseCategories(expCats);
    } catch (err) {
      console.error('Failed to load references:', err);
    }
  }, []);

  useEffect(() => {
    loadReferences();
  }, [loadReferences]);

  // Load Report Summary
  const loadSummary = useCallback(async () => {
    try {
      const data = await expensesSuppliesService.getSummary({ period: selectedPeriod });
      setSummary(data);
    } catch (err) {
      console.error('Failed to load accounting summary:', err);
    }
  }, [selectedPeriod]);

  // Load Active Tab Data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      await loadSummary();

      if (activeTab === 'supplies') {
        const data = await expensesSuppliesService.listSupplies({
          search: supplySearch.trim() || undefined,
          category: supplyCategoryFilter !== 'ALL' ? supplyCategoryFilter : undefined,
          status: supplyStatusFilter,
          low_stock_only: supplyLowStockOnly,
        });
        setSupplies(data);
      } else if (activeTab === 'purchases') {
        const data = await expensesSuppliesService.listPurchases({
          search: purchaseSearch.trim() || undefined,
          payment_status: purchaseStatusFilter !== 'ALL' ? purchaseStatusFilter : undefined,
          supplier_id: purchaseSupplierFilter !== 'ALL' ? purchaseSupplierFilter : undefined,
        });
        setPurchases(data);
      } else if (activeTab === 'expenses') {
        const data = await expensesSuppliesService.listExpenses({
          search: expenseSearch.trim() || undefined,
          category: expenseCategoryFilter !== 'ALL' ? expenseCategoryFilter : undefined,
          status: expenseStatusFilter,
        });
        setExpenses(data);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Loading Error',
        message: err.message || 'Failed to fetch expenses and supplies data',
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    activeTab,
    selectedPeriod,
    loadSummary,
    supplySearch,
    supplyCategoryFilter,
    supplyStatusFilter,
    supplyLowStockOnly,
    purchaseSearch,
    purchaseStatusFilter,
    purchaseSupplierFilter,
    expenseSearch,
    expenseCategoryFilter,
    expenseStatusFilter,
    showToast,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ----------------------------------------------------
  // Handlers: Supplies Inventory
  // ----------------------------------------------------
  const handleSaveSupply = async (data: CreateSupplyInput | UpdateSupplyInput) => {
    if (supplyToEdit) {
      await expensesSuppliesService.updateSupply(supplyToEdit.id, data as UpdateSupplyInput);
      showToast({
        type: 'success',
        title: 'Supply Updated',
        message: `Updated supply item "${data.name}"`,
      });
    } else {
      await expensesSuppliesService.createSupply(data as CreateSupplyInput);
      showToast({
        type: 'success',
        title: 'Supply Added',
        message: `Registered consumable "${data.name}" into atelier inventory`,
      });
    }
    await loadData();
  };

  const handleArchiveSupply = async (item: SupplyItem) => {
    const nextArchived = !item.is_archived;
    await expensesSuppliesService.setArchiveStatus(item.id, nextArchived);
    showToast({
      type: 'success',
      title: nextArchived ? 'Supply Archived' : 'Supply Restored',
      message: `${item.name} is now ${nextArchived ? 'archived' : 'active'}.`,
    });
    await loadData();
  };

  const handleRecordConsumption = async (input: RecordConsumptionInput) => {
    const res = await expensesSuppliesService.recordConsumption(input);
    showToast({
      type: 'success',
      title: 'Consumption Recorded',
      message: `Used ${input.quantity} of ${res.supply.name}. New balance: ${res.supply.current_quantity} ${res.supply.unit}.`,
    });
    await loadData();
  };

  const handleRecordAdjustment = async (input: RecordAdjustmentInput) => {
    const res = await expensesSuppliesService.recordAdjustment(input);
    showToast({
      type: 'success',
      title: 'Stock Reconciled',
      message: `Stock reconciled for ${res.supply.name}. Adjustment: ${
        res.adjustment_difference > 0 ? `+${res.adjustment_difference}` : res.adjustment_difference
      }. New balance: ${res.supply.current_quantity}.`,
    });
    await loadData();
  };

  // ----------------------------------------------------
  // Handlers: Purchase Records
  // ----------------------------------------------------
  const handleRecordPurchase = async (input: CreateSupplyPurchaseInput) => {
    const created = await expensesSuppliesService.createPurchase(input);
    showToast({
      type: 'success',
      title: 'Purchase Recorded & Stock Received',
      message: `Order #${created.purchase_number} recorded. Consumable supplies stock updated.`,
    });
    await loadData();
  };

  const handleCancelPurchase = async (purchaseId: string, reason: string) => {
    await expensesSuppliesService.cancelPurchase(purchaseId, reason);
    showToast({
      type: 'success',
      title: 'Purchase Cancelled',
      message: 'Purchase cancelled and received stock reversed.',
    });
    await loadData();
  };

  const handleRecordPurchasePayment = async (
    purchaseId: string,
    amount: number,
    method?: string,
    notes?: string
  ) => {
    await expensesSuppliesService.recordPurchasePayment(purchaseId, {
      amount,
      payment_method: method,
      notes,
    });
    showToast({
      type: 'success',
      title: 'Payment Recorded',
      message: `Supplier payment of ₹${amount} recorded successfully.`,
    });
    await loadData();
  };

  // ----------------------------------------------------
  // Handlers: Operating Expenses
  // ----------------------------------------------------
  const handleSaveExpense = async (
    input: CreateOperatingExpenseInput | UpdateOperatingExpenseInput
  ) => {
    if (expenseToEdit) {
      await expensesSuppliesService.updateExpense(
        expenseToEdit.id,
        input as UpdateOperatingExpenseInput
      );
      showToast({
        type: 'success',
        title: 'Expense Updated',
        message: `Updated expense "${input.title}"`,
      });
    } else {
      await expensesSuppliesService.createExpense(input as CreateOperatingExpenseInput);
      showToast({
        type: 'success',
        title: 'Expense Recorded',
        message: `Recorded operating expense of ₹${input.amount}`,
      });
    }
    await loadData();
  };

  const handleVoidExpense = async (expenseId: string, reason: string) => {
    await expensesSuppliesService.voidExpense(expenseId, reason);
    showToast({
      type: 'success',
      title: 'Expense Voided',
      message: 'Operating expense marked as VOIDED with audit reason recorded.',
    });
    await loadData();
  };

  // ----------------------------------------------------
  // Pagination Computations
  // ----------------------------------------------------
  const currentDataset = useMemo(() => {
    if (activeTab === 'supplies') return supplies;
    if (activeTab === 'purchases') return purchases;
    return expenses;
  }, [activeTab, supplies, purchases, expenses]);

  const totalItems = currentDataset.length;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return currentDataset.slice(start, start + pageSize);
  }, [currentDataset, currentPage, pageSize]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
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
            <Receipt size={22} style={{ color: 'var(--yz-primary)' }} />
            Expenses & Supplies Management
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--yz-text-secondary)', margin: 0 }}>
            Track consumable atelier inventory, supplies purchases, and boutique operating expenditure with strict accounting segregation.
          </p>
        </div>

        {/* Global Actions & Period Filter */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as PeriodFilter)}
            className="yz-input"
            style={{ fontSize: '13px', padding: '6px 10px', fontWeight: 500 }}
          >
            <option value="today">Period: Today</option>
            <option value="this_week">Period: This Week</option>
            <option value="this_month">Period: This Month</option>
            <option value="this_quarter">Period: This Quarter</option>
            <option value="this_year">Period: This Year</option>
            <option value="all">Period: All Time</option>
          </select>

          <Button variant="secondary" size="md" onClick={loadData} disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'yz-spin' : ''} style={{ marginRight: '6px' }} />
            Refresh
          </Button>

          {activeTab === 'supplies' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setSupplyToEdit(null);
                setIsAddSupplyOpen(true);
              }}
            >
              <Plus size={15} style={{ marginRight: '6px' }} /> New Consumable Supply
            </Button>
          )}

          {activeTab === 'purchases' && (
            <Button variant="primary" size="md" onClick={() => setIsRecordPurchaseOpen(true)}>
              <Plus size={15} style={{ marginRight: '6px' }} /> Record Supplies Purchase
            </Button>
          )}

          {activeTab === 'expenses' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setExpenseToEdit(null);
                setIsRecordExpenseOpen(true);
              }}
            >
              <Plus size={15} style={{ marginRight: '6px' }} /> Record Operating Expense
            </Button>
          )}
        </div>
      </div>

      {/* Accounting Distinction Alert Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '10px 16px',
          backgroundColor: 'var(--yz-bg-surface)',
          border: '1px solid var(--yz-border)',
          borderRadius: 'var(--yz-card-radius)',
          boxShadow: 'var(--yz-shadow-2xs)',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: 'var(--yz-radius-md)',
            backgroundColor: 'var(--yz-primary-subtle)',
            color: 'var(--yz-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Layers size={16} />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--yz-text-secondary)', lineHeight: '1.5' }}>
          <strong style={{ color: 'var(--yz-text-primary)' }}>Accounting Separation Notice:</strong>{' '}
          Consumable supplies (linings, threads, zippers, hooks) increase atelier inventory assets at cost until consumed. Operating expenses (rent, electricity, delivery) are recognized immediately as period expenses without mixing inventory valuation or inflating ready-made product costs.
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        {/* Card 1: Consumables Stock Value */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-card-radius)',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
            Consumables Stock Value
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px' }}>
            ₹{summary ? summary.supplies_stock.total_valuation_at_cost.toLocaleString('en-IN') : '0'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
            {summary?.supplies_stock.active_items_count || 0} active supplies tracked
          </div>
        </div>

        {/* Card 2: Low Stock Alerts */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-card-radius)',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
            Low Stock Consumables
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: (summary?.supplies_stock.low_stock_count ?? 0) > 0 ? 'var(--yz-warning, #d97706)' : 'var(--yz-success, #16a34a)',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {(summary?.supplies_stock.low_stock_count ?? 0) > 0 && <AlertTriangle size={18} />}
            {summary?.supplies_stock.low_stock_count || 0}{' '}
            <span style={{ fontSize: '12px', fontWeight: 400, color: 'var(--yz-text-muted)' }}>
              below threshold ({summary?.supplies_stock.out_of_stock_count || 0} depleted)
            </span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
            Reorder buttons, threads, or zips
          </div>
        </div>

        {/* Card 3: Period Supplies Purchases */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-card-radius)',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
            Period Supplies Purchased
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px' }}>
            ₹{summary ? summary.supplies_purchases.period_total_amount.toLocaleString('en-IN') : '0'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
            {summary?.supplies_purchases.period_purchases_count || 0} orders received in {selectedPeriod.replace('_', ' ')}
          </div>
        </div>

        {/* Card 4: Operating Expenses */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-card-radius)',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
            Period Operating Expenses
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--yz-text-primary)', marginTop: '4px' }}>
            ₹{summary ? summary.operating_expenses.period_total_amount.toLocaleString('en-IN') : '0'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
            {summary?.operating_expenses.active_expenses_count || 0} active entries ({summary?.operating_expenses.voided_expenses_count || 0} voided)
          </div>
        </div>

        {/* Card 5: Outstanding Supplier Payments */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--yz-bg-surface)',
            border: '1px solid var(--yz-border)',
            borderRadius: 'var(--yz-card-radius)',
            boxShadow: 'var(--yz-shadow-2xs)',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--yz-text-muted)', textTransform: 'uppercase' }}>
            Outstanding Supplier Due
          </div>
          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: (summary?.supplies_purchases.all_time_outstanding_supplier_balance ?? 0) > 0 ? 'var(--yz-danger, #ef4444)' : 'var(--yz-success, #16a34a)',
              marginTop: '4px',
            }}
          >
            ₹{summary ? summary.supplies_purchases.all_time_outstanding_supplier_balance.toLocaleString('en-IN') : '0'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--yz-text-muted)', marginTop: '2px' }}>
            {summary?.supplies_purchases.unpaid_purchases_count || 0} unpaid or partial POs
          </div>
        </div>
      </div>

      {/* Main Section Container */}
      <div
        style={{
          backgroundColor: 'var(--yz-bg-surface)',
          border: '1px solid var(--yz-border)',
          borderRadius: 'var(--yz-card-radius)',
          boxShadow: 'var(--yz-shadow-2xs)',
          overflow: 'hidden',
        }}
      >
        {/* Compact Tab Switcher Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            backgroundColor: 'var(--yz-bg-subtle)',
            borderBottom: '1px solid var(--yz-border)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setActiveTab('supplies')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--yz-radius-md)',
                border: 'none',
                backgroundColor: activeTab === 'supplies' ? 'var(--yz-bg-surface)' : 'transparent',
                color: activeTab === 'supplies' ? 'var(--yz-primary)' : 'var(--yz-text-secondary)',
                fontWeight: activeTab === 'supplies' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === 'supplies' ? 'var(--yz-shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Package size={15} /> Supplies Inventory
            </button>

            <button
              onClick={() => setActiveTab('purchases')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--yz-radius-md)',
                border: 'none',
                backgroundColor: activeTab === 'purchases' ? 'var(--yz-bg-surface)' : 'transparent',
                color: activeTab === 'purchases' ? 'var(--yz-primary)' : 'var(--yz-text-secondary)',
                fontWeight: activeTab === 'purchases' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === 'purchases' ? 'var(--yz-shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <ShoppingCart size={15} /> Purchase Records
            </button>

            <button
              onClick={() => setActiveTab('expenses')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: 'var(--yz-radius-md)',
                border: 'none',
                backgroundColor: activeTab === 'expenses' ? 'var(--yz-bg-surface)' : 'transparent',
                color: activeTab === 'expenses' ? 'var(--yz-primary)' : 'var(--yz-text-secondary)',
                fontWeight: activeTab === 'expenses' ? 600 : 500,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: activeTab === 'expenses' ? 'var(--yz-shadow-xs)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Receipt size={15} /> Operating Expenses
            </button>
          </div>

          {/* Quick Context Action for Active Tab */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab === 'supplies' && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setConsumptionSupply(null);
                    setIsConsumptionOpen(true);
                  }}
                >
                  <TrendingDown size={13} style={{ marginRight: '4px' }} /> Record Consumption
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setAdjustmentSupply(null);
                    setIsAdjustmentOpen(true);
                  }}
                >
                  <CheckCircle size={13} style={{ marginRight: '4px' }} /> Stock Audit Count
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setMovementsSupply(null);
                    setIsMovementsOpen(true);
                  }}
                >
                  <History size={13} style={{ marginRight: '4px' }} /> Movement Log
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filters Toolbar */}
        <div
          style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--yz-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          {/* TAB 1: SUPPLIES FILTERS */}
          {activeTab === 'supplies' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ position: 'relative', width: '240px' }}>
                <Search
                  size={14}
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
                  placeholder="Search supplies by name or SKU..."
                  value={supplySearch}
                  onChange={(e) => setSupplySearch(e.target.value)}
                  className="yz-input"
                  style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box', fontSize: '13px' }}
                />
              </div>

              <select
                value={supplyCategoryFilter}
                onChange={(e) => setSupplyCategoryFilter(e.target.value)}
                className="yz-input"
                style={{ fontSize: '13px' }}
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={supplyStatusFilter}
                onChange={(e) => setSupplyStatusFilter(e.target.value as any)}
                className="yz-input"
                style={{ fontSize: '13px' }}
              >
                <option value="ACTIVE">Active Items</option>
                <option value="ARCHIVED">Archived Items</option>
                <option value="ALL">All Statuses</option>
              </select>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  color: 'var(--yz-text-secondary)',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <input
                  type="checkbox"
                  checked={supplyLowStockOnly}
                  onChange={(e) => setSupplyLowStockOnly(e.target.checked)}
                />
                Low Stock Only
              </label>
            </div>
          )}

          {/* TAB 2: PURCHASES FILTERS */}
          {activeTab === 'purchases' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search
                  size={14}
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
                  placeholder="Search PO #, invoice #, supplier..."
                  value={purchaseSearch}
                  onChange={(e) => setPurchaseSearch(e.target.value)}
                  className="yz-input"
                  style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box', fontSize: '13px' }}
                />
              </div>

              <select
                value={purchaseStatusFilter}
                onChange={(e) => setPurchaseStatusFilter(e.target.value)}
                className="yz-input"
                style={{ fontSize: '13px' }}
              >
                <option value="ALL">All Payment Statuses</option>
                <option value="PAID">Paid in Full</option>
                <option value="PARTIAL">Partial Payment</option>
                <option value="PENDING">Pending Payment</option>
              </select>

              <select
                value={purchaseSupplierFilter}
                onChange={(e) => setPurchaseSupplierFilter(e.target.value)}
                className="yz-input"
                style={{ fontSize: '13px' }}
              >
                <option value="ALL">All Suppliers</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* TAB 3: OPERATING EXPENSES FILTERS */}
          {activeTab === 'expenses' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ position: 'relative', width: '260px' }}>
                <Search
                  size={14}
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
                  placeholder="Search description, payee, reference..."
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  className="yz-input"
                  style={{ paddingLeft: '32px', width: '100%', boxSizing: 'border-box', fontSize: '13px' }}
                />
              </div>

              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="yz-input"
                style={{ fontSize: '13px' }}
              >
                <option value="ALL">All Categories</option>
                {expenseCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={expenseStatusFilter}
                onChange={(e) => setExpenseStatusFilter(e.target.value as any)}
                className="yz-input"
                style={{ fontSize: '13px' }}
              >
                <option value="ACTIVE">Active Expenses</option>
                <option value="VOIDED">Voided Records</option>
                <option value="ALL">All Records</option>
              </select>
            </div>
          )}

          <div style={{ fontSize: '12px', color: 'var(--yz-text-muted)' }}>
            Total: <strong>{totalItems}</strong> records
          </div>
        </div>

        {/* Table Content */}
        <div style={{ overflowX: 'auto' }}>
          {/* ======================================================== */}
          {/* TAB 1: SUPPLIES INVENTORY TABLE */}
          {/* ======================================================== */}
          {activeTab === 'supplies' && (
            <table className="yz-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--yz-bg-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Item & SKU</th>
                  <th style={{ padding: '10px 14px' }}>Category & Unit</th>
                  <th style={{ padding: '10px 14px' }}>Stock Level</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Valuation</th>
                  <th style={{ padding: '10px 14px' }}>Default Supplier</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--yz-text-muted)' }}>
                      No consumable supplies found matching the active criteria.
                    </td>
                  </tr>
                ) : (
                  (paginatedData as SupplyItem[]).map((item) => {
                    const qty = Number(item.current_quantity) || 0;
                    const minStock = Number(item.min_stock_level) || 0;
                    const cost = Number(item.unit_cost) || 0;
                    const valuation = qty * cost;
                    const isLow = qty <= minStock;
                    const isDepleted = qty <= 0;

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--yz-border)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                            {item.name}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', fontFamily: 'monospace' }}>
                              {item.sku}
                            </span>
                            {item.is_archived && <Badge variant="neutral">ARCHIVED</Badge>}
                          </div>
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--yz-bg-subtle)',
                              color: 'var(--yz-text-secondary)',
                              fontSize: '12px',
                              fontWeight: 500,
                            }}
                          >
                            {item.category}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', display: 'block', marginTop: '2px' }}>
                            Unit: {item.unit}
                          </span>
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                fontWeight: 700,
                                fontSize: '14px',
                                color: isDepleted
                                  ? 'var(--yz-danger, #ef4444)'
                                  : isLow
                                  ? 'var(--yz-warning, #d97706)'
                                  : 'var(--yz-text-primary)',
                              }}
                            >
                              {qty} {item.unit}
                            </span>
                            {isDepleted ? (
                              <Badge variant="danger">DEPLETED</Badge>
                            ) : isLow ? (
                              <Badge variant="warning">LOW STOCK</Badge>
                            ) : (
                              <Badge variant="success">IN STOCK</Badge>
                            )}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', display: 'block', marginTop: '2px' }}>
                            Min threshold: {minStock} {item.unit}
                          </span>
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          ₹{cost.toFixed(2)}
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>
                          ₹{valuation.toFixed(2)}
                        </td>

                        <td style={{ padding: '10px 14px', color: 'var(--yz-text-secondary)' }}>
                          {item.default_supplier ? (
                            <div>
                              <span style={{ fontWeight: 500, color: 'var(--yz-text-primary)' }}>
                                {item.default_supplier.name}
                              </span>
                              {item.default_supplier.city && (
                                <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', display: 'block' }}>
                                  {item.default_supplier.city}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--yz-text-muted)', fontStyle: 'italic' }}>—</span>
                          )}
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              onClick={() => {
                                setConsumptionSupply(item);
                                setIsConsumptionOpen(true);
                              }}
                              className="yz-btn yz-btn-secondary yz-btn-sm"
                              title="Record stock consumption (stitching/counter)"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                            >
                              <TrendingDown size={12} style={{ marginRight: '3px' }} /> Consume
                            </button>

                            <button
                              onClick={() => {
                                setAdjustmentSupply(item);
                                setIsAdjustmentOpen(true);
                              }}
                              className="yz-btn yz-btn-secondary yz-btn-sm"
                              title="Physical count reconciliation"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                            >
                              Adjust
                            </button>

                            <button
                              onClick={() => {
                                setMovementsSupply(item);
                                setIsMovementsOpen(true);
                              }}
                              className="yz-btn yz-btn-secondary yz-btn-sm"
                              title="Movement audit ledger"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                            >
                              <History size={12} />
                            </button>

                            <button
                              onClick={() => {
                                setSupplyToEdit(item);
                                setIsAddSupplyOpen(true);
                              }}
                              className="yz-btn yz-btn-secondary yz-btn-sm"
                              title="Edit item"
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                            >
                              <Edit size={12} />
                            </button>

                            <button
                              onClick={() => handleArchiveSupply(item)}
                              className="yz-btn yz-btn-secondary yz-btn-sm"
                              title={item.is_archived ? 'Restore item' : 'Archive item'}
                              style={{ padding: '3px 8px', fontSize: '11px' }}
                            >
                              <Archive size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* ======================================================== */}
          {/* TAB 2: PURCHASE RECORDS TABLE */}
          {/* ======================================================== */}
          {activeTab === 'purchases' && (
            <table className="yz-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--yz-bg-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Purchase # & Date</th>
                  <th style={{ padding: '10px 14px' }}>Supplier / Vendor</th>
                  <th style={{ padding: '10px 14px' }}>Line Items Summary</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Subtotal</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Tax</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Grand Total</th>
                  <th style={{ padding: '10px 14px' }}>Payment Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--yz-text-muted)' }}>
                      No purchase orders recorded matching the active criteria.
                    </td>
                  </tr>
                ) : (
                  (paginatedData as SupplyPurchase[]).map((purchase) => {
                    const isCancelled = purchase.status === 'CANCELLED';
                    const itemsSummary = purchase.items
                      ?.map((it) => `${it.supply?.name || 'Item'} (x${it.quantity})`)
                      .join(', ');

                    return (
                      <tr key={purchase.id} style={{ borderBottom: '1px solid var(--yz-border)' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--yz-primary)', fontFamily: 'monospace' }}>
                            {purchase.purchase_number}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', display: 'block', marginTop: '2px' }}>
                            {new Date(purchase.purchase_date).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          {purchase.invoice_number && (
                            <span style={{ fontSize: '11px', color: 'var(--yz-text-secondary)', display: 'block' }}>
                              Inv: {purchase.invoice_number}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--yz-text-primary)' }}>
                            {purchase.supplier_name}
                          </div>
                          {purchase.supplier_phone && (
                            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>
                              {purchase.supplier_phone}
                            </span>
                          )}
                        </td>

                        <td
                          style={{
                            padding: '10px 14px',
                            maxWidth: '260px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            color: 'var(--yz-text-secondary)',
                          }}
                          title={itemsSummary}
                        >
                          {itemsSummary || '—'}
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          ₹{Number(purchase.subtotal).toFixed(2)}
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--yz-text-secondary)' }}>
                          ₹{Number(purchase.tax_total).toFixed(2)}
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700 }}>
                          ₹{Number(purchase.grand_total).toFixed(2)}
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          {isCancelled ? (
                            <Badge variant="danger">CANCELLED</Badge>
                          ) : purchase.payment_status === 'PAID' ? (
                            <Badge variant="success">PAID</Badge>
                          ) : purchase.payment_status === 'PARTIAL' ? (
                            <div>
                              <Badge variant="warning">PARTIAL</Badge>
                              <span style={{ fontSize: '11px', color: 'var(--yz-danger, #ef4444)', display: 'block', marginTop: '2px' }}>
                                Due: ₹{Number(purchase.balance_amount).toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <Badge variant="danger">PENDING</Badge>
                              <span style={{ fontSize: '11px', color: 'var(--yz-danger, #ef4444)', display: 'block', marginTop: '2px' }}>
                                Due: ₹{Number(purchase.balance_amount).toFixed(2)}
                              </span>
                            </div>
                          )}
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActivePurchaseDetail(purchase)}
                          >
                            <FileText size={12} style={{ marginRight: '4px' }} /> View Details
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* ======================================================== */}
          {/* TAB 3: OPERATING EXPENSES TABLE */}
          {/* ======================================================== */}
          {activeTab === 'expenses' && (
            <table className="yz-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--yz-bg-subtle)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Expense # & Date</th>
                  <th style={{ padding: '10px 14px' }}>Category</th>
                  <th style={{ padding: '10px 14px' }}>Description / Title</th>
                  <th style={{ padding: '10px 14px' }}>Payee / Vendor</th>
                  <th style={{ padding: '10px 14px' }}>Mode</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                  <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--yz-text-muted)' }}>
                      No operating expenditure recorded matching the active criteria.
                    </td>
                  </tr>
                ) : (
                  (paginatedData as OperatingExpense[]).map((exp) => {
                    const isVoided = exp.status === 'VOIDED';

                    return (
                      <tr
                        key={exp.id}
                        style={{
                          borderBottom: '1px solid var(--yz-border)',
                          opacity: isVoided ? 0.65 : 1,
                        }}
                      >
                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              fontWeight: 700,
                              color: isVoided ? 'var(--yz-text-muted)' : 'var(--yz-primary)',
                              fontFamily: 'monospace',
                              textDecoration: isVoided ? 'line-through' : 'none',
                            }}
                          >
                            {exp.expense_number}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', display: 'block', marginTop: '2px' }}>
                            {new Date(exp.expense_date).toLocaleDateString('en-IN', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--yz-bg-subtle)',
                              color: 'var(--yz-text-secondary)',
                              fontSize: '12px',
                              fontWeight: 500,
                            }}
                          >
                            {exp.category}
                          </span>
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--yz-text-primary)',
                              textDecoration: isVoided ? 'line-through' : 'none',
                            }}
                          >
                            {exp.title}
                          </div>
                          {exp.reference_number && (
                            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)', display: 'block' }}>
                              Ref: {exp.reference_number}
                            </span>
                          )}
                        </td>

                        <td style={{ padding: '10px 14px', color: 'var(--yz-text-secondary)' }}>
                          {exp.payee_name || exp.vendor?.name || '—'}
                        </td>

                        <td style={{ padding: '10px 14px', fontSize: '12px', color: 'var(--yz-text-secondary)' }}>
                          {exp.payment_method}
                        </td>

                        <td
                          style={{
                            padding: '10px 14px',
                            textAlign: 'right',
                            fontWeight: 700,
                            textDecoration: isVoided ? 'line-through' : 'none',
                          }}
                        >
                          ₹{Number(exp.amount).toFixed(2)}
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          {isVoided ? (
                            <div>
                              <Badge variant="neutral">VOIDED</Badge>
                              {exp.void_reason && (
                                <span
                                  style={{
                                    fontSize: '10px',
                                    color: 'var(--yz-text-muted)',
                                    display: 'block',
                                    marginTop: '2px',
                                    maxWidth: '120px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={exp.void_reason}
                                >
                                  {exp.void_reason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="success">ACTIVE</Badge>
                          )}
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          {!isVoided ? (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                              <button
                                onClick={() => {
                                  setExpenseToEdit(exp);
                                  setIsRecordExpenseOpen(true);
                                }}
                                className="yz-btn yz-btn-secondary yz-btn-sm"
                                title="Edit expense"
                                style={{ padding: '3px 8px', fontSize: '11px' }}
                              >
                                <Edit size={12} />
                              </button>

                              <button
                                onClick={() => setExpenseToVoid(exp)}
                                className="yz-btn yz-btn-secondary yz-btn-sm"
                                title="Void operating expense"
                                style={{
                                  padding: '3px 8px',
                                  fontSize: '11px',
                                  color: 'var(--yz-danger, #ef4444)',
                                }}
                              >
                                <Ban size={12} /> Void
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--yz-text-muted)' }}>Voided</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {totalItems > 0 && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--yz-border)' }}>
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(s) => setPageSize(s)}
            />
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODALS */}
      {/* ======================================================== */}
      {/* Add / Edit Supply Modal */}
      <AddSupplyModal
        isOpen={isAddSupplyOpen}
        onClose={() => {
          setIsAddSupplyOpen(false);
          setSupplyToEdit(null);
        }}
        onSubmit={handleSaveSupply}
        supplyToEdit={supplyToEdit}
        suppliers={vendors}
        existingCategories={categories}
      />

      {/* Record Consumption Modal */}
      <RecordConsumptionModal
        isOpen={isConsumptionOpen}
        onClose={() => {
          setIsConsumptionOpen(false);
          setConsumptionSupply(null);
        }}
        onSubmit={handleRecordConsumption}
        supplies={supplies}
        preselectedSupply={consumptionSupply}
      />

      {/* Record Adjustment Modal */}
      <RecordAdjustmentModal
        isOpen={isAdjustmentOpen}
        onClose={() => {
          setIsAdjustmentOpen(false);
          setAdjustmentSupply(null);
        }}
        onSubmit={handleRecordAdjustment}
        supplies={supplies}
        preselectedSupply={adjustmentSupply}
      />

      {/* Movement Ledger History Modal */}
      <SupplyMovementsModal
        isOpen={isMovementsOpen}
        onClose={() => {
          setIsMovementsOpen(false);
          setMovementsSupply(null);
        }}
        selectedSupply={movementsSupply}
      />

      {/* Record Purchase Modal */}
      <RecordSupplyPurchaseModal
        isOpen={isRecordPurchaseOpen}
        onClose={() => setIsRecordPurchaseOpen(false)}
        onSubmit={handleRecordPurchase}
        supplies={supplies}
        suppliers={vendors}
      />

      {/* Purchase Detail Modal */}
      <SupplyPurchaseDetailModal
        isOpen={Boolean(activePurchaseDetail)}
        onClose={() => setActivePurchaseDetail(null)}
        purchase={activePurchaseDetail}
        onCancelPurchase={handleCancelPurchase}
        onRecordPayment={handleRecordPurchasePayment}
      />

      {/* Record / Edit Expense Modal */}
      <RecordExpenseModal
        isOpen={isRecordExpenseOpen}
        onClose={() => {
          setIsRecordExpenseOpen(false);
          setExpenseToEdit(null);
        }}
        onSubmit={handleSaveExpense}
        expenseToEdit={expenseToEdit}
        categories={expenseCategories}
        vendors={vendors}
      />

      {/* Void Expense Modal */}
      <VoidExpenseModal
        isOpen={Boolean(expenseToVoid)}
        onClose={() => setExpenseToVoid(null)}
        expense={expenseToVoid}
        onConfirmVoid={handleVoidExpense}
      />
    </div>
  );
};
