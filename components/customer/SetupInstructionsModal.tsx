'use client';

import React from 'react';
import {
  FileCode2,
  KeyRound,
  ShieldCheck,
  Server,
  Database,
  Radio,
  CheckCircle2,
  Copy,
  ExternalLink,
} from 'lucide-react';

export function SetupInstructionsModal({ onClose }: { onClose: () => void }) {
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scaleUp">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">System &amp; SMS Integration Architecture</h2>
              <p className="text-xs text-blue-200/80">
                Setup guide for SMS providers, database credentials &amp; production security
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            ✕ Close
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* Section 1: SMS Provider Credentials */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Radio className="w-4 h-4 text-blue-600" />
              <span>1. Configuring Real SMS Gateways (.env.local)</span>
            </div>
            <p className="text-slate-600">
              The application uses an enterprise-ready SMS gateway dispatcher (<code>lib/server/sms.ts</code>). Add any of the following to your <code>.env.local</code> file:
            </p>

            <div className="space-y-2">
              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] relative">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `# TWILIO SMS SETUP\nSMS_PROVIDER="TWILIO"\nTWILIO_ACCOUNT_SID="your_account_sid"\nTWILIO_AUTH_TOKEN="your_auth_token"\nTWILIO_PHONE_NUMBER="+1234567890"`,
                      'twilio'
                    )
                  }
                  className="absolute right-3 top-3 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedKey === 'twilio' ? 'Copied!' : 'Copy Twilio'}
                </button>
                <div className="text-emerald-400 font-bold mb-1"># Option A: Twilio (Global SMS)</div>
                <div>SMS_PROVIDER=&quot;TWILIO&quot;</div>
                <div>TWILIO_ACCOUNT_SID=&quot;your_account_sid&quot;</div>
                <div>TWILIO_AUTH_TOKEN=&quot;your_auth_token&quot;</div>
                <div>TWILIO_PHONE_NUMBER=&quot;+1234567890&quot;</div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] relative">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `# FAST2SMS (India DLT)\nSMS_PROVIDER="FAST2SMS"\nFAST2SMS_API_KEY="your_authorization_key"`,
                      'fast2sms'
                    )
                  }
                  className="absolute right-3 top-3 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedKey === 'fast2sms' ? 'Copied!' : 'Copy Fast2SMS'}
                </button>
                <div className="text-emerald-400 font-bold mb-1"># Option B: Fast2SMS (India High-Speed OTP)</div>
                <div>SMS_PROVIDER=&quot;FAST2SMS&quot;</div>
                <div>FAST2SMS_API_KEY=&quot;your_authorization_key&quot;</div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] relative">
                <button
                  onClick={() =>
                    copyToClipboard(
                      `# MSG91 (Enterprise DLT)\nSMS_PROVIDER="MSG91"\nMSG91_AUTH_KEY="your_msg91_key"\nMSG91_TEMPLATE_ID="your_template_id"`,
                      'msg91'
                    )
                  }
                  className="absolute right-3 top-3 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  {copiedKey === 'msg91' ? 'Copied!' : 'Copy MSG91'}
                </button>
                <div className="text-emerald-400 font-bold mb-1"># Option C: MSG91 (DLT Enterprise)</div>
                <div>SMS_PROVIDER=&quot;MSG91&quot;</div>
                <div>MSG91_AUTH_KEY=&quot;your_msg91_auth_key&quot;</div>
                <div>MSG91_TEMPLATE_ID=&quot;your_dlt_template_id&quot;</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 italic">
              Note: If no external SMS keys are supplied, the built-in simulated carrier gateway activates automatically, logging the OTP directly in the in-app inspector for instant testing.
            </p>
          </div>

          {/* Section 2: Database Schema & Storage */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>2. Database Schema &amp; Strict Persistence</span>
            </div>
            <p className="text-slate-600">
              The database structure is defined in <code>database_schema.sql</code> and executed via the transactional server layer (<code>lib/server/db.ts</code>). It enforces:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-1 text-slate-600">
              <li>
                <strong>Unique Indexes:</strong> Case-insensitive Unique Email, Unique 10-digit Mobile, and Unique Customer Code.
              </li>
              <li>
                <strong>Customer Code Generation:</strong> Auto-incremented sequence assigned exclusively upon mobile verification: <code>CUS-2026-000001</code>.
              </li>
              <li>
                <strong>Single-Use OTP Storage:</strong> OTPs stored as HMAC SHA-256 hashes with 10-minute expiry and attempt tracking.
              </li>
              <li>
                <strong>PostgreSQL / MySQL compatibility:</strong> The file <code>database_schema.sql</code> can be directly imported into any PostgreSQL 14+ or MySQL 8.0+ server.
              </li>
            </ul>
          </div>

          {/* Section 3: Cryptography & Security Enforcement */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>3. Backend Cryptographic Security Standards</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 mb-0.5">Password Hashing</div>
                <div className="text-slate-500 text-[11px]">
                  Bcrypt with 12 salt rounds. Plaintext passwords never touch logs or database.
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 mb-0.5">Constant-Time Verification</div>
                <div className="text-slate-500 text-[11px]">
                  OTPs are verified using <code>crypto.timingSafeEqual</code> to prevent timing attacks.
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 mb-0.5">Brute Force Shield</div>
                <div className="text-slate-500 text-[11px]">
                  Locks out accounts for 15 minutes after 5 failed login attempts. Max 3 OTP verification tries.
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800 mb-0.5">Session Security</div>
                <div className="text-slate-500 text-[11px]">
                  Signed JWTs stored in <code>HttpOnly</code>, <code>SameSite=Lax</code> cookies.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow cursor-pointer"
          >
            Got It, Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
