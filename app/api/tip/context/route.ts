export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { getTipJobDisplayContext } from '@/lib/tips/tipJobContext';
import { TipBeneficiaryError } from '@/lib/tips/beneficiary';

/**
 * GET /api/tip/context?jobId=
 *
 * Authenticated CUSTOMER tip display context for the host portal.
 * Ownership is verified before eligibility / metadata are returned.
 * Response omits jobId (client already has it). No owner PII, access codes,
 * cleaner contact info, or other jobs.
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'CUSTOMER');
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Customer authentication required' },
        { status: 401 }
      );
    }

    const jobId = request.nextUrl.searchParams.get('jobId')?.trim();
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'jobId is required.', code: 'JOB_REQUIRED' },
        { status: 400 }
      );
    }

    const ownership = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, customerId: true },
    });

    // Fail closed: do not confirm existence of another customer's job.
    if (!ownership || ownership.customerId !== session.customerId) {
      return NextResponse.json(
        { success: false, error: 'Job not found', code: 'JOB_NOT_FOUND' },
        { status: 404 }
      );
    }

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
