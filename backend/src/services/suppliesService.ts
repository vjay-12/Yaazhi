import { prisma } from '../db.js';
import { SupplyMovementType } from '@prisma/client';

export interface CreateSupplyInput {
  name: string;
  sku?: string;
  category?: string;
  unit?: string;
  min_stock_level?: number;
  unit_cost?: number;
  default_supplier_id?: string | null;
  initial_quantity?: number;
  notes?: string | null;
  created_by?: string;
}

export interface UpdateSupplyInput {
  name?: string;
  category?: string;
  unit?: string;
  min_stock_level?: number;
  unit_cost?: number;
  default_supplier_id?: string | null;
}

export interface RecordMovementInput {
  supply_id: string;
  movement_type: SupplyMovementType;
  quantity: number; // positive for receipt/add, negative for consumption/reduce
  unit_cost?: number;
  reference_type?: string;
  reference_id?: string | null;
  stitching_order_number?: string | null;
  notes?: string | null;
  created_by?: string;
}

export class SuppliesService {
  /**
   * Generates a unique SKU for a consumable supply item
   */
  static async generateSku(category: string): Promise<string> {
    const prefix = category
      .replace(/[^a-zA-Z]/g, '')
      .substring(0, 3)
      .toUpperCase() || 'SUP';
    const count = await prisma.supplyItem.count();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    return `SUP-${prefix}-${(count + 1).toString().padStart(4, '0')}-${randomSuffix}`;
  }

  /**
   * Lists all consumable supplies with filtering, search, and stock status
   */
  static async listSupplies(params: {
    category?: string;
    search?: string;
    status?: 'ACTIVE' | 'ARCHIVED' | 'ALL';
    low_stock_only?: boolean;
    supplier_id?: string;
  } = {}) {
    const { category, search, status = 'ACTIVE', low_stock_only, supplier_id } = params;

    const where: any = {};

    if (status === 'ACTIVE') {
      where.is_archived = false;
    } else if (status === 'ARCHIVED') {
      where.is_archived = true;
    }

    if (category && category !== 'ALL') {
      where.category = { equals: category, mode: 'insensitive' };
    }

    if (supplier_id && supplier_id !== 'ALL') {
      where.default_supplier_id = supplier_id;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
      ];
    }

