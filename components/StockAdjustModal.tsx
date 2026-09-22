'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import { X, RefreshCw, Trash2, AlertTriangle } from 'lucide-react';

interface StockAdjustModalProps {
  product: Product | null;
  onClose: () => void;
  onSave: (productId: number, newStock: number, reason: string) => void;
  onDeleteProduct?: (productId: number) => void;
}

export function StockAdjustModal({ product, onClose, onSave, onDeleteProduct }: StockAdjustModalProps) {
  const [quantityChange, setQuantityChange] = useState<number>(0);
  const [operation, setOperation] = useState<'add' | 'reduce' | 'set_zero'>('add');
  const [reason, setReason] = useState<string>('Physical stock verification');

  if (!product) return null;

  const newCalculatedStock =
    operation === 'set_zero'
      ? 0
      : operation === 'add'
      ? product.currentStock + Number(quantityChange)
      : Math.max(0, product.currentStock - Number(quantityChange));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (operation !== 'set_zero' && quantityChange <= 0) {
      alert('Please enter a quantity greater than 0');
      return;
    }
    const finalReason =
      operation === 'set_zero'
        ? `Stock Reset to 0: ${reason}`
        : `${operation === 'add' ? 'Added' : 'Reduced'}: ${reason}`;

    onSave(product.id, newCalculatedStock, finalReason);
  };

  const handleDelete = () => {
    if (!onDeleteProduct) return;
    if (
      confirm(
        `Are you sure you want to completely delete "${product.name}" (SKU: ${product.sku})? This will permanently remove the product and its stock records.`
      )
    ) {
      onDeleteProduct(product.id);
      onClose();
    }
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
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex justify-between items-center">
            <div>
              <span className="text-slate-600 block text-xs">Current In-Stock:</span>
              <span className="font-bold text-slate-900 text-base">
                {product.currentStock} {product.unit}
              </span>
            </div>
            {product.currentStock <= 0 ? (
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-semibold text-xs flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Out of Stock
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs">
                In Stock
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setOperation('add')}
              className={`py-2 px-2 rounded font-bold text-xs border ${
                operation === 'add'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              + Add
            </button>
            <button
              type="button"
              onClick={() => setOperation('reduce')}
              className={`py-2 px-2 rounded font-bold text-xs border ${
                operation === 'reduce'
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              - Reduce
            </button>
            <button
              type="button"
              onClick={() => {
                setOperation('set_zero');
                setQuantityChange(product.currentStock);
              }}
              className={`py-2 px-2 rounded font-bold text-xs border ${
                operation === 'set_zero'
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-slate-50 text-slate-700 border-slate-300'
              }`}
              title="Clear all stock to zero (स्टॉक शून्य करें)"
            >
              Clear to 0
            </button>
          </div>

          {operation !== 'set_zero' ? (
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
          ) : (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
              This will set the current stock count to <strong>0 {product.unit}</strong> (सभी स्टॉक खाली हो जाएगा).
            </div>
          )}

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
              <option value="Stock clearance / writeoff">Stock clearance / Zero out</option>
              <option value="Customer return without invoice">Customer return without invoice</option>
            </select>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-2.5 rounded text-xs text-blue-900 flex justify-between items-center">
            <span>Resulting Stock Balance:</span>
            <span className="font-black text-sm text-blue-950">
              {newCalculatedStock} {product.unit}
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            {onDeleteProduct ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 flex items-center gap-1 transition-colors"
                title="Delete this entire product and stock"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Product (हटाएं)</span>
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
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded shadow"
              >
                Save Adjustment
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
