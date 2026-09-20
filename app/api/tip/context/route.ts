export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { TipBeneficiaryError } from '@/lib/tips/beneficiary';
import { authorizeTipJobAccess } from '@/lib/tips/authorizeTipJobAccess';
import {
  getGuestTipDisplayContext,
  getTipJobDisplayContext,
} from '@/lib/tips/tipJobContext';

/**
 * GET /api/tip/context?jobId=  (host) OR ?grant=  (guest)
 *
 * Exactly one auth path. Guest grant returns privacy-strict context (no jobReference).
 * Never returns Job.id.
 */
export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId')?.trim() || null;
    const grantToken =
      request.nextUrl.searchParams.get('grant')?.trim() || null;

    const auth = await authorizeTipJobAccess(request, { jobId, grantToken });

    const context =
      auth.mode === 'GUEST_GRANT'
        ? await getGuestTipDisplayContext(auth.jobId)
        : await getTipJobDisplayContext(auth.jobId);

    return NextResponse.json({
      success: true,
      authMode: auth.mode,
      context,
    });
  } catch (e) {
    if (e instanceof Response) return e;
    if (e instanceof TipBeneficiaryError) {
      const status =
        e.code === 'JOB_NOT_FOUND'
          ? 404
          : e.code === 'JOB_NOT_ELIGIBLE' ||
              e.code === 'JOB_NOT_COMPLETED' ||
              e.code === 'NO_SERVICE_EARNER'
            ? 409
            : 400;
      return NextResponse.json(
        { success: false, error: e.message, code: e.code },
        { status }
      );
    }
    console.error('[tip/context]', e);
    return NextResponse.json(
      { success: false, error: 'Failed to load tip context' },
      { status: 500 }
    );
  }
}
