import type { YaazhiProduct, StockStatus } from './product';

export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'TRANSFER';

export type AdjustmentReasonCode =
  | 'audit'
  | 'damage'
  | 'loss'
  | 'miscount'
  | 'return'
  | 'AUDIT'
  | 'DAMAGED'
  | 'EXPIRED'
  | 'DISCREPANCY'
  | 'OTHER'
  | string;

export interface BoutiqueLocation {
  id: string;
  name: string;
  code: string;
  type?: 'SHOWROOM' | 'VAULT' | 'STORE_ROOM' | 'WORKSHOP' | string;
  address?: string;
  isDefault: boolean;
}

export interface StockMovement {
  id: string;
  timestamp: string;
  productId: string;
  sku: string;
  productName: string;
  movementType: MovementType;
  quantity: number; // positive number; sign derived by movementType
  locationId: string;
  locationName: string;
  targetLocationId?: string;
  targetLocationName?: string;
  referenceType: 'PO' | 'BILL' | 'ADJUST' | 'TRANSFER' | 'INITIAL';
  referenceId: string;
  reasonCode?: AdjustmentReasonCode;
  notes?: string;
  performedBy: string;
  unitCost: number;
  runningBalance: number;
}

export interface StockAdjustmentInput {
  productId: string;
  locationId: string;
  newStock: number;
  reasonCode: AdjustmentReasonCode;
  notes: string;
  performedBy: string;
}

export interface StockSummary {
  totalSkus: number;
  totalSKUs?: number;
  totalUnits: number;
  lowStockCount: number;
  outOfStockCount: number;
  inventoryValuationCost: number;
  inventoryValuationRetail: number;
  totalValuationCost?: number;
  totalValuationRetail?: number;
}

export interface InventoryItemRow {
  product: YaazhiProduct;
  status: StockStatus;
  availableStock: number;
  reorderPoint: number;
  valuationCost: number;
  valuationRetail: number;
}
