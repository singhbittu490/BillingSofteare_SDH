'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Phone,
  Clock,
  RotateCcw,
  CheckCircle2,
  Radio,
} from 'lucide-react';

interface CustomerLoginProps {
  onLoginSuccess: (customer: any) => void;
  onNavigateRegister: () => void;
  onNavigateForgot: () => void;
  onNeedsVerification: (data: { customerId: number; maskedMobile: string; email: string }) => void;
}

export function CustomerLogin({
  onLoginSuccess,
  onNavigateRegister,
  onNavigateForgot,
  onNeedsVerification,
}: CustomerLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 2FA Login OTP state
  const [is2FaActive, setIs2FaActive] = useState(false);
  const [twoFaCustomerId, setTwoFaCustomerId] = useState<number | null>(null);
  const [twoFaMaskedMobile, setTwoFaMaskedMobile] = useState('');
  const [twoFaOtpDigits, setTwoFaOtpDigits] = useState(['', '', '', '', '', '']);
  const [twoFaCooldown, setTwoFaCooldown] = useState(60);
  const [is2FaVerifying, setIs2FaVerifying] = useState(false);
  const [twoFaSmsAlert, setTwoFaSmsAlert] = useState<string | null>(null);

  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer for 2FA cooldown
  useEffect(() => {
    if (!is2FaActive) return;
    const timer = setInterval(() => {
      setTwoFaCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [is2FaActive]);

  // Fetch recent SMS dispatch for 2FA test convenience
  const fetch2FaSms = async () => {
    try {
      const res = await fetch('/api/admin/sms-logs');
      const data = await res.json();
      if (data.success && data.dispatches && data.dispatches.length > 0) {
        const loginSms = data.dispatches.find((d: any) => d.purpose === 'LOGIN');
        if (loginSms) {
          setTwoFaSmsAlert(loginSms.otp);
        }
      }
    } catch {}
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        // Check if mobile verification is mandatory and incomplete
        if (data.requiresMobileVerification) {
          onNeedsVerification({
            customerId: data.customerId,
            maskedMobile: data.maskedMobile,
            email: email.trim().toLowerCase(),
          });
          return;
        }

        throw new Error(data.error || 'Login failed.');
      }

      // Check if 2FA OTP is required for this customer
      if (data.requiresLoginOtp) {
        setIs2FaActive(true);
        setTwoFaCustomerId(data.customerId);
        setTwoFaMaskedMobile(data.maskedMobile);
        setTwoFaCooldown(60);
        setTimeout(() => {
          fetch2FaSms();
          otpRefs.current[0]?.focus();
        }, 300);
        return;
      }

      // Direct successful login
      onLoginSuccess(data.customer);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FaOtpChange = (index: number, val: string) => {
    const cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      const parts = cleaned.slice(0, 6).split('');
      const newDigits = [...twoFaOtpDigits];
      parts.forEach((p, idx) => {
        newDigits[idx] = p;
      });
      setTwoFaOtpDigits(newDigits);
      const next = Math.min(parts.length, 5);
      otpRefs.current[next]?.focus();
      return;
    }

    const newDigits = [...twoFaOtpDigits];
    newDigits[index] = cleaned;
    setTwoFaOtpDigits(newDigits);

    if (cleaned && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify2Fa = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const fullOtp = twoFaOtpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the login verification code.');
      return;
    }

    setIs2FaVerifying(true);

    try {
      const res = await fetch('/api/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: twoFaCustomerId,
          otp: fullOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || '2FA verification failed.');
      }

      onLoginSuccess(data.customer);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid 2FA code.');
    } finally {
      setIs2FaVerifying(false);
    }
  };

  const handleResend2Fa = async () => {
    if (twoFaCooldown > 0 || !twoFaCustomerId) return;
    setErrorMsg(null);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: twoFaCustomerId,
          purpose: 'LOGIN',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend code.');
      }

      setTwoFaCooldown(60);
      setTwoFaOtpDigits(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
      fetch2FaSms();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend 2FA code.');
    }
  };

  // 2FA Screen
  if (is2FaActive) {
    return (
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fadeIn">
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md mb-3 border border-white/20">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">Two-Factor Authentication</h2>
          <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
            Login security code dispatched to <span className="font-mono font-bold text-white">{twoFaMaskedMobile}</span>
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="flex-1 font-medium">{errorMsg}</div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
              Enter 6-Digit Login Code
            </label>
            <div className="flex justify-center gap-2">
              {twoFaOtpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handle2FaOtpChange(idx, e.target.value)}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-black rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 text-slate-900"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 px-1">
            <span className="text-slate-500 font-medium">Extra security active</span>
            <button
              type="button"
              disabled={twoFaCooldown > 0}
              onClick={handleResend2Fa}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold disabled:text-slate-400 disabled:cursor-not-allowed"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{twoFaCooldown > 0 ? `Resend in ${twoFaCooldown}s` : 'Resend Code'}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleVerify2Fa()}
            disabled={is2FaVerifying || twoFaOtpDigits.join('').length !== 6}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
          >
            {is2FaVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying Security Code...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify &amp; Enter Dashboard</span>
              </>
            )}
          </button>

          {twoFaSmsAlert && (
            <div className="p-3 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 text-xs flex justify-between items-center">
              <span className="text-slate-400 font-mono text-[11px]">
                Testing OTP: <strong className="text-white font-mono">{twoFaSmsAlert}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setTwoFaOtpDigits(twoFaSmsAlert.split(''));
                }}
                className="px-2 py-1 bg-blue-600/40 text-blue-300 rounded font-semibold text-[10px] border border-blue-500/30"
              >
                Autofill
              </button>
            </div>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIs2FaActive(false)}
              className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
            >
              &larr; Cancel &amp; Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard Email + Password Screen
  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 p-6 text-white text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md mb-3 border border-white/20">
          <Lock className="w-6 h-6 text-blue-200" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">Customer Portal Login</h2>
        <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
          Access your verified customer dashboard &amp; invoices
        </p>
      </div>

      <form onSubmit={handlePasswordLogin} className="p-6 sm:p-8 space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {/* Email */}
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

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password *
            </label>
            <button
              type="button"
              onClick={onNavigateForgot}
              className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
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
        </div>

        {/* Brute Force Protection Indicator */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 py-1">
          <span className="flex items-center gap-1 text-emerald-600 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" /> Rate Limiting &amp; 2FA Shield Active
          </span>
          <span className="text-slate-400">Server Encrypted</span>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying Credentials &amp; Status...</span>
            </>
          ) : (
            <>
              <span>Sign In to Customer Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Register CTA */}
        <div className="text-center pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            Don&apos;t have an account yet?{' '}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="text-blue-600 font-bold hover:underline"
            >
              Register Here
            </button>
          </p>
        </div>
      </form>
    </div>
  );
}
