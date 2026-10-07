import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3002/api';

function getStockStatus(currentStock: number, reorderPoint: number): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (currentStock <= 0) return 'OUT_OF_STOCK';
  if (currentStock <= reorderPoint) return 'LOW_STOCK';
  return 'IN_STOCK';
}

async function runTests() {
  console.log('🧪 Starting 10-Scenario Product Status & Filter Verification Suite...\n');

  const timestamp = Date.now().toString().slice(-4);

  // ==========================================
  // TEST 1: Create a new product
  // Expected: ACTIVE by default, visible in Products & Stock and Billing
  // ==========================================
  console.log('▶️ TEST 1: Create a new product');
  const sku1 = `YZ-T1-${timestamp}`;
  const prodRes1 = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sku: sku1,
      name: `Test Silk Saree 1 ${timestamp}`,
      category: 'Sarees',
      unit: 'PCS',
      purchasePrice: 4000,
      salePrice: 7500,
      minStockLevel: 3,
      initialStock: 8,
    }),
  });
  assert.equal(prodRes1.status, 201, 'Product creation should return 201');
  const prod1 = await prodRes1.json();
  assert.equal(prod1.status, 'ACTIVE', 'New product must default to ACTIVE');
  assert.equal(prod1.isActive, true, 'isActive must be true');
  assert.equal(prod1.isArchived, false, 'isArchived must be false');

  // Verify visible in default Products & Stock (GET /products)
  const defaultList = await (await fetch(`${BASE_URL}/products`)).json();
  const foundInDefault = defaultList.find((p: any) => p.id === prod1.id);
  assert.ok(foundInDefault, 'New product must be visible in default active Products list');
  assert.equal(foundInDefault.status, 'ACTIVE');

  // Verify visible in Billing (GET /products?status=active)
  const billingList = await (await fetch(`${BASE_URL}/products?status=active`)).json();
  const foundInBilling = billingList.find((p: any) => p.id === prod1.id);
  assert.ok(foundInBilling, 'New product must be visible in Billing catalog');
  console.log('✅ TEST 1 PASSED: Product created ACTIVE by default and visible in default catalog & Billing.\n');

  // ==========================================
  // TEST 2: Archive that product
  // Expected: ARCHIVED status, disappears from Active Products & Billing, cannot be searched or sold
  // ==========================================
  console.log('▶️ TEST 2: Archive that product');
  const archiveRes = await fetch(`${BASE_URL}/products/${prod1.id}/archive`, {
    method: 'POST',
  });
  assert.equal(archiveRes.status, 200, 'Archive endpoint must return 200');
  const archiveData = await archiveRes.json();
  assert.equal(archiveData.status, 'ARCHIVED');
  assert.equal(archiveData.isArchived, true);
  assert.equal(archiveData.isActive, false);

  // Check detail endpoint
  const prod1Detail = await (await fetch(`${BASE_URL}/products/${prod1.id}`)).json();
  assert.equal(prod1Detail.status, 'ARCHIVED');
  assert.equal(prod1Detail.isArchived, true);
  assert.equal(prod1Detail.isActive, false);

  // Check default Products list (must not contain it)
  const defaultListAfterArchive = await (await fetch(`${BASE_URL}/products`)).json();
  assert.ok(!defaultListAfterArchive.some((p: any) => p.id === prod1.id), 'Archived product must disappear from default Active Products');

  // Check Billing list (must not contain it)
  const billingListAfterArchive = await (await fetch(`${BASE_URL}/products?status=active`)).json();
  assert.ok(!billingListAfterArchive.some((p: any) => p.id === prod1.id), 'Archived product must disappear from Billing catalog');

  // Attempt Billing Checkout with archived product (must be rejected)
  const custRes = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Tester ${timestamp}`,
      phone: `+91 99999 ${Math.floor(10000 + Math.random() * 90000)}`,
    }),
  });
  const cust = await custRes.json();

  const checkoutAttempt = await fetch(`${BASE_URL}/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: cust.id,
      customer_name: cust.name,
      payment_mode: 'CASH',
      items: [{ product_id: prod1.id, quantity: 1, unit_price: 7500, tax_rate: 5.0 }],
    }),
  });
  assert.equal(checkoutAttempt.status, 400, 'Billing checkout of archived product must be rejected with 400');
  const checkoutErr = await checkoutAttempt.json();
  assert.match(checkoutErr.error, /archived/i, 'Error message must specify product is archived');

  // Attempt Sales Order creation with archived product (must be rejected)
  const soAttempt = await fetch(`${BASE_URL}/sales-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: cust.id,
      items: [{ product_id: prod1.id, quantity: 1, unit_price: 7500, tax_rate: 5.0 }],
    }),
  });
  assert.equal(soAttempt.status, 400, 'Sales order creation of archived product must be rejected with 400');
  console.log('✅ TEST 2 PASSED: Archived product correctly disappears from Billing and cannot be purchased.\n');

  // ==========================================
  // TEST 3: Open Products & Stock -> Active
  // Expected: All ACTIVE products appear (In Stock, Low Stock, Out of Stock). No archived products.
  // ==========================================
  console.log('▶️ TEST 3: Products & Stock -> Active with all stock tiers');
  // Create In Stock active product
  const inStockSku = `YZ-IN-${timestamp}`;
  const inStockRes = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sku: inStockSku,
      name: `In Stock Product ${timestamp}`,
      category: 'Sarees',
      minStockLevel: 2,
      initialStock: 15,
      salePrice: 5000,
      purchasePrice: 3000,
    }),
  });
  const inStockProd = await inStockRes.json();

  // Create Low Stock active product (stock <= minStockLevel)
  const lowStockSku = `YZ-LOW-${timestamp}`;
  const lowStockRes = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sku: lowStockSku,
      name: `Low Stock Product ${timestamp}`,
      category: 'Sarees',
      minStockLevel: 5,
      initialStock: 2,
      salePrice: 5000,
      purchasePrice: 3000,
    }),
  });
  const lowStockProd = await lowStockRes.json();

  // Create Out of Stock active product (stock == 0)
  const outOfStockSku = `YZ-OUT-${timestamp}`;
  const outOfStockRes = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sku: outOfStockSku,
      name: `Out of Stock Product ${timestamp}`,
      category: 'Sarees',
      minStockLevel: 3,
      initialStock: 0,
      salePrice: 5000,
      purchasePrice: 3000,
    }),
  });
  const outOfStockProd = await outOfStockRes.json();

  // Query Active
  const activeProds = await (await fetch(`${BASE_URL}/products?status=active`)).json();
  const ids = activeProds.map((p: any) => p.id);

  assert.ok(ids.includes(inStockProd.id), 'Active query must include In Stock product');
  assert.ok(ids.includes(lowStockProd.id), 'Active query must include Low Stock product');
  assert.ok(ids.includes(outOfStockProd.id), 'Active query must include Out of Stock product');
  assert.ok(!ids.includes(prod1.id), 'Active query must NOT include archived product prod1');

  // Verify stock status derivations
  assert.equal(getStockStatus(inStockProd.currentStock, inStockProd.reorderPoint), 'IN_STOCK');
  assert.equal(getStockStatus(lowStockProd.currentStock, lowStockProd.reorderPoint), 'LOW_STOCK');
  assert.equal(getStockStatus(outOfStockProd.currentStock, outOfStockProd.reorderPoint), 'OUT_OF_STOCK');
  console.log('✅ TEST 3 PASSED: Active list shows all stock states (In Stock, Low Stock, Out of Stock) and 0 archived items.\n');

  // ==========================================
  // TEST 4: Select Archived
  // Expected: Only archived products appear
  // ==========================================
  console.log('▶️ TEST 4: Select Archived');
  const archivedProds = await (await fetch(`${BASE_URL}/products?status=archived`)).json();
  assert.ok(archivedProds.every((p: any) => p.status === 'ARCHIVED' && p.isArchived === true && p.isActive === false),
    'Every item in archived query must be ARCHIVED');
  const archIds = archivedProds.map((p: any) => p.id);
  assert.ok(archIds.includes(prod1.id), 'Archived query must include prod1');
  assert.ok(!archIds.includes(inStockProd.id), 'Archived query must NOT include inStockProd');
  assert.ok(!archIds.includes(lowStockProd.id), 'Archived query must NOT include lowStockProd');
  assert.ok(!archIds.includes(outOfStockProd.id), 'Archived query must NOT include outOfStockProd');
  console.log('✅ TEST 4 PASSED: Archived list contains ONLY archived products.\n');

  // ==========================================
  // TEST 5: Select All
  // Expected: Both active and archived products appear
  // ==========================================
  console.log('▶️ TEST 5: Select All');
  const allProds = await (await fetch(`${BASE_URL}/products?status=all`)).json();
  const allIds = allProds.map((p: any) => p.id);
  assert.ok(allIds.includes(prod1.id), 'All query must include archived prod1');
  assert.ok(allIds.includes(inStockProd.id), 'All query must include active inStockProd');
  assert.ok(allIds.includes(lowStockProd.id), 'All query must include active lowStockProd');
  assert.ok(allIds.includes(outOfStockProd.id), 'All query must include active outOfStockProd');
  console.log('✅ TEST 5 PASSED: All list contains both active and archived products.\n');

  // ==========================================
  // TEST 6: Combine Active + Low Stock
  // Expected: Only ACTIVE + Low Stock products
  // ==========================================
  console.log('▶️ TEST 6: Combine Active + Low Stock');
  const activeLowStock = activeProds.filter((p: any) => getStockStatus(p.currentStock, p.reorderPoint) === 'LOW_STOCK');
  const lowIds = activeLowStock.map((p: any) => p.id);
  assert.ok(lowIds.includes(lowStockProd.id), 'Active + Low Stock must include lowStockProd');
  assert.ok(!lowIds.includes(inStockProd.id), 'Active + Low Stock must NOT include inStockProd');
  assert.ok(!lowIds.includes(outOfStockProd.id), 'Active + Low Stock must NOT include outOfStockProd');
  assert.ok(!lowIds.includes(prod1.id), 'Active + Low Stock must NOT include prod1');
  console.log('✅ TEST 6 PASSED: Active + Low Stock matches exactly.\n');

  // ==========================================
  // TEST 7: Combine Active + Out of Stock
  // Expected: Only ACTIVE + Out of Stock products
  // ==========================================
  console.log('▶️ TEST 7: Combine Active + Out of Stock');
  const activeOutOfStock = activeProds.filter((p: any) => getStockStatus(p.currentStock, p.reorderPoint) === 'OUT_OF_STOCK');
  const outIds = activeOutOfStock.map((p: any) => p.id);
  assert.ok(outIds.includes(outOfStockProd.id), 'Active + Out of Stock must include outOfStockProd');
  assert.ok(!outIds.includes(inStockProd.id), 'Active + Out of Stock must NOT include inStockProd');
  assert.ok(!outIds.includes(lowStockProd.id), 'Active + Out of Stock must NOT include lowStockProd');
  assert.ok(!outIds.includes(prod1.id), 'Active + Out of Stock must NOT include prod1');
  console.log('✅ TEST 7 PASSED: Active + Out of Stock matches exactly.\n');

  // ==========================================
  // TEST 8: Unarchive a product
  // Expected: Returns to ACTIVE, appears in Active Products and Billing again
  // ==========================================
  console.log('▶️ TEST 8: Unarchive a product');
  const unarchiveRes = await fetch(`${BASE_URL}/products/${prod1.id}/unarchive`, {
    method: 'POST',
  });
  assert.equal(unarchiveRes.status, 200, 'Unarchive endpoint must return 200');
  const unarchiveData = await unarchiveRes.json();
  assert.equal(unarchiveData.status, 'ACTIVE');
  assert.equal(unarchiveData.isActive, true);
  assert.equal(unarchiveData.isArchived, false);

  const activeAfterRestore = await (await fetch(`${BASE_URL}/products?status=active`)).json();
  const restoredFound = activeAfterRestore.find((p: any) => p.id === prod1.id);
  assert.ok(restoredFound, 'Restored product must appear in Active catalog');
  assert.equal(restoredFound.status, 'ACTIVE');

  // Now Billing can query and sell it
  const billRes = await fetch(`${BASE_URL}/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: cust.id,
      customer_name: cust.name,
      payment_mode: 'CASH',
      items: [{ product_id: prod1.id, quantity: 1, unit_price: 7500, tax_rate: 5.0 }],
    }),
  });
  assert.equal(billRes.status, 201, 'Restored product can now be billed successfully');
  console.log('✅ TEST 8 PASSED: Restored product returns to ACTIVE and is available in Billing.\n');

  // ==========================================
  // TEST 9: Refresh & Edit persistence (archived products must stay archived on edit)
  // Expected: Status persists correctly. Editing an archived product does NOT reactivate it.
  // ==========================================
  console.log('▶️ TEST 9: Persistence & Edit safety');
  // Re-archive prod1
  await fetch(`${BASE_URL}/products/${prod1.id}/archive`, { method: 'POST' });
  const checkArchived = await (await fetch(`${BASE_URL}/products/${prod1.id}`)).json();
  assert.equal(checkArchived.status, 'ARCHIVED');

  // Edit the archived product (update price and description)
  const editRes = await fetch(`${BASE_URL}/products/${prod1.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      salePrice: 8500,
      description: 'Updated while archived',
    }),
  });
  assert.equal(editRes.status, 200, 'Edit archived product must succeed');

  // Fetch product after edit
  const afterEdit = await (await fetch(`${BASE_URL}/products/${prod1.id}`)).json();
  assert.equal(afterEdit.status, 'ARCHIVED', 'Editing an archived product must NOT accidentally reactivate it');
  assert.equal(afterEdit.isArchived, true);
  assert.equal(afterEdit.isActive, false);
  assert.equal(afterEdit.salePrice, 8500);
  assert.equal(afterEdit.description, 'Updated while archived');
  console.log('✅ TEST 9 PASSED: Status persists and editing an archived product does not reactivate it.\n');

  // ==========================================
  // TEST 10: Search + Lifecycle + Stock filter pipeline
  // Expected: Proper execution order and accurate counts
  // ==========================================
  console.log('▶️ TEST 10: Search + Lifecycle + Stock filter pipeline');
  const allForFilter = await (await fetch(`${BASE_URL}/products?status=all`)).json();

  // Test pipeline:
  // Lifecycle = ACTIVE, Stock = IN_STOCK, Search = lowStockSku
  const filtered1 = allForFilter
    .filter((p: any) => p.status === 'ACTIVE')
    .filter((p: any) => getStockStatus(p.currentStock, p.reorderPoint) === 'IN_STOCK')
    .filter((p: any) => p.sku.includes(lowStockSku));
  assert.equal(filtered1.length, 0, 'lowStockSku is not IN_STOCK, so result should be empty');

  // Lifecycle = ACTIVE, Stock = LOW_STOCK, Search = lowStockSku
  const filtered2 = allForFilter
    .filter((p: any) => p.status === 'ACTIVE')
    .filter((p: any) => getStockStatus(p.currentStock, p.reorderPoint) === 'LOW_STOCK')
    .filter((p: any) => p.sku.includes(lowStockSku));
  assert.equal(filtered2.length, 1, 'Should find exactly 1 matching item');
  assert.equal(filtered2[0].id, lowStockProd.id);

  // Lifecycle = ARCHIVED, Search = sku1
  const filtered3 = allForFilter
    .filter((p: any) => p.status === 'ARCHIVED')
    .filter((p: any) => p.sku.includes(sku1));
  assert.equal(filtered3.length, 1, 'Should find archived prod1');

  // Lifecycle = ACTIVE, Search = sku1
  const filtered4 = allForFilter
    .filter((p: any) => p.status === 'ACTIVE')
    .filter((p: any) => p.sku.includes(sku1));
  assert.equal(filtered4.length, 0, 'prod1 is archived, so should not appear when lifecycle is ACTIVE');

  console.log('✅ TEST 10 PASSED: Filter pipeline correctly applies lifecycle, stock, and search filters in order.\n');

  console.log('🎉 ALL 10 TEST SCENARIOS PASSED WITH 100% SUCCESS!');
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
