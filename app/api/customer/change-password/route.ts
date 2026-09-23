import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import {
  getAuthenticatedCustomerFromCookies,
  verifyPassword,
  hashPassword,
  validatePasswordStrength,
} from '@/lib/server/security';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedCustomerFromCookies();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login.' },
        { status: 401 }
      );
    }

    const customer = db.findCustomerById(auth.customerId);
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Account not found.' }, { status: 404 });
    }

    const body = await req.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Current password and new password are required.' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'New password and confirm password do not match.' },
        { status: 400 }
      );
    }

    const isCurrentValid = await verifyPassword(currentPassword, customer.password_hash);
    if (!isCurrentValid) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect.' },
        { status: 400 }
      );
    }

    const pwCheck = validatePasswordStrength(newPassword);
    if (!pwCheck.valid) {
      return NextResponse.json({ success: false, error: pwCheck.error }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    await db.updateCustomer(customer.id, {
      password_hash: newHash,
    });

    await db.createAuditLog({
      customer_id: customer.id,
      action: 'PASSWORD_CHANGED',
      ip_address: req.headers.get('x-forwarded-for') || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
      details: 'Customer changed password from dashboard.',
    });

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (err: any) {
    console.error('Change Password Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to change password.' },
      { status: 500 }
    );
  }
}
