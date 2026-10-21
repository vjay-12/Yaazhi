import { prisma } from '../db.js';

export interface DefaultFieldSpec {
  field_key: string;
  field_name: string;
  field_type: 'number' | 'text' | 'dropdown' | 'tailor_instruction';
  default_unit: 'in' | 'cm' | '';
  display_order: number;
  is_required: boolean;
  options?: string;
  validation_rules?: string;
}

export interface DefaultTemplateSpec {
  name: string;
  code: string;
  garment_type: string;
  category: string;
  description: string;
  is_default: boolean;
  fields: DefaultFieldSpec[];
}

export const SOUTH_INDIAN_DEFAULT_TEMPLATES: DefaultTemplateSpec[] = [
  {
    name: 'Saree Blouse',
    code: 'SAREE_BLOUSE',
    garment_type: 'Blouse',
    category: 'WOMEN',
    description: 'Traditional & designer South Indian saree blouse tailoring template',
    is_default: true,
    fields: [
      { field_key: 'blouse_length', field_name: 'Blouse Length', field_type: 'number', default_unit: 'in', display_order: 1, is_required: true, validation_rules: '{"min":10,"max":25,"placeholder":"e.g. 14.5"}' },
      { field_key: 'shoulder', field_name: 'Shoulder Width', field_type: 'number', default_unit: 'in', display_order: 2, is_required: true, validation_rules: '{"min":10,"max":22,"placeholder":"e.g. 14.0"}' },
      { field_key: 'upper_bust', field_name: 'Upper Bust / Upper Chest', field_type: 'number', default_unit: 'in', display_order: 3, is_required: false, validation_rules: '{"min":24,"max":54}' },
      { field_key: 'bust', field_name: 'Bust (Chest)', field_type: 'number', default_unit: 'in', display_order: 4, is_required: true, validation_rules: '{"min":26,"max":56,"placeholder":"e.g. 36.0"}' },
      { field_key: 'under_bust', field_name: 'Under Bust (Waist)', field_type: 'number', default_unit: 'in', display_order: 5, is_required: false, validation_rules: '{"min":22,"max":50}' },
      { field_key: 'waist', field_name: 'Waist', field_type: 'number', default_unit: 'in', display_order: 6, is_required: true, validation_rules: '{"min":22,"max":50,"placeholder":"e.g. 30.0"}' },
      { field_key: 'armhole', field_name: 'Armhole Circumference', field_type: 'number', default_unit: 'in', display_order: 7, is_required: true, validation_rules: '{"min":10,"max":26,"placeholder":"e.g. 16.0"}' },
      { field_key: 'bicep', field_name: 'Bicep', field_type: 'number', default_unit: 'in', display_order: 8, is_required: false, validation_rules: '{"min":8,"max":22}' },
      { field_key: 'sleeve_length', field_name: 'Sleeve Length', field_type: 'number', default_unit: 'in', display_order: 9, is_required: false, validation_rules: '{"min":4,"max":26}' },
      { field_key: 'sleeve_round', field_name: 'Sleeve Round (Opening)', field_type: 'number', default_unit: 'in', display_order: 10, is_required: false, validation_rules: '{"min":8,"max":20}' },
      { field_key: 'wrist', field_name: 'Wrist', field_type: 'number', default_unit: 'in', display_order: 11, is_required: false },
      { field_key: 'front_neck_width', field_name: 'Front Neck Width', field_type: 'number', default_unit: 'in', display_order: 12, is_required: false },
      { field_key: 'front_neck_depth', field_name: 'Front Neck Depth', field_type: 'number', default_unit: 'in', display_order: 13, is_required: false, validation_rules: '{"min":5,"max":10}' },
      { field_key: 'back_neck_width', field_name: 'Back Neck Width', field_type: 'number', default_unit: 'in', display_order: 14, is_required: false },
      { field_key: 'back_neck_depth', field_name: 'Back Neck Depth', field_type: 'number', default_unit: 'in', display_order: 15, is_required: false, validation_rules: '{"min":5,"max":14}' },
      { field_key: 'opening_type', field_name: 'Opening / Fastening Style', field_type: 'dropdown', default_unit: '', display_order: 16, is_required: false, options: 'Front Hook & Eye, Back Hook & Eye, Side Concealed Zipper, Back Potli Buttons' },
      { field_key: 'cup_padding', field_name: 'Cup Padding & Cut', field_type: 'dropdown', default_unit: '', display_order: 17, is_required: false, options: 'Regular 4-Dart, Princess Cut (No Pad), Princess Cut with Padded Cups, Katori Cut' },
      { field_key: 'apex_to_apex', field_name: 'Apex to Apex (Distance)', field_type: 'number', default_unit: 'in', display_order: 18, is_required: false },
      { field_key: 'shoulder_to_apex', field_name: 'Shoulder to Apex (Point)', field_type: 'number', default_unit: 'in', display_order: 19, is_required: false },
      { field_key: 'front_length', field_name: 'Front Length', field_type: 'number', default_unit: 'in', display_order: 20, is_required: false },
      { field_key: 'back_length', field_name: 'Back Length', field_type: 'number', default_unit: 'in', display_order: 21, is_required: false },
      { field_key: 'tailor_instructions', field_name: 'Artisan Tailor Instructions', field_type: 'tailor_instruction', default_unit: '', display_order: 22, is_required: false, validation_rules: '{"placeholder":"Special notes on piping color, latkan dori, armhole ease, or neck shape curve"}' },
    ],
  },
  {
    name: 'Churidar / Salwar',
    code: 'CHURIDAR_SALWAR',
    garment_type: 'Chudidar',
    category: 'WOMEN',
    description: 'Churidar, Salwar Kameez and Patiala suit tailoring template',
    is_default: true,
    fields: [
      { field_key: 'shoulder', field_name: 'Shoulder Width', field_type: 'number', default_unit: 'in', display_order: 1, is_required: true, validation_rules: '{"min":10,"max":22}' },
      { field_key: 'bust', field_name: 'Bust', field_type: 'number', default_unit: 'in', display_order: 2, is_required: true, validation_rules: '{"min":26,"max":56}' },
      { field_key: 'waist', field_name: 'Waist', field_type: 'number', default_unit: 'in', display_order: 3, is_required: true, validation_rules: '{"min":22,"max":52}' },
      { field_key: 'hip', field_name: 'Hip', field_type: 'number', default_unit: 'in', display_order: 4, is_required: true, validation_rules: '{"min":26,"max":60}' },
      { field_key: 'armhole', field_name: 'Armhole', field_type: 'number', default_unit: 'in', display_order: 5, is_required: true, validation_rules: '{"min":12,"max":26}' },
      { field_key: 'sleeve_length', field_name: 'Sleeve Length', field_type: 'number', default_unit: 'in', display_order: 6, is_required: false },
      { field_key: 'bicep', field_name: 'Bicep', field_type: 'number', default_unit: 'in', display_order: 7, is_required: false },
      { field_key: 'sleeve_round', field_name: 'Sleeve Round', field_type: 'number', default_unit: 'in', display_order: 8, is_required: false },
      { field_key: 'top_length', field_name: 'Top / Kurti Length', field_type: 'number', default_unit: 'in', display_order: 9, is_required: true, validation_rules: '{"min":28,"max":56}' },
      { field_key: 'pant_length', field_name: 'Pant / Salwar Length', field_type: 'number', default_unit: 'in', display_order: 10, is_required: true, validation_rules: '{"min":30,"max":48}' },
      { field_key: 'thigh', field_name: 'Thigh Round', field_type: 'number', default_unit: 'in', display_order: 11, is_required: false },
      { field_key: 'knee', field_name: 'Knee Round', field_type: 'number', default_unit: 'in', display_order: 12, is_required: false },
      { field_key: 'calf', field_name: 'Calf Round', field_type: 'number', default_unit: 'in', display_order: 13, is_required: false },
      { field_key: 'ankle', field_name: 'Ankle Round', field_type: 'number', default_unit: 'in', display_order: 14, is_required: false },
      { field_key: 'bottom_opening', field_name: 'Bottom Opening (Mori)', field_type: 'number', default_unit: 'in', display_order: 15, is_required: false },
      { field_key: 'salwar_style', field_name: 'Salwar Bottom Cut', field_type: 'dropdown', default_unit: '', display_order: 16, is_required: false, options: 'Traditional Churidar (with gathers), Straight Cigarette Pant, Semi-Patiala, Full Patiala, Palazzo' },
      { field_key: 'neck_width', field_name: 'Neck Width', field_type: 'number', default_unit: 'in', display_order: 17, is_required: false },
      { field_key: 'front_neck_depth', field_name: 'Front Neck Depth', field_type: 'number', default_unit: 'in', display_order: 18, is_required: false },
      { field_key: 'back_neck_depth', field_name: 'Back Neck Depth', field_type: 'number', default_unit: 'in', display_order: 19, is_required: false },
      { field_key: 'tailor_instructions', field_name: 'Fit & Styling Notes', field_type: 'tailor_instruction', default_unit: '', display_order: 20, is_required: false },
    ],
  },
  {
    name: 'Kurti',
    code: 'KURTI',
    garment_type: 'Kurti',
    category: 'WOMEN',
    description: 'Straight, A-line & Anarkali kurti tailoring template',
    is_default: true,
    fields: [
      { field_key: 'shoulder', field_name: 'Shoulder', field_type: 'number', default_unit: 'in', display_order: 1, is_required: true },
      { field_key: 'bust', field_name: 'Bust', field_type: 'number', default_unit: 'in', display_order: 2, is_required: true },
      { field_key: 'waist', field_name: 'Waist', field_type: 'number', default_unit: 'in', display_order: 3, is_required: true },
      { field_key: 'hip', field_name: 'Hip', field_type: 'number', default_unit: 'in', display_order: 4, is_required: true },
      { field_key: 'armhole', field_name: 'Armhole', field_type: 'number', default_unit: 'in', display_order: 5, is_required: true },
      { field_key: 'sleeve_length', field_name: 'Sleeve Length', field_type: 'number', default_unit: 'in', display_order: 6, is_required: false },
      { field_key: 'bicep', field_name: 'Bicep', field_type: 'number', default_unit: 'in', display_order: 7, is_required: false },
      { field_key: 'sleeve_round', field_name: 'Sleeve Round', field_type: 'number', default_unit: 'in', display_order: 8, is_required: false },
      { field_key: 'kurti_length', field_name: 'Kurti Length', field_type: 'number', default_unit: 'in', display_order: 9, is_required: true },
      { field_key: 'silhouette', field_name: 'Kurti Silhouette', field_type: 'dropdown', default_unit: '', display_order: 10, is_required: false, options: 'Straight Cut with Side Slits, A-Line Flare, Flared Anarkali, High-Low Hem, Angrakha Style' },
      { field_key: 'front_neck', field_name: 'Front Neck (Depth/Style)', field_type: 'number', default_unit: 'in', display_order: 11, is_required: false },
      { field_key: 'back_neck', field_name: 'Back Neck (Depth/Style)', field_type: 'number', default_unit: 'in', display_order: 12, is_required: false },
      { field_key: 'tailor_instructions', field_name: 'Slit, Yoke & Neckline Notes', field_type: 'tailor_instruction', default_unit: '', display_order: 13, is_required: false },
    ],
  },
  {
    name: 'Pants / Trouser',
    code: 'PANTS_TROUSER',
    garment_type: 'Trousers',
    category: 'WOMEN',
    description: 'Palazzo, cigarette pants, trousers and salwar bottom template',
    is_default: true,
    fields: [
      { field_key: 'waist', field_name: 'Waist', field_type: 'number', default_unit: 'in', display_order: 1, is_required: true },
      { field_key: 'hip', field_name: 'Hip', field_type: 'number', default_unit: 'in', display_order: 2, is_required: true },
      { field_key: 'rise', field_name: 'Rise (Crotch Depth)', field_type: 'number', default_unit: 'in', display_order: 3, is_required: false },
      { field_key: 'thigh', field_name: 'Thigh Round', field_type: 'number', default_unit: 'in', display_order: 4, is_required: false },
      { field_key: 'knee', field_name: 'Knee Round', field_type: 'number', default_unit: 'in', display_order: 5, is_required: false },
      { field_key: 'calf', field_name: 'Calf Round', field_type: 'number', default_unit: 'in', display_order: 6, is_required: false },
      { field_key: 'full_length', field_name: 'Full Length', field_type: 'number', default_unit: 'in', display_order: 7, is_required: true },
      { field_key: 'ankle', field_name: 'Ankle / Hem Opening', field_type: 'number', default_unit: 'in', display_order: 8, is_required: false },
      { field_key: 'bottom_opening', field_name: 'Bottom Opening Width', field_type: 'number', default_unit: 'in', display_order: 9, is_required: false },
      { field_key: 'waistband_type', field_name: 'Waistband Fastening', field_type: 'dropdown', default_unit: '', display_order: 10, is_required: false, options: 'Full Elastic Band, Front Flat Band & Back Elastic, Side Concealed Zipper, Drawstring (Nada)' },
      { field_key: 'tailor_instructions', field_name: 'Elastic / Band / Pocket Notes', field_type: 'tailor_instruction', default_unit: '', display_order: 11, is_required: false },
    ],
  },
  {
    name: 'Shirt / Blouse Top',
    code: 'SHIRT_TOP',
    garment_type: 'Shirt',
    category: 'UNISEX',
    description: 'Formal, casual shirt and tailored button-down tops',
    is_default: true,
    fields: [
      { field_key: 'collar', field_name: 'Collar / Neck', field_type: 'number', default_unit: 'in', display_order: 1, is_required: true },
      { field_key: 'chest', field_name: 'Chest', field_type: 'number', default_unit: 'in', display_order: 2, is_required: true },
      { field_key: 'waist', field_name: 'Waist', field_type: 'number', default_unit: 'in', display_order: 3, is_required: true },
      { field_key: 'hip', field_name: 'Hip', field_type: 'number', default_unit: 'in', display_order: 4, is_required: false },
      { field_key: 'shoulder', field_name: 'Shoulder', field_type: 'number', default_unit: 'in', display_order: 5, is_required: true },
      { field_key: 'sleeve_length', field_name: 'Sleeve Length', field_type: 'number', default_unit: 'in', display_order: 6, is_required: true },
      { field_key: 'bicep', field_name: 'Bicep', field_type: 'number', default_unit: 'in', display_order: 7, is_required: false },
      { field_key: 'cuff', field_name: 'Cuff / Wrist', field_type: 'number', default_unit: 'in', display_order: 8, is_required: false },
      { field_key: 'shirt_length', field_name: 'Shirt Length', field_type: 'number', default_unit: 'in', display_order: 9, is_required: true },
      { field_key: 'fit_type', field_name: 'Shirt Fit Profile', field_type: 'dropdown', default_unit: '', display_order: 10, is_required: false, options: 'Slim Fit with Back Darts, Regular Comfort Fit, Loose Kurta Fit, Tailored Atelier Fit' },
      { field_key: 'tailor_instructions', field_name: 'Collar Type & Placket Notes', field_type: 'tailor_instruction', default_unit: '', display_order: 11, is_required: false },
    ],
  },
  {
    name: 'Lehenga / Skirt',
    code: 'LEHENGA_SKIRT',
    garment_type: 'Lehenga',
    category: 'WOMEN',
    description: 'Bridal lehenga, festive skirt, and can-can flare tailoring',
    is_default: true,
    fields: [
      { field_key: 'waist', field_name: 'Waist (Navel/Tying Point)', field_type: 'number', default_unit: 'in', display_order: 1, is_required: true },
      { field_key: 'hip', field_name: 'Hip', field_type: 'number', default_unit: 'in', display_order: 2, is_required: true },
      { field_key: 'length', field_name: 'Length (Waist to Floor with Heels)', field_type: 'number', default_unit: 'in', display_order: 3, is_required: true },
      { field_key: 'ghera', field_name: 'Flare / Ghera Circumference', field_type: 'number', default_unit: 'in', display_order: 4, is_required: false },
      { field_key: 'belt_width', field_name: 'Belt / Waistband Width', field_type: 'number', default_unit: 'in', display_order: 5, is_required: false },
      { field_key: 'flare_construction', field_name: 'Flare Construction', field_type: 'dropdown', default_unit: '', display_order: 6, is_required: false, options: 'Kalidar (Panel Cut), Umbrella / Full Circle Cut, Box Pleated, Tiered Ruffle' },
      { field_key: 'cancan_layer', field_name: 'Can-Can Stiffening', field_type: 'dropdown', default_unit: '', display_order: 7, is_required: false, options: 'Single Layer Hard Can-Can, Double Layer Bridal Volume, Soft Net Volume, No Can-Can' },
      { field_key: 'tailor_instructions', field_name: 'Can-can / Kali / Latkan Notes', field_type: 'tailor_instruction', default_unit: '', display_order: 8, is_required: false },
    ],
  },
];

