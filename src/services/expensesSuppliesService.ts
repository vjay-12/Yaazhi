import { api } from './apiClient';

// ==========================================
// Types: Supplies Inventory
// ==========================================

export interface SupplyItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: string;
  current_quantity: number;
  min_stock_level: number;
  unit_cost: number;
  default_supplier_id?: string | null;
  default_supplier?: {
    id: string;
    name: string;
    phone?: string | null;
    city?: string | null;
  } | null;
  is_archived: boolean;
  notes?: string | null;
  created_at: string;
  updated_at: string;
  movements?: SupplyMovement[];
}

export type SupplyMovementType =
  | 'PURCHASE_RECEIPT'
  | 'CONSUMPTION'
  | 'ADJUSTMENT_ADD'
  | 'ADJUSTMENT_REDUCE'
  | 'RETURN_OUT';

export interface SupplyMovement {
  id: string;
  supply_id: string;
  movement_type: SupplyMovementType;
  quantity: number;
  unit_cost?: number | null;
  balance_after: number;
  reference_type?: string | null;
  reference_id?: string | null;
  stitching_order_number?: string | null;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  supply?: {
    id: string;
    name: string;
    sku: string;
    unit: string;
  };
}

export interface CreateSupplyInput {
  name: string;
  sku?: string;
  category?: string;
  unit?: string;
  min_stock_level?: number;
  unit_cost?: number;
  default_supplier_id?: string | null;
  initial_quantity?: number;
  notes?: string | null;
}

export interface UpdateSupplyInput {
  name?: string;
  category?: string;
  unit?: string;
  min_stock_level?: number;
  unit_cost?: number;
  default_supplier_id?: string | null;
}

export interface RecordConsumptionInput {
  supply_id: string;
  quantity: number;
  stitching_order_number?: string | null;
  notes?: string | null;
}

export interface RecordAdjustmentInput {
  supply_id: string;
  physical_count: number;
  reason?: string | null;
}

// ==========================================
// Types: Purchase Records
// ==========================================

export interface SupplyPurchaseItem {
  id?: string;
  supply_id: string;
  quantity: number;
  unit_cost: number;
  tax_rate?: number;
  tax_amount?: number;
  total_cost?: number;
  supply?: SupplyItem;
}

export interface SupplyPurchase {
  id: string;
  purchase_number: string;
  supplier_id?: string | null;
  supplier_name: string;
  supplier_phone?: string | null;
  purchase_date: string;
  invoice_number?: string | null;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  grand_total: number;
  paid_amount: number;
  balance_amount: number;
  payment_method: string;
  payment_status: 'PAID' | 'PARTIAL' | 'PENDING';
  receipt_url?: string | null;
  notes?: string | null;
  status: 'RECEIVED' | 'CANCELLED';
  is_received: boolean;
  created_by?: string | null;
  created_at: string;
  items: SupplyPurchaseItem[];
  supplier?: {
    id: string;
    name: string;
    phone?: string | null;
  } | null;
}

export interface CreateSupplyPurchaseInput {
  supplier_id?: string | null;
  supplier_name: string;
  supplier_phone?: string | null;
  purchase_date?: string;
  invoice_number?: string | null;
  discount_total?: number;
  paid_amount?: number;
  payment_method?: string;
  payment_status?: 'PAID' | 'PARTIAL' | 'PENDING';
  receipt_url?: string | null;
  notes?: string | null;
  items: {
    supply_id: string;
    quantity: number;
    unit_cost: number;
    tax_rate?: number;
  }[];
}

// ==========================================
// Types: Operating Expenses
// ==========================================

export interface OperatingExpense {
  id: string;
  expense_number: string;
  category: string;
  title: string;
  amount: number;
  expense_date: string;
  payment_method: string;
  vendor_id?: string | null;
  payee_name?: string | null;
  reference_number?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  status: 'ACTIVE' | 'VOIDED';
  void_reason?: string | null;
  voided_at?: string | null;
  created_by?: string | null;
  created_at: string;
  vendor?: {
    id: string;
    name: string;
    phone?: string | null;
  } | null;
}

export interface CreateOperatingExpenseInput {
  category: string;
  title: string;
  amount: number;
  expense_date?: string;
  payment_method?: string;
  vendor_id?: string | null;
  payee_name?: string | null;
  reference_number?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
}

