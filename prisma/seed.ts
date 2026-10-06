import { PrismaClient, MovementType, POStatus, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('✨ Seeding Yaazhi Boutique PostgreSQL Database...');

  // 1. Company Settings
  await prisma.companySettings.upsert({
    where: { id: 'yaazhi_settings' },
    update: {},
    create: {
      id: 'yaazhi_settings',
      company_name: 'Yaazhi Boutique & Atelier',
      legal_name: 'Yaazhi Silks & Couture Pvt Ltd',
      phone: '+91 94440 12890',
      email: 'atelier@yaazhi.in',
      address: '42 Weaver Colony, Little Kanchipuram',
      state_code: '33', // Tamil Nadu
      gstin: '33AABCY1234A1Z5',
      enable_gst: true,
    },
  });

  // 2. Boutique Showrooms / Godowns
  const showroomMain = await prisma.godown.upsert({
    where: { code: 'SR-01' },
    update: {},
    create: {
      name: 'Main Showroom Counter',
      code: 'SR-01',
      address: 'Ground Floor, 42 Weaver Colony, Kanchipuram',
      state_code: '33',
      gstin: '33AABCY1234A1Z5',
      is_default: true,
      is_active: true,
    },
  });

  const sildVault = await prisma.godown.upsert({
    where: { code: 'SV-02' },
    update: {},
    create: {
      name: 'Silk Vault & Bridal Salon',
      code: 'SV-02',
      address: '1st Floor Bridal Suite, Kanchipuram',
      state_code: '33',
      gstin: '33AABCY1234A1Z5',
      is_default: false,
      is_active: true,
    },
  });

  // 3. Product Categories
  const categoryNames = [
    { name: 'Sarees', desc: 'Handloom Kanchipuram, Banarasi, and Chettinad drapes' },
    { name: 'Churidars & Salwars', desc: 'Raw silk and designer unstitched and stitched suits' },
    { name: 'Kurtis & Tunics', desc: 'Daily elegance and festive pure cotton and silk kurtis' },
    { name: 'Dupattas & Stoles', desc: 'Kantha, Banarasi tanchoi, and organza dupattas' },
    { name: 'Blouses & Corsets', desc: 'Hand-embroidered Aari and zardozi bridal blouses' },
    { name: 'Dress Materials', desc: 'Unstitched handloom yardage and running fabrics' },
    { name: 'Boutique Accessories', desc: 'Potli bags, temple borders, and bridal waistbands' },
  ];

  const categoryMap = new Map<string, string>();
  for (const cat of categoryNames) {
    const c = await prisma.productCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name, description: cat.desc },
    });
    categoryMap.set(cat.name, c.id);
  }

  // 4. Measurement Templates
  const blouseTemplate = await prisma.measurementTemplate.upsert({
    where: { code: 'BLOUSE-STD' },
    update: {},
    create: {
      name: 'Saree Blouse Fitting Template',
      code: 'BLOUSE-STD',
      description: 'Standard 8-point measurement for South Indian tailored saree blouses',
      category: 'WOMEN',
      is_default: true,
      is_active: true,
      fields: {
        create: [
          { field_key: 'bust', field_name: 'Bust (Chest)', display_order: 1, is_required: true },
          { field_key: 'under_bust', field_name: 'Under Bust (Waist)', display_order: 2, is_required: true },
          { field_key: 'shoulder', field_name: 'Shoulder Width', display_order: 3, is_required: true },
          { field_key: 'armhole', field_name: 'Armhole Circumference', display_order: 4, is_required: true },
          { field_key: 'sleeve_length', field_name: 'Sleeve Length', display_order: 5, is_required: true },
          { field_key: 'sleeve_round', field_name: 'Sleeve Round (Bicep)', display_order: 6, is_required: true },
          { field_key: 'front_neck', field_name: 'Front Neck Depth', display_order: 7, is_required: true },
          { field_key: 'back_neck', field_name: 'Back Neck Depth', display_order: 8, is_required: true },
          { field_key: 'blouse_length', field_name: 'Blouse Total Length', display_order: 9, is_required: true },
        ],
      },
    },
    include: { fields: true },
  });

  // 5. Suppliers (Weavers & Vendors)
  const vendorWeaver = await prisma.supplier.upsert({
    where: { id: 'ven-001' },
    update: {},
    create: {
      id: 'ven-001',
      name: 'Sri Murugan Handloom Weavers Guild',
      contact_person: 'Master Weaver Shanmugam',
      category: 'Master Weaver',
      vendor_type: 'Fabric Supplier',
      notes: 'Heritage pure mulberry silk and pure silver zari certified looms in Siruvanthadu',
      phone: '+91 94432 88123',
      email: 'shanmugam@muruganlooms.in',
      address: '12 Sannathi Street, Little Kanchipuram',
      city: 'Kanchipuram',
      state: 'Tamil Nadu',
      state_code: '33',
      gstin: '33AABCS8891A1Z2',
      is_active: true,
    },
  });

  const vendorLace = await prisma.supplier.upsert({
    where: { id: 'ven-002' },
    update: {},
    create: {
      id: 'ven-002',
      name: 'Kaveri Fabrics & Borders',
      contact_person: 'Kavya Ramesh',
      category: 'Lace & Trim',
      vendor_type: 'Lace / Border Supplier',
      notes: 'Zari borders, cutwork lace, temple borders, and pure tissue fabric',
      phone: '+91 98402 33444',
      email: 'sales@kaveriborders.in',
      address: '8 Weaver Colony, Little Kanchipuram',
      city: 'Kanchipuram',
      state: 'Tamil Nadu',
      state_code: '33',
      gstin: '33BBBBB5678B2Z6',
      is_active: true,
    },
  });

  const vendorTextiles = await prisma.supplier.upsert({
    where: { id: 'ven-003' },
    update: {},
    create: {
      id: 'ven-003',
      name: 'Sri Lakshmi Textiles',
      contact_person: 'Lakshmi Narayanan',
      category: 'Textile Mill',
      vendor_type: 'Fabric Supplier',
      notes: 'Vellore and Arani pure silk and mercerized cotton yarn',
      phone: '+91 98401 11222',
      email: 'orders@srilakshmitextiles.in',
      address: '14 Katpadi Road, Near Old Bus Stand',
      city: 'Vellore',
      state: 'Tamil Nadu',
      state_code: '33',
      gstin: '33AAAAA1234A1Z5',
      is_active: true,
    },
  });

  // 6. Customers
  const custPriya = await prisma.customer.upsert({
    where: { id: 'cust-001' },
    update: {},
    create: {
      id: 'cust-001',
      name: 'Priya Sundaram',
      phone: '+91 98401 23456',
      email: 'priya.sundaram@gmail.com',
      address: 'B-402, Shanthi Vihar, Alwarpet',
      city: 'Chennai',
      state_code: '33',
      notes: 'Bridal client; prefers Muthu Kattam checks and deep peacock green with gold zari',
      measurement_profiles: {
        create: {
          template_id: blouseTemplate.id,
          profile_name: 'Priya - Standard Silk Blouse (Puff Sleeve)',
          notes: 'High neck front, deep U back with dori latkan, 1.5 in margin on sides',
          versions: {
            create: {
              version_number: 1,
              measured_by: 'Master Tailor Selvam',
              notes: 'Initial bridal trial fitting at Atelier',
              values: {
                create: blouseTemplate.fields.map((f) => ({
                  field_id: f.id,
                  numeric_value: f.field_key === 'bust' ? 36.0 : f.field_key === 'under_bust' ? 31.0 : f.field_key === 'shoulder' ? 14.5 : f.field_key === 'armhole' ? 16.0 : f.field_key === 'sleeve_length' ? 10.5 : f.field_key === 'front_neck' ? 7.0 : f.field_key === 'back_neck' ? 9.5 : 14.0,
                  unit: 'in',
                })),
              },
            },
          },
        },
      },
    },
  });

  await prisma.customer.upsert({
    where: { id: 'cust-002' },
    update: {},
    create: {
      id: 'cust-002',
      name: 'Ananya Krishnan',
      phone: '+91 98412 98765',
      email: 'ananya.k@outlook.com',
      address: '14 Race Course Road',
      city: 'Coimbatore',
      state_code: '33',
      notes: 'Festive wardrobe collector; prefers pastel and Chettinad earth tones',
    },
  });

  await prisma.customer.upsert({
    where: { id: 'cust-003' },
    update: {},
    create: {
      id: 'cust-003',
      name: 'Meenakshi Ramachandran',
      phone: '+91 94421 55667',
      email: 'meenakshi.r@yahoo.com',
      address: '88 North Mada Street, Mylapore',
      city: 'Chennai',
      state_code: '33',
      notes: 'Long-standing boutique client since 2018',
    },
  });

  // 7. Products & Opening Stock
  const productsList = [
    {
      sku: 'YZ-KAN-001',
      name: 'Kanchipuram Pure Silk Bridal Saree (Muthu Kattam)',
      description: 'Handwoven pure mulberry silk with korvai contrast borders, woven with certified silver zari in pearl check pattern',
      fabric: 'Pure Mulberry Silk (SilkWark Certified)',
      craft: 'Kanchipuram Korvai Handloom',
      category_id: categoryMap.get('Sarees'),
      unit: 'PCS',
      purchase_price: 18500,
      sale_price: 28500,
      hsn_code: '5007',
      tax_rate: 5.0,
      min_stock_level: 3,
      image_url: '/images/products/kanchipuram-silk-saree.jpg',
      mainStock: 4,
      vaultStock: 2,
    },
    {
      sku: 'YZ-CHT-002',
      name: 'Chettinad Cotton Handloom Saree (Aayirampadi)',
      description: 'Traditional 80s count combed cotton saree featuring thousand-steps border and temple motif thazhampoo selavu',
      fabric: 'Combed Mercerized Cotton 80s count',
      craft: 'Chettinad Pitloom Weave',
      category_id: categoryMap.get('Sarees'),
      unit: 'PCS',
      purchase_price: 1450,
      sale_price: 2800,
      hsn_code: '5208',
      tax_rate: 5.0,
      min_stock_level: 5,
      image_url: '/images/products/chettinad-cotton-saree.jpg',
      mainStock: 14,
      vaultStock: 0,
    },
    {
      sku: 'YZ-CHU-003',
      name: 'Designer Raw Silk Chudidar Suit Set (Aari Embroidery)',
      description: 'Unstitched 3-piece suit set in pure raw silk with intricate neckline and sleeve cuff bullion stitch aari work',
      fabric: 'Pure Matka Raw Silk with Organza Dupatta',
      craft: 'Hand Aari & Zardozi Needlework',
      category_id: categoryMap.get('Churidars & Salwars'),
      unit: 'SET',
      purchase_price: 5200,
      sale_price: 9400,
      hsn_code: '6204',
      tax_rate: 12.0,
      min_stock_level: 2,
      image_url: '/images/products/chudidar-suit-set.jpg',
      mainStock: 1,
      vaultStock: 0,
    },
    {
      sku: 'YZ-BAN-004',
      name: 'Banarasi Katan Silk Brocade Saree (Jangla Jaal)',
      description: 'Pure katan silk with all-over botanical jaal weaving in antique sona-rupa zari, rich kadhwa pallu',
      fabric: 'Katan Silk',
      craft: 'Banarasi Kadhwa Brocade',
      category_id: categoryMap.get('Sarees'),
      unit: 'PCS',
      purchase_price: 16000,
      sale_price: 24900,
      hsn_code: '5007',
      tax_rate: 5.0,
      min_stock_level: 2,
      image_url: '/images/products/banarasi-silk-saree.jpg',
      mainStock: 0,
      vaultStock: 2,
    },
    {
      sku: 'YZ-DUP-005',
      name: 'Handloom Tussar Silk Dupatta (Tribal Kantha Work)',
      description: 'Natural golden tussar silk featuring delicate running stitch pictorial kantha embroidery depicting flora & fauna',
      fabric: 'Wild Tussar Silk',
      craft: 'Bengal Kantha Embroidery',
      category_id: categoryMap.get('Dupattas & Stoles'),
      unit: 'PCS',
      purchase_price: 2200,
      sale_price: 4200,
      hsn_code: '5007',
      tax_rate: 5.0,
      min_stock_level: 4,
      image_url: '/images/products/tussar-silk-dupatta.jpg',
      mainStock: 6,
      vaultStock: 0,
    },
    {
      sku: 'YZ-MYS-006',
      name: 'Mysore Crepe Silk Gold Zari Saree',
      description: 'Pure crepe silk saree with lustrous smooth texture, rich peacock emerald body with woven pure gold zari border and traditional floral butti motifs',
      fabric: 'Pure Mysore Crepe Silk',
      craft: 'Mysore Silk Weave',
      category_id: categoryMap.get('Sarees'),
      unit: 'PCS',
      purchase_price: 7200,
      sale_price: 10500,
      hsn_code: '5007',
      tax_rate: 5.0,
      min_stock_level: 3,
      image_url: '/images/products/mysore-crepe-saree.jpg',
      mainStock: 5,
      vaultStock: 2,
    },
  ];

  for (const p of productsList) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        image_url: p.image_url,
      },
      create: {
        sku: p.sku,
        name: p.name,
        description: p.description,
        fabric: p.fabric,
        craft: p.craft,
        category: p.category_id ? { connect: { id: p.category_id } } : undefined,
        unit: p.unit,
        purchase_price: p.purchase_price,
        sale_price: p.sale_price,
        hsn_code: p.hsn_code,
        tax_rate: p.tax_rate,
        min_stock_level: p.min_stock_level,
        image_url: p.image_url,
        is_active: true,
      },
    });

    // Record opening stock balances & ledger movements
    if (p.mainStock > 0) {
      await prisma.stockBalance.upsert({
        where: {
          product_id_godown_id: {
            product_id: product.id,
            godown_id: showroomMain.id,
          },
        },
        update: { current_quantity: p.mainStock, avg_cost: p.purchase_price },
        create: {
          product_id: product.id,
          godown_id: showroomMain.id,
          current_quantity: p.mainStock,
          avg_cost: p.purchase_price,
        },
      });

      await prisma.stockMovement.create({
        data: {
          movement_type: MovementType.ADJUSTMENT_ADD,
          product_id: product.id,
          godown_id: showroomMain.id,
          quantity: p.mainStock,
          unit_cost: p.purchase_price,
          balance_after: p.mainStock,
          reference_type: 'INITIAL_STOCK',
          reference_id: 'SEED-OPENING',
          notes: 'Opening stock count for boutique launch',
          created_by: 'Boutique Manager',
        },
      });
    }

    if (p.vaultStock > 0) {
      await prisma.stockBalance.upsert({
        where: {
          product_id_godown_id: {
            product_id: product.id,
            godown_id: sildVault.id,
          },
        },
        update: { current_quantity: p.vaultStock, avg_cost: p.purchase_price },
        create: {
          product_id: product.id,
          godown_id: sildVault.id,
          current_quantity: p.vaultStock,
          avg_cost: p.purchase_price,
        },
      });

      await prisma.stockMovement.create({
        data: {
          movement_type: MovementType.ADJUSTMENT_ADD,
          product_id: product.id,
          godown_id: sildVault.id,
          quantity: p.vaultStock,
          unit_cost: p.purchase_price,
          balance_after: p.vaultStock,
          reference_type: 'INITIAL_STOCK',
          reference_id: 'SEED-OPENING',
          notes: 'Bridal Vault high-value allocation',
          created_by: 'Boutique Curator',
        },
      });
    }
  }

  // 8. Sample Purchase Order (received)
  const poCount = await prisma.purchaseOrder.count();
  if (poCount === 0) {
    const poProduct = await prisma.product.findUnique({ where: { sku: 'YZ-KAN-001' } });
    if (poProduct) {
      const po = await prisma.purchaseOrder.create({
        data: {
          po_number: 'PO-2026-0001',
          supplier_id: vendorWeaver.id,
          supplier_name: vendorWeaver.name,
          supplier_phone: vendorWeaver.phone,
          supplier_address: vendorWeaver.address,
          supplier_gstin: vendorWeaver.gstin,
          godown_id: showroomMain.id,
          order_date: new Date(Date.now() - 7 * 86400000),
          status: POStatus.RECEIVED,
          subtotal: 111000,
          tax_total: 5550,
          grand_total: 116550,
          notes: 'Pre-wedding festival order of pure zari weaves',
          items: {
            create: [
              {
                product_id: poProduct.id,
                quantity: 6,
                unit_cost: 18500,
                tax_rate: 5.0,
                tax_amount: 5550,
                total: 116550,
              },
            ],
          },
        },
      });

      // Record receipt in ledger
      await prisma.stockMovement.create({
        data: {
          movement_type: MovementType.PURCHASE_RECEIPT,
          product_id: poProduct.id,
          godown_id: showroomMain.id,
          quantity: 6,
          unit_cost: 18500,
          balance_after: 6,
          reference_type: 'PURCHASE_ORDER',
          reference_id: po.id,
          notes: `Goods receipt for PO ${po.po_number}: Sri Murugan Handloom certified lot`,
          created_by: 'Procurement Specialist',
        },
      });
    }
  }

  // 9. Exact 6 Realistic Boutique Sales Orders (BILL-2026-0001 to BILL-2026-0006)
  const soCount = await prisma.salesOrder.count();
  if (soCount === 0) {
    const kanProduct = await prisma.product.findUnique({ where: { sku: 'YZ-KAN-001' } });
    const banProduct = await prisma.product.findUnique({ where: { sku: 'YZ-BAN-004' } });
    const chtProduct = await prisma.product.findUnique({ where: { sku: 'YZ-CHT-002' } });
    const chuProduct = await prisma.product.findUnique({ where: { sku: 'YZ-CHU-003' } });
    const dupProduct = await prisma.product.findUnique({ where: { sku: 'YZ-DUP-005' } });
    const mysProduct = (await prisma.product.findFirst({ where: { name: { contains: 'Mysore' } } })) || chtProduct;

    const ordersSpec = [
      // 1. BILL-2026-0001: PAID (Single payment)
      {
        orderNumber: 'BILL-2026-0001',
        date: new Date('2026-10-02T10:30:00Z'),
        customer: custPriya,
        status: OrderStatus.DELIVERED,
        paymentStatus: 'PAID',
        notes: 'Boutique bridal appointment booking',
        items: [{ product: kanProduct!, qty: 1, price: 28500, taxRate: 5 }],
        payments: [
          {
            paymentNumber: 'PAY-2026-0001',
            date: new Date('2026-10-02T10:35:00Z'),
            amount: 29925,
            mode: 'UPI',
            status: 'Successful',
            reference: 'UPI/HDFC/2026100201',
            notes: 'Full payment via Google Pay',
          },
        ],
      },
      // 2. BILL-2026-0002: PENDING partially-paid (Multiple payments: 15,000 + 5,000 = 20,000 of 30,555)
      {
        orderNumber: 'BILL-2026-0002',
        date: new Date('2026-10-03T11:15:00Z'),
        customer: custAnanya,
        status: OrderStatus.DELIVERED,
        paymentStatus: 'PENDING',
        notes: 'Boutique festive collection pre-order',
        items: [
          { product: banProduct!, qty: 1, price: 24900, taxRate: 5 },
          { product: dupProduct!, qty: 1, price: 4200, taxRate: 5 },
        ],
        payments: [
          {
            paymentNumber: 'PAY-2026-0002',
            date: new Date('2026-10-03T11:20:00Z'),
            amount: 15000,
            mode: 'UPI',
            status: 'Successful',
            reference: 'UPI/ICICI/890123',
            notes: 'Advance booking payment via UPI',
          },
          {
            paymentNumber: 'PAY-2026-0003',
            date: new Date('2026-10-04T16:00:00Z'),
            amount: 5000,
            mode: 'Cash',
            status: 'Successful',
            reference: 'CSH-REC-0082',
            notes: 'Counter cash payment during trial',
          },
        ],
      },
      // 3. BILL-2026-0003: PENDING (0 payments made)
      {
        orderNumber: 'BILL-2026-0003',
        date: new Date('2026-10-04T14:45:00Z'),
        customer: custMeenakshi,
        status: OrderStatus.CONFIRMED,
        paymentStatus: 'PENDING',
        notes: 'Custom tailoring trial scheduled for next week',
        items: [{ product: chuProduct!, qty: 1, price: 9400, taxRate: 12 }],
        payments: [],
      },
      // 4. BILL-2026-0004: PAID (Multiple payments: 10,000 + 6,905 = 16,905 full)
      {
        orderNumber: 'BILL-2026-0004',
        date: new Date('2026-10-04T16:20:00Z'),
        customer: custPriya,
        status: OrderStatus.DELIVERED,
        paymentStatus: 'PAID',
        notes: 'Showroom VIP collection visit',
        items: [
          { product: mysProduct!, qty: 1, price: 10500, taxRate: 5 },
          { product: chtProduct!, qty: 2, price: 2800, taxRate: 5 },
        ],
        payments: [
          {
            paymentNumber: 'PAY-2026-0004',
            date: new Date('2026-10-04T16:25:00Z'),
            amount: 10000,
            mode: 'Card',
            status: 'Successful',
            reference: 'POS/AUTH/44821',
            notes: 'Initial card swipe at counter',
          },
          {
            paymentNumber: 'PAY-2026-0005',
            date: new Date('2026-10-05T12:10:00Z'),
            amount: 6905,
            mode: 'UPI',
            status: 'Successful',
            reference: 'UPI/GPAY/55490',
            notes: 'Settlement payment on collection',
          },
        ],
      },
      // 5. BILL-2026-0005: PARTIAL (Advance payment of 20,000 of 40,453)
      {
        orderNumber: 'BILL-2026-0005',
        date: new Date('2026-10-05T15:00:00Z'),
        customer: custMeenakshi,
        status: OrderStatus.CONFIRMED,
        paymentStatus: 'PARTIAL',
        notes: 'Temple car festival heritage wardrobe order',
        items: [
          { product: kanProduct!, qty: 1, price: 28500, taxRate: 5 },
          { product: chuProduct!, qty: 1, price: 9400, taxRate: 12 },
        ],
        payments: [
          {
            paymentNumber: 'PAY-2026-0006',
            date: new Date('2026-10-05T15:15:00Z'),
            amount: 20000,
            mode: 'Net Banking',
            status: 'Successful',
            reference: 'NEFT/HDFC/883419',
            notes: 'Online bank transfer advance',
          },
        ],
      },
      // 6. BILL-2026-0006: VOIDED (Historical payment preserved!)
      {
        orderNumber: 'BILL-2026-0006',
        date: new Date('2026-10-06T09:30:00Z'),
        customer: custAnanya,
        status: OrderStatus.VOIDED,
        paymentStatus: 'VOIDED',
        notes: 'Showroom reservation cancelled [VOIDED: Customer exchanged order for custom Kanchipuram weave]',
        items: [{ product: mysProduct!, qty: 1, price: 10500, taxRate: 5 }],
        payments: [
          {
            paymentNumber: 'PAY-2026-0007',
            date: new Date('2026-10-06T09:35:00Z'),
            amount: 11025,
            mode: 'Card',
            status: 'Successful',
            reference: 'POS/AUTH/99120',
            notes: 'Initial card swipe (historical payment preserved)',
          },
        ],
      },
    ];

    let invIdx = 1;
    for (const spec of ordersSpec) {
      let subtotal = 0;
      let taxTotal = 0;
      const lineItemsData = spec.items.map((it) => {
        const lineSubtotal = it.qty * it.price;
        const lineTax = (lineSubtotal * it.taxRate) / 100;
        subtotal += lineSubtotal;
        taxTotal += lineTax;
        return {
          product_id: it.product.id,
          quantity: it.qty,
          unit_price: it.price,
          discount: 0,
          tax_rate: it.taxRate,
          tax_amount: lineTax,
          total: lineSubtotal + lineTax,
        };
      });

      const grandTotal = subtotal + taxTotal;
      const paidSum = spec.payments.reduce((sum, p) => sum + p.amount, 0);
      const pendingAmount = spec.status === OrderStatus.VOIDED ? 0 : Math.max(0, grandTotal - paidSum);

      const so = await prisma.salesOrder.create({
        data: {
          order_number: spec.orderNumber,
          customer_id: spec.customer.id,
          customer_name: spec.customer.name,
          customer_phone: spec.customer.phone,
          customer_address: spec.customer.address,
          godown_id: showroomMain.id,
          order_date: spec.date,
          status: spec.status,
          subtotal,
          discount_total: 0,
          tax_total: taxTotal,
          grand_total: grandTotal,
          paid_amount: paidSum,
          pending_amount: pendingAmount,
          payment_status: spec.paymentStatus,
          notes: spec.notes,
          created_at: spec.date,
          items: { create: lineItemsData },
        },
      });

      const invoiceNumber = `INV-2026-${String(invIdx++).padStart(4, '0')}`;
      const inv = await prisma.invoice.create({
        data: {
          invoice_number: invoiceNumber,
          reference_order_id: so.id,
          customer_id: spec.customer.id,
          godown_id: showroomMain.id,
          invoice_date: spec.date,
          status: spec.status === OrderStatus.VOIDED ? 'VOID' : spec.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
          subtotal,
          discount_total: 0,
          tax_total: taxTotal,
          grand_total: grandTotal,
          paid_amount: paidSum,
          balance_amount: pendingAmount,
          created_at: spec.date,
        },
      });

      for (const pay of spec.payments) {
        await prisma.payment.create({
          data: {
            payment_number: pay.paymentNumber,
            sales_order_id: so.id,
            invoice_id: inv.id,
            customer_id: spec.customer.id,
            payment_date: pay.date,
            amount: pay.amount,
            payment_mode: pay.mode,
            status: pay.status,
            reference_number: pay.reference,
            notes: pay.notes,
            created_at: pay.date,
          },
        });
      }
    }
  }

  console.log('✅ Yaazhi Boutique database successfully seeded with authentic boutique data!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
