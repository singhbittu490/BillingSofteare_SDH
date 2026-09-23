'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Phone,
  Clock,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  Radio,
  Lock,
} from 'lucide-react';

interface CustomerOtpVerifyProps {
  customerId: number;
  email: string;
  maskedMobile: string;
  onVerified: (customerCode: string) => void;
  onBackToRegister?: () => void;
}

export function CustomerOtpVerify({
  customerId,
  email,
  maskedMobile,
  onVerified,
  onBackToRegister,
}: CustomerOtpVerifyProps) {
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verifiedCustomerCode, setVerifiedCustomerCode] = useState<string | null>(null);

  // 10-minute countdown timer (600 seconds)
  const [timeLeft, setTimeLeft] = useState(600);

  // 60-second resend cooldown timer
  const [resendCooldown, setResendCooldown] = useState(60);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  // Live SMS preview for sandbox / developer testing
  const [latestSms, setLatestSms] = useState<{ otp?: string; message?: string } | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Fetch recent SMS dispatch in dev mode
  const checkLatestSms = async () => {
    try {
      const res = await fetch('/api/admin/sms-logs');
      const data = await res.json();
      if (data.success && data.dispatches && data.dispatches.length > 0) {
        const matching = data.dispatches.find(
          (d: any) => d.purpose === 'REGISTRATION' || d.purpose === 'LOGIN'
        );
        if (matching) {
          setLatestSms({ otp: matching.otp, message: matching.message });
        }
      }
    } catch {}
  };

  useEffect(() => {
    checkLatestSms();
    // Auto focus first input
    inputRefs.current[0]?.focus();
  }, []);

  // Timer countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleDigitChange = (index: number, val: string) => {
    // Handle pasting 6 digits
    const cleaned = val.replace(/[^0-9]/g, '');
    if (cleaned.length > 1) {
      const parts = cleaned.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      parts.forEach((p, idx) => {
        newDigits[idx] = p;
      });
      setOtpDigits(newDigits);
      const nextFocus = Math.min(parts.length, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    // Auto-advance to next input
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setErrorMsg('Please enter all 6 digits of the verification code.');
      return;
    }

    if (timeLeft <= 0) {
      setErrorMsg('Verification code has expired. Please click "Resend OTP".');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/verify-mobile-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          otp: fullOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Verification failed.');
      }

      setVerifiedCustomerCode(data.customerCode);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check your OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setErrorMsg(null);
    setResendSuccess(null);

    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          purpose: 'REGISTRATION',
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to resend code.');
      }

      setResendCooldown(60);
      setTimeLeft(600); // reset 10 mins
      setResendSuccess('A fresh 6-digit code has been sent to your mobile.');
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      checkLatestSms();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to resend verification code.');
    } finally {
      setIsResending(false);
    }
  };

  // If successfully verified, show congratulatory screen with unique Customer Code
  if (verifiedCustomerCode) {
    return (
      <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-center p-8 space-y-5 animate-scaleUp">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
            Mobile Verified &bull; Account Active
          </span>
          <h2 className="text-2xl font-black text-slate-900">Verification Successful!</h2>
          <p className="text-xs text-slate-600 max-w-xs mx-auto">
            Your mobile number has been successfully verified. Your account status is now{' '}
            <strong className="text-emerald-700 font-bold">ACTIVE</strong>.
          </p>
        </div>

        {/* Unique Customer Code Box */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/80 shadow-sm space-y-1">
          <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Assigned Unique Customer Code</span>
          </div>
          <div className="text-2xl sm:text-3xl font-mono font-black text-slate-900 tracking-wider">
            {verifiedCustomerCode}
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            Permanently assigned by backend database. Use this code for all billing &amp; inquiries.
          </div>
        </div>

        <button
          type="button"
          onClick={() => onVerified(verifiedCustomerCode)}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Proceed to Customer Login</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-blue-700 to-slate-900 p-6 text-white text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md mb-3 border border-white/20">
          <Phone className="w-6 h-6 text-blue-200" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">Mobile Number Verification</h2>
        <p className="text-xs sm:text-sm text-blue-100/90 mt-1">
          Enter the 6-digit OTP dispatched to <span className="font-mono font-bold text-white">{maskedMobile}</span>
        </p>
      </div>

      <div className="p-6 sm:p-8 space-y-5">
        {/* Important Warning Notice */}
        <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-2.5 text-amber-900 text-xs">
          <Lock className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Mandatory Verification:</strong> You must verify your mobile number before dashboard access is granted. Your unique Customer Code will be generated upon successful verification.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="flex-1 font-medium">{errorMsg}</div>
          </div>
        )}

        {resendSuccess && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{resendSuccess}</span>
          </div>
        )}

        {/* 6-Digit OTP Inputs */}
        <div className="space-y-2">
          <label className="block text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
            Enter 6-Digit Verification Code
          </label>
          <div className="flex justify-center gap-2 sm:gap-3">
            {otpDigits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-13 sm:w-13 sm:h-14 text-center text-xl sm:text-2xl font-mono font-black rounded-xl border-2 border-slate-200 bg-slate-50 focus:bg-white focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all text-slate-900 shadow-xs"
              />
            ))}
          </div>
        </div>

        {/* Expiry and Resend Row */}
        <div className="flex items-center justify-between text-xs pt-1 px-1">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Code expires in:</span>
            <span className={`font-mono font-bold ${timeLeft < 60 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>

          <button
            type="button"
            disabled={resendCooldown > 0 || isResending}
            onClick={handleResendOtp}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResending ? 'animate-spin' : ''}`} />
            <span>
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </span>
          </button>
        </div>

        {/* Verify CTA */}
        <button
          type="button"
          onClick={() => handleVerify()}
          disabled={isLoading || otpDigits.join('').length !== 6}
          className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Verifying OTP on Server...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Mobile &amp; Activate Account</span>
            </>
          )}
        </button>

        {/* Live SMS Dispatch Inspector Box (for seamless preview testing) */}
        {latestSms?.otp && (
          <div className="mt-4 p-3.5 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Radio className="w-3 h-3 animate-ping" />
                <span>Simulated SMS Network Dispatcher</span>
              </span>
              <span className="text-slate-400 font-mono text-[10px]">Airtel/Jio DLT</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300">
              {latestSms.message}
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-[11px] text-slate-400">
                Quick testing code: <strong className="text-white font-mono text-xs">{latestSms.otp}</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  if (latestSms.otp) {
                    const digits = latestSms.otp.split('');
                    setOtpDigits(digits);
                  }
                }}
                className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 rounded font-semibold text-[10px] border border-blue-500/30 transition-colors"
              >
                Autofill Code
              </button>
            </div>
          </div>
        )}

        {onBackToRegister && (
          <div className="text-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onBackToRegister}
              className="text-xs text-slate-500 hover:text-slate-700 font-semibold"
            >
              &larr; Back to Registration
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
