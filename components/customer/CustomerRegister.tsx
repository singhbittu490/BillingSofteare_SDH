'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface CustomerRegisterProps {
  onSuccess: (data: { customerId: number; email: string; maskedMobile: string }) => void;
  onNavigateLogin: () => void;
}

export function CustomerRegister({ onSuccess, onNavigateLogin }: CustomerRegisterProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password validation criteria
  const hasMinLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!termsAccepted) {
      setErrorMsg('Please accept the Terms & Conditions to proceed.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Password and Confirm Password do not match.');
      return;
    }

    if (!hasMinLength || !hasUpper || !hasLower || !hasNumber || !hasSpecial) {
      setErrorMsg('Password does not meet all security requirements.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email,
          mobile,
          password,
          confirmPassword,
          termsAccepted,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Registration failed.');
      }

      onSuccess({
        customerId: data.customerId,
        email: data.email,
        maskedMobile: data.maskedMobile,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Registration failed. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white text-center relative">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md mb-3 border border-white/20">
          <User className="w-6 h-6 text-blue-200" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">Create Customer Account</h2>
        <p className="text-xs sm:text-sm text-blue-100/80 mt-1 max-w-xs mx-auto">
          Sign up to access invoices, payments &amp; your verified customer portal
        </p>

        {/* Security badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full text-[11px] font-semibold text-emerald-200 mt-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Mandatory Mobile OTP Verification Active</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Full Name *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Rahul Kumar"
              className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* Email & Mobile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="rahul@example.com"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Mobile Number (10 Digits) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-500 font-mono">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="9876543210"
                className="w-full pl-12 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Password *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create strong password"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password Strength Checklist */}
          <div className="grid grid-cols-2 gap-1 mt-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
              <Check className="w-3 h-3" /> 8+ Characters
            </span>
            <span className={`flex items-center gap-1 ${hasUpper ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
              <Check className="w-3 h-3" /> Uppercase (A-Z)
            </span>
            <span className={`flex items-center gap-1 ${hasLower ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
              <Check className="w-3 h-3" /> Lowercase (a-z)
            </span>
            <span className={`flex items-center gap-1 ${hasNumber && hasSpecial ? 'text-emerald-600 font-semibold' : 'text-slate-400'}`}>
              <Check className="w-3 h-3" /> Number &amp; Special (!@#)
            </span>
          </div>
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Confirm Password *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {confirmPassword && (
            <p className={`text-[11px] mt-1 font-medium ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
              {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
            </p>
          )}
        </div>

        {/* Terms & Conditions */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              required
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-600 leading-snug">
              I agree to the{' '}
              <span className="text-blue-600 font-semibold underline">Terms &amp; Conditions</span> and{' '}
              <span className="text-blue-600 font-semibold underline">Privacy Policy</span>. I understand my mobile number will be verified via SMS.
            </span>
          </label>
        </div>

        {/* Register Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Creating Account &amp; Generating OTP...</span>
            </>
          ) : (
            <>
              <span>Register &amp; Verify Mobile</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Login Link */}
        <div className="text-center pt-2 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="text-blue-600 font-bold hover:underline"
            >
              Sign In Here
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
