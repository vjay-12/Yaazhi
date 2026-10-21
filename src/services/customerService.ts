import { api } from './apiClient';
import type { MeasurementTemplate, MeasurementTemplateField } from '../types/template';
export type { MeasurementTemplate, MeasurementTemplateField };

export interface CustomerMeasurementValue {
  id?: string;
  field_id: string;
  field_key?: string;
  field_name?: string;
  field_type?: 'number' | 'text' | 'dropdown' | 'tailor_instruction' | string;
  numeric_value?: number | null;
  num_value?: number | null;
  text_value?: string | null;
  unit: 'in' | 'cm' | string;
  notes?: string | null;
  display_order?: number;
  options?: string[] | null;
  validation_rules?: { min?: number; max?: number; step?: number } | null;
}

export interface CustomerMeasurementVersion {
  id: string;
  profile_id: string;
  version_number: number;
  measured_at: string;
  measured_by?: string | null;
  notes?: string | null;
  fitting_preferences?: string | null;
  tailor_instructions?: string | null;
  order_id?: string | null;
  order_number?: string | null;
  field_snapshots?: any[] | null;
  is_current: boolean;
  created_at: string;
  values: CustomerMeasurementValue[];
}

export interface CustomerMeasurementProfile {
  id: string;
  customer_id: string;
  template_id: string;
  template_name?: string;
  template_code?: string;
  garment_type?: string;
  profile_name: string;
  notes?: string | null;
  is_active: boolean;
  total_versions?: number;
  created_at: string;
  updated_at: string;
  template_fields?: MeasurementTemplateField[];
  template?: MeasurementTemplate;
  current_version?: CustomerMeasurementVersion | null;
  versions?: CustomerMeasurementVersion[];
}

export interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  billingAddress?: string;
  shippingAddress?: string;
  city: string;
  stateCode: string;
  gstin: string;
  notes: string;
  totalSpend: number;
  visitsCount: number;
  lastVisit: string;
  fittingProfile: string;
  measurementProfilesCount?: number;
  measurements: { label: string; value: string }[];
  isArchived?: boolean;
  archivedAt?: string | null;
  archivedBy?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomerDetailData extends CustomerData {
  sales_orders?: any[];
  measurement_profiles?: CustomerMeasurementProfile[];
  totalOrders?: number;
  totalSpent?: number;
}

