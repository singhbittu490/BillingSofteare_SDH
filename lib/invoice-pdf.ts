import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CompanySettings, Invoice } from '@/lib/types';
import { formatINR, numberToWordsINR } from '@/lib/initial-data';

export function generateInvoicePDF(invoice: Invoice, company: CompanySettings): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const isInterState = invoice.isInterState;
  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 12;
  let currentY = 12;

  // Outer Border
  doc.setDrawColor(30, 41, 59); // slate-800
  doc.setLineWidth(0.4);
  doc.rect(margin, margin, pageWidth - margin * 2, 273);

  // Top Header Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(margin, margin, pageWidth - margin * 2, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TAX INVOICE  (Original for Recipient)', pageWidth / 2, margin + 6, { align: 'center' });

  currentY = margin + 14;

  // Company Logo & Details
  let textStartX = margin + 4;
  if (company.logoUrl) {
    try {
      if (company.logoUrl.startsWith('data:image/')) {
        const formatMatch = company.logoUrl.match(/^data:image\/(png|jpeg|jpg|webp)/i);
        const format = formatMatch ? (formatMatch[1].toUpperCase() === 'JPG' ? 'JPEG' : formatMatch[1].toUpperCase()) : 'PNG';
        doc.addImage(company.logoUrl, format, margin + 4, currentY - 2, 18, 18);
        textStartX = margin + 25;
      }
    } catch (e) {
      console.warn('Could not render logo in PDF:', e);
    }
  }

  // Company Details (Left)
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(company.companyName, textStartX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  currentY += 4.5;
  doc.text(company.address, textStartX, currentY);
  currentY += 4;
  doc.text(`Mobile: ${company.mobile} | Email: ${company.email}`, textStartX, currentY);
  currentY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`GSTIN: ${company.gstin}`, textStartX, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(` | State: ${company.state} (${company.stateCode})`, textStartX + doc.getTextWidth(`GSTIN: ${company.gstin}`), currentY);

  // Invoice Metadata (Right Box)
  const metaBoxX = 125;
  const metaBoxWidth = pageWidth - margin - metaBoxX - 2;
  const metaY = margin + 12;

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(metaBoxX, metaY, metaBoxWidth, 24, 1.5, 1.5, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Invoice No:', metaBoxX + 3, metaY + 5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216); // blue-700
  doc.text(invoice.invoiceNumber, metaBoxX + 24, metaY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Invoice Date:', metaBoxX + 3, metaY + 10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.invoiceDate, metaBoxX + 24, metaY + 10);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Due Date:', metaBoxX + 3, metaY + 15);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.dueDate, metaBoxX + 24, metaY + 15);

  doc.setTextColor(71, 85, 105);
  doc.text('Place of Supply:', metaBoxX + 3, metaY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.placeOfSupply, metaBoxX + 24, metaY + 20);

  // Horizontal divider
  currentY = margin + 38;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // Customer Section
  currentY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('BILLED TO (BUYER):', margin + 4, currentY);

  currentY += 4.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(invoice.customerName, margin + 4, currentY);

  currentY += 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(invoice.customerAddress || `${invoice.placeOfSupply}, India`, margin + 4, currentY);

  currentY += 4;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  const gstinLabel = invoice.customerGstin ? `GSTIN: ${invoice.customerGstin}` : 'Customer Type: Unregistered / Consumer';
  doc.text(gstinLabel, margin + 4, currentY);

  // Reverse Charge status on right
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Reverse Charge (RCM): ${invoice.reverseCharge ? 'Yes' : 'No'}`, metaBoxX, currentY);

  currentY += 3;

  // Item Table
  const tableHeaders = isInterState
    ? [['#', 'Item Description', 'HSN/SAC', 'Qty', 'Unit', 'Rate (Rs)', 'Disc %', 'Taxable Val', 'IGST %', 'IGST Amt', 'Total (Rs)']]
    : [['#', 'Item Description', 'HSN/SAC', 'Qty', 'Unit', 'Rate (Rs)', 'Disc %', 'Taxable Val', 'CGST', 'SGST', 'Total (Rs)']];

  const tableBody = invoice.items.map((item, idx) => {
    if (isInterState) {
      return [
        (idx + 1).toString(),
        item.productName,
        item.hsnSac || '-',
        item.quantity.toString(),
        item.unit,
        item.rate.toFixed(2),
        item.discountPercent > 0 ? `${item.discountPercent}%` : '-',
        item.taxableAmount.toFixed(2),
        `${item.gstRate}%`,
        item.igst.toFixed(2),
        item.total.toFixed(2),
      ];
    } else {
      return [
        (idx + 1).toString(),
        item.productName,
        item.hsnSac || '-',
        item.quantity.toString(),
        item.unit,
        item.rate.toFixed(2),
        item.discountPercent > 0 ? `${item.discountPercent}%` : '-',
        item.taxableAmount.toFixed(2),
        `${(item.gstRate / 2).toFixed(1)}%\nRs ${item.cgst.toFixed(2)}`,
        `${(item.gstRate / 2).toFixed(1)}%\nRs ${item.sgst.toFixed(2)}`,
        item.total.toFixed(2),
      ];
    }
  });

  autoTable(doc, {
    startY: currentY,
    head: tableHeaders,
    body: tableBody,
    theme: 'grid',
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'center',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 1.8,
      overflow: 'linebreak',
      textColor: [30, 41, 59],
      lineColor: [203, 213, 225],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'left', cellWidth: 44 },
      2: { halign: 'center', cellWidth: 16 },
      3: { halign: 'center', cellWidth: 10 },
      4: { halign: 'center', cellWidth: 10 },
      5: { halign: 'right', cellWidth: 18 },
      6: { halign: 'center', cellWidth: 12 },
      7: { halign: 'right', cellWidth: 20 },
      8: { halign: 'center', cellWidth: 16 },
      9: { halign: 'center', cellWidth: 16 },
      10: { halign: 'right', cellWidth: 16 },
    },
  });

  // Position after table
  const finalY = (doc as any).lastAutoTable.finalY + 4;

  // Tax Summary and Totals
  const leftColWidth = 105;
  const rightColX = margin + leftColWidth + 4;
  const rightColWidth = pageWidth - margin - rightColX;

  // Left Column: Amount in words & Bank Info
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Total Amount in Words:', margin + 4, finalY);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(numberToWordsINR(invoice.grandTotal), margin + 4, finalY + 4, { maxWidth: leftColWidth });

  // Bank Details Card
  const bankBoxY = finalY + 12;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + 4, bankBoxY, leftColWidth - 4, 25, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Bank & Payment Details for RTGS / NEFT / UPI:', margin + 7, bankBoxY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Bank Name: ${company.bankName}`, margin + 7, bankBoxY + 9);
  doc.text(`Account No: ${company.accountNumber}`, margin + 7, bankBoxY + 13.5);
  doc.text(`IFSC Code: ${company.ifsc} | City: ${company.city}`, margin + 7, bankBoxY + 18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(29, 78, 216);
  doc.text(`UPI ID: ${company.upiId}`, margin + 7, bankBoxY + 22.5);

  // Right Column: Tax Breakdown Box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(rightColX, finalY, rightColWidth, 42, 1.5, 1.5, 'FD');

  let rY = finalY + 5;
  const drawSummaryLine = (label: string, value: string, isBold = false) => {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 8.5 : 7.5);
    doc.setTextColor(isBold ? 15 : 71, isBold ? 23 : 85, isBold ? 42 : 105);
    doc.text(label, rightColX + 3, rY);
    doc.text(value, rightColX + rightColWidth - 3, rY, { align: 'right' });
    rY += 4.5;
  };

  drawSummaryLine('Total Taxable Value:', `Rs ${invoice.taxableAmount.toFixed(2)}`);
  if (!isInterState) {
    drawSummaryLine('CGST Total:', `Rs ${invoice.cgstTotal.toFixed(2)}`);
    drawSummaryLine('SGST Total:', `Rs ${invoice.sgstTotal.toFixed(2)}`);
  } else {
    drawSummaryLine('IGST Total:', `Rs ${invoice.igstTotal.toFixed(2)}`);
  }

  if (invoice.roundOff !== 0) {
    drawSummaryLine('Round Off Adjustment:', `Rs ${invoice.roundOff.toFixed(2)}`);
  }

  doc.setDrawColor(203, 213, 225);
  doc.line(rightColX + 2, rY - 1, rightColX + rightColWidth - 2, rY - 1);
  rY += 1.5;

  drawSummaryLine('Invoice Grand Total:', `Rs ${invoice.grandTotal.toFixed(2)}`, true);
  drawSummaryLine('Amount Paid:', `Rs ${invoice.paidAmount.toFixed(2)}`);
  drawSummaryLine('Balance Due:', `Rs ${invoice.outstandingAmount.toFixed(2)}`, true);

  // Bottom Terms & Signature
  const footerY = 258;
  doc.setDrawColor(203, 213, 225);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Terms & Conditions:', margin + 4, footerY + 4);
  doc.text('1. Goods once sold will not be taken back or exchanged.', margin + 4, footerY + 7);
  doc.text('2. Interest @ 18% p.a. will be charged if payment is not made within the due date.', margin + 4, footerY + 10);
  doc.text('3. Subject to jurisdiction of local courts only.', margin + 4, footerY + 13);
  doc.text('4. This is a computer generated invoice.', margin + 4, footerY + 16);

  // Authorized Signatory
  const sigX = pageWidth - margin - 50;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`For ${company.companyName}`, sigX, footerY + 5, { align: 'center' });
  doc.text('[ Authorized Signatory ]', sigX, footerY + 22, { align: 'center' });

  return doc;
}

