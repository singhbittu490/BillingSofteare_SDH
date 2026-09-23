'use client';

import React, { useState } from 'react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Phone,
  ShieldCheck,
} from 'lucide-react';

interface CustomerForgotPasswordProps {
  onBackToLogin: () => void;
}

export function CustomerForgotPassword({ onBackToLogin }: CustomerForgotPasswordProps) {
  const [step, setStep] = useState<'REQUEST' | 'RESET' | 'SUCCESS'>('REQUEST');
  const [email, setEmail] = useState('');
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [maskedMobile, setMaskedMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to request reset code.');
      }

      if (data.customerId) {
        setCustomerId(data.customerId);
        setMaskedMobile(data.maskedMobile || 'registered mobile');
      }

      setSuccessMsg(data.message);
      setStep('RESET');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMsg('Password must be at least 8 characters with upper, lower, number and special char.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          otp,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Password reset failed.');
      }

      setStep('SUCCESS');
    } catch (err: any) {
      setErrorMsg(err.message || 'Password reset failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 p-6 text-white text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md mb-3 border border-white/20">
          <KeyRound className="w-6 h-6 text-blue-200" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">Forgot Password</h2>
        <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
          {step === 'REQUEST'
            ? 'Enter your registered email to receive an SMS reset code'
            : step === 'RESET'
            ? `Enter the 6-digit code sent to ${maskedMobile}`
            : 'Password successfully updated!'}
        </p>
      </div>

      <div className="p-6 sm:p-8 space-y-4">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {successMsg && step === 'RESET' && (
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2 text-blue-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-blue-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* STEP 1: REQUEST OTP */}
        {step === 'REQUEST' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Registered Email Address *
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Sending Security Code...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Code via SMS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: ENTER OTP & NEW PASSWORD */}
        {step === 'RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                6-Digit Reset Code *
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                className="w-full py-2.5 px-3 text-center text-xl font-mono font-black tracking-widest bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
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

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Confirm New Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Save New Password &amp; Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: SUCCESS */}
        {step === 'SUCCESS' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Password Reset Completed</h3>
            <p className="text-xs text-slate-600">
              Your password has been changed securely and all prior sessions have been revoked. You can now log in.
            </p>
            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow transition-colors cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        )}

        {step !== 'SUCCESS' && (
          <div className="text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onBackToLogin}
              className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
            >
              &larr; Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
