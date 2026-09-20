export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  getTipJobContext,
} from '@/lib/tips/tipJobContext';
import { TipBeneficiaryError } from '@/lib/tips/beneficiary';

/**
 * GET /api/tip/context?jobId=
 *
 * Public, job-scoped tip display context. Same eligibility as tip create.
 * Does not expose owner identity, access codes, cleaner PII, or other jobs.
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

    const context = await getTipJobContext(jobId);
    return NextResponse.json({ success: true, context });
  } catch (e) {
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
