/**
 * One read of upcoming jobs for the Daily Operations cards, list, and sidebar.
 * Calendar bounds come from opsCalendar (America/New_York).
 */

import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { businessDateKey, formatServiceDate } from '@/lib/dates/serviceDate';
import { formatUsd } from '@/lib/invoices/invoiceUtils';
import {
  isDashboardSmokeRecord,
  isInNext7Days,
  offerIsOpen,
  opsCalendar,
  opsDeskAction,
  opsRangeStart,
  opsRowAction,
  opsUrgency,
  type OpsCalendar,
  type OpsUrgency,
} from '@/lib/admin/opsDesk';

const CLOSED: JobStatus[] = [JobStatus.CANCELLED, JobStatus.CANCELLED_EMERGENCY];

export type OpsDeskJob = {
  id: string;
  serviceDate: string;
  when: string;
  client: string;
  property: string;
  service: string;
  price: string;
  status: string;
  assigned: boolean;
  urgency: OpsUrgency;
  action: { label: 'Assign cleaner' | 'Send offer' | 'Open'; href: string };
};

export type OpsDesk = {
  calendar: OpsCalendar;
  jobsNeedingAction: number;
  cards: {
    today: number;
    next7Days: number;
    needsCleaner: number;
    waitingOnPayment: number;
    unpaidInvoices: { count: number; total: number; formatted: string } | null;
  };
  lists: {
    today: OpsDeskJob[];
    next7Days: OpsDeskJob[];
    needsCleaner: OpsDeskJob[];
    waitingOnPayment: OpsDeskJob[];
  };
  groups: {
    next48: OpsDeskJob[];
    thisWeek: OpsDeskJob[];
    later: OpsDeskJob[];
  };
  growth: {
    newLeads: number;
    quoteFollowUps: number;
    portalInvites: number;
  };
};

function displayName(job: {
  customerName: string | null;
  Customer: { firstName: string | null; lastName: string | null } | null;
}): string {
  return (
    job.customerName ||
    [job.Customer?.firstName, job.Customer?.lastName].filter(Boolean).join(' ') ||
    'Client'
  );
}

