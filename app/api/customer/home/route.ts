export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { JobStatus, PaymentStatus } from '@prisma/client';
import { getCustomerSession } from '@/lib/customerSession';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { loadJobTeamMembers } from '@/lib/cleaners/internalCleanerService';
import {
  memberDisplayName,
  mergePrimaryWithTeam,
  type TeamMemberDisplay,
} from '@/lib/cleaners/teamDisplay';
import { serializeCompletionReport } from '@/lib/billing/serializeCompletionReport';
import { decimalToNumber } from '@/lib/invoices/invoiceUtils';


function greetingForHour(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function friendlyMessage(firstName: string, hasUpcoming: boolean): string {
  if (hasUpcoming) {
    return `${firstName}, your property is in good hands. Here is what is happening next.`;
  }
  return `${firstName}, welcome back. Book your next service whenever you are ready.`;
}

function mapCustomerStatus(status: JobStatus, paymentStatus: PaymentStatus): string {
  if (paymentStatus === PaymentStatus.BALANCE_DUE && status === JobStatus.COMPLETED) {
    return 'Balance due';
  }
  const labels: Partial<Record<JobStatus, string>> = {
    RECEIVED: 'Received',
    CONFIRMED: 'Confirmed',
    ASSIGNED: 'Team assigned',
    ON_THE_WAY: 'On the way',
    IN_PROGRESS: 'In progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
    CANCELLED_EMERGENCY: 'Cancelled',
  };
  return labels[status] ?? status.replace(/_/g, ' ').toLowerCase();
}

async function enrichTeamMembers(members: TeamMemberDisplay[]) {
  if (members.length === 0) return [];

  const ids = members.map((m) => m.id);
  const [ratings, completedCounts] = await Promise.all([
    prisma.cleanerRating.groupBy({
      by: ['cleanerId'],
      where: { cleanerId: { in: ids } },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.job.groupBy({
      by: ['assignedCleanerId'],
      where: {
        assignedCleanerId: { in: ids },
        status: JobStatus.COMPLETED,
      },
      _count: true,
    }),
  ]);

  const ratingMap = new Map(ratings.map((r) => [r.cleanerId, r._avg.rating]));
  const countMap = new Map(
    completedCounts.map((c) => [c.assignedCleanerId!, c._count])
  );

  return members.map((m) => ({
    id: m.id,
    name: memberDisplayName(m),
    initials: memberDisplayName(m)
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
    jobTitle: m.jobTitle ?? 'Certified Cleaner',
    certificationLabel: m.isCertified
      ? m.certificationLabel || 'VelocityMaid Certified'
      : m.certificationLabel || 'In training',
    isCertified: Boolean(m.isCertified),
    rating: ratingMap.get(m.id) ? Number(ratingMap.get(m.id)!.toFixed(1)) : null,
    completedJobs: countMap.get(m.id) ?? 0,
  }));
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, 'CUSTOMER');
    const session = await getCustomerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await prisma.customer.findUnique({
      where: { id: session.customerId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (!customer) {
      return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 });
    }

    const firstName = customer.firstName?.trim() || 'there';
    const paidFilter = {
      paymentStatus: {
        in: [
          PaymentStatus.DEPOSIT_PAID,
          PaymentStatus.BALANCE_DUE,
          PaymentStatus.PAID,
        ],
      },
    };

    const [nextJob, lastCompletedJob, recentReports, invoiceBalances, jobBalances] =
      await Promise.all([
        prisma.job.findFirst({
          where: {
            customerId: session.customerId,
            ...paidFilter,
            status: { notIn: [JobStatus.CANCELLED, JobStatus.CANCELLED_EMERGENCY] },
            NOT: {
              AND: [
                { status: JobStatus.COMPLETED },
                { paymentStatus: PaymentStatus.PAID },
              ],
            },
          },
          orderBy: [{ preferredDate: 'asc' }, { createdAt: 'desc' }],
          include: {
            User: {
              select: {
                id: true,
                name: true,
                CleanerProfile: { select: { publicDisplayName: true } },
              },
            },
            CompletionReport: { select: { id: true, status: true } },
            photos: { select: { id: true, caption: true } },
            JobChecklistItem: { select: { completed: true } },
          },
        }),
        prisma.job.findFirst({
          where: {
            customerId: session.customerId,
            status: JobStatus.COMPLETED,
            ...paidFilter,
          },
          orderBy: { completedAt: 'desc' },
          select: {
            id: true,
            serviceType: true,
            address: true,
            preferredDate: true,
            preferredTime: true,
          },
        }),
        prisma.completionReport.findMany({
          where: { Job: { customerId: session.customerId } },
          orderBy: { serviceDate: 'desc' },
          take: 3,
        }),
        prisma.invoice.aggregate({
          where: {
            OR: [
              { customerId: session.customerId },
              { Job: { customerId: session.customerId } },
            ],
            balanceDue: { gt: 0 },
            status: { not: 'CANCELLED' },
          },
          _sum: { balanceDue: true },
          _count: true,
        }),
        prisma.job.aggregate({
          where: {
            customerId: session.customerId,
            paymentStatus: PaymentStatus.BALANCE_DUE,
            balanceDue: { gt: 0 },
          },
          _sum: { balanceDue: true },
        }),
      ]);

    const focusJob = nextJob;
    const focusJobId = focusJob?.id ?? lastCompletedJob?.id ?? null;

    let assignedTeam: Awaited<ReturnType<typeof enrichTeamMembers>> = [];
    if (focusJobId) {
      const primary: TeamMemberDisplay | null = focusJob?.User
        ? {
            id: focusJob.User.id,
            name: focusJob.User.name,
            publicDisplayName: focusJob.User.CleanerProfile?.publicDisplayName,
          }
        : null;
      const teamRows = await loadJobTeamMembers(focusJobId);
      assignedTeam = await enrichTeamMembers(mergePrimaryWithTeam(primary, teamRows));
    }

    const invoiceOwed = decimalToNumber(invoiceBalances._sum.balanceDue);
    const jobOwed = decimalToNumber(jobBalances._sum.balanceDue);
    const totalOutstanding = Math.max(invoiceOwed, jobOwed);

    const checklist = focusJob?.JobChecklistItem ?? [];
    const checklistDone =
      checklist.length > 0 && checklist.every((item) => item.completed);
    const photoCount = focusJob?.photos.length ?? 0;
    const hasAfterPhotos = focusJob?.photos.some((p) =>
      (p.caption || '').toLowerCase().includes('after')
    );
    const isCompleted = focusJob?.status === JobStatus.COMPLETED;
    const hasReport = Boolean(focusJob?.CompletionReport);

    const propertyStatus = {
      cleaned: focusJob
        ? [JobStatus.IN_PROGRESS, JobStatus.ON_THE_WAY, JobStatus.COMPLETED].includes(
            focusJob.status
          )
        : false,
      inspected: hasReport || checklistDone,
      photosUploaded: photoCount > 0,
      guestReady:
        isCompleted && (hasReport || checklistDone) && (hasAfterPhotos || photoCount >= 2),
    };

    const hour = new Date().getHours();

    return NextResponse.json({
      success: true,
      customer: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
      },
      welcome: {
        greeting: `${greetingForHour(hour)}, ${firstName}`,
        message: friendlyMessage(firstName, Boolean(nextJob)),
      },
      nextService: nextJob
        ? {
            id: nextJob.id,
            serviceType: nextJob.serviceType || 'Professional cleaning',
            scheduledDate: nextJob.preferredDate?.toISOString() ?? null,
            timeWindow: nextJob.preferredTime ?? null,
            address: nextJob.address || nextJob.serviceLocation || 'Your property',
            status: mapCustomerStatus(nextJob.status, nextJob.paymentStatus),
            rawStatus: nextJob.status,
            teamLine:
              assignedTeam.length > 0
                ? assignedTeam.map((t) => t.name).join(' · ')
                : 'VelocityMaid certified team',
            href: `/customer/jobs/${nextJob.id}`,
          }
        : null,
      lastService: lastCompletedJob
        ? {
            id: lastCompletedJob.id,
            serviceType: lastCompletedJob.serviceType || 'Professional cleaning',
            address: lastCompletedJob.address,
            scheduledDate: lastCompletedJob.preferredDate?.toISOString() ?? null,
          }
        : null,
      outstandingBalance:
        totalOutstanding > 0
          ? {
              total: totalOutstanding,
              formatted: new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(totalOutstanding),
              invoiceCount: invoiceBalances._count,
            }
          : null,
      recentReports: recentReports.map(serializeCompletionReport),
      propertyStatus,
      assignedTeam,
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message = error instanceof Error ? error.message : 'Failed to load home';
    console.error('[customer home]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
