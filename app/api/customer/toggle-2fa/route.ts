import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { getAuthenticatedCustomerFromCookies } from '@/lib/server/security';

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

    const new2faState = customer.two_factor_enabled === 1 ? 0 : 1;
    await db.updateCustomer(customer.id, {
      two_factor_enabled: new2faState,
    });

    await db.createAuditLog({
      customer_id: customer.id,
      action: new2faState === 1 ? '2FA_ENABLED' : '2FA_DISABLED',
      ip_address: req.headers.get('x-forwarded-for') || undefined,
      user_agent: req.headers.get('user-agent') || undefined,
      details: `Customer toggled Two-Factor Mobile OTP verification to ${
        new2faState === 1 ? 'ENABLED' : 'DISABLED'
      }.`,
    });

    return NextResponse.json({
      success: true,
      twoFactorEnabled: new2faState === 1,
      message:
        new2faState === 1
          ? 'Two-Factor Mobile OTP Verification is now ENABLED for your account logins.'
          : 'Two-Factor Mobile OTP Verification has been DISABLED.',
    });
  } catch (err: any) {
    console.error('Toggle 2FA Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update 2FA setting.' },
      { status: 500 }
    );
  }
}
