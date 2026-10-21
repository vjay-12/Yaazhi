import { api } from './apiClient';

// ============================================================================
// Types for Comprehensive Reports
// ============================================================================

export interface BusinessOverviewData {
  gross_sales: number;
  discounts_total: number;
  net_sales: number;
  successful_collections: number;
  outstanding_customer_balances: number;
  cost_of_goods_sold: number;
  gross_profit: number;
  gross_margin_pct: number;
  operating_expenses: number;
  operating_surplus: number;
  current_inventory_valuation_cost: number;
  current_supplies_stock_valuation: number;
  total_stock_units: number;
  low_stock_items_count: number;
  out_of_stock_items_count: number;
  orders_count: number;
  average_order_value: number;
  accounting_note: string;
}

export interface SalesReportData {
  total_sales_revenue: number;
  order_count: number;
  average_order_value: number;
  ready_made_revenue: number;
  ready_made_units: number;
  stitching_revenue: number;
  stitching_units: number;
  tax_total_collected: number;
  discount_total: number;
  sales_trend: Array<{ date: string; sales: number; orders: number }>;
  revenue_by_category: Array<{
    category: string;
    revenue: number;
    units: number;
    percentage: number;
  }>;
  best_sellers: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
    type: 'PRODUCT' | 'SERVICE';
    units: number;
    revenue: number;
  }>;
  voided_summary: {
    voided_count: number;
    voided_value: number;
    orders: Array<{
      id: string;
      order_number: string;
      grand_total: number;
      status: string;
      order_date: string;
      notes?: string | null;
    }>;
  };
  transactions: Array<{
    id: string;
    order_number: string;
    order_date: string;
    customer_id?: string | null;
    customer_name: string;
    customer_phone?: string | null;
    items_count: number;
    subtotal: number;
    tax_total: number;
    discount_total: number;
    grand_total: number;
    paid_amount: number;
    pending_amount: number;
    status: string;
    payment_status: string;
    notes?: string | null;
  }>;
}

export interface StitchingReportData {
  total_stitching_revenue: number;
  total_services_ordered: number;
  total_stitching_orders: number;
  pipeline: {
    pending_work: number;
    in_progress: number;
    completed_delivered: number;
    overdue_work: number;
  };
  garment_breakdown: Array<{
    garment_type: string;
    count: number;
    revenue: number;
  }>;
  template_breakdown: Array<{
    name: string;
    count: number;
    revenue: number;
  }>;
  overdue_orders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone?: string | null;
    garment_type: string;
    order_date: string;
    expected_delivery?: string | null;
    revenue: number;
  }>;
  orders: Array<{
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone?: string | null;
    garment_type: string;
    service_count: number;
    stitching_revenue: number;
    order_date: string;
    expected_delivery?: string | null;
    status: 'DELIVERED' | 'OVERDUE' | 'IN_PROGRESS';
    has_measurements: boolean;
    measurement_profile_id?: string | null;
    notes?: string | null;
  }>;
}

