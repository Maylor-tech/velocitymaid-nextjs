import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { getCertificationSummary } from '@/lib/cleaners/trainingProgress';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** GET /api/cleaner/training — module list + certification summary */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireRole(req, 'CLEANER');
    const summary = await getCertificationSummary(auth.userId);
    return NextResponse.json({ success: true, ...summary });
  } catch (error) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    console.error('[CLEANER_TRAINING_LIST]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load training' },
      { status: 500 }
    );
  }
}
