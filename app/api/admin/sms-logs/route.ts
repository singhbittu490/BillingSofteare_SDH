import { NextResponse } from 'next/server';
import { getRecentSmsDispatches } from '@/lib/server/sms';

export async function GET() {
  try {
    const dispatches = getRecentSmsDispatches(30);
    return NextResponse.json({
      success: true,
      provider: process.env.SMS_PROVIDER || 'DEVELOPMENT',
      dispatches,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to get SMS logs.' },
      { status: 500 }
    );
  }
}