/**
 * Downloads invoice PDF directly using multi-tier fallback:
 * 1. Native jsPDF save
 * 2. Data URI <a> tag click
 * 3. Blob URL <a> tag click
 * 4. Window open fallback
 */
export function downloadInvoicePDFDirect(invoice: Invoice, company: CompanySettings): boolean {
  try {
    const doc = generateInvoicePDF(invoice, company);
    const fileName = `Invoice_${invoice.invoiceNumber}.pdf`;

    // Strategy 1: Data URL blob
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = fileName;
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();

    setTimeout(() => {
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(blobUrl);
    }, 1000);

    return true;
  } catch (error) {
    console.error('downloadInvoicePDFDirect error:', error);
    try {
      const doc = generateInvoicePDF(invoice, company);
      doc.save(`Invoice_${invoice.invoiceNumber}.pdf`);
      return true;
    } catch (e) {
      console.error('doc.save fallback failed:', e);
      return false;
    }
  }
}

/**
 * Opens PDF in a new tab for previewing or saving directly if iframe blocks download
 */
export function openInvoicePDFInNewTab(invoice: Invoice, company: CompanySettings): void {
  try {
    const doc = generateInvoicePDF(invoice, company);
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      // If popup was blocked, fallback to direct download
      downloadInvoicePDFDirect(invoice, company);
    }
  } catch (err) {
    console.error('Failed to open PDF in new tab:', err);
    downloadInvoicePDFDirect(invoice, company);
  }
}
