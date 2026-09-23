import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import {
  verifyPassword,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  generateSecureCryptoToken,
  hashCryptoToken,
  createSessionJwt,
  generateSecureOtp,
  hashOtp,
  SESSION_COOKIE_NAME,
} from '@/lib/server/security';
import { sendOtpSms, maskMobileNumber } from '@/lib/server/sms';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Please enter both your email address and password.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const rateLimitKey = `login:${ip}:${normalizedEmail}`;

    // 1. Check brute-force lockout (5 attempts per 15 minutes)
    const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      await db.createAuditLog({
        customer_id: null,
        action: 'LOGIN_LOCKED_OUT',
        ip_address: ip,
        user_agent: userAgent,
        details: `Brute force lockout triggered for ${normalizedEmail}. Retry after ${rateCheck.retryAfterSeconds}s.`,
      });

      return NextResponse.json(
        {
          success: false,
          error: `Too many failed login attempts. For security, access is temporarily locked for ${Math.ceil(
            rateCheck.retryAfterSeconds / 60
          )} minute(s). Please try again later.`,
        },
        { status: 429 }
      );
    }

    // 2. Query database for customer
    const customer = db.findCustomerByEmail(normalizedEmail);

    // Generic safe error message to prevent user enumeration
    if (!customer) {
      const fail = recordFailedAttempt(rateLimitKey, 5, 15 * 60 * 1000, 15 * 60 * 1000);
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address or password.',
          remainingAttempts: Math.max(0, 5 - (fail.locked ? 5 : rateCheck.remainingAttempts)),
        },
        { status: 401 }
      );
    }

    // 3. Verify password hash using bcrypt
    const isPasswordValid = await verifyPassword(password, customer.password_hash);
    if (!isPasswordValid) {
      const fail = recordFailedAttempt(rateLimitKey, 5, 15 * 60 * 1000, 15 * 60 * 1000);
      await db.createAuditLog({
        customer_id: customer.id,
        action: 'LOGIN_FAILED_WRONG_PASSWORD',
        ip_address: ip,
        user_agent: userAgent,
        details: `Incorrect password attempt. Locked: ${fail.locked}`,
      });

      if (fail.locked) {
        return NextResponse.json(
          {
            success: false,
            error: 'Too many failed login attempts. Account login is temporarily locked for 15 minutes.',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email address or password.',
        },
        { status: 401 }
      );
    }

    // Password is valid - reset failed attempts counter
    resetRateLimit(rateLimitKey);

    // 4. Check account status & mobile verification
    if (customer.mobile_verified === 0 || customer.account_status === 'PENDING_VERIFICATION') {
      // Send a fresh OTP to let them verify
      const rawOtp = generateSecureOtp();
      const hashedOtp = hashOtp(rawOtp);

      await db.createOtpRecord({
        customer_id: customer.id,
        otp_hash: hashedOtp,
        purpose: 'REGISTRATION',
        expires_in_minutes: 10,
        max_attempts: 3,
      });

      await sendOtpSms({
        mobile: customer.mobile,
        otp: rawOtp,
        purpose: 'REGISTRATION',
        customerName: customer.full_name,
      });

      return NextResponse.json(
        {
          success: false,
          requiresMobileVerification: true,
          customerId: customer.id,
          maskedMobile: maskMobileNumber(customer.mobile),
          error:
            'Mobile verification is mandatory. Your account is PENDING_VERIFICATION. A fresh verification OTP has been dispatched to your registered mobile.',
        },
        { status: 403 }
      );
    }

    if (customer.account_status === 'BLOCKED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Your account has been BLOCKED by the administrator. Access denied.',
        },
        { status: 403 }
      );
    }

    if (customer.account_status === 'SUSPENDED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Your account is currently SUSPENDED. Please contact customer support.',
        },
        { status: 403 }
      );
    }

    if (customer.account_status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: `Access denied. Account status: ${customer.account_status}.`,
        },
        { status: 403 }
      );
    }

    // 5. Additional Mobile Verification (2FA) during login
    if (customer.two_factor_enabled === 1) {
      const loginOtp = generateSecureOtp();
      const hashedLoginOtp = hashOtp(loginOtp);

      await db.createOtpRecord({
        customer_id: customer.id,
        otp_hash: hashedLoginOtp,
        purpose: 'LOGIN',
        expires_in_minutes: 5,
        max_attempts: 3,
      });

      await sendOtpSms({
        mobile: customer.mobile,
        otp: loginOtp,
        purpose: 'LOGIN',
        customerName: customer.full_name,
      });

      return NextResponse.json({
        success: true,
        requiresLoginOtp: true,
        customerId: customer.id,
        maskedMobile: maskMobileNumber(customer.mobile),
        message: `Security 2FA active. A 6-digit login verification code was sent to ${maskMobileNumber(
          customer.mobile
        )}.`,
      });
    }

    // 6. Complete Login: create server session & JWT cookie
    const sessionId = generateSecureCryptoToken();
    const sessionToken = generateSecureCryptoToken();
    const sessionTokenHash = hashCryptoToken(sessionToken);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await db.createSession({
      id: sessionId,
      customer_id: customer.id,
      session_token_hash: sessionTokenHash,
      expires_at: expiresAt,
      ip_address: ip,
      user_agent: userAgent,
    });

    // Update last login timestamp
    await db.updateCustomer(customer.id, {
      last_login_at: new Date().toISOString(),
    });

    // Generate signed JWT
    const jwt = await createSessionJwt({
      customerId: customer.id,
      customerCode: customer.customer_code,
      email: customer.email,
      mobile: customer.mobile,
      fullName: customer.full_name,
      status: customer.account_status,
      sessionId,
    });

    // Audit log
    await db.createAuditLog({
      customer_id: customer.id,
      action: 'LOGIN_SUCCESS',
      ip_address: ip,
      user_agent: userAgent,
      details: 'Customer authenticated successfully.',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Login successful. Redirecting to Customer Dashboard...',
      customer: {
        id: customer.id,
        customerCode: customer.customer_code,
        fullName: customer.full_name,
        email: customer.email,
        maskedMobile: maskMobileNumber(customer.mobile),
        accountStatus: customer.account_status,
        createdAt: customer.created_at,
        lastLoginAt: new Date().toISOString(),
        twoFactorEnabled: customer.two_factor_enabled === 1,
      },
    });

    // Set HttpOnly, Secure cookie
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: jwt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (err: any) {
    console.error('Login Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Login failed.' },
      { status: 500 }
    );
  }
}
