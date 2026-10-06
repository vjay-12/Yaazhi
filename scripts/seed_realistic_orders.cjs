const { PrismaClient, OrderStatus } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- Cleaning up existing test sales orders and related records ---');

  // Find all existing sales orders
  const existingOrders = await prisma.salesOrder.findMany();
  console.log(`Found ${existingOrders.length} existing sales orders to delete.`);

  // Delete all payments connected to invoices of sales orders or sales orders
  await prisma.payment.deleteMany();
  // Delete all invoices
  await prisma.invoice.deleteMany();
  // Delete all sales order items
  await prisma.salesOrderItem.deleteMany();
  // Delete all sales orders
  await prisma.salesOrder.deleteMany();
  console.log('Deleted all existing sales orders and payments.');

  // Find godown
  const godown = await prisma.godown.findFirst({ where: { is_default: true } }) || await prisma.godown.findFirst();
  if (!godown) throw new Error('No godown found');

  // Find products
  const products = await prisma.product.findMany();
  const prodMap = new Map();
  products.forEach((p) => {
    prodMap.set(p.sku, p);
  });

  const kan = prodMap.get('YZ-KAN-001') || products[0];
  const ban = prodMap.get('YZ-BAN-004') || products[1];
  const cht = prodMap.get('YZ-CHT-002') || products[2];
  const chu = prodMap.get('YZ-CHU-003') || products[3];
  const dup = prodMap.get('YZ-DUP-005') || products[4];
  const mys = prodMap.get('YZ-TEST-9909') || prodMap.get('YZ-TEST-2670') || prodMap.get('YZ-TEST-6955') || products[5];

  // Realistic customers
  const customerDefs = [
    { name: 'Priya Sundaram', phone: '+91 98401 23456', address: '14 Oliver Road, Alwarpet, Chennai', city: 'Chennai', tier: 'BRIDAL_VIP' },
    { name: 'Ananya Krishnan', phone: '+91 98412 98765', address: '32 Beach Road, Besant Nagar, Chennai', city: 'Chennai', tier: 'ATELIER_PATRON' },
    { name: 'Dr. Meenakshi Sundaram', phone: '+91 98403 68983', address: '2nd Avenue, Anna Nagar, Chennai', city: 'Chennai', tier: 'PRIVILEGE' },
    { name: 'Rukmini Narayanan', phone: '+91 98401 50592', address: '28 Bishop Garden, RA Puram, Chennai', city: 'Chennai', tier: 'BRIDAL_VIP' },
    { name: 'Meenakshi Ramachandran', phone: '+91 94421 55667', address: '12 Temple Car Street, Kanchipuram', city: 'Kanchipuram', tier: 'ATELIER_PATRON' },
    { name: 'Sowmya Ramanathan', phone: '+91 98408 77665', address: '19 4th Main Road, Gandhinagar, Adyar, Chennai', city: 'Chennai', tier: 'PRIVILEGE' },
  ];

  const custMap = new Map();
  for (const c of customerDefs) {
    let existing = await prisma.customer.findFirst({ where: { phone: c.phone } });
    if (!existing) {
      existing = await prisma.customer.create({
        data: {
          name: c.name,
          phone: c.phone,
          address: c.address,
          city: c.city,
          state_code: '33',
        },
      });
    } else {
      await prisma.customer.update({
        where: { id: existing.id },
        data: { name: c.name, address: c.address },
      });
    }
    custMap.set(c.name, existing);
  }

  console.log('Customers verified.');

  // EXACT 6 SALES ORDERS SPECIFICATION
  const ordersSpec = [
    // 1. BILL-2026-0001: PAID (Single payment)
    {
      orderNumber: 'BILL-2026-0001',
      date: new Date('2026-10-02T10:30:00Z'),
      customerName: 'Priya Sundaram',
      status: OrderStatus.DELIVERED,
      paymentStatus: 'PAID',
      notes: 'Boutique bridal appointment booking',
      items: [
        { product: kan, qty: 1, price: 28500, taxRate: 5 },
      ],
      payments: [
        {
          paymentNumber: 'PAY-2026-0001',
          date: new Date('2026-10-02T10:35:00Z'),
          amount: 29925,
          mode: 'UPI',
          status: 'Successful',
          reference: 'UPI/HDFC/2026100201',
          notes: 'Full payment via Google Pay',
        },
      ],
    },
    // 2. BILL-2026-0002: PENDING partially-paid (Multiple payments: 15,000 + 5,000 = 20,000 of 30,555)
    {
      orderNumber: 'BILL-2026-0002',
      date: new Date('2026-10-03T11:15:00Z'),
      customerName: 'Ananya Krishnan',
      status: OrderStatus.DELIVERED,
      paymentStatus: 'PENDING',
      notes: 'Boutique festive collection pre-order',
      items: [
        { product: ban, qty: 1, price: 24900, taxRate: 5 },
        { product: dup, qty: 1, price: 4200, taxRate: 5 },
      ],
      payments: [
        {
          paymentNumber: 'PAY-2026-0002',
          date: new Date('2026-10-03T11:20:00Z'),
          amount: 15000,
          mode: 'UPI',
          status: 'Successful',
          reference: 'UPI/ICICI/890123',
          notes: 'Advance booking payment via UPI',
        },
        {
          paymentNumber: 'PAY-2026-0003',
          date: new Date('2026-10-04T16:00:00Z'),
          amount: 5000,
          mode: 'Cash',
          status: 'Successful',
          reference: 'CSH-REC-0082',
          notes: 'Counter cash payment during trial',
        },
      ],
    },
    // 3. BILL-2026-0003: PENDING (0 payments made)
    {
      orderNumber: 'BILL-2026-0003',
      date: new Date('2026-10-04T14:45:00Z'),
      customerName: 'Dr. Meenakshi Sundaram',
      status: OrderStatus.CONFIRMED,
      paymentStatus: 'PENDING',
      notes: 'Custom tailoring trial scheduled for next week',
      items: [
        { product: chu, qty: 1, price: 9400, taxRate: 12 },
      ],
      payments: [],
    },
    // 4. BILL-2026-0004: PAID (Multiple payments: 10,000 + 6,905 = 16,905 full)
    {
      orderNumber: 'BILL-2026-0004',
      date: new Date('2026-10-04T16:20:00Z'),
      customerName: 'Rukmini Narayanan',
      status: OrderStatus.DELIVERED,
      paymentStatus: 'PAID',
      notes: 'Showroom VIP collection visit',
      items: [
        { product: mys, qty: 1, price: 10500, taxRate: 5 },
        { product: cht, qty: 2, price: 2800, taxRate: 5 },
      ],
      payments: [
        {
          paymentNumber: 'PAY-2026-0004',
          date: new Date('2026-10-04T16:25:00Z'),
          amount: 10000,
          mode: 'Card',
          status: 'Successful',
          reference: 'POS/AUTH/44821',
          notes: 'Initial card swipe at counter',
        },
        {
          paymentNumber: 'PAY-2026-0005',
          date: new Date('2026-10-05T12:10:00Z'),
          amount: 6905,
          mode: 'UPI',
          status: 'Successful',
          reference: 'UPI/GPAY/55490',
          notes: 'Settlement payment on collection',
        },
      ],
    },
    // 5. BILL-2026-0005: PARTIAL (Advance payment of 20,000 of 40,453)
    {
      orderNumber: 'BILL-2026-0005',
      date: new Date('2026-10-05T15:00:00Z'),
      customerName: 'Meenakshi Ramachandran',
      status: OrderStatus.CONFIRMED,
      paymentStatus: 'PARTIAL',
      notes: 'Temple car festival heritage wardrobe order',
      items: [
        { product: kan, qty: 1, price: 28500, taxRate: 5 },
        { product: chu, qty: 1, price: 9400, taxRate: 12 },
      ],
      payments: [
        {
          paymentNumber: 'PAY-2026-0006',
          date: new Date('2026-10-05T15:15:00Z'),
          amount: 20000,
          mode: 'Net Banking',
          status: 'Successful',
          reference: 'NEFT/HDFC/883419',
          notes: 'Online bank transfer advance',
        },
      ],
    },
    // 6. BILL-2026-0006: VOIDED (Historical payment preserved!)
    {
      orderNumber: 'BILL-2026-0006',
      date: new Date('2026-10-06T09:30:00Z'),
      customerName: 'Sowmya Ramanathan',
      status: OrderStatus.VOIDED,
      paymentStatus: 'VOIDED',
      notes: 'Showroom reservation cancelled [VOIDED: Customer exchanged order for custom Kanchipuram weave]',
      items: [
        { product: mys, qty: 1, price: 10500, taxRate: 5 },
      ],
      payments: [
        {
          paymentNumber: 'PAY-2026-0007',
          date: new Date('2026-10-06T09:35:00Z'),
          amount: 11025,
          mode: 'Card',
          status: 'Successful',
          reference: 'POS/AUTH/99120',
          notes: 'Initial card swipe (historical payment preserved)',
        },
      ],
    },
  ];

  let invIdx = 1;

  for (const spec of ordersSpec) {
    const cust = custMap.get(spec.customerName);

    let subtotal = 0;
    let taxTotal = 0;
    const lineItemsData = spec.items.map((it) => {
      const lineSubtotal = it.qty * it.price;
      const lineTax = (lineSubtotal * it.taxRate) / 100;
      subtotal += lineSubtotal;
      taxTotal += lineTax;
      return {
        product_id: it.product.id,
        quantity: it.qty,
        unit_price: it.price,
        discount: 0,
        tax_rate: it.taxRate,
        tax_amount: lineTax,
        total: lineSubtotal + lineTax,
      };
    });

    const grandTotal = subtotal + taxTotal;
    const paidSum = spec.payments.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = spec.status === OrderStatus.VOIDED ? 0 : Math.max(0, grandTotal - paidSum);

    // Create Sales Order
    const order = await prisma.salesOrder.create({
      data: {
        order_number: spec.orderNumber,
        customer_id: cust.id,
        customer_name: cust.name,
        customer_phone: cust.phone,
        customer_address: cust.address,
        godown_id: godown.id,
        order_date: spec.date,
        status: spec.status,
        subtotal,
        discount_total: 0,
        tax_total: taxTotal,
        grand_total: grandTotal,
        paid_amount: paidSum,
        pending_amount: pendingAmount,
        payment_status: spec.paymentStatus,
        notes: spec.notes,
        created_at: spec.date,
        items: {
          create: lineItemsData,
        },
      },
    });

    // Create Invoice
    const invoiceNumber = `INV-2026-${String(invIdx++).padStart(4, '0')}`;
    const invoice = await prisma.invoice.create({
      data: {
        invoice_number: invoiceNumber,
        reference_order_id: order.id,
        customer_id: cust.id,
        godown_id: godown.id,
        invoice_date: spec.date,
        status: spec.status === OrderStatus.VOIDED ? 'VOID' : spec.paymentStatus === 'PAID' ? 'PAID' : 'PENDING',
        subtotal,
        discount_total: 0,
        tax_total: taxTotal,
        grand_total: grandTotal,
        paid_amount: paidSum,
        balance_amount: pendingAmount,
        created_at: spec.date,
      },
    });

    // Create Payment records
    for (const pay of spec.payments) {
      await prisma.payment.create({
        data: {
          payment_number: pay.paymentNumber,
          sales_order_id: order.id,
          invoice_id: invoice.id,
          customer_id: cust.id,
          payment_date: pay.date,
          amount: pay.amount,
          payment_mode: pay.mode,
          status: pay.status,
          reference_number: pay.reference,
          notes: pay.notes,
          created_at: pay.date,
        },
      });
    }

    console.log(`Created ${order.order_number}: ${cust.name} | Total: ₹${grandTotal} | Paid: ₹${paidSum} | Pending: ₹${pendingAmount} | Status: ${spec.paymentStatus} | Payments: ${spec.payments.length}`);
  }

  const finalCount = await prisma.salesOrder.count();
  console.log(`--- Finished. Exactly ${finalCount} Sales Orders in database ---`);
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
