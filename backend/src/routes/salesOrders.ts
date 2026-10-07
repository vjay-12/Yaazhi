import { Router } from 'express';
import { prisma } from '../db.js';
import { salesOrderSchema } from '../validators/schemas.js';
import { LedgerService } from '../services/ledgerService.js';
import { MovementType, OrderStatus } from '@prisma/client';

const router = Router();

function formatOrderWithPayments(o: any) {
  const directPayments = o.payments || [];
  const invoicePayments = o.invoices?.flatMap((inv: any) => inv.payments || []) || [];
  const paymentMap = new Map<string, any>();
  [...directPayments, ...invoicePayments].forEach((p) => paymentMap.set(p.id, p));
  const allPayments = Array.from(paymentMap.values()).sort(
    (a, b) => new Date(a.payment_date).getTime() - new Date(b.payment_date).getTime()
  );

  const totalAmount = Number(o.grand_total);
  const successfulPayments = allPayments.filter(
    (p) => !p.status || p.status.toUpperCase() === 'SUCCESSFUL' || p.status.toUpperCase() === 'PAID'
  );
  const sumPaid = successfulPayments.reduce((acc, p) => acc + Number(p.amount), 0);

  // If order was voided, preserve its recorded payment status and paid amount
  let paidAmount = o.status === OrderStatus.VOIDED ? Number(o.paid_amount || sumPaid) : sumPaid;
  if (allPayments.length === 0 && o.paid_amount !== null && o.paid_amount !== undefined) {
    paidAmount = Number(o.paid_amount);
  }
  let pendingAmount = Math.max(0, totalAmount - paidAmount);

  let paymentStatus = 'PAID';
  if (o.status === OrderStatus.VOIDED || o.status === OrderStatus.CANCELLED) {
    paymentStatus = 'VOIDED';
  } else if (paidAmount >= totalAmount && totalAmount > 0) {
    paymentStatus = 'PAID';
    pendingAmount = 0;
  } else {
    // Both unpaid and partially-paid orders are displayed with status PENDING
    paymentStatus = 'PENDING';
  }

  const itemsCount = o.items.reduce((sum: number, it: any) => sum + Number(it.quantity), 0);
  const itemsSummary = o.items
    .map((it: any) => `${it.product?.name || 'Item'} (x${it.quantity})`)
    .join(', ');

  const invoice = o.invoices?.[0];

  return {
    id: o.id,
    orderNumber: o.order_number,
    customerName: o.customer_name,
    customerPhone: o.customer_phone || o.customer?.phone || '',
    customerAddress: o.customer_address || o.customer?.address || '',
    customerId: o.customer_id,
    date: o.order_date.toISOString().split('T')[0],
    orderDate: o.order_date,
    itemsCount,
    subtotal: Number(o.subtotal),
    discountTotal: Number(o.discount_total),
    taxTotal: Number(o.tax_total),
    totalAmount,
    paidAmount,
    pendingAmount,
    paymentStatus,
    status: o.status, // CONFIRMED, DELIVERED, DRAFT, CANCELLED, VOIDED
    location: o.godown?.name || 'Main Showroom Counter',
    itemsSummary,
    notes: o.notes,
    invoiceNumber: invoice?.invoice_number || null,
    items: o.items.map((it: any) => ({
      id: it.id,
      productId: it.product_id,
      productName: it.product?.name || 'Product Item',
      sku: it.product?.sku || '',
      quantity: Number(it.quantity),
      unitPrice: Number(it.unit_price),
      discount: Number(it.discount),
      taxRate: Number(it.tax_rate),
      total: Number(it.total),
    })),
    payments: allPayments.map((p: any, idx: number) => ({
      id: p.id,
      paymentNumber: p.payment_number,
      orderId: o.id,
      amount: Number(p.amount),
      paymentDate: p.payment_date,
      date: new Date(p.payment_date).toISOString().split('T')[0],
      paymentMode: p.payment_mode,
      status: p.status || 'Successful',
      referenceNumber: p.reference_number || p.payment_number,
      notes: p.notes,
      createdAt: p.created_at,
      index: idx + 1,
    })),
    createdAt: o.created_at,
  };
}

// GET /api/sales-orders - list sales orders
router.get('/', async (_req, res): Promise<void> => {
  try {
    const orders = await prisma.salesOrder.findMany({
      orderBy: { order_date: 'desc' },
      include: {
        customer: true,
        godown: true,
        payments: {
          orderBy: { payment_date: 'asc' },
        },
        invoices: {
          include: { payments: { orderBy: { payment_date: 'asc' } } },
        },
        items: {
          include: { product: true },
        },
      },
    });

    const result = orders.map((o) => formatOrderWithPayments(o));
    res.json(result);
  } catch (err: any) {
    console.error('Fetch sales orders error:', err);
    res.status(500).json({ error: 'Failed to fetch sales orders' });
  }
});

