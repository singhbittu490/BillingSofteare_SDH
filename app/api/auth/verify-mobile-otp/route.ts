import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { verifyOtp, checkRateLimit, recordFailedAttempt } from '@/lib/server/security';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const body = await req.json();
    const { customerId, otp } = body;

    if (!customerId || !otp) {
      return NextResponse.json(
        { success: false, error: 'Customer ID and 6-digit OTP are required.' },
        { status: 400 }
      );
    }

    const cleanOtp = otp.toString().trim();
    if (!/^[0-9]{6}$/.test(cleanOtp)) {
      return NextResponse.json(
        { success: false, error: 'Verification code must be exactly 6 digits.' },
        { status: 400 }
      );
    }

    // Check brute-force limit for this customer's verification (max 5 attempts per 10 mins)
    const rateKey = `otp-verify:${customerId}`;
    const rateCheck = checkRateLimit(rateKey, 5, 10 * 60 * 1000, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed attempts. Account verification is temporarily locked. Please wait ${rateCheck.retryAfterSeconds} seconds or request a new OTP.`,
        },
        { status: 429 }
      );
    }

    const customer = db.findCustomerById(Number(customerId));
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer account not found.' },
        { status: 404 }
      );
    }

    if (customer.mobile_verified === 1 && customer.account_status === 'ACTIVE') {
      return NextResponse.json({
        success: true,
        alreadyVerified: true,
        customerCode: customer.customer_code,
        message: 'Your mobile number is already verified. You can proceed to login.',
      });
    }

    // Find active OTP record
    const activeOtp = db.findActiveOtp(customer.id, 'REGISTRATION');
    if (!activeOtp) {
      return NextResponse.json(
        {
          success: false,
          error: 'Verification code has expired or was already used. Please request a new OTP.',
        },
        { status: 400 }
      );
    }

    // Increment attempt count
    const attemptNumber = await db.incrementOtpAttempts(activeOtp.id);

    // Verify OTP using constant-time hash comparison
    const isValid = verifyOtp(cleanOtp, activeOtp.otp_hash);

    if (!isValid) {
      recordFailedAttempt(rateKey, 5, 10 * 60 * 1000, 10 * 60 * 1000);
      const remainingAttempts = Math.max(0, activeOtp.max_attempts - attemptNumber);

      if (remainingAttempts === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Maximum verification attempts exceeded for this code. Please request a new OTP.',
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Invalid verification code. ${remainingAttempts} attempt(s) remaining.`,
        },
        { status: 400 }
      );
    }

    // OTP is valid! Mark verified
    await db.markOtpVerified(activeOtp.id);

    // Generate unique backend Customer Code (e.g. CUS-2026-000001)
    const newCustomerCode = db.generateCustomerCode();

    // Activate customer account
    const updatedCustomer = await db.updateCustomer(customer.id, {
      customer_code: newCustomerCode,
      mobile_verified: 1,
      account_status: 'ACTIVE',
    });

    // Audit log
    await db.createAuditLog({
      customer_id: customer.id,
      action: 'MOBILE_VERIFIED_SUCCESS',
      ip_address: ip,
      user_agent: req.headers.get('user-agent') || undefined,
      details: `Mobile ${customer.mobile} verified. Customer code assigned: ${newCustomerCode}. Status updated to ACTIVE.`,
    });

    return NextResponse.json({
      success: true,
      customerCode: updatedCustomer.customer_code,
      fullName: updatedCustomer.full_name,
      email: updatedCustomer.email,
      accountStatus: updatedCustomer.account_status,
      message: `Mobile verification successful! Your unique Customer Code is ${newCustomerCode}. You can now login.`,
    });
  } catch (err: any) {
    console.error('Verify OTP Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Verification failed.' },
      { status: 500 }
    );
  }
}
