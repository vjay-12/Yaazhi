import { Router } from 'express';
import { prisma } from '../db.js';
import { supplierSchema } from '../validators/schemas.js';

const router = Router();

// GET /api/suppliers - list vendors with active PO counts & status filter
router.get('/', async (req, res): Promise<void> => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const status = req.query.status ? String(req.query.status).trim().toLowerCase() : 'active';

    const whereClause: any = {};

    // Status filter: 'active' | 'archived' | 'all'
    if (status === 'archived') {
      whereClause.is_archived = true;
    } else if (status === 'active') {
      whereClause.is_archived = false;
      whereClause.is_active = true;
    }
    // If 'all', do not constrain is_archived or is_active

    // Search query
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contact_person: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { gstin: { contains: search, mode: 'insensitive' } },
        { category: { contains: search, mode: 'insensitive' } },
        { bank_name: { contains: search, mode: 'insensitive' } },
        { upi_id: { contains: search, mode: 'insensitive' } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where: whereClause,
      orderBy: { created_at: 'desc' },
      include: {
        purchase_orders: {
          select: { id: true, status: true, grand_total: true, order_date: true },
        },
      },
    });

    const result = suppliers.map((s) => {
      const activeOrders = s.purchase_orders.filter(
        (po) => po.status === 'ORDERED'
      ).length;

      const nonCancelledPOs = s.purchase_orders.filter((po) => po.status !== 'CANCELLED');
      const totalPurchaseValue = nonCancelledPOs.reduce((sum, po) => sum + Number(po.grand_total), 0);

      return {
        id: s.id,
        name: s.name,
        contactPerson: s.contact_person || '',
        category: s.category || s.vendor_type || 'Fabric Supplier',
        vendorType: s.vendor_type || 'Fabric Supplier',
        notes: s.notes || '',
        phone: s.phone || '',
        email: s.email || '',
        address: s.address || '',
        city: s.city || 'Kanchipuram',
        state: s.state || 'Tamil Nadu',
        stateCode: s.state_code || '33',
        gstin: s.gstin || '',
        bankName: s.bank_name || '',
        accountNumber: s.account_number || '',
        ifscCode: s.ifsc_code || '',
        upiId: s.upi_id || '',
        isActive: s.is_active,
        isArchived: s.is_archived,
        activeOrders,
        totalOrders: s.purchase_orders.length,
        totalPurchaseValue,
        paymentTerms: 'Net 30 Days (Direct Weavers Guild)',
        createdAt: s.created_at,
      };
    });

    res.json(result);
  } catch (err: any) {
    console.error('Fetch vendors error:', err);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// GET /api/suppliers/:id - single vendor details with PO history, GRN history & dynamic summary
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        purchase_orders: {
          orderBy: { order_date: 'desc' },
          include: {
            items: { include: { product: true } },
            godown: true,
          },
        },
      },
    });

    if (!supplier) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    // Dynamic calculations from actual PO relationships
    const pos = supplier.purchase_orders;
    const nonCancelledPOs = pos.filter((po) => po.status !== 'CANCELLED');
    const totalPurchaseValue = nonCancelledPOs.reduce((sum, po) => sum + Number(po.grand_total), 0);

    const pendingPOs = pos.filter((po) => po.status === 'ORDERED');
    const pendingPoCount = pendingPOs.length;
    const pendingPoValue = pendingPOs.reduce((sum, po) => sum + Number(po.grand_total), 0);

    const lastOrderDate = pos.length > 0 ? pos[0].order_date.toISOString().split('T')[0] : null;

    // PO History
    const poHistory = pos.map((po) => ({
      id: po.id,
      poNumber: po.po_number,
      orderDate: po.order_date,
      date: po.order_date.toISOString().split('T')[0],
      totalAmount: Number(po.grand_total),
      subtotal: Number(po.subtotal),
      taxTotal: Number(po.tax_total),
      status: po.status === 'RECEIVED' ? 'RECEIVED' : po.status === 'CANCELLED' ? 'CANCELLED' : 'ORDERED',
      itemsCount: po.items.reduce((sum, it) => sum + Number(it.quantity), 0),
      location: po.godown?.name || 'Main Showroom Counter',
      items: po.items.map((it) => ({
        id: it.id,
        productId: it.product_id,
        productName: it.product.name,
        sku: it.product.sku,
        quantity: Number(it.quantity),
        unitCost: Number(it.unit_cost),
        taxRate: Number(it.tax_rate),
        total: Number(it.total),
      })),
      notes: po.notes || '',
    }));

    // GRN / Receipt History (Derived directly from POs with status === 'RECEIVED')
    const grnHistory = pos
      .filter((po) => po.status === 'RECEIVED')
      .map((po) => ({
        id: po.id,
        grnNumber: `GRN-${po.po_number.replace(/^PO-?/, '')}`,
        poNumber: po.po_number,
        poId: po.id,
        date: po.updated_at ? po.updated_at.toISOString().split('T')[0] : po.order_date.toISOString().split('T')[0],
        amount: Number(po.grand_total),
        status: 'RECEIVED',
        itemsCount: po.items.reduce((sum, it) => sum + Number(it.quantity), 0),
        location: po.godown?.name || 'Main Showroom Counter',
      }));

    res.json({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contact_person || '',
      category: supplier.category || supplier.vendor_type || 'Fabric Supplier',
      vendorType: supplier.vendor_type || 'Fabric Supplier',
      notes: supplier.notes || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      city: supplier.city || 'Kanchipuram',
      state: supplier.state || 'Tamil Nadu',
      stateCode: supplier.state_code || '33',
      gstin: supplier.gstin || '',
      bankName: supplier.bank_name || '',
      accountNumber: supplier.account_number || '',
      ifscCode: supplier.ifsc_code || '',
      upiId: supplier.upi_id || '',
      isActive: supplier.is_active,
      isArchived: supplier.is_archived,
      createdAt: supplier.created_at,
      paymentTerms: 'Net 30 Days (Direct Weavers Guild)',
      summary: {
        totalPurchaseValue,
        lastOrderDate,
        pendingPoCount,
        pendingPoValue,
        totalOrders: pos.length,
      },
      poHistory,
      grnHistory,
    });
  } catch (err: any) {
    console.error('Fetch vendor details error:', err);
    res.status(500).json({ error: 'Failed to fetch vendor details' });
  }
});