// GET /api/sales-orders/:id - single SO details
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const order = await prisma.salesOrder.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        godown: true,
        payments: {
          orderBy: { payment_date: 'asc' },
        },
        items: { include: { product: true } },
        invoices: { include: { payments: { orderBy: { payment_date: 'asc' } } } },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Sales order not found' });
      return;
    }

    res.json(formatOrderWithPayments(order));
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch sales order details' });
  }
});

// POST /api/sales-orders - create sales order
router.post('/', async (req, res): Promise<void> => {
  try {
    const rawItems = Array.isArray(req.body.items)
      ? req.body.items.map((it: any) => ({
          product_id: it.product_id || it.productId,
          quantity: Number(it.quantity || it.qty || 1),
          unit_price: Number(it.unit_price || it.unitPrice || it.price || 0),
          discount: Number(it.discount || 0),
          tax_rate: it.tax_rate !== undefined ? Number(it.tax_rate) : it.taxRate !== undefined ? Number(it.taxRate) : it.gstRate !== undefined ? Number(it.gstRate) : undefined,
        }))
      : [];

    let customerName = req.body.customer_name || req.body.customerName;
    const customerId = req.body.customer_id || req.body.customerId;

    if (!customerName && customerId) {
      const c = await prisma.customer.findUnique({ where: { id: customerId } });
      if (c) customerName = c.name;
    }

    const normalizedBody = {
      ...req.body,
      customer_id: customerId,
      customer_name: customerName || 'Boutique Client',
      godown_id: req.body.godown_id || req.body.godownId,
      items: rawItems,
    };

    const parsed = salesOrderSchema.safeParse(normalizedBody);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid sales order data' });
      return;
    }

    let {
      customer_id,
      customer_name,
      customer_phone,
      customer_address,
      customer_gstin,
      godown_id,
      notes,
      items,
    } = parsed.data;

    // Attach customer contact details
    if (customer_id) {
      const cust = await prisma.customer.findUnique({ where: { id: customer_id } });
      if (cust) {
        customer_name = cust.name;
        customer_phone = cust.phone || undefined;
        customer_address = cust.address || undefined;
        customer_gstin = cust.gstin || undefined;
      }
    }

    // Resolve target godown
    let targetGodownId = godown_id;
    if (!targetGodownId) {
      const def = (await prisma.godown.findFirst({ where: { is_default: true } })) || (await prisma.godown.findFirst());
      targetGodownId = def?.id;
    }

    // Generate unique order number with BILL- prefix
    const count = await prisma.salesOrder.count();
    const orderNumber = `BILL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let discountTotal = 0;
    for (const it of items) {
      const prod = await prisma.product.findUnique({ where: { id: it.product_id } });
      if (!prod) {
        res.status(400).json({ error: `Product not found (ID: ${it.product_id})` });
        return;
      }
      if (!prod.is_active) {
        res.status(400).json({ error: `Product "${prod.name}" (${prod.sku}) is archived and cannot be ordered.` });
        return;
      }
      if (it.tax_rate === undefined) {
        it.tax_rate = Number(prod.tax_rate);
      }
      subtotal += it.quantity * it.unit_price;
      discountTotal += it.discount;
    }

    const netTaxableTotal = Math.max(0, subtotal - discountTotal);
    const discountRatio = subtotal > 0 ? netTaxableTotal / subtotal : 1;
    let taxTotal = 0;

    const itemsData = items.map((it) => {
      const lineSubtotal = it.quantity * it.unit_price;
      const lineTaxable = lineSubtotal * discountRatio;
      const lineTax = (lineTaxable * (it.tax_rate ?? 0)) / 100;
      taxTotal += lineTax;
      return {
        product_id: it.product_id,
        quantity: it.quantity,
        unit_price: it.unit_price,
        discount: it.discount,
        tax_rate: it.tax_rate ?? 0,
        tax_amount: lineTax,
        total: lineSubtotal - it.discount + lineTax,
      };
    });

    const grandTotal = Math.round(netTaxableTotal + taxTotal);

    const order = await prisma.salesOrder.create({
      data: {
        order_number: orderNumber,
        customer_id: customer_id || null,
        customer_name: customer_name || 'Boutique Client',
        customer_phone,
        customer_address,
        customer_gstin,
        godown_id: targetGodownId!,
        status: OrderStatus.CONFIRMED,
        subtotal,
        discount_total: discountTotal,
        tax_total: taxTotal,
        grand_total: grandTotal,
        notes,
        items: {
          create: itemsData,
        },
      },
      include: {
        customer: true,
        godown: true,
        items: { include: { product: true } },
      },
    });

    res.status(201).json(order);
  } catch (err: any) {
    console.error('Create SO error:', err);
    res.status(500).json({ error: err.message || 'Failed to create sales order' });
  }
});

// POST /api/sales-orders/:id/fulfill - Fulfill Sales Order (TRANSACTIONAL)
router.post('/:id/fulfill', async (req, res): Promise<void> => {
  const orderId = req.params.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: true } },
          godown: true,
        },
      });

      if (!order) {
        throw new Error('Sales order not found');
      }

      if (order.status === OrderStatus.DELIVERED) {
        throw new Error('Sales order has already been fulfilled/dispatched');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new Error('Cannot fulfill a cancelled sales order');
      }

      // Check stock availability for all line items before fulfilling
      for (const item of order.items) {
        const balance = await tx.stockBalance.findUnique({
          where: {
            product_id_godown_id: {
              product_id: item.product_id,
              godown_id: order.godown_id,
            },
          },
        });

        const currentQty = balance ? Number(balance.current_quantity) : 0;
        const requiredQty = Number(item.quantity);

        if (currentQty < requiredQty) {
          throw new Error(
            `Insufficient stock for "${item.product.name}" (${item.product.sku}) in ${order.godown.name}. Available: ${currentQty}, Required: ${requiredQty}`
          );
        }
      }

      // 1. Mark status DELIVERED
      const updatedOrder = await tx.salesOrder.update({
        where: { id: order.id },
        data: { status: OrderStatus.DELIVERED },
      });

      // 2. Decrement stock in ledger
      for (const item of order.items) {
        await LedgerService.recordMovement(
          {
            product_id: item.product_id,
            godown_id: order.godown_id,
            movement_type: MovementType.SALES_DELIVERY,
            quantity: -Number(item.quantity),
            unit_cost: Number(item.unit_price),
            reference_type: 'SALES_ORDER',
            reference_id: order.id,
            notes: `Delivery for order ${order.order_number}`,
            created_by: 'Boutique Atelier Dispatch',
          },
          tx
        );
      }

      // 3. Issue tax invoice if not already generated
      const existingInv = await tx.invoice.findFirst({
        where: { reference_order_id: order.id },
      });

      if (!existingInv) {
        const invCount = await tx.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(4, '0')}`;

        await tx.invoice.create({
          data: {
            invoice_number: invoiceNumber,
            reference_order_id: order.id,
            customer_id: order.customer_id,
            godown_id: order.godown_id,
            status: 'UNPAID',
            subtotal: order.subtotal,
            discount_total: order.discount_total,
            tax_total: order.tax_total,
            grand_total: order.grand_total,
            paid_amount: 0,
            balance_amount: order.grand_total,
          },
        });
      }

      return updatedOrder;
    });

    res.json({
      success: true,
      message: `Sales order ${result.order_number} fulfilled and stock deducted successfully`,
      order: result,
    });
  } catch (err: any) {
    console.error('Fulfill SO error:', err);
    const status = err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: err.message || 'Failed to fulfill sales order' });
  }
});

