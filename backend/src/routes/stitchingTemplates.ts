import { Router } from 'express';
import { StitchingTemplateService } from '../services/stitchingTemplateService.js';

const router = Router();

// GET /api/stitching-templates - list all stitching templates with addons and filters
router.get('/', async (req, res): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;
    const garment_type = req.query.garment_type as string | undefined;
    const include_archived = req.query.include_archived === 'true' || req.query.archived === 'true';
    const search = req.query.search as string | undefined;

    const templates = await StitchingTemplateService.getAllTemplates({
      category,
      garment_type,
      include_archived,
      search,
    });
    res.json(templates);
  } catch (err: any) {
    console.error('Fetch stitching templates error:', err);
    res.status(500).json({ error: 'Failed to fetch stitching templates' });
  }
});

// GET /api/stitching-templates/:id - single template with addons
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const template = await StitchingTemplateService.getTemplateById(req.params.id);
    if (!template) {
      res.status(404).json({ error: 'Stitching template not found' });
      return;
    }
    res.json(template);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch stitching template' });
  }
});

// POST /api/stitching-templates - create new stitching template
router.post('/', async (req, res): Promise<void> => {
  try {
    const { name, garment_type, category, description, base_price, tax_rate, hsn_code, addons } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Service name is required' });
      return;
    }
    if (!garment_type || typeof garment_type !== 'string' || !garment_type.trim()) {
      res.status(400).json({ error: 'Garment type is required' });
      return;
    }
    if (base_price === undefined || base_price === null || isNaN(Number(base_price)) || Number(base_price) < 0) {
      res.status(400).json({ error: 'Valid base standard price (>= 0) is required' });
      return;
    }

    const template = await StitchingTemplateService.createTemplate({
      name: name.trim(),
      garment_type: garment_type.trim(),
      category,
      description,
      base_price: Number(base_price),
      tax_rate: tax_rate !== undefined ? Number(tax_rate) : 5.0,
      hsn_code,
      addons,
    });
    res.status(201).json(template);
  } catch (err: any) {
    console.error('Create stitching template error:', err);
    res.status(500).json({ error: err.message || 'Failed to create stitching template' });
  }
});

// PUT /api/stitching-templates/:id - update stitching template and addons
router.put('/:id', async (req, res): Promise<void> => {
  try {
    const { name, garment_type, category, description, base_price, tax_rate, hsn_code, addons } = req.body;
    const updated = await StitchingTemplateService.updateTemplate(req.params.id, {
      name,
      garment_type,
      category,
      description,
      base_price,
      tax_rate,
      hsn_code,
      addons,
    });
    res.json(updated);
  } catch (err: any) {
    console.error('Update stitching template error:', err);
    res.status(500).json({ error: err.message || 'Failed to update stitching template' });
  }
});

// POST /api/stitching-templates/:id/duplicate - clone template
router.post('/:id/duplicate', async (req, res): Promise<void> => {
  try {
    const duplicated = await StitchingTemplateService.duplicateTemplate(req.params.id);
    res.status(201).json(duplicated);
  } catch (err: any) {
    console.error('Duplicate stitching template error:', err);
    res.status(500).json({ error: err.message || 'Failed to duplicate stitching template' });
  }
});

// POST /api/stitching-templates/:id/archive - archive template
router.post('/:id/archive', async (req, res): Promise<void> => {
  try {
    const archived = await StitchingTemplateService.archiveTemplate(req.params.id);
    res.json({ success: true, message: 'Stitching template archived successfully', template: archived });
  } catch (err: any) {
    console.error('Archive stitching template error:', err);
    res.status(500).json({ error: err.message || 'Failed to archive stitching template' });
  }
});

// POST /api/stitching-templates/:id/restore - restore template
router.post('/:id/restore', async (req, res): Promise<void> => {
  try {
    const restored = await StitchingTemplateService.restoreTemplate(req.params.id);
    res.json({ success: true, message: 'Stitching template restored successfully', template: restored });
  } catch (err: any) {
    console.error('Restore stitching template error:', err);
    res.status(500).json({ error: err.message || 'Failed to restore stitching template' });
  }
});

// DELETE /api/stitching-templates/:id - delete template permanently
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    await StitchingTemplateService.deleteTemplate(req.params.id);
    res.json({ success: true, message: 'Stitching template deleted permanently' });
  } catch (err: any) {
    console.error('Delete stitching template error:', err);
    res.status(400).json({ error: err.message || 'Failed to delete stitching template' });
  }
});

// POST /api/stitching-templates/:id/addons - add addon
router.post('/:id/addons', async (req, res): Promise<void> => {
  try {
    const { name, description, price, is_default_selected, display_order } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Add-on service name is required' });
      return;
    }
    const addon = await StitchingTemplateService.addAddon(req.params.id, {
      name: name.trim(),
      description,
      price: Number(price) || 0,
      is_default_selected,
      display_order,
    });
    res.status(201).json(addon);
  } catch (err: any) {
    console.error('Add addon error:', err);
    res.status(500).json({ error: err.message || 'Failed to add addon service' });
  }
});

// PUT /api/stitching-templates/:id/addons/:addonId - update addon
router.put('/:id/addons/:addonId', async (req, res): Promise<void> => {
  try {
    const updated = await StitchingTemplateService.updateAddon(
      req.params.id,
      req.params.addonId,
      req.body
    );
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update addon service' });
  }
});

// DELETE /api/stitching-templates/:id/addons/:addonId - remove addon
router.delete('/:id/addons/:addonId', async (req, res): Promise<void> => {
  try {
    await StitchingTemplateService.removeAddon(req.params.id, req.params.addonId);
    res.json({ message: 'Addon removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove addon service' });
  }
});

export default router;
