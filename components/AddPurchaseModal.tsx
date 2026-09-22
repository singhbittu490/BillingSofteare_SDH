'use client';

import React, { useState } from 'react';
import { Product, Purchase, Supplier } from '@/lib/types';
import { X, ShoppingBag, Trash2 } from 'lucide-react';
import { generateUniqueId, getTodayDateString } from '@/lib/utils';

interface AddPurchaseModalProps {
  suppliers: Supplier[];
  products: Product[];
  nextPurchaseNum: string;
  initialPurchase?: Purchase | null;
  onClose: () => void;
  onSave: (purchase: Purchase, updatedProducts: Product[]) => void;
  onDelete?: (purchaseId: number) => void;
}

export function AddPurchaseModal({
  suppliers,
  products,
  nextPurchaseNum,
  initialPurchase,
  onClose,
  onSave,
  onDelete,
}: AddPurchaseModalProps) {
  const isEdit = Boolean(initialPurchase);
  const firstItem = initialPurchase?.items?.[0];

  const [supplierId, setSupplierId] = useState<number>(initialPurchase?.supplierId ?? (suppliers[0]?.id || 1));
  const [supplierBillNumber, setSupplierBillNumber] = useState(initialPurchase?.supplierBillNumber || '');
  const [purchaseDate, setPurchaseDate] = useState(() => initialPurchase?.purchaseDate || getTodayDateString());
  const [selectedProductId, setSelectedProductId] = useState<number>(firstItem?.productId ?? (products[0]?.id || 1));
  const [quantity, setQuantity] = useState<number>(firstItem?.quantity ?? 10);
  const [purchasePrice, setPurchasePrice] = useState<number>(firstItem?.purchasePrice ?? (products[0]?.purchasePrice || 100));
  const [gstRate, setGstRate] = useState<number>(firstItem?.gstRate ?? (products[0]?.gstRate || 18));
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>(initialPurchase?.paymentStatus || 'Paid');
  const [notes, setNotes] = useState(initialPurchase?.notes || 'Stock procurement');

  const selectedSupplier = suppliers.find((s) => s.id === supplierId) || suppliers[0];
  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];

  const subtotal = quantity * purchasePrice;
  const taxAmount = (subtotal * gstRate) / 100;
  const grandTotal = Math.round(subtotal + taxAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quantity <= 0 || purchasePrice <= 0) {
      alert('Please enter valid quantity and purchase price.');
      return;
    }

    const uniqueId = initialPurchase?.id || generateUniqueId();
    const savedPurchase: Purchase = {
      id: uniqueId,
      purchaseNumber: initialPurchase?.purchaseNumber || nextPurchaseNum,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.businessName || selectedSupplier.name,
      supplierBillNumber: supplierBillNumber.trim() || undefined,
      purchaseDate,
      items: [
        {
          id: firstItem?.id || `pi-${uniqueId}`,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity,
          purchasePrice,
          gstRate,
          total: grandTotal,
        },
      ],
      subtotal,
      taxAmount,
      grandTotal,
      paymentStatus,
      notes,
    };

    // Calculate stock reconciliation
    const oldProductId = firstItem?.productId;
    const oldQuantity = firstItem?.quantity || 0;

    const updatedProducts = products.map((prod) => {
      if (isEdit) {
        if (prod.id === oldProductId && prod.id === selectedProduct.id) {
          // Same product: net stock difference
          return {
            ...prod,
            currentStock: Math.max(0, prod.currentStock - oldQuantity + quantity),
            purchasePrice,
          };
        }
        if (prod.id === oldProductId) {
          // Revert old product stock
          return {
            ...prod,
            currentStock: Math.max(0, prod.currentStock - oldQuantity),
          };
        }
        if (prod.id === selectedProduct.id) {
          // Add new product stock
          return {
            ...prod,
            currentStock: prod.currentStock + quantity,
            purchasePrice,
          };
        }
        return prod;
      } else {
        // New purchase: just increment stock
        if (prod.id === selectedProduct.id) {
          return {
            ...prod,
            currentStock: prod.currentStock + quantity,
            purchasePrice,
          };
        }
        return prod;
      }
    });

    onSave(savedPurchase, updatedProducts);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">
              {isEdit
                ? `Edit Purchase Bill (${initialPurchase?.purchaseNumber})`
                : `Record Purchase Bill (${nextPurchaseNum})`}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Select Supplier *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(Number(e.target.value))}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.businessName || s.state})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Supplier Bill / Inv No.</label>
              <input
                type="text"
                placeholder="e.g. NT-2026-99"
                value={supplierBillNumber}
                onChange={(e) => setSupplierBillNumber(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Purchase Date</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                <option value="Paid">Paid</option>
                <option value="Unpaid">Unpaid / Credit</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <label className="block text-slate-700 font-semibold mb-1">Select Product to Restock *</label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                const pid = Number(e.target.value);
                setSelectedProductId(pid);
                const match = products.find((p) => p.id === pid);
                if (match) {
                  setPurchasePrice(match.purchasePrice);
                  setGstRate(match.gstRate);
                }
              }}
              className="w-full border border-slate-300 rounded p-2 bg-white font-medium"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Current Stock: {p.currentStock} {p.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Qty to Inward</label>
              <input
                type="number"
                min="1"
                required
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full border border-slate-300 rounded p-2 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Cost Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="w-full border border-slate-300 rounded p-2 font-bold"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">GST Rate (%)</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full border border-slate-300 rounded p-2 bg-white font-semibold"
              >
                <option value={0}>0%</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>₹ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Input GST (ITC):</span>
              <span>₹ {taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200 text-sm">
              <span>Total Purchase Bill:</span>
              <span className="text-emerald-700">₹ {grandTotal.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-emerald-600 pt-1">
              ✓ Inventory stock for <strong>{selectedProduct.name}</strong> will automatically increase from {selectedProduct.currentStock} to {selectedProduct.currentStock + quantity} {selectedProduct.unit}.
            </p>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Notes / Remarks</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full border border-slate-300 rounded p-2"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            {isEdit && onDelete && initialPurchase ? (
              <button
                type="button"
                onClick={() => {
                  if (
                    confirm(
                      `Cancel and delete Purchase Bill ${initialPurchase.purchaseNumber}? Inventory stock will be deducted accordingly.`
                    )
                  ) {
                    onDelete(initialPurchase.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 flex items-center gap-1 transition-colors"
                title="Delete Purchase Bill (खरीद बिल हटाएं)"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Bill (हटाएं)</span>
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
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded shadow"
              >
                {isEdit ? 'Update Purchase Bill (अपडेट करें)' : 'Save Purchase & Add Stock'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
