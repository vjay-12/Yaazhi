import { z } from 'zod';

export const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50),
  name: z.string().min(1, 'Product name is required').max(200),
  description: z.string().optional().nullable(),
  fabric: z.string().optional().nullable(),
  craft: z.string().optional().nullable(),
  category_id: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.string().min(1, 'Unit is required').default('PCS'),
  sale_price: z.number().min(0, 'Sale price must be non-negative'),
  purchase_price: z.number().min(0, 'Purchase price must be non-negative').default(0),
  hsn_code: z.string().optional().nullable(),
  tax_rate: z.number().min(0).max(100).default(0),
  min_stock_level: z.number().min(0).default(0),
  initial_stock: z.number().min(0, 'Opening stock must be 0 or greater').optional().default(0),
  godown_id: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

export const customerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  shipping_address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state_code: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const supplierSchema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  contact_person: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  vendor_type: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  state_code: z.string().optional().nullable(),
  gstin: z.string().optional().nullable(),
  bank_name: z.string().optional().nullable(),
  account_number: z.string().optional().nullable(),
  ifsc_code: z.string().optional().nullable(),
  upi_id: z.string().optional().nullable(),
  opening_balance: z.number().default(0),
  is_active: z.boolean().default(true),
  is_archived: z.boolean().default(false),
});

export const purchaseOrderItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit_cost: z.number().min(0, 'Unit cost must be non-negative'),
  tax_rate: z.number().min(0).default(0),
});

export const purchaseOrderSchema = z.object({
  supplier_id: z.string().optional().nullable(),
  supplier_name: z.string().min(1, 'Supplier name is required'),
  supplier_phone: z.string().optional().nullable(),
  supplier_address: z.string().optional().nullable(),
  supplier_gstin: z.string().optional().nullable(),
  godown_id: z.string().optional().nullable(),
  order_date: z.string().default(() => new Date().toISOString()),
  expected_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseOrderItemSchema).min(1, 'At least one item is required'),
});

export const salesOrderItemSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  discount: z.number().min(0).default(0),
  tax_rate: z.number().min(0).optional(),
});

export const salesOrderSchema = z.object({
  customer_id: z.string().optional().nullable(),
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_phone: z.string().optional().nullable(),
  customer_address: z.string().optional().nullable(),
  customer_gstin: z.string().optional().nullable(),
  godown_id: z.string().optional().nullable(),
  order_date: z.string().default(() => new Date().toISOString()),
  notes: z.string().optional().nullable(),
  items: z.array(salesOrderItemSchema).min(1, 'At least one item is required'),
});

export const billingCheckoutItemSchema = z.object({
  product_id: z.string().optional().nullable(),
  template_id: z.string().optional().nullable(),
  item_type: z.enum(['PRODUCT', 'SERVICE']).default('PRODUCT'),
  name: z.string().optional(),
  sku: z.string().optional(),
  quantity: z.number().positive('Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  discount: z.number().min(0).default(0),
  tax_rate: z.number().min(0).optional(),
  measurement_version_id: z.string().optional().nullable(),
  garment_type: z.string().optional().nullable(),
  selected_addons: z.array(z.string()).optional(),
  tailor_instructions: z.string().optional().nullable(),
  delivery_date: z.string().optional().nullable(),
});

export const billingCheckoutSchema = z.object({
  customer_id: z.string().optional().nullable(),
  customer_name: z.string().default('Walk-in Boutique Client'),
  customer_phone: z.string().optional().nullable(),
  godown_id: z.string().optional().nullable(),
  payment_mode: z.enum(['CASH', 'CARD', 'UPI', 'BANK_TRANSFER']).default('CASH'),
  payment_reference: z.string().optional().nullable(),
  payment_status: z.enum(['PAID', 'PARTIAL', 'PENDING']).default('PAID'),
  paid_amount: z.number().min(0).optional(),
  pending_amount: z.number().min(0).optional(),
  discount_total: z.number().min(0).default(0),
  notes: z.string().optional().nullable(),
  measurement_version_id: z.string().optional().nullable(),
  measurement_version_ids: z.array(z.string()).optional(),
  items: z.array(billingCheckoutItemSchema).min(1, 'Cart cannot be empty'),
});

export const stockAdjustmentSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  godown_id: z.string().min(1, 'Location is required'),
  new_stock: z.number().min(0, 'Stock cannot be negative'),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().optional().nullable(),
});