function toRow(
  job: {
    id: string;
    preferredDate: Date | null;
    preferredTime: string | null;
    customerName: string | null;
    address: string | null;
    serviceType: string | null;
    totalPrice: unknown;
    status: string;
    assignedCleanerId: string | null;
    Customer: { firstName: string | null; lastName: string | null } | null;
    Property: { name: string | null } | null;
  },
  calendar: OpsCalendar,
  action: OpsDeskJob['action'],
  serviceDate: string
): OpsDeskJob {
  const dateLabel = formatServiceDate(job.preferredDate, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = job.preferredTime?.trim();
  const price = job.totalPrice == null ? '—' : formatUsd(Number(job.totalPrice));
  return {
    id: job.id,
    serviceDate,
    when: timeLabel ? `${dateLabel} · ${timeLabel} ET` : `${dateLabel} · Time not set`,
    client: displayName(job),
    property: job.Property?.name || job.address || 'Property',
    service: job.serviceType || 'Cleaning',
    price,
    status: job.status,
    assigned: Boolean(job.assignedCleanerId),
    urgency: opsUrgency(serviceDate, calendar),
    action,
  };
}

export async function loadOpsDesk(branchId?: string | null, now: Date = new Date()): Promise<OpsDesk> {
  const calendar = opsCalendar(now);
  const branch = branchId ? { branchId } : {};
  const rangeStart = opsRangeStart(calendar);

  const [jobs, openInvoices, newLeads, quoteFollowUps, invited] = await Promise.all([
    prisma.job.findMany({
      where: {
        ...branch,
        archivedAt: null,
        status: { notIn: CLOSED },
        preferredDate: { gte: rangeStart },
      },
      select: {
        id: true,
        jobReference: true,
        customerName: true,
        address: true,
        preferredDate: true,
        preferredTime: true,
        serviceType: true,
        totalPrice: true,
        status: true,
        paymentStatus: true,
        billingPolicy: true,
        reviewStatus: true,
        assignedCleanerId: true,
        Customer: { select: { firstName: true, lastName: true } },
        Property: { select: { name: true } },
        Invoice: { select: { id: true, invoiceNumber: true } },
        JobOffer: {
          orderBy: { offeredAt: 'desc' },
          take: 8,
          select: { status: true, expiresAt: true },
        },
      },
      orderBy: [{ preferredDate: 'asc' }, { preferredTime: 'asc' }],
    }),
    branchId
      ? Promise.resolve([])
      : prisma.invoice.findMany({
          where: {
            status: { in: ['SENT', 'PARTIALLY_PAID', 'OVERDUE'] },
            balanceDue: { gt: 0 },
          },
          select: {
            invoiceNumber: true,
            clientName: true,
            balanceDue: true,
          },
        }),
    prisma.customer.count({
      where: {
        ...branch,
        archivedAt: null,
        recordKind: 'STANDARD',
        leadStatus: { in: ['NEW', 'INTAKE_RECEIVED'] },
      },
    }),
    prisma.customer.count({
      where: {
        ...branch,
        archivedAt: null,
        recordKind: 'STANDARD',
        leadStatus: { in: ['QUOTE_SENT', 'FOLLOW_UP'] },
      },
    }),
    prisma.customer.findMany({
      where: {
        ...branch,
        archivedAt: null,
        recordKind: 'STANDARD',
        invitedAt: { not: null },
      },
      select: {
        firstName: true,
        lastName: true,
        CustomerLoginToken: { where: { used: true }, select: { id: true }, take: 1 },
      },
      take: 500,
    }),
  ]);

  const visible = jobs.flatMap((job) => {
    const serviceDate = businessDateKey(job.preferredDate);
    if (!serviceDate) return [];
    if (isDashboardSmokeRecord({
      jobReference: job.jobReference,
      invoiceNumber: job.Invoice?.invoiceNumber,
      customerName: job.customerName,
      firstName: job.Customer?.firstName,
      lastName: job.Customer?.lastName,
    })) return [];
    return [{ job, serviceDate }];
  });

  const rows = visible.map(({ job, serviceDate }) => {
    const actionKind = opsDeskAction(job);
    const action = opsRowAction({
      jobId: job.id,
      action: actionKind,
      serviceDate,
      calendar,
      hasOpenOffer: offerIsOpen(job.JobOffer, now),
      invoiceId: job.Invoice?.id,
      branchScoped: Boolean(branchId),
    });
    return { actionKind, row: toRow(job, calendar, action, serviceDate) };
  });

  const today = rows.filter((entry) => entry.row.serviceDate === calendar.today).map((entry) => entry.row);
  const next7Days = rows.filter((entry) => isInNext7Days(entry.row.serviceDate, calendar)).map((entry) => entry.row);
  const needsCleaner = rows.filter((entry) => entry.actionKind === 'needsCleaner').map((entry) => entry.row);
  const waitingOnPayment = rows.filter((entry) => entry.actionKind === 'waitingOnPayment').map((entry) => entry.row);
  const actionable = rows.filter((entry) => entry.actionKind).map((entry) => entry.row);

  const unpaid = openInvoices.filter((invoice) => !isDashboardSmokeRecord({
    invoiceNumber: invoice.invoiceNumber,
    clientName: invoice.clientName,
  }));
  const unpaidTotal = unpaid.reduce((sum, invoice) => sum + Number(invoice.balanceDue), 0);

  const growthCustomers = (countName: { firstName: string | null; lastName: string | null }) =>
    !isDashboardSmokeRecord(countName);

  const portalInvites = invited.filter((customer) => (
    customer.CustomerLoginToken.length === 0 && growthCustomers(customer)
  )).length;

  const smokeLeadNames = await prisma.customer.count({
    where: {
      ...branch,
      archivedAt: null,
      recordKind: 'STANDARD',
      leadStatus: { in: ['NEW', 'INTAKE_RECEIVED', 'QUOTE_SENT', 'FOLLOW_UP'] },
      OR: [
        { firstName: { contains: 'P0E1-SMOKE', mode: 'insensitive' } },
        { lastName: { contains: 'P0E1-SMOKE', mode: 'insensitive' } },
        { firstName: { equals: 'VM', mode: 'insensitive' }, lastName: { contains: 'Hosts Prod QA', mode: 'insensitive' } },
      ],
    },
  });
  const smokeNew = await prisma.customer.count({
    where: {
      ...branch,
      archivedAt: null,
      recordKind: 'STANDARD',
      leadStatus: { in: ['NEW', 'INTAKE_RECEIVED'] },
      OR: [
        { firstName: { contains: 'P0E1-SMOKE', mode: 'insensitive' } },
        { lastName: { contains: 'P0E1-SMOKE', mode: 'insensitive' } },
        { firstName: { equals: 'VM', mode: 'insensitive' }, lastName: { contains: 'Hosts Prod QA', mode: 'insensitive' } },
      ],
    },
  });
  const smokeQuotes = smokeLeadNames - smokeNew;

  return {
    calendar,
    jobsNeedingAction: needsCleaner.length + waitingOnPayment.length,
    cards: {
      today: today.length,
      next7Days: next7Days.length,
      needsCleaner: needsCleaner.length,
      waitingOnPayment: waitingOnPayment.length,
      unpaidInvoices: branchId
        ? null
        : { count: unpaid.length, total: unpaidTotal, formatted: formatUsd(unpaidTotal) },
    },
    lists: { today, next7Days, needsCleaner, waitingOnPayment },
    groups: {
      next48: actionable.filter((job) => job.urgency === 'next48'),
      thisWeek: actionable.filter((job) => job.urgency === 'thisWeek'),
      later: actionable.filter((job) => job.urgency === 'later'),
    },
    growth: {
      newLeads: Math.max(0, newLeads - smokeNew),
      quoteFollowUps: Math.max(0, quoteFollowUps - smokeQuotes),
      portalInvites,
    },
  };
}

export async function countNeedsCleaner(branchId?: string | null, now?: Date): Promise<number> {
  const desk = await loadOpsDesk(branchId, now);
  return desk.cards.needsCleaner;
}
