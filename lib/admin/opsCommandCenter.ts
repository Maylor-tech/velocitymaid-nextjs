/**
 * Daily Operations Command Center — aggregated read model for /admin.
 * No Stripe/booking/payment calculation changes; reuses billing KPI helper.
 */

import {
  JobStatus,
  Prisma,
  type InvoiceStatus,
  type PipelineLeadStage,
} from '@prisma/client';
import { prisma } from '@/lib/prisma';
import {
  addDays,
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
} from '@/lib/admin/dateRanges';
import { getBillingDashboardKpis } from '@/lib/billing/jobCompletionWorkflow';
import { formatUsd } from '@/lib/invoices/invoiceUtils';

const CANCELLED: JobStatus[] = [JobStatus.CANCELLED, JobStatus.CANCELLED_EMERGENCY];
const ACTIVE_JOB: JobStatus[] = Object.values(JobStatus).filter(
  (s) => !CANCELLED.includes(s) && s !== JobStatus.COMPLETED
) as JobStatus[];

/** Active customers for ops metrics — excludes SYSTEM/TEST and archived. */
export const standardActiveCustomerWhere: Prisma.CustomerWhereInput = {
  archivedAt: null,
  recordKind: 'STANDARD',
};

const STANDARD_CUSTOMER = standardActiveCustomerWhere;

export type PropertyAlertCategory =
  | 'Damage'
  | 'Supplies'
  | 'Access'
  | 'Hot tub'
  | 'Trash'
  | 'Maintenance'
  | 'Unresolved';

export type ActionItem = {
  id: string;
  label: string;
  count: number;
  href: string;
  urgency: 'normal' | 'warning' | 'danger';
};

export type OpsCommandCenterPayload = {
  generatedAt: string;
  branchScoped: boolean;
  actionCenter: ActionItem[];
  kpis: {
    jobsThisWeek: number;
    revenueThisMonth: number;
    revenueThisMonthFormatted: string;
    outstandingBalance: number;
    outstandingBalanceFormatted: string;
    outstandingInvoices: number;
    activeClients: number;
    openLeads: number;
    cleanerCoverage: string;
    activeCleaners: number;
    unassignedJobs: number;
  };
  todaySchedule: Array<{
    id: string;
    time: string | null;
    customer: string;
    property: string;
    service: string;
    cleaner: string | null;
    status: string;
    travelZone: string | null;
    assignedCleanerId: string | null;
  }>;
  accountsReceivable: {
    overdue: ArRow[];
    dueToday: ArRow[];
    dueThisWeek: ArRow[];
    recentlyPaid: ArRow[];
  };
  leadPipeline: {
    stages: Array<{ stage: string; count: number }>;
    potentialMonthlyRevenue: number;
    potentialMonthlyRevenueFormatted: string;
    upcoming: Array<{
      id: string;
      name: string;
      stage: string;
      nextActionDate: string | null;
      estimatedRevenue: number | null;
      owner: string | null;
    }>;
  };
  portalAdoption: {
    active: number;
    invited: number;
    neverLoggedIn: number;
    neverInvited: number;
    needsNudge: Array<{
      id: string;
      name: string;
      email: string;
      status: 'invited' | 'never_invited';
    }>;
  };
  cleanerOps: {
    active: number;
    available: number;
    unassignedJobs: number;
    trainingIncomplete: number;
    pendingPayouts: number;
  };
  propertyAlerts: Array<{
    id: string;
    category: PropertyAlertCategory;
    summary: string;
    property: string;
    jobId: string | null;
    createdAt: string;
  }>;
  recentActivity: Array<{
    id: string;
    at: string;
    label: string;
    href?: string;
  }>;
  quickActions: Array<{
    id: string;
    label: string;
    href: string;
    branchScopedAllowed: boolean;
  }>;
};

type ArRow = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  balanceDue: number;
  balanceDueFormatted: string;
  dueDate: string | null;
  status: string;
  href: string;
};

