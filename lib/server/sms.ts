import fs from 'fs';
import path from 'path';

export interface SmsDispatchRecord {
  id: string;
  mobile: string;
  message: string;
  otp?: string;
  purpose: string;
  provider: string;
  status: 'DELIVERED' | 'SENT' | 'FAILED';
  carrier?: string;
  timestamp: string;
  error?: string;
}

const SMS_LOG_FILE = path.join(process.cwd(), 'data', 'sms_dispatches.json');

// Helper to mask mobile number (e.g. 9876543210 -> ******3210)
export function maskMobileNumber(mobile: string): string {
  const clean = mobile.replace(/[^0-9]/g, '');
  if (clean.length <= 4) return '****';
  const last4 = clean.slice(-4);
  return `${'*'.repeat(Math.max(clean.length - 4, 4))}${last4}`;
}

/**
 * Save dispatch record to history (for inspection & audit)
 */
function recordSmsDispatch(dispatch: SmsDispatchRecord) {
  try {
    const dir = path.dirname(SMS_LOG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let history: SmsDispatchRecord[] = [];
    if (fs.existsSync(SMS_LOG_FILE)) {
      try {
        history = JSON.parse(fs.readFileSync(SMS_LOG_FILE, 'utf-8'));
      } catch {}
    }

    history.push(dispatch);
    if (history.length > 200) history = history.slice(-200);

    fs.writeFileSync(SMS_LOG_FILE, JSON.stringify(history, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to log SMS dispatch:', err);
  }
}

/**
 * Get recent SMS dispatches (for developer simulation / admin inspector)
 */
export function getRecentSmsDispatches(limit: number = 20): SmsDispatchRecord[] {
  try {
    if (fs.existsSync(SMS_LOG_FILE)) {
      const history: SmsDispatchRecord[] = JSON.parse(fs.readFileSync(SMS_LOG_FILE, 'utf-8'));
      return history.slice(-limit).reverse();
    }
  } catch {}
  return [];
}

/**
 * Enterprise SMS Dispatcher
 * Automatically routes to real SMS gateway (Twilio, Fast2SMS, MSG91, Custom Webhook)
 * or falls back to development simulation mode when API keys are not yet configured.
 */
export async function sendOtpSms(params: {
  mobile: string;
  otp: string;
  purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET';
  customerName?: string;
}): Promise<{ success: boolean; provider: string; messageId: string; error?: string }> {
  const provider = (process.env.SMS_PROVIDER || 'DEVELOPMENT').toUpperCase().trim();
  const normalizedMobile = params.mobile.replace(/[^0-9]/g, '').slice(-10);
  const now = new Date().toISOString();
  const messageId = `sms_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

  let messageText = '';
  if (params.purpose === 'REGISTRATION') {
    messageText = `Dear ${params.customerName || 'Customer'}, your SmartBill verification OTP is: ${params.otp}. Valid for 10 minutes. Do not share this code with anyone.`;
  } else if (params.purpose === 'LOGIN') {
    messageText = `Dear ${params.customerName || 'Customer'}, your SmartBill login security OTP is: ${params.otp}. Valid for 5 minutes.`;
  } else {
    messageText = `Dear ${params.customerName || 'Customer'}, your SmartBill password reset OTP is: ${params.otp}. Valid for 10 minutes.`;
  }

  // 1. TWILIO
  if (provider === 'TWILIO' && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      const sid = process.env.TWILIO_ACCOUNT_SID;
      const token = process.env.TWILIO_AUTH_TOKEN;
      const from = process.env.TWILIO_PHONE_NUMBER || '';
      const to = `+91${normalizedMobile}`;

      const basicAuth = Buffer.from(`${sid}:${token}`).toString('base64');
      const bodyParams = new URLSearchParams({
        To: to,
        From: from,
        Body: messageText,
      });

      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: bodyParams.toString(),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Twilio SMS dispatch failed');
      }

      recordSmsDispatch({
        id: messageId,
        mobile: normalizedMobile,
        message: messageText,
        otp: params.otp,
        purpose: params.purpose,
        provider: 'TWILIO',
        status: 'DELIVERED',
        carrier: 'Twilio Telecom Gateway',
        timestamp: now,
      });

      return { success: true, provider: 'TWILIO', messageId: json.sid || messageId };
    } catch (err: any) {
      console.error('Twilio Error:', err);
      recordSmsDispatch({
        id: messageId,
        mobile: normalizedMobile,
        message: messageText,
        otp: params.otp,
        purpose: params.purpose,
        provider: 'TWILIO',
        status: 'FAILED',
        error: err.message,
        timestamp: now,
      });
      return { success: false, provider: 'TWILIO', messageId, error: err.message };
    }
  }

  // 2. FAST2SMS (India)
  if (provider === 'FAST2SMS' && process.env.FAST2SMS_API_KEY) {
    try {
      const res = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: params.otp,
          numbers: normalizedMobile,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.return === false) {
        throw new Error(json.message || 'Fast2SMS API dispatch failed');
      }

      recordSmsDispatch({
        id: messageId,
        mobile: normalizedMobile,
        message: messageText,
        otp: params.otp,
        purpose: params.purpose,
        provider: 'FAST2SMS',
        status: 'DELIVERED',
        carrier: 'Fast2SMS DLT Gateway',
        timestamp: now,
      });

      return { success: true, provider: 'FAST2SMS', messageId };
    } catch (err: any) {
      console.error('Fast2SMS Error:', err);
      recordSmsDispatch({
        id: messageId,
        mobile: normalizedMobile,
        message: messageText,
        otp: params.otp,
        purpose: params.purpose,
        provider: 'FAST2SMS',
        status: 'FAILED',
        error: err.message,
        timestamp: now,
      });
      return { success: false, provider: 'FAST2SMS', messageId, error: err.message };
    }
  }

  // 3. MSG91
  if (provider === 'MSG91' && process.env.MSG91_AUTH_KEY) {
    try {
      const res = await fetch('https://control.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          authkey: process.env.MSG91_AUTH_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: process.env.MSG91_TEMPLATE_ID,
          mobile: `91${normalizedMobile}`,
          otp: params.otp,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.type === 'error') {
        throw new Error(json.message || 'MSG91 API error');
      }

      recordSmsDispatch({
        id: messageId,
        mobile: normalizedMobile,
        message: messageText,
        otp: params.otp,
        purpose: params.purpose,
        provider: 'MSG91',
        status: 'DELIVERED',
        carrier: 'MSG91 DLT Enterprise',
        timestamp: now,
      });

      return { success: true, provider: 'MSG91', messageId };
    } catch (err: any) {
      console.error('MSG91 Error:', err);
      return { success: false, provider: 'MSG91', messageId, error: err.message };
    }
  }

  // 4. DEVELOPMENT / SANDBOX FALLBACK
  // Dispatches securely to simulated carrier network, logs in server records,
  // and makes OTP visible in developer simulation mode so testing works immediately.
  recordSmsDispatch({
    id: messageId,
    mobile: normalizedMobile,
    message: messageText,
    otp: params.otp,
    purpose: params.purpose,
    provider: 'DEVELOPMENT',
    status: 'DELIVERED',
    carrier: 'Airtel / Jio Simulated Telecom Gateway',
    timestamp: now,
  });

  console.log(`\n========================================`);
  console.log(`[SMS DISPATCHED] To: +91 ${normalizedMobile}`);
  console.log(`[PURPOSE] ${params.purpose}`);
  console.log(`[OTP CODE] >>> ${params.otp} <<<`);
  console.log(`[MESSAGE] ${messageText}`);
  console.log(`========================================\n`);

  return {
    success: true,
    provider: 'DEVELOPMENT',
    messageId,
  };
}
