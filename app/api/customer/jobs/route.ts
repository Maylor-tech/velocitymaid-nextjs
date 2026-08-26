export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCustomerSession } from '@/lib/customerSession';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';
import { loadJobTeamBatch } from '@/lib/cleaners/internalCleanerService';
import { customerJobListWhere } from '@/lib/customer/customerJobList';
import {
  mapServiceStatusToCustomerBadge,
  paymentStatusLabel,
  resolveBillingPolicy,
  serviceStatusLabel,
} from '@/lib/billing/billingPolicy';
import {
  guestServiceTeamLine,
  mergePrimaryWithTeam,
  memberDisplayName,
  type TeamMemberDisplay,
} from '@/lib/cleaners/teamDisplay';

/**
 * GET /api/customer/jobs
 * List jobs for the authenticated customer.
 *
 * Host operational requests (PENDING payment) are included. Visibility is
 * by service lifecycle, not Stripe payment status.
 *
 * Query params: type = 'upcoming' | 'past' | 'all' (default: 'all')
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
    const where = customerJobListWhere(session.customerId, type);

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
      const billingPolicy = resolveBillingPolicy({
        jobPolicy: job.billingPolicy,
      });
      const paymentStatus = job.paymentStatus;

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
        status: mapServiceStatusToCustomerBadge(job.status),
        rawStatus: job.status,
        serviceStatus: job.status,
        serviceStatusLabel: serviceStatusLabel(job.status),
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
        paymentStatus,
        paymentStatusLabel: paymentStatusLabel(paymentStatus, billingPolicy),
        billingPolicy,
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
  } catch (error: unknown) {
    // requireRole throws NextResponse (a Response). Returning it preserves 401/403.
    // `instanceof NextResponse` can fail across bundled copies of next/server;
    // `instanceof Response` is the reliable check (production logged `Response { status: 401 }` then 500).
    if (error instanceof Response) return error;

    console.error('List customer jobs error:', error);

    const prismaCode =
      typeof error === 'object' && error !== null && 'code' in error
        ? (error as { code?: string }).code
        : undefined;

    if (prismaCode === 'P1001') {
      return NextResponse.json(
        {
          success: false,
          error: 'Database connection failed. Please try again in a moment.',
        },
        { status: 503 }
      );
    }

    const message = error instanceof Error ? error.message : 'Failed to fetch jobs';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

