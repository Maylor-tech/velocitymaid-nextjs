export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Permanently disabled. The production scheduler still calls this path, and
 * the production firewall denies it. This handler does not authenticate, read
 * the ledger, claim a delivery, or call a provider.
 */

import { NextRequest, NextResponse } from 'next/server';
import { rebookingRemindersDisabledResponse } from '@/lib/cron/rebookingReminderGuard';

function disabled() {
  return NextResponse.json(rebookingRemindersDisabledResponse());
}

export async function GET(request: NextRequest) {
  void request;
  return disabled();
}

export async function POST(request: NextRequest) {
  void request;
  return disabled();
}
