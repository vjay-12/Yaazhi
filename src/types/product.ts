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
  | 'Accessories';

export type UnitOfMeasure = 'pcs' | 'meters' | 'sets' | 'pairs' | 'box';

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

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
  mrp?: number;
  currentStock: number;
  reorderPoint: number;
  maxStock?: number;
  unitOfMeasure: UnitOfMeasure;
  hsnCode: string;
  gstRate: number; // 0, 5, 12, 18, 28
  locationStock: Record<string, number>;
  variants: ProductVariant[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
  mrp?: number;
  openingStock: number;
  reorderPoint: number;
  maxStock?: number;
  unitOfMeasure: UnitOfMeasure;
  hsnCode: string;
  gstRate: number;
  variants?: Omit<ProductVariant, 'id'>[];
  tags?: string[];
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  isActive?: boolean;
}

export interface ProductFilterOptions {
  search?: string;
  category?: BoutiqueCategory | 'ALL';
  stockStatus?: StockStatus | 'ALL';
  fabric?: string;
  sortBy?: 'name' | 'sellPrice' | 'currentStock' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
