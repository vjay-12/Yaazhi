export type BoutiqueCategory =
  | 'Kanchipuram Silk'
  | 'Cotton Handloom'
  | 'Banarasi Silk'
  | 'Designer Chudidar'
  | 'Anarkali Set'
  | 'Kurtis & Tunics'
  | 'Designer Blouse'
  | 'Ethnic Menswear'
  | 'Kids Ethnic'
  | 'Dupattas & Shawls'
  | 'Fabrics & Unstitched'
  | 'Accessories'
  | 'Churidars & Salwars'
  | 'Sarees'
  | 'Dupattas & Stoles';

export type UnitOfMeasure = 'pcs' | 'meters' | 'sets' | 'pairs' | 'box';

export type ProductLifecycleStatus = 'ACTIVE' | 'ARCHIVED';
export type ProductLifecycleFilter = 'ACTIVE' | 'ARCHIVED' | 'ALL';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
export type StockStatusFilter = 'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface ProductVariant {
  id: string;
  sku: string;
  barcode: string;
  color: string;
  size?: string;
  fabric?: string;
  additionalPrice: number;
  stock: number;
  isActive: boolean;
}

export interface YaazhiProduct {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: BoutiqueCategory;
  fabric?: string;
  craft?: string; // e.g., 'Handloom', 'Pure Zari', 'Kalamkari', 'Aari Work', 'Bandhani', 'Chanderi'
  description?: string;
  costPrice: number;
  sellPrice: number;
  salePrice?: number;
  mrp?: number;
  currentStock: number;
  reorderPoint: number;
  maxStock?: number;
  unitOfMeasure: UnitOfMeasure;
  hsnCode: string;
  gstRate: number; // 0, 5, 12, 18, 28
  taxRate?: number;
  imageUrl?: string | null;
  locationStock: Record<string, number>;
  variants: ProductVariant[];
  tags: string[];
  isActive: boolean;
  isArchived: boolean;
  status: ProductLifecycleStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateProductInput {
  name: string;
  sku: string;
  barcode?: string;
  category: BoutiqueCategory;
  fabric?: string;
  craft?: string;
  description?: string;
  costPrice: number;
  sellPrice: number;
  salePrice?: number;
  mrp?: number;
  openingStock: number;
  reorderPoint: number;
  maxStock?: number;
  unitOfMeasure: UnitOfMeasure;
  hsnCode: string;
  gstRate: number;
  taxRate?: number;
  imageUrl?: string | null;
  variants?: Omit<ProductVariant, 'id'>[];
  tags?: string[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  isActive?: boolean;
}

export interface ProductFilterOptions {
  search?: string;
  category?: BoutiqueCategory | 'ALL' | string;
  lifecycle?: ProductLifecycleFilter;
  stockStatus?: StockStatusFilter | StockStatus | 'ARCHIVED' | 'ALL';
  fabric?: string;
  sortBy?: 'name' | 'sellPrice' | 'currentStock' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
