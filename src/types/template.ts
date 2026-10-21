export type GarmentType =
  | 'Blouse'
  | 'Chudidar'
  | 'Kurti'
  | 'Shirt'
  | 'Trousers'
  | 'Lehenga'
  | 'Gown'
  | 'Other';

export type MeasurementFieldType = 'number' | 'text' | 'dropdown' | 'tailor_instruction';

export interface MeasurementTemplateField {
  id?: string;
  template_id?: string;
  field_key: string;
  field_name: string;
  field_type: MeasurementFieldType;
  default_unit: string;
  display_order: number;
  is_required: boolean;
  options?: string | null;
  validation_rules?: string | null;
  is_active?: boolean;
}

export interface MeasurementTemplate {
  id: string;
  name: string;
  code: string;
  garment_type?: GarmentType | string | null;
  description?: string | null;
  category: string;
  is_default: boolean;
  is_active: boolean;
  is_archived?: boolean;
  archived_at?: string | null;
  fields: MeasurementTemplateField[];
  _count?: {
    profiles?: number;
  };
  created_at?: string;
  updated_at?: string;
}

export interface StitchingAddon {
  id?: string;
  template_id?: string;
  name: string;
  description?: string | null;
  price: number | string;
  is_default_selected: boolean;
  display_order: number;
  is_active?: boolean;
}

export interface StitchingTemplate {
  id: string;
  name: string;
  code: string;
  garment_type: GarmentType | string;
  category: string;
  description?: string | null;
  base_price: number | string;
  tax_rate: number | string;
  hsn_code?: string | null;
  is_default: boolean;
  is_active: boolean;
  is_archived?: boolean;
  archived_at?: string | null;
  addons: StitchingAddon[];
  created_at?: string;
  updated_at?: string;
}

export interface TemplateFilterParams {
  category?: string;
  garment_type?: string;
  include_archived?: boolean;
  search?: string;
}