// POST /api/sales-orders/:id/void - Void Sales Order with Audit Trail and Stock Restoration
router.post('/:id/void', async (req, res): Promise<void> => {
  const orderId = req.params.id;
  const reason = String(req.body.reason || 'Sales order voided by user').trim();

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId },
        include: {
          items: { include: { product: true } },
          godown: true,
          invoices: true,
        },
      });

      if (!order) {
        throw new Error('Sales order not found');
      }

      if (order.status === OrderStatus.VOIDED) {
        throw new Error(`Order ${order.order_number} has already been voided.`);
      }

      // 1. Mark order status VOIDED and record reason in notes
      const updatedOrder = await tx.salesOrder.update({
        where: { id: order.id },
        data: {
          status: OrderStatus.VOIDED,
          notes: order.notes ? `${order.notes} [VOIDED: ${reason}]` : `[VOIDED: ${reason}]`,
        },
      });

      // 2. Mark any related invoices as VOID
      await tx.invoice.updateMany({
        where: { reference_order_id: order.id },
        data: { status: 'VOID' },
      });

      // 3. If the order was DELIVERED (stock was previously deducted), restore stock in ledger
      if (order.status === OrderStatus.DELIVERED) {
        for (const item of order.items) {
          await LedgerService.recordMovement(
            {
              product_id: item.product_id,
              godown_id: order.godown_id,
              movement_type: MovementType.RETURN_IN,
              quantity: Number(item.quantity), // Positive quantity restores the balance
              unit_cost: Number(item.unit_price),
              reference_type: 'VOID_SALES_ORDER',
              reference_id: order.id,
              notes: `Void of order #${order.order_number} - stock returned to showroom`,
              created_by: 'Boutique Void Handler',
            },
            tx
          );
        }
      }

      return updatedOrder;
    });

    res.json({
      success: true,
      message: `Sales order ${result.order_number} has been voided and preserved in audit records.`,
      order: result,
    });
  } catch (err: any) {
    console.error('Void SO error:', err);
    const status = err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: err.message || 'Failed to void sales order' });
  }
});