export interface TemplateFilterParams {
  category?: string;
  garment_type?: string;
  include_archived?: boolean;
  search?: string;
}

export class MeasurementTemplateService {
  /**
   * Ensures the South-Indian default templates exist in the database and updates garment_types.
   * Runs idempotently (only creates missing templates).
   */
  static async ensureDefaultTemplates() {
    for (const spec of SOUTH_INDIAN_DEFAULT_TEMPLATES) {
      const existing = await prisma.measurementTemplate.findUnique({
        where: { code: spec.code },
        include: { fields: true },
      });

      if (!existing) {
        await prisma.measurementTemplate.create({
          data: {
            name: spec.name,
            code: spec.code,
            garment_type: spec.garment_type,
            category: spec.category,
            description: spec.description,
            is_default: true,
            is_active: true,
            is_archived: false,
            fields: {
              create: spec.fields.map((f) => ({
                field_key: f.field_key,
                field_name: f.field_name,
                field_type: f.field_type,
                default_unit: f.default_unit || 'in',
                display_order: f.display_order,
                is_required: f.is_required,
                options: f.options || null,
                validation_rules: f.validation_rules || null,
                is_active: true,
              })),
            },
          },
        });
      } else if (!existing.garment_type) {
        // Backfill garment_type on legacy seed
        await prisma.measurementTemplate.update({
          where: { id: existing.id },
          data: {
            garment_type: spec.garment_type,
          },
        });
      }
    }
  }

