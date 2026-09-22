'use client';

import React, { useState } from 'react';
import { AuthUser } from '@/lib/types';
import {
  INDIAN_STATES,
  registerTenantUser,
  getRegisteredUsers,
  generateUniqueLicenseNo,
  isLicenseNoUnique,
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
  MapPin,
  Receipt,
  Users,
  KeyRound,
  Sparkles,
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
  defaultEmail?: string;
}

export function LoginScreen({ onLogin, defaultEmail = '' }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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
  const [regLicenseNo, setRegLicenseNo] = useState('');

  const handleGenerateLicenseKey = () => {
    const key = generateUniqueLicenseNo();
    setRegLicenseNo(key);
    setErrorMessage('');
  };

  const isLicenseFilled = Boolean(regLicenseNo.trim());
  const isLicenseValidAndUnique = isLicenseFilled && isLicenseNoUnique(regLicenseNo.trim());

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('कृपया यूजर आईडी/ईमेल और पासवर्ड दर्ज करें (Please enter User ID/Email & Password)');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const cleanEmail = email.trim().toLowerCase();

      // Find from registered users registry by email, ID, or license number
      const registered = getRegisteredUsers();
      const existing = registered.find(
        (u) =>
          u.email.toLowerCase() === cleanEmail ||
          u.id.toLowerCase() === cleanEmail ||
          (u.licenseNo && u.licenseNo.toLowerCase() === cleanEmail)
      );

      let user: AuthUser;
      if (existing) {
        user = {
          id: existing.id,
          name: existing.name,
          email: existing.email,
          role: existing.role,
          phone: existing.phone,
          lastLogin: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          licenseNo: existing.licenseNo,
        };
      } else if (cleanEmail.includes('singhbittu') || cleanEmail.includes('bittu')) {
        user = {
          id: 'usr_bittu_singh',
          name: 'Bittu Singh',
          email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@smarttech.in`,
          role: 'Owner',
          phone: '+91 98765 43210',
          lastLogin: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          licenseNo: 'SBS-LIC-2026-9876',
        };
      } else if (cleanEmail.includes('sharma')) {
        user = {
          id: 'usr_sharma_hardware',
          name: 'Rajesh Sharma',
          email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@hardware.in`,
          role: 'Owner',
          phone: '+91 98220 54321',
          lastLogin: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          licenseNo: 'SBS-LIC-2026-5432',
        };
      } else {
        // Auto-provision tenant ID for any new user id / email
        const userId = 'usr_' + cleanEmail.replace(/[^a-z0-9]/g, '_');
        const displayName = cleanEmail.includes('@') ? cleanEmail.split('@')[0] : cleanEmail;
        user = {
          id: userId,
          name: displayName.toUpperCase(),
          email: cleanEmail.includes('@') ? cleanEmail : `${cleanEmail}@company.in`,
          role: 'Owner',
          phone: '+91 98765 43210',
          lastLogin: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
          licenseNo: `SBS-LIC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        };
      }

      if (rememberMe) {
        try {
          localStorage.setItem('smartbill_remember_user', JSON.stringify(user));
        } catch {}
      }

      onLogin(user);
    }, 350);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Strict validation: Licence No is mandatory before profile can be created
    if (!regLicenseNo.trim()) {
      setErrorMessage('कृपया यूनिक लाइसेंस नंबर दर्ज करें! बिना लाइसेंस नंबर के प्रोफाइल नहीं बन सकती (License Number is strictly required to create a profile)');
      return;
    }

    // Strict validation: Licence No must be unique for every customer
    if (!isLicenseNoUnique(regLicenseNo.trim())) {
      setErrorMessage(`लाइसेंस नंबर [${regLicenseNo.trim()}] पहले से किसी अन्य ग्राहक द्वारा पंजीकृत है! प्रत्येक ग्राहक के लिए यूनिक लाइसेंस नंबर होना अनिवार्य है (License Number must be unique for each customer)`);
      return;
    }

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
          licenseNo: regLicenseNo.trim(),
        });

        if (rememberMe) {
          try {
            localStorage.setItem('smartbill_remember_user', JSON.stringify(user));
          } catch {}
        }

        onLogin(user);
      } catch (err) {
        setErrorMessage('रजिस्ट्रेशन में त्रुटि: ' + String(err));
      }
    }, 450);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-lg relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white shadow-xl shadow-blue-500/20 mb-3">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            SmartBill<span className="text-blue-400">Solution</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Enterprise Multi-Company ERP &bull; GST Billing &amp; Invoicing Cloud
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
                  User ID / Email / Licence No (यूजर आईडी, ईमेल या लाइसेंस नंबर)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-login-email"
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="User ID, Email or Licence No (e.g. SBS-LIC-...)"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-slate-300">
                    Password (पासवर्ड)
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-login-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter Password (पासवर्ड दर्ज करें)"
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                    title={showPassword ? 'Hide password' : 'Show password'}
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
                    <span>Signing in to SmartBillSolution...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to SmartBillSolution</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* SmartBillSolution Official Branding Section */}
              <div className="pt-5 mt-4 border-t border-slate-800 text-center">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 shadow-sm">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="font-extrabold text-sm tracking-wide text-white">SmartBillSolution</span>
                  <span className="text-[10px] text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full font-semibold">
                    Cloud ERP
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2.5 font-medium">
                  SmartBillSolution &bull; GST Billing, Invoices, Stock &amp; Inventory Management
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5 mt-2 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> 100% Isolated Data
                  </span>
                  <span>&bull;</span>
                  <span className="flex items-center gap-1 text-cyan-300">
                    <KeyRound className="w-3 h-3 text-amber-400" /> Unique Licence Per Customer
                  </span>
                  <span>&bull;</span>
                  <span>GST Ready</span>
                </div>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div className="p-2.5 rounded-xl bg-blue-950/60 border border-blue-800/40 text-blue-300 text-xs flex items-center gap-2">
                <Users className="w-4 h-4 flex-shrink-0 text-blue-400" />
                <span>अपनी खुद की कंपनी और स्वतंत्र बिलिंग डेटाबेस तैयार करें।</span>
              </div>

              {/* License Number Mandatory Field for Profile Creation */}
              <div className="p-3 rounded-xl bg-slate-950/90 border-2 border-blue-600/60 shadow-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Software Licence No (लाइसेंस नंबर) *</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateLicenseKey}
                    className="text-[11px] text-cyan-300 hover:text-cyan-100 bg-blue-950 hover:bg-blue-900 border border-blue-700/70 px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition-all shadow-sm active:scale-95"
                    title="Generate a guaranteed unique customer license key"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>⚡ Generate Unique Key</span>
                  </button>
                </div>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    id="input-register-license-no"
                    type="text"
                    required
                    value={regLicenseNo}
                    onChange={(e) => setRegLicenseNo(e.target.value.toUpperCase())}
                    placeholder="e.g. SBS-LIC-8492-3104 (लाइसेंस नंबर दर्ज करें)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-24 py-2 text-sm text-white font-mono uppercase placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-wider"
                  />
                  <div className="absolute right-2 top-2">
                    {isLicenseFilled && isLicenseValidAndUnique && (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Unique
                      </span>
                    )}
                    {isLicenseFilled && !isLicenseValidAndUnique && (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded font-bold">
                        Already in Use
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-0.5">
                  <span className="text-slate-400">
                    यूनिक लाइसेंस नंबर मिलने पर ही प्रोफाइल बनेगी
                  </span>
                  {!isLicenseFilled ? (
                    <span className="text-amber-400 font-semibold">* अनिवार्य (Required)</span>
                  ) : isLicenseValidAndUnique ? (
                    <span className="text-emerald-400 font-semibold">✓ मान्य व यूनिक</span>
                  ) : (
                    <span className="text-rose-400 font-semibold">✗ अन्य ग्राहक का है</span>
                  )}
                </div>
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
                    User ID / Email Address *
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
                    title={showPassword ? 'Hide password' : 'Show password'}
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
            <span className="text-white font-medium block">SmartBillSolution</span>
            100% Isolated Data
          </div>
          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
            <span className="text-white font-medium block">Custom GSTIN</span>
            Your Name on Bills
          </div>
          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
            <span className="text-white font-medium block">Multi-Company</span>
            Unlimited Accounts
          </div>
        </div>
      </div>
    </div>
  );
}
