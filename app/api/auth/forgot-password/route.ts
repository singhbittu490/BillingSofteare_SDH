import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import {
  generateSecureOtp,
  hashOtp,
  checkRateLimit,
} from '@/lib/server/security';
import { sendOtpSms, maskMobileNumber } from '@/lib/server/sms';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Rate limit per IP
    const rateCheck = checkRateLimit(`forgot-pw:${ip}`, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many password reset attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const customer = db.findCustomerByEmail(email.trim().toLowerCase());

    // Security best practice: Always return generic response to prevent email harvesting
    if (!customer) {
      return NextResponse.json({
        success: true,
        message:
          'If an account is associated with this email, a 6-digit password reset code has been dispatched to the registered mobile number.',
      });
    }

    // Customer must be active/verified to reset password
    if (customer.mobile_verified === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'This account has not verified its mobile number yet. Please complete registration verification first.',
        },
        { status: 400 }
      );
    }

    // Generate 6-digit reset OTP
    const rawOtp = generateSecureOtp();
    const hashedOtp = hashOtp(rawOtp);

    await db.createOtpRecord({
      customer_id: customer.id,
      otp_hash: hashedOtp,
      purpose: 'PASSWORD_RESET',
      expires_in_minutes: 10,
      max_attempts: 3,
    });

    await sendOtpSms({
      mobile: customer.mobile,
      otp: rawOtp,
      purpose: 'PASSWORD_RESET',
      customerName: customer.full_name,
    });

    await db.createAuditLog({
      customer_id: customer.id,
      action: 'PASSWORD_RESET_REQUESTED',
      ip_address: ip,
      user_agent: req.headers.get('user-agent') || undefined,
      details: 'Password reset code dispatched to mobile.',
    });

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      maskedMobile: maskMobileNumber(customer.mobile),
      message: `A 6-digit password reset code has been dispatched to ${maskMobileNumber(customer.mobile)}.`,
    });
  } catch (err: any) {
    console.error('Forgot Password Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Request failed.' },
      { status: 500 }
    );
  }
}