export interface PaymentReportData {
  total_collections: number;
  payments_count: number;
  by_payment_mode: Array<{
    mode: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  collection_trend: Array<{
    date: string;
    amount: number;
    count: number;
  }>;
  total_outstanding_receivables: number;
  unpaid_orders_count: number;
  outstanding_by_customer: Array<{
    customer_id: string;
    customer_name: string;
    customer_phone?: string | null;
    total_outstanding: number;
    orders_count: number;
    oldest_order_date: string;
  }>;
  recent_payments: Array<{
    id: string;
    payment_number: string;
    payment_date: string;
    amount: number;
    payment_mode: string;
    reference_number?: string | null;
    customer_name: string;
    order_number: string;
    notes?: string | null;
  }>;
}

export interface InventoryReportData {
  active_sku_count: number;
  total_stock_units: number;
  inventory_valuation_cost: number;
  inventory_valuation_retail: number;
  unrealized_retail_potential: number;
  low_stock_count: number;
  out_of_stock_count: number;
  stock_health: {
    healthy: number;
    low_stock: number;
    out_of_stock: number;
  };
  items: Array<{
    id: string;
    name: string;
    sku: string;
    category: string;
    unit: string;
    current_quantity: number;
    min_stock_level: number;
    purchase_price: number;
    sale_price: number;
    valuation_at_cost: number;
    valuation_at_retail: number;
    potential_gross_margin: number;
    status: 'HEALTHY' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  }>;
  recent_movements: Array<{
    id: string;
    type: string;
    product_name: string;
    sku: string;
    quantity: number;
    balance_after: number;
    godown_name: string;
    created_at: string;
    notes?: string | null;
  }>;
}

export interface PurchasingReportData {
  total_orders_count: number;
  received_value: number;
  received_count: number;
  open_ordered_value: number;
  open_ordered_count: number;
  cancelled_value: number;
  cancelled_count: number;
  top_suppliers: Array<{
    supplier_id: string;
    name: string;
    phone?: string | null;
    total_received_spend: number;
    orders_count: number;
  }>;
  purchase_orders: Array<{
    id: string;
    po_number: string;
    supplier_name: string;
    order_date: string;
    expected_date?: string | null;
    status: string;
    subtotal: number;
    tax_total: number;
    grand_total: number;
    items_count: number;
    items_summary: string;
  }>;
}

export interface SuppliesExpensesReportData {
  current_consumables_stock_valuation: number;
  total_active_supplies: number;
  low_stock_supplies_count: number;
  supplies_purchased_in_period: number;
  supplies_purchases_count: number;
  outstanding_supplier_payables: number;
  operating_expenses_total: number;
  expenses_by_category: Array<{
    category: string;
    amount: number;
    count: number;
    percentage: number;
  }>;
  monthly_expense_trend: Array<{
    month: string;
    amount: number;
  }>;
  consumed_units_in_period: number;
  consumed_estimated_value: number;
  stitching_linked_consumptions_count: number;
  recent_expenses: Array<{
    id: string;
    expense_number: string;
    title: string;
    category: string;
    amount: number;
    expense_date: string;
    payment_method: string;
    payee_name?: string | null;
    reference_number?: string | null;
  }>;
}

export interface CustomerReportData {
  total_registered_customers: number;
  active_customers_count: number;
  archived_customers_count: number;
  purchasing_customers_in_period: number;
  new_customers_in_period: number;
  top_customers: Array<{
    id: string;
    name: string;
    phone?: string | null;
    city?: string | null;
    orders_count: number;
    total_spend: number;
    total_paid: number;
    pending_balance: number;
    is_archived: boolean;
  }>;
}

export interface ComprehensiveDashboardData {
  period: string;
  date_range: {
    start: string | null;
    end: string | null;
  };
  overview: BusinessOverviewData;
  sales: SalesReportData;
  stitching: StitchingReportData;
  payments: PaymentReportData;
  inventory: InventoryReportData;
  purchasing: PurchasingReportData;
  supplies_expenses: SuppliesExpensesReportData;
  customers: CustomerReportData;
}

// Legacy Dashboard Data (Backward Compatibility)
export interface ReportDashboardData {
  summary: {
    totalProducts: number;
    totalOrders: number;
    totalCustomers: number;
    totalVendors: number;
    totalStockUnits: number;
    valuationCost: number;
    valuationRetail: number;
    totalSalesRevenue: number;
    totalPurchasesSpend: number;
    lowStockCount: number;
    outOfStockCount: number;
  };
  topProducts: Array<{
    name: string;
    sku: string;
    units: number;
    revenue: number;
  }>;
  recentMovements: Array<{
    id: string;
    type: string;
    productName: string;
    sku: string;
    godownName: string;
    quantity: number;
    balanceAfter: number;
    createdAt: string;
    notes?: string;
  }>;
}

class ReportService {
  /**
   * Fetches unified comprehensive reports payload covering all 8 domains
   */
  public async getComprehensiveDashboard(
    period?: string,
    from?: string,
    to?: string
  ): Promise<ComprehensiveDashboardData> {
    const q = new URLSearchParams();
    if (period) q.set('period', period);
    if (from) q.set('from', from);
    if (to) q.set('to', to);

    const res = await api.get<{ success: boolean; data: ComprehensiveDashboardData }>(
      `/reports/comprehensive?${q.toString()}`
    );
    return res.data;
  }

  /**
   * Legacy dashboard endpoint for overview fallback
   */
  public async getDashboard(): Promise<ReportDashboardData> {
    return api.get<ReportDashboardData>('/reports/dashboard');
  }
}

export const reportService = new ReportService();
