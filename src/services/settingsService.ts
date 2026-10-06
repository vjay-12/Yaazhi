import { api } from './apiClient';

export interface BoutiqueSettings {
  id: string;
  company_name: string;
  legal_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  state_code?: string;
  gstin?: string;
  enable_gst: boolean;
}

class SettingsService {
  public async getSettings(): Promise<BoutiqueSettings> {
    return api.get<BoutiqueSettings>('/settings');
  }

  public async updateSettings(data: Partial<BoutiqueSettings>): Promise<BoutiqueSettings> {
    return api.put<BoutiqueSettings>('/settings', data);
  }
}

export const settingsService = new SettingsService();
