import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import {
  generateSecureOtp,
  hashOtp,
  checkOtpResendCooldown,
  recordOtpResend,
  checkRateLimit,
} from '@/lib/server/security';
import { sendOtpSms, maskMobileNumber } from '@/lib/server/sms';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const body = await req.json();
    const { customerId, purpose = 'REGISTRATION' } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required.' },
        { status: 400 }
      );
    }

    const customer = db.findCustomerById(Number(customerId));
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer account not found.' },
        { status: 404 }
      );
    }

    // Rate limit check per IP (prevent SMS bombing)
    const ipRate = checkRateLimit(`sms-resend:${ip}`, 5, 10 * 60 * 1000);
    if (!ipRate.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many OTP requests. Please wait ${ipRate.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    // Check 60-second cooldown
    const cooldownKey = `resend:${customer.id}:${purpose}`;
    const cooldown = checkOtpResendCooldown(cooldownKey, 60);
    if (!cooldown.canResend) {
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${cooldown.waitSeconds} seconds before requesting another code.`,
          retryAfterSeconds: cooldown.waitSeconds,
        },
        { status: 429 }
      );
    }

    // Generate fresh OTP
    const rawOtp = generateSecureOtp();
    const hashedOtp = hashOtp(rawOtp);

    await db.createOtpRecord({
      customer_id: customer.id,
      otp_hash: hashedOtp,
      purpose: purpose as any,
      expires_in_minutes: 10,
      max_attempts: 3,
    });

    recordOtpResend(cooldownKey);

    // Send SMS
    const smsResult = await sendOtpSms({
      mobile: customer.mobile,
      otp: rawOtp,
      purpose: purpose as any,
      customerName: customer.full_name,
    });

    await db.createAuditLog({
      customer_id: customer.id,
      action: 'OTP_RESENT',
      ip_address: ip,
      user_agent: req.headers.get('user-agent') || undefined,
      details: `New OTP dispatched via ${smsResult.provider} for purpose ${purpose}.`,
    });

    return NextResponse.json({
      success: true,
      maskedMobile: maskMobileNumber(customer.mobile),
      message: `A new verification code has been dispatched to ${maskMobileNumber(customer.mobile)}.`,
      smsProvider: smsResult.provider,
    });
  } catch (err: any) {
    console.error('Resend OTP Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to resend code.' },
      { status: 500 }
    );
  }
}
