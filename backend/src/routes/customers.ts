import { Router } from 'express';
import { prisma } from '../db.js';
import { customerSchema } from '../validators/schemas.js';
import { CustomerMeasurementService } from '../services/customerMeasurementService.js';

const router = Router();

// =========================================================================
// CUSTOMER DIRECTORY CRUD
// =========================================================================

// GET /api/customers - list all customers with order counts & total spend
router.get('/', async (req, res): Promise<void> => {
  try {
    const search = req.query.search ? String(req.query.search).trim() : '';
    const status = req.query.status ? String(req.query.status).trim().toLowerCase() : '';

    const whereClause: any = {};
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { gstin: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') {
      whereClause.is_archived = false;
    } else if (status === 'archived') {
      whereClause.is_archived = true;
    }

    const customers = await prisma.customer.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      orderBy: { created_at: 'desc' },
      include: {
        sales_orders: {
          select: { grand_total: true, order_date: true },
        },
        measurement_profiles: {
          where: { is_active: true },
          include: {
            template: true,
            versions: {
              where: { is_current: true },
              include: {
                values: {
                  include: { field: true },
                },
              },
            },
          },
        },
      },
    });

    const result = customers.map((c) => {
      const ordersCount = c.sales_orders.length;
      const totalSpend = c.sales_orders.reduce(
        (sum, o) => sum + Number(o.grand_total),
        0
      );
      const activeProfile = c.measurement_profiles[0];
      const currentVersion = activeProfile?.versions[0];

      return {
        id: c.id,
        name: c.name,
        phone: c.phone || '',
        email: c.email || '',
        address: c.address || '',
        billingAddress: c.address || '',
        shippingAddress: c.shipping_address || c.address || '',
        city: c.city || 'Chennai',
        stateCode: c.state_code || '33',
        gstin: c.gstin || '',
        notes: c.notes || '',
        totalSpend,
        visitsCount: ordersCount,
        lastVisit: c.sales_orders[0]?.order_date || c.created_at,
        fittingProfile: activeProfile?.profile_name || 'Standard Boutique Profile',
        measurementProfilesCount: c.measurement_profiles.length,
        measurements: currentVersion?.values.map((v) => ({
          label: v.field.field_name,
          value: v.numeric_value ? `${v.numeric_value} ${v.unit}` : (v.text_value || '-'),
        })) || [],
        isArchived: Boolean(c.is_archived),
        archivedAt: c.archived_at ? c.archived_at.toISOString() : null,
        archivedBy: c.archived_by || null,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      };
    });

    res.json(result);
  } catch (err: any) {
    console.error('Fetch customers error:', err);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id - single customer details with full history
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id },
      include: {
        sales_orders: {
          orderBy: { order_date: 'desc' },
          include: { items: { include: { product: true } } },
        },
        measurement_profiles: {
          where: { is_active: true },
          include: {
            template: {
              include: {
                fields: {
                  where: { is_active: true },
                  orderBy: { display_order: 'asc' },
                },
              },
            },
            versions: {
              orderBy: { version_number: 'desc' },
              include: { values: { include: { field: true } } },
            },
          },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ error: 'Customer not found' });
      return;
    }

    const totalOrders = customer.sales_orders.length;
    const totalSpent = customer.sales_orders.reduce((sum, o) => sum + Number(o.grand_total), 0);

    res.json({
      ...customer,
      billingAddress: customer.address || '',
      shippingAddress: customer.shipping_address || customer.address || '',
      isArchived: Boolean(customer.is_archived),
      archivedAt: customer.archived_at ? customer.archived_at.toISOString() : null,
      archivedBy: customer.archived_by || null,
      totalOrders,
      totalSpent,
    });
  } catch (err: any) {
    console.error('Fetch customer details error:', err);
    res.status(500).json({ error: 'Failed to fetch customer details' });
  }
});

