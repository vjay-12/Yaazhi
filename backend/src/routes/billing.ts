import { Router } from 'express';
import { prisma } from '../db.js';
import { billingCheckoutSchema } from '../validators/schemas.js';
import { LedgerService } from '../services/ledgerService.js';
import { MovementType, OrderStatus } from '@prisma/client';

const router = Router();

// POST /api/billing/checkout - Complete POS Bill with Instant Payment & Stock Deduction (TRANSACTIONAL)
router.post('/checkout', async (req, res): Promise<void> => {
  try {
    const rawItems = Array.isArray(req.body.items)
      ? req.body.items.map((it: any) => ({
          product_id: it.product_id || it.productId || it.id,
          quantity: Number(it.quantity || it.qty || 1),
          unit_price: Number(it.unit_price || it.unitPrice || it.price || it.salePrice || 0),
          discount: Number(it.discount || 0),
          tax_rate: Number(it.tax_rate || it.taxRate || it.gstRate || 5.0),
        }))
      : [];

    const normalizedBody = {
      ...req.body,
      customer_id: req.body.customer_id || req.body.customerId,
      customer_name: req.body.customer_name || req.body.customerName || 'Walk-in Boutique Client',
      customer_phone: req.body.customer_phone || req.body.customerPhone,
      godown_id: req.body.godown_id || req.body.godownId,
      payment_mode: req.body.payment_mode || req.body.paymentMode || 'CASH',
      payment_reference: req.body.payment_reference || req.body.paymentReference,
      payment_status: req.body.payment_status || req.body.paymentStatus || 'PAID',
      paid_amount: req.body.paid_amount !== undefined ? Number(req.body.paid_amount) : req.body.paidAmount !== undefined ? Number(req.body.paidAmount) : undefined,
      pending_amount: req.body.pending_amount !== undefined ? Number(req.body.pending_amount) : req.body.pendingAmount !== undefined ? Number(req.body.pendingAmount) : undefined,
      discount_total: Number(req.body.discount_total || req.body.discountTotal || 0),
      items: rawItems,
    };

    const parsed = billingCheckoutSchema.safeParse(normalizedBody);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0]?.message || 'Invalid billing data' });
      return;
    }

    const {
      customer_id,
      customer_name,
      customer_phone,
      godown_id,
      payment_mode,
      payment_reference,
      payment_status,
      paid_amount: rawPaidAmount,
      discount_total,
      notes,
      items,
    } = parsed.data;

    // Resolve godown (default to showroom)
    let targetGodownId = godown_id;
    if (!targetGodownId) {
      const def = (await prisma.godown.findFirst({ where: { is_default: true } })) || (await prisma.godown.findFirst());
      targetGodownId = def?.id;
    }

    if (!targetGodownId) {
      res.status(400).json({ error: 'No active showroom/counter configured' });
      return;
    }

    // Execute atomic checkout transaction
    const checkoutResult = await prisma.$transaction(
      async (tx) => {
        // 1. Validate stock availability for each item in the selected counter
        for (const item of items) {
          const product = await tx.product.findUnique({
            where: { id: item.product_id },
          });

          if (!product) {
            throw new Error(`Product not found (ID: ${item.product_id})`);
          }

          const balance = await tx.stockBalance.findUnique({
            where: {
              product_id_godown_id: {
                product_id: item.product_id,
                godown_id: targetGodownId!,
              },
            },
          });

          const currentQty = balance ? Number(balance.current_quantity) : 0;
          if (currentQty < item.quantity) {
            throw new Error(
              `Insufficient stock for "${product.name}" (${product.sku}). In stock: ${currentQty}, Requested: ${item.quantity}`
            );
          }
        }

        // 2. Generate numbers
        const orderCount = await tx.salesOrder.count();
        const orderNumber = `BILL-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`;

        const invCount = await tx.invoice.count();
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(invCount + 1).padStart(4, '0')}`;

        const payCount = await tx.payment.count();
        const paymentNumber = `PAY-${new Date().getFullYear()}-${String(payCount + 1).padStart(4, '0')}`;

        // 3. Compute item totals
        let subtotal = 0;
        let taxTotal = 0;
        const lineItemsData = items.map((it) => {
          const lineSubtotal = it.quantity * it.unit_price;
          const lineTax = (lineSubtotal * it.tax_rate) / 100;
          subtotal += lineSubtotal;
          taxTotal += lineTax;
          return {
            product_id: it.product_id,
            quantity: it.quantity,
            unit_price: it.unit_price,
            discount: it.discount,
            tax_rate: it.tax_rate,
            tax_amount: lineTax,
            total: lineSubtotal - it.discount + lineTax,
          };
        });

        const grandTotal = Math.max(0, subtotal - discount_total + taxTotal);

        // Determine actual payment breakdown
        let actualPaidAmount = grandTotal;
        let actualPendingAmount = 0;
        let finalPaymentStatus = payment_status;

        if (payment_status === 'PENDING') {
          actualPaidAmount = 0;
          actualPendingAmount = grandTotal;
        } else if (payment_status === 'PARTIAL') {
          actualPaidAmount = rawPaidAmount !== undefined ? Math.min(grandTotal, Math.max(0, rawPaidAmount)) : Math.round(grandTotal / 2);
          actualPendingAmount = Math.max(0, grandTotal - actualPaidAmount);
          if (actualPaidAmount >= grandTotal) {
            finalPaymentStatus = 'PAID';
            actualPendingAmount = 0;
          } else if (actualPaidAmount <= 0) {
            finalPaymentStatus = 'PENDING';
            actualPendingAmount = grandTotal;
          }
        } else {
          // PAID
          actualPaidAmount = grandTotal;
          actualPendingAmount = 0;
          finalPaymentStatus = 'PAID';
        }

        // 4. Create Sales Order (Status DELIVERED since it's instant counter POS)
        const salesOrder = await tx.salesOrder.create({
          data: {
            order_number: orderNumber,
            customer_id: customer_id || null,
            customer_name,
            customer_phone,
            godown_id: targetGodownId!,
            order_date: new Date(),
            status: OrderStatus.DELIVERED,
            subtotal,
            discount_total,
            tax_total: taxTotal,
            grand_total: grandTotal,
            paid_amount: actualPaidAmount,
            pending_amount: actualPendingAmount,
            payment_status: finalPaymentStatus,
            notes: notes ? `POS Billing: ${notes}` : 'Point-of-Sale Counter Transaction',
            created_by: 'Main POS Terminal',
            items: {
              create: lineItemsData,
            },
          },
          include: {
            items: { include: { product: true } },
            godown: true,
          },
        });

        // 5. Create Invoice
        const invoice = await tx.invoice.create({
          data: {
            invoice_number: invoiceNumber,
            reference_order_id: salesOrder.id,
            customer_id: customer_id || null,
            godown_id: targetGodownId!,
            status: finalPaymentStatus === 'PAID' ? 'PAID' : finalPaymentStatus === 'PARTIAL' ? 'PARTIAL' : 'UNPAID',
            subtotal,
            discount_total,
            tax_total: taxTotal,
            grand_total: grandTotal,
            paid_amount: actualPaidAmount,
            balance_amount: actualPendingAmount,
          },
        });

        // 6. Record Payment if any amount was received
        let payment: any = null;
        if (actualPaidAmount > 0) {
          payment = await tx.payment.create({
            data: {
              payment_number: paymentNumber,
              sales_order_id: salesOrder.id,
              invoice_id: invoice.id,
              customer_id: customer_id || null,
              payment_date: new Date(),
              amount: actualPaidAmount,
              payment_mode,
              status: 'Successful',
              reference_number: payment_reference || paymentNumber,
              notes: `Counter checkout payment (${finalPaymentStatus}) via ${payment_mode}`,
            },
          });
        }

        // 7. Deduct inventory and record immutable Stock Movement
        for (const item of items) {
          await LedgerService.recordMovement(
            {
              product_id: item.product_id,
              godown_id: targetGodownId!,
              movement_type: MovementType.SALES_DELIVERY,
              quantity: -item.quantity,
              unit_cost: item.unit_price,
              reference_type: 'BILLING_POS',
              reference_id: salesOrder.id,
              notes: `POS Bill #${orderNumber} sold to ${customer_name}`,
              created_by: 'POS Cashier',
            },
            tx
          );
        }

        return { salesOrder, invoice, payment, actualPaidAmount, actualPendingAmount, finalPaymentStatus };
      },
      {
        timeout: 20000,
      }
    );

    res.status(201).json({
      success: true,
      message: 'Bill checkout completed and inventory updated',
      billNo: checkoutResult.salesOrder.order_number,
      invoiceNumber: checkoutResult.invoice.invoice_number,
      paymentNumber: checkoutResult.payment?.payment_number || null,
      totalAmount: Number(checkoutResult.salesOrder.grand_total),
      paidAmount: checkoutResult.actualPaidAmount,
      pendingAmount: checkoutResult.actualPendingAmount,
      paymentStatus: checkoutResult.finalPaymentStatus,
      subtotal: Number(checkoutResult.salesOrder.subtotal),
      taxTotal: Number(checkoutResult.salesOrder.tax_total),
      discountTotal: Number(checkoutResult.salesOrder.discount_total),
      paymentMode: checkoutResult.payment?.payment_mode || payment_mode,
      customerName: checkoutResult.salesOrder.customer_name,
      items: checkoutResult.salesOrder.items.map((it) => ({
        id: it.id,
        name: it.product.name,
        sku: it.product.sku,
        quantity: Number(it.quantity),
        price: Number(it.unit_price),
        total: Number(it.total),
      })),
      date: checkoutResult.salesOrder.order_date,
    });
  } catch (err: any) {
    console.error('POS Checkout error:', err);
    res.status(400).json({ error: err.message || 'Billing checkout failed' });
  }
});

export default router;