// POST /api/suppliers - create boutique vendor
router.post('/', async (req, res): Promise<void> => {
  try {
    const rawBody = {
      ...req.body,
      contact_person: req.body.contact_person ?? req.body.contactPerson,
      vendor_type: req.body.vendor_type ?? req.body.vendorType ?? req.body.category,
      state_code: req.body.state_code ?? req.body.stateCode ?? '33',
      bank_name: req.body.bank_name ?? req.body.bankName,
      account_number: req.body.account_number ?? req.body.accountNumber,
      ifsc_code: req.body.ifsc_code ?? req.body.ifscCode,
      upi_id: req.body.upi_id ?? req.body.upiId,
    };

    const parsed = supplierSchema.safeParse(rawBody);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid vendor data' });
      return;
    }

    const {
      name,
      contact_person,
      category,
      vendor_type,
      notes,
      phone,
      email,
      address,
      city,
      state,
      state_code,
      gstin,
      bank_name,
      account_number,
      ifsc_code,
      upi_id,
    } = parsed.data;

    const supplier = await prisma.supplier.create({
      data: {
        name: name.trim(),
        contact_person: contact_person ? contact_person.trim() : null,
        category: category ? category.trim() : 'Fabric Supplier',
        vendor_type: vendor_type ? vendor_type.trim() : 'Fabric Supplier',
        notes: notes ? notes.trim() : null,
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        city: city ? city.trim() : 'Kanchipuram',
        state: state ? state.trim() : 'Tamil Nadu',
        state_code: state_code || '33',
        gstin: gstin ? gstin.trim() : null,
        bank_name: bank_name ? bank_name.trim() : null,
        account_number: account_number ? account_number.trim() : null,
        ifsc_code: ifsc_code ? ifsc_code.trim().toUpperCase() : null,
        upi_id: upi_id ? upi_id.trim() : null,
        is_active: true,
        is_archived: false,
      },
    });

    res.status(201).json({
      id: supplier.id,
      name: supplier.name,
      contactPerson: supplier.contact_person || '',
      category: supplier.category || 'Fabric Supplier',
      vendorType: supplier.vendor_type || 'Fabric Supplier',
      notes: supplier.notes || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      city: supplier.city || 'Kanchipuram',
      state: supplier.state || 'Tamil Nadu',
      stateCode: supplier.state_code || '33',
      gstin: supplier.gstin || '',
      bankName: supplier.bank_name || '',
      accountNumber: supplier.account_number || '',
      ifscCode: supplier.ifsc_code || '',
      upiId: supplier.upi_id || '',
      isActive: supplier.is_active,
      isArchived: supplier.is_archived,
      activeOrders: 0,
      totalOrders: 0,
      totalPurchaseValue: 0,
      paymentTerms: 'Net 30 Days (Direct Weavers Guild)',
      createdAt: supplier.created_at,
    });
  } catch (err: any) {
    console.error('Create vendor error:', err);
    res.status(500).json({ error: err.message || 'Failed to create vendor' });
  }
});

