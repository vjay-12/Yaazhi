import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ComprehensiveDashboardData } from '../services/reportService';

/**
 * Helper to trigger browser download of a CSV text string
 */
function downloadCsvFile(csvContent: string, filename: string) {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Escape CSV cell value according to RFC-4180
 */
function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Format currency for report exports
 */
function fmtCurrency(val: number): string {
  return `Rs. ${Math.round(val).toLocaleString('en-IN')}`;
}

export const reportExporter = {
  /**
   * Export the currently active tab data to CSV
   */
  exportCsv(tab: string, periodLabel: string, data: ComprehensiveDashboardData) {
    const timestamp = new Date().toISOString().split('T')[0];
    let rows: string[][] = [];
    let filename = `yaazhi_${tab}_report_${timestamp}.csv`;

    if (tab === 'overview') {
      const o = data.overview;
      rows = [
        ['Yaazhi Boutique & Atelier - Business Overview Financial Report'],
        ['Report Period', periodLabel],
        ['Exported Date', new Date().toLocaleString()],
        [],
        ['Metric Category', 'Metric Name', 'Value (INR / Units)', 'Accounting Classification'],
        ['Revenue', 'Gross Sales', String(o.gross_sales), 'Total booked sales order value'],
        ['Revenue', 'Discounts & Returns', String(o.discounts_total), 'Discounts applied across valid orders'],
        ['Revenue', 'Net Sales', String(o.net_sales), 'Gross Sales less Discounts'],
        ['Cash Flow', 'Successful Collections', String(o.successful_collections), 'Payments cleared into bank / cash'],
        ['Receivables', 'Customer Outstanding', String(o.outstanding_customer_balances), 'Unpaid balances on delivered/active orders'],
        ['Profitability', 'Cost of Goods Sold (COGS)', String(o.cost_of_goods_sold), 'Physical inventory cost of items sold'],
        ['Profitability', 'Gross Profit', String(o.gross_profit), 'Net Sales less COGS'],
        ['Profitability', 'Gross Margin %', `${o.gross_margin_pct.toFixed(2)}%`, 'Gross Profit / Net Sales'],
        ['Operating Costs', 'Operating Expenses', String(o.operating_expenses), 'Period expenses (Rent, Utilities, Wages)'],
        ['Operating Surplus', 'Net Operating Surplus', String(o.operating_surplus), 'Gross Profit less Operating Expenses'],
        ['Current Assets', 'Ready-Made Stock Valuation (Cost)', String(o.current_inventory_valuation_cost), 'Current state physical asset valuation'],
        ['Current Assets', 'Consumables Stock Valuation', String(o.current_supplies_stock_valuation), 'Current state boutique consumables'],
        ['Inventory Health', 'Total Ready-Made Units', String(o.total_stock_units), 'Authoritative ledger count'],
        ['Inventory Health', 'Low Stock SKUs', String(o.low_stock_items_count), 'Current SKUs below reorder threshold'],
        ['Inventory Health', 'Out of Stock SKUs', String(o.out_of_stock_items_count), 'Current SKUs with zero balance'],
        ['Order Volume', 'Total Sales Orders', String(o.orders_count), 'Valid sales orders in period'],
        ['Order Volume', 'Average Order Value (AOV)', String(Math.round(o.average_order_value)), 'Net Sales / Order Count'],
      ];
    } else if (tab === 'sales') {
      const s = data.sales;
      rows = [
        ['Yaazhi Boutique & Atelier - Sales & Billing Report'],
        ['Report Period', periodLabel],
        ['Total Sales Revenue', fmtCurrency(s.total_sales_revenue)],
        ['Total Orders', String(s.order_count)],
        ['Average Order Value', fmtCurrency(s.average_order_value)],
        ['Ready-Made Revenue', fmtCurrency(s.ready_made_revenue)],
        ['Stitching Services Revenue', fmtCurrency(s.stitching_revenue)],
        ['Total GST Collected', fmtCurrency(s.tax_total_collected)],
        ['Discounts Total', fmtCurrency(s.discount_total)],
        [],
        ['--- TRANSACTION-LEVEL SALES LEDGER ---'],
        ['Order Number', 'Order Date', 'Customer Name', 'Phone', 'Items Count', 'Subtotal', 'Discount', 'GST Tax', 'Grand Total', 'Paid Amount', 'Pending Amount', 'Payment Status'],
        ...s.transactions.map((t) => [
          t.order_number,
          t.order_date,
          t.customer_name,
          t.customer_phone || '',
          String(t.items_count),
          String(t.subtotal),
          String(t.discount_total),
          String(t.tax_total),
          String(t.grand_total),
          String(t.paid_amount),
          String(t.pending_amount),
          t.payment_status,
        ]),
        [],
        ['--- BEST SELLING PRODUCTS & SERVICES ---'],
        ['Name', 'SKU / Code', 'Type', 'Category', 'Units Sold', 'Revenue'],
        ...s.best_sellers.map((b) => [
          b.name,
          b.sku,
          b.type,
          b.category,
          String(b.units),
          String(b.revenue),
        ]),
      ];
    } else if (tab === 'stitching') {
      const st = data.stitching;
      rows = [
        ['Yaazhi Boutique & Atelier - Tailoring & Stitching Performance Report'],
        ['Report Period', periodLabel],
        ['Total Stitching Revenue', fmtCurrency(st.total_stitching_revenue)],
        ['Total Services Ordered', String(st.total_services_ordered)],
        ['Stitching Orders Count', String(st.total_stitching_orders)],
        ['Pending Work', String(st.pipeline.pending_work)],
        ['In Progress', String(st.pipeline.in_progress)],
        ['Completed & Delivered', String(st.pipeline.completed_delivered)],
        ['Overdue Orders', String(st.pipeline.overdue_work)],
        [],
        ['--- STITCHING JOB ORDERS LEDGER ---'],
        ['Order Number', 'Customer Name', 'Phone', 'Garment Type', 'Services Count', 'Tailoring Revenue', 'Order Date', 'Expected Delivery', 'Job Status', 'Measurements Linked'],
        ...st.orders.map((o) => [
          o.order_number,
          o.customer_name,
          o.customer_phone || '',
          o.garment_type,
          String(o.service_count),
          String(o.stitching_revenue),
          o.order_date,
          o.expected_delivery || '',
          o.status,
          o.has_measurements ? 'YES' : 'NO',
        ]),
        [],
        ['--- GARMENT TYPE BREAKDOWN ---'],
        ['Garment Type', 'Orders Count', 'Tailoring Revenue'],
        ...st.garment_breakdown.map((g) => [g.garment_type, String(g.count), String(g.revenue)]),
      ];
    } else if (tab === 'payments') {
      const p = data.payments;
      rows = [
        ['Yaazhi Boutique & Atelier - Payments & Collections Report'],
        ['Report Period', periodLabel],
        ['Total Collections Realized', fmtCurrency(p.total_collections)],
        ['Payments Count', String(p.payments_count)],
        ['Total Outstanding Customer Receivables', fmtCurrency(p.total_outstanding_receivables)],
        ['Unpaid / Partial Orders Count', String(p.unpaid_orders_count)],
        [],
        ['--- COLLECTIONS BY PAYMENT MODE ---'],
        ['Payment Method', 'Amount Collected', 'Transaction Count', 'Percentage'],
        ...p.by_payment_mode.map((m) => [m.mode, String(m.amount), String(m.count), `${m.percentage.toFixed(1)}%`]),
        [],
        ['--- CUSTOMER OUTSTANDING BALANCES (RECEIVABLES AGING) ---'],
        ['Customer Name', 'Phone', 'Orders with Balance', 'Oldest Order Date', 'Outstanding Balance'],
        ...p.outstanding_by_customer.map((c) => [
          c.customer_name,
          c.customer_phone || '',
          String(c.orders_count),
          c.oldest_order_date,
          String(c.total_outstanding),
        ]),
        [],
        ['--- SETTLEMENTS & PAYMENTS HISTORY ---'],
        ['Receipt #', 'Date', 'Customer', 'Order #', 'Payment Mode', 'Reference #', 'Amount'],
        ...p.recent_payments.map((rp) => [
          rp.payment_number,
          rp.payment_date,
          rp.customer_name,
          rp.order_number,
          rp.payment_mode,
          rp.reference_number || '',
          String(rp.amount),
        ]),
      ];
    } else if (tab === 'inventory') {
      const inv = data.inventory;
      rows = [
        ['Yaazhi Boutique & Atelier - Current Products & Stock Valuation Ledger'],
        ['As of Date', new Date().toLocaleString()],
        ['Active SKU Count', String(inv.active_sku_count)],
        ['Total Stock Units', String(inv.total_stock_units)],
        ['Total Valuation at Cost', fmtCurrency(inv.inventory_valuation_cost)],
        ['Potential Retail Value', fmtCurrency(inv.inventory_valuation_retail)],
        ['Unrealized Retail Gross Margin Potential', fmtCurrency(inv.unrealized_retail_potential)],
        ['Low Stock SKUs', String(inv.low_stock_count)],
        ['Out of Stock SKUs', String(inv.out_of_stock_count)],
        [],
        ['--- CURRENT STOCK POSITION & VALUATION ---'],
        ['Product Name', 'SKU', 'Category', 'Current Stock', 'Min Threshold', 'Cost Price', 'Retail Price', 'Valuation at Cost', 'Retail Potential', 'Stock Status'],
        ...inv.items.map((i) => [
          i.name,
          i.sku,
          i.category,
          String(i.current_quantity),
          String(i.min_stock_level),
          String(i.purchase_price),
          String(i.sale_price),
          String(i.valuation_at_cost),
          String(i.valuation_at_retail),
          i.status,
        ]),
      ];
    } else if (tab === 'purchasing') {
      const po = data.purchasing;
      rows = [
        ['Yaazhi Boutique & Atelier - Purchasing & Supplier Spend Report'],
        ['Report Period', periodLabel],
        ['Goods Received Spend', fmtCurrency(po.received_value)],
        ['Received Orders Count', String(po.received_count)],
        ['Open / Ordered Value', fmtCurrency(po.open_ordered_value)],
        ['Open Orders Count', String(po.open_ordered_count)],
        ['Cancelled POs Value', fmtCurrency(po.cancelled_value)],
        [],
        ['--- PURCHASE ORDERS LEDGER ---'],
        ['PO Number', 'Order Date', 'Supplier / Guild', 'Expected Date', 'Status', 'Items Summary', 'Subtotal', 'Tax', 'Grand Total'],
        ...po.purchase_orders.map((p) => [
          p.po_number,
          p.order_date,
          p.supplier_name,
          p.expected_date || '',
          p.status,
          p.items_summary,
          String(p.subtotal),
          String(p.tax_total),
          String(p.grand_total),
        ]),
        [],
        ['--- TOP SUPPLIERS BY RECEIVED SPEND ---'],
        ['Supplier Name', 'Phone', 'Orders Count', 'Total Received Spend'],
        ...po.top_suppliers.map((s) => [s.name, s.phone || '', String(s.orders_count), String(s.total_received_spend)]),
      ];
    } else if (tab === 'supplies_expenses') {
      const se = data.supplies_expenses;
      rows = [
        ['Yaazhi Boutique & Atelier - Supplies & Operating Expenses Report'],
        ['Report Period', periodLabel],
        ['Consumables Stock Valuation', fmtCurrency(se.current_consumables_stock_valuation)],
        ['Active Consumables Count', String(se.total_active_supplies)],
        ['Low Stock Consumables', String(se.low_stock_supplies_count)],
        ['Supplies Purchased in Period', fmtCurrency(se.supplies_purchased_in_period)],
        ['Period Operating Expenses Total', fmtCurrency(se.operating_expenses_total)],
        ['Estimated Consumables Used in Stitching', fmtCurrency(se.consumed_estimated_value)],
        [],
        ['--- OPERATING EXPENSES BY CATEGORY ---'],
        ['Category', 'Amount', 'Count', 'Percentage of Total'],
        ...se.expenses_by_category.map((e) => [e.category, String(e.amount), String(e.count), `${e.percentage.toFixed(1)}%`]),
        [],
        ['--- RECENT OPERATING EXPENSES LEDGER ---'],
        ['Voucher #', 'Expense Date', 'Title', 'Category', 'Payee / Vendor', 'Payment Method', 'Amount'],
        ...se.recent_expenses.map((re) => [
          re.expense_number,
          re.expense_date,
          re.title,
          re.category,
          re.payee_name || '',
          re.payment_method,
          String(re.amount),
        ]),
      ];
    } else if (tab === 'customers') {
      const c = data.customers;
      rows = [
        ['Yaazhi Boutique & Atelier - Customer Insights & Spender Ledger'],
        ['Report Period', periodLabel],
        ['Total Registered Customers', String(c.total_registered_customers)],
        ['Active Customers Count', String(c.active_customers_count)],
        ['Archived Customers Count', String(c.archived_customers_count)],
        ['Purchasing Customers in Period', String(c.purchasing_customers_in_period)],
        ['New Customers in Period', String(c.new_customers_in_period)],
        [],
        ['--- TOP SPENDERS & ACCOUNT BALANCES ---'],
        ['Customer Name', 'Phone', 'City', 'Orders Placed', 'Total Spend', 'Total Paid', 'Pending Balance', 'Status'],
        ...c.top_customers.map((tc) => [
          tc.name,
          tc.phone || '',
          tc.city || '',
          String(tc.orders_count),
          String(tc.total_spend),
          String(tc.total_paid),
          String(tc.pending_balance),
          tc.is_archived ? 'ARCHIVED' : 'ACTIVE',
        ]),
      ];
    }

    const csvText = rows.map((r) => r.map(escapeCsv).join(',')).join('\r\n');
    downloadCsvFile(csvText, filename);
  },

  /**
   * Export the currently active tab data to PDF using jsPDF + autoTable
   */
  exportPdf(tab: string, periodLabel: string, data: ComprehensiveDashboardData) {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor: [number, number, number] = [120, 20, 50]; // Deep Yaazhi Wine
    const charcoal: [number, number, number] = [30, 41, 59];

    // Header Branding
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...primaryColor);
    doc.text('YAAZHI BOUTIQUE & ATELIER', 14, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...charcoal);
    doc.text(`Comprehensive Business Intelligence & Analytics Report | Period: ${periodLabel}`, 14, 21);
    doc.setFontSize(8);
    doc.text(`Generated: ${new Date().toLocaleString()} | Strict Source of Truth`, 14, 26);

    let startY = 32;

    if (tab === 'overview') {
      const o = data.overview;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Business Overview & Financial Health', 14, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [['Domain', 'Key Indicator', 'Current Value', 'Audit Definition / Accounting Treatment']],
        body: [
          ['Revenue', 'Gross Sales', fmtCurrency(o.gross_sales), 'Total booked value of active sales orders in period'],
          ['Revenue', 'Discounts Given', fmtCurrency(o.discounts_total), 'Total discounts applied against valid orders'],
          ['Revenue', 'Net Sales', fmtCurrency(o.net_sales), 'Gross sales less discounts; realized revenue'],
          ['Cash Flow', 'Collections Cleared', fmtCurrency(o.successful_collections), 'Payments verified and cleared via Cash, UPI, Card'],
          ['Receivables', 'Customer Outstanding', fmtCurrency(o.outstanding_customer_balances), 'Uncollected receivables on active orders'],
          ['Profitability', 'Cost of Goods Sold (COGS)', fmtCurrency(o.cost_of_goods_sold), 'Authoritative inventory cost of physical products sold'],
          ['Profitability', 'Gross Profit & Margin', `${fmtCurrency(o.gross_profit)} (${o.gross_margin_pct.toFixed(1)}%)`, 'Net Sales less Cost of Goods Sold'],
          ['Operations', 'Operating Expenses', fmtCurrency(o.operating_expenses), 'Period overhead (Utilities, Rent, Tailor Wages, Packaging)'],
          ['Surplus', 'Net Operating Surplus', fmtCurrency(o.operating_surplus), 'Gross Profit less Operating Expenses'],
          ['Balance Sheet', 'Ready-Made Inventory Value', fmtCurrency(o.current_inventory_valuation_cost), 'Current physical stock valuation based on cost price'],
          ['Balance Sheet', 'Consumables Inventory Value', fmtCurrency(o.current_supplies_stock_valuation), 'Current raw boutique supplies (buttons, threads, zips)'],
          ['Health', 'Low / Out of Stock SKUs', `${o.low_stock_items_count} Low / ${o.out_of_stock_items_count} Out`, 'Items requiring supplier replenishment'],
        ],
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 8.5, cellPadding: 3 },
      });
    } else if (tab === 'sales') {
      const s = data.sales;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Sales & Billing Transactions (${s.transactions.length} Orders)`, 14, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [['Order #', 'Date', 'Customer', 'Items', 'Grand Total', 'Paid', 'Pending', 'Status']],
        body: s.transactions.slice(0, 30).map((t) => [
          t.order_number,
          t.order_date,
          t.customer_name,
          String(t.items_count),
          fmtCurrency(t.grand_total),
          fmtCurrency(t.paid_amount),
          fmtCurrency(t.pending_amount),
          t.payment_status,
        ]),
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
    } else if (tab === 'stitching') {
      const st = data.stitching;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Tailoring & Stitching Work Orders (${st.orders.length} Orders)`, 14, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [['Order #', 'Customer', 'Phone', 'Garment', 'Services', 'Revenue', 'Order Date', 'Expected Due', 'Status']],
        body: st.orders.slice(0, 30).map((o) => [
          o.order_number,
          o.customer_name,
          o.customer_phone || '-',
          o.garment_type,
          String(o.service_count),
          fmtCurrency(o.stitching_revenue),
          o.order_date,
          o.expected_delivery || '-',
          o.status,
        ]),
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
    } else if (tab === 'payments') {
      const p = data.payments;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Customer Outstanding Balances (${p.outstanding_by_customer.length} Clients)`, 14, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [['Customer Name', 'Phone', 'Unpaid Orders', 'Oldest Due Date', 'Total Outstanding Balance']],
        body: p.outstanding_by_customer.slice(0, 30).map((c) => [
          c.customer_name,
          c.customer_phone || '-',
          String(c.orders_count),
          c.oldest_order_date,
          fmtCurrency(c.total_outstanding),
        ]),
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 8.5, cellPadding: 3 },
      });
    } else if (tab === 'inventory') {
      const inv = data.inventory;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Current Inventory Stock Position & Valuation (${inv.items.length} SKUs)`, 14, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [['Product Name', 'SKU', 'Category', 'Stock Qty', 'Cost Price', 'Retail Price', 'Cost Valuation', 'Potential Retail', 'Status']],
        body: inv.items.slice(0, 30).map((i) => [
          i.name,
          i.sku,
          i.category,
          String(i.current_quantity),
          fmtCurrency(i.purchase_price),
          fmtCurrency(i.sale_price),
          fmtCurrency(i.valuation_at_cost),
          fmtCurrency(i.valuation_at_retail),
          i.status,
        ]),
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
    } else if (tab === 'purchasing') {
      const po = data.purchasing;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Purchasing Orders & Supplier Spend (${po.purchase_orders.length} Orders)`, 14, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [['PO Number', 'Date', 'Supplier / Guild', 'Expected', 'Status', 'Grand Total']],
        body: po.purchase_orders.slice(0, 30).map((p) => [
          p.po_number,
          p.order_date,
          p.supplier_name,
          p.expected_date || '-',
          p.status,
          fmtCurrency(p.grand_total),
        ]),
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 8.5, cellPadding: 3 },
      });
    } else if (tab === 'supplies_expenses') {
      const se = data.supplies_expenses;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Operating Expenses & Supplies Ledger (${se.recent_expenses.length} Expenses)`, 14, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [['Voucher #', 'Date', 'Title', 'Category', 'Payee / Vendor', 'Payment Mode', 'Amount']],
        body: se.recent_expenses.slice(0, 30).map((e) => [
          e.expense_number,
          e.expense_date,
          e.title,
          e.category,
          e.payee_name || '-',
          e.payment_method,
          fmtCurrency(e.amount),
        ]),
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 8.5, cellPadding: 3 },
      });
    } else if (tab === 'customers') {
      const c = data.customers;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Customer Insights & Top Spenders (${c.top_customers.length} Clients)`, 14, startY);

      autoTable(doc, {
        startY: startY + 4,
        head: [['Customer Name', 'Phone', 'City', 'Orders Placed', 'Total Spend', 'Total Paid', 'Outstanding Balance', 'Status']],
        body: c.top_customers.slice(0, 30).map((tc) => [
          tc.name,
          tc.phone || '-',
          tc.city || '-',
          String(tc.orders_count),
          fmtCurrency(tc.total_spend),
          fmtCurrency(tc.total_paid),
          fmtCurrency(tc.pending_balance),
          tc.is_archived ? 'ARCHIVED' : 'ACTIVE',
        ]),
        theme: 'striped',
        headStyles: { fillColor: primaryColor },
        styles: { fontSize: 8, cellPadding: 2.5 },
      });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    doc.save(`yaazhi_${tab}_report_${timestamp}.pdf`);
  },
};
