'use client';

import React, { useState } from 'react';
import { CompanySettings, Customer, Invoice, InvoiceItem, Product } from '@/lib/types';
import { Plus, Trash2, X, Calculator, UserCheck, AlertCircle, Hash, RotateCcw, FileText } from 'lucide-react';
import { formatINR } from '@/lib/initial-data';
import { generateUniqueId, getTodayDateString, getDueDateString } from '@/lib/utils';

interface CreateInvoiceModalProps {
  company: CompanySettings;
  customers: Customer[];
  products: Product[];
  nextInvoiceNum: string;
  initialInvoice?: Invoice | null;
  onClose: () => void;
  onSave: (newInvoice: Invoice, updatedProducts: Product[], updatedCustomers: Customer[], isEdit?: boolean) => void;
}

interface DraftItem {
  id: string;
  productId: number;
  productName: string;
  hsnSac: string;
  quantity: number;
  unit: string;
  rate: number;
  discountPercent: number;
  gstRate: number;
}

export function CreateInvoiceModal({
  company,
  customers,
  products,
  nextInvoiceNum,
  initialInvoice,
  onClose,
  onSave,
}: CreateInvoiceModalProps) {
  const isEdit = Boolean(initialInvoice);

  const [invoiceNumber, setInvoiceNumber] = useState<string>(initialInvoice?.invoiceNumber || nextInvoiceNum);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(initialInvoice?.customerId || customers[0]?.id || 1);
  const [invoiceDate, setInvoiceDate] = useState<string>(() => initialInvoice?.invoiceDate || getTodayDateString());
  const [dueDate, setDueDate] = useState<string>(() => initialInvoice?.dueDate || getDueDateString(15));
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Partially Paid' | 'Unpaid'>(initialInvoice?.paymentStatus || 'Paid');
  const [paidAmountInput, setPaidAmountInput] = useState<string>(initialInvoice ? initialInvoice.paidAmount.toString() : '');
  const [paymentMode, setPaymentMode] = useState<string>(initialInvoice?.paymentMode || 'UPI');
  const [notes, setNotes] = useState<string>(initialInvoice?.notes ?? 'Thank you for your business!');

  // Custom customer input state (if "New Customer" selected)
  const [isCustomCustomer, setIsCustomCustomer] = useState<boolean>(false);
  const [customName, setCustomName] = useState('');
  const [customMobile, setCustomMobile] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [customGstin, setCustomGstin] = useState('');
  const [customState, setCustomState] = useState('Maharashtra');
  const [customStateCode, setCustomStateCode] = useState('27');

  // Selected customer object
  const currentCustomer = customers.find((c) => c.id === selectedCustomerId) || customers[0];
  const activeStateCode = isCustomCustomer ? customStateCode : (currentCustomer?.stateCode || '27');
  const activeStateName = isCustomCustomer ? customState : (currentCustomer?.state || 'Maharashtra');
  const isInterState = activeStateCode !== company.stateCode;

  // Item lines state
  const [items, setItems] = useState<DraftItem[]>(() => {
    if (initialInvoice && initialInvoice.items && initialInvoice.items.length > 0) {
      return initialInvoice.items.map((it, idx) => ({
        id: `draft-item-${it.id || idx}`,
        productId: it.productId,
        productName: it.productName,
        hsnSac: it.hsnSac || '',
        quantity: it.quantity,
        unit: it.unit || 'PCS',
        rate: it.rate,
        discountPercent: it.discountPercent || 0,
        gstRate: it.gstRate,
      }));
    }
    return [
      {
        id: 'item-1',
        productId: products[0]?.id || 1,
        productName: products[0]?.name || 'Product',
        hsnSac: products[0]?.hsnSac || '8471',
        quantity: 1,
        unit: products[0]?.unit || 'PCS',
        rate: products[0]?.sellingPrice || 500,
        discountPercent: 0,
        gstRate: products[0]?.gstRate || 18,
      },
    ];
  });

  const handleProductSelect = (index: number, pId: number) => {
    const prod = products.find((p) => p.id === pId);
    if (!prod) return;

    setItems((prev) =>
      prev.map((it, idx) =>
        idx === index
          ? {
              ...it,
              productId: prod.id,
              productName: prod.name,
              hsnSac: prod.hsnSac,
              rate: prod.sellingPrice,
              unit: prod.unit,
              gstRate: prod.gstRate,
            }
          : it
      )
    );
  };

  const handleItemChange = (index: number, field: keyof DraftItem, value: any) => {
    setItems((prev) =>
      prev.map((it, idx) => (idx === index ? { ...it, [field]: value } : it))
    );
  };

  const addItemRow = () => {
    const defaultProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        productId: defaultProd?.id || 0,
        productName: defaultProd?.name || 'Item',
        hsnSac: defaultProd?.hsnSac || '',
        quantity: 1,
        unit: defaultProd?.unit || 'PCS',
        rate: defaultProd?.sellingPrice || 100,
        discountPercent: 0,
        gstRate: defaultProd?.gstRate || 18,
      },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Line computations
  const calculatedItems: InvoiceItem[] = items.map((it) => {
    const gross = (Number(it.rate) || 0) * (Number(it.quantity) || 0);
    const discAmount = (gross * (Number(it.discountPercent) || 0)) / 100;
    const taxable = Math.max(0, gross - discAmount);
    const gstR = Number(it.gstRate) || 0;

    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isInterState) {
      igst = (taxable * gstR) / 100;
    } else {
      cgst = (taxable * (gstR / 2)) / 100;
      sgst = (taxable * (gstR / 2)) / 100;
    }

    const total = taxable + cgst + sgst + igst;

    return {
      id: it.id,
      productId: it.productId,
      productName: it.productName,
      hsnSac: it.hsnSac,
      quantity: Number(it.quantity) || 1,
      unit: it.unit,
      rate: Number(it.rate) || 0,
      discountPercent: Number(it.discountPercent) || 0,
      taxableAmount: taxable,
      gstRate: gstR,
      cgst,
      sgst,
      igst,
      total,
    };
  });

  const subtotal = calculatedItems.reduce(
    (acc, it) => acc + it.rate * it.quantity,
    0
  );
  const taxableTotal = calculatedItems.reduce(
    (acc, it) => acc + it.taxableAmount,
    0
  );
  const discountTotal = subtotal - taxableTotal;
  const cgstTotal = calculatedItems.reduce((acc, it) => acc + it.cgst, 0);
  const sgstTotal = calculatedItems.reduce((acc, it) => acc + it.sgst, 0);
  const igstTotal = calculatedItems.reduce((acc, it) => acc + it.igst, 0);
  const rawGrandTotal = taxableTotal + cgstTotal + sgstTotal + igstTotal;
  const grandTotal = Math.round(rawGrandTotal);
  const roundOff = Number((grandTotal - rawGrandTotal).toFixed(2));

  // Payment amounts
  let paidAmount = 0;
  if (paymentStatus === 'Paid') {
    paidAmount = grandTotal;
  } else if (paymentStatus === 'Partially Paid') {
    paidAmount = Math.min(grandTotal, Math.max(0, Number(paidAmountInput) || 0));
  }
  const outstandingAmount = Math.max(0, grandTotal - paidAmount);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceNumber.trim()) {
      alert('कृपया इनवॉइस / बिल नंबर दर्ज करें (Please enter a valid Invoice Number).');
      return;
    }

    let targetCustomerName = '';
    let targetCustomerGstin = '';
    let targetCustomerAddress = '';
    let targetCustomerId = selectedCustomerId;
    let newCustomerList = [...customers];

    if (isCustomCustomer) {
      if (!customName.trim()) {
        alert('Please enter a customer name.');
        return;
      }
      targetCustomerId = generateUniqueId();
      const newCust: Customer = {
        id: targetCustomerId,
        name: customName.trim(),
        businessName: customName.trim(),
        mobile: customMobile.trim() || '9876543210',
        billingAddress: customAddress.trim() || `${customState}, India`,
        gstin: customGstin.trim().toUpperCase(),
        state: customState,
        stateCode: customStateCode,
        customerType: customGstin.trim() ? 'Registered' : 'Consumer',
        outstandingBalance: outstandingAmount,
      };
      newCustomerList.push(newCust);
      targetCustomerName = newCust.name;
      targetCustomerGstin = newCust.gstin || '';
      targetCustomerAddress = newCust.billingAddress;
    } else {
      targetCustomerName = currentCustomer.businessName
        ? `${currentCustomer.name} (${currentCustomer.businessName})`
        : currentCustomer.name;
      targetCustomerGstin = currentCustomer.gstin || '';
      targetCustomerAddress = currentCustomer.billingAddress;
    }

    // Stock adjustment with proper reconciliation for edit
    const updatedProducts = products.map((prod) => {
      const newMatch = calculatedItems.find((it) => it.productId === prod.id);
      const newQty = newMatch ? newMatch.quantity : 0;

      if (isEdit && initialInvoice) {
        const oldMatch = initialInvoice.items.find((it) => it.productId === prod.id);
        const oldQty = oldMatch ? oldMatch.quantity : 0;
        const diff = newQty - oldQty;
        if (diff !== 0 && prod.currentStock < 900) {
          return {
            ...prod,
            currentStock: Math.max(0, prod.currentStock - diff),
          };
        }
      } else {
        if (newMatch && prod.currentStock < 900) {
          return {
            ...prod,
            currentStock: Math.max(0, prod.currentStock - newQty),
          };
        }
      }
      return prod;
    });

    const savedInvoice: Invoice = {
      id: initialInvoice ? initialInvoice.id : generateUniqueId(),
      invoiceNumber: invoiceNumber.trim(),
      invoiceDate,
      dueDate,
      customerId: targetCustomerId,
      customerName: targetCustomerName,
      customerGstin: targetCustomerGstin,
      customerAddress: targetCustomerAddress,
      customerState: activeStateName,
      customerStateCode: activeStateCode,
      placeOfSupply: `${activeStateName} (${activeStateCode})`,
      isInterState,
      items: calculatedItems,
      subtotal,
      discountTotal,
      taxableAmount: taxableTotal,
      cgstTotal,
      sgstTotal,
      igstTotal,
      roundOff,
      grandTotal,
      paidAmount,
      outstandingAmount,
      paymentStatus,
      paymentMode: paymentStatus !== 'Unpaid' ? paymentMode : undefined,
      notes,
      createdAt: initialInvoice ? initialInvoice.createdAt : new Date().toISOString(),
    };

    onSave(savedInvoice, updatedProducts, newCustomerList, isEdit);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-blue-400" />
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg">
                {isEdit ? 'Edit GST Tax Invoice' : 'Create GST Tax Invoice'}
              </h2>
              <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 font-mono text-xs font-semibold border border-blue-400/30">
                #{invoiceNumber || 'NEW'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Customer & Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
            {/* Customer Picker */}
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Customer:
              </label>
              {!isCustomCustomer ? (
                <div className="space-y-2">
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                    className="w-full text-xs sm:text-sm border border-slate-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.businessName ? `(${c.businessName})` : ''} - {c.state}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsCustomCustomer(true)}
                    className="text-xs text-blue-600 hover:underline font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add One-time Customer
                  </button>
                </div>
              ) : (
                <div className="space-y-2 border border-blue-200 p-2.5 rounded bg-blue-50/50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-900">New Customer</span>
                    <button
                      type="button"
                      onClick={() => setIsCustomCustomer(false)}
                      className="text-[11px] text-slate-500 hover:text-slate-800"
                    >
                      Back to list
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Customer / Business Name *"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Mobile Number"
                    value={customMobile}
                    onChange={(e) => setCustomMobile(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="GSTIN (Optional)"
                    value={customGstin}
                    onChange={(e) => setCustomGstin(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white uppercase font-mono"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="State (e.g. Maharashtra)"
                      value={customState}
                      onChange={(e) => setCustomState(e.target.value)}
                      className="text-xs border border-slate-300 rounded p-1.5 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="State Code (27)"
                      value={customStateCode}
                      onChange={(e) => setCustomStateCode(e.target.value)}
                      className="text-xs border border-slate-300 rounded p-1.5 bg-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Place of Supply & Tax Type Indicator */}
            <div className="text-xs space-y-1.5 bg-white p-3 rounded border border-slate-200">
              <span className="font-semibold text-slate-500 block uppercase tracking-wider text-[10px]">
                Tax Determination:
              </span>
              <p className="text-slate-700">
                <strong>Place of Supply:</strong> {activeStateName} ({activeStateCode})
              </p>
              <div className="pt-1">
                {isInterState ? (
                  <span className="inline-block px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-semibold text-[11px]">
                    Inter-State Sale: IGST Applicable
                  </span>
                ) : (
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold text-[11px]">
                    Intra-State Sale: CGST + SGST (50/50)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Company Base: {company.state} (Code: {company.stateCode})
              </p>
            </div>

            {/* Invoice Number & Dates */}
            <div className="text-xs space-y-2 bg-white p-3 rounded border border-slate-200">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="input-invoice-number" className="font-bold text-slate-800 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Invoice No. (बिल नंबर) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setInvoiceNumber(nextInvoiceNum)}
                    className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-semibold hover:underline"
                    title="Auto-fill sequential invoice number"
                  >
                    <RotateCcw className="w-3 h-3" /> Auto
                  </button>
                </div>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    id="input-invoice-number"
                    type="text"
                    required
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="e.g. INV-2026-1001"
                    className="w-full pl-8 pr-2.5 py-1.5 border border-slate-300 rounded font-mono font-bold text-blue-900 bg-blue-50/40 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>Prefix: <strong className="font-mono text-slate-700">{company.invoicePrefix}</strong></span>
                  <span className="text-slate-400">अपनी पसंद का नंबर लिखें</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Invoice Date:</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Due Date:</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-slate-300 rounded p-1.5 bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Items Table */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-sm text-slate-800">Invoice Items & GST Slabs</h3>
              <button
                type="button"
                onClick={addItemRow}
                className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 rounded font-medium border border-blue-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Row</span>
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 w-8 text-center">#</th>
                    <th className="p-2.5 min-w-[200px]">Product / Service</th>
                    <th className="p-2.5 w-20">HSN/SAC</th>
                    <th className="p-2.5 w-20 text-center">Qty</th>
                    <th className="p-2.5 w-24 text-right">Rate (₹)</th>
                    <th className="p-2.5 w-20 text-right">Disc %</th>
                    <th className="p-2.5 w-20 text-center">GST %</th>
                    <th className="p-2.5 w-28 text-right">Line Total (₹)</th>
                    <th className="p-2.5 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {items.map((item, idx) => {
                    const gross = (Number(item.rate) || 0) * (Number(item.quantity) || 0);
                    const disc = (gross * (Number(item.discountPercent) || 0)) / 100;
                    const taxVal = Math.max(0, gross - disc);
                    const taxAmt = (taxVal * (Number(item.gstRate) || 0)) / 100;
                    const lineTot = taxVal + taxAmt;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="p-2 text-center text-slate-400">{idx + 1}</td>
                        <td className="p-2">
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductSelect(idx, Number(e.target.value))}
                            className="w-full p-1.5 border border-slate-300 rounded bg-white font-medium text-slate-800"
                          >
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} (Stock: {p.currentStock} {p.unit})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.hsnSac}
                            onChange={(e) => handleItemChange(idx, 'hsnSac', e.target.value)}
                            className="w-full p-1.5 border border-slate-300 rounded text-center font-mono text-[11px]"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, Number(e.target.value)))}
                            className="w-full p-1.5 border border-slate-300 rounded text-center font-bold"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.rate}
                            onChange={(e) => handleItemChange(idx, 'rate', Number(e.target.value))}
                            className="w-full p-1.5 border border-slate-300 rounded text-right font-medium"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={item.discountPercent}
                            onChange={(e) => handleItemChange(idx, 'discountPercent', Number(e.target.value))}
                            className="w-full p-1.5 border border-slate-300 rounded text-right text-slate-600"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={item.gstRate}
                            onChange={(e) => handleItemChange(idx, 'gstRate', Number(e.target.value))}
                            className="w-full p-1.5 border border-slate-300 rounded text-center font-semibold bg-white"
                          >
                            <option value={0}>0%</option>
                            <option value={5}>5%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                            <option value={28}>28%</option>
                          </select>
                        </td>
                        <td className="p-2 text-right font-bold text-slate-900">
                          {lineTot.toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Totals & Payment Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Payment Mode & Notes */}
            <div className="space-y-4 text-xs">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  Payment Status:
                </span>
                <div className="flex gap-4">
                  {(['Paid', 'Partially Paid', 'Unpaid'] as const).map((st) => (
                    <label key={st} className="inline-flex items-center gap-1.5 cursor-pointer font-medium">
                      <input
                        type="radio"
                        name="paymentStatus"
                        checked={paymentStatus === st}
                        onChange={() => setPaymentStatus(st)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{st}</span>
                    </label>
                  ))}
                </div>

                {paymentStatus === 'Partially Paid' && (
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Advance Paid Amount (₹):</label>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      placeholder="Enter received amount"
                      value={paidAmountInput}
                      onChange={(e) => setPaidAmountInput(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-xs bg-white"
                    />
                  </div>
                )}

                {paymentStatus !== 'Unpaid' && (
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Payment Mode:</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value)}
                      className="w-full border border-slate-300 rounded p-2 text-xs bg-white font-medium"
                    >
                      <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                      <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / RTGS)</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Invoice Notes / Remarks:</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs"
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Gross):</span>
                <span>₹ {subtotal.toFixed(2)}</span>
              </div>
              {discountTotal > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount:</span>
                  <span>- ₹ {discountTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-slate-800 pt-1 border-t border-slate-200">
                <span>Taxable Turnover:</span>
                <span>₹ {taxableTotal.toFixed(2)}</span>
              </div>

              {!isInterState ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Central GST (CGST):</span>
                    <span>₹ {cgstTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>State GST (SGST):</span>
                    <span>₹ {sgstTotal.toFixed(2)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-purple-700 font-medium">
                  <span>Integrated GST (IGST):</span>
                  <span>₹ {igstTotal.toFixed(2)}</span>
                </div>
              )}

              {roundOff !== 0 && (
                <div className="flex justify-between text-slate-400 text-[11px]">
                  <span>Round Off:</span>
                  <span>₹ {roundOff.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                <span>Grand Total:</span>
                <span className="text-blue-700">{formatINR(grandTotal)}</span>
              </div>

              <div className="flex justify-between pt-1 font-semibold text-emerald-700">
                <span>Paid Amount:</span>
                <span>{formatINR(paidAmount)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-600">
                <span>Outstanding Due:</span>
                <span>{formatINR(outstandingAmount)}</span>
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow transition-colors flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isEdit ? 'Update & Save Invoice (अपडेट करें)' : 'Save & Generate Invoice'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