/** Keyword bucket for derived property alerts (no schema change). */
export function categorizePropertyAlertText(
  text: string,
  source: 'issues' | 'supplies' | 'compliance'
): PropertyAlertCategory {
  if (source === 'supplies') return 'Supplies';
  if (source === 'compliance') return 'Damage';

  const t = text.toLowerCase();
  if (/hot\s*tub|spa|jacuzzi/.test(t)) return 'Hot tub';
  if (/trash|garbage|recycling|bin/.test(t)) return 'Trash';
  if (/access|key|lockbox|code|gate|entry/.test(t)) return 'Access';
  if (/damage|broken|crack|leak|stain|chip/.test(t)) return 'Damage';
  if (/supply|supplies|paper|soap|towel|restock/.test(t)) return 'Supplies';
  if (/maintain|repair|hvac|plumbing|appliance/.test(t)) return 'Maintenance';
  return 'Unresolved';
}

export function bucketInvoiceDueDate(
  dueDate: Date | null,
  status: InvoiceStatus,
  now: Date
): 'overdue' | 'dueToday' | 'dueThisWeek' | 'other' {
  if (status === 'OVERDUE') return 'overdue';
  if (!dueDate) return 'other';
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(addDays(todayStart, 6));
  if (dueDate < todayStart) return 'overdue';
  if (dueDate >= todayStart && dueDate <= todayEnd) return 'dueToday';
  if (dueDate > todayEnd && dueDate <= weekEnd) return 'dueThisWeek';
  return 'other';
}

function jobRevenueUsd(totalPrice: unknown, currency: string | null): number {
  if (totalPrice == null) return 0;
  const amount = Number(totalPrice);
  if (!Number.isFinite(amount)) return 0;
  if (currency === 'JMD') return amount * 0.0065;
  return amount;
}

function customerBranchFilter(branchId?: string | null) {
  if (!branchId) return {};
  return { branchId };
}

