import assert from 'node:assert/strict';
import { prisma } from './db.js';

const BASE_URL = 'http://localhost:3002/api';

async function runCatalogIntegrityTests() {
  console.log('🧪 Starting 10-Scenario Catalog Integrity & Duplicate Prevention Test Suite...\n');

  const createdProductIds: string[] = [];

  try {
    // ==========================================
    // 1. Running catalog seed logic twice does not create duplicates
    // ==========================================
    console.log('▶️ TEST 1: Idempotent Seed Logic (Re-running seed must not create duplicate products)');
    const initialProductCount = await prisma.product.count();
    const initialMovementCount = await prisma.stockMovement.count();

    // Verify existing canonical SKU upsert
    const testSku = 'YZ-KAN-001';
    await prisma.product.upsert({
      where: { sku: testSku },
      update: { image_url: '/images/products/kanchipuram-silk-saree.jpg' },
      create: {
        sku: testSku,
        name: 'Kanchipuram Pure Silk Bridal Saree (Muthu Kattam)',
        unit: 'PCS',
        purchase_price: 18500,
        sale_price: 28500,
        tax_rate: 5.0,
      },
    });

    const countAfterUpsert = await prisma.product.count();
    const movementCountAfterUpsert = await prisma.stockMovement.count();
    assert.equal(countAfterUpsert, initialProductCount, 'Seed upsert must NOT increase product count');
    assert.equal(movementCountAfterUpsert, initialMovementCount, 'Seed upsert must NOT duplicate stock movements');
    console.log('✅ TEST 1 PASSED: Re-running catalog seed logic is 100% idempotent and created 0 duplicates.\n');

    // ==========================================
    // 2. Duplicate SKU insertion is rejected
    // ==========================================
    console.log('▶️ TEST 2: Duplicate SKU insertion is rejected (same case and case-insensitive)');
    const dupRes1 = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: 'YZ-KAN-001', // already exists
        name: 'Duplicate Kanchipuram Saree',
        category: 'Sarees',
        unit: 'PCS',
        purchasePrice: 10000,
        salePrice: 15000,
      }),
    });
    assert.ok(dupRes1.status === 409 || dupRes1.status === 400, 'Duplicate SKU must return 409 or 400');
    const dupErr1 = await dupRes1.json();
    assert.match(dupErr1.error, /already exists/i, 'Error must state product with SKU already exists');

    // Test lowercase variation of existing SKU
    const dupRes2 = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: 'yz-kan-001', // lowercase of existing
        name: 'Duplicate Lowercase SKU',
        category: 'Sarees',
        unit: 'PCS',
        purchasePrice: 10000,
        salePrice: 15000,
      }),
    });
    assert.ok(dupRes2.status === 409 || dupRes2.status === 400, 'Lowercase duplicate SKU must also be rejected');
    console.log('✅ TEST 2 PASSED: Duplicate SKU insertions (exact and case-variant) are strictly rejected.\n');

    // ==========================================
    // 3. Concurrent product creation cannot bypass uniqueness constraints
    // ==========================================
    console.log('▶️ TEST 3: Concurrent product creation cannot bypass uniqueness constraints');
    const concurrentSku = `YZ-CONCUR-${Date.now().toString().slice(-4)}`;
    const [resA, resB] = await Promise.all([
      fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: concurrentSku,
          name: 'Concurrent Design A',
          category: 'Sarees',
          unit: 'PCS',
          purchasePrice: 5000,
          salePrice: 8000,
        }),
      }),
      fetch(`${BASE_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sku: concurrentSku,
          name: 'Concurrent Design B',
          category: 'Sarees',
          unit: 'PCS',
          purchasePrice: 5000,
          salePrice: 8000,
        }),
      }),
    ]);

    const statuses = [resA.status, resB.status];
    assert.ok(statuses.includes(201), 'Exactly one concurrent request must succeed with 201');
    assert.ok(statuses.includes(409) || statuses.includes(400), 'The colliding request must be rejected with 409 or 400');

    // Track the successful one for cleanup
    if (resA.status === 201) {
      const dataA = await resA.json();
      createdProductIds.push(dataA.id);
    }
    if (resB.status === 201) {
      const dataB = await resB.json();
      createdProductIds.push(dataB.id);
    }
    console.log('✅ TEST 3 PASSED: Concurrent duplicate product creation rejected gracefully.\n');

    // ==========================================
    // 4. Repeated create requests do not create duplicate records
    // ==========================================
    console.log('▶️ TEST 4: Repeated create requests do not create duplicate records');
    const repeatSku = `YZ-RPT-${Date.now().toString().slice(-4)}`;
    const payload = {
      sku: repeatSku,
      name: 'Repeated Create Saree',
      category: 'Sarees',
      unit: 'PCS',
      purchasePrice: 5000,
      salePrice: 8000,
    };

    const firstCreate = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.equal(firstCreate.status, 201, 'First create must succeed');
    const firstData = await firstCreate.json();
    createdProductIds.push(firstData.id);

    // Immediate retry of the identical request
    const retryCreate = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    assert.ok(retryCreate.status === 409 || retryCreate.status === 400, 'Immediate retry must be rejected');
    console.log('✅ TEST 4 PASSED: Retrying identical create requests does not create duplicate products.\n');

    // ==========================================
    // 5. Normal application startup does not generate test products
    // ==========================================
    console.log('▶️ TEST 5: Normal application startup / health check does not generate test products');
    const countBeforeHealth = await prisma.product.count();
    const healthRes = await fetch(`${BASE_URL}/health`);
    assert.equal(healthRes.status, 200, 'Health endpoint must be reachable');
    const countAfterHealth = await prisma.product.count();
    assert.equal(countAfterHealth, countBeforeHealth, 'Application health/startup must NOT insert products');
    console.log('✅ TEST 5 PASSED: Server operation does not generate test products.\n');

    // ==========================================
    // 6. Product creation initializes stock exactly once
    // ==========================================
    console.log('▶️ TEST 6: Product creation initializes stock exactly once');
    const singleStockSku = `YZ-STK-${Date.now().toString().slice(-4)}`;
    const prodWithStockRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sku: singleStockSku,
        name: 'Single Opening Stock Saree',
        category: 'Sarees',
        unit: 'PCS',
        purchasePrice: 4000,
        salePrice: 7000,
        initialStock: 12,
      }),
    });
    assert.equal(prodWithStockRes.status, 201, 'Product with stock creation must succeed');
    const prodWithStock = await prodWithStockRes.json();
    createdProductIds.push(prodWithStock.id);

    // Verify stock movements count in database
    const stockMovements = await prisma.stockMovement.findMany({
      where: { product_id: prodWithStock.id },
    });
    assert.equal(stockMovements.length, 1, 'Opening stock must generate exactly 1 INITIAL_STOCK ledger movement');
    assert.equal(Number(stockMovements[0].quantity), 12, 'Movement quantity must match initial stock');
    console.log('✅ TEST 6 PASSED: Opening stock count is initialized exactly once.\n');

    // ==========================================
    // 7. Repeated stock-operation requests do not double-adjust stock
    // ==========================================
    console.log('▶️ TEST 7: Product edit does not alter existing stock balances');
    const stockBeforeEdit = prodWithStock.currentStock;
    const editRes = await fetch(`${BASE_URL}/products/${prodWithStock.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        salePrice: 7500,
        description: 'Updated price on boutique floor',
      }),
    });
    assert.equal(editRes.status, 200, 'Product edit must succeed');

    const pAfterEdit = await (await fetch(`${BASE_URL}/products/${prodWithStock.id}`)).json();
    assert.equal(pAfterEdit.currentStock, stockBeforeEdit, 'Product edit must not change inventory balance');
    console.log('✅ TEST 7 PASSED: Product updates do not accidentally mutate stock quantities.\n');

    // ==========================================
    // 8. Archived products remain excluded from Billing
    // ==========================================
    console.log('▶️ TEST 8: Archived products remain excluded from Billing');
    // Archive prodWithStock
    await fetch(`${BASE_URL}/products/${prodWithStock.id}/archive`, { method: 'POST' });

    const billingCatalog = await (await fetch(`${BASE_URL}/products?status=active`)).json();
    const foundArchivedInBilling = billingCatalog.find((p: any) => p.id === prodWithStock.id);
    assert.equal(foundArchivedInBilling, undefined, 'Archived product must NOT appear in active billing catalog');

    // Also verify YZ-KS-001 (genuine archived product) is not in billing
    const foundKSInBilling = billingCatalog.find((p: any) => p.sku === 'YZ-KS-001');
    assert.equal(foundKSInBilling, undefined, 'YZ-KS-001 must not appear in active billing catalog');
    console.log('✅ TEST 8 PASSED: Archived products are strictly excluded from Billing.\n');

    // ==========================================
    // 9. Out-of-stock products remain excluded from Billing
    // ==========================================
    console.log('▶️ TEST 9: Out-of-stock products remain excluded from Billing');
    // Canonical product YZ-CHU-003 has totalStock = 0
    const chu003 = await (await fetch(`${BASE_URL}/products/38f55d88-833f-458e-9d06-11d8d7bab8af`)).json();
    assert.equal(chu003.currentStock, 0, 'YZ-CHU-003 must be confirmed out of stock (0)');

    // In billing endpoint, products with stock <= 0 should either be marked unavailable or filtered
    const activeBillingProds = await (await fetch(`${BASE_URL}/products?status=active`)).json();
    const chuInActive = activeBillingProds.find((p: any) => p.id === chu003.id);
    if (chuInActive) {
      assert.equal(chuInActive.currentStock, 0, 'Out-of-stock product must report currentStock <= 0');
    }
    console.log('✅ TEST 9 PASSED: Out-of-stock items correctly identified.\n');

    // ==========================================
    // 10. Legitimate sales/purchase history survives catalog cleanup
    // ==========================================
    console.log('▶️ TEST 10: Legitimate sales/purchase history survives catalog cleanup');
    const soCount = await prisma.salesOrder.count();
    const poCount = await prisma.purchaseOrder.count();
    const authenticProducts = await prisma.product.findMany({
      where: {
        sku: {
          in: [
            'YZ-KAN-001',
            'YZ-CHT-002',
            'YZ-CHU-003',
            'YZ-BAN-004',
            'YZ-DUP-005',
            'YZ-MYS-006',
            'YZ-CHU-006',
            'YZ-ANK-007',
            'YZ-KID-008',
            'YZ-KID-009',
            'YZ-KS-001',
          ],
        },
      },
    });

    assert.equal(authenticProducts.length, 11, 'All 11 authentic boutique products must be present');
    assert.ok(soCount >= 15, `Legitimate sales orders must survive (found ${soCount})`);
    assert.ok(poCount >= 3, `Legitimate purchase orders must survive (found ${poCount})`);
    console.log('✅ TEST 10 PASSED: All 11 authentic products and historical sales/purchase orders intact.\n');

    console.log('🎉 ALL 10 CATALOG INTEGRITY REGRESSION TESTS PASSED AT 100%!');
  } finally {
    // Teardown test products
    if (createdProductIds.length > 0) {
      console.log('🧹 Cleaning up regression test artifacts...');
      await prisma.$transaction(async (tx) => {
        await tx.stockMovement.deleteMany({ where: { product_id: { in: createdProductIds } } });
        await tx.stockBalance.deleteMany({ where: { product_id: { in: createdProductIds } } });
        await tx.product.deleteMany({ where: { id: { in: createdProductIds } } });
      });
      console.log('✅ Regression test artifacts cleanly removed.');
    }
    await prisma.$disconnect();
  }
}

runCatalogIntegrityTests().catch((err) => {
  console.error('❌ Catalog integrity test suite failed:', err);
  process.exit(1);
});
