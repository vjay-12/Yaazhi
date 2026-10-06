import { Router } from 'express';
import { prisma } from '../db.js';
import { supplierSchema } from '../validators/schemas.js';

const router = Router();

// GET /api/suppliers - list vendors with active PO counts
router.get('/', async (req, res): Promise<void> => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';

    const suppliers = await prisma.supplier.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { contact_person: { contains: search, mode: 'insensitive' } },
              { city: { contains: search, mode: 'insensitive' } },
              { gstin: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
            ],
            is_active: true,
          }
        : { is_active: true },
      orderBy: { created_at: 'desc' },
      include: {
        purchase_orders: {
          select: { id: true, status: true, grand_total: true },
        },
      },
    });

    const result = suppliers.map((s) => {
      const activeOrders = s.purchase_orders.filter(
        (po) => po.status === 'ORDERED' || po.status === 'DRAFT'
      ).length;

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
        activeOrders,
        totalOrders: s.purchase_orders.length,
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

// GET /api/suppliers/:id - single vendor details with PO history
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: req.params.id },
      include: {
        purchase_orders: {
          orderBy: { order_date: 'desc' },
          include: { items: { include: { product: true } } },
        },
      },
    });

    if (!supplier) {
      res.status(404).json({ error: 'Vendor not found' });
      return;
    }

    res.json(supplier);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch vendor details' });
  }
});

// POST /api/suppliers - create boutique vendor
router.post('/', async (req, res): Promise<void> => {
  try {
    const rawBody = {
      ...req.body,
      contact_person: req.body.contact_person || req.body.contactPerson,
      vendor_type: req.body.vendor_type || req.body.vendorType || req.body.category,
      state_code: req.body.state_code || req.body.stateCode || '33',
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
        is_active: true,
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
      activeOrders: 0,
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
      contact_person: req.body.contact_person || req.body.contactPerson,
      vendor_type: req.body.vendor_type || req.body.vendorType,
      state_code: req.body.state_code || req.body.stateCode,
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

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update vendor' });
  }
});

// DELETE /api/suppliers/:id - archive vendor
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    await prisma.supplier.update({
      where: { id: req.params.id },
      data: { is_active: false },
    });
    res.json({ success: true, message: 'Vendor archived successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to archive vendor' });
  }
});

export default router;
