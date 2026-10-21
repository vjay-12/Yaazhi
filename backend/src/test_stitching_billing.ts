import assert from 'node:assert/strict';
import { prisma } from './db.js';
import { customerMeasurementService } from './services/customerMeasurementService.js';
import { LedgerService } from './services/ledgerService.js';
import { MovementType } from '@prisma/client';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3002/api';

async function runStitchingBillingTests() {
  console.log('🧪 Starting Custom Stitching in Billing Integration Test Suite...\n');

  let testProduct: any = null;
  let testCustomer: any = null;
  let testTemplate: any = null;
  let testMeasurementProfile: any = null;
  let testMeasurementVersion: any = null;
  let defaultGodown: any = null;
  let bill1: any = null;
  let bill2: any = null;

  try {
    // 0. Setup: Ensure default showroom godown exists
    defaultGodown = await prisma.godown.findFirst({
      where: { name: { contains: 'Showroom' } },
    }) || await prisma.godown.findFirst();

    if (!defaultGodown) {
      defaultGodown = await prisma.godown.create({
        data: {
          name: 'Main Boutique Showroom',
          code: 'MB-SHOWROOM',
          is_active: true,
        },
      });
    }

    // 1. Create a physical product with opening stock of 5
    const uniqueSku = `YZ-SILK-${Date.now().toString().slice(-6)}`;
    const prodRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: uniqueSku,
        name: 'Kanjivaram Pure Silk Saree',
        fabric: 'Pure Silk',
        craft: 'Handloom Zari',
        category: 'Sarees',
        unit: 'PCS',
        purchasePrice: 8000,
        salePrice: 12000,
        taxRate: 5.0,
        minStockLevel: 1,
        initialStock: 5,
      }),
    });
    assert.equal(prodRes.status, 201, 'Product creation must return 201');
    testProduct = await prodRes.json();

    console.log(`✅ 1. Created physical product: ${testProduct.name} (${testProduct.sku}) with stock = 5`);

    // 2. Create customer
    testCustomer = await prisma.customer.create({
      data: {
        name: `Meenakshi Sundaram ${Date.now().toString().slice(-4)}`,
        phone: `+91 98402 ${Math.floor(10000 + Math.random() * 90000)}`,
        city: 'Madurai',
        email: `meenakshi.${Date.now()}@example.com`,
      },
    });
    console.log(`✅ 2. Created customer: ${testCustomer.name}`);

    // 3. Create stitching price template
    const templateCode = `STITCH-BLOUSE-${Date.now().toString().slice(-4)}`;
    testTemplate = await prisma.stitchingTemplate.create({
      data: {
        name: 'Royal Bridal Silk Blouse Stitching',
        code: templateCode,
        category: 'Atelier Stitching',
        garment_type: 'Blouse',
        base_price: 1500,
        tax_rate: 5,
        is_active: true,
        addons: {
          create: [
            { name: 'Aari Hand Embroidery', price: 800, is_default_selected: false },
            { name: 'Designer Tassels & Latkan', price: 250, is_default_selected: true },
          ],
        },
      },
      include: { addons: true },
    });
    console.log(`✅ 3. Created Stitching Price Template: ${testTemplate.name} (Base: ₹${testTemplate.base_price})`);

    let measTpl = await prisma.measurementTemplate.findFirst({
      where: { garment_type: 'Blouse', is_active: true },
      include: { fields: true },
    });
    if (!measTpl) {
      measTpl = await prisma.measurementTemplate.create({
        data: {
          name: 'Standard Blouse Measurement Template',
          code: `MTPL-BLOUSE-${Date.now().toString().slice(-4)}`,
          garment_type: 'Blouse',
          is_active: true,
          fields: {
            create: [
              { field_key: 'chest', field_name: 'Bust / Chest', field_type: 'number', display_order: 1, is_required: true },
              { field_key: 'waist', field_name: 'Waist', field_type: 'number', display_order: 2, is_required: true },
            ],
          },
        },
        include: { fields: true },
      });
    }

    // 4. Create customer measurement profile and version
    testMeasurementProfile = await customerMeasurementService.createProfile(testCustomer.id, {
      template_id: measTpl.id,
      profile_name: 'Bridal Wedding Fit',
      garment_type: 'Blouse',
      fitting_preferences: 'Slim contoured fit with deep back neck',
      tailor_instructions: 'Keep 2-inch side margin for future alteration',
      values: measTpl.fields.map((f: any) => ({
        field_id: f.id,
        numeric_value: f.field_key === 'chest' ? 36 : 30,
        unit: 'in',
      })),
    });
    testMeasurementVersion = testMeasurementProfile.current_version;
    console.log(`✅ 4. Created Customer Measurement Profile: ${testMeasurementProfile.profile_name} (v${testMeasurementVersion.version_number})`);

    // =========================================================================
    // TEST SCENARIO 1: Mixed Bill (Physical Ready-Made Product + Custom Stitching)
    // =========================================================================
    console.log('\n▶️ TEST SCENARIO 1: Mixed Bill checkout with Product + Custom Stitching Service');

    const mixedCheckoutPayload = {
      customer_id: testCustomer.id,
      customer_name: testCustomer.name,
      customer_phone: testCustomer.phone,
      payment_mode: 'CASH',
      payment_status: 'PAID',
      discount_total: 500, // Proportional courtesy discount
      items: [
        {
          item_type: 'PRODUCT',
          product_id: testProduct.id,
          name: testProduct.name,
          sku: testProduct.sku,
          quantity: 1,
          unit_price: 12000,
          discount: 0,
          tax_rate: 5,
        },
        {
          item_type: 'SERVICE',
          template_id: testTemplate.id,
          name: testTemplate.name,
          sku: testTemplate.code,
          garment_type: 'Blouse',
          quantity: 1,
          unit_price: 2550, // ₹1500 base + ₹800 + ₹250 addons
          discount: 0,
          tax_rate: 5,
          measurement_version_id: testMeasurementVersion.id,
          selected_addons: ['Aari Hand Embroidery', 'Designer Tassels & Latkan'],
          tailor_instructions: 'Urgent delivery for wedding reception on 28th',
          delivery_date: '2026-10-28',
        },
      ],
      measurement_version_ids: [testMeasurementVersion.id],
    };

    const checkoutRes1 = await fetch(`${BASE_URL}/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mixedCheckoutPayload),
    });

    assert.equal(checkoutRes1.status, 201, `Mixed checkout must return 201, got ${checkoutRes1.status}`);
    bill1 = await checkoutRes1.json();
    assert.ok(bill1.billNo, 'Bill number must be generated');
    console.log(`  ✅ Mixed Bill registered: ${bill1.billNo} | Total: ₹${bill1.totalAmount} (Paid: ₹${bill1.paidAmount})`);

    // Verify Stock Behavior:
    // Physical product stock must decrement by 1 (5 -> 4)
    const pCheck = await (await fetch(`${BASE_URL}/products/${testProduct.id}`)).json();
    assert.equal(pCheck.currentStock, 4, `Physical product stock must be 4 after selling 1, got ${pCheck.currentStock}`);
    console.log(`  ✅ Physical product stock decremented correctly: 5 -> ${pCheck.currentStock}`);

    // Verify Stitching Service does NOT have ledger movements
    const shadowServiceProd = await prisma.product.findFirst({
      where: { sku: testTemplate.code },
      include: { stock_movements: true },
    });
    assert.ok(shadowServiceProd, 'Shadow service product representation must exist');
    assert.equal(shadowServiceProd.unit, 'SERVICE', 'Service unit must be SERVICE');
    assert.equal(shadowServiceProd.stock_movements.length, 0, 'Custom stitching service must NOT create physical stock movements');
    console.log('  ✅ Verified custom stitching service created 0 stock deductions in inventory ledger');

    // Verify linked measurement version updated with sales order id
    const updatedVersion = await prisma.customerMeasurementVersion.findUnique({
      where: { id: testMeasurementVersion.id },
    });
    assert.ok(updatedVersion?.order_id, 'Measurement version order_id must be linked to sales order');
    console.log(`  ✅ Customer measurement version linked to SalesOrder: ${updatedVersion?.order_id}`);

    // Verify tailor notes and delivery date stored in sales order notes
    const createdSalesOrder = await prisma.salesOrder.findFirst({
      where: { order_number: bill1.billNo },
    });
    assert.ok(createdSalesOrder?.notes?.includes('TAILORING WORKSHOP JOB'), 'Order notes must include workshop job');
    assert.ok(createdSalesOrder?.notes?.includes('Urgent delivery for wedding reception'), 'Order notes must include tailor instructions');
    assert.ok(createdSalesOrder?.notes?.includes('2026-10-28'), 'Order notes must include delivery date');
    console.log('  ✅ Tailor instructions and expected delivery date preserved in order notes');

    // =========================================================================
    // TEST SCENARIO 2: Partial Payment Settlement for Custom Stitching
    // =========================================================================
    console.log('\n▶️ TEST SCENARIO 2: Partial Payment Settlement for Custom Stitching');

    const partialPayload = {
      customer_id: testCustomer.id,
      customer_name: testCustomer.name,
      customer_phone: testCustomer.phone,
      payment_mode: 'UPI',
      payment_status: 'PARTIAL',
      paid_amount: 1000,
      payment_reference: 'UPI/YAAZHI/TEST-9922',
      items: [
        {
          item_type: 'SERVICE',
          template_id: testTemplate.id,
          name: 'Custom Silk Lehanga Choli Stitching',
          sku: `SRV-LEHANGA-${Date.now().toString().slice(-4)}`,
          garment_type: 'Lehanga',
          quantity: 1,
          unit_price: 3500,
          discount: 0,
          tax_rate: 5,
          tailor_instructions: 'Double cancan with hand pleated waist',
          delivery_date: '2026-11-05',
        },
      ],
    };

    const checkoutRes2 = await fetch(`${BASE_URL}/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(partialPayload),
    });

    assert.equal(checkoutRes2.status, 201, `Partial checkout must return 201, got ${checkoutRes2.status}`);
    bill2 = await checkoutRes2.json();
    assert.equal(bill2.paymentStatus, 'PARTIAL', 'Payment status must be PARTIAL');
    assert.equal(bill2.paidAmount, 1000, 'Paid amount must be recorded as 1000');
    assert.equal(bill2.pendingAmount, bill2.totalAmount - 1000, 'Pending amount must be total - 1000');
    console.log(`  ✅ Partial Bill registered: ${bill2.billNo} | Received: ₹${bill2.paidAmount} | Pending: ₹${bill2.pendingAmount}`);

    // Verify Invoice balance
    const invoice2 = await prisma.invoice.findFirst({
      where: { invoice_number: bill2.invoiceNumber },
    });
    assert.equal(invoice2?.status, 'PARTIAL', 'Invoice status must be PARTIAL');
    assert.equal(Number(invoice2?.balance_amount), bill2.pendingAmount, 'Invoice balance must match pending amount');
    console.log(`  ✅ Invoice balance recorded accurately: ₹${invoice2?.balance_amount} balance due`);

    // =========================================================================
    // TEST SCENARIO 3: Template Default Price Preserved when Price is Custom Adjusted
    // =========================================================================
    console.log('\n▶️ TEST SCENARIO 3: Stitching Template Default Price Preserved');

    const freshTemplate = await prisma.stitchingTemplate.findUnique({
      where: { id: testTemplate.id },
    });
    assert.equal(Number(freshTemplate?.base_price), 1500, 'Template default base_price must remain 1500 unchanged');
    console.log(`  ✅ Template base_price is unchanged at ₹${freshTemplate?.base_price} after custom adjusted bills`);

    console.log('\n🎉 ALL CUSTOM STITCHING BILLING INTEGRATION TESTS PASSED AT 100%!');
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up test fixtures...');
    try {
      if (bill1) {
        await prisma.payment.deleteMany({ where: { sales_order: { order_number: bill1.billNo } } });
        await prisma.invoice.deleteMany({ where: { sales_order: { order_number: bill1.billNo } } });
        await prisma.salesOrderItem.deleteMany({ where: { sales_order: { order_number: bill1.billNo } } });
        await prisma.salesOrder.deleteMany({ where: { order_number: bill1.billNo } });
      }
      if (bill2) {
        await prisma.payment.deleteMany({ where: { sales_order: { order_number: bill2.billNo } } });
        await prisma.invoice.deleteMany({ where: { sales_order: { order_number: bill2.billNo } } });
        await prisma.salesOrderItem.deleteMany({ where: { sales_order: { order_number: bill2.billNo } } });
        await prisma.salesOrder.deleteMany({ where: { order_number: bill2.billNo } });
      }
      if (testProduct) {
        await prisma.stockMovement.deleteMany({ where: { product_id: testProduct.id } });
        await prisma.product.delete({ where: { id: testProduct.id } });
      }
      if (testTemplate) {
        const shadow = await prisma.product.findFirst({ where: { sku: testTemplate.code } });
        if (shadow) {
          await prisma.product.delete({ where: { id: shadow.id } });
        }
        await prisma.stitchingAddon.deleteMany({ where: { template_id: testTemplate.id } });
        await prisma.stitchingTemplate.delete({ where: { id: testTemplate.id } });
      }
      if (testCustomer) {
        await prisma.customerMeasurementVersion.deleteMany({ where: { profile: { customer_id: testCustomer.id } } });
        await prisma.customerMeasurementProfile.deleteMany({ where: { customer_id: testCustomer.id } });
        await prisma.customer.delete({ where: { id: testCustomer.id } });
      }
      console.log('✨ Cleanup complete.');
    } catch (cleanErr) {
      console.warn('Cleanup warning:', cleanErr);
    }
  }
}

runStitchingBillingTests().catch((err) => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
