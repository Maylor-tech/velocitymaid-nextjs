/**
 * Customer list summaries and the customer overview page.
 * Batched queries only: the list page must not fire queries per customer.
 */
import type { JobStatus, InvoiceStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const OPEN_JOB_STATUSES: JobStatus[] = [
  'RECEIVED',
  'CONFIRMED',
  'ASSIGNED',
  'ON_THE_WAY',
  'IN_PROGRESS',
  'AWAITING_QC',
];
export const CANCELLED_JOB_STATUSES: JobStatus[] = ['CANCELLED', 'CANCELLED_EMERGENCY'];
export const UNPAID_INVOICE_STATUSES: InvoiceStatus[] = ['SENT', 'PARTIALLY_PAID', 'OVERDUE'];

export type PortalStats = {
  portalInviteSent: boolean;
  inviteAccepted: boolean;
  loginCount: number;
  lastPortalLoginAt: string | null;
  invitedAt: string | null;
};

export type CustomerSummary = {
  portal: PortalStats;
  nextCleanDate: string | null;
  lastCleanDate: string | null;
  unpaidTotal: number;
};

/** Start of today as a UTC calendar day (jobs store service days at UTC midnight). */
export function startOfTodayUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const num = (v: unknown) => (v == null ? 0 : Number(v));

/** One set of grouped queries for many customers. */
export async function getCustomerSummaries(
  customers: Array<{ id: string; invitedAt: Date | null }>,
  now = new Date()
): Promise<Map<string, CustomerSummary>> {
  const ids = customers.map((c) => c.id);
  const out = new Map<string, CustomerSummary>();
  if (ids.length === 0) return out;
  const today = startOfTodayUtc(now);

  const [logins, next, last, unpaid] = await Promise.all([
    prisma.customerLoginToken.groupBy({
      by: ['customerId'],
      where: { customerId: { in: ids }, used: true },
      _count: { _all: true },
      _max: { createdAt: true },
    }),
    prisma.job.groupBy({
      by: ['customerId'],
      where: { customerId: { in: ids }, status: { in: OPEN_JOB_STATUSES }, preferredDate: { gte: today } },
      _min: { preferredDate: true },
    }),
    prisma.job.groupBy({
      by: ['customerId'],
      where: { customerId: { in: ids }, status: 'COMPLETED' },
      _max: { preferredDate: true },
    }),
    prisma.invoice.groupBy({
      by: ['customerId'],
      where: { customerId: { in: ids }, status: { in: UNPAID_INVOICE_STATUSES } },
      _sum: { balanceDue: true },
    }),
  ]);

  const byId = <T extends { customerId: string | null }>(rows: T[]) =>
    new Map(rows.filter((r) => r.customerId).map((r) => [r.customerId as string, r]));
  const loginMap = byId(logins);
  const nextMap = byId(next);
  const lastMap = byId(last);
  const unpaidMap = byId(unpaid);

  for (const c of customers) {
    const l = loginMap.get(c.id);
    const count = l?._count._all ?? 0;
    out.set(c.id, {
      portal: {
        portalInviteSent: c.invitedAt != null,
        inviteAccepted: count > 0,
        loginCount: count,
        lastPortalLoginAt: iso(l?._max.createdAt),
        invitedAt: iso(c.invitedAt),
      },
      nextCleanDate: iso(nextMap.get(c.id)?._min.preferredDate),
      lastCleanDate: iso(lastMap.get(c.id)?._max.preferredDate),
      unpaidTotal: num(unpaidMap.get(c.id)?._sum.balanceDue),
    });
  }
  return out;
}

export type OverviewJob = {
  id: string;
  jobReference: string | null;
  date: string | null;
  status: JobStatus;
  paymentStatus: string;
  serviceType: string | null;
  propertyName: string | null;
  cleanerName: string | null;
  price: number | null;
  invoiceNumber: string | null;
  invoiceStatus: string | null;
  flags: string[];
};

export type CustomerOverview = {
  stats: {
    upcoming: number;
    completedThisYear: number;
    billedThisYear: number;
    unpaid: number;
  };
  jobs: { upcoming: OverviewJob[]; past: OverviewJob[]; cancelled: OverviewJob[] };
  properties: Array<{
    id: string;
    name: string;
    address: string;
    bedrooms: number | null;
    bathrooms: number | null;
    upcomingCleans: number;
    feeds: Array<{ source: string; active: boolean; lastSyncedAt: string | null; lastStatus: string | null }>;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    jobDate: string | null;
    total: number;
    balanceDue: number;
    status: string;
    dueDate: string | null;
  }>;
};

/** Pure sorting/flagging step, kept separate so it can be tested without a database. */
export function splitJobs(rows: OverviewJob[], now = new Date()) {
  const today = startOfTodayUtc(now).toISOString();
  const upcoming: OverviewJob[] = [];
  const past: OverviewJob[] = [];
  const cancelled: OverviewJob[] = [];
  for (const j of rows) {
    if (CANCELLED_JOB_STATUSES.includes(j.status)) cancelled.push(j);
    else if (j.status !== 'COMPLETED' && j.date != null && j.date >= today) upcoming.push(j);
    else if (j.status !== 'COMPLETED' && j.date == null) upcoming.push(j);
    else past.push(j);
  }
  const asc = (a: OverviewJob, b: OverviewJob) => (a.date ?? '').localeCompare(b.date ?? '');
  upcoming.sort(asc);
  past.sort((a, b) => asc(b, a));
  cancelled.sort((a, b) => asc(b, a));
  return { upcoming, past, cancelled };
}

export function jobFlags(j: {
  status: JobStatus;
  date: string | null;
  price: number | null;
  hasCleaner: boolean;
  todayIso: string;
}): string[] {
  const flags: string[] = [];
  if (CANCELLED_JOB_STATUSES.includes(j.status)) return flags;
  if (j.price == null || j.price === 0) flags.push('No price set');
  const open = OPEN_JOB_STATUSES.includes(j.status);
  if (open && !j.hasCleaner) flags.push('Needs a cleaner');
  if (open && j.date && j.date < j.todayIso) flags.push('Date has passed');
  return flags;
}

export async function getCustomerOverview(customerId: string, now = new Date()): Promise<CustomerOverview> {
  const today = startOfTodayUtc(now);
  const todayIso = today.toISOString();
  const yearStart = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

  const [jobs, properties, invoices] = await Promise.all([
    prisma.job.findMany({
      where: { customerId },
      orderBy: { preferredDate: 'asc' },
      take: 500,
      select: {
        id: true,
        jobReference: true,
        preferredDate: true,
        status: true,
        paymentStatus: true,
        serviceType: true,
        totalPrice: true,
        quotedTotal: true,
        assignedCleanerId: true,
        propertyId: true,
        Property: { select: { name: true } },
        User: { select: { name: true, email: true } },
        Invoice: { select: { invoiceNumber: true, status: true } },
      },
    }),
    prisma.property.findMany({
      where: { customerId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        address: true,
        bedrooms: true,
        bathrooms: true,
        CalendarFeeds: {
          select: { source: true, active: true, lastSyncedAt: true, lastStatus: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    }),
    prisma.invoice.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        invoiceNumber: true,
        jobDate: true,
        total: true,
        balanceDue: true,
        status: true,
        dueDate: true,
      },
    }),
  ]);

  const rows: OverviewJob[] = jobs.map((j) => {
    const priceRaw = j.totalPrice ?? j.quotedTotal;
    const price = priceRaw == null ? null : Number(priceRaw);
    const date = iso(j.preferredDate);
    return {
      id: j.id,
      jobReference: j.jobReference,
      date,
      status: j.status,
      paymentStatus: j.paymentStatus,
      serviceType: j.serviceType,
      propertyName: j.Property?.name ?? null,
      cleanerName: j.User ? j.User.name || j.User.email : null,
      price,
      invoiceNumber: j.Invoice?.invoiceNumber ?? null,
      invoiceStatus: j.Invoice?.status ?? null,
      flags: jobFlags({ status: j.status, date, price, hasCleaner: Boolean(j.assignedCleanerId), todayIso }),
    };
  });
  const split = splitJobs(rows, now);

  const yearStartIso = yearStart.toISOString();
  const completedThisYear = split.past.filter((j) => j.status === 'COMPLETED' && (j.date ?? '') >= yearStartIso);
  const billedThisYear = invoices
    .filter((i) => i.status !== 'CANCELLED' && i.status !== 'DRAFT' && (i.jobDate ? i.jobDate >= yearStart : true))
    .reduce((s, i) => s + Number(i.total), 0);
  const unpaid = invoices
    .filter((i) => UNPAID_INVOICE_STATUSES.includes(i.status))
    .reduce((s, i) => s + Number(i.balanceDue), 0);

  const upcomingByProperty = new Map<string, number>();
  for (const j of jobs) {
    if (OPEN_JOB_STATUSES.includes(j.status) && j.preferredDate && j.preferredDate >= today && j.propertyId) {
      upcomingByProperty.set(j.propertyId, (upcomingByProperty.get(j.propertyId) ?? 0) + 1);
    }
  }

  return {
    stats: {
      upcoming: split.upcoming.length,
      completedThisYear: completedThisYear.length,
      billedThisYear: Math.round(billedThisYear * 100) / 100,
      unpaid: Math.round(unpaid * 100) / 100,
    },
    jobs: split,
    properties: properties.map((p) => ({
      id: p.id,
      name: p.name,
      address: p.address,
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      upcomingCleans: upcomingByProperty.get(p.id) ?? 0,
      feeds: p.CalendarFeeds.map((f) => ({
        source: f.source,
        active: f.active,
        lastSyncedAt: iso(f.lastSyncedAt),
        lastStatus: f.lastStatus,
      })),
    })),
    invoices: invoices.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      jobDate: iso(i.jobDate),
      total: Number(i.total),
      balanceDue: Number(i.balanceDue),
      status: i.status,
      dueDate: iso(i.dueDate),
    })),
  };
}
