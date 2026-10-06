import { api } from './apiClient';

export interface VendorPOItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitCost: number;
  taxRate: number;
  total: number;
}

export interface VendorPOHistoryItem {
  id: string;
  poNumber: string;
  orderDate: string;
  date: string;
  totalAmount: number;
  subtotal: number;
  taxTotal: number;
  status: 'DRAFT' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  itemsCount: number;
  location: string;
  items: VendorPOItem[];
  notes?: string;
}

export interface VendorGRNHistoryItem {
  id: string;
  grnNumber: string;
  poNumber: string;
  poId: string;
  date: string;
  amount: number;
  status: 'RECEIVED';
  itemsCount: number;
  location: string;
}

export interface VendorPurchaseSummary {
  totalPurchaseValue: number;
  lastOrderDate: string | null;
  pendingPoCount: number;
  pendingPoValue: number;
  totalOrders: number;
}

export interface VendorData {
  id: string;
  name: string;
  contactPerson: string;
  category: string;
  vendorType: string;
  notes: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  stateCode: string;
  gstin: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  isActive?: boolean;
  isArchived?: boolean;
  activeOrders: number;
  totalOrders: number;
  totalPurchaseValue?: number;
  paymentTerms: string;
  createdAt: string;
  updatedAt?: string;
  summary?: VendorPurchaseSummary;
  poHistory?: VendorPOHistoryItem[];
  grnHistory?: VendorGRNHistoryItem[];
}

export interface CreateVendorInput {
  name: string;
  contactPerson?: string;
  category?: string;
  vendorType?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  stateCode?: string;
  gstin?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  notes?: string;
}

class SupplierService {
  public async list(search?: string, status: 'all' | 'active' | 'archived' = 'active'): Promise<VendorData[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status) params.append('status', status);
    const queryString = params.toString();
    const endpoint = queryString ? `/suppliers?${queryString}` : '/suppliers';
    return api.get<VendorData[]>(endpoint);
  }

  public async getById(id: string): Promise<VendorData> {
    return api.get<VendorData>(`/suppliers/${id}`);
  }

  public async create(data: CreateVendorInput): Promise<VendorData> {
    return api.post<VendorData>('/suppliers', data);
  }

  public async update(id: string, data: Partial<CreateVendorInput> & { isArchived?: boolean; isActive?: boolean }): Promise<VendorData> {
    return api.put<VendorData>(`/suppliers/${id}`, data);
  }

  public async archive(id: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>(`/suppliers/${id}/archive`);
  }

  public async restore(id: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>(`/suppliers/${id}/restore`);
  }

  public async delete(id: string): Promise<boolean> {
    await api.delete(`/suppliers/${id}`);
    return true;
  }
}

export const supplierService = new SupplierService();
