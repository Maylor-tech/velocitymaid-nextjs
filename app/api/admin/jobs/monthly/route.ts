export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Admin Monthly Jobs Workspace API
 * GET /api/admin/jobs/monthly
 *
 * Calendar-first period queries with full-set totals and paginated rows.
 * Branch scope enforced from auth — never client-only.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { requireRole } from '@/lib/auth/requireRole';
import { rethrowIfAuthResponse } from '@/lib/api/routeAuth';
import { prisma } from '@/lib/prisma';
import { loadJobTeamBatch } from '@/lib/cleaners/internalCleanerService';
import {
  mergePrimaryWithTeam,
  memberDisplayName,
  teamSubtitle,
  type TeamMemberDisplay,
} from '@/lib/cleaners/teamDisplay';
import {
  addCalendarDayKey,
  easternDateKey,
  parseServiceDateInput,
  serviceDateKey,
} from '@/lib/dates/serviceDate';
import {
  ACTIVE_SCHEDULED_STATUSES,
  CANCELLED_STATUSES,
  clampPage,
  clampPageSize,
  computeMonthlySummary,
  currentMonthKey,
  easternWeekBounds,
  emptyMonthlySummary,
  isDayKey,
  isMonthKey,
  monthDateBounds,
  sortJobsDeterministic,
  type MonthlyFocus,
  type MonthlyWorkspaceView,
} from '@/lib/admin/jobsMonthlyWorkspace';

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

const BRANCH_SLUGS = new Set(['vermont', 'new-jersey']);

