import { api } from './apiClient';

export interface BillingCheckoutItemInput {
  product_id?: string;
  template_id?: string;
  item_type?: 'PRODUCT' | 'SERVICE';
  name?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  discount?: number;
  tax_rate?: number;
  measurement_version_id?: string;
  garment_type?: string;
  selected_addons?: string[];
  tailor_instructions?: string;
  delivery_date?: string;
}

export interface BillingCheckoutInput {
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  godown_id?: string;
  payment_mode: 'CASH' | 'UPI';
  payment_reference?: string;
  payment_status?: 'PAID' | 'PARTIAL' | 'PENDING';
  paid_amount?: number;
  pending_amount?: number;
  discount_total?: number;
  notes?: string;
  measurement_version_id?: string;
  measurement_version_ids?: string[];
  items: BillingCheckoutItemInput[];
}

export interface BillingReceiptResponse {
  success: boolean;
  message: string;
  billNo: string;
  invoiceNumber: string;
  paymentNumber: string;
  totalAmount: number;
  paidAmount?: number;
  pendingAmount?: number;
  paymentStatus?: string;
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  paymentMode: string;
  customerName: string;
  items: {
    id: string;
    name: string;
    sku: string;
    item_type?: 'PRODUCT' | 'SERVICE' | string;
    garment_type?: string;
    delivery_date?: string;
    tailor_instructions?: string;
    selected_addons?: string[];
    quantity: number;
    price: number;
    total: number;
  }[];
  date: string;
}

class BillingService {
  public async checkout(input: BillingCheckoutInput): Promise<BillingReceiptResponse> {
    return api.post<BillingReceiptResponse>('/billing/checkout', input);
  }
}

export const billingService = new BillingService();
