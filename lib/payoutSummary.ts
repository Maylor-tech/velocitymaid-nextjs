/**
 * Payout Summary Builder
 * 
 * Builds weekly payout summaries for cleaners
 * Groups payouts by cleaner and computes totals
 */

import { prisma } from "./prisma";

export interface PayoutSummaryRow {
  payoutId: string;
  jobId: string;
  status: string;
  amount: number;
  currency: string;
  createdAt: string;
  executedAt: string | null;
  paidAt: string | null;
  executionMethod: string | null;
  paymentMethodType: string | null; // Masked from snapshot
}

export interface CleanerPayoutSummary {
  cleanerId: string;
  cleanerEmail: string;
  cleanerName: string | null;
  dateFrom: Date;
  dateTo: Date;
  totals: {
    paid: number;
    sent: number;
    approved: number;
    pending: number;
    failed: number;
  };
  payouts: PayoutSummaryRow[];
}

export interface WeeklyPayoutSummaryResult {
  summaries: CleanerPayoutSummary[];
  totalCleaners: number;
  totalPayouts: number;
}

/**
 * Build weekly payout summary for all cleaners with payouts in date range
 */
export async function buildWeeklyPayoutSummary({
  dateFrom,
  dateTo,
}: {
  dateFrom: Date;
  dateTo: Date;
}): Promise<WeeklyPayoutSummaryResult> {
  // Fetch all payouts in date range
  const payouts = await prisma.jobPayout.findMany({
    where: {
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    select: {
      id: true,
      jobId: true,
      cleanerId: true,
      cleanerAmount: true,
      currency: true,
      status: true,
      paymentMethodSnapshot: true, // Masked snapshot
      createdAt: true,
      executedAt: true,
      paidAt: true,
      executionMethod: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Get unique cleaner IDs
  const cleanerIds = Array.from(new Set(payouts.map((p) => p.cleanerId)));

  // Fetch cleaner info
  const cleaners = await prisma.user.findMany({
    where: {
      id: { in: cleanerIds },
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });

  const cleanerMap = new Map(cleaners.map((c) => [c.id, c]));

  // Group payouts by cleaner and compute totals
  const summaries: CleanerPayoutSummary[] = [];

  for (const cleaner of cleaners) {
    const cleanerPayouts = payouts.filter((p) => p.cleanerId === cleaner.id);

    if (cleanerPayouts.length === 0) {
      continue; // Skip cleaners with no payouts in range
    }

    // Compute totals by status
    const totals = {
      paid: 0,
      sent: 0,
      approved: 0,
      pending: 0,
      failed: 0,
    };

    const payoutRows: PayoutSummaryRow[] = cleanerPayouts.map((p) => {
      // Extract payment method type from snapshot (masked)
      const snapshot = p.paymentMethodSnapshot as any;
      const paymentMethodType = snapshot?.methodType || null;

      // Update totals
      if (p.status === "PAID") {
        totals.paid += p.cleanerAmount;
      } else if (p.status === "SENT") {
        totals.sent += p.cleanerAmount;
      } else if (p.status === "APPROVED" || p.status === "READY" || p.status === "PENDING") {
        totals.approved += p.cleanerAmount;
      } else if (p.status === "FAILED") {
        totals.failed += p.cleanerAmount;
      }

      return {
        payoutId: p.id,
        jobId: p.jobId,
        status: p.status,
        amount: p.cleanerAmount,
        currency: p.currency,
        createdAt: p.createdAt.toISOString(),
        executedAt: p.executedAt?.toISOString() || null,
        paidAt: p.paidAt?.toISOString() || null,
        executionMethod: p.executionMethod || null,
        paymentMethodType,
      };
    });

    summaries.push({
      cleanerId: cleaner.id,
      cleanerEmail: cleaner.email,
      cleanerName: cleaner.name,
      dateFrom,
      dateTo,
      totals,
      payouts: payoutRows,
    });
  }

  return {
    summaries,
    totalCleaners: summaries.length,
    totalPayouts: payouts.length,
  };
}














