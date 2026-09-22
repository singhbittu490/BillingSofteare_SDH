'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import { X, PackagePlus } from 'lucide-react';
import { generateUniqueId } from '@/lib/utils';

interface AddProductModalProps {
  initialProduct?: Product | null;
  onClose: () => void;
  onSave: (product: Product) => void;
}

export function AddProductModal({ initialProduct, onClose, onSave }: AddProductModalProps) {
  const [name, setName] = useState(initialProduct?.name || '');
  const [sku, setSku] = useState(initialProduct?.sku || '');
  const [category, setCategory] = useState(initialProduct?.category || 'Electronics & Hardware');
  const [hsnSac, setHsnSac] = useState(initialProduct?.hsnSac || '8471');
  const [unit, setUnit] = useState(initialProduct?.unit || 'PCS');
  const [purchasePrice, setPurchasePrice] = useState<number>(initialProduct?.purchasePrice ?? 0);
  const [sellingPrice, setSellingPrice] = useState<number>(initialProduct?.sellingPrice ?? 0);
  const [mrp, setMrp] = useState<number>(initialProduct?.mrp ?? (initialProduct?.sellingPrice ?? 0));
  const [gstRate, setGstRate] = useState<number>(initialProduct?.gstRate ?? 18);
  const [currentStock, setCurrentStock] = useState<number>(initialProduct?.currentStock ?? 10);
  const [minimumStock, setMinimumStock] = useState<number>(initialProduct?.minimumStock ?? 5);
  const [description, setDescription] = useState(initialProduct?.description || '');

  const isEdit = Boolean(initialProduct);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedProd: Product = {
      id: initialProduct?.id || generateUniqueId(),
      name: name.trim(),
      sku: sku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      category,
      hsnSac: hsnSac.trim(),
      unit,
      purchasePrice: Number(purchasePrice) || 0,
      sellingPrice: Number(sellingPrice) || 0,
      mrp: Number(mrp) || Number(sellingPrice) || 0,
      gstRate: Number(gstRate) || 18,
      currentStock: Number(currentStock) || 0,
      minimumStock: Number(minimumStock) || 0,
      description: description.trim(),
    };

    onSave(savedProd);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <PackagePlus className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">
              {isEdit ? 'Edit Product / Inventory Item' : 'Add New Product / Inventory Item'}
            </h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto">
          <div>
            <label className="block text-slate-700 font-semibold mb-1">Product / Service Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Wireless Mouse or Consulting Service"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">SKU / Item Code</label>
              <input
                type="text"
                placeholder="e.g. ELEC-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 uppercase font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">HSN / SAC Code</label>
              <input
                type="text"
                placeholder="e.g. 8471"
                value={hsnSac}
                onChange={(e) => setHsnSac(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                <option value="Electronics & Hardware">Electronics & Hardware</option>
                <option value="Office Supplies & Stationery">Office Supplies & Stationery</option>
                <option value="Services & Consulting">Services & Consulting</option>
                <option value="Packaging Materials">Packaging Materials</option>
                <option value="General Goods">General Goods</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Unit of Measure</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                <option value="PCS">PCS (Pieces)</option>
                <option value="BOX">BOX (Boxes)</option>
                <option value="SET">SET (Sets)</option>
                <option value="KG">KG (Kilograms)</option>
                <option value="MTR">MTR (Meters)</option>
                <option value="LTR">LTR (Liters)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Cost Price (₹)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Selling Price (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full border border-slate-300 rounded p-2 font-bold text-blue-700"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">GST Rate (%)</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full border border-slate-300 rounded p-2 bg-white font-semibold"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Opening Stock</label>
              <input
                type="number"
                min="0"
                value={currentStock}
                onChange={(e) => setCurrentStock(Number(e.target.value))}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Low Stock Alert Threshold</label>
              <input
                type="number"
                min="0"
                value={minimumStock}
                onChange={(e) => setMinimumStock(Number(e.target.value))}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Description (Optional)</label>
            <input
              type="text"
              placeholder="Short item description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 rounded p-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
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
              {isEdit ? 'Update Product (अपडेट करें)' : 'Save Product (सेव करें)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