export interface UpdateOperatingExpenseInput {
  category?: string;
  title?: string;
  amount?: number;
  expense_date?: string;
  payment_method?: string;
  vendor_id?: string | null;
  payee_name?: string | null;
  reference_number?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
}

// ==========================================
// Types: Accounting & Reports
// ==========================================

export interface ExpensesSuppliesSummary {
  period: string;
  date_range: {
    start: string | null;
    end: string | null;
  };
  supplies_stock: {
    total_items_count: number;
    active_items_count: number;
    low_stock_count: number;
    out_of_stock_count: number;
    total_valuation_at_cost: number;
  };
  supplies_purchases: {
    period_total_amount: number;
    period_tax_total: number;
    period_discount_total: number;
    period_purchases_count: number;
    all_time_outstanding_supplier_balance: number;
    unpaid_purchases_count: number;
  };
  operating_expenses: {
    period_total_amount: number;
    active_expenses_count: number;
    voided_expenses_count: number;
    by_category: Array<{
      category: string;
      total_amount: number;
      count: number;
      percentage: number;
    }>;
    by_payment_method: Array<{
      payment_method: string;
      total_amount: number;
      count: number;
    }>;
  };
  consumption_summary: {
    period_consumed_items_count: number;
    period_consumed_estimated_value: number;
    stitching_linked_movements_count: number;
  };
  accounting_note: string;
}

// ==========================================
// Service Implementation
// ==========================================

