import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/jobs/counters
 * Returns Today, Upcoming, and Needs Attention counts for the admin's branch.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'ADMIN');

    if (!auth.branchId) {
      return NextResponse.json(
        { error: 'Branch context required' },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const [todayCount, upcomingCount, attentionCount] = await Promise.all([
      prisma.job.count({
        where: {
          branchId: auth.branchId,
          preferredDate: {
            gte: today,
            lt: tomorrow,
          },
          status: { notIn: ['CANCELLED', 'CANCELLED_EMERGENCY'] },
        },
      }),

      prisma.job.count({
        where: {
          branchId: auth.branchId,
          preferredDate: { gte: tomorrow },
          status: { in: ['CONFIRMED', 'ASSIGNED'] },
        },
      }),

      prisma.job.count({
        where: {
          branchId: auth.branchId,
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
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to load counters' },
      { status: 401 }
    );
  }
}