export const customerMeasurementProfileSchema = z.object({
  template_id: z.string().min(1, 'Template is required'),
  profile_name: z.string().min(1, 'Profile name is required'),
  notes: z.string().nullable().optional(),
  measured_by: z.string().nullable().optional(),
  values: z.array(
    z.object({
      field_id: z.string().min(1, 'Field ID is required'),
      numeric_value: z.number().nullable().optional(),
      text_value: z.string().nullable().optional(),
      unit: z.string().default('in'),
    })
  ).default([]),
});

// Consumable Supplies & Expenses Validation Schemas
export const createSupplyItemSchema = z.object({
  name: z.string().min(1, 'Item name is required'),
  sku: z.string().optional(),
  category: z.string().default('Buttons & Fasteners'),
  unit: z.string().default('PCS'),
  min_stock_level: z.number().min(0).default(0),
  unit_cost: z.number().min(0).default(0),
  default_supplier_id: z.string().nullable().optional(),
  initial_quantity: z.number().min(0).default(0),
  notes: z.string().nullable().optional(),
});

export const updateSupplyItemSchema = z.object({
  name: z.string().min(1, 'Item name is required').optional(),
  category: z.string().optional(),
  unit: z.string().optional(),
  min_stock_level: z.number().min(0).optional(),
  unit_cost: z.number().min(0).optional(),
  default_supplier_id: z.string().nullable().optional(),
});

export const recordSupplyConsumptionSchema = z.object({
  supply_id: z.string().min(1, 'Supply item is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  stitching_order_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  created_by: z.string().optional(),
});

export const recordSupplyAdjustmentSchema = z.object({
  supply_id: z.string().min(1, 'Supply item is required'),
  physical_count: z.number().min(0, 'Quantity cannot be negative').optional(),
  new_quantity: z.number().min(0, 'Quantity cannot be negative').optional(),
  reason: z.string().min(1, 'Reason is required'),
  notes: z.string().nullable().optional(),
  created_by: z.string().optional(),
}).refine(data => data.physical_count !== undefined || data.new_quantity !== undefined, {
  message: 'Either physical_count or new_quantity must be provided',
});

export const supplyPurchaseItemInputSchema = z.object({
  supply_id: z.string().min(1, 'Supply item is required'),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit_cost: z.number().min(0, 'Unit cost cannot be negative'),
  tax_rate: z.number().min(0).default(0),
});

export const createSupplyPurchaseSchema = z.object({
  supplier_id: z.string().nullable().optional(),
  supplier_name: z.string().min(1, 'Supplier name is required'),
  supplier_phone: z.string().nullable().optional(),
  purchase_date: z.string().optional(),
  invoice_number: z.string().nullable().optional(),
  discount_total: z.number().min(0).default(0),
  paid_amount: z.number().min(0).optional(),
  payment_method: z.string().default('CASH'),
  payment_status: z.enum(['PAID', 'PARTIAL', 'PENDING']).default('PAID'),
  receipt_url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  items: z.array(supplyPurchaseItemInputSchema).min(1, 'At least one supply item is required'),
});

export const createOperatingExpenseSchema = z.object({
  category: z.string().min(1, 'Expense category is required'),
  title: z.string().min(1, 'Expense title is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  expense_date: z.string().optional(),
  payment_method: z.string().default('UPI'),
  vendor_id: z.string().nullable().optional(),
  payee_name: z.string().nullable().optional(),
  reference_number: z.string().nullable().optional(),
  receipt_url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateOperatingExpenseSchema = z.object({
  category: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  expense_date: z.string().optional(),
  payment_method: z.string().optional(),
  vendor_id: z.string().nullable().optional(),
  payee_name: z.string().nullable().optional(),
  reference_number: z.string().nullable().optional(),
  receipt_url: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const voidOperatingExpenseSchema = z.object({
  reason: z.string().optional(),
  void_reason: z.string().optional(),
  voided_by: z.string().optional(),
}).refine(data => Boolean(data.reason?.trim() || data.void_reason?.trim()), {
  message: 'Void reason is required',
});

