import { prisma } from '@/lib/prisma';
import { decimalToNumber } from '@/lib/invoices/invoiceUtils';
import {
  evaluatePayoutExecutionHold,
  type PayoutHoldDecision,
} from './payoutExecutionGuard';

export type LoadedPayoutExecutionDecision = PayoutHoldDecision & {
  payoutId: string;
  jobId: string;
};

export async function loadPayoutExecutionDecision(
  payoutId: string
): Promise<LoadedPayoutExecutionDecision | null> {
  const payout = await prisma.jobPayout.findUnique({
    where: { id: payoutId },
    select: {
      id: true,
      jobId: true,
      status: true,
      grossAmount: true,
      cleanerAmount: true,
      Job: {
        select: {
          quotedTotal: true,
          Invoice: {
            select: {
              status: true,
              total: true,
            },
          },
        },
      },
    },
  });
  if (!payout) return null;

  const decision = evaluatePayoutExecutionHold({
    payoutId: payout.id,
    jobId: payout.jobId,
    payoutStatus: payout.status,
    payoutGrossAmount: decimalToNumber(payout.grossAmount),
    payoutCleanerAmount: decimalToNumber(payout.cleanerAmount),
    invoiceStatus: payout.Job.Invoice?.status ?? null,
    invoiceTotal: payout.Job.Invoice ? decimalToNumber(payout.Job.Invoice.total) : null,
    jobQuotedTotal: payout.Job.quotedTotal != null ? decimalToNumber(payout.Job.quotedTotal) : null,
  });

  return {
    ...decision,
    payoutId: payout.id,
    jobId: payout.jobId,
  };
}
