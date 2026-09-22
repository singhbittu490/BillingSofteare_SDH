'use client';

import React, { useState } from 'react';
import { Customer } from '@/lib/types';
import { indianStates } from '@/lib/initial-data';
import { X, UserPlus } from 'lucide-react';
import { generateUniqueId } from '@/lib/utils';

interface AddCustomerModalProps {
  onClose: () => void;
  onSave: (customer: Customer) => void;
}

export function AddCustomerModal({ onClose, onSave }: AddCustomerModalProps) {
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [state, setState] = useState('Maharashtra');
  const [customerType, setCustomerType] = useState<Customer['customerType']>('Registered');

  const selectedStateObj = indianStates.find((s) => s.name === state) || indianStates.find((s) => s.name === 'Maharashtra')!;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newCust: Customer = {
      id: generateUniqueId(),
      name: name.trim(),
      businessName: businessName.trim() || undefined,
      mobile: mobile.trim() || '9876543210',
      email: email.trim() || undefined,
      billingAddress: billingAddress.trim() || `${state}, India`,
      gstin: gstin.trim().toUpperCase() || undefined,
      pan: gstin.length >= 10 ? gstin.substring(2, 12) : undefined,
      state: selectedStateObj.name,
      stateCode: selectedStateObj.code,
      customerType,
      outstandingBalance: 0,
    };

    onSave(newCust);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold text-base">Add New Customer</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Contact Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Ramesh Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Business / Trade Name</label>
              <input
                type="text"
                placeholder="e.g. Kumar Trading Co."
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                placeholder="10-digit mobile"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Email Address</label>
              <input
                type="email"
                placeholder="customer@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">GSTIN Number</label>
              <input
                type="text"
                maxLength={15}
                placeholder="e.g. 27AADCA1234A1Z1"
                value={gstin}
                onChange={(e) => {
                  const val = e.target.value.toUpperCase();
                  setGstin(val);
                  if (val.length >= 2) {
                    const prefix = val.substring(0, 2);
                    const match = indianStates.find((s) => s.code === prefix);
                    if (match) setState(match.name);
                  }
                }}
                className="w-full border border-slate-300 rounded p-2 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Customer GST Type</label>
              <select
                value={customerType}
                onChange={(e) => setCustomerType(e.target.value as any)}
                className="w-full border border-slate-300 rounded p-2 bg-white"
              >
                <option value="Registered">Registered (Regular Taxpayer)</option>
                <option value="Unregistered">Unregistered Business</option>
                <option value="Composition">Composition Dealer</option>
                <option value="Consumer">Consumer / End User (B2C)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">State & State Code</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full border border-slate-300 rounded p-2 bg-white font-medium"
            >
              {indianStates.map((st) => (
                <option key={st.code} value={st.name}>
                  {st.name} (Code: {st.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Billing & Shipping Address</label>
            <textarea
              rows={2}
              placeholder="Shop / Office address with pincode"
              value={billingAddress}
              onChange={(e) => setBillingAddress(e.target.value)}
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
              Save Customer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
