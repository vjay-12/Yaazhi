import { api } from './apiClient';
import type {
  YaazhiProduct,
  CreateProductInput,
  UpdateProductInput,
  ProductFilterOptions,
  StockStatus,
} from '../types/product';

class ProductService {
  public getStockStatus(product: YaazhiProduct): StockStatus | 'ARCHIVED' {
    if (product.isArchived || !product.isActive) return 'ARCHIVED';
    if (product.currentStock <= 0) return 'OUT_OF_STOCK';
    if (product.currentStock <= product.reorderPoint) return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  public async list(filters?: ProductFilterOptions): Promise<YaazhiProduct[]> {
    const data = await api.get<any[]>('/products?status=all');

    let products: YaazhiProduct[] = data.map((p) => ({
      id: p.id,
      sku: p.sku,
      barcode: p.sku, // barcode generated from SKU
      name: p.name,
      description: p.description || '',
      fabric: p.fabric || 'Pure Silk',
      craft: p.craft || 'Handloom',
      category: p.category || 'Sarees',
      unitOfMeasure: p.unitOfMeasure || 'PCS',
      costPrice: p.purchasePrice ?? p.costPrice ?? 0,
      salePrice: p.salePrice ?? p.sellPrice ?? 0,
      sellPrice: p.salePrice ?? p.sellPrice ?? 0,
      taxRate: p.taxRate ?? p.gstRate ?? 5.0,
      gstRate: p.taxRate ?? p.gstRate ?? 5.0,
      hsnCode: p.hsnCode || '5007',
      currentStock: p.currentStock ?? p.totalStock ?? 0,
      reorderPoint: p.reorderPoint || 3,
      imageUrl: p.imageUrl || p.image_url || null,
      locationStock: p.locationStock || {},
      variants: [],
      tags: [],
      isActive: Boolean(p.isActive ?? p.is_active ?? true),
      isArchived: Boolean(p.isArchived ?? (p.is_active !== undefined ? !p.is_active : false)),
      createdAt: p.createdAt || new Date().toISOString(),
      updatedAt: p.updatedAt || new Date().toISOString(),
    }));

    if (filters) {
      if (filters.search && filters.search.trim() !== '') {
        const query = filters.search.toLowerCase().trim();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.sku.toLowerCase().includes(query) ||
            p.barcode.toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query) ||
            (p.fabric && p.fabric.toLowerCase().includes(query)) ||
            (p.craft && p.craft.toLowerCase().includes(query))
        );
      }

      if (filters.category && filters.category !== 'ALL') {
        const catFilter = filters.category.trim().toLowerCase();
        products = products.filter((p) => p.category?.trim().toLowerCase() === catFilter);
      }

      if (filters.stockStatus === 'ARCHIVED') {
        products = products.filter((p) => p.isArchived || !p.isActive);
      } else {
        // By default, exclude archived products from active stock views
        products = products.filter((p) => !p.isArchived && p.isActive !== false);

        if (filters.stockStatus && filters.stockStatus !== 'ALL') {
          products = products.filter((p) => this.getStockStatus(p) === filters.stockStatus);
        }
      }

      if (filters.sortBy) {
        products = [...products].sort((a, b) => {
          const valA: any = a[filters.sortBy!];
          const valB: any = b[filters.sortBy!];
          if (typeof valA === 'string') {
            return filters.sortOrder === 'desc'
              ? valB.localeCompare(valA)
              : valA.localeCompare(valB);
          }
          return filters.sortOrder === 'desc' ? valB - valA : valA - valB;
        });
      }
    }

