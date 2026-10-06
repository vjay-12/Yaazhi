import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/settings - get boutique company settings
router.get('/', async (_req, res): Promise<void> => {
  try {
    let settings = await prisma.companySettings.findFirst();
    if (!settings) {
      settings = await prisma.companySettings.create({
        data: {
          id: 'yaazhi_settings',
          company_name: 'Yaazhi Boutique & Atelier',
          legal_name: 'Yaazhi Silks & Couture Pvt Ltd',
          phone: '+91 94440 12890',
          email: 'atelier@yaazhi.in',
          address: '42 Weaver Colony, Kanchipuram',
          state_code: '33',
          gstin: '33AABCY1234A1Z5',
          enable_gst: true,
        },
      });
    }

    res.json(settings);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings - update boutique settings
router.put('/', async (req, res): Promise<void> => {
  try {
    const { company_name, legal_name, phone, email, address, state_code, gstin, enable_gst } = req.body;

    const updated = await prisma.companySettings.upsert({
      where: { id: 'yaazhi_settings' },
      update: {
        ...(company_name && { company_name }),
        ...(legal_name !== undefined && { legal_name }),
        ...(phone !== undefined && { phone }),
        ...(email !== undefined && { email }),
        ...(address !== undefined && { address }),
        ...(state_code !== undefined && { state_code }),
        ...(gstin !== undefined && { gstin }),
        ...(enable_gst !== undefined && { enable_gst }),
      },
      create: {
        id: 'yaazhi_settings',
        company_name: company_name || 'Yaazhi Boutique & Atelier',
        legal_name,
        phone,
        email,
        address,
        state_code,
        gstin,
        enable_gst: enable_gst ?? true,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
