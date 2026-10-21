import { Router } from 'express';
import { MeasurementTemplateService } from '../services/measurementTemplateService.js';

const router = Router();

// GET /api/measurement-templates - list all templates with optional filtering
router.get('/', async (req, res): Promise<void> => {
  try {
    const category = req.query.category as string | undefined;
    const garment_type = req.query.garment_type as string | undefined;
    const include_archived = req.query.include_archived === 'true' || req.query.archived === 'true';
    const search = req.query.search as string | undefined;

    const templates = await MeasurementTemplateService.getAllTemplates({
      category,
      garment_type,
      include_archived,
      search,
    });
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
    const { name, garment_type, description, category, fields } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({ error: 'Template name is required' });
      return;
    }

    const template = await MeasurementTemplateService.createCustomTemplate({
      name: name.trim(),
      garment_type: garment_type?.trim() || 'Other',
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

// PUT /api/measurement-templates/:id - update template metadata and fields
router.put('/:id', async (req, res): Promise<void> => {
  try {
    const { name, garment_type, description, category, fields } = req.body;
    const updated = await MeasurementTemplateService.updateTemplate(req.params.id, {
      name,
      garment_type,
      description,
      category,
      fields,
    });
    res.json(updated);
  } catch (err: any) {
    console.error('Update template error:', err);
    res.status(500).json({ error: err.message || 'Failed to update measurement template' });
  }
});

// POST /api/measurement-templates/:id/duplicate - clone template
router.post('/:id/duplicate', async (req, res): Promise<void> => {
  try {
    const duplicated = await MeasurementTemplateService.duplicateTemplate(req.params.id);
    res.status(201).json(duplicated);
  } catch (err: any) {
    console.error('Duplicate template error:', err);
    res.status(500).json({ error: err.message || 'Failed to duplicate template' });
  }
});

// POST /api/measurement-templates/:id/archive - archive template
router.post('/:id/archive', async (req, res): Promise<void> => {
  try {
    const archived = await MeasurementTemplateService.archiveTemplate(req.params.id);
    res.json({ success: true, message: 'Template archived successfully', template: archived });
  } catch (err: any) {
    console.error('Archive template error:', err);
    res.status(500).json({ error: err.message || 'Failed to archive template' });
  }
});

// POST /api/measurement-templates/:id/restore - unarchive template
router.post('/:id/restore', async (req, res): Promise<void> => {
  try {
    const restored = await MeasurementTemplateService.restoreTemplate(req.params.id);
    res.json({ success: true, message: 'Template restored successfully', template: restored });
  } catch (err: any) {
    console.error('Restore template error:', err);
    res.status(500).json({ error: err.message || 'Failed to restore template' });
  }
});

// DELETE /api/measurement-templates/:id - delete template (safely checked against references)
router.delete('/:id', async (req, res): Promise<void> => {
  try {
    await MeasurementTemplateService.deleteTemplate(req.params.id);
    res.json({ success: true, message: 'Template deleted permanently' });
  } catch (err: any) {
    console.error('Delete template error:', err);
    res.status(400).json({ error: err.message || 'Failed to delete template' });
  }
});

// PUT /api/measurement-templates/:id/reorder-fields - reorder display orders
router.put('/:id/reorder-fields', async (req, res): Promise<void> => {
  try {
    const { fieldIds } = req.body;
    if (!Array.isArray(fieldIds)) {
      res.status(400).json({ error: 'fieldIds must be an array of field IDs' });
      return;
    }
    const template = await MeasurementTemplateService.reorderFields(req.params.id, fieldIds);
    res.json(template);
  } catch (err: any) {
    console.error('Reorder fields error:', err);
    res.status(500).json({ error: err.message || 'Failed to reorder fields' });
  }
});

// POST /api/measurement-templates/:id/fields - add field to template
router.post('/:id/fields', async (req, res): Promise<void> => {
  try {
    const { field_key, field_name, field_type, default_unit, display_order, is_required, options, validation_rules } = req.body;
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
      options,
      validation_rules,
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
