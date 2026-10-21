import assert from 'node:assert/strict';
import { prisma } from './db.js';
import { customerMeasurementService } from './services/customerMeasurementService.js';

async function runCustomerMeasurementTests() {
  console.log('🧪 Starting 10-Scenario Customer Measurement Management Test Suite...\n');

  let template1: any = null;
  let template2: any = null;
  let customer: any = null;
  let profile1: any = null;
  let profile2: any = null;
  let clonedProfile: any = null;
  let salesOrder: any = null;

  try {
    // =========================================================================
    // TEST 1: Template Creation with validation rules & garment types
    // =========================================================================
    console.log('▶️ TEST 1: Create active measurement templates with validation rules');
    template1 = await prisma.measurementTemplate.create({
      data: {
        name: 'Bridal Silk Blouse Template',
        code: `YZ-TMPL-BLOUSE-${Date.now()}`,
        category: 'Custom Stitching',
        garment_type: 'Blouse',
        is_active: true,
        is_default: true,
        fields: {
          create: [
            {
              field_key: 'chest',
              field_name: 'Bust / Chest Circumference',
              field_type: 'number',
              default_unit: 'in',
              display_order: 1,
              is_required: true,
              validation_rules: JSON.stringify({ min: 28, max: 54 }),
            },
            {
              field_key: 'waist',
              field_name: 'Natural Waist',
              field_type: 'number',
              default_unit: 'in',
              display_order: 2,
              is_required: true,
              validation_rules: JSON.stringify({ min: 22, max: 48 }),
            },
            {
              field_key: 'blouse_length',
              field_name: 'Blouse Length',
              field_type: 'number',
              default_unit: 'in',
              display_order: 3,
              is_required: true,
              validation_rules: JSON.stringify({ min: 10, max: 24 }),
            },
            {
              field_key: 'neck_pattern',
              field_name: 'Neck Pattern Style',
              field_type: 'dropdown',
              default_unit: 'in',
              display_order: 4,
              is_required: false,
              options: JSON.stringify(['Round', 'Boat Neck', 'Sweetheart', 'Square']),
            },
          ],
        },
      },
      include: { fields: true },
    });

    assert.ok(template1.id, 'Template 1 should have an ID');
    assert.equal(template1.fields.length, 4, 'Template 1 should have 4 fields');
    console.log('  ✅ TEST 1 PASSED: Created active template with numeric range & dropdown rules.');

    // =========================================================================
    // TEST 2: Create Customer & Measurement Profile with Garment Type & Instructions
    // =========================================================================
    console.log('\n▶️ TEST 2: Create Customer & Bespoke Measurement Profile with Garment & Instructions');
    customer = await prisma.customer.create({
      data: {
        name: `Priya Sundaram ${Date.now()}`,
        phone: `+91 98841 ${Math.floor(10000 + Math.random() * 90000)}`,
        address: '14, Luz Church Road, Mylapore, Chennai',
        city: 'Chennai',
      },
    });

    const chestField = template1.fields.find((f: any) => f.field_key === 'chest');
    const waistField = template1.fields.find((f: any) => f.field_key === 'waist');
    const lengthField = template1.fields.find((f: any) => f.field_key === 'blouse_length');
    const neckField = template1.fields.find((f: any) => f.field_key === 'neck_pattern');

    profile1 = await customerMeasurementService.createProfile(customer.id, {
      template_id: template1.id,
      profile_name: 'Priya — Wedding Kanjeevaram Blouse',
      garment_type: 'Blouse',
      notes: 'Boutique bridal fit',
      fitting_preferences: 'Princess cut padded with snug fit',
      tailor_instructions: 'Leave 2-inch side margin and include French piping seams',
      measured_by: 'Master Tailor Murugan',
      order_id: null,
      values: [
        { field_id: chestField.id, numeric_value: 36, unit: 'in' },
        { field_id: waistField.id, numeric_value: 30, unit: 'in' },
        { field_id: lengthField.id, numeric_value: 14.5, unit: 'in' },
        { field_id: neckField.id, text_value: 'Boat Neck', unit: 'in' },
      ],
    });

    assert.ok(profile1.id, 'Profile 1 should have an ID');
    assert.equal(profile1.garment_type, 'Blouse');
    assert.equal(profile1.current_version.version_number, 1);
    assert.equal(profile1.current_version.fitting_preferences, 'Princess cut padded with snug fit');
    assert.equal(profile1.current_version.tailor_instructions, 'Leave 2-inch side margin and include French piping seams');
    assert.ok(profile1.current_version.field_snapshots, 'Field snapshot must be preserved on version');

    // Parse snapshot
    const snapshot = typeof profile1.current_version.field_snapshots === 'string'
      ? JSON.parse(profile1.current_version.field_snapshots)
      : profile1.current_version.field_snapshots;
    assert.equal(snapshot.length, 4, 'Snapshot should capture all 4 template fields at save time');
    console.log('  ✅ TEST 2 PASSED: Bespoke measurement profile saved with snapshot, preferences, and tailor instructions.');

    // =========================================================================
    // TEST 3: Multiple Garment Records for Same Customer (Blouse + Chudidar)
    // =========================================================================
    console.log('\n▶️ TEST 3: Multiple Garment Records for Same Customer without overwriting');
    template2 = await prisma.measurementTemplate.create({
      data: {
        name: 'Classic Chudidar Template',
        code: `YZ-TMPL-CHUDI-${Date.now()}`,
        category: 'Custom Stitching',
        garment_type: 'Chudidar',
        is_active: true,
        fields: {
          create: [
            {
              field_key: 'chudidar_waist',
              field_name: 'Chudidar Waist',
              field_type: 'number',
              default_unit: 'in',
              display_order: 1,
              is_required: true,
              validation_rules: JSON.stringify({ min: 24, max: 50 }),
            },
            {
              field_key: 'chudidar_length',
              field_name: 'Pant Length',
              field_type: 'number',
              default_unit: 'in',
              display_order: 2,
              is_required: true,
              validation_rules: JSON.stringify({ min: 30, max: 48 }),
            },
          ],
        },
      },
      include: { fields: true },
    });

    const chudiWaist = template2.fields.find((f: any) => f.field_key === 'chudidar_waist');
    const chudiLength = template2.fields.find((f: any) => f.field_key === 'chudidar_length');

    profile2 = await customerMeasurementService.createProfile(customer.id, {
      template_id: template2.id,
      profile_name: 'Priya — Silk Chudidar Set',
      garment_type: 'Chudidar',
      fitting_preferences: 'Comfort relaxed fit with elastic band',
      tailor_instructions: 'Bottom gathers with 4 rings',
      measured_by: 'Showroom Assistant',
      values: [
        { field_id: chudiWaist.id, numeric_value: 32, unit: 'in' },
        { field_id: chudiLength.id, numeric_value: 40, unit: 'in' },
      ],
    });

    // Fetch all profiles for customer
    const allCustomerProfiles = await customerMeasurementService.getProfilesByCustomer(customer.id);
    assert.equal(allCustomerProfiles.length, 2, 'Customer should have exactly 2 distinct garment profiles');

    // Query with garment filter
    const blouseOnly = await customerMeasurementService.getProfilesByCustomer(customer.id, { garment_type: 'Blouse' });
    assert.equal(blouseOnly.length, 1, 'Garment filter "Blouse" should return only 1 profile');
    assert.equal(blouseOnly[0].garment_type, 'Blouse');

    const chudiOnly = await customerMeasurementService.getProfilesByCustomer(customer.id, { garment_type: 'Chudidar' });
    assert.equal(chudiOnly.length, 1, 'Garment filter "Chudidar" should return only 1 profile');
    assert.equal(chudiOnly[0].garment_type, 'Chudidar');

    console.log('  ✅ TEST 3 PASSED: Multiple garment records co-exist and filter accurately.');

    // =========================================================================
    // TEST 4: Field Validation Enforcement (Required & Range Limits)
    // =========================================================================
    console.log('\n▶️ TEST 4: Field Validation (Required & Numeric Range)');

    // Missing required field
    let validationFailed = false;
    try {
      await customerMeasurementService.createProfile(customer.id, {
        template_id: template1.id,
        profile_name: 'Invalid - Missing Fields',
        garment_type: 'Blouse',
        values: [
          { field_id: chestField.id, numeric_value: 36, unit: 'in' },
          // Missing waist and length which are required
        ],
      });
    } catch (err: any) {
      validationFailed = true;
      assert.match(err.message, /Missing required measurement/i);
    }
    assert.ok(validationFailed, 'Should reject profile with missing required measurement');

    // Numeric out-of-range value
    let rangeFailed = false;
    try {
      await customerMeasurementService.createProfile(customer.id, {
        template_id: template1.id,
        profile_name: 'Invalid - Range Exceeded',
        garment_type: 'Blouse',
        values: [
          { field_id: chestField.id, numeric_value: 99, unit: 'in' }, // max is 54
          { field_id: waistField.id, numeric_value: 30, unit: 'in' },
          { field_id: lengthField.id, numeric_value: 14.5, unit: 'in' },
        ],
      });
    } catch (err: any) {
      rangeFailed = true;
      assert.match(err.message, /must be between/i);
    }
    assert.ok(rangeFailed, 'Should reject measurement exceeding numeric range');
    console.log('  ✅ TEST 4 PASSED: Required field and numeric range validation strictly enforced.');

    // =========================================================================
    // TEST 5: Version History Tracking (v1 -> v2) without deleting v1
    // =========================================================================
    console.log('\n▶️ TEST 5: Version History Tracking without deleting previous records');
    const version2 = await customerMeasurementService.addProfileVersion(customer.id, profile1.id, {
      values: [
        { field_id: chestField.id, numeric_value: 37, unit: 'in' }, // updated from 36
        { field_id: waistField.id, numeric_value: 31, unit: 'in' }, // updated from 30
        { field_id: lengthField.id, numeric_value: 15, unit: 'in' },
        { field_id: neckField.id, text_value: 'Sweetheart', unit: 'in' },
      ],
      notes: 'Post-diet seasonal adjustment',
      fitting_preferences: 'Fitted with cups',
      tailor_instructions: 'Add inner piping and latkan tassels',
      measured_by: 'Master Kannan',
    });

    assert.equal(version2.version_number, 2, 'New version must be v2');
    assert.equal(version2.is_current, true, 'v2 must be marked current');

    // Fetch full history
    const history = await customerMeasurementService.getProfileHistory(customer.id, profile1.id);
    assert.ok(history, 'History must not be null');
    assert.equal(history.versions.length, 2, 'History must contain both v1 and v2');

    const v1 = history.versions.find((v: any) => v.version_number === 1);
    const v2 = history.versions.find((v: any) => v.version_number === 2);

    assert.ok(v1 && v2, 'Both versions must exist');
    assert.equal(v1.is_current, false, 'v1 should no longer be current');
    assert.equal(v2.is_current, true, 'v2 should be current');

    // Check v1 values preserved
    const v1Chest = v1.values.find((val: any) => val.field_id === chestField.id);
    const v2Chest = v2.values.find((val: any) => val.field_id === chestField.id);
    assert.equal(Number(v1Chest.numeric_value), 36, 'v1 chest measurement must remain 36');
    assert.equal(Number(v2Chest.numeric_value), 37, 'v2 chest measurement must be 37');

    console.log('  ✅ TEST 5 PASSED: v1 and v2 cleanly tracked with immutable historical fidelity.');

    // =========================================================================
    // TEST 6: Duplication / Cloning
    // =========================================================================
    console.log('\n▶️ TEST 6: Duplication / Cloning with new version 1');
    clonedProfile = await customerMeasurementService.cloneProfile(customer.id, profile1.id);
    assert.ok(clonedProfile.id, 'Cloned profile must exist');
    assert.match(clonedProfile.profile_name, /\(Copy\)/, 'Name must have (Copy) suffix');
    assert.equal(clonedProfile.garment_type, 'Blouse');
    assert.equal(clonedProfile.current_version.version_number, 1);
    assert.equal(clonedProfile.current_version.values.length, 4);
    console.log('  ✅ TEST 6 PASSED: Profile duplicated into a standalone versioned record.');

    // =========================================================================
    // TEST 7: Snapshot Preservation when Template is Archived or Fields Modified
    // =========================================================================
    console.log('\n▶️ TEST 7: Historical Snapshot Preservation when Template is archived');

    // Archive template 1
    await prisma.measurementTemplate.update({
      where: { id: template1.id },
      data: { is_archived: true, is_active: false },
    });

    // Fetch existing profile 1 - verify fields still resolve from version snapshot
    const fetchedProfile1 = await customerMeasurementService.getProfileDetails(customer.id, profile1.id);
    assert.ok(fetchedProfile1, 'Profile 1 must still load');
    assert.equal(fetchedProfile1.current_version.values.length, 4);

    // Verify creating NEW record with archived template is BLOCKED
    let archivedBlocked = false;
    try {
      await customerMeasurementService.createProfile(customer.id, {
        template_id: template1.id,
        profile_name: 'Attempt with Archived Template',
        garment_type: 'Blouse',
        values: [
          { field_id: chestField.id, numeric_value: 36, unit: 'in' },
        ],
      });
    } catch (err: any) {
      archivedBlocked = true;
      assert.match(err.message, /archived|inactive/i);
    }
    assert.ok(archivedBlocked, 'Archived template must be rejected for new records');
    console.log('  ✅ TEST 7 PASSED: Archived templates preserved for history and blocked for new records.');

    // =========================================================================
    // TEST 8: Order Linkage & Deletion Guard
    // =========================================================================
    console.log('\n▶️ TEST 8: Sales Order Linkage & Permanent Deletion Guard');

    // Create a Sales Order for this customer
    const defaultGodown = await prisma.godown.findFirst();
    let godownId = defaultGodown?.id;
    if (!godownId) {
      const g = await prisma.godown.create({
        data: { name: 'Main Showroom Counter', location: 'T. Nagar, Chennai' },
      });
      godownId = g.id;
    }

    salesOrder = await prisma.salesOrder.create({
      data: {
        order_number: `SO-STITCH-${Date.now()}`,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        godown_id: godownId,
        subtotal: 3500,
        grand_total: 3500,
        status: 'CONFIRMED',
      },
    });

    // Link profile 1 v2 to this sales order
    await customerMeasurementService.linkOrderToProfileVersion(customer.id, profile1.id, salesOrder.id, version2.id);

    // Verify linkage in database
    const linkedVersion = await prisma.customerMeasurementVersion.findUnique({
      where: { id: version2.id },
    });
    assert.equal(linkedVersion?.order_id, salesOrder.id, 'Version must be linked to sales order');

    // Attempt to permanently delete profile 1 - MUST BE BLOCKED
    let deleteBlocked = false;
    try {
      await customerMeasurementService.deleteProfile(customer.id, profile1.id);
    } catch (err: any) {
      deleteBlocked = true;
      assert.match(err.message, /referenced by sales order/i);
    }
    assert.ok(deleteBlocked, 'Deletion must be strictly blocked when linked to a sales order');
    console.log('  ✅ TEST 8 PASSED: Order linkage verified and deletion protection successfully prevented data loss.');

    // =========================================================================
    // TEST 9: Customer Archival Preserves Measurements
    // =========================================================================
    console.log('\n▶️ TEST 9: Customer Archival Preserves All Measurement Records');

    // Archive the customer
    await prisma.customer.update({
      where: { id: customer.id },
      data: { is_archived: true, archived_at: new Date(), archived_by: 'Admin' },
    });

    // Retrieve profiles for archived customer
    const archivedCustomerProfiles = await customerMeasurementService.getProfilesByCustomer(customer.id);
    assert.ok(archivedCustomerProfiles.length >= 2, 'Archived customer measurements must remain intact');
    console.log('  ✅ TEST 9 PASSED: Customer archival preserves 100% of measurement records.');

    // =========================================================================
    // TEST 10: Clean up isolated test data
    // =========================================================================
    console.log('\n▶️ TEST 10: Clean Up Isolated Test Data');

    // Unlink order so we can clean up
    await prisma.customerMeasurementVersion.updateMany({
      where: { order_id: salesOrder.id },
      data: { order_id: null },
    });

    await prisma.salesOrder.delete({ where: { id: salesOrder.id } });

    // Clean up profiles
    const profIds = [profile1.id, profile2.id, clonedProfile.id];
    await prisma.customerMeasurementValue.deleteMany({
      where: { version: { profile_id: { in: profIds } } },
    });
    await prisma.customerMeasurementVersion.deleteMany({
      where: { profile_id: { in: profIds } },
    });
    await prisma.customerMeasurementProfile.deleteMany({
      where: { id: { in: profIds } },
    });

    // Clean up customer
    await prisma.customer.delete({ where: { id: customer.id } });

    // Clean up templates
    await prisma.measurementTemplateField.deleteMany({
      where: { template_id: { in: [template1.id, template2.id] } },
    });
    await prisma.measurementTemplate.deleteMany({
      where: { id: { in: [template1.id, template2.id] } },
    });

    console.log('  ✅ TEST 10 PASSED: Isolated test records cleanly removed.');

    console.log('\n🎉 ALL 10 CUSTOMER MEASUREMENT TESTS PASSED WITH 100% INTEGRITY!\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err);
    throw err;
  }
}

runCustomerMeasurementTests()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
