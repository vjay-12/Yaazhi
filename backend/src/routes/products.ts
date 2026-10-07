import { Router } from 'express';
import { prisma } from '../db.js';
import { productSchema } from '../validators/schemas.js';
import { LedgerService } from '../services/ledgerService.js';
import { MovementType } from '@prisma/client';

const router = Router();

// GET /api/products - list all products with calculated stock per godown & aggregated totals
router.get('/', async (req, res): Promise<void> => {
  try {
    const status = req.query.status ? String(req.query.status).trim().toLowerCase() : '';
    const whereClause: any = {};

    if (status === 'archived') {
      whereClause.is_active = false;
    } else if (status === 'all') {
      // return both active and archived
    } else {
      whereClause.is_active = true;
    }

    const products = await prisma.product.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { created_at: 'desc' },
      include: {
        category: true,
        stock_balances: {
          include: {
            godown: true,
          },
        },
      },
    });

    const result = products.map((p) => {
      const totalStock = p.stock_balances.reduce(
        (sum, b) => sum + Number(b.current_quantity),
        0
      );
      const salePrice = Number(p.sale_price);
      const purchasePrice = Number(p.purchase_price);
      const taxRate = Number(p.tax_rate);
      const minStock = Number(p.min_stock_level);

      const locationStock: Record<string, number> = {};
      for (const b of p.stock_balances) {
        locationStock[b.godown_id] = Number(b.current_quantity);
        if (b.godown?.code) {
          locationStock[b.godown.code] = Number(b.current_quantity);
        }
      }

      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        description: p.description,
        fabric: p.fabric,
        craft: p.craft,
        category: p.category?.name || 'General',
        categoryId: p.category_id,
        unit: p.unit,
        unitOfMeasure: p.unit,
        salePrice,
        purchasePrice,
        costPrice: purchasePrice,
        hsnCode: p.hsn_code,
        taxRate,
        gstRate: taxRate,
        reorderPoint: minStock,
        minStockLevel: minStock,
        totalStock,
        currentStock: totalStock,
        locationStock,
        imageUrl: p.image_url || null,
        isActive: Boolean(p.is_active),
        isArchived: !p.is_active,
        status: p.is_active ? 'ACTIVE' : 'ARCHIVED',
        createdAt: p.created_at,
        updatedAt: p.updated_at,
      };
    });

    res.json(result);
  } catch (err: any) {
    console.error('Fetch products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/categories - list categories
router.get('/categories', async (_req, res): Promise<void> => {
  try {
    const categories = await prisma.productCategory.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/products/categories - create category
router.post('/categories', async (req, res): Promise<void> => {
  try {
    const name = String(req.body.name || '').trim();
    if (!name) {
      res.status(400).json({ error: 'Category name is required' });
      return;
    }
    const cat = await prisma.productCategory.upsert({
      where: { name },
      update: {},
      create: { name, description: req.body.description },
    });
    res.status(201).json(cat);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// GET /api/products/:id - single product with stock & movements
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        category: true,
        stock_balances: {
          include: { godown: true },
        },
        stock_movements: {
          take: 20,
          orderBy: { created_at: 'desc' },
          include: { godown: true },
        },
      },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    const totalStock = product.stock_balances.reduce(
      (sum, b) => sum + Number(b.current_quantity),
      0
    );

    const locationStock: Record<string, number> = {};
    for (const b of product.stock_balances) {
      locationStock[b.godown_id] = Number(b.current_quantity);
      if (b.godown?.code) {
        locationStock[b.godown.code] = Number(b.current_quantity);
      }
    }

    res.json({
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      fabric: product.fabric,
      craft: product.craft,
      category: product.category?.name || 'General',
      categoryId: product.category_id,
      unit: product.unit,
      salePrice: Number(product.sale_price),
      purchasePrice: Number(product.purchase_price),
      hsnCode: product.hsn_code,
      taxRate: Number(product.tax_rate),
      reorderPoint: Number(product.min_stock_level),
      totalStock,
      currentStock: totalStock,
      locationStock,
      imageUrl: product.image_url || null,
      isActive: Boolean(product.is_active),
      isArchived: !product.is_active,
      status: product.is_active ? 'ACTIVE' : 'ARCHIVED',
      recentMovements: product.stock_movements.map((m) => ({
        id: m.id,
        type: m.movement_type,
        quantity: Number(m.quantity),
        balanceAfter: Number(m.balance_after),
        godownName: m.godown.name,
        notes: m.notes,
        createdAt: m.created_at,
        referenceType: m.reference_type,
        referenceId: m.reference_id,
      })),
      createdAt: product.created_at,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch product details' });
  }
});

// POST /api/products - create product with opening stock
router.post('/', async (req, res): Promise<void> => {
  try {
    const categoryName = req.body.category || '';
    const defaultTax = categoryName.includes('Churidar') || categoryName.includes('Anarkali') ? 12 : 5;
    const defaultHsn = categoryName.includes('Churidar') || categoryName.includes('Anarkali') || categoryName.includes('Kids') ? '6204' : '5007';

    const rawBody = {
      ...req.body,
      sale_price: typeof req.body.sale_price === 'number' ? req.body.sale_price : Number(req.body.salePrice ?? req.body.sell_price ?? 0),
      purchase_price: typeof req.body.purchase_price === 'number' ? req.body.purchase_price : Number(req.body.purchasePrice ?? req.body.costPrice ?? 0),
      tax_rate: typeof req.body.tax_rate === 'number' ? req.body.tax_rate : (req.body.taxRate !== undefined ? Number(req.body.taxRate) : req.body.gstRate !== undefined ? Number(req.body.gstRate) : defaultTax),
      hsn_code: req.body.hsn_code || req.body.hsnCode || defaultHsn,
      min_stock_level: typeof req.body.min_stock_level === 'number' ? req.body.min_stock_level : Number(req.body.minStockLevel ?? req.body.reorderPoint ?? 0),
      initial_stock: typeof req.body.initial_stock === 'number' ? req.body.initial_stock : Number(req.body.initialStock ?? req.body.currentStock ?? 0),
    };

    const parsed = productSchema.safeParse(rawBody);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues?.[0]?.message || (parsed.error as any).errors?.[0]?.message || 'Invalid product data';
      res.status(400).json({ error: errorMsg });
      return;
    }

    const {
      sku,
      name,
      description,
      fabric,
      craft,
      category_id,
      category,
      unit,
      sale_price,
      purchase_price,
      hsn_code,
      tax_rate,
      min_stock_level,
      initial_stock,
      godown_id,
    } = parsed.data;

    // Check SKU duplicate
    const existing = await prisma.product.findUnique({
      where: { sku: sku.toUpperCase().trim() },
    });
    if (existing) {
      res.status(400).json({ error: `Product with SKU "${sku}" already exists` });
      return;
    }

    // Resolve category
    let targetCategoryId = category_id || null;
    const catName = category || req.body.category;
    if (!targetCategoryId && catName) {
      const existingCat = await prisma.productCategory.findFirst({
        where: { name: { equals: catName.trim(), mode: 'insensitive' } },
      });
      if (existingCat) {
        targetCategoryId = existingCat.id;
      } else {
        const newCat = await prisma.productCategory.create({
          data: { name: catName.trim() },
        });
        targetCategoryId = newCat.id;
      }
    }

    // Default showroom
    let targetGodownId = godown_id;
    if (!targetGodownId) {
      const defaultGodown =
        (await prisma.godown.findFirst({ where: { is_default: true } })) ||
        (await prisma.godown.findFirst());
      targetGodownId = defaultGodown?.id;
    }

    const product = await prisma.product.create({
      data: {
        sku: sku.toUpperCase().trim(),
        name: name.trim(),
        description,
        fabric,
        craft,
        category_id: targetCategoryId,
        unit: unit.trim(),
        sale_price,
        purchase_price,
        hsn_code,
        tax_rate,
        min_stock_level,
        image_url: parsed.data.image_url || parsed.data.imageUrl || null,
        is_active: true,
      },
      include: { category: true },
    });

    // Record initial stock if provided
    if (initial_stock && initial_stock > 0 && targetGodownId) {
      await LedgerService.recordMovement({
        product_id: product.id,
        godown_id: targetGodownId,
        movement_type: MovementType.ADJUSTMENT_ADD,
        quantity: initial_stock,
        unit_cost: purchase_price,
        reference_type: 'INITIAL_STOCK',
        reference_id: product.id,
        notes: 'Opening stock count upon catalog addition',
        created_by: 'Boutique Staff',
      });
    }

    res.status(201).json({
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      fabric: product.fabric,
      craft: product.craft,
      category: product.category?.name || 'General',
      unit: product.unit,
      salePrice: Number(product.sale_price),
      purchasePrice: Number(product.purchase_price),
      currentStock: initial_stock || 0,
      totalStock: initial_stock || 0,
      taxRate: Number(product.tax_rate),
      reorderPoint: Number(product.min_stock_level),
      imageUrl: product.image_url || null,
      isActive: true,
      isArchived: false,
      status: 'ACTIVE',
    });
  } catch (err: any) {
    console.error('Create product error:', err);
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

// PUT /api/products/:id - edit product
router.put('/:id', async (req, res): Promise<void> => {
  try {
    const rawBody: any = { ...req.body };
    if (req.body.sale_price !== undefined || req.body.salePrice !== undefined || req.body.sell_price !== undefined) {
      rawBody.sale_price = Number(req.body.sale_price ?? req.body.salePrice ?? req.body.sell_price);
    }
    if (req.body.purchase_price !== undefined || req.body.purchasePrice !== undefined || req.body.costPrice !== undefined) {
      rawBody.purchase_price = Number(req.body.purchase_price ?? req.body.purchasePrice ?? req.body.costPrice);
    }
    if (req.body.tax_rate !== undefined || req.body.taxRate !== undefined || req.body.gstRate !== undefined) {
      rawBody.tax_rate = Number(req.body.tax_rate ?? req.body.taxRate ?? req.body.gstRate);
    }
    if (req.body.hsn_code !== undefined || req.body.hsnCode !== undefined) {
      rawBody.hsn_code = req.body.hsn_code || req.body.hsnCode;
    }
    if (req.body.min_stock_level !== undefined || req.body.minStockLevel !== undefined || req.body.reorderPoint !== undefined) {
      rawBody.min_stock_level = Number(req.body.min_stock_level ?? req.body.minStockLevel ?? req.body.reorderPoint);
    }

    const parsed = productSchema.partial().safeParse(rawBody);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues?.[0]?.message || (parsed.error as any).errors?.[0]?.message || 'Invalid product data';
      res.status(400).json({ error: errorMsg });
      return;
    }

    const {
      name,
      description,
      fabric,
      craft,
      category_id,
      unit,
      sale_price,
      purchase_price,
      hsn_code,
      tax_rate,
      min_stock_level,
    } = parsed.data;

    let targetCategoryId = category_id;
    const catName = req.body.category;
    if (catName && typeof catName === 'string') {
      const existingCat = await prisma.productCategory.findFirst({
        where: { name: { equals: catName.trim(), mode: 'insensitive' } },
      });
      if (existingCat) {
        targetCategoryId = existingCat.id;
      } else {
        const newCat = await prisma.productCategory.create({
          data: { name: catName.trim() },
        });
        targetCategoryId = newCat.id;
      }
    }

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        ...(fabric !== undefined && { fabric }),
        ...(craft !== undefined && { craft }),
        ...(targetCategoryId !== undefined && { category_id: targetCategoryId }),
        ...(unit && { unit }),
        ...(sale_price !== undefined && { sale_price }),
        ...(purchase_price !== undefined && { purchase_price }),
        ...(hsn_code !== undefined && { hsn_code }),
        ...(tax_rate !== undefined && { tax_rate }),
        ...(min_stock_level !== undefined && { min_stock_level }),
        ...((parsed.data.image_url !== undefined || parsed.data.imageUrl !== undefined) && {
          image_url: parsed.data.image_url ?? parsed.data.imageUrl ?? null,
        }),
      },
      include: { category: true },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

// POST /api/products/:id/archive - soft archive product
router.post('/:id/archive', async (req, res): Promise<void> => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { is_active: false },
    });
    res.json({
      success: true,
      message: `Product ${product.name} archived successfully`,
      isArchived: true,
      isActive: false,
      status: 'ARCHIVED',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to archive product' });
  }
});

// POST /api/products/:id/unarchive - restore archived product
router.post('/:id/unarchive', async (req, res): Promise<void> => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { is_active: true },
    });
    res.json({
      success: true,
      message: `Product ${product.name} restored to active catalog`,
      isArchived: false,
      isActive: true,
      status: 'ACTIVE',
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to restore product' });
  }
});

// DELETE /api/products/:id - soft archive product
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { is_active: false },
    });
    res.json({ success: true, message: 'Product archived successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to archive product' });
  }
});

export default router;
