import { api } from './apiClient';

export interface BillingCheckoutInput {
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  godown_id?: string;
  payment_mode: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER';
  payment_reference?: string;
  payment_status?: 'PAID' | 'PARTIAL' | 'PENDING';
  paid_amount?: number;
  pending_amount?: number;
  discount_total?: number;
  notes?: string;
  items: {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount?: number;
    tax_rate?: number;
  }[];
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
