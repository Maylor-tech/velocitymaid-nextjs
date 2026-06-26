export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { JobStatus, PaymentStatus } from '@prisma/client';
import { requireRole } from '@/lib/auth/requireRole';
import { loadJobTeamBatch } from '@/lib/cleaners/internalCleanerService';
import {
  guestServiceTeamLine,
  mergePrimaryWithTeam,
  memberDisplayName,
  type TeamMemberDisplay,
} from '@/lib/cleaners/teamDisplay';

/**
 * GET /api/customer/jobs
 * 
 * List jobs for the authenticated customer
 * 
 * Query params:
 * - type: 'upcoming' | 'past' | 'all' (default: 'all')
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication and get session
    const auth = await requireRole(request, "CUSTOMER");
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found after authentication' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    // Build where clause
    // 🔐 PHASE M POLICY: Customers only see PAID jobs (payment enforcement)
    const baseWhere = {
      customerId: session.customerId,
      paymentStatus: {
        in: [
          PaymentStatus.DEPOSIT_PAID,
          PaymentStatus.BALANCE_DUE,
          PaymentStatus.PAID,
        ],
      },
    };

    let where: any = { ...baseWhere };

    if (type === 'upcoming') {
      // Show all active bookings: assigned, in progress, and completed awaiting balance
      where = {
        ...baseWhere,
        status: {
          notIn: [JobStatus.CANCELLED, JobStatus.CANCELLED_EMERGENCY],
        },
        NOT: {
          AND: [
            { status: JobStatus.COMPLETED },
            { paymentStatus: PaymentStatus.PAID },
          ],
        },
      };
    } else if (type === 'past') {
      where = {
        ...baseWhere,
        OR: [
          {
            status: JobStatus.COMPLETED,
            paymentStatus: PaymentStatus.PAID,
          },
          {
            status: {
              in: [JobStatus.CANCELLED, JobStatus.CANCELLED_EMERGENCY],
            },
          },
          { paymentStatus: PaymentStatus.REFUNDED },
        ],
      };
    }

    // Get jobs
    let jobs = [];
    try {
      jobs = await prisma.job.findMany({
        where,
        include: {
          Branch: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          User: {
            select: {
              id: true,
              name: true,
              email: true,
              CleanerProfile: {
                select: { publicDisplayName: true },
              },
            },
          },
          CleanerRating: {
            select: {
              rating: true,
              comment: true,
            },
          },
        },
        orderBy: {
          preferredDate: type === 'upcoming' ? 'asc' : 'desc',
        },
        // Handle null preferredDate gracefully - jobs without dates will appear last
      });
    } catch (e) {
      console.error('job.findMany failed', e);
      return NextResponse.json({ success: true, jobs: [], count: 0 });
    }

    // Format response
    const jobIds = jobs.map((j) => j.id);
    const teamMap = await loadJobTeamBatch(jobIds);

    const formattedJobs = jobs.map((job) => {
      // 🔐 PAYMENT TRUTH: Use actual paymentStatus from database (Stripe → webhook → DB)
      // Do NOT infer from job status - payment truth comes from Stripe
      const paymentStatus =
        job.paymentStatus === PaymentStatus.PAID
          ? 'PAID'
          : job.paymentStatus === PaymentStatus.DEPOSIT_PAID
          ? 'DEPOSIT_PAID'
          : job.paymentStatus === PaymentStatus.BALANCE_DUE
          ? 'BALANCE_DUE'
          : job.paymentStatus === PaymentStatus.REFUNDED
          ? 'REFUNDED'
          : job.paymentStatus === PaymentStatus.FAILED
          ? 'UNPAID'
          : 'UNPAID';

      // Generate human-friendly job number
      // Format: VM-XXXXXX (last 6 chars of job ID for now)
      // TODO: Add jobNumber field to Job model for better UX
      const jobNumber = job.id ? `VM-${job.id.slice(-6).toUpperCase()}` : undefined;

      const primaryMember: TeamMemberDisplay | null = job.User
        ? {
            id: job.User.id,
            name: job.User.name,
            publicDisplayName: job.User.CleanerProfile?.publicDisplayName ?? null,
          }
        : null;
      const team = mergePrimaryWithTeam(primaryMember, teamMap.get(job.id) ?? []);

      return {
        id: job.id,
        number: jobNumber,
        status: mapCustomerJobStatus(job.status, job.paymentStatus),
        rawStatus: job.status,
        serviceType: job.serviceType || undefined,
        scheduledDate: job.preferredDate?.toISOString() || undefined,
        timeWindow: job.preferredTime || undefined,
        address: job.address || job.serviceLocation || 'Address not provided',
        price: job.quotedTotal
          ? Number(job.quotedTotal)
          : job.totalPrice
            ? Number(job.totalPrice)
            : null,
        amountPaid: job.amountPaid ? Number(job.amountPaid) : null,
        balanceDue: job.balanceDue ? Number(job.balanceDue) : null,
        depositAmount: job.depositAmount ? Number(job.depositAmount) : null,
        branchName: job.Branch?.name || undefined,
        cleaner: job.User
          ? {
              id: job.User.id,
              name: memberDisplayName({
                id: job.User.id,
                name: job.User.name,
                publicDisplayName: job.User.CleanerProfile?.publicDisplayName,
              }),
              avatarUrl: undefined,
            }
          : null,
        serviceTeamLine: guestServiceTeamLine(team),
        paymentStatus, // Now reflects actual database payment status
        rating: job.CleanerRating
          ? {
              score: job.CleanerRating.rating,
              comment: job.CleanerRating.comment || undefined,
            }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      jobs: formattedJobs,
      count: formattedJobs.length,
    });
  } catch (error: any) {
    console.error('List customer jobs error:', error);
    
    // Handle Prisma connection errors specifically
    if (error.code === 'P1001') {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed. Please try again in a moment.',
        },
        { status: 503 } // Service Unavailable
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch jobs',
      },
      { status: 500 }
    );
  }
}

function mapCustomerJobStatus(
  status: string,
  paymentStatus: PaymentStatus | null
): string {
  if (
    paymentStatus === PaymentStatus.BALANCE_DUE &&
    status === JobStatus.COMPLETED
  ) {
    return 'completed';
  }
  const map: Record<string, string> = {
    [JobStatus.RECEIVED]: 'pending',
    [JobStatus.CONFIRMED]: 'pending',
    [JobStatus.ASSIGNED]: 'assigned',
    [JobStatus.ON_THE_WAY]: 'in_progress',
    [JobStatus.IN_PROGRESS]: 'in_progress',
    [JobStatus.COMPLETED]: 'completed',
    [JobStatus.CANCELLED]: 'cancelled',
    [JobStatus.CANCELLED_EMERGENCY]: 'cancelled',
  };
  return map[status] || status.toLowerCase();
}

