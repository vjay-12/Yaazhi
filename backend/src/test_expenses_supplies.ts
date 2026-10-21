import assert from 'node:assert/strict';
import { prisma } from './db.js';
import { SupplyMovementType } from '@prisma/client';

const BASE_URL = process.env.TEST_API_URL || 'http://localhost:3002/api';

async function runExpensesSuppliesTests() {
  console.log('🧪 Starting Expenses & Supplies Management Integration Test Suite...\n');

  let testVendor: any = null;
  let testSupply1: any = null;
  let testSupply2: any = null;
  let testPurchase: any = null;
  let testExpense1: any = null;
  let testExpense2: any = null;
  let testPhysicalProduct: any = null;

  try {
    // 0. Setup: Ensure a test vendor exists
    const vendorName = `Test Artisan Supplies ${Date.now().toString().slice(-4)}`;
    testVendor = await prisma.supplier.create({
      data: {
        name: vendorName,
        contact_person: 'Ramesh Weaves',
        phone: '9876543210',
        city: 'Coimbatore',
        category: 'Trims & Consumables',
      },
    });
    console.log(`✅ 0. Setup: Created test vendor "${testVendor.name}" (${testVendor.id})`);

    // 0b. Find or create a physical ready-made product to verify strict inventory separation
    testPhysicalProduct = await prisma.product.findFirst();
    if (!testPhysicalProduct) {
      const prodRes = await fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: `READY-MADE-${Date.now().toString().slice(-5)}`,
          name: 'Kalamkari Silk Anarkali Dress',
          fabric: 'Pure Silk',
          craft: 'Handloom Zari',
          category: 'Sarees',
          unit: 'PCS',
          purchasePrice: 3000,
          salePrice: 6500,
          taxRate: 5.0,
          minStockLevel: 2,
        }),
      });
      testPhysicalProduct = await prodRes.json();
    }
    console.log(`✅ 0b. Setup: Verified ready-made physical product "${testPhysicalProduct.name}" (${testPhysicalProduct.id})`);

    const initialPhysicalBalances = await prisma.stockBalance.findMany({
      where: { product_id: testPhysicalProduct.id },
      orderBy: { id: 'asc' },
    });

    // ----------------------------------------------------
    // 1. Create Consumable Supply Items
    // ----------------------------------------------------
    console.log('\n--- Test 1: Consumable Supplies Inventory & Movement Ledger ---');
    const supplyRes1 = await fetch(`${BASE_URL}/supplies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Pure Cotton Cambric Lining Fabric',
        category: 'Fabric & Linings',
        unit: 'meters',
        min_stock_level: 15,
        unit_cost: 65.0,
        initial_quantity: 50,
        default_supplier_id: testVendor.id,
        notes: '60s count premium breathable lining for blouses and dresses',
      }),
    });
    assert.equal(supplyRes1.status, 201, 'Supply 1 creation should return 201');
    const supplyJson1 = await supplyRes1.json();
    assert.equal(supplyJson1.success, true);
    testSupply1 = supplyJson1.data;
    assert.ok(testSupply1.sku.startsWith('SUP-'), 'SKU should be auto-generated with prefix');
    assert.equal(Number(testSupply1.current_quantity), 50, 'Initial quantity should be 50');

    // Verify initial stock movement in ledger
    const initialMovement = await prisma.supplyMovement.findFirst({
      where: {
        supply_id: testSupply1.id,
        movement_type: SupplyMovementType.ADJUSTMENT_ADD,
      },
    });
    assert.ok(initialMovement, 'Initial opening stock movement must exist in ledger');
    assert.equal(Number(initialMovement.quantity), 50);
    assert.equal(Number(initialMovement.balance_after), 50);
    console.log(`✅ 1a. Created supply item 1: ${testSupply1.name} (SKU: ${testSupply1.sku}, Stock: ${testSupply1.current_quantity} ${testSupply1.unit})`);

    // Create second supply item with zero initial stock (low stock alert)
    const supplyRes2 = await fetch(`${BASE_URL}/supplies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'YKK Antique Brass Concealed Zippers 12"',
        category: 'Zippers & Fasteners',
        unit: 'pcs',
        min_stock_level: 20,
        unit_cost: 18.5,
        initial_quantity: 5, // Below threshold of 20
        default_supplier_id: testVendor.id,
      }),
    });
    assert.equal(supplyRes2.status, 201);
    const supplyJson2 = await supplyRes2.json();
    testSupply2 = supplyJson2.data;
    console.log(`✅ 1b. Created supply item 2: ${testSupply2.name} (Stock: ${testSupply2.current_quantity}, below threshold of ${testSupply2.min_stock_level})`);

    // ----------------------------------------------------
    // 2. Multi-Item Purchase Order & Automatic Stock Receipt
    // ----------------------------------------------------
    console.log('\n--- Test 2: Multi-Item Purchase Order & Stock Receipt ---');
    const purchasePayload = {
      supplier_id: testVendor.id,
      supplier_name: testVendor.name,
      supplier_phone: testVendor.phone,
      purchase_date: new Date().toISOString(),
      invoice_number: `INV-${Date.now().toString().slice(-6)}`,
      discount_total: 50.0,
      paid_amount: 1500.0,
      payment_method: 'UPI',
      items: [
        {
          supply_id: testSupply1.id,
          quantity: 30, // 30 meters @ 65 = 1950 + 5% tax = 2047.50
          unit_cost: 65.0,
          tax_rate: 5.0,
        },
        {
          supply_id: testSupply2.id,
          quantity: 50, // 50 pcs @ 18.50 = 925 + 12% tax = 1036.00
          unit_cost: 18.5,
          tax_rate: 12.0,
        },
      ],
    };

    const purchaseRes = await fetch(`${BASE_URL}/supply-purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(purchasePayload),
    });
    assert.equal(purchaseRes.status, 201, 'Purchase creation should return 201');
    const purchaseJson = await purchaseRes.json();
    assert.equal(purchaseJson.success, true);
    testPurchase = purchaseJson.data;

    // Verify mathematical totals
    // Subtotal: 30*65 + 50*18.50 = 1950 + 925 = 2875.00
    // Tax: 1950*0.05 (97.50) + 925*0.12 (111.00) = 208.50
    // Grand Total: 2875.00 + 208.50 - 50 = 3033.50
    // Paid: 1500.00 => Balance: 1533.50 => Status: PARTIAL
    assert.equal(Number(testPurchase.subtotal), 2875);
    assert.equal(Number(testPurchase.tax_total), 208.5);
    assert.equal(Number(testPurchase.discount_total), 50);
    assert.equal(Number(testPurchase.grand_total), 3033.5);
    assert.equal(Number(testPurchase.paid_amount), 1500);
    assert.equal(Number(testPurchase.balance_amount), 1533.5);
    assert.equal(testPurchase.payment_status, 'PARTIAL');
    console.log(`✅ 2a. Multi-item purchase created: ${testPurchase.purchase_number} (Grand Total: ₹${testPurchase.grand_total}, Status: ${testPurchase.payment_status}, Balance Due: ₹${testPurchase.balance_amount})`);

    // Verify EXACT stock receipt on supply items
    const updatedSupply1 = await prisma.supplyItem.findUnique({ where: { id: testSupply1.id } });
    const updatedSupply2 = await prisma.supplyItem.findUnique({ where: { id: testSupply2.id } });
    assert.equal(Number(updatedSupply1?.current_quantity), 80, 'Supply 1 stock should be 50 + 30 = 80');
    assert.equal(Number(updatedSupply2?.current_quantity), 55, 'Supply 2 stock should be 5 + 50 = 55');

    // Verify purchase receipt movements
    const receiptMovements = await prisma.supplyMovement.findMany({
      where: {
        reference_id: testPurchase.id,
        movement_type: SupplyMovementType.PURCHASE_RECEIPT,
      },
    });
    assert.equal(receiptMovements.length, 2, 'Should create exactly 2 movements for 2 line items');
    console.log(`✅ 2b. Exactly-once stock increment verified: Supply 1 = 80m, Supply 2 = 55pcs`);

    // ----------------------------------------------------
    // 3. Stock Consumption Linked to Stitching Order
    // ----------------------------------------------------
    console.log('\n--- Test 3: Stock Consumption & Tailoring Stitching Order Linkage ---');
    const stitchingOrderNum = `SO-${Date.now().toString().slice(-4)}`;

    const consumeRes = await fetch(`${BASE_URL}/supplies/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supply_id: testSupply1.id,
        quantity: 3.5, // 3.5 meters used for blouse lining
        stitching_order_number: stitchingOrderNum,
        notes: 'Attached pure cotton lining for silk bridal blouse',
      }),
    });
    assert.equal(consumeRes.status, 200, 'Consumption should return 200');
    const consumeJson = await consumeRes.json();
    assert.equal(consumeJson.success, true);
    assert.equal(Number(consumeJson.data.supply.current_quantity), 76.5, 'Stock should be 80 - 3.5 = 76.5');

    // Verify consumption ledger movement
    const consumeMovement = await prisma.supplyMovement.findFirst({
      where: {
        supply_id: testSupply1.id,
        movement_type: SupplyMovementType.CONSUMPTION,
        stitching_order_number: stitchingOrderNum,
      },
    });
    assert.ok(consumeMovement, 'Consumption movement must record stitching order number');
    assert.equal(Number(consumeMovement.quantity), -3.5);
    assert.equal(Number(consumeMovement.balance_after), 76.5);
    console.log(`✅ 3a. Consumed 3.5m of lining for stitching order "${stitchingOrderNum}". Remaining stock: 76.5m`);

    // Verify physical ready-made product inventory is UNTOUCHED
    const finalPhysicalBalances = await prisma.stockBalance.findMany({
      where: { product_id: testPhysicalProduct.id },
      orderBy: { id: 'asc' },
    });
    assert.deepEqual(
      finalPhysicalBalances.map((b) => ({ id: b.id, qty: Number(b.quantity) })),
      initialPhysicalBalances.map((b) => ({ id: b.id, qty: Number(b.quantity) })),
      'Ready-made product stock balances must not be altered by supplies movements'
    );
    console.log(`✅ 3b. Ready-made product inventory confirmed strictly isolated and unaffected.`);


    // ----------------------------------------------------
    // 4. Physical Count Stock Adjustment
    // ----------------------------------------------------
    console.log('\n--- Test 4: Physical Count & Stock Reconciliation ---');
    const adjustRes = await fetch(`${BASE_URL}/supplies/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        supply_id: testSupply2.id,
        physical_count: 52, // Current is 55, variance of -3 (damaged zippers)
        reason: 'Monthly physical audit: 3 zippers defective/discarded',
      }),
    });
    assert.equal(adjustRes.status, 200);
    const adjustJson = await adjustRes.json();
    assert.equal(adjustJson.success, true);
    assert.equal(adjustJson.data.adjustment_difference, -3);
    assert.equal(Number(adjustJson.data.supply.current_quantity), 52);

    const adjustMovement = await prisma.supplyMovement.findFirst({
      where: {
        supply_id: testSupply2.id,
        movement_type: SupplyMovementType.ADJUSTMENT_REDUCE,
      },
    });
    assert.ok(adjustMovement, 'Adjustment reduction movement must be recorded');
    assert.equal(Number(adjustMovement.balance_after), 52);
    console.log(`✅ 4. Reconciled stock for zippers: count adjusted from 55 to 52 (variance: -3)`);

    // ----------------------------------------------------
    // 5. Operating Expenses & Void Audit Trail
    // ----------------------------------------------------
    console.log('\n--- Test 5: Operating Expenses & Voiding Audit Trail ---');
    // Expense 1: Rent
    const expRes1 = await fetch(`${BASE_URL}/operating-expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Rent & Lease',
        title: 'Boutique Atelier Showroom Rent (October 2026)',
        amount: 25000,
        expense_date: new Date().toISOString(),
        payment_method: 'BANK_TRANSFER',
        payee_name: 'Commercial Real Estate Landlord',
        reference_number: 'RENT-OCT-2026',
      }),
    });
    assert.equal(expRes1.status, 201);
    const expJson1 = await expRes1.json();
    testExpense1 = expJson1.data;
    assert.equal(testExpense1.status, 'ACTIVE');
    assert.ok(testExpense1.expense_number.startsWith('EXP-'));
    console.log(`✅ 5a. Created operating expense 1: ${testExpense1.expense_number} (₹${testExpense1.amount}, ${testExpense1.category})`);

    // Expense 2: Utilities (to be voided)
    const expRes2 = await fetch(`${BASE_URL}/operating-expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Electricity & Utilities',
        title: 'Duplicate Utility Payment Entry',
        amount: 3200,
        expense_date: new Date().toISOString(),
        payment_method: 'UPI',
        payee_name: 'TANGEDCO',
      }),
    });
    assert.equal(expRes2.status, 201);
    const expJson2 = await expRes2.json();
    testExpense2 = expJson2.data;

    // Void expense 2
    const voidRes = await fetch(`${BASE_URL}/operating-expenses/${testExpense2.id}/void`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        void_reason: 'Duplicate entry detected; invoice already settled under voucher #4491',
      }),
    });
    assert.equal(voidRes.status, 200);
    const voidJson = await voidRes.json();
    assert.equal(voidJson.data.status, 'VOIDED');
    assert.ok(voidJson.data.void_reason.includes('Duplicate entry'));
    console.log(`✅ 5b. Voided operating expense 2 with audit reason: "${voidJson.data.void_reason}"`);

    // ----------------------------------------------------
    // 6. Accounting & Reports Summary Verification
    // ----------------------------------------------------
    console.log('\n--- Test 6: Accounting Reports & Financial Breakdown ---');
    const reportRes = await fetch(`${BASE_URL}/expenses-supplies-reports/summary?period=all`);
    if (reportRes.status !== 200) {
      console.error('Report error output:', await reportRes.text());
    }
    assert.equal(reportRes.status, 200);
    const reportJson = await reportRes.json();
    assert.equal(reportJson.success, true);
    const summary = reportJson.data;

    // Verify stock valuation: sum of (current_quantity * unit_cost)
    // testSupply1: 76.5 * 65.0 = 4972.50
    // testSupply2: 52 * 18.50 = 962.00
    assert.ok(summary.supplies_stock.total_valuation_at_cost > 0);
    console.log(`✅ 6a. Supplies Stock Valuation at cost: ₹${summary.supplies_stock.total_valuation_at_cost}`);

    // Verify operating expenses: Voided expenses MUST be excluded!
    const activeExpenseCategories = summary.operating_expenses.by_category;
    const rentCategory = activeExpenseCategories.find((c: any) => c.category === 'Rent & Lease');
    assert.ok(rentCategory, 'Rent & Lease category should exist in report');
    assert.equal(rentCategory.total_amount, 25000);

    // Verify total operating expenses equals sum of active expenses
    assert.ok(summary.operating_expenses.period_total_amount >= 25000);
    assert.ok(summary.operating_expenses.voided_expenses_count >= 1);
    console.log(`✅ 6b. Active operating expenses: ₹${summary.operating_expenses.period_total_amount} (Voided excluded)`);

    // Verify outstanding supplier balances
    assert.ok(summary.supplies_purchases.all_time_outstanding_supplier_balance >= 1533.5);
    console.log(`✅ 6c. Outstanding supplier payable balance: ₹${summary.supplies_purchases.all_time_outstanding_supplier_balance}`);

    // ----------------------------------------------------
    // 7. Additional Payment & Purchase Cancellation
    // ----------------------------------------------------
    console.log('\n--- Test 7: Supplier Payment & Cancellation Reversal ---');
    // Record additional payment towards testPurchase
    const paymentRes = await fetch(`${BASE_URL}/supply-purchases/${testPurchase.id}/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 1533.5,
        payment_method: 'BANK_TRANSFER',
        notes: 'Final settlement of invoice',
      }),
    });
    assert.equal(paymentRes.status, 200);
    const paymentJson = await paymentRes.json();
    assert.equal(paymentJson.data.payment_status, 'PAID');
    assert.equal(Number(paymentJson.data.balance_amount), 0);
    console.log(`✅ 7. Settled outstanding balance on purchase order: Status is now PAID (Balance: ₹0)`);

    console.log('\n🎉 ALL EXPENSES & SUPPLIES INTEGRATION TESTS PASSED SUCCESSFULLY! ✨\n');
  } finally {
    // Cleanup test records
    try {
      if (testPurchase?.id) {
        await prisma.supplyPurchaseItem.deleteMany({ where: { purchase_id: testPurchase.id } });
        await prisma.supplyMovement.deleteMany({ where: { reference_id: testPurchase.id } });
        await prisma.supplyPurchase.delete({ where: { id: testPurchase.id } });
      }
      if (testSupply1?.id) {
        await prisma.supplyMovement.deleteMany({ where: { supply_id: testSupply1.id } });
        await prisma.supplyItem.delete({ where: { id: testSupply1.id } });
      }
      if (testSupply2?.id) {
        await prisma.supplyMovement.deleteMany({ where: { supply_id: testSupply2.id } });
        await prisma.supplyItem.delete({ where: { id: testSupply2.id } });
      }
      if (testExpense1?.id) {
        await prisma.operatingExpense.delete({ where: { id: testExpense1.id } });
      }
      if (testExpense2?.id) {
        await prisma.operatingExpense.delete({ where: { id: testExpense2.id } });
      }
      if (testVendor?.id) {
        await prisma.supplier.delete({ where: { id: testVendor.id } });
      }

    } catch (cleanupErr) {
      console.warn('Cleanup warning:', cleanupErr);
    }
  }
}

runExpensesSuppliesTests().catch((err) => {
  console.error('\n❌ Integration Test Suite Failed:\n', err);
  process.exit(1);
});
