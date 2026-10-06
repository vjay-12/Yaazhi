import { api } from './apiClient';

export interface SalesOrderItemData {
  id?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  total?: number;
}

export interface OrderPaymentRecord {
  id: string;
  paymentNumber: string;
  orderId?: string;
  amount: number;
  paymentDate: string;
  date: string;
  paymentMode: string;
  status: string;
  referenceNumber?: string;
  notes?: string;
  createdAt?: string;
  index: number;
}

export interface SalesOrderData {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  customerId?: string;
  date: string;
  orderDate?: string;
  itemsCount: number;
  subtotal?: number;
  discountTotal?: number;
  taxTotal?: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  paymentStatus: 'PAID' | 'PENDING' | 'VOIDED' | string;
  status: 'DRAFT' | 'CONFIRMED' | 'DELIVERED' | 'CANCELLED' | 'VOIDED';
  location: string;
  itemsSummary: string;
  notes?: string;
  invoiceNumber?: string | null;
  items: SalesOrderItemData[];
  payments?: OrderPaymentRecord[];
  createdAt: string;
}

class SalesOrderService {
  public async list(): Promise<SalesOrderData[]> {
    return api.get<SalesOrderData[]>('/sales-orders');
  }

  public async getById(id: string): Promise<any> {
    return api.get<any>(`/sales-orders/${id}`);
  }

  public async create(data: {
    customer_id?: string;
    customer_name?: string;
    customer_phone?: string;
    godown_id?: string;
    notes?: string;
    items: {
      product_id: string;
      quantity: number;
      unit_price: number;
      discount?: number;
      tax_rate?: number;
    }[];
  }): Promise<any> {
    return api.post<any>('/sales-orders', data);
  }

  public async fulfill(id: string): Promise<any> {
    return api.post<any>(`/sales-orders/${id}/fulfill`);
  }

  public async void(id: string, reason?: string): Promise<any> {
    return api.post<any>(`/sales-orders/${id}/void`, { reason });
  }

  public async settle(
    id: string,
    data: {
      amount: number;
      payment_mode?: string;
      reference_number?: string;
      notes?: string;
    }
  ): Promise<any> {
    return api.post<any>(`/sales-orders/${id}/settle`, data);
  }
}

export const salesOrderService = new SalesOrderService();
