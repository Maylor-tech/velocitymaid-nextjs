export const dynamic = 'force-dynamic';

/**
 * Get Cleaner Schedule API
 * GET /api/admin/cleaners/[cleanerId]/schedule?weekStart=YYYY-MM-DD
 * 
 * Returns jobs for a cleaner for a specific week
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to get start of week (Sunday)
function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Helper to get end of week (Saturday)
function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { cleanerId: string } }
) {
  try {
    const { cleanerId } = params;
    const { searchParams } = new URL(request.url);
    const weekStartParam = searchParams.get('weekStart');

    const baseDate = weekStartParam ? new Date(weekStartParam) : new Date();
    const from = startOfWeek(baseDate);
    const to = endOfWeek(baseDate);

    const jobs = await prisma.job.findMany({
      where: {
        assignedCleanerId: cleanerId,
        preferredDate: {
          gte: from,
          lte: to,
        },
        status: {
          notIn: ['cancelled'],
        },
      },
      include: {
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { preferredDate: 'asc' },
    });

    // Format jobs for response
    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      preferredDate: job.preferredDate?.toISOString() || null,
      preferredTime: job.preferredTime,
      status: job.status,
      customerName: job.customerName || (job.Customer ? `${job.Customer.firstName} ${job.Customer.lastName}` : null),
      branchName: job.Branch?.name || null,
    }));

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      weekStart: from.toISOString(),
      weekEnd: to.toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching cleaner schedule:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch schedule',
      },
      { status: 500 }
    );
  }
}