// POST /api/sales-orders/:id/settle - Settle pending or partial balance payment (TRANSACTIONAL)
router.post('/:id/settle', async (req, res): Promise<void> => {
  const orderId = req.params.id;
  const settleAmount = Math.round(Number(req.body.amount || req.body.settleAmount) * 100) / 100;
  const paymentMode = String(req.body.payment_mode || req.body.paymentMode || 'CASH').toUpperCase();
  const paymentRef = req.body.payment_reference || req.body.reference_number || req.body.paymentReference || null;
  const notes = req.body.notes || 'Sales order settlement payment';

  if (!settleAmount || isNaN(settleAmount) || settleAmount <= 0) {
    res.status(400).json({ error: 'Please enter a valid settlement amount greater than 0' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: orderId },
        include: {
          invoices: true,
          customer: true,
        },
      });

      if (!order) {
        throw new Error('Sales order not found');
      }

      if (order.status === OrderStatus.VOIDED || order.status === OrderStatus.CANCELLED) {
        throw new Error(`Cannot settle payment on a voided order (${order.order_number})`);
      }

      const total = Number(order.grand_total);
      const currentPaid = Number(order.paid_amount ?? 0);
      const currentPending = Math.max(0, total - currentPaid);

      if (currentPending <= 0) {
        throw new Error(`Order ${order.order_number} is already fully paid`);
      }

      if (settleAmount > currentPending + 0.01) {
        throw new Error(`Settlement amount (₹${settleAmount}) exceeds remaining pending due (₹${currentPending})`);
      }

      const effectiveSettle = Math.min(settleAmount, currentPending);
      const newPaid = Math.min(total, currentPaid + effectiveSettle);
      const newPending = Math.max(0, total - newPaid);
      const newPaymentStatus = newPending <= 0 ? 'PAID' : 'PENDING';

      // 1. Update Sales Order
      const updatedOrder = await tx.salesOrder.update({
        where: { id: order.id },
        data: {
          paid_amount: newPaid,
          pending_amount: newPending,
          payment_status: newPaymentStatus,
        },
      });

      // 2. Update or create linked invoice
      let invoice = order.invoices[0];
      if (!invoice) {
        const invCount = await tx.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(4, '0')}`;
        invoice = await tx.invoice.create({
          data: {
            invoice_number: invoiceNumber,
            reference_order_id: order.id,
            customer_id: order.customer_id,
            godown_id: order.godown_id,
            status: newPaymentStatus === 'PAID' ? 'PAID' : 'PENDING',
            subtotal: order.subtotal,
            discount_total: order.discount_total,
            tax_total: order.tax_total,
            grand_total: order.grand_total,
            paid_amount: newPaid,
            balance_amount: newPending,
          },
        });
      } else {
        invoice = await tx.invoice.update({
          where: { id: invoice.id },
          data: {
            paid_amount: newPaid,
            balance_amount: newPending,
            status: newPaymentStatus === 'PAID' ? 'PAID' : 'PENDING',
          },
        });
      }

      // 3. Record Payment transaction
      const payCount = await tx.payment.count();
      const paymentNumber = `PAY-${new Date().getFullYear()}-${String(payCount + 1).padStart(4, '0')}`;

      const payment = await tx.payment.create({
        data: {
          payment_number: paymentNumber,
          sales_order_id: order.id,
          invoice_id: invoice.id,
          customer_id: order.customer_id,
          payment_date: new Date(),
          amount: effectiveSettle,
          payment_mode: paymentMode,
          status: 'Successful',
          reference_number: paymentRef || `REF-${paymentNumber}`,
          notes: `${notes} [Order: ${order.order_number}]`,
        },
      });

      // Refetch complete order with payments
      const finalOrder = await tx.salesOrder.findUnique({
        where: { id: order.id },
        include: {
          customer: true,
          godown: true,
          payments: { orderBy: { payment_date: 'asc' } },
          invoices: { include: { payments: { orderBy: { payment_date: 'asc' } } } },
          items: { include: { product: true } },
        },
      });

      return {
        formatted: formatOrderWithPayments(finalOrder),
        payment,
        paidAmount: newPaid,
        pendingAmount: newPending,
        paymentStatus: newPaymentStatus,
      };
    });

    res.json({
      success: true,
      message: `Payment of ₹${settleAmount} settled successfully. Order is now ${result.paymentStatus}.`,
      order: result.formatted,
      ...result,
    });
  } catch (err: any) {
    console.error('Settle SO payment error:', err);
    const status = err.message.includes('not found') ? 404 : 400;
    res.status(status).json({ error: err.message || 'Failed to settle payment' });
  }
});

export default router;

