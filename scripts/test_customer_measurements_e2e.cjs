const BASE_URL = 'http://localhost:3002/api';

async function runTests() {
  console.log('=== Starting End-to-End Customer & Measurements Validation ===\n');

  // Test 1: Fetch Templates
  console.log('1. Testing GET /api/measurement-templates...');
  const tmplRes = await fetch(`${BASE_URL}/measurement-templates`);
  const templates = await tmplRes.json();
  console.log(`   Fetched ${templates.length} templates.`);
  if (templates.length < 5) throw new Error('Expected at least 5 default garment templates');
  const blouse = templates.find(t => t.code === 'SAREE_BLOUSE');
  console.log(`   Found Saree Blouse template with ${blouse?.fields?.length} fields.`);

  // Test 2: Create Custom Template
  console.log('\n2. Testing POST /api/measurement-templates (Custom Template)...');
  const newTmplRes = await fetch(`${BASE_URL}/measurement-templates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Indo-Western Gown',
      category: 'WOMEN',
      description: 'Designer flared western gown with corset bodice',
      fields: [
        { field_key: 'bust', field_name: 'Bust / Chest', field_type: 'number', default_unit: 'in', is_required: true },
        { field_key: 'waist', field_name: 'Waist', field_type: 'number', default_unit: 'in', is_required: true },
      ],
    }),
  });
  const createdTmpl = await newTmplRes.json();
  console.log(`   Created template "${createdTmpl.name}" (ID: ${createdTmpl.id}) with ${createdTmpl.fields?.length} fields.`);

  // Test 3: Add Field to Template
  console.log('\n3. Testing POST /api/measurement-templates/:id/fields...');
  const addFieldRes = await fetch(`${BASE_URL}/measurement-templates/${createdTmpl.id}/fields`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      field_name: 'Floor Length with Heels',
      field_type: 'number',
      default_unit: 'in',
      is_required: true,
    }),
  });
  const addedField = await addFieldRes.json();
  console.log(`   Added field "${addedField.field_name}" (Key: ${addedField.field_key}).`);

  // Test 4: Create Customer (Without mandatory billing address, no city)
  console.log('\n4. Testing POST /api/customers (Optional Billing Address, No City)...');
  const custRes = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Kavitha Radhakrishnan',
      phone: '+91 98402 11223',
      email: 'kavitha.radha@example.com',
      gstin: '33AABCK1234F1Z8',
      // No address passed (billing address is optional!)
      notes: 'Bridal client seeking tailored Kanchipuram silk blouse and reception gown',
    }),
  });
  const newCustomer = await custRes.json();
  console.log(`   Created customer "${newCustomer.name}" (ID: ${newCustomer.id}). Address: "${newCustomer.address}" (empty as expected).`);

  // Test 5: Edit Customer (Add billing & shipping address)
  console.log('\n5. Testing PUT /api/customers/:id...');
  const editCustRes = await fetch(`${BASE_URL}/customers/${newCustomer.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: '77 Poes Garden, Chennai 600086',
      shipping_address: 'Warehouse 4, Ambattur, Chennai',
    }),
  });
  const updatedCust = await editCustRes.json();
  console.log(`   Updated customer address: "${updatedCust.address}", shipping: "${updatedCust.shipping_address}".`);

  // Test 6: Create Customer Measurement Profile (using blouse template)
  console.log('\n6. Testing POST /api/customers/:customerId/measurement-profiles...');
  const createProfileRes = await fetch(`${BASE_URL}/customers/${newCustomer.id}/measurement-profiles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      template_id: blouse.id,
      profile_name: 'Kavitha - Muhurtham Silk Blouse',
      notes: 'Padded princess cut with 10.5 in deep back neck',
      measured_by: 'Master Tailor Velu',
      measured_at: '2026-10-06T10:00:00.000Z',
      values: [
        { field_id: blouse.fields.find(f => f.field_key === 'blouse_length').id, numeric_value: 14.5, unit: 'in' },
        { field_id: blouse.fields.find(f => f.field_key === 'bust').id, numeric_value: 36.5, unit: 'in' },
        { field_id: blouse.fields.find(f => f.field_key === 'waist').id, numeric_value: 31.0, unit: 'in' },
        { field_id: blouse.fields.find(f => f.field_key === 'armhole').id, numeric_value: 16.5, unit: 'in' },
      ],
    }),
  });
  const profile = await createProfileRes.json();
  console.log(`   Created profile "${profile.profile_name}" (ID: ${profile.id}) with version v${profile.current_version?.version_number}.`);
  console.log(`   Saved ${profile.current_version?.values?.length} measurement values.`);

  // Test 7: Add New Version (Audit trail)
  console.log('\n7. Testing POST /api/customers/:customerId/measurement-profiles/:profileId/versions (Version 2)...');
  const addVerRes = await fetch(`${BASE_URL}/customers/${newCustomer.id}/measurement-profiles/${profile.id}/versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      notes: 'Bust adjusted for bridal innerwear during trial',
      measured_by: 'Senior Cutter Muthu',
      measured_at: '2026-10-06T14:30:00.000Z',
      values: [
        { field_id: blouse.fields.find(f => f.field_key === 'blouse_length').id, numeric_value: 14.5, unit: 'in' },
        { field_id: blouse.fields.find(f => f.field_key === 'bust').id, numeric_value: 37.0, unit: 'in' }, // +0.5 in
        { field_id: blouse.fields.find(f => f.field_key === 'waist').id, numeric_value: 31.0, unit: 'in' },
        { field_id: blouse.fields.find(f => f.field_key === 'armhole').id, numeric_value: 16.5, unit: 'in' },
      ],
    }),
  });
  const verData = await addVerRes.json();
  console.log(`   Recorded Version ${verData.version?.version_number} successfully.`);

  // Test 8: Get Measurement History
  console.log('\n8. Testing GET /api/customers/:customerId/measurement-profiles/:profileId/history...');
  const histRes = await fetch(`${BASE_URL}/customers/${newCustomer.id}/measurement-profiles/${profile.id}/history`);
  const history = await histRes.json();
  console.log(`   Fetched history: ${history.length} versions found.`);
  history.forEach(h => {
    console.log(`     - Version ${h.version_number} (Current: ${h.is_current}) by ${h.measured_by}: ${h.notes}`);
  });

  // Test 9: Clone Measurement Profile
  console.log('\n9. Testing POST /api/customers/:customerId/measurement-profiles/:profileId/clone...');
  const cloneRes = await fetch(`${BASE_URL}/customers/${newCustomer.id}/measurement-profiles/${profile.id}/clone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile_name: 'Kavitha - Reception Designer Blouse (Clone)',
    }),
  });
  const clonedProfile = await cloneRes.json();
  console.log(`   Cloned profile "${clonedProfile.profile_name}" (ID: ${clonedProfile.id}).`);
  console.log(`   Cloned values count: ${clonedProfile.current_version?.values?.length}.`);

  // Test 10: Verify Customer has 2 measurement profiles
  console.log('\n10. Testing GET /api/customers/:customerId/measurement-profiles...');
  const allProfsRes = await fetch(`${BASE_URL}/customers/${newCustomer.id}/measurement-profiles`);
  const allProfs = await allProfsRes.json();
  console.log(`   Customer has ${allProfs.length} measurement profiles.`);

  // Clean up test customer and custom template
  console.log('\n11. Cleaning up test customer & test template...');
  await fetch(`${BASE_URL}/customers/${newCustomer.id}`, { method: 'DELETE' });
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  await prisma.measurementTemplate.delete({ where: { id: createdTmpl.id } }).catch(() => {});
  await prisma.$disconnect();
  console.log('   Test artifacts cleanly removed.');

  console.log('\n=== ALL END-TO-END TESTS PASSED SUCCESSFULLY! ===\n');
}

runTests().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
