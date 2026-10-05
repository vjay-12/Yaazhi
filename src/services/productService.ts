import type {
  YaazhiProduct,
  CreateProductInput,
  UpdateProductInput,
  ProductFilterOptions,
  StockStatus,
} from '../types/product';
import { INITIAL_PRODUCTS } from '../mocks/seedData';

const STORAGE_KEY_PRODUCTS = 'yaazhi_products_v1';

class ProductService {
  private getStoredProducts(): YaazhiProduct[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PRODUCTS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Could not read products from localStorage, using seed data', e);
    }
    this.saveProducts(INITIAL_PRODUCTS);
    return INITIAL_PRODUCTS;
  }

  private saveProducts(products: YaazhiProduct[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(products));
    } catch (e) {
      console.warn('Failed to save products to localStorage', e);
    }
  }

  public getStockStatus(product: YaazhiProduct): StockStatus {
    if (product.currentStock <= 0) return 'OUT_OF_STOCK';
    if (product.currentStock <= product.reorderPoint) return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  public async list(filters?: ProductFilterOptions): Promise<YaazhiProduct[]> {
    let products = this.getStoredProducts();

    if (filters) {
      if (filters.search && filters.search.trim() !== '') {
        const query = filters.search.toLowerCase().trim();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            p.sku.toLowerCase().includes(query) ||
            p.barcode.includes(query) ||
            p.category.toLowerCase().includes(query) ||
            (p.fabric && p.fabric.toLowerCase().includes(query)) ||
            (p.craft && p.craft.toLowerCase().includes(query))
        );
      }

      if (filters.category && filters.category !== 'ALL') {
        products = products.filter((p) => p.category === filters.category);
      }

      if (filters.stockStatus && filters.stockStatus !== 'ALL') {
        products = products.filter((p) => this.getStockStatus(p) === filters.stockStatus);
      }

      if (filters.sortBy) {
        products = [...products].sort((a, b) => {
          let valA: any = a[filters.sortBy!];
          let valB: any = b[filters.sortBy!];
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
    const products = this.getStoredProducts();
    return products.find((p) => p.id === id) || null;
  }

  public async getByBarcodeOrSku(code: string): Promise<YaazhiProduct | null> {
    const clean = code.trim().toLowerCase();
    const products = this.getStoredProducts();
    return (
      products.find(
        (p) => p.barcode.toLowerCase() === clean || p.sku.toLowerCase() === clean
      ) || null
    );
  }

  public async create(input: CreateProductInput): Promise<YaazhiProduct> {
    const products = this.getStoredProducts();

    // Check SKU duplicate
    const existing = products.find(
      (p) => p.sku.toLowerCase() === input.sku.trim().toLowerCase()
    );
    if (existing) {
      throw new Error(`A product with SKU "${input.sku}" already exists.`);
    }

    const newProduct: YaazhiProduct = {
      id: `prod-${Date.now().toString(36)}`,
      name: input.name.trim(),
      sku: input.sku.trim().toUpperCase(),
      barcode: input.barcode?.trim() || `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      category: input.category,
      fabric: input.fabric?.trim(),
      craft: input.craft?.trim(),
      description: input.description?.trim(),
      costPrice: Number(input.costPrice),
      sellPrice: Number(input.sellPrice),
      mrp: input.mrp ? Number(input.mrp) : Number(input.sellPrice) * 1.1,
      currentStock: Number(input.openingStock || 0),
      reorderPoint: Number(input.reorderPoint || 3),
      maxStock: input.maxStock ? Number(input.maxStock) : undefined,
      unitOfMeasure: input.unitOfMeasure,
      hsnCode: input.hsnCode.trim(),
      gstRate: Number(input.gstRate),
      locationStock: {
        'loc-showroom': Number(input.openingStock || 0),
      },
      variants: (input.variants || []).map((v, i) => ({
        ...v,
        id: `var-${Date.now().toString(36)}-${i}`,
      })),
      tags: input.tags || [],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    products.unshift(newProduct);
    this.saveProducts(products);
    return newProduct;
  }

  public async update(id: string, input: UpdateProductInput): Promise<YaazhiProduct> {
    const products = this.getStoredProducts();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error(`Product with ID "${id}" not found.`);
    }

    // Check SKU uniqueness if changed
    if (input.sku && input.sku.trim().toLowerCase() !== products[index].sku.toLowerCase()) {
      const duplicate = products.find(
        (p) => p.sku.toLowerCase() === input.sku!.trim().toLowerCase() && p.id !== id
      );
      if (duplicate) {
        throw new Error(`A product with SKU "${input.sku}" already exists.`);
      }
    }

    const updated: YaazhiProduct = {
      ...products[index],
      ...input,
      variants: input.variants
        ? input.variants.map((v, i) => ({
            ...v,
            id: (v as any).id || `var-${Date.now().toString(36)}-${i}`,
          }))
        : products[index].variants,
      updatedAt: new Date().toISOString(),
    };

    products[index] = updated;
    this.saveProducts(products);
    return updated;
  }

  public async delete(id: string): Promise<void> {
    const products = this.getStoredProducts();
    const filtered = products.filter((p) => p.id !== id);
    this.saveProducts(filtered);
  }

  public async resetToSeedData(): Promise<void> {
    this.saveProducts(INITIAL_PRODUCTS);
  }
}

export const productService = new ProductService();
