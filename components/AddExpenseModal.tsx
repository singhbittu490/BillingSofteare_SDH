'use client';

import React, { useState } from 'react';
import { Expense } from '@/lib/types';
import { X, Receipt, Trash2 } from 'lucide-react';
import { generateUniqueId, getTodayDateString } from '@/lib/utils';

interface AddExpenseModalProps {
  initialExpense?: Expense;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  onDelete?: (expenseId: number) => void;
}

export function AddExpenseModal({
  initialExpense,
  onClose,
  onSave,
  onDelete,
}: AddExpenseModalProps) {
  const isEdit = Boolean(initialExpense);
  const [expenseDate, setExpenseDate] = useState(() => initialExpense?.expenseDate || getTodayDateString());
  const [category, setCategory] = useState(initialExpense?.category || 'Rent');
  const [amount, setAmount] = useState<number>(initialExpense?.amount || 0);
  const [paymentMethod, setPaymentMethod] = useState(initialExpense?.paymentMethod || 'UPI');
  const [referenceNumber, setReferenceNumber] = useState(initialExpense?.referenceNumber || '');
  const [description, setDescription] = useState(initialExpense?.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0 || !description.trim()) {
      alert('Please enter a valid amount and description.');
      return;
    }

    const savedExpense: Expense = {
      id: initialExpense ? initialExpense.id : generateUniqueId(),
      expenseDate,
      category,
      amount: Number(amount) || 0,
      paymentMethod,
      referenceNumber: referenceNumber.trim() || undefined,
      description: description.trim(),
    };

    onSave(savedExpense);
  };

  const handleDelete = () => {
    if (!initialExpense || !onDelete) return;
    if (
      confirm(
        `Are you sure you want to delete expense "${initialExpense.description}" of ₹${initialExpense.amount}? This action cannot be undone.`
      )
    ) {
      onDelete(initialExpense.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-base">
              {isEdit ? 'Edit Operational Expense (खर्च संपादित करें)' : 'Record Operational Expense'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Expense Date *</label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white font-medium"
              >
                <option value="Rent">Rent</option>
                <option value="Salary">Staff Salary</option>
                <option value="Electricity">Electricity & Utility</option>
                <option value="Internet & Telecom">Internet & Telecom</option>
                <option value="Transport">Freight & Travel</option>
                <option value="Office Expense">Tea & Pantry / Office Expense</option>
                <option value="Marketing">Marketing & Ads</option>
                <option value="Packaging">Packaging Materials</option>
                <option value="Other">Other Miscellaneous</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Amount (₹) *</label>
            <input
              type="number"
              min="1"
              step="0.01"
              required
              placeholder="e.g. 1500"
              value={amount || ''}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full border border-slate-300 rounded p-2 font-bold text-rose-600 text-base"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Expense Description *</label>
            <input
              type="text"
              required
              placeholder="e.g. Office broadband monthly bill"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 rounded p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Card">Credit/Debit Card</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Voucher / Ref No.</label>
              <input
                type="text"
                placeholder="Optional ref"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            {isEdit && onDelete ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 flex items-center gap-1 transition-colors"
                title="Delete this expense record (खर्च हटाएं)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete (हटाएं)</span>
              </button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded shadow"
              >
                {isEdit ? 'Update Expense' : 'Save Expense'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
