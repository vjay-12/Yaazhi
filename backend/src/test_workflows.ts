import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:3002/api';

async function runTests() {
  console.log('🧪 Starting End-to-End Workflow Validation Test...');

  // 1. Create a Vendor
  const vendorRes = await fetch(`${BASE_URL}/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Vellore Silk Guild',
      contactPerson: 'Karthik Raja',
      category: 'Fabric Supplier',
      vendorType: 'Fabric Supplier',
      city: 'Vellore',
      phone: '+91 94441 99881',
      gstin: '33AABCV9988A1Z9',
    }),
  });
  assert.equal(vendorRes.status, 201, 'Vendor creation must return 201');
  const vendor = await vendorRes.json();
  console.log('✅ 1. Created Vendor:', vendor.name, `(${vendor.id})`);

  // 2. Create a Product
  const uniqueSku = `YZ-TEST-${Date.now().toString().slice(-4)}`;
  const prodRes = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sku: uniqueSku,
      name: 'Mysore Crepe Silk Gold Zari Saree',
      fabric: 'Pure Crepe Silk',
      craft: 'Zari Weave',
      category: 'Sarees',
      unit: 'PCS',
      purchasePrice: 6000,
      salePrice: 10500,
      hsnCode: '5007',
      taxRate: 5.0,
      minStockLevel: 2,
      initialStock: 0,
    }),
  });
  assert.equal(prodRes.status, 201, 'Product creation must return 201');
  const product = await prodRes.json();
  console.log('✅ 2. Created Product:', product.name, `(SKU: ${product.sku}, Stock: ${product.currentStock})`);

  // 3. Create a Purchase Order: Vendor, Product x 10
  const poRes = await fetch(`${BASE_URL}/purchase-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      supplier_id: vendor.id,
      items: [
        {
          product_id: product.id,
          quantity: 10,
          unit_cost: 6000,
          tax_rate: 5.0,
        },
      ],
      notes: 'Initial test shipment',
    }),
  });
  assert.equal(poRes.status, 201, 'PO creation must return 201');
  const po = await poRes.json();
  console.log('✅ 3. Created Purchase Order:', po.po_number, `(${po.items.length} item)`);

  // 4. Receive the Purchase Order
  const recvRes = await fetch(`${BASE_URL}/purchase-orders/${po.id}/receive`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notes: 'Quality verified at receiving desk' }),
  });
  assert.equal(recvRes.status, 200, 'Receive PO must return 200');
  console.log('✅ 4. Received Purchase Order successfully');

  // 5. Verify inventory increased to 10
  const pCheck1 = await (await fetch(`${BASE_URL}/products/${product.id}`)).json();
  assert.equal(pCheck1.currentStock, 10, 'Stock must be exactly 10 after receiving PO');
  console.log('✅ 5. Verified stock increased to 10 units');

  // 6. Create a Customer
  const custRes = await fetch(`${BASE_URL}/customers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Rukmini Narayanan',
      phone: `+91 98401 ${Math.floor(10000 + Math.random() * 90000)}`,
      city: 'Chennai',
      email: 'rukmini.n@example.com',
      notes: 'VIP Bridal Client',
    }),
  });
  assert.equal(custRes.status, 201, 'Customer creation must return 201');
  const customer = await custRes.json();
  console.log('✅ 6. Created Customer:', customer.name, `(${customer.id})`);

  // 7. Create a Sales Order: Customer, Product x 2
  const soRes = await fetch(`${BASE_URL}/sales-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: customer.id,
      items: [
        {
          product_id: product.id,
          quantity: 2,
          unit_price: 10500,
          tax_rate: 5.0,
        },
      ],
      notes: 'Bridal trousseau booking',
    }),
  });
  assert.equal(soRes.status, 201, 'SO creation must return 201');
  const so = await soRes.json();
  console.log('✅ 7. Created Sales Order:', so.order_number, `(Status: ${so.status})`);

  // 8. Fulfill the Sales Order
  const fulfillRes = await fetch(`${BASE_URL}/sales-orders/${so.id}/fulfill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  assert.equal(fulfillRes.status, 200, 'SO fulfill must return 200');
  console.log('✅ 8. Fulfill Sales Order successfully');

  // 9. Verify inventory is now 8
  const pCheck2 = await (await fetch(`${BASE_URL}/products/${product.id}`)).json();
  assert.equal(pCheck2.currentStock, 8, 'Stock must be exactly 8 after fulfilling SO');
  console.log('✅ 9. Verified stock is now 8 units');

  // 10. Create a Billing POS transaction: Product x 1
  const billRes = await fetch(`${BASE_URL}/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer_id: customer.id,
      customer_name: customer.name,
      customer_phone: customer.phone,
      payment_mode: 'UPI',
      payment_reference: 'UPI/98401/887711',
      items: [
        {
          product_id: product.id,
          quantity: 1,
          unit_price: 10500,
          tax_rate: 5.0,
        },
      ],
      notes: 'Counter POS sale',
    }),
  });
  assert.equal(billRes.status, 201, 'Billing checkout must return 201');
  const bill = await billRes.json();
  console.log('✅ 10. Completed Billing transaction:', bill.billNo, `(Total: ₹${bill.totalAmount})`);

  // 11. Verify inventory is now 7
  const pCheck3 = await (await fetch(`${BASE_URL}/products/${product.id}`)).json();
  assert.equal(pCheck3.currentStock, 7, 'Stock must be exactly 7 after bill checkout');
  console.log('✅ 11. Verified stock is now 7 units');

  // 12. Check Stock Audit Log
  const movementsRes = await fetch(`${BASE_URL}/movements?search=${uniqueSku}`);
  const movements = await movementsRes.json();
  assert.ok(movements.length >= 3, 'Must have at least 3 movements for the product (PO +10, SO -2, Bill -1)');
  console.log('✅ 12. Stock Audit Log verified:', movements.length, 'records found for', uniqueSku);

  // 13. Check Reports
  const reportsRes = await fetch(`${BASE_URL}/reports/dashboard`);
  const reports = await reportsRes.json();
  assert.ok(reports.summary.totalStockUnits > 0, 'Total stock units must be positive');
  assert.ok(reports.summary.totalSalesRevenue > 0, 'Total sales revenue must be positive');
  console.log('✅ 13. Reports verified: Revenue =', reports.summary.totalSalesRevenue, 'Units =', reports.summary.totalStockUnits);

  console.log('🎉 ALL BACKEND BUSINESS WORKFLOWS PASSED AT 100%!');
}

runTests().catch((e) => {
  console.error('❌ Test failed:', e);
  process.exit(1);
});
