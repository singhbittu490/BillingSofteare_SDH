import { NextRequest, NextResponse } from 'next/server';
import { db, AccountStatus } from '@/lib/server/db';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const body = await req.json();
    const { customerId, status } = body;

    if (!customerId || !status) {
      return NextResponse.json(
        { success: false, error: 'Customer ID and new status are required.' },
        { status: 400 }
      );
    }

    const validStatuses: AccountStatus[] = ['PENDING_VERIFICATION', 'ACTIVE', 'BLOCKED', 'SUSPENDED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid account status value.' },
        { status: 400 }
      );
    }

    const customer = db.findCustomerById(Number(customerId));
    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found.' },
        { status: 404 }
      );
    }

    const prevStatus = customer.account_status;
    await db.updateCustomer(customer.id, {
      account_status: status as AccountStatus,
      // If manually set to ACTIVE by admin, ensure mobile is marked verified if not already
      mobile_verified: status === 'ACTIVE' ? 1 : customer.mobile_verified,
    });

    // If blocked or suspended, revoke all active sessions immediately
    if (status === 'BLOCKED' || status === 'SUSPENDED') {
      await db.deleteCustomerSessions(customer.id);
    }

    await db.createAuditLog({
      customer_id: customer.id,
      action: `ADMIN_STATUS_CHANGE_${status}`,
      ip_address: ip,
      user_agent: req.headers.get('user-agent') || undefined,
      details: `Administrator changed status from ${prevStatus} to ${status}.`,
    });

    return NextResponse.json({
      success: true,
      message: `Customer ${customer.customer_code} status updated to ${status}.`,
    });
  } catch (err: any) {
    console.error('Update Status Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update status.' },
      { status: 500 }
    );
  }
}
