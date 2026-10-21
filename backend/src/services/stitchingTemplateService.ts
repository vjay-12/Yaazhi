import { prisma } from '../db.js';

export interface DefaultAddonSpec {
  name: string;
  description?: string;
  price: number;
  is_default_selected?: boolean;
  display_order: number;
}

export interface DefaultStitchingTemplateSpec {
  name: string;
  code: string;
  garment_type: string;
  category: string;
  description: string;
  base_price: number;
  tax_rate: number;
  hsn_code: string;
  is_default: boolean;
  addons: DefaultAddonSpec[];
}

export const SOUTH_INDIAN_STITCHING_TEMPLATES: DefaultStitchingTemplateSpec[] = [
  {
    name: 'Classic Saree Blouse Stitching',
    code: 'STITCH_BLOUSE_CLASSIC',
    garment_type: 'Blouse',
    category: 'WOMEN',
    description: 'Precision atelier cut and tailoring for traditional South Indian saree blouses',
    base_price: 450,
    tax_rate: 5.0,
    hsn_code: '9988',
    is_default: true,
    addons: [
      { name: 'Pure Cotton Breathable Lining', description: 'Pre-washed cotton lining fabric and insertion', price: 150, is_default_selected: true, display_order: 1 },
      { name: 'Designer Neck / Back Cutout Pattern', description: 'Deep cut, sweetheart, or teardrop back design', price: 200, is_default_selected: false, display_order: 2 },
      { name: 'Aari & Zardosi Hand Embroidery Motif', description: 'Artisan handwork on sleeve border and back neckline', price: 1200, is_default_selected: false, display_order: 3 },
      { name: 'Contrast Piping & Dori Latkan', description: 'Matching silk piping cord and artisan tassels', price: 100, is_default_selected: false, display_order: 4 },
      { name: 'Express 24-hr Urgent Atelier Delivery', description: 'Priority rush queue delivery within 24 hours', price: 300, is_default_selected: false, display_order: 5 },
    ],
  },
  {
    name: 'Bridal Designer Saree Blouse',
    code: 'STITCH_BLOUSE_BRIDAL',
    garment_type: 'Blouse',
    category: 'WOMEN',
    description: 'Luxury bridal blouse tailoring with bespoke princess cut, cup padding, and heirloom finishing',
    base_price: 1500,
    tax_rate: 5.0,
    hsn_code: '9988',
    is_default: true,
    addons: [
      { name: 'Butter Crepe Luxury Lining', description: 'Ultra-smooth high-grade crepe lining', price: 250, is_default_selected: true, display_order: 1 },
      { name: 'Princess Cut & Padded Cups', description: 'Contoured cup inserts for seamless bridal fit', price: 350, is_default_selected: true, display_order: 2 },
      { name: 'Heavy Maggam / Kanchipuram Gold Work', description: 'Intricate bridal gold threadwork across sleeves and front', price: 3500, is_default_selected: false, display_order: 3 },
      { name: 'Handcrafted Beaded Tassels & Latkan', description: 'Custom hand-stitched beads and potli latkans', price: 250, is_default_selected: false, display_order: 4 },
      { name: 'Express 48-hr Urgent Atelier Delivery', description: 'Rush priority fitting and bridal delivery', price: 500, is_default_selected: false, display_order: 5 },
    ],
  },
  {
    name: 'Churidar / Salwar Suit Tailoring',
    code: 'STITCH_CHURIDAR_SUIT',
    garment_type: 'Chudidar',
    category: 'WOMEN',
    description: 'Complete 2-piece kameez and churidar/salwar tailored to client fitting profile',
    base_price: 750,
    tax_rate: 5.0,
    hsn_code: '9988',
    is_default: true,
    addons: [
      { name: 'Kameez Pure Cotton Lining', description: 'Full bodice lining for comfort and drape', price: 200, is_default_selected: true, display_order: 1 },
      { name: 'Salwar / Pant Lining', description: 'Inner soft cotton lining for bottom wear', price: 150, is_default_selected: false, display_order: 2 },
      { name: 'Neckline Lace & Button Detailing', description: 'Gota patti, zari lace, or fabric covered buttons', price: 180, is_default_selected: false, display_order: 3 },
      { name: 'Inseam Functional Side Pocket', description: 'Concealed deep pocket in bottom garment', price: 100, is_default_selected: false, display_order: 4 },
      { name: 'Express 24-hr Urgent Atelier Delivery', description: 'Priority rush queue delivery', price: 350, is_default_selected: false, display_order: 5 },
    ],
  },
  {
    name: 'Straight & A-Line Kurti Stitching',
    code: 'STITCH_KURTI_CUSTOM',
    garment_type: 'Kurti',
    category: 'WOMEN',
    description: 'Designer daily & festive kurti stitching with custom necklines and side slits',
    base_price: 550,
    tax_rate: 5.0,
    hsn_code: '9988',
    is_default: true,
    addons: [
      { name: 'Full Bodice Cotton Lining', description: 'Breathable inner lining cloth', price: 180, is_default_selected: false, display_order: 1 },
      { name: 'Slit & Hem Contrast Piping', description: 'Satin or silk piping along slits and bottom edge', price: 80, is_default_selected: false, display_order: 2 },
      { name: 'Artisan Yoke Threadwork / Embroidery', description: 'Front chest panel resham thread embroidery', price: 450, is_default_selected: false, display_order: 3 },
      { name: 'Concealed Side Pocket', description: 'Functional side pocket for phone/keys', price: 100, is_default_selected: false, display_order: 4 },
      { name: 'Express Urgent Delivery', description: 'Next-day atelier delivery', price: 250, is_default_selected: false, display_order: 5 },
    ],
  },
  {
    name: 'Tailored Cigarette Pants / Trousers',
    code: 'STITCH_PANTS_TROUSER',
    garment_type: 'Trousers',
    category: 'WOMEN',
    description: 'Clean-cut formal and festive cigarette trousers with elastic/belt options',
    base_price: 500,
    tax_rate: 5.0,
    hsn_code: '9988',
    is_default: true,
    addons: [
      { name: 'Half Thigh Lining', description: 'Smooth inner lining preventing cling', price: 120, is_default_selected: false, display_order: 1 },
      { name: 'Concealed Side Zipper & Hook Fastener', description: 'YKK invisible zipper and metal hook waistband', price: 80, is_default_selected: true, display_order: 2 },
      { name: 'Dual Side Slash Pockets', description: 'Two deep functional pockets', price: 150, is_default_selected: false, display_order: 3 },
      { name: 'Bottom Hem Slit with Button / Lace', description: 'Ankle hem side slit detailing', price: 100, is_default_selected: false, display_order: 4 },
    ],
  },
  {
    name: 'Bespoke Button-Down Shirt',
    code: 'STITCH_SHIRT_BESPOKE',
    garment_type: 'Shirt',
    category: 'UNISEX',
    description: 'Tailored formal & silk shirt with reinforced collar, sleeve cuffs, and French seams',
    base_price: 650,
    tax_rate: 5.0,
    hsn_code: '9988',
    is_default: true,
    addons: [
      { name: 'Fused Stiff Collar & Cuff Interlining', description: 'Crisp shape retention German interlining', price: 150, is_default_selected: true, display_order: 1 },
      { name: 'Premium Mother-of-Pearl Buttons', description: 'Genuine iridescent shell buttons', price: 200, is_default_selected: false, display_order: 2 },
      { name: 'Monogram Hand Embroidery', description: 'Personalized 2-letter monogram on cuff or chest', price: 250, is_default_selected: false, display_order: 3 },
      { name: 'French Cuffs / Double Cuffs', description: 'Cufflink-ready double folded cuffs', price: 150, is_default_selected: false, display_order: 4 },
    ],
  },
];

