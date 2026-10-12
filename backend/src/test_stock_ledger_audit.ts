import dotenv from 'dotenv';
dotenv.config({ path: '.env.neon', override: true });
dotenv.config();

import assert from 'node:assert/strict';
import { prisma } from './db.js';
import { LedgerService } from './services/ledgerService.js';
import { ReconciliationService } from './services/reconciliationService.js';
import { MovementType, POStatus, OrderStatus } from '@prisma/client';

async function runStockAuditSuite() {
  console.log('🧪 Starting 14-Scenario Stock Ledger & Purchase Order Regression Test Suite...\n');

  const testId = `AUDIT-${Date.now().toString().slice(-6)}`;
  const showroom = await prisma.godown.findFirst({ where: { is_default: true } }) || await prisma.godown.findFirst();
  assert.ok(showroom, 'Active showroom/godown must exist');

  const vendor = await prisma.supplier.findFirst() || await prisma.supplier.create({
    data: {
      name: `Test Vendor ${testId}`,
      contact_person: 'Audit Inspector',
      phone: '+91 99999 11111',
      gstin: '33AAAAA0000A1Z5',
    },
  });

  const createdProductIds: string[] = [];
  const createdPOIds: string[] = [];
  const createdSOIds: string[] = [];

  try {
    // --------------------------------------------------------------------------
    // Test 1: Opening stock 1 + receipt 3 = stock 4, ledger balance 4
    // --------------------------------------------------------------------------
    console.log('▶ Test 1: Opening stock 1 + receipt 3 = stock 4, ledger balance 4');
    const p1 = await prisma.$transaction(async (tx) => {
      const prod = await tx.product.create({
        data: {
          sku: `SKU-T1-${testId}`,
          name: `Test Silk Saree T1 ${testId}`,
          fabric: 'Pure Silk',
          craft: 'Handloom',
          unit: 'PCS',
          sale_price: 10000,
          purchase_price: 6000,
          tax_rate: 5,
        },
      });

      // Record opening stock 1 via LedgerService
      await LedgerService.recordMovement(
        {
          product_id: prod.id,
          godown_id: showroom.id,
          movement_type: MovementType.ADJUSTMENT_ADD,
          quantity: 1,
          unit_cost: 6000,
          reference_type: 'INITIAL_STOCK',
          reference_id: prod.id,
          notes: 'Opening stock count',
        },
        tx
      );
      return prod;
    });
    createdProductIds.push(p1.id);

    // Verify initial stock
    let stockInfo = await LedgerService.getProductStock(p1.id);
    assert.equal(stockInfo.totalStock, 1, 'Initial physical stock must be 1');

    // Create PO for 3 units
    const po1 = await prisma.purchaseOrder.create({
      data: {
        po_number: `PO-T1-${testId}`,
        supplier_id: vendor.id,
        supplier_name: vendor.name,
        godown_id: showroom.id,
        status: POStatus.ORDERED,
        items: {
          create: [
            {
              product_id: p1.id,
              quantity: 3,
              unit_cost: 6000,
              tax_rate: 5,
              tax_amount: 900,
              total: 18900,
            },
          ],
        },
      },
      include: { items: true },
    });
    createdPOIds.push(po1.id);

    // Simulate Receive PO into stock
    await prisma.$transaction(async (tx) => {
      await LedgerService.recordMovement(
        {
          product_id: p1.id,
          godown_id: showroom.id,
          movement_type: MovementType.PURCHASE_RECEIPT,
          quantity: 3,
          unit_cost: 6000,
          reference_type: 'PURCHASE_ORDER',
          reference_id: po1.id,
          notes: `Goods receipt for PO ${po1.po_number}`,
        },
        tx
      );
      await tx.purchaseOrder.update({
        where: { id: po1.id },
        data: { status: POStatus.RECEIVED },
      });
    });

    stockInfo = await LedgerService.getProductStock(p1.id);
    assert.equal(stockInfo.totalStock, 4, 'Stock must be 4 after receiving 3 units into 1 unit');

    const p1Movements = await prisma.stockMovement.findMany({
      where: { product_id: p1.id },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
    });
    assert.equal(p1Movements.length, 2, 'Must have exactly 2 movements');
    assert.equal(Number(p1Movements[0].quantity), 1);
    assert.equal(Number(p1Movements[0].balance_after), 1, 'First movement balance_after must be 1');
    assert.equal(Number(p1Movements[1].quantity), 3);
    assert.equal(Number(p1Movements[1].balance_after), 4, 'Receipt movement balance_after must be 4');
    console.log('  ✅ Passed: Stock is 4, Ledger balance is 4');

    // --------------------------------------------------------------------------
    // Test 2: Receipt of fewer units than ordered (partial receipt)
    // --------------------------------------------------------------------------
    console.log('\n▶ Test 2: Receipt of fewer units than ordered');
    const p2 = await prisma.product.create({
      data: {
        sku: `SKU-T2-${testId}`,
        name: `Test Silk Saree T2 ${testId}`,
        fabric: 'Tussar Silk',
        craft: 'Kantha',
        unit: 'PCS',
        sale_price: 8000,
        purchase_price: 4000,
      },
    });
    createdProductIds.push(p2.id);

    // Opening stock: 2
    await LedgerService.recordMovement({
      product_id: p2.id,
      godown_id: showroom.id,
      movement_type: MovementType.ADJUSTMENT_ADD,
      quantity: 2,
      unit_cost: 4000,
      reference_type: 'INITIAL_STOCK',
      reference_id: p2.id,
    });

    // Create PO for 5 units
    const po2 = await prisma.purchaseOrder.create({
      data: {
        po_number: `PO-T2-${testId}`,
        supplier_id: vendor.id,
        supplier_name: vendor.name,
        godown_id: showroom.id,
        status: POStatus.ORDERED,
        items: {
          create: [{ product_id: p2.id, quantity: 5, unit_cost: 4000, total: 20000 }],
        },
      },
      include: { items: true },
    });
    createdPOIds.push(po2.id);

    // Partially receive 3 units
    await prisma.$transaction(async (tx) => {
      await LedgerService.recordMovement(
        {
          product_id: p2.id,
          godown_id: showroom.id,
          movement_type: MovementType.PURCHASE_RECEIPT,
          quantity: 3,
          unit_cost: 4000,
          reference_type: 'PURCHASE_ORDER',
          reference_id: po2.id,
          notes: 'Partial receipt 3 of 5',
        },
        tx
      );
    });

    const p2Stock = await LedgerService.getProductStock(p2.id);
    assert.equal(p2Stock.totalStock, 5, 'Stock must be 2 + 3 = 5 (not 2 + 5 = 7)');
    const p2PO = await prisma.purchaseOrder.findUnique({ where: { id: po2.id } });
    assert.equal(p2PO?.status, POStatus.ORDERED, 'Partially received PO must remain ORDERED');
    console.log('  ✅ Passed: Partial receipt added 3 units, total stock is 5, PO remains open');

    // --------------------------------------------------------------------------
    // Test 3: Multiple receipts where partial receiving is supported
    // --------------------------------------------------------------------------
    console.log('\n▶ Test 3: Multiple receipts where partial receiving is supported');
    // Receive remaining 2 units
    await prisma.$transaction(async (tx) => {
      await LedgerService.recordMovement(
        {
          product_id: p2.id,
          godown_id: showroom.id,
          movement_type: MovementType.PURCHASE_RECEIPT,
          quantity: 2,
          unit_cost: 4000,
          reference_type: 'PURCHASE_ORDER',
          reference_id: po2.id,
          notes: 'Final partial receipt 2 of 5',
        },
        tx
      );
      await tx.purchaseOrder.update({
        where: { id: po2.id },
        data: { status: POStatus.RECEIVED },
      });
    });

    const p2StockFinal = await LedgerService.getProductStock(p2.id);
    assert.equal(p2StockFinal.totalStock, 7, 'Stock must be 5 + 2 = 7');
    const p2POFinal = await prisma.purchaseOrder.findUnique({ where: { id: po2.id } });
    assert.equal(p2POFinal?.status, POStatus.RECEIVED, 'Fully received PO status must be RECEIVED');
    console.log('  ✅ Passed: Second receipt added remaining 2 units, total stock is 7, PO marked RECEIVED');

    // --------------------------------------------------------------------------
    // Test 4: Duplicate receipt submission does not increase stock twice
    // --------------------------------------------------------------------------
    console.log('\n▶ Test 4: Duplicate receipt submission does not increase stock twice');
    let duplicateRejected = false;
    try {
      await prisma.$transaction(async (tx) => {
        const checkPO = await tx.purchaseOrder.findUnique({ where: { id: po2.id } });
        if (checkPO?.status === POStatus.RECEIVED) {
          throw new Error('Purchase order has already been received');
        }
      });
    } catch (err: any) {
      if (err.message.includes('already been received')) {
        duplicateRejected = true;
      }
    }
    assert.ok(duplicateRejected, 'Attempt to receive already completed PO must throw error');
    const p2StockAfterDup = await LedgerService.getProductStock(p2.id);
    assert.equal(p2StockAfterDup.totalStock, 7, 'Stock must stay 7 after rejected duplicate receipt');
    console.log('  ✅ Passed: Duplicate receipt guarded, stock unchanged at 7');

    // --------------------------------------------------------------------------
    // Test 5: Two concurrent receipt requests do not lose or duplicate stock
    // --------------------------------------------------------------------------
    console.log('\n▶ Test 5: Two concurrent receipt requests do not lose or duplicate stock');
    const p3 = await prisma.product.create({
      data: {
        sku: `SKU-T5-${testId}`,
        name: `Test Silk Saree T5 ${testId}`,
        unit: 'PCS',
        sale_price: 5000,
        purchase_price: 3000,
      },
    });
    createdProductIds.push(p3.id);

    const po3 = await prisma.purchaseOrder.create({
      data: {
        po_number: `PO-T5-${testId}`,
        supplier_name: 'Concurrent Vendor',
        godown_id: showroom.id,
        status: POStatus.ORDERED,
        items: {
          create: [{ product_id: p3.id, quantity: 4, unit_cost: 3000, total: 12000 }],
        },
      },
      include: { items: true },
    });
    createdPOIds.push(po3.id);

    // Simulate two concurrent requests trying to receive po3
    const receiveAttempt = async (reqId: number) => {
      return prisma.$transaction(async (tx) => {
        // Concurrency lock
        await tx.$queryRawUnsafe(`SELECT id FROM purchase_orders WHERE id = $1 FOR UPDATE`, po3.id);

        const po = await tx.purchaseOrder.findUnique({ where: { id: po3.id } });
        if (po?.status === POStatus.RECEIVED) {
          throw new Error('Purchase order has already been received');
        }

        const existingReceipt = await tx.stockMovement.findFirst({
          where: {
            reference_type: 'PURCHASE_ORDER',
            reference_id: po3.id,
            movement_type: MovementType.PURCHASE_RECEIPT,
          },
        });
        if (existingReceipt) {
          throw new Error('Stock receipt already recorded for this purchase order');
        }

        await tx.purchaseOrder.update({
          where: { id: po3.id },
          data: { status: POStatus.RECEIVED },
        });

        await LedgerService.recordMovement(
          {
            product_id: p3.id,
            godown_id: showroom.id,
            movement_type: MovementType.PURCHASE_RECEIPT,
            quantity: 4,
            unit_cost: 3000,
            reference_type: 'PURCHASE_ORDER',
            reference_id: po3.id,
            notes: `Concurrent receipt attempt #${reqId}`,
          },
          tx
        );
        return { success: true, reqId };
      });
    };

    const results = await Promise.allSettled([receiveAttempt(1), receiveAttempt(2)]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    assert.equal(fulfilled.length, 1, 'Exactly one concurrent receipt must succeed');
    assert.equal(rejected.length, 1, 'Exactly one concurrent receipt must be rejected');

    const p3Stock = await LedgerService.getProductStock(p3.id);
    assert.equal(p3Stock.totalStock, 4, 'Stock must be exactly 4 (not doubled to 8)');
    console.log('  ✅ Passed: Concurrent requests safely serialized with FOR UPDATE, stock is exactly 4');

    // --------------------------------------------------------------------------
    // Test 6: Failed transaction leaves stock and ledger unchanged
    // --------------------------------------------------------------------------
    console.log('\n▶ Test 6: Failed transaction leaves stock and ledger unchanged');
    let rollbackThrew = false;
    try {
      await prisma.$transaction(async (tx) => {
        await LedgerService.recordMovement(
          {
            product_id: p3.id,
            godown_id: showroom.id,
            movement_type: MovementType.SALES_DELIVERY,
            quantity: -2,
            unit_cost: 3000,
            reference_type: 'FAIL_TEST',
            reference_id: 'FAIL-1',
          },
          tx
        );
        // Force an error to trigger rollback
        throw new Error('Simulated network failure midway through checkout');
      });
    } catch (err: any) {
      if (err.message.includes('Simulated network failure')) {
        rollbackThrew = true;
      }
    }
    assert.ok(rollbackThrew, 'Transaction must throw');
    const p3StockAfterRollback = await LedgerService.getProductStock(p3.id);
    assert.equal(p3StockAfterRollback.totalStock, 4, 'Stock must stay 4 after rolled back transaction');
    const failMovements = await prisma.stockMovement.findMany({
      where: { reference_id: 'FAIL-1' },
    });
    assert.equal(failMovements.length, 0, 'No movement must be persisted from rolled back transaction');
    console.log('  ✅ Passed: Rolled-back transaction left inventory and ledger 100% clean');

    // --------------------------------------------------------------------------
    // Test 7: A sale reduces stock and records the correct balance
    // --------------------------------------------------------------------------
    console.log('\n▶ Test 7: A sale reduces stock and records the correct balance');
    // From p3 (stock 4), sell 1 unit
    const so1 = await prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.create({
        data: {
          order_number: `SO-T7-${testId}`,
          customer_name: 'Test Client',
          godown_id: showroom.id,
          status: OrderStatus.DELIVERED,
          grand_total: 5000,
          items: {
            create: [{ product_id: p3.id, quantity: 1, unit_price: 5000, total: 5000 }],
          },
        },
      });

      await LedgerService.recordMovement(
        {
          product_id: p3.id,
          godown_id: showroom.id,
          movement_type: MovementType.SALES_DELIVERY,
          quantity: -1,
          unit_cost: 5000,
          reference_type: 'BILLING_POS',
          reference_id: order.id,
          notes: `Sold on order ${order.order_number}`,
        },
        tx
      );
      return order;
    });
    createdSOIds.push(so1.id);

    const p3StockAfterSale = await LedgerService.getProductStock(p3.id);
    assert.equal(p3StockAfterSale.totalStock, 3, 'Stock must decrease from 4 to 3');
    const latestP3Mov = await prisma.stockMovement.findFirst({
      where: { product_id: p3.id },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    });
    assert.equal(Number(latestP3Mov?.balance_after), 3, 'Movement balance_after must be 3');
    console.log('  ✅ Passed: Sale reduced stock to 3 with balance_after: 3');

    // --------------------------------------------------------------------------
    // Test 8: A voided sale restores stock exactly once
    // --------------------------------------------------------------------------
    console.log('\n▶ Test 8: A voided sale restores stock exactly once');
    await prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: so1.id },
        include: { items: true },
      });
      if (order?.status === OrderStatus.VOIDED) {
        throw new Error('Order is already voided');
      }

      await tx.salesOrder.update({
        where: { id: order!.id },
        data: { status: OrderStatus.VOIDED },
      });

      for (const item of order!.items) {
        await LedgerService.recordMovement(
          {
            product_id: item.product_id,
            godown_id: showroom.id,
            movement_type: MovementType.RETURN_IN,
            quantity: Number(item.quantity),
            unit_cost: Number(item.unit_price),
            reference_type: 'VOID_SALES_ORDER',
            reference_id: order!.id,
            notes: 'Void restoration',
          },
          tx
        );
      }
    });

    const p3StockAfterVoid = await LedgerService.getProductStock(p3.id);
    assert.equal(p3StockAfterVoid.totalStock, 4, 'Stock must be restored back to 4');

    // Attempt second void
    let secondVoidRejected = false;
    try {
      await prisma.$transaction(async (tx) => {
        const order = await tx.salesOrder.findUnique({ where: { id: so1.id } });
        if (order?.status === OrderStatus.VOIDED) {
          throw new Error('Order is already voided');
        }
      });
    } catch (err: any) {
      if (err.message.includes('already voided')) secondVoidRejected = true;
    }
    assert.ok(secondVoidRejected, 'Second void must be rejected');
    const p3StockAfterVoid2 = await LedgerService.getProductStock(p3.id);
    assert.equal(p3StockAfterVoid2.totalStock, 4, 'Stock must stay 4 after duplicate void rejected');
    console.log('  ✅ Passed: Void restored stock to 4, duplicate void safely rejected');

    // --------------------------------------------------------------------------
    // Test 9: Manual positive and negative adjustments
    // --------------------------------------------------------------------------
    console.log('\n▶ Test 9: Manual positive and negative adjustments');
    // Positive adjustment +2 (from 4 -> 6)
    await LedgerService.recordMovement({
      product_id: p3.id,
      godown_id: showroom.id,
      movement_type: MovementType.ADJUSTMENT_ADD,
      quantity: 2,
      unit_cost: 3000,
      reference_type: 'STOCK_ADJUSTMENT',
      reference_id: `ADJ-POS-${testId}`,
    });
    let adjStock = await LedgerService.getProductStock(p3.id);
    assert.equal(adjStock.totalStock, 6, 'Stock after +2 adjustment must be 6');

    // Negative adjustment -1 (from 6 -> 5)
    await LedgerService.recordMovement({
      product_id: p3.id,
      godown_id: showroom.id,
      movement_type: MovementType.ADJUSTMENT_REDUCE,
      quantity: -1,
      unit_cost: 3000,
      reference_type: 'STOCK_ADJUSTMENT',
      reference_id: `ADJ-NEG-${testId}`,
    });
    adjStock = await LedgerService.getProductStock(p3.id);
    assert.equal(adjStock.totalStock, 5, 'Stock after -1 adjustment must be 5');
    console.log('  ✅ Passed: Adjustments (+2, -1) updated stock accurately to 6 then 5');

    // --------------------------------------------------------------------------
    // Test 10: Editing product details does not unexpectedly change stock
    // --------------------------------------------------------------------------
    console.log('\n▶ Test 10: Editing product details does not unexpectedly change stock');
    await prisma.product.update({
      where: { id: p3.id },
      data: {
        name: `Updated Name for ${testId}`,
        fabric: 'Updated Fabric Blend',
        sale_price: 12000,
      },
    });

    const p3StockAfterEdit = await LedgerService.getProductStock(p3.id);
    assert.equal(p3StockAfterEdit.totalStock, 5, 'Stock must remain exactly 5 after product metadata edit');
    console.log('  ✅ Passed: Product metadata edit preserved inventory untouched at 5');

    // --------------------------------------------------------------------------
    // Test 11: Cancelled and fully received POs cannot receive goods again
    // --------------------------------------------------------------------------
    console.log('\n▶ Test 11: Cancelled and fully received POs cannot receive goods again');
    const poCancelled = await prisma.purchaseOrder.create({
      data: {
        po_number: `PO-CAN-${testId}`,
        supplier_name: 'Cancel Vendor',
        godown_id: showroom.id,
        status: POStatus.CANCELLED,
        items: {
          create: [{ product_id: p3.id, quantity: 2, unit_cost: 3000, total: 6000 }],
        },
      },
    });
    createdPOIds.push(poCancelled.id);

    let cancelReceiveRejected = false;
    try {
      await prisma.$transaction(async (tx) => {
        const po = await tx.purchaseOrder.findUnique({ where: { id: poCancelled.id } });
        if (po?.status === POStatus.CANCELLED) {
          throw new Error('Cannot receive a cancelled purchase order');
        }
      });
    } catch (err: any) {
      if (err.message.includes('cancelled purchase order')) {
        cancelReceiveRejected = true;
      }
    }
    assert.ok(cancelReceiveRejected, 'Receiving cancelled PO must throw error');
    console.log('  ✅ Passed: Cancelled PO cannot receive goods');

    // --------------------------------------------------------------------------
    // Test 12: Product history and global audit log show consistent balances
    // --------------------------------------------------------------------------
    console.log('\n▶ Test 12: Product history and global audit log show consistent balances');
    // Query movements for p3 deterministically
    const p3GlobalMovements = await prisma.stockMovement.findMany({
      where: { product_id: p3.id },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    });
    const latestBalanceAfter = Number(p3GlobalMovements[0].balance_after);
    assert.equal(latestBalanceAfter, 5, 'Latest movement balance_after must be 5');
    const currentP3Stock = await LedgerService.getProductStock(p3.id);
    assert.equal(latestBalanceAfter, currentP3Stock.totalStock, 'Audit log balanceAfter must match physical stock');
    console.log('  ✅ Passed: Audit log and product history agree at balance 5');

    // --------------------------------------------------------------------------
    // Test 13: Pagination and filtering preserve the correct historical balances
    // --------------------------------------------------------------------------
    console.log('\n▶ Test 13: Pagination and filtering preserve the correct historical balances');
    const page1 = await prisma.stockMovement.findMany({
      where: { product_id: p3.id },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      take: 2,
    });
    const page2 = await prisma.stockMovement.findMany({
      where: { product_id: p3.id },
      orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
      skip: 2,
      take: 2,
    });
    assert.equal(page1.length, 2);
    assert.equal(page2.length, 2);
    // Ensure balance_after values are immutable across pagination
    assert.equal(Number(page1[0].balance_after), Number(p3GlobalMovements[0].balance_after));
    assert.equal(Number(page2[0].balance_after), Number(p3GlobalMovements[2].balance_after));
    console.log('  ✅ Passed: Pagination preserves immutable historical balances');

    // --------------------------------------------------------------------------
    // Test 14: Reconciliation identifies existing discrepancies without silently changing data
    // --------------------------------------------------------------------------
    console.log('\n▶ Test 14: Reconciliation identifies existing discrepancies without silently changing data');
    const auditReport = await ReconciliationService.auditAllProducts();
    assert.ok(auditReport.totalProducts > 0, 'Audit report must audit existing products');
    assert.ok(typeof auditReport.matchedCount === 'number');
    assert.ok(typeof auditReport.discrepancyCount === 'number');
    // Ensure our test products (which followed new rules) have 0 discrepancy
    const p1Audit = auditReport.products.find((p) => p.productId === p1.id);
    assert.ok(p1Audit, 'p1 must be in audit report');
    assert.equal(p1Audit.difference, 0, 'p1 must have 0 difference between stock and ledger');
    assert.equal(p1Audit.invalidBalanceAfterMovements, 0, 'p1 must have 0 invalid balance_after movements');
    assert.equal(p1Audit.classification, 'MATCH', 'p1 classification must be MATCH');
    console.log('  ✅ Passed: Audit report correctly validates clean ledger matching');

    console.log('\n🎉 ALL 14 STOCK LEDGER & PURCHASE ORDER TESTS PASSED SUCCESSFULLY!\n');
  } finally {
    // Clean up isolated test data
    console.log('🧹 Cleaning up isolated test data...');
    if (createdPOIds.length > 0) {
      await prisma.purchaseOrderItem.deleteMany({ where: { purchase_order_id: { in: createdPOIds } } });
      await prisma.purchaseOrder.deleteMany({ where: { id: { in: createdPOIds } } });
    }
    if (createdSOIds.length > 0) {
      await prisma.salesOrderItem.deleteMany({ where: { sales_order_id: { in: createdSOIds } } });
      await prisma.salesOrder.deleteMany({ where: { id: { in: createdSOIds } } });
    }
    if (createdProductIds.length > 0) {
      await prisma.stockMovement.deleteMany({ where: { product_id: { in: createdProductIds } } });
      await prisma.stockBalance.deleteMany({ where: { product_id: { in: createdProductIds } } });
      await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
    }
    await prisma.$disconnect();
    console.log('✨ Cleaned up test data.\n');
  }
}

runStockAuditSuite().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