// POST /api/customers - create new customer
router.post('/', async (req, res): Promise<void> => {
  try {
    const parsed = customerSchema.safeParse(req.body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues?.[0]?.message || (parsed.error as any).errors?.[0]?.message || 'Invalid customer data';
      res.status(400).json({ error: errorMsg });
      return;
    }

    const { name, phone, email, address, shipping_address, city, state_code, gstin, notes } = parsed.data;

    // Check duplicate phone if provided
    if (phone && phone.trim()) {
      const existing = await prisma.customer.findFirst({
        where: { phone: phone.trim() },
      });
      if (existing) {
        res.status(400).json({ error: `Customer with phone "${phone}" already exists (${existing.name})` });
        return;
      }
    }

    const customer = await prisma.customer.create({
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        email: email ? email.trim() : null,
        address: address ? address.trim() : null,
        shipping_address: shipping_address ? shipping_address.trim() : (address ? address.trim() : null),
        city: city ? city.trim() : 'Chennai',
        state_code: state_code || '33',
        gstin: gstin ? gstin.trim().toUpperCase() : null,
        notes: notes ? notes.trim() : null,
      },
    });

    res.status(201).json({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
      billingAddress: customer.address || '',
      shippingAddress: customer.shipping_address || customer.address || '',
      city: customer.city || 'Chennai',
      stateCode: customer.state_code || '33',
      gstin: customer.gstin || '',
      notes: customer.notes || '',
      totalSpend: 0,
      visitsCount: 0,
      fittingProfile: 'Standard Boutique Profile',
      createdAt: customer.created_at,
    });
  } catch (err: any) {
    console.error('Create customer error:', err);
    res.status(500).json({ error: err.message || 'Failed to create customer' });
  }
});

// PUT /api/customers/:id - update customer
router.put('/:id', async (req, res): Promise<void> => {
  try {
    const parsed = customerSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      const errorMsg = parsed.error.issues?.[0]?.message || (parsed.error as any).errors?.[0]?.message || 'Invalid customer data';
      res.status(400).json({ error: errorMsg });
      return;
    }

    const updated = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        ...parsed.data,
        gstin: parsed.data.gstin ? parsed.data.gstin.trim().toUpperCase() : parsed.data.gstin,
      },
    });

    res.json(updated);
  } catch (err: any) {
    console.error('Update customer error:', err);
    res.status(500).json({ error: err.message || 'Failed to update customer' });
  }
});

// POST /api/customers/:id/archive - archive active customer
router.post('/:id/archive', async (req, res): Promise<void> => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id },
      data: {
        is_archived: true,
        archived_at: new Date(),
        archived_by: req.body.archived_by || 'Boutique Manager',
      },
    });
    res.json({ success: true, message: `Customer ${customer.name} moved to archive`, customer });
  } catch (err: any) {
    console.error('Archive customer error:', err);
    res.status(500).json({ error: err.message || 'Failed to archive customer' });
  }
});

// POST /api/customers/:id/unarchive - restore archived customer
router.post(['/:id/unarchive', '/:id/restore'], async (req, res): Promise<void> => {
  try {
    const id = String(req.params.id);
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        is_archived: false,
        archived_at: null,
        archived_by: null,
      },
    });
    res.json({ success: true, message: `Customer ${customer.name} restored to active directory`, customer });
  } catch (err: any) {
    console.error('Restore customer error:', err);
    res.status(500).json({ error: err.message || 'Failed to restore customer' });
  }
});

