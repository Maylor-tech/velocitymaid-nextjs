/**
 * Admin Command Center API
 *
 * GET /api/admin/dashboard/command-center
 *
 * Full Daily Operations Command Center payload (action center, KPIs, schedule,
 * AR, leads, portal, cleaners, property alerts, activity, quick actions).
 * Branch-scoped admins receive data filtered to their branchId.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { getOpsCommandCenter } from '@/lib/admin/opsCommandCenter';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const data = await getOpsCommandCenter(auth.branchId ?? null);
    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    console.error('[command-center]', error);
    const message =
      error instanceof Error ? error.message : 'Failed to load command center';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
