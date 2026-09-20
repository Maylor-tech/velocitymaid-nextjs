export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { JobStatus } from '@prisma/client';
import { getCustomerSession } from '@/lib/customerSession';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { isTipPaidOut, isTipPending, isTipReceived } from '@/lib/tips/statuses';
import { memberDisplayName } from '@/lib/cleaners/teamDisplay';

/**
 * GET /api/customer/tips/eligible-jobs
 *
 * Last completed Prisma jobs for the authenticated host/customer that can open
 * the canonical /tip?jobId= flow. Uses Job.id (not Stripe session ids).
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'CUSTOMER');
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found after authentication' },
        { status: 401 }
      );
    }

    const jobs = await prisma.job.findMany({
      where: {
        customerId: session.customerId,
        status: JobStatus.COMPLETED,
        archivedAt: null,
      },
      select: {
        id: true,
        preferredDate: true,
        serviceType: true,
        address: true,
        assignedCleanerId: true,
        User: {
          select: {
            id: true,
            name: true,
            CleanerProfile: { select: { publicDisplayName: true } },
          },
        },
        Property: { select: { name: true, address: true } },
        Tip: {
          select: { amount: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { preferredDate: 'desc' },
      take: 10,
    });

    const eligibleJobs = jobs.map((job) => {
      const settled = job.Tip.find(
        (t) =>
          isTipReceived(t.status) ||
          isTipPaidOut(t.status) ||
          isTipPending(t.status)
      );
      const cleanerName = job.User
        ? memberDisplayName({
            id: job.User.id,
            name: job.User.name,
            publicDisplayName: job.User.CleanerProfile?.publicDisplayName,
          })
        : 'Cleaner';

      return {
        jobId: job.id,
        date: job.preferredDate?.toISOString() || '',
        serviceType: job.serviceType || 'Cleaning',
        cleanerName,
        cleanerId: job.assignedCleanerId,
        address:
          job.Property?.name ||
          job.Property?.address ||
          job.address ||
          'Address not provided',
        alreadyTipped: Boolean(settled),
        tipAmount: settled ? settled.amount / 100 : null,
      };
    });

    return NextResponse.json({
      success: true,
      jobs: eligibleJobs,
      count: eligibleJobs.length,
    });
  } catch (error: unknown) {
    if (error instanceof Response) return error;
    console.error('Get eligible jobs error:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'Failed to fetch eligible jobs',
      },
      { status: 500 }
    );
  }
}
