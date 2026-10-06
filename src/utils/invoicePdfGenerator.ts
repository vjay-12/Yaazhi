import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SalesOrderData } from '../services/salesOrderService';
import { settingsService } from '../services/settingsService';

/**
 * Utility to convert numbers to Indian Rupee Words
 */
function numberToIndianWords(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: number): string => {
    let str = '';
    if (n >= 10000000) {
      str += inWords(Math.floor(n / 10000000)) + ' Crore ';
      n %= 10000000;
    }
    if (n >= 100000) {
      str += inWords(Math.floor(n / 100000)) + ' Lakh ';
      n %= 100000;
    }
    if (n >= 1000) {
      str += inWords(Math.floor(n / 1000)) + ' Thousand ';
      n %= 1000;
    }
    if (n >= 100) {
      str += inWords(Math.floor(n / 100)) + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      if (str !== '') str += 'and ';
      if (n < 20) {
        str += a[n] + ' ';
      } else {
        str += b[Math.floor(n / 10)] + ' ' + a[n % 10] + ' ';
      }
    }
    return str.trim();
  };

  const integerPart = Math.floor(Math.abs(num));
  const decimalPart = Math.round((Math.abs(num) - integerPart) * 100);

  let result = inWords(integerPart) + ' Rupees';
  if (decimalPart > 0) {
    result += ' and ' + inWords(decimalPart) + ' Paise';
  }
  result += ' Only';
  return result;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export interface CompanyInvoiceInfo {
  companyName: string;
  legalName?: string;
  address: string;
  phone: string;
  email: string;
  gstin: string;
  state: string;
  stateCode: string;
}

const DEFAULT_COMPANY_INFO: CompanyInvoiceInfo = {
  companyName: 'Yaazhi Boutique & Atelier',
  legalName: 'Yaazhi Silks & Couture Pvt Ltd',
  address: '42 Weaver Colony, Kanchipuram - 631501',
  phone: '+91 94440 12890',
  email: 'atelier@yaazhi.in',
  gstin: '33AABCY1234A1Z5',
  state: 'Tamil Nadu',
  stateCode: '33',
};

/**
 * Generates and triggers direct PDF download for a Sales Order / Invoice
 */
