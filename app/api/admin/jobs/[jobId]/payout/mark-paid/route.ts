import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { markJobPayoutPaid } from '@/lib/booking/markJobPayoutPaid';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_METHOD_TYPES = [
  'CASH',
  'ZELLE',
  'VENMO',
  'CASHAPP',
  'BANK',
  'CHECK',
  'MANUAL',
] as const;

/**
 * POST /api/admin/jobs/[jobId]/payout/mark-paid
 *
 * Manual cleaner payout settlement after admin pays outside Stripe Connect.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const jobId = params.jobId;

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        branchId: true,
        JobPayout: { select: { id: true, status: true } },
      },
    });

    if (!job) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    if (auth.branchId && job.branchId !== auth.branchId) {
      return NextResponse.json(
        { success: false, error: 'Job not found' },
        { status: 404 }
      );
    }

    if (!job.JobPayout) {
      return NextResponse.json(
        { success: false, error: 'No payout record exists for this job' },
        { status: 404 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const paidMethodType =
      typeof body.paidMethodType === 'string' ? body.paidMethodType.toUpperCase() : undefined;
    const paidMethodLabel =
      typeof body.paidMethodLabel === 'string' ? body.paidMethodLabel : undefined;
    const reference = typeof body.reference === 'string' ? body.reference : undefined;
    const paidAt = body.paidAt ? new Date(body.paidAt) : undefined;

    if (paidMethodType && !VALID_METHOD_TYPES.includes(paidMethodType as (typeof VALID_METHOD_TYPES)[number])) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid paidMethodType. Use one of: ${VALID_METHOD_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (paidAt && Number.isNaN(paidAt.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid paidAt timestamp' },
        { status: 400 }
      );
    }

    const result = await markJobPayoutPaid({
      payoutId: job.JobPayout.id,
      adminId: auth.userId,
      paidMethodType,
      paidMethodLabel,
      reference,
      paidAt,
    });

    if (!result.ok) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json({
      success: true,
      payout: {
        ...result.payout,
        paidAt: result.payout.paidAt?.toISOString() ?? null,
      },
      message: 'Cleaner payout marked as PAID',
    });
  } catch (error) {
    if (error instanceof NextResponse) return error;
    console.error('[ADMIN_JOB_PAYOUT_MARK_PAID]', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark payout as paid',
      },
      { status: 500 }
    );
  }
}
