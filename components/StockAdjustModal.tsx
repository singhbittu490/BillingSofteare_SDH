'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import { X, RefreshCw } from 'lucide-react';

interface StockAdjustModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (productId: number, newStock: number, reason: string) => void;
}

export function StockAdjustModal({ product, onClose, onSave }: StockAdjustModalProps) {
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [operation, setOperation] = useState<'add' | 'reduce'>('add');
  const [reason, setReason] = useState<string>('Physical stock verification');

  if (!product) return null;

  const newCalculatedStock =
    operation === 'add'
      ? product.currentStock + Number(quantityChange)
      : Math.max(0, product.currentStock - Number(quantityChange));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantityChange <= 0) {
      alert('Please enter a quantity greater than 0');
      return;
    }
    onSave(product.id, newCalculatedStock, `${operation === 'add' ? 'Added' : 'Reduced'}: ${reason}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm sm:text-base">Adjust Stock: {product.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between">
            <span className="text-slate-600">Current In-Stock:</span>
            <span className="font-bold text-slate-900 text-sm">
              {product.currentStock} {product.unit}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setOperation('add')}
              className={`py-2 px-3 rounded font-bold text-xs border ${
                operation === 'add'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              + Add Stock
            </button>
            <button
              type="button"
              onClick={() => setOperation('reduce')}
              className={`py-2 px-3 rounded font-bold text-xs border ${
                operation === 'reduce'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              - Reduce Stock
            </button>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Quantity ({product.unit}) *</label>
            <input
              type="number"
              min="1"
              required
              value={quantityChange || ''}
              onChange={(e) => setQuantityChange(Number(e.target.value))}
              className="w-full border border-slate-300 rounded p-2 text-slate-900 font-bold"
              placeholder="Enter quantity"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Reason for Adjustment</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 bg-white"
            >
              <option value="Physical stock verification">Physical stock verification count</option>
              <option value="Damaged / Broken goods">Damaged / Broken goods written off</option>
              <option value="Internal office consumption">Internal office consumption</option>
              <option value="Found extra stock">Found extra unrecorded stock</option>
              <option value="Customer return without invoice">Customer return without invoice</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-2.5 rounded text-xs text-blue-900 flex justify-between">
            <span>Resulting Stock Balance:</span>
            <span className="font-bold">
              {newCalculatedStock} {product.unit}
            </span>
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
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow"
            >
              Save Adjustment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
