import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import {
  hashPassword,
  verifyOtp,
  validatePasswordStrength,
  checkRateLimit,
  recordFailedAttempt,
} from '@/lib/server/security';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const body = await req.json();
    const { customerId, otp, newPassword, confirmPassword } = body;

    if (!customerId || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'New password and confirm password do not match.' },
        { status: 400 }
      );
    }

    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      return NextResponse.json(
        { success: false, error: pwCheck.error },
        { status: 400 }
      );
    }

    const customer = db.findCustomerById(Number(customerId));
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Account not found.' },
        { status: 404 }
      );
    }

    const rateKey = `reset-pw:${customerId}`;
    const rateCheck = checkRateLimit(rateKey, 4, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many failed attempts. Please wait ${rateCheck.retryAfterSeconds} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const activeOtp = db.findActiveOtp(customer.id, 'PASSWORD_RESET');
    if (!activeOtp) {
      return NextResponse.json(
        { success: false, error: 'Password reset code has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    await db.incrementOtpAttempts(activeOtp.id);
    const isValid = verifyOtp(otp.toString().trim(), activeOtp.otp_hash);

    if (!isValid) {
      recordFailedAttempt(rateKey, 4, 15 * 60 * 1000);
      return NextResponse.json(
        { success: false, error: 'Invalid reset code. Please check and try again.' },
        { status: 400 }
      );
    }

    // Mark OTP used
    await db.markOtpVerified(activeOtp.id);

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update customer password
    await db.updateCustomer(customer.id, {
      password_hash: newHash,
    });

    // Invalidate all existing sessions (security protection against account takeover)
    await db.deleteCustomerSessions(customer.id);

    await db.createAuditLog({
      customer_id: customer.id,
      action: 'PASSWORD_RESET_SUCCESS',
      ip_address: ip,
      user_agent: req.headers.get('user-agent') || undefined,
      details: 'Password was successfully reset and all prior sessions were revoked.',
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.',
    });
  } catch (err: any) {
    console.error('Reset Password Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Password reset failed.' },
      { status: 500 }
    );
  }
}
