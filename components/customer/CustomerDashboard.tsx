'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  Phone,
  Mail,
  Calendar,
  Clock,
  KeyRound,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  History,
  FileText,
  CreditCard,
  Building2,
  Sparkles,
  Lock,
} from 'lucide-react';

interface CustomerDashboardProps {
  initialCustomer?: any;
  onLogout: () => void;
}

export function CustomerDashboard({ initialCustomer, onLogout }: CustomerDashboardProps) {
  const [customer, setCustomer] = useState<any>(initialCustomer || null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(!initialCustomer);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 2FA Toggle state
  const [isToggling2Fa, setIsToggling2Fa] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);

  // Change Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Load customer profile from server session
  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/customer/profile');
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to load profile.');
      }

      setCustomer(data.customer);
      setAuditLogs(data.auditLogs || []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unauthorized access. Please login.');
      // If unauthorized, redirect to login after short delay
      setTimeout(() => onLogout(), 2000);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleToggle2Fa = async () => {
    setIsToggling2Fa(true);
    setStatusFeedback(null);
    try {
      const res = await fetch('/api/customer/toggle-2fa', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update 2FA.');
      }
      setCustomer((prev: any) => ({ ...prev, twoFactorEnabled: data.twoFactorEnabled }));
      setStatusFeedback(data.message);
      loadProfile(); // refresh audit logs
    } catch (err: any) {
      setStatusFeedback(`Error: ${err.message}`);
    } finally {
      setIsToggling2Fa(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: 'error', msg: 'New password and confirm password do not match.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordFeedback({ type: 'error', msg: 'New password must be at least 8 characters.' });
      return;
    }

    setIsSavingPassword(true);
    try {
      const res = await fetch('/api/customer/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to change password.');
      }

      setPasswordFeedback({ type: 'success', msg: 'Password updated successfully!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setShowPasswordModal(false), 1500);
      loadProfile();
    } catch (err: any) {
      setPasswordFeedback({ type: 'error', msg: err.message || 'Failed to change password.' });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    onLogout();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto my-8">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-sm font-semibold text-slate-700">Verifying session &amp; loading customer dashboard...</p>
      </div>
    );
  }

  if (errorMsg && !customer) {
    return (
      <div className="p-8 max-w-md mx-auto bg-white rounded-2xl border border-rose-200 text-center shadow-lg my-8 space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
        <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
        <button
          onClick={onLogout}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
        >
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Welcome Header Bar */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-xs font-bold text-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Mobile Verified
              </span>
              <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-xs font-bold text-blue-200">
                Status: {customer?.accountStatus || 'ACTIVE'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white pt-1">
              Welcome, {customer?.fullName}
            </h1>
            <p className="text-xs sm:text-sm text-blue-100/90 flex items-center gap-2">
              <span>Customer Portal ID:</span>
              <span className="font-mono font-bold text-white bg-white/10 px-2 py-0.5 rounded border border-white/20">
                {customer?.customerCode}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white transition-all flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Change Password</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-xs font-bold text-rose-200 transition-all flex items-center gap-1.5 backdrop-blur-sm cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {statusFeedback && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-medium flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
          <span>{statusFeedback}</span>
        </div>
      )}

      {/* Main Grid: Profile & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Customer Profile Details</h3>
                <p className="text-xs text-slate-500">Verified personal and authentication credentials</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Fully Verified
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Customer Code
              </span>
              <span className="font-mono font-black text-sm text-slate-900 tracking-wider">
                {customer?.customerCode}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Full Name
              </span>
              <span className="font-bold text-sm text-slate-900">{customer?.fullName}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Email Address
              </span>
              <span className="text-xs font-medium text-slate-900 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {customer?.email}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Registered Mobile Number
              </span>
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5 font-mono">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                +91 {customer?.maskedMobile}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Account Status
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-100 text-emerald-800">
                ● {customer?.accountStatus}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Member Since
              </span>
              <span className="text-xs text-slate-700 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString('en-IN') : 'N/A'}
              </span>
            </div>
          </div>

          {/* Quick Invoice / Services Shortcuts */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Customer Services &amp; Invoices
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 hover:border-blue-300 transition-colors">
                <FileText className="w-5 h-5 text-blue-600 mb-1" />
                <div className="text-xs font-bold text-slate-800">GST Invoices</div>
                <div className="text-[11px] text-slate-500">View &amp; download billed invoices</div>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100 hover:border-emerald-300 transition-colors">
                <CreditCard className="w-5 h-5 text-emerald-600 mb-1" />
                <div className="text-xs font-bold text-slate-800">Ledger &amp; Payments</div>
                <div className="text-[11px] text-slate-500">Track balance &amp; receipts</div>
              </div>
              <div className="p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 hover:border-indigo-300 transition-colors">
                <Building2 className="w-5 h-5 text-indigo-600 mb-1" />
                <div className="text-xs font-bold text-slate-800">Company Orders</div>
                <div className="text-[11px] text-slate-500">Direct order dispatch tracking</div>
              </div>
            </div>
          </div>
        </div>

        {/* Security & 2FA Card (1 col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Security Center</h3>
                <p className="text-[11px] text-slate-500">Mobile 2FA &amp; Session Protection</p>
              </div>
            </div>

            {/* 2FA Toggle Block */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-900">Mobile OTP 2FA on Login</div>
                  <div className="text-[11px] text-slate-500 leading-tight mt-0.5">
                    Requires a 6-digit SMS OTP every time you log in
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isToggling2Fa}
                  onClick={handleToggle2Fa}
                  className="cursor-pointer text-slate-700 hover:text-blue-600 transition-colors disabled:opacity-50"
                >
                  {customer?.twoFactorEnabled ? (
                    <ToggleRight className="w-9 h-9 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-9 h-9 text-slate-400" />
                  )}
                </button>
              </div>
              <div className="text-[11px] font-semibold">
                Status:{' '}
                <span className={customer?.twoFactorEnabled ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                  {customer?.twoFactorEnabled ? 'ENABLED (High Security)' : 'DISABLED'}
                </span>
              </div>
            </div>

            {/* Change Password Trigger */}
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Update Password</span>
            </button>
          </div>

          {/* Recent Security Activity Log */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <History className="w-4 h-4 text-slate-500" />
                <span>Security Activity Log</span>
              </div>
              <span className="text-[10px] text-slate-400">Last 10 events</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {auditLogs.length === 0 ? (
                <p className="text-[11px] text-slate-400 text-center py-3">No activity recorded yet.</p>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] space-y-0.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 font-mono text-[10px]">{log.action}</span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {log.details && <p className="text-slate-500 text-[10px] line-clamp-1">{log.details}</p>}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleUp">
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Lock className="w-4 h-4 text-blue-400" />
                <span>Change Your Password</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-3.5">
              {passwordFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    passwordFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{passwordFeedback.msg}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password (8+ Chars) *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm New Password *</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPassword}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingPassword ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
