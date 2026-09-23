'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle2,
  Clock,
  RotateCcw,
  Radio,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

export function AdminCustomerPanel() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [smsLogs, setSmsLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchCustomers = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set('q', searchQuery);
      if (statusFilter && statusFilter !== 'ALL') queryParams.set('status', statusFilter);

      const res = await fetch(`/api/admin/customers?${queryParams.toString()}`);
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Failed to fetch customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSmsLogs = async () => {
    try {
      const res = await fetch('/api/admin/sms-logs');
      const data = await res.json();
      if (data.success) {
        setSmsLogs(data.dispatches || []);
      }
    } catch {}
  };

  useEffect(() => {
    fetchCustomers();
    fetchSmsLogs();
  }, [searchQuery, statusFilter]);

  const handleUpdateStatus = async (customerId: number, newStatus: string) => {
    setActionFeedback(null);
    try {
      const res = await fetch('/api/admin/customer-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setActionFeedback(data.message);
      fetchCustomers();
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  const handleResendVerification = async (customerId: number) => {
    setActionFeedback(null);
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId, purpose: 'REGISTRATION' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setActionFeedback(`Verification OTP resent successfully to customer.`);
      fetchSmsLogs();
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-black rounded uppercase tracking-wider">
              Admin Governance
            </span>
            <span className="text-xs text-slate-500 font-medium">Database Management</span>
          </div>
          <h2 className="text-xl font-black text-slate-900">Registered Customer Management</h2>
          <p className="text-xs text-slate-500">
            Control customer activation status, verify mobile records, and monitor authentication audit events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchCustomers();
              fetchSmsLogs();
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by code, name, email, mobile..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          {['ALL', 'ACTIVE', 'PENDING_VERIFICATION', 'BLOCKED', 'SUSPENDED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Customer List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-black tracking-wider text-[11px]">
                <th className="py-3 px-4">Customer Code</th>
                <th className="py-3 px-4">Customer Name &amp; Email</th>
                <th className="py-3 px-4">Mobile &amp; Verification</th>
                <th className="py-3 px-4">Account Status</th>
                <th className="py-3 px-4">2FA Active</th>
                <th className="py-3 px-4">Registered On</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-medium">
                    Loading customer records from database...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No customers found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                      {c.customerCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.fullName}</div>
                      <div className="text-[11px] text-slate-500">{c.email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-mono text-slate-800 font-bold">+91 {c.mobile}</div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {c.mobileVerified ? (
                          <span className="text-emerald-600 font-bold text-[10px] flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Mobile Verified
                          </span>
                        ) : (
                          <span className="text-amber-600 font-bold text-[10px] flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> Unverified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                          c.accountStatus === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.accountStatus === 'PENDING_VERIFICATION'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        ● {c.accountStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.twoFactorEnabled ? (
                        <span className="text-emerald-700 font-bold text-[11px]">Enabled</span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Disabled</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {new Date(c.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {!c.mobileVerified && (
                          <button
                            type="button"
                            onClick={() => handleResendVerification(c.id)}
                            title="Resend Verification OTP"
                            className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Resend OTP
                          </button>
                        )}

                        {c.accountStatus !== 'ACTIVE' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(c.id, 'ACTIVE')}
                            className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Activate
                          </button>
                        )}

                        {c.accountStatus !== 'SUSPENDED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(c.id, 'SUSPENDED')}
                            className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Suspend
                          </button>
                        )}

                        {c.accountStatus !== 'BLOCKED' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(c.id, 'BLOCKED')}
                            className="px-2 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-bold transition-colors cursor-pointer"
                          >
                            Block
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SMS Gateway Dispatch Monitor */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <h3 className="text-sm font-bold tracking-tight">Real-Time SMS Gateway Dispatch Inspector</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            Provider: {process.env.SMS_PROVIDER || 'DEVELOPMENT / SIMULATED'}
          </span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {smsLogs.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">
              No SMS dispatches recorded yet in this session.
            </p>
          ) : (
            smsLogs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-blue-400">+91 {log.mobile}</span>
                    <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded text-[10px] font-bold uppercase">
                      {log.purpose}
                    </span>
                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold uppercase">
                      {log.status}
                    </span>
                  </div>
                  <p className="text-slate-300 font-mono text-[11px] line-clamp-1">{log.message}</p>
                </div>
                <div className="text-right shrink-0">
                  {log.otp && (
                    <div className="font-mono text-emerald-400 font-black text-sm">
                      OTP: {log.otp}
                    </div>
                  )}
                  <span className="text-slate-500 text-[10px]">
                    {new Date(log.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
