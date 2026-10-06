import { api } from './apiClient';

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
  activeOrders: number;
  totalOrders: number;
  paymentTerms: string;
  createdAt: string;
}

class SupplierService {
  public async list(search?: string): Promise<VendorData[]> {
    const endpoint = search ? `/suppliers?search=${encodeURIComponent(search)}` : '/suppliers';
    return api.get<VendorData[]>(endpoint);
  }

  public async getById(id: string): Promise<any> {
    return api.get<any>(`/suppliers/${id}`);
  }

  public async create(data: {
    name: string;
    contactPerson?: string;
    category?: string;
    vendorType?: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    gstin?: string;
    notes?: string;
  }): Promise<VendorData> {
    return api.post<VendorData>('/suppliers', data);
  }

  public async update(id: string, data: any): Promise<VendorData> {
    return api.put<VendorData>(`/suppliers/${id}`, data);
  }

  public async delete(id: string): Promise<boolean> {
    await api.delete(`/suppliers/${id}`);
    return true;
  }
}

export const supplierService = new SupplierService();
