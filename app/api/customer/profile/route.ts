import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import {
  getAuthenticatedCustomerFromCookies,
  SESSION_COOKIE_NAME,
} from '@/lib/server/security';
import { maskMobileNumber } from '@/lib/server/sms';

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedCustomerFromCookies();
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please login to access your dashboard.' },
        { status: 401 }
      );
    }

    // Strict backend authorization: Retrieve customer record solely by verified session customerId
    const customer = db.findCustomerById(auth.customerId);
    if (!customer) {
      const response = NextResponse.json(
        { success: false, error: 'Customer record no longer exists.' },
        { status: 404 }
      );
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }

    // MANDATORY REQUIREMENT: No customer can access dashboard until mobile verified and status active
    if (customer.mobile_verified === 0 || customer.account_status !== 'ACTIVE') {
      const response = NextResponse.json(
        {
          success: false,
          error: `Dashboard access restricted. Account status: ${customer.account_status}. Mobile verification is required.`,
          requiresVerification: customer.mobile_verified === 0,
        },
        { status: 403 }
      );
      return response;
    }

    // Retrieve recent security logs for this customer
    const logs = db.getRecentAuditLogs(customer.id, 10);

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.id,
        customerCode: customer.customer_code,
        fullName: customer.full_name,
        email: customer.email,
        maskedMobile: maskMobileNumber(customer.mobile),
        rawMobile: customer.mobile,
        accountStatus: customer.account_status,
        mobileVerified: customer.mobile_verified === 1,
        twoFactorEnabled: customer.two_factor_enabled === 1,
        createdAt: customer.created_at,
        updatedAt: customer.updated_at,
        lastLoginAt: customer.last_login_at,
      },
      auditLogs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        details: l.details,
        timestamp: l.created_at,
      })),
    });
  } catch (err: any) {
    console.error('Customer Profile Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve profile.' },
      { status: 500 }
    );
  }
}
