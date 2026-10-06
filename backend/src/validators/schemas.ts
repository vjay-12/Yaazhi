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
  tax_rate: z.number().min(0).default(0),
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
  product_id: z.string().min(1, 'Product is required'),
  quantity: z.number().positive('Quantity must be at least 1'),
  unit_price: z.number().min(0, 'Unit price must be non-negative'),
  discount: z.number().min(0).default(0),
  tax_rate: z.number().min(0).default(0),
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