export async function downloadSalesOrderPdf(
  order: SalesOrderData,
  customCompanyInfo?: CompanyInvoiceInfo
): Promise<void> {
  let companyInfo = customCompanyInfo || DEFAULT_COMPANY_INFO;
  if (!customCompanyInfo) {
    try {
      const dbSettings = await settingsService.getSettings();
      if (dbSettings) {
        companyInfo = {
          companyName: dbSettings.company_name || DEFAULT_COMPANY_INFO.companyName,
          legalName: dbSettings.legal_name || DEFAULT_COMPANY_INFO.legalName,
          address: dbSettings.address || DEFAULT_COMPANY_INFO.address,
          phone: dbSettings.phone || DEFAULT_COMPANY_INFO.phone,
          email: dbSettings.email || DEFAULT_COMPANY_INFO.email,
          gstin: dbSettings.gstin || DEFAULT_COMPANY_INFO.gstin,
          state: dbSettings.state_code === '33' ? 'Tamil Nadu' : DEFAULT_COMPANY_INFO.state,
          stateCode: dbSettings.state_code || DEFAULT_COMPANY_INFO.stateCode,
        };
      }
    } catch {
      // Gracefully fall back to DEFAULT_COMPANY_INFO if settings API unavailable
    }
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  const isVoided = order.status === 'VOIDED' || order.status === 'CANCELLED' || order.paymentStatus === 'VOIDED';
  const isPaid = !isVoided && (order.paymentStatus === 'PAID' || (order.totalAmount > 0 && order.pendingAmount === 0));

  const invoiceNumber = order.invoiceNumber || `INV-${order.orderNumber.replace('SO-', '').replace('BILL-', '')}`;
  const filename = `Yaazhi-Invoice-${invoiceNumber}.pdf`;

  // --- 1. Watermark for VOIDED Orders (Subtle, professional, clearly visible legal watermark) ---
  if (isVoided) {
    doc.saveGraphicsState();
    // @ts-ignore
    if (doc.setGState) {
      // @ts-ignore
      doc.setGState(new doc.GState({ opacity: 0.18 }));
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(64);
    doc.setTextColor(100, 116, 139); // Professional slate legal watermark gray
    doc.text('V O I D E D', pageWidth / 2, pageHeight / 2 + 5, {
      align: 'center',
      angle: 45,
    });
    doc.restoreGraphicsState();
  }

  // --- 2. Top Header ---
  let cursorY = margin;

  // Left Header: Brand & Business Details
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(131, 39, 41); // Yaazhi Maroon
  doc.text('YAAZHI', margin, cursorY + 5);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Boutique & Atelier', margin, cursorY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(companyInfo.address, margin, cursorY + 14.5);
  doc.text(`GSTIN: ${companyInfo.gstin} | State: ${companyInfo.state} (${companyInfo.stateCode})`, margin, cursorY + 18.5);
  doc.text(`Phone: ${companyInfo.phone} | Email: ${companyInfo.email}`, margin, cursorY + 22.5);

  // Right Header: Document Title & Status
  const rightX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('TAX INVOICE', rightX, cursorY + 5, { align: 'right' });

  // Status Badge Text (Subtle, professional styling)
  doc.setFontSize(9);
  if (isVoided) {
    doc.setTextColor(100, 116, 139); // Muted neutral
    doc.text('STATUS: VOIDED', rightX, cursorY + 10.5, { align: 'right' });
  } else if (isPaid) {
    doc.setTextColor(22, 101, 52); // Green
    doc.text('STATUS: PAID', rightX, cursorY + 10.5, { align: 'right' });
  } else {
    doc.setTextColor(71, 85, 105); // Neutral slate for PENDING (including partial)
    doc.text('STATUS: PENDING', rightX, cursorY + 10.5, { align: 'right' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Original for Recipient', rightX, cursorY + 15, { align: 'right' });

  cursorY += 28;

  // Thin separator line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, cursorY, pageWidth - margin, cursorY);
  cursorY += 4;

  // --- 3. Two Side-by-Side Information Cards (Invoice Details & Billed To) ---
  const boxWidth = (contentWidth - 6) / 2; // ~88mm each
  const boxHeight = 28;
  const leftBoxX = margin;
  const rightBoxX = margin + boxWidth + 6;

  // Draw box outlines
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(leftBoxX, cursorY, boxWidth, boxHeight, 1.5, 1.5, 'FD');
  doc.roundedRect(rightBoxX, cursorY, boxWidth, boxHeight, 1.5, 1.5, 'FD');

  // Box 1: INVOICE DETAILS (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(131, 39, 41);
  doc.text('INVOICE DETAILS', leftBoxX + 4, cursorY + 5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Invoice No:', leftBoxX + 4, cursorY + 10);
  doc.text('Invoice Date:', leftBoxX + 4, cursorY + 14.5);
  doc.text('Order Ref:', leftBoxX + 4, cursorY + 19);
  doc.text('Showroom:', leftBoxX + 4, cursorY + 23.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoiceNumber, leftBoxX + 24, cursorY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(formatDisplayDate(order.date), leftBoxX + 24, cursorY + 14.5);
  doc.text(order.orderNumber, leftBoxX + 24, cursorY + 19);
  doc.text(order.location || 'Main Showroom Counter', leftBoxX + 24, cursorY + 23.5);

  // Box 2: BILLED TO (CUSTOMER) (Right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(131, 39, 41);
  doc.text('BILLED TO (CUSTOMER)', rightBoxX + 4, cursorY + 5);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Name:', rightBoxX + 4, cursorY + 10);
  doc.text('Address:', rightBoxX + 4, cursorY + 14.5);
  doc.text('Phone / GST:', rightBoxX + 4, cursorY + 23.5);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const custName = doc.splitTextToSize(order.customerName || 'Walk-in Client', boxWidth - 28);
  doc.text(custName, rightBoxX + 24, cursorY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  const custAddr = doc.splitTextToSize(order.customerAddress || 'Showroom In-Store Counter', boxWidth - 28);
  doc.text(custAddr, rightBoxX + 24, cursorY + 14.5);

  const phoneGst = `${order.customerPhone || '—'} / ${order.customerId ? 'Registered Client' : 'URP (Unregistered)'}`;
  doc.text(phoneGst, rightBoxX + 24, cursorY + 23.5);

  cursorY += boxHeight + 6;

  // --- 4. Items Table (autoTable) ---
  // Exactly matching requirement columns:
  // # | ITEM DESCRIPTION | SKU | QTY | RATE | TAX % | TAX | TOTAL
  const tableHead = [
    [
      '#',
      'ITEM DESCRIPTION',
      'SKU',
      'QTY',
      'RATE (Rs.)',
      'TAX %',
      'TAX (Rs.)',
      'TOTAL (Rs.)',
    ],
  ];

  const tableBody = (order.items && order.items.length > 0 ? order.items : []).map((it, index) => {
    const lineTotal = Number(it.total ?? it.quantity * it.unitPrice);
    const taxRate = Number(it.taxRate || 5);
    const lineSubtotal = lineTotal / (1 + taxRate / 100);
    const lineTax = lineTotal - lineSubtotal;

    return [
      (index + 1).toString(),
      it.productName,
      it.sku || '—',
      `${it.quantity} pcs`,
      it.unitPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      `${taxRate}%`,
      lineTax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ];
  });

  autoTable(doc, {
    startY: cursorY,
    head: tableHead,
    body: tableBody,
    theme: 'plain',
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
    headStyles: {
      fillColor: [131, 39, 41], // Yaazhi brand maroon
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
      cellPadding: 2.5,
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 7.5,
      cellPadding: 2.5,
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' }, // #
      1: { cellWidth: 54, halign: 'left', fontStyle: 'bold' }, // ITEM DESCRIPTION
      2: { cellWidth: 26, halign: 'left' }, // SKU
      3: { cellWidth: 16, halign: 'center' }, // QTY
      4: { cellWidth: 22, halign: 'right' }, // RATE
      5: { cellWidth: 14, halign: 'center' }, // TAX %
      6: { cellWidth: 20, halign: 'right' }, // TAX
      7: { cellWidth: 22, halign: 'right', fontStyle: 'bold' }, // TOTAL
    },
    didDrawPage: (_data) => {
      // Re-apply watermark if table spanned across multiple pages
      if (isVoided) {
        doc.saveGraphicsState();
        // @ts-ignore
        if (doc.setGState) {
          // @ts-ignore
          doc.setGState(new doc.GState({ opacity: 0.18 }));
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(64);
        doc.setTextColor(100, 116, 139);
        doc.text('V O I D E D', pageWidth / 2, pageHeight / 2 + 5, {
          align: 'center',
          angle: 45,
        });
        doc.restoreGraphicsState();
      }
    },
  });

  // @ts-ignore
  const finalY = (doc as any).lastAutoTable.finalY + 5;
  cursorY = finalY;

  // Check if bottom boxes fit on current page or need a new page
  if (cursorY + 65 > pageHeight - margin) {
    doc.addPage();
    cursorY = margin;
  }

  // --- 5. Bottom Section: Left (Amount in Words & Payment Record) & Right (Totals Box) ---
  const totalsBoxWidth = 76;
  const totalsBoxX = pageWidth - margin - totalsBoxWidth;
  const paymentBoxWidth = contentWidth - totalsBoxWidth - 6;
  const paymentBoxX = margin;

  // LEFT BOX: Amount in Words & Payment Record
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(paymentBoxX, cursorY, paymentBoxWidth, 38, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(131, 39, 41);
  doc.text('AMOUNT IN WORDS:', paymentBoxX + 4, cursorY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  const words = doc.splitTextToSize(numberToIndianWords(order.totalAmount), paymentBoxWidth - 8);
  doc.text(words, paymentBoxX + 4, cursorY + 9.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(131, 39, 41);
  doc.text('PAYMENT RECORD:', paymentBoxX + 4, cursorY + 18);

  const statusLabel = isVoided ? 'VOIDED' : isPaid ? 'PAID' : 'PENDING';
  const displayPaid = isVoided ? order.paidAmount : isPaid ? order.totalAmount : order.paidAmount;
  const displayBalance = isVoided ? 0 : isPaid ? 0 : order.pendingAmount;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`Payment Status: ${statusLabel}`, paymentBoxX + 4, cursorY + 22.5);
  doc.text(`Paid Amount:    Rs. ${displayPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, paymentBoxX + 4, cursorY + 27);
  doc.text(`Balance:        Rs. ${displayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, paymentBoxX + 4, cursorY + 31.5);
  doc.text(`Payment Mode:   ${order.invoiceNumber ? 'Boutique POS / Counter' : 'Standard Counter'}`, paymentBoxX + 4, cursorY + 36);

  // RIGHT BOX: Totals Breakdown (Subtotal, GST, Discount, Grand Total, Paid/Balance)
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(255, 255, 255); // Clean light background
  doc.roundedRect(totalsBoxX, cursorY, totalsBoxWidth, 38, 1.5, 1.5, 'FD');

  const subtotal = order.subtotal || order.totalAmount;
  const tax = order.taxTotal || 0;
  const discount = order.discountTotal || 0;
  const rightValX = totalsBoxX + totalsBoxWidth - 4;

  let totalLineY = cursorY + 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal:', totalsBoxX + 4, totalLineY);
  doc.setTextColor(30, 41, 59);
  doc.text(`Rs. ${subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightValX, totalLineY, { align: 'right' });

  totalLineY += 4.5;
  doc.setTextColor(100, 116, 139);
  doc.text('GST:', totalsBoxX + 4, totalLineY);
  doc.setTextColor(30, 41, 59);
  doc.text(`Rs. ${tax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightValX, totalLineY, { align: 'right' });

  totalLineY += 4.5;
  doc.setTextColor(100, 116, 139);
  doc.text('Discount:', totalsBoxX + 4, totalLineY);
  doc.setTextColor(discount > 0 ? 22 : 30, discount > 0 ? 101 : 41, discount > 0 ? 52 : 59);
  doc.text(
    discount > 0 ? `- Rs. ${discount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : 'Rs. 0.00',
    rightValX,
    totalLineY,
    { align: 'right' }
  );

  totalLineY += 2;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(totalsBoxX + 4, totalLineY, rightValX, totalLineY);
  totalLineY += 4.5;

  // Grand Total Highlight: Clean, light, professional Yaazhi-themed row with strong contrast
  const grandTotalBoxY = totalLineY - 3.5;
  doc.setFillColor(254, 242, 242); // Soft light Yaazhi rose tint (clean and light)
  doc.setDrawColor(254, 205, 211); // Subtle rose accent border
  doc.setLineWidth(0.3);
  doc.roundedRect(totalsBoxX + 2, grandTotalBoxY, totalsBoxWidth - 4, 7, 1, 1, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(131, 39, 41); // Strong contrast bold Yaazhi burgundy
  doc.text('Grand Total:', totalsBoxX + 5, totalLineY + 1.2);
  doc.text(`Rs. ${order.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightValX - 1, totalLineY + 1.2, { align: 'right' });

  totalLineY += 5.5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Paid:', totalsBoxX + 4, totalLineY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 101, 52); // green for paid
  doc.text(`Rs. ${displayPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightValX, totalLineY, { align: 'right' });

  totalLineY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Balance:', totalsBoxX + 4, totalLineY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(displayBalance > 0 ? 180 : 100, displayBalance > 0 ? 83 : 116, displayBalance > 0 ? 9 : 139);
  doc.text(`Rs. ${displayBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, rightValX, totalLineY, { align: 'right' });

  cursorY += 42;

  // --- 6. Terms & Conditions and Signature Section ---
  if (cursorY + 22 > pageHeight - margin) {
    doc.addPage();
    cursorY = margin;
  }

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, cursorY, contentWidth, 20, 1.5, 1.5, 'S');

  // Terms (Left)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(131, 39, 41);
  doc.text('TERMS & CONDITIONS:', margin + 4, cursorY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('1. Goods once sold are subject to standard boutique exchange/care terms within 7 days.', margin + 4, cursorY + 8.5);
  doc.text('2. Computer-generated tax document. Authorized and valid without physical signature.', margin + 4, cursorY + 12);
  doc.text('3. Jurisdiction: Subject to local courts of Kanchipuram / Tamil Nadu jurisdiction.', margin + 4, cursorY + 15.5);

  // Signature (Right)
  const sigX = pageWidth - margin - 40;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`For ${companyInfo.companyName}`, sigX, cursorY + 5, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Authorized Signatory', sigX, cursorY + 16, { align: 'center' });

  // Trigger browser PDF file download directly
  doc.save(filename);
}

