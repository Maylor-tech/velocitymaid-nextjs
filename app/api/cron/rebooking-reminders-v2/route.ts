export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { verifyCronAuth } from '@/lib/cron/verifyCronAuth';
import {
  authorizeRebookingExecution,
  preflightRebookingExecution,
  rebookingDenialReason,
} from '@/lib/cron/rebookingExecutionControl';

function denied(reason: string) {
  return NextResponse.json({ success: false, authorized: false, reason }, { status: 403 });
}

/**
 * Every gate runs before the delivery module is imported. Runtime identity is
 * read from process.env inside the authorization helpers. Request headers,
 * the body, and the query string are not an identity source.
 */
async function handle(request: NextRequest) {
  const preflight = preflightRebookingExecution();
  const preflightReason = rebookingDenialReason(preflight);
  if (preflightReason) return denied(preflightReason);

  const unauthorized = verifyCronAuth(request);
  if (unauthorized) return unauthorized;

  const decision = await authorizeRebookingExecution();
  const decisionReason = rebookingDenialReason(decision);
  const generation = (decision as { generation?: number }).generation;
  if (decisionReason || !generation) return denied(decisionReason ?? 'generation_invalid');

  const { runAuthorizedRebookingBatch } = await import('@/lib/cron/rebookingV2Run');
  const result = await runAuthorizedRebookingBatch(generation);
  return NextResponse.json(result, { status: result.success ? 200 : 403 });
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
