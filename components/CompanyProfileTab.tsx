'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser, CompanySettings } from '@/lib/types';
import { INDIAN_STATES, getStateCodeByName } from '@/lib/tenant-storage';
import {
  Building2,
  Save,
  ShieldCheck,
  CheckCircle2,
  MapPin,
  FileText,
  CreditCard,
  Phone,
  Mail,
  Receipt,
  Sparkles,
  Lock,
} from 'lucide-react';

interface CompanyProfileTabProps {
  currentUser: AuthUser;
  company: CompanySettings;
  onUpdateCompany: (updated: CompanySettings) => void;
}

export function CompanyProfileTab({
  currentUser,
  company,
  onUpdateCompany,
}: CompanyProfileTabProps) {
  const [formData, setFormData] = useState<CompanySettings>(company);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleStateChange = (selectedState: string) => {
    const code = getStateCodeByName(selectedState);
    setFormData((prev) => ({
      ...prev,
      state: selectedState,
      stateCode: code,
    }));
  };

  const handleGstinChange = (gstinVal: string) => {
    const upper = gstinVal.toUpperCase().trim();
    // If first 2 chars are numeric, auto set state code
    let stateCode = formData.stateCode;
    if (upper.length >= 2 && !isNaN(Number(upper.slice(0, 2)))) {
      stateCode = upper.slice(0, 2);
    }
    // Auto extract PAN (chars 3 to 12)
    let pan = formData.pan;
    if (upper.length >= 12) {
      pan = upper.slice(2, 12);
    }

    setFormData((prev) => ({
      ...prev,
      gstin: upper,
      stateCode,
      pan,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCompany(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3500);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Banner: Isolation Guarantee */}
      <div className="bg-gradient-to-r from-blue-900/90 to-indigo-900/90 border border-blue-700/50 rounded-2xl p-5 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold">
              Private Company Profile (आपकी व्यक्तिगत कंपनी प्रोफाइल)
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              100% Isolated
            </span>
          </div>
          <p className="text-xs text-blue-200">
            Account: <strong className="text-white">{currentUser.name}</strong> ({currentUser.email}) — This company profile and all related invoices, inventory, and ledger data are strictly private to your account.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs bg-black/20 backdrop-blur-md px-3 py-2 rounded-xl border border-white/10">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300">Tenant ID:</span>
          <span className="font-mono text-white font-semibold">{currentUser.id}</span>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-medium flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>कंपनी प्रोफाइल सफलतापूर्वक सुरक्षित कर दी गई है! All future invoices will use these updated details.</span>
          </div>
          <span className="text-xs bg-emerald-200/60 px-2 py-0.5 rounded text-emerald-900 font-semibold">Saved</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Form Fields */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            {/* Section 1: Business Identity */}
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  1. Business &amp; Trade Identity (व्यापार की पहचान)
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Display Company Name * (दुकान / कंपनी का नाम)
                  </label>
                  <input
                    id="input-company-name"
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    placeholder="e.g. Smart Tech Solutions"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Printed prominently at the top of every bill</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Legal / Registered Entity Name
                  </label>
                  <input
                    id="input-legal-name"
                    type="text"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    placeholder="e.g. Smart Tech Solutions Pvt Ltd"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Official registered entity name for GST filing</p>
                </div>
              </div>
            </div>

            {/* Section 2: GST & Taxation */}
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <Receipt className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  2. GST &amp; Tax Registration (जीएसटी एवं टैक्स विवरण)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    GSTIN Number (15 Digits)
                  </label>
                  <input
                    id="input-gstin"
                    type="text"
                    maxLength={15}
                    value={formData.gstin}
                    onChange={(e) => handleGstinChange(e.target.value)}
                    placeholder="07AAAAA0000A1Z5"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">Auto-extracts State Code &amp; PAN</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    PAN Number (10 Digits)
                  </label>
                  <input
                    id="input-pan"
                    type="text"
                    maxLength={10}
                    value={formData.pan}
                    onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
                    placeholder="AAAAA0000A"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Invoice Series Prefix
                  </label>
                  <input
                    id="input-invoice-prefix"
                    type="text"
                    value={formData.invoicePrefix}
                    onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                    placeholder="INV-2026"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <p className="text-[11px] text-slate-400 mt-0.5">e.g. STS-2026 or INV-</p>
                </div>
              </div>
            </div>

            {/* Section 3: Location & Contact */}
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  3. Address &amp; Contact Details (पता एवं संपर्क)
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Registered Billing Address
                  </label>
                  <textarea
                    id="input-address"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Building, Shop/Office No, Street, Landmark"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                    <input
                      id="input-city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. New Delhi"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      State (राज्य)
                    </label>
                    <select
                      id="select-state"
                      value={formData.state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st.code} value={st.name}>
                          {st.name} ({st.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      State Code
                    </label>
                    <input
                      id="input-state-code"
                      type="text"
                      readOnly
                      value={formData.stateCode}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      PIN Code
                    </label>
                    <input
                      id="input-pincode"
                      type="text"
                      maxLength={6}
                      value={formData.pinCode}
                      onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                      placeholder="110020"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Business Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        id="input-mobile"
                        type="tel"
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Official Billing Email
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        id="input-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="billing@example.com"
                        className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Bank Account & Payment Credentials */}
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <CreditCard className="w-4 h-4 text-amber-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  4. Bank &amp; UPI Payment Details (बैंक एवं यूपीआई विवरण)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Bank Name
                  </label>
                  <input
                    id="input-bank-name"
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="State Bank of India / HDFC Bank"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Account Number
                  </label>
                  <input
                    id="input-account-number"
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    placeholder="38491029384"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    IFSC Code
                  </label>
                  <input
                    id="input-ifsc"
                    type="text"
                    value={formData.ifsc}
                    onChange={(e) => setFormData({ ...formData, ifsc: e.target.value.toUpperCase() })}
                    placeholder="SBIN0001234"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    UPI ID / VPA (For Direct QR Code Payment)
                  </label>
                  <input
                    id="input-upi-id"
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    placeholder="yourname@okhdfcbank"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-blue-600 font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Terms & Signatory */}
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                <FileText className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  5. Invoice Terms &amp; Signature (नियम एवं हस्ताक्षर)
                </h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Authorized Signatory Text
                  </label>
                  <input
                    id="input-signatory"
                    type="text"
                    value={formData.authorizedSignatory}
                    onChange={(e) => setFormData({ ...formData, authorizedSignatory: e.target.value })}
                    placeholder={`For ${formData.companyName || 'Company'}`}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Standard Terms &amp; Conditions (Printed on Invoices)
                  </label>
                  <textarea
                    id="input-terms"
                    rows={3}
                    value={formData.termsConditions}
                    onChange={(e) => setFormData({ ...formData, termsConditions: e.target.value })}
                    placeholder="1. Goods once sold will not be accepted back.&#10;2. Payment due within 15 days."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                id="btn-save-company-profile"
                type="submit"
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/20 flex items-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Company Profile (प्रोफाइल सुरक्षित करें)</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Col: Live Invoice Header Preview */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-amber-400">
              <Sparkles className="w-4 h-4" />
              <h4 className="text-xs font-bold uppercase tracking-wider">Live Invoice Preview</h4>
            </div>
            <p className="text-xs text-slate-300">
              Here is how your company details will look on Tax Invoices and PDF downloads:
            </p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-5 space-y-3 font-sans">
            <div className="border-b pb-3 text-center border-slate-200">
              <div className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
                TAX INVOICE / कर बीजक
              </div>
              <div className="text-base font-extrabold text-slate-900 mt-1">
                {formData.companyName || 'YOUR COMPANY NAME'}
              </div>
              {formData.legalName && formData.legalName !== formData.companyName && (
                <div className="text-xs text-slate-500 italic">({formData.legalName})</div>
              )}
              <div className="text-xs text-slate-600 mt-1">
                {formData.address || 'Address line 1'}, {formData.city || 'City'} - {formData.pinCode || 'Pin'}
              </div>
              <div className="text-xs text-slate-600">
                State: <strong className="text-slate-800">{formData.state}</strong> (Code: {formData.stateCode})
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Phone: {formData.mobile} | Email: {formData.email}
              </div>
              <div className="mt-2 inline-block px-2.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold font-mono">
                GSTIN: {formData.gstin || 'UNREGISTERED'}
              </div>
            </div>

            {/* Bank Card Preview */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                <span>Bank Details on Bill:</span>
              </div>
              <div className="text-slate-600">
                Bank: <strong className="text-slate-800">{formData.bankName}</strong>
              </div>
              <div className="text-slate-600 font-mono">
                A/C: <strong className="text-slate-800">{formData.accountNumber}</strong>
              </div>
              <div className="text-slate-600 font-mono">
                IFSC: <strong className="text-slate-800">{formData.ifsc}</strong>
              </div>
              {formData.upiId && (
                <div className="text-blue-700 font-semibold font-mono text-[11px] pt-1">
                  UPI ID: {formData.upiId}
                </div>
              )}
            </div>

            {/* Signatory Preview */}
            <div className="pt-2 text-right">
              <div className="text-[11px] font-semibold text-slate-700">
                {formData.authorizedSignatory || `For ${formData.companyName}`}
              </div>
              <div className="text-[10px] text-slate-400 mt-4">Authorized Signatory</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
