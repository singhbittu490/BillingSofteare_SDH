import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import {
  verifyOtp,
  checkRateLimit,
  recordFailedAttempt,
  generateSecureCryptoToken,
  hashCryptoToken,
  createSessionJwt,
  SESSION_COOKIE_NAME,
} from '@/lib/server/security';
import { maskMobileNumber } from '@/lib/server/sms';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const body = await req.json();
    const { customerId, otp } = body;

    if (!customerId || !otp) {
      return NextResponse.json(
        { success: false, error: 'Customer ID and 6-digit OTP are required.' },
        { status: 400 }
      );
    }

    const cleanOtp = otp.toString().trim();
    const rateKey = `login-otp:${customerId}`;
    const rateCheck = checkRateLimit(rateKey, 4, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const customer = db.findCustomerById(Number(customerId));
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Account not found.' },
        { status: 404 }
      );
    }

    if (customer.account_status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: `Account is not active. Status: ${customer.account_status}` },
        { status: 403 }
      );
    }

    const activeOtp = db.findActiveOtp(customer.id, 'LOGIN');
    if (!activeOtp) {
      return NextResponse.json(
        {
          success: false,
          error: 'Login verification code has expired or was already used. Please login again.',
        },
        { status: 400 }
      );
    }

    await db.incrementOtpAttempts(activeOtp.id);
    const isValid = verifyOtp(cleanOtp, activeOtp.otp_hash);

    if (!isValid) {
      recordFailedAttempt(rateKey, 4, 10 * 60 * 1000);
      return NextResponse.json(
        { success: false, error: 'Invalid verification code. Please check your SMS and try again.' },
        { status: 400 }
      );
    }

    // Mark OTP verified
    await db.markOtpVerified(activeOtp.id);

    // Create session
    const sessionId = generateSecureCryptoToken();
    const sessionToken = generateSecureCryptoToken();
    const sessionTokenHash = hashCryptoToken(sessionToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await db.createSession({
      id: sessionId,
      customer_id: customer.id,
      session_token_hash: sessionTokenHash,
      expires_at: expiresAt,
      ip_address: ip,
      user_agent: userAgent,
    });

    await db.updateCustomer(customer.id, {
      last_login_at: new Date().toISOString(),
    });

    const jwt = await createSessionJwt({
      customerId: customer.id,
      customerCode: customer.customer_code,
      email: customer.email,
      mobile: customer.mobile,
      fullName: customer.full_name,
      status: customer.account_status,
      sessionId,
    });

    await db.createAuditLog({
      customer_id: customer.id,
      action: 'LOGIN_2FA_SUCCESS',
      ip_address: ip,
      user_agent: userAgent,
      details: '2FA Mobile OTP verification succeeded.',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Two-factor login verified successfully.',
      customer: {
        id: customer.id,
        customerCode: customer.customer_code,
        fullName: customer.full_name,
        email: customer.email,
        maskedMobile: maskMobileNumber(customer.mobile),
        accountStatus: customer.account_status,
        createdAt: customer.created_at,
        lastLoginAt: new Date().toISOString(),
        twoFactorEnabled: true,
      },
    });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: jwt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('Verify Login OTP Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Login verification failed.' },
      { status: 500 }
    );
  }
}