class CustomerService {
  // --- Customers CRUD ---
  public async list(search?: string, status?: 'all' | 'active' | 'archived'): Promise<CustomerData[]> {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status && status !== 'all') params.set('status', status);
    const queryString = params.toString();
    const endpoint = queryString ? `/customers?${queryString}` : '/customers';
    return api.get<CustomerData[]>(endpoint);
  }

  public async getById(id: string): Promise<CustomerDetailData> {
    return api.get<CustomerDetailData>(`/customers/${id}`);
  }

  public async create(data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    shipping_address?: string;
    city?: string;
    state_code?: string;
    gstin?: string;
    notes?: string;
  }): Promise<CustomerData> {
    return api.post<CustomerData>('/customers', data);
  }

  public async update(id: string, data: Partial<{
    name: string;
    phone: string;
    email: string;
    address: string;
    shipping_address: string;
    city: string;
    state_code: string;
    gstin: string;
    notes: string;
    is_archived: boolean;
  }>): Promise<CustomerData> {
    return api.put<CustomerData>(`/customers/${id}`, data);
  }

  public async archive(id: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>(`/customers/${id}/archive`, {});
  }

  public async unarchive(id: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>(`/customers/${id}/unarchive`, {});
  }

  public async delete(id: string): Promise<boolean> {
    await api.delete(`/customers/${id}`);
    return true;
  }

  // --- Measurement Templates ---
  public async getTemplates(category?: string): Promise<MeasurementTemplate[]> {
    const endpoint = category ? `/measurement-templates?category=${encodeURIComponent(category)}` : '/measurement-templates';
    return api.get<MeasurementTemplate[]>(endpoint);
  }

  public async getTemplate(id: string): Promise<MeasurementTemplate> {
    return api.get<MeasurementTemplate>(`/measurement-templates/${id}`);
  }

  public async createTemplate(data: {
    name: string;
    description?: string;
    category?: string;
    fields?: Array<{
      field_key?: string;
      field_name: string;
      field_type?: 'number' | 'text';
      default_unit?: 'in' | 'cm';
      display_order?: number;
      is_required?: boolean;
    }>;
  }): Promise<MeasurementTemplate> {
    return api.post<MeasurementTemplate>('/measurement-templates', data);
  }

  public async updateTemplate(id: string, data: {
    name?: string;
    description?: string;
    category?: string;
  }): Promise<MeasurementTemplate> {
    return api.put<MeasurementTemplate>(`/measurement-templates/${id}`, data);
  }

  public async addTemplateField(templateId: string, field: {
    field_key?: string;
    field_name: string;
    field_type?: 'number' | 'text';
    default_unit?: 'in' | 'cm';
    display_order?: number;
    is_required?: boolean;
  }): Promise<MeasurementTemplateField> {
    return api.post<MeasurementTemplateField>(`/measurement-templates/${templateId}/fields`, field);
  }

  public async updateTemplateField(templateId: string, fieldId: string, updates: Partial<MeasurementTemplateField>): Promise<MeasurementTemplateField> {
    return api.put<MeasurementTemplateField>(`/measurement-templates/${templateId}/fields/${fieldId}`, updates);
  }

  public async removeTemplateField(templateId: string, fieldId: string): Promise<boolean> {
    await api.delete(`/measurement-templates/${templateId}/fields/${fieldId}`);
    return true;
  }

  // --- Customer Measurement Profiles & History ---
  public async getMeasurementProfiles(customerId: string, filters?: { garment_type?: string; search?: string }): Promise<CustomerMeasurementProfile[]> {
    const params = new URLSearchParams();
    if (filters?.garment_type && filters.garment_type !== 'ALL') params.append('garment_type', filters.garment_type);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return api.get<CustomerMeasurementProfile[]>(`/customers/${customerId}/measurement-profiles${qs}`);
  }

  public async getMeasurementProfile(customerId: string, profileId: string): Promise<CustomerMeasurementProfile> {
    return api.get<CustomerMeasurementProfile>(`/customers/${customerId}/measurement-profiles/${profileId}`);
  }

  public async getMeasurementHistory(customerId: string, profileId: string): Promise<CustomerMeasurementVersion[]> {
    return api.get<CustomerMeasurementVersion[]>(`/customers/${customerId}/measurement-profiles/${profileId}/history`);
  }

  public async createMeasurementProfile(customerId: string, data: {
    template_id: string;
    profile_name: string;
    garment_type?: string;
    notes?: string;
    fitting_preferences?: string;
    tailor_instructions?: string;
    order_id?: string;
    measured_by?: string;
    measured_at?: string;
    values: Array<{
      field_id: string;
      numeric_value?: number | null;
      text_value?: string | null;
      unit?: string;
      notes?: string | null;
    }>;
  }): Promise<CustomerMeasurementProfile> {
    return api.post<CustomerMeasurementProfile>(`/customers/${customerId}/measurement-profiles`, data);
  }

  public async addMeasurementVersion(customerId: string, profileId: string, data: {
    notes?: string;
    fitting_preferences?: string;
    tailor_instructions?: string;
    order_id?: string;
    measured_by?: string;
    measured_at?: string;
    values: Array<{
      field_id: string;
      numeric_value?: number | null;
      text_value?: string | null;
      unit?: string;
      notes?: string | null;
    }>;
  }): Promise<{ version: CustomerMeasurementVersion; profile: CustomerMeasurementProfile }> {
    return api.post<{ version: CustomerMeasurementVersion; profile: CustomerMeasurementProfile }>(
      `/customers/${customerId}/measurement-profiles/${profileId}/versions`,
      data
    );
  }

  public async cloneMeasurementProfile(customerId: string, profileId: string, newProfileName?: string): Promise<CustomerMeasurementProfile> {
    return api.post<CustomerMeasurementProfile>(`/customers/${customerId}/measurement-profiles/${profileId}/clone`, {
      profile_name: newProfileName,
    });
  }

  public async updateMeasurementProfile(customerId: string, profileId: string, data: {
    profile_name?: string;
    garment_type?: string;
    notes?: string;
    fitting_preferences?: string;
    tailor_instructions?: string;
    measured_by?: string;
    order_id?: string;
    values?: any[];
  }): Promise<CustomerMeasurementProfile> {
    return api.put<CustomerMeasurementProfile>(`/customers/${customerId}/measurement-profiles/${profileId}`, data);
  }

  public async linkOrderToProfile(customerId: string, profileId: string, orderId: string, versionId?: string): Promise<CustomerMeasurementProfile> {
    return api.post<CustomerMeasurementProfile>(`/customers/${customerId}/measurement-profiles/${profileId}/link-order`, {
      order_id: orderId,
      version_id: versionId,
    });
  }

  public async deleteMeasurementProfile(customerId: string, profileId: string): Promise<boolean> {
    await api.delete(`/customers/${customerId}/measurement-profiles/${profileId}`);
    return true;
  }
}

export const customerService = new CustomerService();