export async function getOpsCommandCenter(
  branchId?: string | null
): Promise<OpsCommandCenterPayload> {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const in24h = addDays(now, 1);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const branchWhere = branchId ? { branchId } : {};
  const customerBranch = customerBranchFilter(branchId);

  const activeJobWhere = {
    ...branchWhere,
    archivedAt: null,
    status: { in: ACTIVE_JOB },
  };

  const [
    jobsThisWeek,
    monthJobs,
    unassignedJobs,
    jobsNext24h,
    todayJobs,
    activeCleaners,
    cleanerAppsNew,
    trainingIncomplete,
    pendingPayouts,
    billing,
    newLeads,
    quoteFollowUps,
    pipelineStages,
    pipelineRevenue,
    pipelineUpcoming,
    openLeadsCount,
    activeClientRows,
    neverInvitedCount,
    invitedCustomers,
    completionAlerts,
    complianceAlerts,
    recentAudits,
    recentCompletions,
    recentInvoicesSent,
    recentInvites,
    overdueInvoices,
    openInvoices,
    recentlyPaid,
    availableCleaners,
  ] = await Promise.all([
    prisma.job.count({
      where: {
        ...branchWhere,
        archivedAt: null,
        preferredDate: { gte: weekStart, lte: weekEnd },
        status: { notIn: CANCELLED },
      },
    }),
    prisma.job.findMany({
      where: {
        ...branchWhere,
        archivedAt: null,
        status: JobStatus.COMPLETED,
        completedAt: { gte: monthStart },
      },
      select: { totalPrice: true, currency: true, amountPaid: true },
    }),
    prisma.job.count({
      where: {
        ...activeJobWhere,
        assignedCleanerId: null,
        preferredDate: { gte: todayStart },
      },
    }),
    prisma.job.count({
      where: {
        ...activeJobWhere,
        preferredDate: { gte: now, lte: in24h },
      },
    }),
    prisma.job.findMany({
      where: {
        ...branchWhere,
        archivedAt: null,
        preferredDate: { gte: todayStart, lte: todayEnd },
        status: { notIn: CANCELLED },
      },
      select: {
        id: true,
        preferredTime: true,
        customerName: true,
        address: true,
        serviceType: true,
        status: true,
        assignedCleanerId: true,
        User: { select: { name: true, email: true } },
        Customer: { select: { travelZone: true, firstName: true, lastName: true } },
      },
      orderBy: [{ preferredTime: 'asc' }, { createdAt: 'asc' }],
      take: 40,
    }),
    prisma.user.count({
      where: {
        role: 'CLEANER',
        isActive: true,
        isSuspended: false,
        ...(branchId ? { primaryBranchId: branchId } : {}),
      },
    }),
    prisma.cleanerApplication.count({
      where: {
        ...(branchId ? { branchId } : {}),
        status: { in: ['NEW', 'PENDING', 'REVIEWING'] },
      },
    }),
    prisma.trainingStatus.count({
      where: {
        overallStatus: { notIn: ['COMPLETED', 'CERTIFIED'] },
        ...(branchId
          ? { User: { primaryBranchId: branchId } }
          : {}),
      },
    }),
    prisma.jobPayout.count({
      where: {
        status: { in: ['READY', 'PENDING', 'QUEUED'] },
        paidAt: null,
        ...(branchId ? { branchId } : {}),
      },
    }),
    getBillingDashboardKpis(branchId),
    prisma.customer.count({
      where: {
        ...STANDARD_CUSTOMER,
        ...customerBranch,
        leadStatus: { in: ['NEW', 'INTAKE_RECEIVED'] },
      },
    }),
    prisma.customer.count({
      where: {
        ...STANDARD_CUSTOMER,
        ...customerBranch,
        leadStatus: { in: ['QUOTE_SENT', 'FOLLOW_UP'] },
      },
    }),
    prisma.pipelineLead.groupBy({
      by: ['stage'],
      _count: { _all: true },
      where: branchId
        ? { Customer: { branchId } }
        : undefined,
    }),
    prisma.pipelineLead.aggregate({
      where: {
        stage: { in: ['QUOTE_SENT', 'FOLLOW_UP', 'NEW_LEAD'] },
        ...(branchId ? { Customer: { branchId } } : {}),
      },
      _sum: { estimatedRevenue: true },
    }),
    prisma.pipelineLead.findMany({
      where: branchId ? { Customer: { branchId } } : undefined,
      select: {
        id: true,
        name: true,
        stage: true,
        nextActionDate: true,
        estimatedRevenue: true,
      },
      orderBy: [{ nextActionDate: 'asc' }, { updatedAt: 'desc' }],
      take: 8,
    }),
    prisma.customer.count({
      where: {
        ...STANDARD_CUSTOMER,
        ...customerBranch,
        leadStatus: {
          in: ['NEW', 'INTAKE_RECEIVED', 'QUOTE_SENT', 'FOLLOW_UP', 'QUALIFIED'],
        },
      },
    }),
    prisma.job.findMany({
      where: {
        ...branchWhere,
        archivedAt: null,
        customerId: { not: null },
        status: { notIn: CANCELLED },
        Customer: STANDARD_CUSTOMER,
      },
      select: { customerId: true },
      distinct: ['customerId'],
    }),
    prisma.customer.count({
      where: {
        ...STANDARD_CUSTOMER,
        ...customerBranch,
        invitedAt: null,
      },
    }),
    prisma.customer.findMany({
      where: {
        ...STANDARD_CUSTOMER,
        ...customerBranch,
        invitedAt: { not: null },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        invitedAt: true,
        CustomerLoginToken: {
          where: { used: true },
          select: { id: true },
          take: 1,
        },
      },
      take: 500,
    }),
    prisma.completionReport.findMany({
      where: {
        OR: [
          { issuesFound: { not: null } },
          { supplyRequests: { not: null } },
        ],
        ...(branchId ? { Job: { branchId } } : {}),
        createdAt: { gte: addDays(now, -30) },
      },
      select: {
        id: true,
        jobId: true,
        propertyAddress: true,
        issuesFound: true,
        supplyRequests: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
    prisma.complianceIssue.findMany({
      where: {
        status: { in: ['OPEN', 'ESCALATED'] },
        type: 'PROPERTY_DAMAGE',
        ...(branchId ? { job: { branchId } } : {}),
      },
      select: {
        id: true,
        jobId: true,
        reason: true,
        notes: true,
        createdAt: true,
        job: { select: { address: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        action: true,
        entityType: true,
        entityId: true,
        description: true,
        createdAt: true,
      },
    }),
    prisma.job.findMany({
      where: {
        ...branchWhere,
        status: JobStatus.COMPLETED,
        completedAt: { gte: addDays(now, -7) },
      },
      select: {
        id: true,
        customerName: true,
        completedAt: true,
        address: true,
      },
      orderBy: { completedAt: 'desc' },
      take: 8,
    }),
    prisma.invoice.findMany({
      where: {
        sentAt: { gte: addDays(now, -7) },
        ...(branchId ? { Job: { branchId } } : {}),
      },
      select: {
        id: true,
        invoiceNumber: true,
        clientName: true,
        sentAt: true,
      },
      orderBy: { sentAt: 'desc' },
      take: 8,
    }),
    prisma.customer.findMany({
      where: {
        ...STANDARD_CUSTOMER,
        ...customerBranch,
        invitedAt: { gte: addDays(now, -7) },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        invitedAt: true,
      },
      orderBy: { invitedAt: 'desc' },
      take: 8,
    }),
    prisma.invoice.findMany({
      where: {
        status: 'OVERDUE',
        balanceDue: { gt: 0 },
        ...(branchId ? { Job: { branchId } } : {}),
      },
      select: {
        id: true,
        invoiceNumber: true,
        clientName: true,
        balanceDue: true,
        dueDate: true,
        status: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 15,
    }),
    prisma.invoice.findMany({
      where: {
        status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
        balanceDue: { gt: 0 },
        ...(branchId ? { Job: { branchId } } : {}),
      },
      select: {
        id: true,
        invoiceNumber: true,
        clientName: true,
        balanceDue: true,
        dueDate: true,
        status: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 40,
    }),
    prisma.invoice.findMany({
      where: {
        status: 'PAID',
        paidAt: { gte: addDays(now, -14) },
        ...(branchId ? { Job: { branchId } } : {}),
      },
      select: {
        id: true,
        invoiceNumber: true,
        clientName: true,
        balanceDue: true,
        dueDate: true,
        status: true,
        total: true,
        paidAt: true,
      },
      orderBy: { paidAt: 'desc' },
      take: 10,
    }),
    prisma.user.count({
      where: {
        role: 'CLEANER',
        isActive: true,
        isSuspended: false,
        ...(branchId ? { primaryBranchId: branchId } : {}),
        CleanerAvailability: { isNot: null },
      },
    }),
  ]);

  const revenueThisMonth = monthJobs.reduce((sum, j) => {
    const paid = j.amountPaid != null ? Number(j.amountPaid) : null;
    if (paid != null && Number.isFinite(paid)) return sum + paid;
    return sum + jobRevenueUsd(j.totalPrice, j.currency);
  }, 0);

  const invitedNeverLoggedIn = invitedCustomers.filter(
    (c) => c.CustomerLoginToken.length === 0
  );
  const portalActive = invitedCustomers.filter(
    (c) => c.CustomerLoginToken.length > 0
  ).length;

  const dueToday: ArRow[] = [];
  const dueThisWeek: ArRow[] = [];
  const overdueFromOpen: ArRow[] = [];

  const toAr = (inv: {
    id: string;
    invoiceNumber: string;
    clientName: string;
    balanceDue: unknown;
    dueDate: Date | null;
    status: string;
    total?: unknown;
  }): ArRow => {
    const bal =
      inv.status === 'PAID' && inv.total != null
        ? Number(inv.total)
        : Number(inv.balanceDue);
    return {
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      clientName: inv.clientName,
      balanceDue: bal,
      balanceDueFormatted: formatUsd(bal),
      dueDate: inv.dueDate?.toISOString() ?? null,
      status: inv.status,
      href: `/admin/invoices/${inv.id}`,
    };
  };

  for (const inv of openInvoices) {
    const bucket = bucketInvoiceDueDate(
      inv.dueDate,
      inv.status as InvoiceStatus,
      now
    );
    const row = toAr(inv);
    if (bucket === 'overdue') overdueFromOpen.push(row);
    else if (bucket === 'dueToday') dueToday.push(row);
    else if (bucket === 'dueThisWeek') dueThisWeek.push(row);
  }

  const overdueMap = new Map<string, ArRow>();
  for (const inv of overdueInvoices) overdueMap.set(inv.id, toAr(inv));
  for (const row of overdueFromOpen) overdueMap.set(row.id, row);

  const propertyAlerts: OpsCommandCenterPayload['propertyAlerts'] = [];
  for (const r of completionAlerts) {
    if (r.issuesFound?.trim()) {
      propertyAlerts.push({
        id: `cr-issue-${r.id}`,
        category: categorizePropertyAlertText(r.issuesFound, 'issues'),
        summary: r.issuesFound.trim().slice(0, 160),
        property: r.propertyAddress,
        jobId: r.jobId,
        createdAt: r.createdAt.toISOString(),
      });
    }
    if (r.supplyRequests?.trim()) {
      propertyAlerts.push({
        id: `cr-supply-${r.id}`,
        category: categorizePropertyAlertText(r.supplyRequests, 'supplies'),
        summary: r.supplyRequests.trim().slice(0, 160),
        property: r.propertyAddress,
        jobId: r.jobId,
        createdAt: r.createdAt.toISOString(),
      });
    }
  }
  for (const c of complianceAlerts) {
    propertyAlerts.push({
      id: `ci-${c.id}`,
      category: 'Damage',
      summary: (c.notes || c.reason).slice(0, 160),
      property: c.job?.address || 'Property',
      jobId: c.jobId,
      createdAt: c.createdAt.toISOString(),
    });
  }

  const actionCenter: ActionItem[] = [
    {
      id: 'new-leads',
      label: 'New leads not contacted',
      count: newLeads,
      href: '/admin/lead-center',
      urgency: newLeads > 0 ? 'warning' : 'normal',
    },
    {
      id: 'quote-followup',
      label: 'Quotes due for follow-up',
      count: quoteFollowUps,
      href: '/admin/lead-center',
      urgency: quoteFollowUps > 0 ? 'warning' : 'normal',
    },
    {
      id: 'unassigned',
      label: 'Unassigned jobs',
      count: unassignedJobs,
      href: '/admin/jobs?filter=needs',
      urgency: unassignedJobs > 0 ? 'danger' : 'normal',
    },
    {
      id: 'next-24h',
      label: 'Jobs within 24 hours',
      count: jobsNext24h,
      href: '/admin/jobs',
      urgency: jobsNext24h > 0 ? 'warning' : 'normal',
    },
    {
      id: 'ar-due',
      label: 'Due and overdue invoices',
      count: overdueMap.size + dueToday.length,
      href: '/admin/invoices',
      urgency: overdueMap.size > 0 ? 'danger' : dueToday.length > 0 ? 'warning' : 'normal',
    },
    {
      id: 'portal-nudge',
      label: 'Portal invites not opened',
      count: invitedNeverLoggedIn.length,
      href: '/admin/customers',
      urgency: invitedNeverLoggedIn.length > 0 ? 'warning' : 'normal',
    },
    {
      id: 'cleaner-onboarding',
      label: 'Cleaner onboarding / certification',
      count: cleanerAppsNew + trainingIncomplete,
      href: '/admin/cleaners',
      urgency: cleanerAppsNew + trainingIncomplete > 0 ? 'warning' : 'normal',
    },
    {
      id: 'property-alerts',
      label: 'Open property alerts',
      count: propertyAlerts.length,
      href: '#property-alerts',
      urgency: propertyAlerts.length > 0 ? 'warning' : 'normal',
    },
  ];

  const recentActivity: OpsCommandCenterPayload['recentActivity'] = [];
  for (const j of recentCompletions) {
    if (!j.completedAt) continue;
    recentActivity.push({
      id: `job-complete-${j.id}`,
      at: j.completedAt.toISOString(),
      label: `Job completed — ${j.customerName || j.address || 'Property'}`,
      href: `/admin/jobs/${j.id}`,
    });
  }
  for (const inv of recentInvoicesSent) {
    if (!inv.sentAt) continue;
    recentActivity.push({
      id: `inv-sent-${inv.id}`,
      at: inv.sentAt.toISOString(),
      label: `Invoice sent — ${inv.invoiceNumber} (${inv.clientName})`,
      href: `/admin/invoices/${inv.id}`,
    });
  }
  for (const c of recentInvites) {
    if (!c.invitedAt) continue;
    recentActivity.push({
      id: `invite-${c.id}`,
      at: c.invitedAt.toISOString(),
      label: `Portal invited — ${c.firstName} ${c.lastName}`.trim(),
      href: `/admin/customers/${c.id}`,
    });
  }
  for (const a of recentAudits) {
    recentActivity.push({
      id: `audit-${a.id}`,
      at: a.createdAt.toISOString(),
      label: a.description || `${a.action} on ${a.entityType}`,
      href:
        a.entityType === 'Job'
          ? `/admin/jobs/${a.entityId}`
          : a.entityType === 'Customer'
            ? `/admin/customers/${a.entityId}`
            : undefined,
    });
  }
  recentActivity.sort((a, b) => (a.at < b.at ? 1 : -1));

  const stageOrder: PipelineLeadStage[] = [
    'NEW_LEAD',
    'INTAKE_RECEIVED',
    'WALKTHROUGH_SCHEDULED',
    'QUOTE_SENT',
    'FOLLOW_UP',
    'WON',
    'ACTIVE_CLIENT',
  ];
  const stageMap = new Map(
    pipelineStages.map((s) => [s.stage, s._count._all])
  );

  const potential = Number(pipelineRevenue._sum.estimatedRevenue ?? 0);

  return {
    generatedAt: now.toISOString(),
    branchScoped: Boolean(branchId),
    actionCenter,
    kpis: {
      jobsThisWeek,
      revenueThisMonth: Math.round(revenueThisMonth * 100) / 100,
      revenueThisMonthFormatted: formatUsd(revenueThisMonth),
      outstandingBalance: billing.outstandingInvoices.total,
      outstandingBalanceFormatted: formatUsd(billing.outstandingInvoices.total),
      outstandingInvoices: billing.outstandingInvoices.count,
      activeClients: activeClientRows.length,
      openLeads: openLeadsCount,
      cleanerCoverage: `${activeCleaners} active · ${unassignedJobs} unassigned`,
      activeCleaners,
      unassignedJobs,
    },
    todaySchedule: todayJobs.map((j) => ({
      id: j.id,
      time: j.preferredTime,
      customer:
        j.customerName ||
        [j.Customer?.firstName, j.Customer?.lastName].filter(Boolean).join(' ') ||
        '—',
      property: j.address || '—',
      service: j.serviceType || '—',
      cleaner: j.User?.name || j.User?.email || null,
      status: j.status,
      travelZone: j.Customer?.travelZone ?? null,
      assignedCleanerId: j.assignedCleanerId,
    })),
    accountsReceivable: {
      overdue: Array.from(overdueMap.values()).slice(0, 12),
      dueToday: dueToday.slice(0, 12),
      dueThisWeek: dueThisWeek.slice(0, 12),
      recentlyPaid: recentlyPaid.map(toAr),
    },
    leadPipeline: {
      stages: stageOrder.map((stage) => ({
        stage,
        count: stageMap.get(stage) ?? 0,
      })),
      potentialMonthlyRevenue: potential,
      potentialMonthlyRevenueFormatted: formatUsd(potential),
      upcoming: pipelineUpcoming.map((l) => ({
        id: l.id,
        name: l.name,
        stage: l.stage,
        nextActionDate: l.nextActionDate?.toISOString() ?? null,
        estimatedRevenue:
          l.estimatedRevenue != null ? Number(l.estimatedRevenue) : null,
        owner: null,
      })),
    },
    portalAdoption: {
      active: portalActive,
      invited: invitedCustomers.length,
      neverLoggedIn: invitedNeverLoggedIn.length,
      neverInvited: neverInvitedCount,
      needsNudge: [
        ...invitedNeverLoggedIn.slice(0, 8).map((c) => ({
          id: c.id,
          name: `${c.firstName} ${c.lastName}`.trim() || c.email,
          email: c.email,
          status: 'invited' as const,
        })),
      ],
    },
    cleanerOps: {
      active: activeCleaners,
      available: availableCleaners,
      unassignedJobs,
      trainingIncomplete,
      pendingPayouts,
    },
    propertyAlerts: propertyAlerts.slice(0, 20),
    recentActivity: recentActivity.slice(0, 20),
    quickActions: [
      {
        id: 'new-lead',
        label: 'New lead',
        href: '/admin/lead-center',
        branchScopedAllowed: false,
      },
      {
        id: 'new-job',
        label: 'New job',
        href: '/admin/jobs/new',
        branchScopedAllowed: true,
      },
      {
        id: 'create-invoice',
        label: 'Create invoice',
        href: '/admin/invoices/new',
        branchScopedAllowed: false,
      },
      {
        id: 'add-customer',
        label: 'Customers',
        href: '/admin/customers',
        branchScopedAllowed: false,
      },
      {
        id: 'assign-cleaner',
        label: 'Assign cleaner',
        href: '/admin/jobs',
        branchScopedAllowed: true,
      },
      {
        id: 'portal-invite',
        label: 'Portal invites',
        href: '/admin/customers',
        branchScopedAllowed: false,
      },
      {
        id: 'record-payment',
        label: 'Record payment',
        href: '/admin/invoices',
        branchScopedAllowed: false,
      },
      {
        id: 'add-property',
        label: 'Property profile',
        href: '/admin/customers',
        branchScopedAllowed: false,
      },
    ],
  };
}
