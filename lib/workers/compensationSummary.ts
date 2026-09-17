/**
 * WORKER COMPENSATION SUMMARY — read-only aggregation from JobPayout + Tip.
 * Do not persist these totals on CleanerProfile. Not W-2 / 1099 reporting.
 */

import { prisma } from '@/lib/prisma';
import { JobStatus } from '@prisma/client';
import { isTipPaidOut, isTipReceived, normalizeTipStatus } from '@/lib/tips/statuses';

export type WorkerCompensationSummary = {
  serviceEarnedCents: number;
  servicePaidCents: number;
  tipsEarnedCents: number;
  tipsPaidCents: number;
  totalPaidCents: number;
  outstandingPayableCents: number;
  jobsCompleted: number;
};

function dollarsToCents(value: unknown): number {
  if (value == null) return 0;
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export async function getWorkerCompensationSummary(
  cleanerId: string
): Promise<WorkerCompensationSummary> {
  const [payouts, tips, jobsCompleted] = await Promise.all([
    prisma.jobPayout.findMany({
      where: { cleanerId },
      select: { cleanerAmount: true, status: true },
    }),
    prisma.tip.findMany({
      where: { beneficiaryCleanerId: cleanerId },
      select: { amount: true, status: true },
    }),
    prisma.job.count({
      where: {
        assignedCleanerId: cleanerId,
        status: JobStatus.COMPLETED,
      },
    }),
  ]);

  let serviceEarnedCents = 0;
  let servicePaidCents = 0;
  for (const p of payouts) {
    const cents = dollarsToCents(p.cleanerAmount);
    const status = (p.status || '').toUpperCase();
    if (status === 'CANCELLED' || status === 'VOID' || status === 'FAILED') continue;
    serviceEarnedCents += cents;
    if (status === 'PAID') servicePaidCents += cents;
  }

  let tipsEarnedCents = 0;
  let tipsPaidCents = 0;
  for (const t of tips) {
    const amount = typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0;
    const status = normalizeTipStatus(t.status);
    if (isTipPaidOut(String(status))) {
      tipsEarnedCents += amount;
      tipsPaidCents += amount;
    } else if (isTipReceived(String(status))) {
      tipsEarnedCents += amount;
    }
  }

  const totalPaidCents = servicePaidCents + tipsPaidCents;
  const outstandingPayableCents =
    serviceEarnedCents - servicePaidCents + (tipsEarnedCents - tipsPaidCents);

  return {
    serviceEarnedCents,
    servicePaidCents,
    tipsEarnedCents,
    tipsPaidCents,
    totalPaidCents,
    outstandingPayableCents,
    jobsCompleted,
  };
}