// PUT /api/suppliers/:id - update vendor
router.put('/:id', async (req, res): Promise<void> => {
  try {
    const rawBody = {
      ...req.body,
      contact_person: req.body.contact_person ?? req.body.contactPerson,
      vendor_type: req.body.vendor_type ?? req.body.vendorType,
      state_code: req.body.state_code ?? req.body.stateCode,
      bank_name: req.body.bank_name ?? req.body.bankName,
      account_number: req.body.account_number ?? req.body.accountNumber,
      ifsc_code: req.body.ifsc_code ? String(req.body.ifsc_code).toUpperCase() : (req.body.ifscCode ? String(req.body.ifscCode).toUpperCase() : undefined),
      upi_id: req.body.upi_id ?? req.body.upiId,
    };

    const parsed = supplierSchema.partial().safeParse(rawBody);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid vendor data' });
      return;
    }

    const updated = await prisma.supplier.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    res.json({
      id: updated.id,
      name: updated.name,
      contactPerson: updated.contact_person || '',
      category: updated.category || updated.vendor_type || 'Fabric Supplier',
      vendorType: updated.vendor_type || 'Fabric Supplier',
      notes: updated.notes || '',
      phone: updated.phone || '',
      email: updated.email || '',
      address: updated.address || '',
      city: updated.city || 'Kanchipuram',
      state: updated.state || 'Tamil Nadu',
      stateCode: updated.state_code || '33',
      gstin: updated.gstin || '',
      bankName: updated.bank_name || '',
      accountNumber: updated.account_number || '',
      ifscCode: updated.ifsc_code || '',
      upiId: updated.upi_id || '',
      isActive: updated.is_active,
      isArchived: updated.is_archived,
      createdAt: updated.created_at,
    });
  } catch (err: any) {
    console.error('Update vendor error:', err);
    res.status(500).json({ error: err.message || 'Failed to update vendor' });
  }
});

// POST /api/suppliers/:id/archive - soft-archive vendor (preserves history & POs)
router.post('/:id/archive', async (req, res): Promise<void> => {
  try {
    const updated = await prisma.supplier.update({
      where: { id: req.params.id },
      data: { is_archived: true, is_active: false },
    });
    res.json({
      success: true,
      message: `Vendor ${updated.name} archived successfully. Historical records preserved.`,
    });
  } catch (err: any) {
    console.error('Archive vendor error:', err);
    res.status(500).json({ error: 'Failed to archive vendor' });
  }
});

// POST /api/suppliers/:id/restore - restore archived vendor
router.post('/:id/restore', async (req, res): Promise<void> => {
  try {
    const updated = await prisma.supplier.update({
      where: { id: req.params.id },
      data: { is_archived: false, is_active: true },
    });
    res.json({
      success: true,
      message: `Vendor ${updated.name} restored successfully`,
    });
  } catch (err: any) {
    console.error('Restore vendor error:', err);
    res.status(500).json({ error: 'Failed to restore vendor' });
  }
});

// DELETE /api/suppliers/:id - soft archive endpoint
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    await prisma.supplier.update({
      where: { id: req.params.id },
      data: { is_archived: true, is_active: false },
    });
    res.json({ success: true, message: 'Vendor archived successfully. Historical records preserved.' });
  } catch (err: any) {
    console.error('Delete/Archive vendor error:', err);
    res.status(500).json({ error: 'Failed to archive vendor' });
  }
});

export default router;