export interface StitchingTemplateFilterParams {
  category?: string;
  garment_type?: string;
  include_archived?: boolean;
  search?: string;
}

export class StitchingTemplateService {
  /**
   * Ensures standard boutique stitching templates and add-ons exist in database.
   */
  static async ensureDefaultTemplates() {
    for (const spec of SOUTH_INDIAN_STITCHING_TEMPLATES) {
      const existing = await prisma.stitchingTemplate.findUnique({
        where: { code: spec.code },
        include: { addons: true },
      });

      if (!existing) {
        await prisma.stitchingTemplate.create({
          data: {
            name: spec.name,
            code: spec.code,
            garment_type: spec.garment_type,
            category: spec.category,
            description: spec.description,
            base_price: spec.base_price,
            tax_rate: spec.tax_rate,
            hsn_code: spec.hsn_code,
            is_default: true,
            is_active: true,
            is_archived: false,
            addons: {
              create: spec.addons.map((a) => ({
                name: a.name,
                description: a.description || null,
                price: a.price,
                is_default_selected: Boolean(a.is_default_selected),
                display_order: a.display_order,
                is_active: true,
              })),
            },
          },
        });
      }
    }
  }

  static async getAllTemplates(filters?: StitchingTemplateFilterParams) {
    await this.ensureDefaultTemplates();

    const params = filters || {};
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

    return prisma.stitchingTemplate.findMany({
      where: whereClause,
      include: {
        addons: {
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
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
    return prisma.stitchingTemplate.findUnique({
      where: { id },
      include: {
        addons: {
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
        },
      },
    });
  }

  static async createTemplate(data: {
    name: string;
    garment_type: string;
    category?: string;
    description?: string | null;
    base_price: number | string;
    tax_rate?: number | string;
    hsn_code?: string | null;
    addons?: Array<{
      name: string;
      description?: string | null;
      price: number | string;
      is_default_selected?: boolean;
      display_order?: number;
    }>;
  }) {
    const rawCode = data.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20);
    const code = `STITCH_${rawCode}_${Date.now().toString().slice(-4)}`;

    const numBasePrice = Number(data.base_price) || 0;
    const numTaxRate = data.tax_rate !== undefined ? Number(data.tax_rate) : 5.0;

    return prisma.stitchingTemplate.create({
      data: {
        name: data.name.trim(),
        code,
        garment_type: data.garment_type || 'Blouse',
        category: data.category || 'WOMEN',
        description: data.description ? data.description.trim() : null,
        base_price: numBasePrice,
        tax_rate: numTaxRate,
        hsn_code: data.hsn_code || '9988',
        is_default: false,
        is_active: true,
        is_archived: false,
        addons: {
          create: (data.addons || []).map((a, idx) => ({
            name: a.name.trim(),
            description: a.description ? a.description.trim() : null,
            price: Number(a.price) || 0,
            is_default_selected: Boolean(a.is_default_selected),
            display_order: a.display_order ?? (idx + 1),
            is_active: true,
          })),
        },
      },
      include: {
        addons: {
          orderBy: { display_order: 'asc' },
        },
      },
    });
  }

  static async updateTemplate(id: string, data: {
    name?: string;
    garment_type?: string;
    category?: string;
    description?: string | null;
    base_price?: number | string;
    tax_rate?: number | string;
    hsn_code?: string | null;
    addons?: Array<{
      id?: string;
      name: string;
      description?: string | null;
      price: number | string;
      is_default_selected?: boolean;
      display_order?: number;
    }>;
  }) {
    // If addons are provided, sync cleanly
    if (data.addons && Array.isArray(data.addons)) {
      const incomingAddons = data.addons;
      const incomingIds = incomingAddons.filter((a) => a.id).map((a) => a.id as string);

      // Soft deactivate omitted addons
      await prisma.stitchingAddon.updateMany({
        where: {
          template_id: id,
          id: { notIn: incomingIds },
        },
        data: { is_active: false },
      });

      for (let i = 0; i < incomingAddons.length; i++) {
        const a = incomingAddons[i];
        const displayOrder = a.display_order ?? (i + 1);
        const price = Number(a.price) || 0;

        if (a.id) {
          await prisma.stitchingAddon.update({
            where: { id: a.id },
            data: {
              name: a.name.trim(),
              description: a.description ? a.description.trim() : null,
              price,
              is_default_selected: Boolean(a.is_default_selected),
              display_order: displayOrder,
              is_active: true,
            },
          });
        } else {
          await prisma.stitchingAddon.create({
            data: {
              template_id: id,
              name: a.name.trim(),
              description: a.description ? a.description.trim() : null,
              price,
              is_default_selected: Boolean(a.is_default_selected),
              display_order: displayOrder,
              is_active: true,
            },
          });
        }
      }
    }

    return prisma.stitchingTemplate.update({
      where: { id },
      data: {
        ...(data.name ? { name: data.name.trim() } : {}),
        ...(data.garment_type ? { garment_type: data.garment_type } : {}),
        ...(data.category ? { category: data.category } : {}),
        ...(data.description !== undefined ? { description: data.description ? data.description.trim() : null } : {}),
        ...(data.base_price !== undefined ? { base_price: Number(data.base_price) || 0 } : {}),
        ...(data.tax_rate !== undefined ? { tax_rate: Number(data.tax_rate) || 0 } : {}),
        ...(data.hsn_code !== undefined ? { hsn_code: data.hsn_code } : {}),
      },
      include: {
        addons: {
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
        },
      },
    });
  }

  static async duplicateTemplate(id: string) {
    const original = await prisma.stitchingTemplate.findUnique({
      where: { id },
      include: {
        addons: {
          where: { is_active: true },
          orderBy: { display_order: 'asc' },
        },
      },
    });

    if (!original) {
      throw new Error('Stitching template to duplicate not found');
    }

    const rawCode = original.code.replace(/^STITCH_/, '').slice(0, 15);
    const newCode = `STITCH_CP_${rawCode}_${Date.now().toString().slice(-4)}`;
    const newName = `${original.name} (Copy)`;

    return prisma.stitchingTemplate.create({
      data: {
        name: newName,
        code: newCode,
        garment_type: original.garment_type,
        category: original.category,
        description: original.description ? `Copy of ${original.description}` : `Duplicated from ${original.name}`,
        base_price: original.base_price,
        tax_rate: original.tax_rate,
        hsn_code: original.hsn_code,
        is_default: false,
        is_active: true,
        is_archived: false,
        addons: {
          create: original.addons.map((a, idx) => ({
            name: a.name,
            description: a.description,
            price: a.price,
            is_default_selected: a.is_default_selected,
            display_order: a.display_order ?? (idx + 1),
            is_active: true,
          })),
        },
      },
      include: {
        addons: {
          orderBy: { display_order: 'asc' },
        },
      },
    });
  }

  static async archiveTemplate(id: string) {
    return prisma.stitchingTemplate.update({
      where: { id },
      data: {
        is_archived: true,
        is_active: false,
        archived_at: new Date(),
      },
    });
  }

  static async restoreTemplate(id: string) {
    return prisma.stitchingTemplate.update({
      where: { id },
      data: {
        is_archived: false,
        is_active: true,
        archived_at: null,
      },
    });
  }

  static async deleteTemplate(id: string) {
    return prisma.stitchingTemplate.delete({
      where: { id },
    });
  }

  static async addAddon(templateId: string, addon: {
    name: string;
    description?: string | null;
    price: number | string;
    is_default_selected?: boolean;
    display_order?: number;
  }) {
    const template = await prisma.stitchingTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new Error('Stitching template not found');

    const maxOrder = await prisma.stitchingAddon.aggregate({
      where: { template_id: templateId },
      _max: { display_order: true },
    });

    return prisma.stitchingAddon.create({
      data: {
        template_id: templateId,
        name: addon.name.trim(),
        description: addon.description ? addon.description.trim() : null,
        price: Number(addon.price) || 0,
        is_default_selected: Boolean(addon.is_default_selected),
        display_order: addon.display_order ?? ((maxOrder._max.display_order || 0) + 1),
        is_active: true,
      },
    });
  }

  static async updateAddon(templateId: string, addonId: string, updates: {
    name?: string;
    description?: string | null;
    price?: number | string;
    is_default_selected?: boolean;
    display_order?: number;
    is_active?: boolean;
  }) {
    return prisma.stitchingAddon.update({
      where: {
        id: addonId,
        template_id: templateId,
      },
      data: {
        ...(updates.name ? { name: updates.name.trim() } : {}),
        ...(updates.description !== undefined ? { description: updates.description ? updates.description.trim() : null } : {}),
        ...(updates.price !== undefined ? { price: Number(updates.price) || 0 } : {}),
        ...(updates.is_default_selected !== undefined ? { is_default_selected: Boolean(updates.is_default_selected) } : {}),
        ...(updates.display_order !== undefined ? { display_order: updates.display_order } : {}),
        ...(updates.is_active !== undefined ? { is_active: updates.is_active } : {}),
      },
    });
  }

  static async removeAddon(templateId: string, addonId: string) {
    return prisma.stitchingAddon.update({
      where: {
        id: addonId,
        template_id: templateId,
      },
      data: { is_active: false },
    });
  }
}
