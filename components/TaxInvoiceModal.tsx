'use client';

import React, { useState } from 'react';
import { CompanySettings, Invoice } from '@/lib/types';
import { formatINR, numberToWordsINR } from '@/lib/initial-data';
import { Printer, Share2, X, Download, ExternalLink, Check, AlertCircle } from 'lucide-react';
import { downloadInvoicePDFDirect, openInvoicePDFInNewTab } from '@/lib/invoice-pdf';

interface TaxInvoiceModalProps {
  invoice: Invoice | null;
  company: CompanySettings;
  onClose: () => void;
}

export function TaxInvoiceModal({ invoice, company, onClose }: TaxInvoiceModalProps) {
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'success' | 'fallback'>('idle');

  if (!invoice) return null;

  const handleDownloadPdf = () => {
    try {
      const success = downloadInvoicePDFDirect(invoice, company);
      if (success) {
        setDownloadStatus('success');
        setTimeout(() => setDownloadStatus('idle'), 4000);
      } else {
        setDownloadStatus('fallback');
      }
    } catch (err) {
      console.error('Download PDF failed, opening in new tab:', err);
      openInvoicePDFInNewTab(invoice, company);
      setDownloadStatus('fallback');
    }
  };

  const handleOpenPdfInNewTab = () => {
    openInvoicePDFInNewTab(invoice, company);
  };

  const handlePrint = () => {
    try {
      window.print();
    } catch {
      openInvoicePDFInNewTab(invoice, company);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `Hello ${invoice.customerName},\n\n` +
      `Here are your Tax Invoice details from ${company.companyName}:\n` +
      `*Invoice No:* ${invoice.invoiceNumber}\n` +
      `*Date:* ${invoice.invoiceDate}\n` +
      `*Total Amount:* ${formatINR(invoice.grandTotal)}\n` +
      `*Paid Amount:* ${formatINR(invoice.paidAmount)}\n` +
      `*Balance Due:* ${formatINR(invoice.outstandingAmount)}\n` +
      `*Status:* ${invoice.paymentStatus}\n\n` +
      `Bank: ${company.bankName} | A/C: ${company.accountNumber} | IFSC: ${company.ifsc}\n` +
      `UPI: ${company.upiId}\n\n` +
      `Thank you for choosing ${company.companyName}!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div id="tax-invoice-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:fixed-none">
      <div id="tax-invoice-modal-card" className="relative w-full max-w-4xl bg-white rounded-xl shadow-2xl overflow-hidden my-auto print:shadow-none print:rounded-none print:w-full">
        {/* Action Header - Hidden during print */}
        <div className="flex flex-wrap items-center justify-between px-6 py-3 bg-slate-900 text-white print:hidden gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-sm sm:text-base">Tax Invoice: {invoice.invoiceNumber}</span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              invoice.paymentStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              invoice.paymentStatus === 'Partially Paid' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
              'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              {invoice.paymentStatus}
            </span>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {/* Primary Direct Download PDF Button */}
            <button
              id="btn-download-pdf-invoice"
              onClick={handleDownloadPdf}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm ${
                downloadStatus === 'success'
                  ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
              title="Download real PDF file to your computer/phone"
            >
              {downloadStatus === 'success' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Open in New Tab (Bypasses iframe sandbox) */}
            <button
              id="btn-open-pdf-new-tab"
              onClick={handleOpenPdfInNewTab}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-md text-xs font-medium transition-colors"
              title="Open PDF in full browser window to view or save directly"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open in New Tab</span>
            </button>

            {/* Print Button */}
            <button
              id="btn-print-invoice"
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors"
              title="Open browser print dialog"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              id="btn-whatsapp-invoice"
              onClick={handleWhatsApp}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-green-700 hover:bg-green-600 text-white rounded-md text-xs font-medium transition-colors"
              title="Share invoice summary on WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              id="btn-close-invoice"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Download Success Notice Banner */}
        {downloadStatus === 'success' && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2 flex items-center justify-between text-xs text-emerald-800 font-medium">
            <div className="flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>
                <strong>Invoice_{invoice.invoiceNumber}.pdf</strong> has been downloaded to your Downloads folder!
              </span>
            </div>
            <button
              onClick={handleOpenPdfInNewTab}
              className="text-emerald-900 underline font-bold hover:text-emerald-700"
            >
              Also open in browser &rarr;
            </button>
          </div>
        )}

        {downloadStatus === 'fallback' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-800 font-medium">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>
                If browser iframe blocks direct file saving, click &quot;Open in New Tab&quot; to view and save immediately.
              </span>
            </div>
            <button
              onClick={handleOpenPdfInNewTab}
              className="px-2 py-0.5 bg-amber-600 text-white rounded text-[11px] font-bold"
            >
              Open PDF Now
            </button>
          </div>
        )}

        {/* Printable Invoice Container */}
        <div id="printable-invoice" className="p-6 sm:p-8 bg-white text-slate-900 text-xs sm:text-sm font-sans leading-relaxed">
          {/* Top Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-8 h-8 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                    S
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">{company.companyName}</h1>
                    <p className="text-xs text-slate-500 font-medium">{company.legalName}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600">{company.address}, {company.city}, {company.state} - {company.pinCode}</p>
                <div className="flex flex-wrap gap-x-4 text-xs font-medium text-slate-700 mt-1">
                  <span><strong>GSTIN:</strong> {company.gstin}</span>
                  <span><strong>PAN:</strong> {company.pan}</span>
                  <span><strong>Phone:</strong> {company.mobile}</span>
                  <span><strong>Email:</strong> {company.email}</span>
                </div>
              </div>

              <div className="text-left sm:text-right bg-slate-50 p-3 rounded border border-slate-200">
                <div className="text-sm font-bold uppercase tracking-wider text-blue-700">TAX INVOICE</div>
                <div className="text-[11px] text-slate-500 mb-2">Original for Recipient</div>
                <div className="text-xs font-bold text-slate-900">Invoice No: {invoice.invoiceNumber}</div>
                <div className="text-xs text-slate-600">Date: <strong>{invoice.invoiceDate}</strong></div>
                <div className="text-xs text-slate-600">Due Date: {invoice.dueDate}</div>
                <div className="text-xs text-slate-600">Place of Supply: <strong>{invoice.placeOfSupply}</strong></div>
              </div>
            </div>
          </div>

          {/* Billed To & Shipped To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Details of Receiver (Billed To):</div>
              <div className="font-bold text-slate-900 text-sm">{invoice.customerName}</div>
              <div className="text-xs text-slate-600 mt-0.5">{invoice.customerAddress}</div>
              <div className="text-xs text-slate-700 mt-1">
                <strong>State:</strong> {invoice.customerState} (Code: {invoice.customerStateCode})
              </div>
              {invoice.customerGstin && (
                <div className="text-xs font-semibold text-blue-700 mt-0.5">
                  GSTIN/UIN: {invoice.customerGstin}
                </div>
              )}
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Tax Classification:</div>
              <div className="text-xs text-slate-700 space-y-1">
                <p><strong>Transaction Type:</strong> {invoice.isInterState ? 'Inter-State (IGST Applicable)' : 'Intra-State (CGST + SGST Applicable)'}</p>
                <p><strong>Reverse Charge:</strong> No</p>
                <p><strong>State Code:</strong> {invoice.customerStateCode}</p>
                <p><strong>Payment Status:</strong> <span className="font-semibold text-slate-900">{invoice.paymentStatus}</span></p>
              </div>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 font-semibold">
                  <th className="border border-slate-300 p-2 text-center w-8">#</th>
                  <th className="border border-slate-300 p-2 text-left">Item Description</th>
                  <th className="border border-slate-300 p-2 text-center w-16">HSN/SAC</th>
                  <th className="border border-slate-300 p-2 text-center w-12">Qty</th>
                  <th className="border border-slate-300 p-2 text-center w-12">Unit</th>
                  <th className="border border-slate-300 p-2 text-right w-16">Rate (₹)</th>
                  <th className="border border-slate-300 p-2 text-right w-14">Disc %</th>
                  <th className="border border-slate-300 p-2 text-right w-20">Taxable Val</th>
                  {!invoice.isInterState ? (
                    <>
                      <th className="border border-slate-300 p-2 text-right w-16">CGST</th>
                      <th className="border border-slate-300 p-2 text-right w-16">SGST</th>
                    </>
                  ) : (
                    <th className="border border-slate-300 p-2 text-right w-20">IGST</th>
                  )}
                  <th className="border border-slate-300 p-2 text-right w-24">Total (₹)</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-200">
                    <td className="border border-slate-300 p-2 text-center">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-medium text-slate-800">{item.productName}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono text-[11px] text-slate-600">{item.hsnSac || '-'}</td>
                    <td className="border border-slate-300 p-2 text-center font-semibold">{item.quantity}</td>
                    <td className="border border-slate-300 p-2 text-center text-slate-500">{item.unit}</td>
                    <td className="border border-slate-300 p-2 text-right">{item.rate.toFixed(2)}</td>
                    <td className="border border-slate-300 p-2 text-right text-slate-500">{item.discountPercent > 0 ? `${item.discountPercent}%` : '-'}</td>
                    <td className="border border-slate-300 p-2 text-right font-medium">{item.taxableAmount.toFixed(2)}</td>
                    {!invoice.isInterState ? (
                      <>
                        <td className="border border-slate-300 p-2 text-right text-slate-600">
                          <div>{item.cgst.toFixed(2)}</div>
                          <span className="text-[10px] text-slate-400">({(item.gstRate / 2)}%)</span>
                        </td>
                        <td className="border border-slate-300 p-2 text-right text-slate-600">
                          <div>{item.sgst.toFixed(2)}</div>
                          <span className="text-[10px] text-slate-400">({(item.gstRate / 2)}%)</span>
                        </td>
                      </>
                    ) : (
                      <td className="border border-slate-300 p-2 text-right text-slate-600">
                        <div>{item.igst.toFixed(2)}</div>
                        <span className="text-[10px] text-slate-400">({item.gstRate}%)</span>
                      </td>
                    )}
                    <td className="border border-slate-300 p-2 text-right font-bold text-slate-900">{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Amount In Words & Totals Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-300 rounded p-3 mb-4">
            <div className="flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Invoice Amount in Words:</span>
                <p className="font-semibold text-slate-800 text-xs mt-1 italic">
                  {numberToWordsINR(invoice.grandTotal)}
                </p>
              </div>

              {invoice.notes && (
                <div className="mt-3 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500">Notes / Remarks:</span>
                  <p className="text-xs text-slate-600 mt-0.5">{invoice.notes}</p>
                </div>
              )}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Gross Subtotal:</span>
                <span>₹ {invoice.subtotal.toFixed(2)}</span>
              </div>
              {invoice.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Total Discount:</span>
                  <span>- ₹ {invoice.discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
                <span>Taxable Amount:</span>
                <span>₹ {invoice.taxableAmount.toFixed(2)}</span>
              </div>
              {!invoice.isInterState ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Central GST (CGST):</span>
                    <span>₹ {invoice.cgstTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>State GST (SGST):</span>
                    <span>₹ {invoice.sgstTotal.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-600">
                  <span>Integrated GST (IGST):</span>
                  <span>₹ {invoice.igstTotal.toFixed(2)}</span>
                </div>
              )}
              {invoice.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off:</span>
                  <span>₹ {invoice.roundOff.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t-2 border-slate-900">
                <span>Grand Total:</span>
                <span className="text-blue-700">{formatINR(invoice.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-700 pt-1">
                <span>Amount Paid:</span>
                <span>{formatINR(invoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-rose-600">
                <span>Balance Due:</span>
                <span>{formatINR(invoice.outstandingAmount)}</span>
              </div>
            </div>
          </div>

          {/* Footer: Bank Details, Terms & Signatory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 text-[11px]">
            <div>
              <div className="font-bold text-slate-800 mb-1 uppercase tracking-wider">Bank Details for NEFT / RTGS:</div>
              <div className="text-slate-600 space-y-0.5">
                <p><strong>Bank:</strong> {company.bankName}</p>
                <p><strong>A/C No:</strong> {company.accountNumber}</p>
                <p><strong>IFSC Code:</strong> {company.ifsc}</p>
                <p><strong>UPI ID:</strong> {company.upiId}</p>
              </div>

              <div className="mt-3">
                <div className="font-bold text-slate-800 mb-0.5">Terms & Conditions:</div>
                <div className="text-slate-500 whitespace-pre-line text-[10px] leading-relaxed">
                  {company.termsConditions}
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-between items-start sm:items-end text-left sm:text-right pt-4 sm:pt-0">
              <div className="text-slate-600">
                Certified that the particulars given above are true and correct.
              </div>

              <div className="mt-8 border-t border-slate-400 pt-2 w-48 text-center sm:text-right">
                <div className="font-bold text-slate-800">{company.authorizedSignatory}</div>
                <div className="text-[10px] text-slate-500">Authorized Signatory</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