    return products;
  }

  public async getById(id: string): Promise<YaazhiProduct | null> {
    try {
      const p = await api.get<any>(`/products/${id}`);
      return {
        id: p.id,
        sku: p.sku,
        barcode: p.sku,
        name: p.name,
        description: p.description || '',
        fabric: p.fabric || 'Pure Silk',
        craft: p.craft || 'Handloom',
        category: p.category || 'Sarees',
        unitOfMeasure: p.unit || 'PCS',
        costPrice: p.purchasePrice || 0,
        salePrice: p.salePrice || 0,
        sellPrice: p.salePrice || 0,
        taxRate: p.taxRate || 5.0,
        gstRate: p.taxRate || 5.0,
        hsnCode: p.hsnCode || '5007',
        currentStock: p.currentStock ?? p.totalStock ?? 0,
        reorderPoint: p.reorderPoint || 3,
        imageUrl: p.imageUrl || p.image_url || null,
        locationStock: p.locationStock || {},
        variants: [],
        tags: [],
        isActive: true,
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.createdAt || new Date().toISOString(),
      };
    } catch {
      return null;
    }
  }

  public async getByBarcodeOrSku(code: string): Promise<YaazhiProduct | null> {
    const products = await this.list();
    const clean = code.trim().toLowerCase();
    return (
      products.find(
        (p) => p.barcode.toLowerCase() === clean || p.sku.toLowerCase() === clean
      ) || null
    );
  }

  public async create(input: CreateProductInput | any): Promise<YaazhiProduct> {
    const salePrice = input.salePrice !== undefined ? input.salePrice : input.sellPrice || 0;
    const initialStock = input.initialStock !== undefined ? input.initialStock : input.openingStock || 0;
    const taxRate = input.taxRate !== undefined ? input.taxRate : input.gstRate || 5.0;

    const created = await api.post<any>('/products', {
      sku: input.sku,
      name: input.name,
      description: input.description,
      fabric: input.fabric,
      craft: input.craft,
      category: input.category,
      unit: input.unitOfMeasure || 'PCS',
      sale_price: salePrice,
      purchase_price: input.costPrice || 0,
      hsn_code: input.hsnCode,
      tax_rate: taxRate,
      min_stock_level: input.reorderPoint || 3,
      initial_stock: initialStock,
      godown_id: input.locationId,
      image_url: input.imageUrl,
    });

    return {
      id: created.id,
      sku: created.sku,
      barcode: created.sku,
      name: created.name,
      description: created.description || '',
      fabric: created.fabric || '',
      craft: created.craft || '',
      category: created.category || 'General',
      unitOfMeasure: created.unit || 'PCS',
      costPrice: created.purchasePrice || 0,
      salePrice: created.salePrice || 0,
      sellPrice: created.salePrice || 0,
      taxRate: created.taxRate || 5.0,
      gstRate: created.taxRate || 5.0,
      hsnCode: created.hsnCode || '',
      currentStock: created.currentStock || 0,
      reorderPoint: created.reorderPoint || 3,
      imageUrl: created.imageUrl || input.imageUrl || null,
      locationStock: {},
      variants: [],
      tags: [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  public async update(id: string, input: UpdateProductInput | any): Promise<YaazhiProduct> {
    const salePrice = input.salePrice !== undefined ? input.salePrice : input.sellPrice;
    const taxRate = input.taxRate !== undefined ? input.taxRate : input.gstRate;

    await api.put<any>(`/products/${id}`, {
      name: input.name,
      description: input.description,
      fabric: input.fabric,
      craft: input.craft,
      category: input.category,
      unit: input.unitOfMeasure,
      sale_price: salePrice,
      purchase_price: input.costPrice,
      hsn_code: input.hsnCode,
      tax_rate: taxRate,
      min_stock_level: input.reorderPoint,
      image_url: input.imageUrl,
    });

    return this.getById(id) as Promise<YaazhiProduct>;
  }

  public async archive(id: string): Promise<boolean> {
    await api.post(`/products/${id}/archive`);
    return true;
  }

  public async unarchive(id: string): Promise<boolean> {
    await api.post(`/products/${id}/unarchive`);
    return true;
  }

  public async delete(id: string): Promise<boolean> {
    return this.archive(id);
  }

  public async getCategories(): Promise<string[]> {
    try {
      const cats = await api.get<any[]>('/products/categories');
      return cats.map((c) => c.name);
    } catch {
      return ['Sarees', 'Churidars & Salwars', 'Kurtis & Tunics', 'Dupattas & Stoles', 'Blouses & Corsets'];
    }
  }

  public async createCategory(name: string): Promise<string> {
    const cat = await api.post<any>('/products/categories', { name });
    return cat.name;
  }
}

export const productService = new ProductService();
