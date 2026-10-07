import { Router } from 'express';
import { prisma } from '../db.js';
import { purchaseOrderSchema } from '../validators/schemas.js';
import { LedgerService } from '../services/ledgerService.js';
import { MovementType, POStatus } from '@prisma/client';

const router = Router();

// Canonical PO Status normalizer
const normalizePOStatus = (status: any): 'ORDERED' | 'RECEIVED' | 'CANCELLED' => {
  if (status === 'RECEIVED') return 'RECEIVED';
  if (status === 'CANCELLED') return 'CANCELLED';
  // Maps PENDING_DELIVERY, Pending Delivery, DRAFT, etc. to ORDERED
  return 'ORDERED';
};

// GET /api/purchase-orders - list purchase orders
router.get('/', async (_req, res): Promise<void> => {
  try {
    const pos = await prisma.purchaseOrder.findMany({
      orderBy: { order_date: 'desc' },
      include: {
        supplier: true,
        godown: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    const result = pos.map((p) => {
      const itemsCount = p.items.reduce((sum, it) => sum + Number(it.quantity), 0);
      const itemsSummary = p.items
        .map((it) => `${it.product.name} (x${it.quantity})`)
        .join(', ');

      return {
        id: p.id,
        poNumber: p.po_number,
        vendorName: p.supplier_name || p.supplier?.name || 'Direct Loom Guild',
        vendorId: p.supplier_id,
        date: p.order_date.toISOString().split('T')[0],
        orderDate: p.order_date,
        itemsCount,
        totalAmount: Number(p.grand_total),
        subtotal: Number(p.subtotal),
        taxTotal: Number(p.tax_total),
        status: normalizePOStatus(p.status), // Canonical: ORDERED, RECEIVED, CANCELLED
        location: p.godown?.name || 'Main Showroom Counter',
        godownId: p.godown_id,
        supplierPhone: p.supplier_phone || p.supplier?.phone || undefined,
        supplierAddress: p.supplier_address || p.supplier?.address || undefined,
        supplierGstin: p.supplier_gstin || p.supplier?.gstin || undefined,
        itemsSummary,
        notes: p.notes,
        items: p.items.map((it) => ({
          id: it.id,
          productId: it.product_id,
          productName: it.product.name,
          sku: it.product.sku,
          quantity: Number(it.quantity),
          unitCost: Number(it.unit_cost),
          taxRate: Number(it.tax_rate),
          total: Number(it.total),
        })),
        createdAt: p.created_at,
      };
    });

    res.json(result);
  } catch (err: any) {
    console.error('Fetch POs error:', err);
    res.status(500).json({ error: 'Failed to fetch purchase orders' });
  }
});

// GET /api/purchase-orders/:id - single PO details
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: req.params.id },
      include: {
        supplier: true,
        godown: true,
        items: { include: { product: true } },
      },
    });

    if (!po) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    res.json(po);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch purchase order' });
  }
});

// POST /api/purchase-orders - create purchase order
router.post('/', async (req, res): Promise<void> => {
  try {
    const rawItems = Array.isArray(req.body.items)
      ? req.body.items.map((it: any) => ({
          product_id: it.product_id || it.productId,
          quantity: Number(it.quantity || it.qty || 1),
          unit_cost: Number(it.unit_cost || it.unitCost || it.cost || 0),
          tax_rate: Number(it.tax_rate || it.taxRate || 5.0),
        }))
      : [];

    let supplierName = req.body.supplier_name || req.body.vendorName;
    const supplierId = req.body.supplier_id || req.body.vendorId;

    if (!supplierName && supplierId) {
      const v = await prisma.supplier.findUnique({ where: { id: supplierId } });
      if (v) supplierName = v.name;
    }

    const normalizedBody = {
      ...req.body,
      supplier_id: supplierId,
      supplier_name: supplierName || 'Direct Loom Guild',
      godown_id: req.body.godown_id || req.body.godownId,
      order_date: req.body.order_date || req.body.orderDate || new Date().toISOString(),
      items: rawItems,
    };

    const parsed = purchaseOrderSchema.safeParse(normalizedBody);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues?.[0]?.message || (parsed.error as any).errors?.[0]?.message || 'Invalid PO data';
      res.status(400).json({ error: errorMsg });
      return;
    }

    let {
      supplier_id,
      supplier_name,
      supplier_phone,
      supplier_address,
      supplier_gstin,
      godown_id,
      order_date,
      notes,
      items,
    } = parsed.data;

    // Attach supplier contact details
    if (supplier_id) {
      const vendor = await prisma.supplier.findUnique({ where: { id: supplier_id } });
      if (vendor) {
        supplier_name = vendor.name;
        supplier_phone = vendor.phone || undefined;
        supplier_address = vendor.address || undefined;
        supplier_gstin = vendor.gstin || undefined;
      }
    }

    // Resolve target godown
    let targetGodownId = godown_id;
    if (!targetGodownId) {
      const def = (await prisma.godown.findFirst({ where: { is_default: true } })) || (await prisma.godown.findFirst());
      targetGodownId = def?.id;
    }

    // Generate unique PO number
    const year = new Date().getFullYear();
    const count = await prisma.purchaseOrder.count();
    let nextPoNum = count + 1;
    let poNumber = `PO-${year}-${String(nextPoNum).padStart(4, '0')}`;
    while (await prisma.purchaseOrder.findUnique({ where: { po_number: poNumber } })) {
      nextPoNum++;
      poNumber = `PO-${year}-${String(nextPoNum).padStart(4, '0')}`;
    }

    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;
    const itemsData = items.map((it) => {
      const lineSubtotal = it.quantity * it.unit_cost;
      const lineTax = (lineSubtotal * it.tax_rate) / 100;
      subtotal += lineSubtotal;
      taxTotal += lineTax;
      return {
        product_id: it.product_id,
        quantity: it.quantity,
        unit_cost: it.unit_cost,
        tax_rate: it.tax_rate,
        tax_amount: lineTax,
        total: lineSubtotal + lineTax,
      };
    });

    const grandTotal = subtotal + taxTotal;

    const po = await prisma.purchaseOrder.create({
      data: {
        po_number: poNumber,
        supplier_id: supplier_id || null,
        supplier_name: supplier_name || 'Boutique Vendor',
        supplier_phone,
        supplier_address,
        supplier_gstin,
        godown_id: targetGodownId!,
        order_date: order_date ? new Date(order_date) : new Date(),
        status: POStatus.ORDERED,
        subtotal,
        tax_total: taxTotal,
        grand_total: grandTotal,
        notes,
        items: {
          create: itemsData,
        },
      },
      include: {
        supplier: true,
        godown: true,
        items: { include: { product: true } },
      },
    });

    res.status(201).json(po);
  } catch (err: any) {
    console.error('Create PO error:', err);
    res.status(500).json({ error: err.message || 'Failed to create purchase order' });
  }
});