export const expensesSuppliesService = {
  // --- Supplies Inventory ---
  async listSupplies(params: {
    category?: string;
    search?: string;
    status?: 'ACTIVE' | 'ARCHIVED' | 'ALL';
    low_stock_only?: boolean;
    supplier_id?: string;
  } = {}): Promise<SupplyItem[]> {
    const q = new URLSearchParams();
    if (params.category) q.set('category', params.category);
    if (params.search) q.set('search', params.search);
    if (params.status) q.set('status', params.status);
    if (params.low_stock_only) q.set('low_stock_only', 'true');
    if (params.supplier_id) q.set('supplier_id', params.supplier_id);

    const res = await api.get<{ success: boolean; data: SupplyItem[] }>(
      `/supplies?${q.toString()}`
    );
    return res.data;
  },

  async getSupplyById(id: string): Promise<SupplyItem> {
    const res = await api.get<{ success: boolean; data: SupplyItem }>(`/supplies/${id}`);
    return res.data;
  },

  async createSupply(input: CreateSupplyInput): Promise<SupplyItem> {
    const res = await api.post<{ success: boolean; data: SupplyItem }>('/supplies', input);
    return res.data;
  },

  async updateSupply(id: string, input: UpdateSupplyInput): Promise<SupplyItem> {
    const res = await api.put<{ success: boolean; data: SupplyItem }>(`/supplies/${id}`, input);
    return res.data;
  },

  async setArchiveStatus(id: string, is_archived: boolean): Promise<SupplyItem> {
    const res = await api.post<{ success: boolean; data: SupplyItem }>(`/supplies/${id}/archive`, {
      is_archived,
    });
    return res.data;
  },

  async recordConsumption(input: RecordConsumptionInput): Promise<{
    movement: SupplyMovement;
    supply: SupplyItem;
  }> {
    const res = await api.post<{
      success: boolean;
      data: { movement: SupplyMovement; supply: SupplyItem };
    }>('/supplies/consume', input);
    return res.data;
  },

  async recordAdjustment(input: RecordAdjustmentInput): Promise<{
    adjustment_difference: number;
    movement: SupplyMovement | null;
    supply: SupplyItem;
  }> {
    const res = await api.post<{
      success: boolean;
      data: { adjustment_difference: number; movement: SupplyMovement | null; supply: SupplyItem };
    }>('/supplies/adjust', input);
    return res.data;
  },

  async getMovements(params: {
    supply_id?: string;
    movement_type?: SupplyMovementType;
    stitching_order_number?: string;
    limit?: number;
  } = {}): Promise<SupplyMovement[]> {
    const q = new URLSearchParams();
    if (params.supply_id) q.set('supply_id', params.supply_id);
    if (params.movement_type) q.set('movement_type', params.movement_type);
    if (params.stitching_order_number) q.set('stitching_order_number', params.stitching_order_number);
    if (params.limit) q.set('limit', String(params.limit));

    const res = await api.get<{ success: boolean; data: SupplyMovement[] }>(
      `/supplies/movements/log?${q.toString()}`
    );
    return res.data;
  },

  async getSupplyCategories(): Promise<string[]> {
    const res = await api.get<{ success: boolean; data: string[] }>('/supplies/categories');
    return res.data;
  },

  // --- Supplies Purchases ---
  async listPurchases(params: {
    supplier_id?: string;
    payment_status?: string;
    search?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<SupplyPurchase[]> {
    const q = new URLSearchParams();
    if (params.supplier_id) q.set('supplier_id', params.supplier_id);
    if (params.payment_status) q.set('payment_status', params.payment_status);
    if (params.search) q.set('search', params.search);
    if (params.start_date) q.set('start_date', params.start_date);
    if (params.end_date) q.set('end_date', params.end_date);

    const res = await api.get<{ success: boolean; data: SupplyPurchase[] }>(
      `/supply-purchases?${q.toString()}`
    );
    return res.data;
  },

  async getPurchaseById(id: string): Promise<SupplyPurchase> {
    const res = await api.get<{ success: boolean; data: SupplyPurchase }>(
      `/supply-purchases/${id}`
    );
    return res.data;
  },

  async createPurchase(input: CreateSupplyPurchaseInput): Promise<SupplyPurchase> {
    const res = await api.post<{ success: boolean; data: SupplyPurchase }>(
      '/supply-purchases',
      input
    );
    return res.data;
  },

  async cancelPurchase(id: string, reason?: string): Promise<SupplyPurchase> {
    const res = await api.post<{ success: boolean; data: SupplyPurchase }>(
      `/supply-purchases/${id}/cancel`,
      { reason }
    );
    return res.data;
  },

  async recordPurchasePayment(
    id: string,
    params: { amount: number; payment_method?: string; notes?: string }
  ): Promise<SupplyPurchase> {
    const res = await api.post<{ success: boolean; data: SupplyPurchase }>(
      `/supply-purchases/${id}/payment`,
      params
    );
    return res.data;
  },

  // --- Operating Expenses ---
  async listExpenses(params: {
    category?: string;
    status?: 'ACTIVE' | 'VOIDED' | 'ALL';
    start_date?: string;
    end_date?: string;
    vendor_id?: string;
    search?: string;
  } = {}): Promise<OperatingExpense[]> {
    const q = new URLSearchParams();
    if (params.category) q.set('category', params.category);
    if (params.status) q.set('status', params.status);
    if (params.start_date) q.set('start_date', params.start_date);
    if (params.end_date) q.set('end_date', params.end_date);
    if (params.vendor_id) q.set('vendor_id', params.vendor_id);
    if (params.search) q.set('search', params.search);

    const res = await api.get<{ success: boolean; data: OperatingExpense[] }>(
      `/operating-expenses?${q.toString()}`
    );
    return res.data;
  },

  async getExpenseById(id: string): Promise<OperatingExpense> {
    const res = await api.get<{ success: boolean; data: OperatingExpense }>(
      `/operating-expenses/${id}`
    );
    return res.data;
  },

  async createExpense(input: CreateOperatingExpenseInput): Promise<OperatingExpense> {
    const res = await api.post<{ success: boolean; data: OperatingExpense }>(
      '/operating-expenses',
      input
    );
    return res.data;
  },

  async updateExpense(id: string, input: UpdateOperatingExpenseInput): Promise<OperatingExpense> {
    const res = await api.put<{ success: boolean; data: OperatingExpense }>(
      `/operating-expenses/${id}`,
      input
    );
    return res.data;
  },

  async voidExpense(id: string, reason: string): Promise<OperatingExpense> {
    const res = await api.post<{ success: boolean; data: OperatingExpense }>(
      `/operating-expenses/${id}/void`,
      { void_reason: reason }
    );
    return res.data;
  },

  async getExpenseCategories(): Promise<string[]> {
    const res = await api.get<{ success: boolean; data: string[] }>(
      '/operating-expenses/categories'
    );
    return res.data;
  },

  // --- Reports & Summaries ---
  async getSummary(params: {
    period?: string;
    start_date?: string;
    end_date?: string;
  } = {}): Promise<ExpensesSuppliesSummary> {
    const q = new URLSearchParams();
    if (params.period) q.set('period', params.period);
    if (params.start_date) q.set('start_date', params.start_date);
    if (params.end_date) q.set('end_date', params.end_date);

    const res = await api.get<{ success: boolean; data: ExpensesSuppliesSummary }>(
      `/expenses-supplies-reports/summary?${q.toString()}`
    );
    return res.data;
  },
};
