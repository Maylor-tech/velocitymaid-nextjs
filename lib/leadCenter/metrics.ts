import type { PrismaClient } from '@prisma/client';
import type { LeadCenterDashboard } from './types';
import { JobStatus } from '@prisma/client';

function monthBounds(): { start: Date; end: Date } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

/** Dashboard KPIs sourced from Customer + Job tables per spec. */
export async function computeDashboardMetrics(
  prisma: PrismaClient
): Promise<LeadCenterDashboard> {
  const { start, end } = monthBounds();

  const [
    newLeads,
    activeQuotes,
    multiJobCustomers,
    jobsBooked,
    quoteSentCount,
    followUpCount,
    wonCount,
    revenueAgg,
  ] = await Promise.all([
    prisma.customer.count({
      where: { leadStatus: { in: ['NEW', 'INTAKE_RECEIVED'] } },
    }),
    prisma.customer.count({
      where: { leadStatus: { in: ['QUOTE_SENT', 'FOLLOW_UP'] } },
    }),
    prisma.customer.count({
      where: { leadStatus: 'ACTIVE_CLIENT' },
    }),
    prisma.customer.findMany({
      where: {
        Job: { some: { status: 'COMPLETED' } },
      },
      select: {
        id: true,
        leadStatus: true,
        _count: {
          select: {
            Job: { where: { status: 'COMPLETED' } },
          },
        },
      },
    }),
    prisma.job.count({
      where: {
        archivedAt: null,
        status: { in: [JobStatus.CONFIRMED, JobStatus.RECEIVED] },
        OR: [
          { preferredDate: { gte: start, lte: end } },
          { createdAt: { gte: start, lte: end } },
        ],
      },
    }),
    prisma.customer.count({ where: { leadStatus: 'QUOTE_SENT' } }),
    prisma.customer.count({ where: { leadStatus: 'FOLLOW_UP' } }),
    prisma.customer.count({ where: { leadStatus: 'WON' } }),
    prisma.pipelineLead.aggregate({
      where: { stage: { in: ['QUOTE_SENT', 'FOLLOW_UP'] } },
      _sum: { estimatedRevenue: true },
    }),
  ]);

  const recurringFromJobs = multiJobCustomers.filter((c) => c._count.Job >= 2).length;
  const recurringIds = new Set(
    multiJobCustomers.filter((c) => c._count.Job >= 2).map((c) => c.id)
  );
  const activeClientIds = await prisma.customer.findMany({
    where: { leadStatus: 'ACTIVE_CLIENT' },
    select: { id: true },
  });
  for (const c of activeClientIds) recurringIds.add(c.id);
  const recurringClients = recurringIds.size;

  const quoteDenom = quoteSentCount + followUpCount + wonCount;
  const conversionRate =
    quoteDenom > 0 ? Math.round((wonCount / quoteDenom) * 100) : null;

  const revenuePipeline = Number(revenueAgg._sum.estimatedRevenue ?? 0);

  return {
    newLeads,
    activeQuotes,
    recurringClients,
    jobsBooked,
    conversionRate,
    revenuePipeline,
  };
}