// POST /api/purchase-orders/:id/receive - Receive PO into stock (TRANSACTIONAL)
router.post('/:id/receive', async (req, res): Promise<void> => {
  const poId = req.params.id;
  const { notes } = req.body;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const po = await tx.purchaseOrder.findUnique({
        where: { id: poId },
        include: { items: true, godown: true },
      });

      if (!po) {
        throw new Error('Purchase order not found');
      }

      if (po.status === POStatus.RECEIVED) {
        throw new Error('Purchase order has already been received');
      }

      if (po.status === POStatus.CANCELLED) {
        throw new Error('Cannot receive a cancelled purchase order');
      }

      // Check idempotency guard in ledger
      const existingReceipt = await tx.stockMovement.findFirst({
        where: {
          reference_type: 'PURCHASE_ORDER',
          reference_id: po.id,
          movement_type: MovementType.PURCHASE_RECEIPT,
        },
      });

      if (existingReceipt) {
        throw new Error('Stock receipt already recorded for this purchase order');
      }

      // 1. Update status to RECEIVED
      const updatedPO = await tx.purchaseOrder.update({
        where: { id: po.id },
        data: { status: POStatus.RECEIVED },
      });

      // 2. Increase stock in ledger for each line item
      for (const item of po.items) {
        const qty = Number(item.quantity);
        if (qty <= 0) continue;

        await LedgerService.recordMovement(
          {
            product_id: item.product_id,
            godown_id: po.godown_id,
            movement_type: MovementType.PURCHASE_RECEIPT,
            quantity: qty,
            unit_cost: Number(item.unit_cost),
            reference_type: 'PURCHASE_ORDER',
            reference_id: po.id,
            notes: notes
              ? `Goods receipt for PO ${po.po_number}: ${notes}`
              : `Goods receipt for PO ${po.po_number} from ${po.supplier_name}`,
            created_by: 'Boutique Receiving Desk',
          },
          tx
        );
      }

      return updatedPO;
    });

    res.json({
      success: true,
      message: `Purchase order ${result.po_number} received into stock successfully`,
      po: result,
    });
  } catch (err: any) {
    console.error('Receive PO error:', err);
    const status = err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: err.message || 'Failed to receive purchase order' });
  }
});

// POST /api/purchase-orders/:id/cancel - Cancel PO
router.post('/:id/cancel', async (req, res): Promise<void> => {
  const poId = req.params.id;
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
    });

    if (!po) {
      res.status(404).json({ error: 'Purchase order not found' });
      return;
    }

    if (po.status === POStatus.RECEIVED) {
      res.status(400).json({ error: 'Cannot cancel an already received purchase order' });
      return;
    }

    if (po.status === POStatus.CANCELLED) {
      res.status(400).json({ error: 'Purchase order is already cancelled' });
      return;
    }

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: po.id },
      data: { status: POStatus.CANCELLED },
      include: {
        supplier: true,
        godown: true,
        items: { include: { product: true } },
      },
    });

    res.json({
      success: true,
      message: `Purchase order ${updatedPO.po_number} cancelled`,
      po: updatedPO,
    });
  } catch (err: any) {
    console.error('Cancel PO error:', err);
    res.status(500).json({ error: err.message || 'Failed to cancel purchase order' });
  }
});

export default router;
