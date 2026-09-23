import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/server/db';
import {
  getAuthenticatedCustomerFromCookies,
  SESSION_COOKIE_NAME,
} from '@/lib/server/security';

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedCustomerFromCookies();
    if (auth) {
      await db.deleteCustomerSessions(auth.customerId);
      await db.createAuditLog({
        customer_id: auth.customerId,
        action: 'CUSTOMER_LOGOUT',
        ip_address: req.headers.get('x-forwarded-for') || undefined,
        user_agent: req.headers.get('user-agent') || undefined,
        details: 'Customer session terminated cleanly.',
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logged out successfully.',
    });

    // Delete session cookie
    response.cookies.delete(SESSION_COOKIE_NAME);

    return response;
  } catch (err: any) {
    console.error('Logout Error:', err);
    return NextResponse.json({ success: true, message: 'Logged out.' });
  }
}
