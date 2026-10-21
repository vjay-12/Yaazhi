import { api } from './apiClient';
import type {
  MeasurementTemplate,
  MeasurementTemplateField,
  StitchingTemplate,
  StitchingAddon,
  TemplateFilterParams,
} from '../types/template';

class TemplateService {
  // ==========================================
  // CUSTOMER MEASUREMENT TEMPLATES
  // ==========================================

  public async getMeasurementTemplates(filters?: TemplateFilterParams): Promise<MeasurementTemplate[]> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'ALL') {
      params.append('category', filters.category);
    }
    if (filters?.garment_type && filters.garment_type !== 'ALL') {
      params.append('garment_type', filters.garment_type);
    }
    if (filters?.include_archived) {
      params.append('include_archived', 'true');
    }
    if (filters?.search?.trim()) {
      params.append('search', filters.search.trim());
    }

    const queryStr = params.toString();
    const endpoint = queryStr ? `/measurement-templates?${queryStr}` : '/measurement-templates';
    return api.get<MeasurementTemplate[]>(endpoint);
  }

  public async getMeasurementTemplate(id: string): Promise<MeasurementTemplate> {
    return api.get<MeasurementTemplate>(`/measurement-templates/${id}`);
  }

  public async createMeasurementTemplate(data: {
    name: string;
    garment_type?: string;
    category?: string;
    description?: string;
    fields?: Array<Partial<MeasurementTemplateField>>;
  }): Promise<MeasurementTemplate> {
    return api.post<MeasurementTemplate>('/measurement-templates', data);
  }

  public async updateMeasurementTemplate(
    id: string,
    data: {
      name?: string;
      garment_type?: string;
      category?: string;
      description?: string | null;
      fields?: Array<Partial<MeasurementTemplateField>>;
    }
  ): Promise<MeasurementTemplate> {
    return api.put<MeasurementTemplate>(`/measurement-templates/${id}`, data);
  }

  public async duplicateMeasurementTemplate(id: string): Promise<MeasurementTemplate> {
    return api.post<MeasurementTemplate>(`/measurement-templates/${id}/duplicate`, {});
  }

  public async archiveMeasurementTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>(`/measurement-templates/${id}/archive`, {});
  }

  public async restoreMeasurementTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>(`/measurement-templates/${id}/restore`, {});
  }

  public async deleteMeasurementTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(`/measurement-templates/${id}`);
  }

  public async reorderMeasurementFields(templateId: string, fieldIds: string[]): Promise<MeasurementTemplate> {
    return api.put<MeasurementTemplate>(`/measurement-templates/${templateId}/reorder-fields`, { fieldIds });
  }

  public async addMeasurementField(
    templateId: string,
    field: Partial<MeasurementTemplateField>
  ): Promise<MeasurementTemplateField> {
    return api.post<MeasurementTemplateField>(`/measurement-templates/${templateId}/fields`, field);
  }

  public async updateMeasurementField(
    templateId: string,
    fieldId: string,
    updates: Partial<MeasurementTemplateField>
  ): Promise<MeasurementTemplateField> {
    return api.put<MeasurementTemplateField>(`/measurement-templates/${templateId}/fields/${fieldId}`, updates);
  }

  public async removeMeasurementField(templateId: string, fieldId: string): Promise<boolean> {
    await api.delete(`/measurement-templates/${templateId}/fields/${fieldId}`);
    return true;
  }

  // ==========================================
  // STITCHING PRICE TEMPLATES
  // ==========================================

  public async getStitchingTemplates(filters?: TemplateFilterParams): Promise<StitchingTemplate[]> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'ALL') {
      params.append('category', filters.category);
    }
    if (filters?.garment_type && filters.garment_type !== 'ALL') {
      params.append('garment_type', filters.garment_type);
    }
    if (filters?.include_archived) {
      params.append('include_archived', 'true');
    }
    if (filters?.search?.trim()) {
      params.append('search', filters.search.trim());
    }

    const queryStr = params.toString();
    const endpoint = queryStr ? `/stitching-templates?${queryStr}` : '/stitching-templates';
    return api.get<StitchingTemplate[]>(endpoint);
  }

  public async getStitchingTemplate(id: string): Promise<StitchingTemplate> {
    return api.get<StitchingTemplate>(`/stitching-templates/${id}`);
  }

  public async createStitchingTemplate(data: {
    name: string;
    garment_type: string;
    category?: string;
    description?: string;
    base_price: number | string;
    tax_rate?: number | string;
    hsn_code?: string;
    addons?: Array<Partial<StitchingAddon>>;
  }): Promise<StitchingTemplate> {
    return api.post<StitchingTemplate>('/stitching-templates', data);
  }

  public async updateStitchingTemplate(
    id: string,
    data: {
      name?: string;
      garment_type?: string;
      category?: string;
      description?: string | null;
      base_price?: number | string;
      tax_rate?: number | string;
      hsn_code?: string | null;
      addons?: Array<Partial<StitchingAddon>>;
    }
  ): Promise<StitchingTemplate> {
    return api.put<StitchingTemplate>(`/stitching-templates/${id}`, data);
  }

  public async duplicateStitchingTemplate(id: string): Promise<StitchingTemplate> {
    return api.post<StitchingTemplate>(`/stitching-templates/${id}/duplicate`, {});
  }

  public async archiveStitchingTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>(`/stitching-templates/${id}/archive`, {});
  }

  public async restoreStitchingTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return api.post<{ success: boolean; message: string }>(`/stitching-templates/${id}/restore`, {});
  }

  public async deleteStitchingTemplate(id: string): Promise<{ success: boolean; message: string }> {
    return api.delete<{ success: boolean; message: string }>(`/stitching-templates/${id}`);
  }

  public async addStitchingAddon(
    templateId: string,
    addon: Partial<StitchingAddon>
  ): Promise<StitchingAddon> {
    return api.post<StitchingAddon>(`/stitching-templates/${templateId}/addons`, addon);
  }

  public async updateStitchingAddon(
    templateId: string,
    addonId: string,
    updates: Partial<StitchingAddon>
  ): Promise<StitchingAddon> {
    return api.put<StitchingAddon>(`/stitching-templates/${templateId}/addons/${addonId}`, updates);
  }

  public async removeStitchingAddon(templateId: string, addonId: string): Promise<boolean> {
    await api.delete(`/stitching-templates/${templateId}/addons/${addonId}`);
    return true;
  }
}

export const templateService = new TemplateService();
