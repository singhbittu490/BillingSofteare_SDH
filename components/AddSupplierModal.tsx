'use client';

import React, { useState, useEffect } from 'react';
import { Supplier } from '@/lib/types';
import { INDIAN_STATES, getStateCodeByName } from '@/lib/tenant-storage';
import {
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Receipt,
  CreditCard,
  Trash2,
  Save,
  CheckCircle2,
  FileText,
  Truck,
} from 'lucide-react';
import { generateUniqueId } from '@/lib/utils';

interface AddSupplierModalProps {
  initialSupplier?: Supplier | null;
  onClose: () => void;
  onSave: (supplier: Supplier) => void;
  onDelete?: (supplierId: number) => void;
}

export function AddSupplierModal({
  initialSupplier,
  onClose,
  onSave,
  onDelete,
}: AddSupplierModalProps) {
  const isEdit = Boolean(initialSupplier);

  const [name, setName] = useState(initialSupplier?.name || '');
  const [businessName, setBusinessName] = useState(initialSupplier?.businessName || '');
  const [mobile, setMobile] = useState(initialSupplier?.mobile || '');
  const [email, setEmail] = useState(initialSupplier?.email || '');
  const [address, setAddress] = useState(initialSupplier?.address || '');
  const [gstin, setGstin] = useState(initialSupplier?.gstin || '');
  const [pan, setPan] = useState(initialSupplier?.pan || '');
  const [state, setState] = useState(initialSupplier?.state || 'Maharashtra');
  const [openingBalance, setOpeningBalance] = useState<number>(initialSupplier?.openingBalance || 0);
  const [bankName, setBankName] = useState(initialSupplier?.bankName || '');
  const [accountNumber, setAccountNumber] = useState(initialSupplier?.accountNumber || '');
  const [ifsc, setIfsc] = useState(initialSupplier?.ifsc || '');
  const [upiId, setUpiId] = useState(initialSupplier?.upiId || '');
  const [notes, setNotes] = useState(initialSupplier?.notes || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Auto-detect state and PAN when GSTIN is typed
  const handleGstinChange = (val: string) => {
    const cleanGst = val.toUpperCase().trim();
    setGstin(cleanGst);

    if (cleanGst.length >= 2) {
      const code = cleanGst.substring(0, 2);
      const matchedState = INDIAN_STATES.find((s) => s.code === code);
      if (matchedState) {
        setState(matchedState.name);
      }
    }

    if (cleanGst.length >= 12) {
      const extractedPan = cleanGst.substring(2, 12);
      setPan(extractedPan);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('कृपया आपूर्तिकर्ता / संपर्क नाम दर्ज करें (Supplier Name is required)');
      return;
    }

    if (!businessName.trim()) {
      setErrorMsg('कृपया दुकान / कंपनी / फर्म का नाम दर्ज करें (Business Name is required)');
      return;
    }

    if (!mobile.trim()) {
      setErrorMsg('कृपया वैध मोबाइल नंबर दर्ज करें (Mobile number is required)');
      return;
    }

    const stateCode = getStateCodeByName(state);

    const savedSupplier: Supplier = {
      id: initialSupplier ? initialSupplier.id : generateUniqueId(),
      name: name.trim(),
      businessName: businessName.trim(),
      mobile: mobile.trim(),
      email: email.trim() || undefined,
      address: address.trim() || `${state}, India`,
      gstin: gstin.trim().toUpperCase() || undefined,
      pan: pan.trim().toUpperCase() || (gstin.length >= 12 ? gstin.substring(2, 12) : undefined),
      state: state,
      stateCode: stateCode,
      openingBalance: openingBalance ? Number(openingBalance) : 0,
      outstandingBalance: openingBalance ? Number(openingBalance) : 0,
      bankName: bankName.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      ifsc: ifsc.trim().toUpperCase() || undefined,
      ifscCode: ifsc.trim().toUpperCase() || undefined,
      upiId: upiId.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    onSave(savedSupplier);
  };

  const handleDelete = () => {
    if (initialSupplier && onDelete) {
      onDelete(initialSupplier.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-6 border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Truck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                {isEdit ? 'Edit Supplier Details (आपूर्तिकर्ता संपादित करें)' : 'Add New Supplier (नया आपूर्तिकर्ता जोड़ें)'}
              </h3>
              <p className="text-xs text-slate-400">
                Vendor records, GSTIN, Bank &amp; Payment Details
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 flex-1 text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>1. Supplier &amp; Company Details (आपूर्तिकर्ता की पहचान)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Business / Store / Firm Name (फर्म / दुकान का नाम) *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. National Tech Distributors"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contact Person Name (संपर्क व्यक्ति का नाम) *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Suresh Patel"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Mobile Number (मोबाइल नंबर) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="e.g. 9833011223"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address (ईमेल)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="sales@vendor.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Taxation & Location */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>2. GST &amp; Location Details (जीएसटी एवं पता)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  GSTIN (जीएसटी नंबर)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => handleGstinChange(e.target.value)}
                  placeholder="e.g. 27AABCN8899K1Z4"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono uppercase"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">15 Characters GSTIN</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  PAN Number (पैन नंबर)
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="e.g. AABCN8899K"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono uppercase"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Auto-filled from GSTIN</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  State (राज्य) *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                  >
                    {INDIAN_STATES.map((st) => (
                      <option key={st.code} value={st.name}>
                        {st.name} ({st.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Full Vendor Address (दुकान / गोदाम का पता)
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot / Shop No, Street, Industrial Area, City, Pin Code"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Financial & Bank Details */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>3. Financial &amp; Bank Details (खाता एवं भुगतान विवरण)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Opening Balance / Outstanding Payable (शुरुआती देय राशि ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-semibold">₹</span>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={openingBalance || ''}
                    onChange={(e) => setOpeningBalance(Number(e.target.value))}
                    placeholder="0.00"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg pl-7 pr-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">Amount already payable to this vendor</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  UPI ID (यूपीआई आईडी)
                </label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="vendor@upi / mobile@okhdfcbank"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bank Name (बैंक का नाम)
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank Ltd"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Account No"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={ifsc}
                    onChange={(e) => setIfsc(e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono uppercase"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Payment Terms / Notes (क्रेडिट अवधि / रिमार्क्स)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 30 days credit term, 2% cash discount on prompt clearance"
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Delete Confirmation Box (if requested) */}
          {showDeleteConfirm && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 space-y-2 animate-in fade-in">
              <div className="font-bold flex items-center gap-1.5 text-rose-900">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>क्या आप वाकई इस आपूर्तिकर्ता को हटाना चाहते हैं?</span>
              </div>
              <p className="text-xs text-rose-700">
                हटाने पर यह आपूर्तिकर्ता आपकी सप्लायर सूची से स्थायी रूप से हटा दिया जाएगा।
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-sm transition-colors"
                >
                  हाँ, सप्लायर हटाएं (Confirm Delete)
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold text-xs transition-colors"
                >
                  रद्द करें (Cancel)
                </button>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            {isEdit && onDelete ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Supplier (हटाएं)</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
              >
                Cancel (रद्द करें)
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-500/25 transition-all active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>{isEdit ? 'Update Supplier (अपडेट करें)' : 'Save Supplier (सप्लायर सुरक्षित करें)'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