  static async getAllTemplates(filters?: TemplateFilterParams | string) {
    await this.ensureDefaultTemplates();

    const params: TemplateFilterParams = typeof filters === 'string'
      ? { category: filters }
      : (filters || {});

    const whereClause: any = {};

    if (!params.include_archived) {
      whereClause.is_archived = false;
      whereClause.is_active = true;
    }

    if (params.category && params.category !== 'ALL') {
      whereClause.category = params.category;
    }

    if (params.garment_type && params.garment_type !== 'ALL') {
      whereClause.garment_type = params.garment_type;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      whereClause.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { garment_type: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
      ];
    }

    return prisma.measurementTemplate.findMany({
      where: whereClause,
      include: {
        fields: {
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
        },
        _count: {
          select: {
            profiles: true,
          },
        },
      },
      orderBy: [
        { is_archived: 'asc' },
        { is_default: 'desc' },
        { name: 'asc' },
      ],
    });
  }

  static async getTemplateById(id: string) {
    return prisma.measurementTemplate.findUnique({
      where: { id },
      include: {
        fields: {
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
        },
        _count: {
          select: {
            profiles: true,
          },
        },
      },
    });
  }

  static async createCustomTemplate(data: {
    name: string;
    garment_type?: string;
    description?: string | null;
    category?: string;
    fields?: Array<{
      field_key?: string;
      field_name: string;
      field_type?: 'number' | 'text' | 'dropdown' | 'tailor_instruction';
      default_unit?: string;
      display_order?: number;
      is_required?: boolean;
      options?: string | null;
      validation_rules?: string | null;
    }>;
  }) {
    const rawCode = data.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20);
    const code = `CUSTOM_${rawCode}_${Date.now().toString().slice(-4)}`;

