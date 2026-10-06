import { Router } from 'express';
import { MeasurementTemplateService } from '../services/measurementTemplateService.js';

const router = Router();

// GET /api/measurement-templates - list all active templates with fields
router.get('/', async (req, res): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;
    const templates = await MeasurementTemplateService.getAllTemplates(category);
    res.json(templates);
  } catch (err: any) {
    console.error('Fetch measurement templates error:', err);
    res.status(500).json({ error: 'Failed to fetch measurement templates' });
  }
});

// GET /api/measurement-templates/:id - single template with fields
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const template = await MeasurementTemplateService.getTemplateById(req.params.id);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json(template);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST /api/measurement-templates - create custom template
router.post('/', async (req, res): Promise<void> => {
  try {
    const { name, description, category, fields } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Template name is required' });
      return;
    }

    const template = await MeasurementTemplateService.createCustomTemplate({
      name: name.trim(),
      description,
      category,
      fields,
    });
    res.status(201).json(template);
  } catch (err: any) {
    console.error('Create template error:', err);
    res.status(500).json({ error: err.message || 'Failed to create measurement template' });
  }
});

// PUT /api/measurement-templates/:id - update template metadata
router.put('/:id', async (req, res): Promise<void> => {
  try {
    const { name, description, category } = req.body;
    const updated = await MeasurementTemplateService.updateTemplate(req.params.id, {
      name,
      description,
      category,
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update measurement template' });
  }
});

// POST /api/measurement-templates/:id/fields - add field to template
router.post('/:id/fields', async (req, res): Promise<void> => {
  try {
    const { field_key, field_name, field_type, default_unit, display_order, is_required } = req.body;
    if (!field_name || typeof field_name !== 'string' || !field_name.trim()) {
      res.status(400).json({ error: 'Field name is required' });
      return;
    }

    const field = await MeasurementTemplateService.addField(req.params.id, {
      field_key,
      field_name: field_name.trim(),
      field_type,
      default_unit,
      display_order,
      is_required,
    });
    res.status(201).json(field);
  } catch (err: any) {
    console.error('Add template field error:', err);
    res.status(500).json({ error: err.message || 'Failed to add template field' });
  }
});

// PUT /api/measurement-templates/:id/fields/:fieldId - update field
router.put('/:id/fields/:fieldId', async (req, res): Promise<void> => {
  try {
    const updated = await MeasurementTemplateService.updateField(
      req.params.id,
      req.params.fieldId,
      req.body
    );
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update template field' });
  }
});

// DELETE /api/measurement-templates/:id/fields/:fieldId - remove field
router.delete('/:id/fields/:fieldId', async (req, res): Promise<void> => {
  try {
    await MeasurementTemplateService.removeField(req.params.id, req.params.fieldId);
    res.json({ message: 'Field removed successfully' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove template field' });
  }
});

export default router;
