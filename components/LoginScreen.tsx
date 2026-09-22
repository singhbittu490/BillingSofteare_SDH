'use client';

import React, { useState } from 'react';
import { AuthUser } from '@/lib/types';
import {
  INDIAN_STATES,
  DEFAULT_TENANT_ACCOUNTS,
  registerTenantUser,
  getRegisteredUsers,
} from '@/lib/tenant-storage';
import {
  Lock,
  Mail,
  User,
  Phone,
  Building2,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  MapPin,
  Receipt,
  Users,
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
  defaultEmail?: string;
}

export function LoginScreen({ onLogin, defaultEmail = 'singhbittu490@gmail.com' }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCompany, setRegCompany] = useState('');
  const [regState, setRegState] = useState('Delhi');
  const [regGstin, setRegGstin] = useState('');
  const [regPassword, setRegPassword] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('कृपया ईमेल और पासवर्ड दर्ज करें (Please enter email & password)');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const cleanEmail = email.trim().toLowerCase();

      // Find from registered users registry
      const registered = getRegisteredUsers();
      const existing = registered.find((u) => u.email.toLowerCase() === cleanEmail);

      let user: AuthUser;
      if (existing) {
        user = {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
          phone: existing.phone,
          lastLogin: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        };
      } else if (cleanEmail.includes('singhbittu')) {
        user = {
          id: 'usr_bittu_singh',
          name: 'Bittu Singh',
          email: cleanEmail,
          role: 'Owner',
          phone: '+91 98765 43210',
          lastLogin: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        };
      } else if (cleanEmail.includes('sharma')) {
        user = {
          id: 'usr_sharma_hardware',
          name: 'Rajesh Sharma',
          email: cleanEmail,
          role: 'Owner',
          phone: '+91 98220 54321',
          lastLogin: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        };
      } else {
        // Auto-provision tenant ID for unknown email
        const userId = 'usr_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
        user = {
          id: userId,
          name: cleanEmail.split('@')[0].toUpperCase(),
          email: cleanEmail,
          role: 'Owner',
          phone: '+91 98765 43210',
          lastLogin: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        };
      }

      if (rememberMe) {
        try {
          localStorage.setItem('smartbill_remember_user', JSON.stringify(user));
        } catch {}
      }

      onLogin(user);
    }, 400);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!regName.trim() || !regEmail.trim() || !regCompany.trim() || !regPassword.trim()) {
      setErrorMessage('कृपया नाम, कंपनी का नाम, ईमेल और पासवर्ड भरें');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      try {
        const { user } = registerTenantUser({
          name: regName.trim(),
          email: regEmail.trim(),
          companyName: regCompany.trim(),
          phone: regPhone.trim(),
          state: regState,
          gstin: regGstin.trim(),
          password: regPassword,
        });

        onLogin(user);
      } catch (err) {
        setErrorMessage('रजिस्ट्रेशन में त्रुटि: ' + String(err));
      }
    }, 450);
  };

  const handleQuickLogin = (demoUserId: string, demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('admin123');
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const registered = getRegisteredUsers();
      const existing = registered.find((u) => u.id === demoUserId || u.email.toLowerCase() === demoEmail.toLowerCase());

      const user: AuthUser = existing
        ? {
            id: existing.id,
            name: existing.name,
            email: existing.email,
            role: existing.role,
            phone: existing.phone,
            lastLogin: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          }
        : {
            id: demoUserId,
            name: demoEmail.includes('singhbittu') ? 'Bittu Singh' : 'Rajesh Sharma',
            email: demoEmail,
            role: 'Owner',
            phone: '+91 98765 43210',
            lastLogin: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          };

      try {
        localStorage.setItem('smartbill_remember_user', JSON.stringify(user));
      } catch {}
      onLogin(user);
    }, 300);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20 mb-3">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Smart<span className="text-blue-500">Bill</span> Multi-Company Cloud
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Isolated Company Profiles, GST Billing &amp; Secure Multi-Tenant ERP
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-xl p-6 sm:p-8">
          {/* Mode Switch Tabs */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl mb-6 border border-slate-700/50">
            <button
              id="tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In (लॉगिन करें)
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Company (नयी कंपनी बनाएं)
            </button>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Email Address / Username
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password
                  </label>
                  <span className="text-[11px] text-slate-500">Default: admin123</span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between py-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-400">Remember session</span>
                </label>
                <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 100% Private Isolation
                </span>
              </div>

              <button
                id="btn-submit-login"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Accessing Company Profile...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Your Company</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Multi-tenant Quick Switch Demo Profiles */}
              <div className="pt-4 mt-4 border-t border-slate-800">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center mb-2.5 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Test Multi-User Company Isolation:</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickLogin('usr_bittu_singh', 'singhbittu490@gmail.com')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white group-hover:text-blue-400">Bittu Singh</span>
                      <span className="text-[9px] px-1 rounded bg-blue-500/20 text-blue-300">Delhi</span>
                    </div>
                    <div className="text-[11px] text-blue-300 font-medium truncate mt-0.5">
                      Smart Tech Solutions
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">07AAAAA0000A1Z5</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickLogin('usr_sharma_hardware', 'sharma@hardware.in')}
                    className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left transition-all text-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white group-hover:text-emerald-400">Rajesh Sharma</span>
                      <span className="text-[9px] px-1 rounded bg-emerald-500/20 text-emerald-300">MH</span>
                    </div>
                    <div className="text-[11px] text-emerald-300 font-medium truncate mt-0.5">
                      Sharma Electricals
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">27BBBBB1111B1Z2</div>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs flex items-center gap-2">
                <Users className="w-4 h-4 flex-shrink-0 text-blue-400" />
                <span>अपनी खुद की कंपनी और स्वतंत्र बिलिंग डेटाबेस तैयार करें।</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name (आपका नाम) *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-register-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Ramesh Verma"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Company / Store Name (आपकी कंपनी या दुकान का नाम) *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-register-company"
                    type="text"
                    required
                    value={regCompany}
                    onChange={(e) => setRegCompany(e.target.value)}
                    placeholder="e.g. Verma Electronics &amp; Mobiles"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    State (राज्य) *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <select
                      id="select-register-state"
                      value={regState}
                      onChange={(e) => setRegState(e.target.value)}
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st.code} value={st.name} className="bg-slate-900 text-white">
                          {st.name} ({st.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    GSTIN (Optional)
                  </label>
                  <div className="relative">
                    <Receipt className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-register-gstin"
                      type="text"
                      maxLength={15}
                      value={regGstin}
                      onChange={(e) => setRegGstin(e.target.value.toUpperCase())}
                      placeholder="e.g. 07AAAAA0000A1Z5"
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-register-email"
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="ramesh@verma.in"
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="input-register-phone"
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Create Password (पासवर्ड) *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-register-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Choose a password"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="btn-submit-register"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Isolated Company...</span>
                  </>
                ) : (
                  <>
                    <span>Create Company &amp; Start Billing</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-slate-400">
          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
            <span className="text-white font-medium block">Zero Leakage</span>
            100% Isolated Data
          </div>
          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
            <span className="text-white font-medium block">Custom GSTIN</span>
            Your Name on Bills
          </div>
          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
            <span className="text-white font-medium block">Multi-Tenant</span>
            Unlimited Companies
          </div>
        </div>
      </div>
    </div>
  );
}
