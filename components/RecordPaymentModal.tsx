'use client';

import React, { useState } from 'react';
import { Invoice } from '@/lib/types';
import { formatINR } from '@/lib/initial-data';
import { X, CheckCircle2 } from 'lucide-react';

interface RecordPaymentModalProps {
  invoice: Invoice | null;
  onClose: () => void;
  onSavePayment: (invoiceId: number, amount: number, paymentMethod: string, reference: string, notes: string) => void;
}

export function RecordPaymentModal({ invoice, onClose, onSavePayment }: RecordPaymentModalProps) {
  const [amount, setAmount] = useState<number>(invoice?.outstandingAmount || 0);
  const [method, setMethod] = useState<string>('UPI');
  const [reference, setReference] = useState<string>('');
  const [notes, setNotes] = useState<string>('Payment received');

  if (!invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || amount > invoice.outstandingAmount) {
      alert(`Payment amount must be between ₹1 and ₹${invoice.outstandingAmount}`);
      return;
    }
    onSavePayment(invoice.id, amount, method, reference, notes);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
          <div>
            <h3 className="font-bold text-sm sm:text-base">Record Payment</h3>
            <p className="text-xs text-slate-400">Invoice: {invoice.invoiceNumber}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Customer:</span>
              <span className="font-semibold text-slate-900">{invoice.customerName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Invoice Amount:</span>
              <span className="font-semibold">{formatINR(invoice.grandTotal)}</span>
            </div>
            <div className="flex justify-between text-rose-600 font-bold">
              <span>Current Outstanding Due:</span>
              <span>{formatINR(invoice.outstandingAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Amount Received (₹) *</label>
            <input
              type="number"
              required
              min="1"
              max={invoice.outstandingAmount}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full border border-slate-300 rounded p-2 text-slate-900 font-bold text-base focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-slate-900 bg-white"
            >
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
              <option value="Cash">Cash</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Transaction / Reference Number</label>
            <input
              type="text"
              placeholder="e.g. UPI/2026/091839 or NEFT Ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
