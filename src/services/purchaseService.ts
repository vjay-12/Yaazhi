import { api } from './apiClient';

export interface PurchaseOrderItemData {
  id?: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  taxRate?: number;
  total?: number;
}

export type PurchaseOrderStatus = 'ORDERED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderData {
  id: string;
  poNumber: string;
  vendorName: string;
  vendorId?: string;
  date: string;
  itemsCount: number;
  totalAmount: number;
  subtotal?: number;
  taxTotal?: number;
  status: PurchaseOrderStatus;
  location: string;
  godownId?: string;
  supplierPhone?: string;
  supplierAddress?: string;
  supplierGstin?: string;
  itemsSummary: string;
  notes?: string;
  items: PurchaseOrderItemData[];
  createdAt: string;
}

class PurchaseService {
  public async list(): Promise<PurchaseOrderData[]> {
    return api.get<PurchaseOrderData[]>('/purchase-orders');
  }

  public async getById(id: string): Promise<any> {
    return api.get<any>(`/purchase-orders/${id}`);
  }

  public async create(data: {
    supplier_id?: string;
    supplier_name?: string;
    godown_id?: string;
    order_date?: string;
    notes?: string;
    items: {
      product_id: string;
      quantity: number;
      unit_cost: number;
      tax_rate?: number;
    }[];
  }): Promise<any> {
    return api.post<any>('/purchase-orders', data);
  }

  public async receive(id: string, notes?: string): Promise<any> {
    return api.post<any>(`/purchase-orders/${id}/receive`, { notes });
  }

  public async cancel(id: string, reason?: string): Promise<any> {
    return api.post<any>(`/purchase-orders/${id}/cancel`, { reason });
  }
}

export const purchaseService = new PurchaseService();
