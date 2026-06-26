export const runtime = "nodejs";
export const dynamic = 'force-dynamic';

/**
 * Admin Jobs List API
 * GET /api/admin/jobs/list
 *
 * Returns jobs with filters and operations summary for the admin Jobs dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/requireRole';
import { prisma } from '@/lib/prisma';
import { computeOperationsSummary } from '@/lib/admin/jobsOperations';
import { loadJobTeamBatch } from '@/lib/cleaners/internalCleanerService';
import {
  mergePrimaryWithTeam,
  memberDisplayName,
  teamSubtitle,
  type TeamMemberDisplay,
} from '@/lib/cleaners/teamDisplay';

const COMM_ACTIONS = [
  'SCHEDULE_CONFIRMED',
  'ON_THE_WAY_NOTIFICATION_SENT',
  'POST_CLEAN_FEEDBACK_REQUESTED',
  'JOB_COMPLETED',
  'JOB_BOOKING_APPROVED',
  'CHECKOUT_COMPLETED',
  'INVOICE_SENT',
  'PAYMENT_RECEIPT_SENT',
] as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'ADMIN');

    const { searchParams } = new URL(request.url);

    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const cleanerId = searchParams.get('cleanerId');
    const unassignedOnly = searchParams.get('unassignedOnly') === 'true';
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const search = searchParams.get('search') || '';

    const branchIdParam = searchParams.get('branchId');
    const branchFilter =
      auth.branchId ??
      (branchIdParam && branchIdParam !== 'all' && branchIdParam !== ''
        ? branchIdParam
        : undefined);

    const BRANCH_SLUGS = new Set(['vermont', 'new-jersey']);

    const dateFrom = searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!)
      : undefined;

    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!)
      : undefined;

    const where: Record<string, unknown> = {};

    if (!includeArchived) {
      where.archivedAt = null;
    }

    if (branchFilter) {
      if (BRANCH_SLUGS.has(branchFilter)) {
        where.Branch = { slug: branchFilter };
      } else {
        where.branchId = branchFilter;
      }
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      where.paymentStatus = paymentStatus;
    }

    if (cleanerId) {
      where.assignedCleanerId = cleanerId;
    } else if (unassignedOnly) {
      where.assignedCleanerId = null;
    }

    if (dateFrom || dateTo) {
      const preferredDate: Record<string, Date> = {};
      if (dateFrom) {
        dateFrom.setHours(0, 0, 0, 0);
        preferredDate.gte = dateFrom;
      }
      if (dateTo) {
        dateTo.setHours(23, 59, 59, 999);
        preferredDate.lte = dateTo;
      }
      where.preferredDate = preferredDate;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { serviceLocation: { contains: search, mode: 'insensitive' } },
      ];
    }

    const jobs = await prisma.job.findMany({
      where,
      select: {
        id: true,
        sessionId: true,
        branchId: true,
        customerId: true,
        assignedCleanerId: true,
        customerName: true,
        preferredDate: true,
        preferredTime: true,
        serviceType: true,
        serviceLocation: true,
        address: true,
        totalPrice: true,
        currency: true,
        paymentMethod: true,
        jobQualityScore: true,
        appliedReferralCode: true,
        promoApplied: true,
        promoDiscount: true,
        createdAt: true,
        assignedAt: true,
        onTheWayAt: true,
        completedAt: true,
        notifiedAt: true,
        archivedAt: true,
        approvedAt: true,
        depositPaidAt: true,
        paidAt: true,
        status: true,
        paymentStatus: true,
        reviewStatus: true,
        quotedTotal: true,
        depositAmount: true,
        amountPaid: true,
        balanceDue: true,
        Branch: {
          select: {
            id: true,
            name: true,
            slug: true,
            country: true,
            state: true,
          },
        },
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            preferSameCleaner: true,
          },
        },
        User: {
          select: {
            id: true,
            name: true,
            email: true,
            primaryBranchId: true,
            isActive: true,
            TrainingStatus: {
              select: { overallStatus: true },
            },
            CleanerProfile: {
              select: {
                publicDisplayName: true,
                jobTitle: true,
                certificationLabel: true,
              },
            },
          },
        },
        _count: {
          select: {
            photos: true,
            JobChecklistItem: true,
          },
        },
        JobChecklistItem: {
          where: { completed: true },
          select: { id: true },
        },
      },
      orderBy: [
        { preferredDate: 'asc' },
        { createdAt: 'desc' },
      ],
      take: 200,
    });

    const jobIds = jobs.map((j) => j.id);

    const [confirmations, auditLogs, invoiceAgg] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          action: 'SCHEDULE_CONFIRMED',
          entityType: 'Job',
          entityId: { in: jobIds },
        },
        select: { entityId: true },
      }),
      prisma.auditLog.findMany({
        where: {
          entityType: 'Job',
          entityId: { in: jobIds },
          action: { in: [...COMM_ACTIONS] },
        },
        select: { entityId: true, action: true },
      }),
      prisma.invoice.aggregate({
        where: {
          status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
          balanceDue: { gt: 0 },
        },
        _sum: { balanceDue: true },
        _count: true,
      }),
    ]);

    const confirmedSet = new Set(confirmations.map((c) => c.entityId));
    const auditByJob = new Map<string, string[]>();
    for (const log of auditLogs) {
      if (!log.entityId) continue;
      const list = auditByJob.get(log.entityId) ?? [];
      list.push(log.action);
      auditByJob.set(log.entityId, list);
    }

    const formattedJobs = jobs.map((job) => ({
      id: job.id,
      sessionId: job.sessionId,
      branchId: job.branchId,
      branch: job.Branch,
      customerId: job.customerId,
      customer: job.Customer,
      customerName: job.customerName,
      assignedCleanerId: job.assignedCleanerId,
      assignedCleaner: job.User
        ? {
            id: job.User.id,
            name: job.User.name,
            email: job.User.email,
          }
        : null,
      cleanerCertified:
        job.User?.TrainingStatus?.overallStatus === 'PASSED' ||
        job.User?.TrainingStatus?.overallStatus === 'CERTIFIED',
      preferredDate: job.preferredDate?.toISOString() || null,
      preferredTime: job.preferredTime,
      serviceType: job.serviceType,
      serviceLocation: job.serviceLocation,
      address: job.address,
      status: job.status,
      totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
      currency: job.currency,
      paymentMethod: job.paymentMethod,
      paymentStatus: job.paymentStatus ?? 'PENDING',
      reviewStatus: job.reviewStatus ?? 'PENDING',
      quotedTotal: job.quotedTotal ? Number(job.quotedTotal) : null,
      depositAmount: job.depositAmount ? Number(job.depositAmount) : null,
      amountPaid: job.amountPaid ? Number(job.amountPaid) : null,
      balanceDue: job.balanceDue ? Number(job.balanceDue) : null,
      createdAt: job.createdAt.toISOString(),
      assignedAt: job.assignedAt?.toISOString() || null,
      onTheWayAt: job.onTheWayAt?.toISOString() || null,
      completedAt: job.completedAt?.toISOString() || null,
      notifiedAt: job.notifiedAt?.toISOString() || null,
      approvedAt: job.approvedAt?.toISOString() || null,
      depositPaidAt: job.depositPaidAt?.toISOString() || null,
      paidAt: job.paidAt?.toISOString() || null,
      archivedAt: job.archivedAt?.toISOString() || null,
      jobQualityScore: job.jobQualityScore,
      appliedReferralCode: job.appliedReferralCode,
      promoApplied: job.promoApplied,
      promoDiscount: job.promoDiscount ? Number(job.promoDiscount) : null,
      scheduleConfirmed: confirmedSet.has(job.id),
      photoCount: job._count.photos,
      checklistTotal: job._count.JobChecklistItem,
      checklistCompleted: job.JobChecklistItem.length,
      auditActions: auditByJob.get(job.id) ?? [],
    }));

    const teamMap = await loadJobTeamBatch(jobIds);

    const jobsWithTeam = formattedJobs.map((job) => {
      const rawJob = jobs.find((j) => j.id === job.id);
      const primaryMember: TeamMemberDisplay | null = rawJob?.User
        ? {
            id: rawJob.User.id,
            name: rawJob.User.name,
            publicDisplayName: rawJob.User.CleanerProfile?.publicDisplayName ?? null,
            jobTitle: rawJob.User.CleanerProfile?.jobTitle ?? null,
            certificationLabel: rawJob.User.CleanerProfile?.certificationLabel ?? null,
            isCertified:
              rawJob.User.TrainingStatus?.overallStatus === 'PASSED' ||
              (rawJob.User.CleanerProfile?.certificationLabel || '')
                .toLowerCase()
                .includes('certified'),
          }
        : null;

      const team = mergePrimaryWithTeam(primaryMember, teamMap.get(job.id) ?? []);
      const names = team.map(memberDisplayName).filter(Boolean);

      return {
        ...job,
        assignedTeam: team,
        assignedTeamLabel: names.length > 0 ? names.join(' + ') : null,
        assignedTeamSubtitle: teamSubtitle(team),
      };
    });

    const invoiceOutstanding = Number(invoiceAgg._sum.balanceDue ?? 0);
    const invoiceAwaitingCount = invoiceAgg._count;

    const summary = computeOperationsSummary(
      jobsWithTeam,
      invoiceOutstanding,
      invoiceAwaitingCount
    );

    return NextResponse.json({
      success: true,
      jobs: jobsWithTeam,
      summary,
    });
  } catch (err: unknown) {
    console.error('Admin jobs API error:', err);
    return NextResponse.json({
      success: true,
      jobs: [],
      summary: null,
      warning: 'Jobs temporarily unavailable',
    });
  }
}
