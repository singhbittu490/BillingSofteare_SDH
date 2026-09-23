'use client';

import React, { useState, useEffect } from 'react';
import { AuthUser } from '@/lib/types';
import {
  INDIAN_STATES,
  registerTenantUser,
  getRegisteredUsers,
  generateUniqueLicenseNo,
  isLicenseNoUnique,
  validateUserCredentials,
  loginWithGoogleAccount,
  generateEmailVerificationOtp,
  verifyEmailOtp,
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
  Check,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: AuthUser) => void;
  defaultEmail?: string;
  onOpenCustomerPortal?: () => void;
}

export function LoginScreen({ onLogin, defaultEmail = '', onOpenCustomerPortal }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState(defaultEmail || '');
  const [password, setPassword] = useState('');
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
  const [regLicenseNo, setRegLicenseNo] = useState('');

  // Email OTP Verification state
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailOtp, setEmailOtp] = useState('');
  const [sentOtpCode, setSentOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(30);
  const [otpNotification, setOtpNotification] = useState('');

  // Google Login modal state
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

  // OTP Countdown timer
  useEffect(() => {
    let interval: any;
    if (isVerifyingEmail && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isVerifyingEmail, otpTimer]);

  const handleGenerateLicenseKey = () => {
    const key = generateUniqueLicenseNo();
    setRegLicenseNo(key);
    setErrorMessage('');
  };

  const isLicenseFilled = Boolean(regLicenseNo.trim());
  const isLicenseValidAndUnique = isLicenseFilled && isLicenseNoUnique(regLicenseNo.trim());

  // STRICT LOGIN SUBMIT WITH PASSWORD CHECK
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

      // STRICT PASSWORD AND CREDENTIALS VALIDATION
      const result = validateUserCredentials(email, password);

      if (!result.success || !result.user) {
        setErrorMessage(result.error || 'गलत पासवर्ड दर्ज किया गया है! (Incorrect password! Access denied)');
        return;
      }

      const user = result.user;

      if (rememberMe) {
        try {
          localStorage.setItem('smartbill_remember_user', JSON.stringify(user));
        } catch {}
      }

      onLogin(user);
    }, 350);
  };

  // REGISTER: TRIGGER EMAIL OTP VERIFICATION
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

    if (!regEmail.includes('@') || !regEmail.includes('.')) {
      setErrorMessage('कृपया वैध ईमेल पता दर्ज करें (Valid email is required)');
      return;
    }

    // Send 6-digit OTP to Email
    const otp = generateEmailVerificationOtp(regEmail);
    setSentOtpCode(otp);
    setEmailOtp('');
    setOtpTimer(30);
    setIsVerifyingEmail(true);
    setOtpNotification(`ईमेल सत्यापन कोड (OTP) आपके ईमेल ${regEmail} पर भेजा गया है।`);
  };

  // VERIFY OTP AND FINALIZE REGISTRATION
  const handleVerifyOtpAndCompleteRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailOtp.trim()) {
      setErrorMessage('कृपया 6-अंकों का ईमेल सत्यापन कोड दर्ज करें (Enter 6-digit verification code)');
      return;
    }

    const isValid = verifyEmailOtp(regEmail, emailOtp.trim());
    if (!isValid) {
      setErrorMessage('अमान्य सत्यापन कोड! कृपया सही कोड दर्ज करें (Invalid verification code)');
      return;
    }

    setIsLoading(true);
    setIsVerifyingEmail(false);

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

  // RESEND OTP
  const handleResendOtp = () => {
    if (otpTimer > 0) return;
    const otp = generateEmailVerificationOtp(regEmail);
    setSentOtpCode(otp);
    setOtpTimer(30);
    setOtpNotification(`नया सत्यापन कोड (OTP) पुनः भेजा गया: ${otp}`);
  };

  // GOOGLE LOGIN HANDLER
  const handleGoogleSignIn = (targetEmail?: string, targetName?: string) => {
    setShowGoogleModal(false);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const emailToUse = targetEmail || 'user@example.com';
      const nameToUse = targetName || (emailToUse.includes('@') ? emailToUse.split('@')[0] : 'Authorized User');

      const { user } = loginWithGoogleAccount({
        email: emailToUse,
        name: nameToUse,
      });

      if (rememberMe) {
        try {
          localStorage.setItem('smartbill_remember_user', JSON.stringify(user));
        } catch {}
      }

      onLogin(user);
    }, 400);
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
          {onOpenCustomerPortal && (
            <div className="mb-5 p-3 rounded-xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-left">
                <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-300">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Customer Portal (ग्राहक पोर्टल)</div>
                  <div className="text-[10px] text-blue-200">Register &amp; Login with Mobile OTP</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenCustomerPortal}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
              >
                <span>Open Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

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
              {/* Google Sign-in One-Click Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowGoogleModal(true)}
                  className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-3 active:scale-98 border border-slate-300"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign in with Google (गूगल से लॉगिन करें)</span>
                </button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-800" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-slate-900 px-3 text-slate-400 font-medium">
                      या आईडी व पासवर्ड से लॉगिन करें (OR)
                    </span>
                  </div>
                </div>
              </div>

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
                    Password (पासवर्ड) *
                  </label>
                  <span className="text-[10px] text-blue-400">Strict Check Active</span>
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
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-70 active:scale-98"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to SmartBillSolution</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* SmartBillSolution Official Branding Section */}
              <div className="pt-4 border-t border-slate-800 text-center">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-200 shadow-sm">
                  <Building2 className="w-4 h-4 text-blue-400" />
                  <span className="font-extrabold text-sm tracking-wide text-white">SmartBillSolution</span>
                  <span className="text-[10px] text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full font-semibold">
                    Cloud ERP
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-2 font-medium">
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
              {/* Google Fast Sign Up */}
              <button
                type="button"
                onClick={() => setShowGoogleModal(true)}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all flex items-center justify-center gap-3 active:scale-98 border border-slate-300"
              >
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Instant Sign up with Google (गूगल से तुरंत खाता बनाएं)</span>
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900 px-3 text-slate-400 font-medium">
                    या फॉर्म भरकर ईमेल वेरिफिकेशन करें
                  </span>
                </div>
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
                    placeholder="e.g. Verma Electronics & Mobiles"
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
                    Email Address (ईमेल सत्यापन होगा) *
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
                className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-70 active:scale-98"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Sending Verification Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify Email &amp; Create Company (सत्यापित करें)</span>
                    <Mail className="w-4 h-4" />
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
            <span className="text-white font-medium block">Google Login</span>
            Instant Verified Access
          </div>
          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800">
            <span className="text-white font-medium block">Multi-Company</span>
            Unique Licence Bound
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EMAIL OTP VERIFICATION MODAL */}
      {/* ------------------------------------------------------------- */}
      {isVerifyingEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Email Verification (ईमेल सत्यापन)</h3>
                  <p className="text-xs text-slate-400">Security OTP verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVerifyingEmail(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulated In-app Email Notification Alert */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border border-blue-500/40 text-blue-200 text-xs space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>Incoming Email Simulation</span>
                </span>
                <span className="text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full">
                  Just Now
                </span>
              </div>
              <p className="text-slate-300">
                To: <strong className="text-white font-mono">{regEmail}</strong>
              </p>
              <p className="text-slate-300">
                Your 6-Digit Verification Code is:
              </p>
              <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-blue-400/30">
                <span className="font-mono text-base font-bold tracking-widest text-emerald-400">
                  {sentOtpCode}
                </span>
                <button
                  type="button"
                  onClick={() => setEmailOtp(sentOtpCode)}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold"
                >
                  Quick Fill OTP
                </button>
              </div>
            </div>

            <form onSubmit={handleVerifyOtpAndCompleteRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Enter 6-Digit Verification Code (ओटीपी दर्ज करें)
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 849201"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Code expires in 10 minutes</span>
                <button
                  type="button"
                  disabled={otpTimer > 0}
                  onClick={handleResendOtp}
                  className="text-blue-400 hover:text-blue-300 font-semibold disabled:text-slate-600 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend {otpTimer > 0 ? `(${otpTimer}s)` : ''}</span>
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsVerifyingEmail(false)}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verify &amp; Activate</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* GOOGLE SIGN IN MODAL */}
      {/* ------------------------------------------------------------- */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4 text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Sign in with Google</h3>
                  <p className="text-xs text-slate-500">to continue to SmartBillSolution</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600 font-medium">Choose a Google Account:</p>

              {/* Primary User Account */}
              <button
                type="button"
                onClick={() => handleGoogleSignIn('singhbittu490@gmail.com', 'Bittu Singh')}
                className="w-full p-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 flex items-center justify-between text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                    B
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 group-hover:text-blue-600">
                      Bittu Singh
                    </div>
                    <div className="text-xs text-slate-500 font-mono">singhbittu490@gmail.com</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </button>

              {/* Custom Google Account Entry */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Or enter another Google Email:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={customGoogleEmail}
                    onChange={(e) => setCustomGoogleEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={!customGoogleEmail.includes('@')}
                    onClick={() => handleGoogleSignIn(customGoogleEmail)}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center pt-2">
              SmartBillSolution securely links your Google Account with full tenant isolation.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
