export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getTipJobDisplayContext } from '@/lib/tips/tipJobContext';
import { TipBeneficiaryError } from '@/lib/tips/beneficiary';
import { requireCustomerTipJobAccess } from '@/lib/tips/requireCustomerTipJobAccess';

/**
 * GET /api/tip/context?jobId=
 *
 * Authenticated CUSTOMER tip display context for the host portal.
 * Ownership is verified before eligibility / metadata are returned.
 * Response omits jobId (client already has it). No owner PII, access codes,
 * cleaner contact info, or other jobs.
 *
 * Guest tipping by raw Job.id is intentionally unsupported (Phase 1B: stay token).
 */
export async function GET(request: NextRequest) {
  try {
    const jobId = request.nextUrl.searchParams.get('jobId')?.trim();
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId is required.', code: 'JOB_REQUIRED' },
        { status: 400 }
      );
    }

    await requireCustomerTipJobAccess(request, jobId);
    const context = await getTipJobDisplayContext(jobId);
    return NextResponse.json({ success: true, context });
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
