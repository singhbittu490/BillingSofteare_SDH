import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import {
  hashPassword,
  validatePasswordStrength,
  generateSecureOtp,
  hashOtp,
  checkRateLimit,
  recordFailedAttempt,
} from '@/lib/server/security';
import { sendOtpSms, maskMobileNumber } from '@/lib/server/sms';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Rate limit registration requests from IP (max 10 registrations per 15 minutes)
    const rateCheck = checkRateLimit(`reg:${ip}`, 10, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many registration attempts. Please try again after ${rateCheck.retryAfterSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { fullName, email, mobile, password, confirmPassword, termsAccepted } = body;

    // 1. Validate mandatory fields
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Please enter your full name (at least 2 characters).' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    const cleanMobile = (mobile || '').toString().replace(/[^0-9]/g, '');
    if (cleanMobile.length !== 10) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid 10-digit mobile number.' },
        { status: 400 }
      );
    }

    if (!termsAccepted) {
      return NextResponse.json(
        { success: false, error: 'You must accept the Terms & Conditions to register.' },
        { status: 400 }
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'Password and confirm password do not match.' },
        { status: 400 }
      );
    }

    // 2. Validate password strength
    const passwordCheck = validatePasswordStrength(password || '');
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { success: false, error: passwordCheck.error },
        { status: 400 }
      );
    }

    // 3. Check uniqueness of email & mobile
    const existingEmail = db.findCustomerByEmail(email);
    if (existingEmail) {
      return NextResponse.json(
        { success: false, error: 'An account with this email address already exists. Please login.' },
        { status: 409 }
      );
    }

    const existingMobile = db.findCustomerByMobile(cleanMobile);
    if (existingMobile) {
      return NextResponse.json(
        { success: false, error: 'An account with this mobile number already exists. Please login.' },
        { status: 409 }
      );
    }

    // 4. Hash password securely (bcrypt with 12 rounds)
    const passwordHash = await hashPassword(password);

    // 5. Create customer with PENDING_VERIFICATION status
    const customer = await db.createCustomer({
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      mobile: cleanMobile,
      password_hash: passwordHash,
    });

    // 6. Generate 6-digit random verification OTP
    const rawOtp = generateSecureOtp();
    const hashedOtp = hashOtp(rawOtp);

    // Store in database with 10-minute expiry & max 3 attempts
    await db.createOtpRecord({
      customer_id: customer.id,
      otp_hash: hashedOtp,
      purpose: 'REGISTRATION',
      expires_in_minutes: 10,
      max_attempts: 3,
    });

    // 7. Dispatch SMS through OTP provider
    const smsResult = await sendOtpSms({
      mobile: customer.mobile,
      otp: rawOtp,
      purpose: 'REGISTRATION',
      customerName: customer.full_name,
    });

    // 8. Audit log
    await db.createAuditLog({
      customer_id: customer.id,
      action: 'CUSTOMER_REGISTER_INITIATED',
      ip_address: ip,
      user_agent: req.headers.get('user-agent') || undefined,
      details: `Account created in PENDING_VERIFICATION status. OTP sent via ${smsResult.provider}.`,
    });

    return NextResponse.json({
      success: true,
      customerId: customer.id,
      email: customer.email,
      maskedMobile: maskMobileNumber(customer.mobile),
      accountStatus: customer.account_status,
      message: `A 6-digit verification code has been dispatched to ${maskMobileNumber(customer.mobile)}.`,
      smsProvider: smsResult.provider,
    });
  } catch (err: any) {
    console.error('Registration Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
