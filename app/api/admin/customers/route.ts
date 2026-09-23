import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import { maskMobileNumber } from '@/lib/server/sms';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';

    const customers = db.getAllCustomers(query, status);

    // Filter out password hashes and private hashes
    const sanitized = customers.map((c) => ({
      id: c.id,
      customerCode: c.customer_code,
      fullName: c.full_name,
      email: c.email,
      mobile: c.mobile,
      maskedMobile: maskMobileNumber(c.mobile),
      mobileVerified: c.mobile_verified === 1,
      accountStatus: c.account_status,
      twoFactorEnabled: c.two_factor_enabled === 1,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      lastLoginAt: c.last_login_at,
    }));

    return NextResponse.json({
      success: true,
      total: sanitized.length,
      customers: sanitized,
    });
  } catch (err: any) {
    console.error('Admin Customers Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list customers.' },
      { status: 500 }
    );
  }
}