// DELETE /api/customers/:id - permanent delete of archived customer
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    const customerId = String(req.params.id);
    await prisma.$transaction(async (tx) => {
      // Disassociate foreign keys so past sales orders & invoices retain customer name
      await tx.salesOrder.updateMany({
        where: { customer_id: customerId },
        data: { customer_id: null },
      });
      await tx.invoice.updateMany({
        where: { customer_id: customerId },
        data: { customer_id: null },
      });
      await tx.payment.updateMany({
        where: { customer_id: customerId },
        data: { customer_id: null },
      });
      // Delete measurement profiles and versions
      await tx.customerMeasurementProfile.deleteMany({
        where: { customer_id: customerId },
      });
      // Delete customer record permanently
      await tx.customer.delete({
        where: { id: customerId },
      });
    });
    res.json({ success: true, message: 'Archived customer permanently removed' });
  } catch (err: any) {
    console.error('Delete customer error:', err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

// =========================================================================
// CUSTOMER MEASUREMENT PROFILES (SUB-RESOURCES)
// =========================================================================

// GET /api/customers/:customerId/measurement-profiles
router.get(['/:customerId/measurement-profiles', '/:customerId/measurements'], async (req, res): Promise<void> => {
  try {
    const customerId = String(req.params.customerId);
    const profiles = await CustomerMeasurementService.getProfilesByCustomer(customerId);
    res.json(profiles);
  } catch (err: any) {
    console.error('Fetch customer measurement profiles error:', err);
    res.status(500).json({ error: 'Failed to fetch customer measurement profiles' });
  }
});

// GET /api/customers/:customerId/measurement-profiles/:profileId
router.get(['/:customerId/measurement-profiles/:profileId', '/:customerId/measurements/:profileId'], async (req, res): Promise<void> => {
  try {
    const customerId = String(req.params.customerId);
    const profileId = String(req.params.profileId);
    const profile = await CustomerMeasurementService.getProfileDetails(customerId, profileId);
    if (!profile) {
      res.status(404).json({ error: 'Measurement profile not found' });
      return;
    }
    res.json(profile);
  } catch (err: any) {
    console.error('Fetch measurement profile error:', err);
    res.status(500).json({ error: 'Failed to fetch measurement profile' });
  }
});

// GET /api/customers/:customerId/measurement-profiles/:profileId/history
router.get(['/:customerId/measurement-profiles/:profileId/history', '/:customerId/measurements/:profileId/history'], async (req, res): Promise<void> => {
  try {
    const customerId = String(req.params.customerId);
    const profileId = String(req.params.profileId);
    const history = await CustomerMeasurementService.getProfileHistory(customerId, profileId);
    if (!history) {
      res.status(404).json({ error: 'Measurement profile not found' });
      return;
    }
    res.json(history.versions);
  } catch (err: any) {
    console.error('Fetch measurement history error:', err);
    res.status(500).json({ error: 'Failed to fetch measurement history' });
  }
});

// POST /api/customers/:customerId/measurement-profiles - create profile
router.post(['/:customerId/measurement-profiles', '/:customerId/measurements'], async (req, res): Promise<void> => {
  try {
    const customerId = String(req.params.customerId);
    const { template_id, profile_name, notes, measured_by, measured_at, values } = req.body;

    if (!template_id || !profile_name) {
      res.status(400).json({ error: 'Template and Profile Name are required' });
      return;
    }

    const created = await CustomerMeasurementService.createProfile(customerId, {
      template_id,
      profile_name,
      notes,
      measured_by,
      measured_at,
      values: values || [],
    });

    const fullProfile = await CustomerMeasurementService.getProfileDetails(customerId, created.id);
    res.status(201).json(fullProfile);
  } catch (err: any) {
    console.error('Create measurement profile error:', err);
    res.status(500).json({ error: err.message || 'Failed to create measurement profile' });
  }
});

// POST /api/customers/:customerId/measurement-profiles/:profileId/versions - add new version
router.post(['/:customerId/measurement-profiles/:profileId/versions', '/:customerId/measurements/:profileId/versions'], async (req, res): Promise<void> => {
  try {
    const customerId = String(req.params.customerId);
    const profileId = String(req.params.profileId);
    const { notes, measured_by, measured_at, values } = req.body;

    const version = await CustomerMeasurementService.addProfileVersion(customerId, profileId, {
      notes,
      measured_by,
      measured_at,
      values: values || [],
    });

    const updatedProfile = await CustomerMeasurementService.getProfileDetails(customerId, profileId);
    res.status(201).json({ version, profile: updatedProfile });
  } catch (err: any) {
    console.error('Add measurement version error:', err);
    res.status(500).json({ error: err.message || 'Failed to record measurement version' });
  }
});

// POST /api/customers/:customerId/measurement-profiles/:profileId/clone - clone profile
router.post(['/:customerId/measurement-profiles/:profileId/clone', '/:customerId/measurements/:profileId/clone'], async (req, res): Promise<void> => {
  try {
    const customerId = String(req.params.customerId);
    const profileId = String(req.params.profileId);
    const { profile_name } = req.body;

    const cloned = await CustomerMeasurementService.cloneProfile(customerId, profileId, profile_name);
    const fullProfile = await CustomerMeasurementService.getProfileDetails(customerId, cloned.id);
    res.status(201).json(fullProfile);
  } catch (err: any) {
    console.error('Clone measurement profile error:', err);
    res.status(500).json({ error: err.message || 'Failed to clone measurement profile' });
  }
});

// PUT /api/customers/:customerId/measurement-profiles/:profileId - update profile name/notes
router.put(['/:customerId/measurement-profiles/:profileId', '/:customerId/measurements/:profileId'], async (req, res): Promise<void> => {
  try {
    const customerId = String(req.params.customerId);
    const profileId = String(req.params.profileId);
    const updated = await CustomerMeasurementService.updateProfile(customerId, profileId, req.body);
    res.json(updated);
  } catch (err: any) {
    console.error('Update measurement profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// DELETE /api/customers/:customerId/measurement-profiles/:profileId - soft delete
router.delete(['/:customerId/measurement-profiles/:profileId', '/:customerId/measurements/:profileId'], async (req, res): Promise<void> => {
  try {
    const customerId = String(req.params.customerId);
    const profileId = String(req.params.profileId);
    await CustomerMeasurementService.deleteProfile(customerId, profileId);
    res.json({ message: 'Measurement profile archived successfully' });
  } catch (err: any) {
    console.error('Delete measurement profile error:', err);
    res.status(500).json({ error: 'Failed to delete measurement profile' });
  }
});

export default router;
