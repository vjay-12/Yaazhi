const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Realistic Customer Measurements ---');

  const customers = await prisma.customer.findMany();
  const templates = await prisma.measurementTemplate.findMany({
    include: { fields: { orderBy: { display_order: 'asc' } } },
  });

  const blouseTmpl = templates.find((t) => t.code === 'SAREE_BLOUSE') || templates[0];
  const churidarTmpl = templates.find((t) => t.code === 'CHURIDAR_SALWAR') || templates[0];
  const kurtiTmpl = templates.find((t) => t.code === 'KURTI') || templates[0];
  const pantsTmpl = templates.find((t) => t.code === 'PANTS_TROUSER') || templates[0];

  function getField(tmpl, key) {
    return tmpl.fields.find((f) => f.field_key === key) || tmpl.fields[0];
  }

  // 1. Ananya Krishnan (cust-002) - Add Churidar and Blouse
  const ananya = customers.find((c) => c.name.includes('Ananya'));
  if (ananya) {
    const existing = await prisma.customerMeasurementProfile.findFirst({
      where: { customer_id: ananya.id, profile_name: 'Ananya - Royal Raw Silk Anarkali Suit' },
    });
    if (!existing && churidarTmpl) {
      const p1 = await prisma.customerMeasurementProfile.create({
        data: {
          customer_id: ananya.id,
          template_id: churidarTmpl.id,
          profile_name: 'Ananya - Royal Raw Silk Anarkali Suit',
          notes: 'Festive wedding collection fit. Prefers boat neck and 3/4 sleeves.',
          versions: {
            create: {
              version_number: 1,
              measured_at: new Date('2026-08-12T11:00:00Z'),
              measured_by: 'Master Tailor Velu',
              notes: 'Initial fitting for festive season',
              is_current: false,
              values: {
                create: [
                  { field_id: getField(churidarTmpl, 'shoulder').id, numeric_value: 14.5 },
                  { field_id: getField(churidarTmpl, 'bust').id, numeric_value: 36.0 },
                  { field_id: getField(churidarTmpl, 'waist').id, numeric_value: 30.0 },
                  { field_id: getField(churidarTmpl, 'hip').id, numeric_value: 39.0 },
                  { field_id: getField(churidarTmpl, 'armhole').id, numeric_value: 16.5 },
                  { field_id: getField(churidarTmpl, 'sleeve_length').id, numeric_value: 16.0 },
                  { field_id: getField(churidarTmpl, 'top_length').id, numeric_value: 46.0 },
                  { field_id: getField(churidarTmpl, 'pant_length').id, numeric_value: 38.0 },
                ],
              },
            },
          },
        },
      });

      // Add Version 2 (Audit history!)
      await prisma.customerMeasurementVersion.create({
        data: {
          profile_id: p1.id,
          version_number: 2,
          measured_at: new Date('2026-10-03T15:30:00Z'),
          measured_by: 'Master Tailor Velu',
          notes: 'Waist relaxed by 0.5 in for comfort after trial',
          is_current: true,
          values: {
            create: [
              { field_id: getField(churidarTmpl, 'shoulder').id, numeric_value: 14.5 },
              { field_id: getField(churidarTmpl, 'bust').id, numeric_value: 36.0 },
              { field_id: getField(churidarTmpl, 'waist').id, numeric_value: 30.5 },
              { field_id: getField(churidarTmpl, 'hip').id, numeric_value: 39.0 },
              { field_id: getField(churidarTmpl, 'armhole').id, numeric_value: 16.5 },
              { field_id: getField(churidarTmpl, 'sleeve_length').id, numeric_value: 16.0 },
              { field_id: getField(churidarTmpl, 'top_length').id, numeric_value: 46.0 },
              { field_id: getField(churidarTmpl, 'pant_length').id, numeric_value: 38.0 },
            ],
          },
        },
      });
      console.log('Added Churidar profile with 2 versions for Ananya');
    }
  }

  // 2. Dr. Meenakshi Sundaram
  const meenakshiS = customers.find((c) => c.name.includes('Dr. Meenakshi'));
  if (meenakshiS && blouseTmpl) {
    const existing = await prisma.customerMeasurementProfile.findFirst({
      where: { customer_id: meenakshiS.id },
    });
    if (!existing) {
      await prisma.customerMeasurementProfile.create({
        data: {
          customer_id: meenakshiS.id,
          template_id: blouseTmpl.id,
          profile_name: 'Dr. Meenakshi - Classic High Neck Silk Blouse',
          notes: 'High neck front, 8.5 in back depth, padded princess cut.',
          versions: {
            create: {
              version_number: 1,
              measured_at: new Date('2026-09-25T14:00:00Z'),
              measured_by: 'Senior Cutter Muthu',
              notes: 'Doctor preference: comfort armhole and modest neckline',
              is_current: true,
              values: {
                create: [
                  { field_id: getField(blouseTmpl, 'blouse_length').id, numeric_value: 14.5 },
                  { field_id: getField(blouseTmpl, 'shoulder').id, numeric_value: 15.0 },
                  { field_id: getField(blouseTmpl, 'bust').id, numeric_value: 38.0 },
                  { field_id: getField(blouseTmpl, 'waist').id, numeric_value: 32.5 },
                  { field_id: getField(blouseTmpl, 'armhole').id, numeric_value: 17.0 },
                  { field_id: getField(blouseTmpl, 'sleeve_length').id, numeric_value: 11.0 },
                  { field_id: getField(blouseTmpl, 'front_neck_depth').id, numeric_value: 6.0 },
                  { field_id: getField(blouseTmpl, 'back_neck_depth').id, numeric_value: 8.5 },
                ],
              },
            },
          },
        },
      });
      console.log('Added Saree Blouse profile for Dr. Meenakshi Sundaram');
    }
  }

  // 3. Rukmini Narayanan
  const rukmini = customers.find((c) => c.name.includes('Rukmini'));
  if (rukmini && blouseTmpl) {
    const existing = await prisma.customerMeasurementProfile.findFirst({
      where: { customer_id: rukmini.id },
    });
    if (!existing) {
      await prisma.customerMeasurementProfile.create({
        data: {
          customer_id: rukmini.id,
          template_id: blouseTmpl.id,
          profile_name: 'Rukmini - Elbow Sleeve Temple Border Blouse',
          notes: 'Handloom Kanchipuram matching. Golden piping on neckline.',
          versions: {
            create: {
              version_number: 1,
              measured_at: new Date('2026-10-01T10:00:00Z'),
              measured_by: 'Master Tailor Velu',
              notes: 'Standard bridal measurement profile',
              is_current: true,
              values: {
                create: [
                  { field_id: getField(blouseTmpl, 'blouse_length').id, numeric_value: 14.0 },
                  { field_id: getField(blouseTmpl, 'shoulder').id, numeric_value: 14.0 },
                  { field_id: getField(blouseTmpl, 'bust').id, numeric_value: 35.0 },
                  { field_id: getField(blouseTmpl, 'waist').id, numeric_value: 29.5 },
                  { field_id: getField(blouseTmpl, 'armhole').id, numeric_value: 15.5 },
                  { field_id: getField(blouseTmpl, 'sleeve_length').id, numeric_value: 10.5 },
                  { field_id: getField(blouseTmpl, 'front_neck_depth').id, numeric_value: 6.5 },
                  { field_id: getField(blouseTmpl, 'back_neck_depth').id, numeric_value: 9.0 },
                ],
              },
            },
          },
        },
      });
      console.log('Added Blouse profile for Rukmini Narayanan');
    }
  }

  // 4. Meenakshi Ramachandran
  const meenakshiR = customers.find((c) => c.name.includes('Ramachandran'));
  if (meenakshiR && blouseTmpl) {
    const existing = await prisma.customerMeasurementProfile.findFirst({
      where: { customer_id: meenakshiR.id },
    });
    if (!existing) {
      await prisma.customerMeasurementProfile.create({
        data: {
          customer_id: meenakshiR.id,
          template_id: blouseTmpl.id,
          profile_name: 'Meenakshi - Antique Zari Katori Blouse',
          notes: 'Heavy antique zari work. Deep round back with handmade dori latkans.',
          versions: {
            create: {
              version_number: 1,
              measured_at: new Date('2026-10-04T12:00:00Z'),
              measured_by: 'Senior Cutter Muthu',
              notes: 'Bridal bespoke measurements',
              is_current: true,
              values: {
                create: [
                  { field_id: getField(blouseTmpl, 'blouse_length').id, numeric_value: 14.5 },
                  { field_id: getField(blouseTmpl, 'shoulder').id, numeric_value: 14.5 },
                  { field_id: getField(blouseTmpl, 'bust').id, numeric_value: 37.0 },
                  { field_id: getField(blouseTmpl, 'waist').id, numeric_value: 31.0 },
                  { field_id: getField(blouseTmpl, 'armhole').id, numeric_value: 16.0 },
                  { field_id: getField(blouseTmpl, 'sleeve_length').id, numeric_value: 11.5 },
                  { field_id: getField(blouseTmpl, 'front_neck_depth').id, numeric_value: 6.5 },
                  { field_id: getField(blouseTmpl, 'back_neck_depth').id, numeric_value: 9.5 },
                ],
              },
            },
          },
        },
      });
      console.log('Added Blouse profile for Meenakshi Ramachandran');
    }
  }

  // 5. Sowmya Ramanathan
  const sowmya = customers.find((c) => c.name.includes('Sowmya'));
  if (sowmya && blouseTmpl) {
    const existing = await prisma.customerMeasurementProfile.findFirst({
      where: { customer_id: sowmya.id },
    });
    if (!existing) {
      await prisma.customerMeasurementProfile.create({
        data: {
          customer_id: sowmya.id,
          template_id: blouseTmpl.id,
          profile_name: 'Sowmya - Princess Cut Zardosi Blouse',
          notes: 'Zardosi embroidery with French knots. Padded cup size B.',
          versions: {
            create: {
              version_number: 1,
              measured_at: new Date('2026-10-05T16:00:00Z'),
              measured_by: 'Master Tailor Velu',
              notes: 'Grand reception blouse measurements',
              is_current: true,
              values: {
                create: [
                  { field_id: getField(blouseTmpl, 'blouse_length').id, numeric_value: 13.5 },
                  { field_id: getField(blouseTmpl, 'shoulder').id, numeric_value: 13.5 },
                  { field_id: getField(blouseTmpl, 'bust').id, numeric_value: 34.0 },
                  { field_id: getField(blouseTmpl, 'waist').id, numeric_value: 28.0 },
                  { field_id: getField(blouseTmpl, 'armhole').id, numeric_value: 15.0 },
                  { field_id: getField(blouseTmpl, 'sleeve_length').id, numeric_value: 10.0 },
                  { field_id: getField(blouseTmpl, 'front_neck_depth').id, numeric_value: 6.5 },
                  { field_id: getField(blouseTmpl, 'back_neck_depth').id, numeric_value: 8.5 },
                ],
              },
            },
          },
        },
      });
      console.log('Added Blouse profile for Sowmya Ramanathan');
    }
  }

  console.log('--- Realistic Customer Measurements Seeded Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
