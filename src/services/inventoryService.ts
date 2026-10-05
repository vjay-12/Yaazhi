import type {
  StockMovement,
  StockAdjustmentInput,
  StockSummary,
  BoutiqueLocation,
} from '../types/inventory';
import type { YaazhiProduct } from '../types/product';
import { INITIAL_LOCATIONS, INITIAL_MOVEMENTS } from '../mocks/seedData';
import { productService } from './productService';

const STORAGE_KEY_MOVEMENTS = 'yaazhi_movements_v1';
const STORAGE_KEY_LOCATIONS = 'yaazhi_locations_v1';

class InventoryService {
  private getStoredMovements(): StockMovement[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MOVEMENTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read movements from localStorage, using initial movements', e);
    }
    this.saveMovements(INITIAL_MOVEMENTS);
    return INITIAL_MOVEMENTS;
  }

  private saveMovements(movements: StockMovement[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(movements));
    } catch (e) {
      console.warn('Failed to save movements to localStorage', e);
    }
  }

  public async getLocations(): Promise<BoutiqueLocation[]> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LOCATIONS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Could not read locations', e);
    }
    return INITIAL_LOCATIONS;
  }

  public async getMovements(productId?: string): Promise<StockMovement[]> {
    const movements = this.getStoredMovements();
    if (productId) {
      return movements.filter((m) => m.productId === productId);
    }
    return movements.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public async adjustStock(input: StockAdjustmentInput): Promise<StockMovement> {
    const product = await productService.getById(input.productId);
    if (!product) {
      throw new Error(`Product with ID ${input.productId} not found.`);
    }

    const locations = await this.getLocations();
    const loc = locations.find((l) => l.id === input.locationId) || locations[0];

    const prevLocationStock = product.locationStock[loc.id] || 0;
    const delta = input.newStock - prevLocationStock;

    if (delta === 0) {
      throw new Error('New stock count is identical to existing recorded stock.');
    }

    const newCurrentStock = Math.max(0, product.currentStock + delta);
    const updatedLocationStock = {
      ...product.locationStock,
      [loc.id]: Math.max(0, input.newStock),
    };

    // Update product stock
    await productService.update(product.id, {
      currentStock: newCurrentStock,
      locationStock: updatedLocationStock,
    } as any);

    // Record audit movement
    const movement: StockMovement = {
      id: `mov-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      movementType: 'ADJUST',
      quantity: Math.abs(delta),
      locationId: loc.id,
      locationName: loc.name,
      referenceType: 'ADJUST',
      referenceId: `ADJ-${Date.now().toString().slice(-6)}`,
      reasonCode: input.reasonCode,
      notes: input.notes.trim(),
      performedBy: input.performedBy || 'Store Manager',
      unitCost: product.costPrice,
      runningBalance: newCurrentStock,
    };

    const movements = this.getStoredMovements();
    movements.unshift(movement);
    this.saveMovements(movements);

    return movement;
  }

  public async getStockSummary(): Promise<StockSummary> {
    const products: YaazhiProduct[] = await productService.list();

    let totalSkus = products.length;
    let totalUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inventoryValuationCost = 0;
    let inventoryValuationRetail = 0;

    for (const p of products) {
      const stock = p.currentStock || 0;
      totalUnits += stock;
      inventoryValuationCost += stock * p.costPrice;
      inventoryValuationRetail += stock * p.sellPrice;

      if (stock <= 0) {
        outOfStockCount++;
      } else if (stock <= p.reorderPoint) {
        lowStockCount++;
      }
    }

    return {
      totalSkus,
      totalUnits,
      lowStockCount,
      outOfStockCount,
      inventoryValuationCost,
      inventoryValuationRetail,
    };
  }
}

export const inventoryService = new InventoryService();
