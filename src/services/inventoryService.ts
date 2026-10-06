import { api } from './apiClient';
import type {
  StockMovement,
  StockAdjustmentInput,
  StockSummary,
  BoutiqueLocation,
} from '../types/inventory';
import { productService } from './productService';

class InventoryService {
  public async getLocations(): Promise<BoutiqueLocation[]> {
    try {
      const data = await api.get<any[]>('/godowns');
      return data.map((g) => ({
        id: g.id,
        name: g.name,
        code: g.code,
        type: g.type || 'SHOWROOM',
        address: g.address || '',
        isDefault: g.isDefault,
      }));
    } catch {
      return [
        { id: 'sr-01', name: 'Main Showroom Counter', code: 'SR-01', type: 'SHOWROOM', address: 'Ground Floor', isDefault: true },
        { id: 'sv-02', name: 'Silk Vault & Bridal Salon', code: 'SV-02', type: 'VAULT', address: '1st Floor', isDefault: false },
      ];
    }
  }

  public async getMovements(productId?: string): Promise<StockMovement[]> {
    const endpoint = productId ? `/movements?search=${productId}` : '/movements';
    const data = await api.get<any[]>(endpoint);

    return data.map((m) => ({
      id: m.id,
      timestamp: m.createdAt || m.timestamp,
      productId: m.productId,
      sku: m.sku,
      productName: m.productName,
      movementType: m.type as any, // 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER'
      quantity: Math.abs(m.qtyChange),
      locationId: m.locationCode,
      locationName: m.location,
      referenceType: m.referenceType,
      referenceId: m.reference,
      reasonCode: 'AUDIT',
      notes: m.notes,
      performedBy: m.performedBy,
      unitCost: 0,
      runningBalance: m.balanceAfter,
    }));
  }

  public async adjustStock(input: StockAdjustmentInput): Promise<StockMovement> {
    const res = await api.post<any>('/adjustments', {
      product_id: input.productId,
      godown_id: input.locationId,
      new_stock: input.newStock,
      reason: input.reasonCode,
      notes: input.notes,
    });

    const movements = await this.getMovements(input.productId);
    return movements[0] || {
      id: res.adjustmentNumber,
      timestamp: new Date().toISOString(),
      productId: input.productId,
      sku: '',
      productName: '',
      movementType: 'ADJUST',
      quantity: 1,
      locationId: input.locationId,
      locationName: '',
      referenceType: 'ADJUST',
      referenceId: res.adjustmentNumber,
      reasonCode: input.reasonCode,
      notes: input.notes,
      performedBy: input.performedBy || 'Store Manager',
      unitCost: 0,
      runningBalance: res.newStock,
    };
  }

  public async getStockSummary(): Promise<StockSummary> {
    try {
      const data = await api.get<any>('/reports/dashboard');
      const sum = data.summary;
      return {
        totalSkus: sum.totalProducts,
        totalSKUs: sum.totalProducts,
        totalUnits: sum.totalStockUnits,
        inventoryValuationCost: sum.valuationCost,
        inventoryValuationRetail: sum.valuationRetail,
        totalValuationCost: sum.valuationCost,
        totalValuationRetail: sum.valuationRetail,
        lowStockCount: sum.lowStockCount,
        outOfStockCount: sum.outOfStockCount,
      };
    } catch {
      const products = await productService.list();
      let totalUnits = 0;
      let totalValuationCost = 0;
      let totalValuationRetail = 0;
      let lowStockCount = 0;
      let outOfStockCount = 0;

      products.forEach((p) => {
        const retailPrice = p.salePrice ?? p.sellPrice ?? 0;
        totalUnits += p.currentStock;
        totalValuationCost += p.currentStock * p.costPrice;
        totalValuationRetail += p.currentStock * retailPrice;
        if (p.currentStock <= 0) outOfStockCount++;
        else if (p.currentStock <= p.reorderPoint) lowStockCount++;
      });

      return {
        totalSkus: products.length,
        totalSKUs: products.length,
        totalUnits,
        inventoryValuationCost: totalValuationCost,
        inventoryValuationRetail: totalValuationRetail,
        totalValuationCost,
        totalValuationRetail,
        lowStockCount,
        outOfStockCount,
      };
    }
  }

  public async getValuationBreakdown(): Promise<
    { category: string; units: number; costValue: number; retailValue: number }[]
  > {
    const products = await productService.list();
    const map = new Map<
      string,
      { category: string; units: number; costValue: number; retailValue: number }
    >();

    products.forEach((p) => {
      const cat = p.category || 'General';
      const retailPrice = p.salePrice ?? p.sellPrice ?? 0;
      const existing = map.get(cat) || {
        category: cat,
        units: 0,
        costValue: 0,
        retailValue: 0,
      };
      existing.units += p.currentStock;
      existing.costValue += p.currentStock * p.costPrice;
      existing.retailValue += p.currentStock * retailPrice;
      map.set(cat, existing);
    });

    return Array.from(map.values());
  }
}

export const inventoryService = new InventoryService();