    return prisma.measurementTemplate.create({
      data: {
        name: data.name.trim(),
        code,
        garment_type: data.garment_type || 'Other',
        description: data.description ? data.description.trim() : null,
        category: data.category || 'WOMEN',
        is_default: false,
        is_active: true,
        is_archived: false,
        fields: {
          create: (data.fields || []).map((f, index) => ({
            field_key: f.field_key || f.field_name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30) || `field_${index + 1}`,
            field_name: f.field_name.trim(),
            field_type: f.field_type || 'number',
            default_unit: f.default_unit ?? 'in',
            display_order: f.display_order ?? (index + 1),
            is_required: Boolean(f.is_required),
            options: f.options || null,
            validation_rules: f.validation_rules || null,
            is_active: true,
          })),
        },
      },
      include: {
        fields: {
          orderBy: { display_order: 'asc' },
        },
        _count: {
          select: { profiles: true },
        },
      },
    });
  }

  static async updateTemplate(id: string, data: {
    name?: string;
    garment_type?: string;
    description?: string | null;
    category?: string;
    fields?: Array<{
      id?: string;
      field_key?: string;
      field_name: string;
      field_type?: string;
      default_unit?: string;
      display_order?: number;
      is_required?: boolean;
      options?: string | null;
      validation_rules?: string | null;
    }>;
  }) {
    // If fields are provided in the payload, perform a clean sync without breaking historical relations
    if (data.fields && Array.isArray(data.fields)) {
      const incomingFields = data.fields;
      const incomingIds = incomingFields.filter(f => f.id).map(f => f.id as string);

      // Deactivate omitted fields instead of hard-deleting
      await prisma.measurementTemplateField.updateMany({
        where: {
          template_id: id,
          id: { notIn: incomingIds },
        },
        data: { is_active: false },
      });

      // Upsert incoming fields
      for (let i = 0; i < incomingFields.length; i++) {
        const f = incomingFields[i];
        const displayOrder = f.display_order ?? (i + 1);
        const fieldKey = f.field_key || f.field_name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 30) || `field_${i + 1}`;

        if (f.id) {
          await prisma.measurementTemplateField.update({
            where: { id: f.id },
            data: {
              field_name: f.field_name.trim(),
              field_type: f.field_type || 'number',
              default_unit: f.default_unit ?? 'in',
              display_order: displayOrder,
              is_required: Boolean(f.is_required),
              options: f.options || null,
              validation_rules: f.validation_rules || null,
              is_active: true,
            },
          });
        } else {
          await prisma.measurementTemplateField.create({
            data: {
              template_id: id,
              field_key: `${fieldKey}_${Date.now().toString().slice(-4)}`,
              field_name: f.field_name.trim(),
              field_type: f.field_type || 'number',
              default_unit: f.default_unit ?? 'in',
              display_order: displayOrder,
              is_required: Boolean(f.is_required),
              options: f.options || null,
              validation_rules: f.validation_rules || null,
              is_active: true,
            },
          });
        }
      }
    }

    return prisma.measurementTemplate.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.garment_type ? { garment_type: data.garment_type } : {}),
        ...(data.description !== undefined ? { description: data.description ? data.description.trim() : null } : {}),
        ...(data.category ? { category: data.category } : {}),
      },
      include: {
        fields: {
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
        },
        _count: {
          select: { profiles: true },
        },
      },
    });
  }

  static async duplicateTemplate(id: string) {
    const original = await prisma.measurementTemplate.findUnique({
      where: { id },
      include: {
        fields: {
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
        },
      },
    });

    if (!original) {
      throw new Error('Template to duplicate not found');
    }

    const rawCode = original.code.replace(/^CUSTOM_/, '').slice(0, 15);
    const newCode = `COPY_${rawCode}_${Date.now().toString().slice(-4)}`;
    const newName = `${original.name} (Copy)`;

    return prisma.measurementTemplate.create({
      data: {
        name: newName,
        code: newCode,
        garment_type: original.garment_type || 'Other',
        category: original.category,
        description: original.description ? `Copy of ${original.description}` : `Duplicated from ${original.name}`,
        is_default: false,
        is_active: true,
        is_archived: false,
        fields: {
          create: original.fields.map((f, idx) => ({
            field_key: `${f.field_key}_cp${idx + 1}`,
            field_name: f.field_name,
            field_type: f.field_type,
            default_unit: f.default_unit,
            display_order: f.display_order,
            is_required: f.is_required,
            options: f.options,
            validation_rules: f.validation_rules,
            is_active: true,
          })),
        },
      },
      include: {
        fields: {
          orderBy: { display_order: 'asc' },
        },
        _count: {
          select: { profiles: true },
        },
      },
    });
  }

  static async archiveTemplate(id: string) {
    return prisma.measurementTemplate.update({
      where: { id },
      data: {
        is_archived: true,
        is_active: false,
        archived_at: new Date(),
      },
    });
  }

  static async restoreTemplate(id: string) {
    return prisma.measurementTemplate.update({
      where: { id },
      data: {
        is_archived: false,
        is_active: true,
        archived_at: null,
      },
    });
  }

  static async deleteTemplate(id: string) {
    // Check if referenced by existing customer profiles
    const profileCount = await prisma.customerMeasurementProfile.count({
      where: { template_id: id },
    });

    if (profileCount > 0) {
      throw new Error(
        `Cannot delete this template because it is referenced by ${profileCount} customer measurement profile(s). Please archive it instead to safeguard client measurement records.`
      );
    }

    return prisma.measurementTemplate.delete({
      where: { id },
    });
  }

  static async reorderFields(templateId: string, orderedFieldIds: string[]) {
    const updates = orderedFieldIds.map((fieldId, index) =>
      prisma.measurementTemplateField.update({
        where: { id: fieldId, template_id: templateId },
        data: { display_order: index + 1 },
      })
    );
    await prisma.$transaction(updates);
    return this.getTemplateById(templateId);
  }

  static async addField(templateId: string, field: {
    field_key?: string;
    field_name: string;
    field_type?: 'number' | 'text' | 'dropdown' | 'tailor_instruction';
    default_unit?: string;
    display_order?: number;
    is_required?: boolean;
    options?: string | null;
    validation_rules?: string | null;
  }) {
    const template = await prisma.measurementTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new Error('Template not found');

    const maxOrder = await prisma.measurementTemplateField.aggregate({
      where: { template_id: templateId },
      _max: { display_order: true },
    });

    const baseKey = field.field_key || field.field_name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 24);
    const fieldKey = `${baseKey}_${Date.now().toString().slice(-4)}`;

    return prisma.measurementTemplateField.create({
      data: {
        template_id: templateId,
        field_key: fieldKey,
        field_name: field.field_name.trim(),
        field_type: field.field_type || 'number',
        default_unit: field.default_unit ?? 'in',
        display_order: field.display_order ?? ((maxOrder._max.display_order || 0) + 1),
        is_required: Boolean(field.is_required),
        options: field.options || null,
        validation_rules: field.validation_rules || null,
        is_active: true,
      },
    });
  }

  static async updateField(templateId: string, fieldId: string, updates: {
    field_name?: string;
    field_type?: 'number' | 'text' | 'dropdown' | 'tailor_instruction';
    default_unit?: string;
    display_order?: number;
    is_required?: boolean;
    options?: string | null;
    validation_rules?: string | null;
    is_active?: boolean;
  }) {
    return prisma.measurementTemplateField.update({
      where: {
        id: fieldId,
        template_id: templateId,
      },
      data: updates,
    });
  }

  static async removeField(templateId: string, fieldId: string) {
    // Soft disable to preserve historical references
    return prisma.measurementTemplateField.update({
      where: {
        id: fieldId,
        template_id: templateId,
      },
      data: { is_active: false },
    });
  }
}