const JOB_SELECT = {
  id: true,
  sessionId: true,
  jobReference: true,
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
  billingPolicy: true,
  quotedTotal: true,
  depositAmount: true,
  amountPaid: true,
  balanceDue: true,
  dispatchUrgency: true,
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
  Property: {
    select: {
      id: true,
      name: true,
      address: true,
      guestDisplayName: true,
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
  JobOffer: {
    where: { status: 'OFFERED' as const },
    take: 1,
    select: {
      id: true,
      status: true,
      expiresAt: true,
      Cleaner: { select: { name: true } },
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
} satisfies Prisma.JobSelect;

function parseFocus(raw: string | null): MonthlyFocus {
  const allowed: MonthlyFocus[] = [
    'all',
    'requests',
    'unscheduled',
    'unassigned',
    'qc',
    'completed',
    'cancelled',
    'past_incomplete',
    'archived',
  ];
  return allowed.includes(raw as MonthlyFocus) ? (raw as MonthlyFocus) : 'all';
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, 'ADMIN');
    const { searchParams } = new URL(request.url);
    const now = new Date();

    const view: MonthlyWorkspaceView =
      searchParams.get('view') === 'list' ? 'list' : 'calendar';
    const focus = parseFocus(searchParams.get('focus'));
    const includeArchived =
      searchParams.get('includeArchived') === 'true' || focus === 'archived';
    const page = clampPage(Number(searchParams.get('page')));
    const pageSize = clampPageSize(Number(searchParams.get('pageSize')));

    const monthParam = searchParams.get('month');
    const dayParam = searchParams.get('day');
    const range = searchParams.get('range'); // week | custom | month
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');

    const status = searchParams.get('status');
    const paymentStatus = searchParams.get('paymentStatus');
    const cleanerId = searchParams.get('cleanerId');
    const propertyId = searchParams.get('propertyId');
    const customerId = searchParams.get('customerId') || '';
    const serviceType = searchParams.get('serviceType');
    const search = (searchParams.get('search') || '').trim();
    const unassignedOnly =
      searchParams.get('unassignedOnly') === 'true' ||
      searchParams.get('needsAssignment') === '1' ||
      focus === 'unassigned';

    const branchIdParam = searchParams.get('branchId');
    const branchFilter =
      auth.branchId ??
      (branchIdParam && branchIdParam !== 'all' && branchIdParam !== ''
        ? branchIdParam
        : undefined);

    // Period resolution
    let periodLabel = '';
    const selectedDay = isDayKey(dayParam) ? dayParam : null;
    let monthKey = selectedDay
      ? selectedDay.slice(0, 7)
      : isMonthKey(monthParam)
        ? monthParam
        : currentMonthKey(now);
    let preferredDateFilter: Record<string, unknown> | null = null;
    let unscheduledOnly = focus === 'unscheduled';
    const monthBounds = monthDateBounds(monthKey);
    const monthDateFilter = {
      gte: monthBounds.start,
      lt: monthBounds.endExclusive,
    };

    if (focus === 'unscheduled') {
      preferredDateFilter = null;
      unscheduledOnly = true;
      periodLabel = 'Unscheduled';
    } else if (selectedDay) {
      const dayStart = parseServiceDateInput(selectedDay)!;
      const next = parseServiceDateInput(addCalendarDayKey(selectedDay, 1))!;
      preferredDateFilter = { gte: dayStart, lt: next };
      periodLabel = selectedDay;
    } else if (range === 'week') {
      const week = easternWeekBounds(now);
      preferredDateFilter = { gte: week.start, lt: week.endExclusive };
      monthKey = week.startKey.slice(0, 7);
      periodLabel = `${week.startKey} → ${week.endKeyInclusive}`;
    } else if (
      range === 'custom' &&
      isDayKey(dateFromParam) &&
      isDayKey(dateToParam)
    ) {
      const start = parseServiceDateInput(dateFromParam)!;
      const endExclusive = parseServiceDateInput(dateToParam)!;
      endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
      preferredDateFilter = { gte: start, lt: endExclusive };
      monthKey = dateFromParam.slice(0, 7);
      periodLabel = `${dateFromParam} → ${dateToParam}`;
    } else {
      preferredDateFilter = monthDateFilter;
      periodLabel = monthKey;
    }

    const where: Record<string, unknown> = {};
    const andFilters: Record<string, unknown>[] = [];

    if (!includeArchived) {
      where.archivedAt = null;
    } else if (focus === 'archived') {
      where.archivedAt = { not: null };
    }

    if (unscheduledOnly) {
      where.preferredDate = null;
    } else if (preferredDateFilter) {
      where.preferredDate = preferredDateFilter;
    }

    if (branchFilter) {
      if (BRANCH_SLUGS.has(branchFilter)) {
        where.Branch = { slug: branchFilter };
      } else {
        where.branchId = branchFilter;
      }
    }

    if (focus === 'requests') {
      where.status = 'RECEIVED';
    } else if (focus === 'qc') {
      where.status = 'AWAITING_QC';
    } else if (focus === 'completed') {
      where.status = 'COMPLETED';
    } else if (focus === 'cancelled') {
      where.status = { in: [...CANCELLED_STATUSES] };
    } else if (focus === 'past_incomplete') {
      const todayStart = parseServiceDateInput(easternDateKey(now))!;
      where.status = {
        notIn: ['COMPLETED', ...CANCELLED_STATUSES],
      };
      where.preferredDate = { lt: todayStart };
    } else if (status && status !== 'all') {
      where.status = status;
    }

    if (paymentStatus && paymentStatus !== 'all') {
      where.paymentStatus = paymentStatus;
    }

    if (cleanerId) {
      where.assignedCleanerId = cleanerId;
    } else if (unassignedOnly) {
      where.assignedCleanerId = null;
      if (!where.status && focus === 'unassigned') {
        where.status = { in: [...ACTIVE_SCHEDULED_STATUSES] };
      }
    }

    if (propertyId) where.propertyId = propertyId;
    if (customerId) where.customerId = customerId;
    if (serviceType && serviceType !== 'all') {
      where.serviceType = { contains: serviceType, mode: 'insensitive' };
    }

    if (search) {
      andFilters.push({
        OR: [
          { customerName: { contains: search, mode: 'insensitive' } },
          { address: { contains: search, mode: 'insensitive' } },
          { serviceLocation: { contains: search, mode: 'insensitive' } },
          { jobReference: { contains: search, mode: 'insensitive' } },
          { id: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (andFilters.length === 1) {
      Object.assign(where, andFilters[0]);
    } else if (andFilters.length > 1) {
      where.AND = andFilters;
    }

    // Full-set lightweight rows for accurate summary + day counts
    const summaryRows = await prisma.job.findMany({
      where,
      select: {
        id: true,
        status: true,
        preferredDate: true,
        preferredTime: true,
        assignedCleanerId: true,
        totalPrice: true,
        quotedTotal: true,
        archivedAt: true,
      },
      orderBy: [
        { preferredDate: 'asc' },
        { preferredTime: 'asc' },
        { id: 'asc' },
      ],
    });

    const summaryInput = summaryRows.map((j) => ({
      status: j.status,
      preferredDate: j.preferredDate ? j.preferredDate.toISOString() : null,
      assignedCleanerId: j.assignedCleanerId,
      totalPrice: j.totalPrice ? Number(j.totalPrice) : null,
      quotedTotal: j.quotedTotal ? Number(j.quotedTotal) : null,
      archivedAt: j.archivedAt?.toISOString() ?? null,
    }));

    const summary = computeMonthlySummary(summaryInput, now);
    if (summaryRows.length === 0) {
      Object.assign(summary, emptyMonthlySummary());
    }

    // Month-level calendar markers stay on the full month even when a day is selected.
    const calendarMonthBounds = monthDateBounds(monthKey);
    const useListRowsForCalendar =
      unscheduledOnly ||
      focus === 'past_incomplete' ||
      range === 'week' ||
      range === 'custom' ||
      !selectedDay;

    const monthRows = useListRowsForCalendar
      ? summaryRows
      : await prisma.job.findMany({
          where: {
            ...where,
            preferredDate: {
              gte: calendarMonthBounds.start,
              lt: calendarMonthBounds.endExclusive,
            },
          },
          select: { preferredDate: true },
        });

    const dayCounts: Record<string, number> = {};
    for (const row of monthRows) {
      if (!row.preferredDate) continue;
      const key = serviceDateKey(row.preferredDate);
      if (!key) continue;
      dayCounts[key] = (dayCounts[key] ?? 0) + 1;
    }
    const monthJobTotal = Object.values(dayCounts).reduce((s, n) => s + n, 0);

    const total = summaryRows.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const sortedIds = sortJobsDeterministic(
      summaryRows.map((j) => ({
        id: j.id,
        preferredDate: j.preferredDate
          ? serviceDateKey(j.preferredDate) ?? j.preferredDate.toISOString()
          : null,
        preferredTime: j.preferredTime,
      }))
    );
    const pageIds = sortedIds
      .slice((safePage - 1) * pageSize, safePage * pageSize)
      .map((j) => j.id);

    const jobs = await prisma.job.findMany({
      where: { id: { in: pageIds } },
      select: JOB_SELECT,
    });

    // Preserve deterministic order
    const byId = new Map(jobs.map((j) => [j.id, j]));
    const orderedJobs = pageIds
      .map((id) => byId.get(id))
      .filter((j): j is (typeof jobs)[number] => Boolean(j));

    const jobIds = orderedJobs.map((j) => j.id);

    const [confirmations, auditLogs] = await Promise.all([
      jobIds.length
        ? prisma.auditLog.findMany({
            where: {
              action: 'SCHEDULE_CONFIRMED',
              entityType: 'Job',
              entityId: { in: jobIds },
            },
            select: { entityId: true },
          })
        : Promise.resolve([]),
      jobIds.length
        ? prisma.auditLog.findMany({
            where: {
              entityType: 'Job',
              entityId: { in: jobIds },
              action: { in: [...COMM_ACTIONS] },
            },
            select: { entityId: true, action: true },
          })
        : Promise.resolve([]),
    ]);

    const confirmedSet = new Set(confirmations.map((c) => c.entityId));
    const auditByJob = new Map<string, string[]>();
    for (const log of auditLogs) {
      if (!log.entityId) continue;
      const list = auditByJob.get(log.entityId) ?? [];
      list.push(log.action);
      auditByJob.set(log.entityId, list);
    }

    const formattedJobs = orderedJobs.map((job) => ({
      id: job.id,
      sessionId: job.sessionId,
      jobReference: job.jobReference,
      branchId: job.branchId,
      branch: job.Branch,
      customerId: job.customerId,
      customer: job.Customer,
      customerName: job.customerName,
      property: job.Property
        ? {
            id: job.Property.id,
            name: job.Property.name,
            address: job.Property.address,
            guestDisplayName: job.Property.guestDisplayName,
          }
        : null,
      assignedCleanerId: job.assignedCleanerId,
      assignedCleaner: job.User
        ? {
            id: job.User.id,
            name: job.User.name,
            email: job.User.email,
          }
        : null,
      dispatchUrgency: job.dispatchUrgency,
      openOffer: job.JobOffer[0]
        ? {
            id: job.JobOffer[0].id,
            status: job.JobOffer[0].status,
            expiresAt: job.JobOffer[0].expiresAt.toISOString(),
            cleanerName: job.JobOffer[0].Cleaner.name,
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
      billingPolicy: job.billingPolicy ?? null,
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
      const rawJob = orderedJobs.find((j) => j.id === job.id);
      const primaryMember: TeamMemberDisplay | null = rawJob?.User
        ? {
            id: rawJob.User.id,
            name: rawJob.User.name,
            publicDisplayName:
              rawJob.User.CleanerProfile?.publicDisplayName ?? null,
            jobTitle: rawJob.User.CleanerProfile?.jobTitle ?? null,
            certificationLabel:
              rawJob.User.CleanerProfile?.certificationLabel ?? null,
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

    return NextResponse.json({
      success: true,
      view,
      focus,
      month: monthKey,
      periodLabel,
      day: isDayKey(dayParam) ? dayParam : null,
      jobs: jobsWithTeam,
      summary,
      dayCounts,
      monthJobTotal,
      pagination: {
        page: safePage,
        pageSize,
        total,
        totalPages,
        hasMore: safePage < totalPages,
      },
    });
  } catch (err: unknown) {
    const authResponse = rethrowIfAuthResponse(err);
    if (authResponse) return authResponse;
    console.error('Admin monthly jobs API error:', err);
    return NextResponse.json(
      {
        success: false,
        error: 'Jobs temporarily unavailable',
        jobs: [],
        summary: emptyMonthlySummary(),
        dayCounts: {},
        pagination: { page: 1, pageSize: 50, total: 0, totalPages: 0, hasMore: false },
      },
      { status: 500 }
    );
  }
}