    const items = await prisma.supplyItem.findMany({
      where,
      include: {
        default_supplier: {
          select: { id: true, name: true, phone: true, city: true },
        },
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    if (low_stock_only) {
      return items.filter((item) => Number(item.current_quantity) <= Number(item.min_stock_level));
    }

    return items;
  }

  /**
   * Retrieves single supply item with recent movements ledger
   */
  static async getSupply(id: string) {
    const item = await prisma.supplyItem.findUnique({
      where: { id },
      include: {
        default_supplier: true,
        movements: {
          orderBy: { created_at: 'desc' },
          take: 50,
        },
      },
    });

    if (!item) {
      throw new Error(`Supply item not found with id ${id}`);
    }

    return item;
  }

  /**
   * Creates a new consumable supply item and records initial stock movement if quantity > 0
   */
  static async createSupply(input: CreateSupplyInput) {
    const sku = input.sku && input.sku.trim()
      ? input.sku.trim().toUpperCase()
      : await this.generateSku(input.category || 'Buttons & Fasteners');

    const existing = await prisma.supplyItem.findUnique({ where: { sku } });
    if (existing) {
      throw new Error(`A supply item with SKU "${sku}" already exists`);
    }

    const initialQty = input.initial_quantity ? Math.max(0, Number(input.initial_quantity)) : 0;
    const unitCost = input.unit_cost ? Math.max(0, Number(input.unit_cost)) : 0;

    return prisma.$transaction(async (tx) => {
      const item = await tx.supplyItem.create({
        data: {
          name: input.name.trim(),
          sku,
          category: input.category || 'Buttons & Fasteners',
          unit: input.unit || 'PCS',
          current_quantity: initialQty,
          min_stock_level: input.min_stock_level ? Math.max(0, Number(input.min_stock_level)) : 0,
          unit_cost: unitCost,
          default_supplier_id: input.default_supplier_id || null,
          is_active: true,
          is_archived: false,
        },
        include: {
          default_supplier: true,
        },
      });

      if (initialQty > 0) {
        await tx.supplyMovement.create({
          data: {
            supply_id: item.id,
            movement_type: SupplyMovementType.ADJUSTMENT_ADD,
            quantity: initialQty,
            unit_cost: unitCost,
            balance_after: initialQty,
            reference_type: 'INITIAL_STOCK',
            reference_id: item.id,
            notes: input.notes || 'Opening inventory balance',
            created_by: input.created_by || 'Staff',
          },
        });
      }

      return item;
    });
  }

  /**
   * Updates supply item metadata
   */
  static async updateSupply(id: string, input: UpdateSupplyInput) {
    const existing = await prisma.supplyItem.findUnique({ where: { id } });
    if (!existing) {
      throw new Error(`Supply item not found with id ${id}`);
    }

    return prisma.supplyItem.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.category !== undefined && { category: input.category.trim() }),
        ...(input.unit !== undefined && { unit: input.unit.trim().toUpperCase() }),
        ...(input.min_stock_level !== undefined && { min_stock_level: Math.max(0, Number(input.min_stock_level)) }),
        ...(input.unit_cost !== undefined && { unit_cost: Math.max(0, Number(input.unit_cost)) }),
        ...(input.default_supplier_id !== undefined && { default_supplier_id: input.default_supplier_id || null }),
      },
      include: {
        default_supplier: true,
      },
    });
  }

  /**
   * Archives or unarchives a supply item
   */
  static async setArchiveStatus(id: string, isArchived: boolean) {
    return prisma.supplyItem.update({
      where: { id },
      data: {
        is_archived: isArchived,
        archived_at: isArchived ? new Date() : null,
      },
    });
  }

  /**
   * Atomic ledger movement recording for consumable supplies
   * Enforces no-negative-inventory and creates immutable audit record
   */
  static async recordMovement(input: RecordMovementInput) {
    return prisma.$transaction(async (tx) => {
      const supply = await tx.supplyItem.findUnique({
        where: { id: input.supply_id },
      });

      if (!supply) {
        throw new Error(`Supply item not found with id ${input.supply_id}`);
      }

      const prevQty = Number(supply.current_quantity);
      const deltaQty = Number(input.quantity);
      const newQty = prevQty + deltaQty;

      if (newQty < 0) {
        throw new Error(
          `Insufficient stock for "${supply.name}". Available: ${prevQty} ${supply.unit}, Requested: ${Math.abs(deltaQty)} ${supply.unit}`
        );
      }

      const unitCost = input.unit_cost !== undefined ? Number(input.unit_cost) : Number(supply.unit_cost);

      const [updatedSupply, movement] = await Promise.all([
        tx.supplyItem.update({
          where: { id: supply.id },
          data: {
            current_quantity: newQty,
            ...(deltaQty > 0 && input.unit_cost !== undefined ? { unit_cost: unitCost } : {}),
          },
        }),
        tx.supplyMovement.create({
          data: {
            supply_id: supply.id,
            movement_type: input.movement_type,
            quantity: deltaQty,
            unit_cost: unitCost,
            balance_after: newQty,
            reference_type: input.reference_type || 'MANUAL',
            reference_id: input.reference_id || null,
            stitching_order_number: input.stitching_order_number || null,
            notes: input.notes || null,
            created_by: input.created_by || 'Staff',
          },
        }),
      ]);

      return { supply: updatedSupply, movement };
    });
  }

  /**
   * Records supplies consumption for atelier custom stitching or workshop usage
   */
  static async recordConsumption(params: {
    supply_id: string;
    quantity: number;
    stitching_order_number?: string | null;
    notes?: string | null;
    created_by?: string;
  }) {
    if (params.quantity <= 0) {
      throw new Error('Consumption quantity must be greater than zero');
    }

    return this.recordMovement({
      supply_id: params.supply_id,
      movement_type: SupplyMovementType.CONSUMPTION,
      quantity: -Math.abs(params.quantity),
      reference_type: params.stitching_order_number ? 'STITCHING_ORDER' : 'MANUAL_CONSUMPTION',
      reference_id: params.stitching_order_number || undefined,
      stitching_order_number: params.stitching_order_number,
      notes: params.notes || (params.stitching_order_number ? `Used for Stitching Order #${params.stitching_order_number}` : 'Workshop atelier consumption'),
      created_by: params.created_by,
    });
  }

  /**
   * Alias for getSupply
   */
  static async getSupplyById(id: string) {
    return this.getSupply(id);
  }

  /**
   * Retrieves distinct supply categories
   */
  static async getCategories(): Promise<string[]> {
    const items = await prisma.supplyItem.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return items.map((i) => i.category).filter(Boolean);
  }

  /**
   * Records manual stock adjustment (Physical Count Reconciliation)
   */
  static async recordAdjustment(params: {
    supply_id: string;
    physical_count?: number;
    new_quantity?: number;
    reason: string;
    notes?: string | null;
    created_by?: string;
  }) {
    const targetQty = params.physical_count !== undefined ? params.physical_count : params.new_quantity;
    if (targetQty === undefined || targetQty < 0) {
      throw new Error('Quantity or physical count cannot be negative');
    }

    const supply = await prisma.supplyItem.findUnique({ where: { id: params.supply_id } });
    if (!supply) {
      throw new Error(`Supply item not found with id ${params.supply_id}`);
    }

    const currentQty = Number(supply.current_quantity);
    const delta = targetQty - currentQty;

    if (delta === 0) {
      return { adjustment_difference: 0, supply, movement: null };
    }

    const movementType = delta > 0 ? SupplyMovementType.ADJUSTMENT_ADD : SupplyMovementType.ADJUSTMENT_REDUCE;

    const res = await this.recordMovement({
      supply_id: params.supply_id,
      movement_type: movementType,
      quantity: delta,
      reference_type: 'STOCK_AUDIT',
      notes: `Physical Audit: ${params.reason}${params.notes ? ` - ${params.notes}` : ''}`,
      created_by: params.created_by,
    });

    return {
      adjustment_difference: delta,
      supply: res.supply,
      movement: res.movement,
    };
  }

  /**
   * Retrieves movements audit log with filtering
   */
  static async getMovements(params: {
    supply_id?: string;
    movement_type?: SupplyMovementType;
    stitching_order_number?: string;
    limit?: number;
  } = {}) {
    const where: any = {};
    if (params.supply_id) where.supply_id = params.supply_id;
    if (params.movement_type) where.movement_type = params.movement_type;
    if (params.stitching_order_number) {
      where.stitching_order_number = { contains: params.stitching_order_number, mode: 'insensitive' };
    }

    return prisma.supplyMovement.findMany({
      where,
      include: {
        supply: {
          select: { id: true, name: true, sku: true, unit: true, category: true },
        },
      },
      orderBy: { created_at: 'desc' },
      take: params.limit || 100,
    });
  }
}

