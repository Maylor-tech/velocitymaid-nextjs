import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { jobBranchWhere } from '@/lib/auth/adminJobAccess';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/jobs/counters
 * Returns Today, Upcoming, and Needs Attention counts for the admin's branch.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const branchWhere = jobBranchWhere(auth, request.nextUrl.searchParams.get('branchId'));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [todayCount, upcomingCount, attentionCount] = await Promise.all([
      prisma.job.count({
        where: {
          ...branchWhere,
          preferredDate: {
            gte: today,
            lt: tomorrow,
          },
          status: { notIn: ['CANCELLED', 'CANCELLED_EMERGENCY'] },
        },
      }),

      prisma.job.count({
        where: {
          ...branchWhere,
          preferredDate: { gte: tomorrow },
          status: { in: ['CONFIRMED', 'ASSIGNED'] },
        },
      }),

      prisma.job.count({
        where: {
          ...branchWhere,
          status: 'CONFIRMED',
          assignedCleanerId: null,
        },
      }),
    ]);

    return NextResponse.json({
      today: todayCount,
      upcoming: upcomingCount,
      attention: attentionCount,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    return NextResponse.json(
      { error: 'Failed to load counters' },
      { status: 500 }
    );
  }
}
