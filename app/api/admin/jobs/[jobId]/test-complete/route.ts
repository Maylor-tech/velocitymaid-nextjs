export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { resolveCompletionPaymentUpdate } from '@/lib/booking/jobPayment';

/**
 * POST /api/admin/jobs/[jobId]/test-complete
 * Development-only shortcut: mark assigned deposit job COMPLETED + BALANCE_DUE.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { success: false, error: 'Not available in production' },
      { status: 403 }
    );
  }

  try {
    await requireRole(request, 'ADMIN');
    const { jobId } = params;

    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    if (!job.assignedCleanerId) {
      return NextResponse.json(
        { success: false, error: 'Assign a cleaner before completing' },
        { status: 400 }
      );
    }

    if (job.status === JobStatus.COMPLETED) {
      return NextResponse.json({
        success: true,
        message: 'Job already completed',
        job,
      });
    }

    const allowed: JobStatus[] = [
      JobStatus.ASSIGNED,
      JobStatus.ON_THE_WAY,
      JobStatus.IN_PROGRESS,
      JobStatus.CONFIRMED,
    ];
    if (!allowed.includes(job.status)) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot test-complete from status ${job.status}`,
        },
        { status: 400 }
      );
    }

    const payout = await prisma.jobPayout.findUnique({
      where: { jobId },
      select: { status: true },
    });

    const paymentUpdate = resolveCompletionPaymentUpdate(
      job.paymentStatus,
      {
        quotedTotal: job.quotedTotal ? Number(job.quotedTotal) : null,
        totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
        amountPaid: job.amountPaid ? Number(job.amountPaid) : null,
      },
      { payoutStatus: payout?.status ?? null }
    );

    const updated = await prisma.job.update({
      where: { id: jobId },
      data: {
        status: JobStatus.COMPLETED,
        completedAt: new Date(),
        ...(paymentUpdate ?? {}),
      },
    });

    return NextResponse.json({
      success: true,
      message: paymentUpdate
        ? 'Job marked COMPLETED with BALANCE_DUE (dev test shortcut)'
        : 'Job marked COMPLETED (dev test shortcut)',
      job: updated,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Test complete failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
