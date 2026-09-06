import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { JobStatus, Prisma } from '@prisma/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const QUERYABLE_JOB_STATUSES = new Set<string>(Object.values(JobStatus));

type AdminJobRow = {
  id: string;
  status: JobStatus;
  customerName: string | null;
  serviceType: string | null;
  preferredDate: Date | null;
  preferredTime: string | null;
  totalPrice: unknown;
  currency: string | null;
  createdAt: Date;
  branchId: string;
  assignedCleanerId: string | null;
  Branch: { id: string; name: string } | null;
  User: { id: string; name: string | null; email: string } | null;
  JobPayout: { id: string; cleanerAmount: unknown; status: string } | null;
};

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, 'ADMIN');
    const { searchParams } = new URL(req.url);

    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');

    const whereClause: Prisma.JobWhereInput = {};
    if (status && QUERYABLE_JOB_STATUSES.has(status)) {
      whereClause.status = status as JobStatus;
    }
    if (branchId) {
      whereClause.branchId = branchId;
    }

    const jobs: AdminJobRow[] = await prisma.job.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        customerName: true,
        serviceType: true,
        preferredDate: true,
        preferredTime: true,
        totalPrice: true,
        currency: true,
        createdAt: true,
        branchId: true,
        assignedCleanerId: true,
        Branch: {
          select: { name: true, id: true },
        },
        User: {
          select: { id: true, name: true, email: true },
        },
        JobPayout: {
          select: {
            id: true,
            cleanerAmount: true,
            status: true,
          },
        },
      },
    });

    const formattedJobs = jobs.map((job) => ({
      ...job,
      totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
      preferredDate: job.preferredDate?.toISOString() || null,
      createdAt: job.createdAt.toISOString(),
      branch: job.Branch,
      assignedCleaner: job.User,
      assignedCleanerName: job.User?.name || null,
      payoutStatus: job.JobPayout?.status ?? null,
      ratingStatus: null,
      JobPayout: job.JobPayout || [],
    }));

    return NextResponse.json({ jobs: formattedJobs });
  } catch (err: unknown) {
    console.error('[ADMIN JOBS] Error:', err);
    const message = err instanceof Error ? err.message : undefined;
    return NextResponse.json(
      {
        error: 'Failed to fetch jobs',
        details: process.env.NODE_ENV === 'development' ? message : undefined,
      },
      { status: 500 }
    );
  }
}
