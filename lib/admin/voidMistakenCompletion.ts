/**
 * Owner-only correction for a job marked COMPLETED by mistake (e.g. a test run).
 * Ordinary cancel refuses COMPLETED on purpose. This path is narrow: it refuses any
 * job with a cleaner payout or money received, records why, and keeps the history.
 */
import { prisma } from '@/lib/prisma';
import { logAuditEntry } from '@/lib/audit';

export class VoidCompletionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export type VoidBlockers = {
  payout: boolean;
  moneyReceived: boolean;
};

/** Pure check, tested without a database. */
export function voidCompletionBlockers(input: {
  status: string;
  hasPayout: boolean;
  jobAmountPaid: number;
  invoiceAmountPaid: number;
  invoicePaymentCount: number;
}): string | null {
  if (input.status !== 'COMPLETED') return 'Only a completed job can be corrected this way.';
  if (input.hasPayout) return 'This job has a cleaner payout, so it cannot be undone here.';
  if (input.jobAmountPaid > 0 || input.invoiceAmountPaid > 0 || input.invoicePaymentCount > 0) {
    return 'Money has been received for this job, so it cannot be undone here.';
  }
  return null;
}

export async function voidMistakenCompletion(params: {
  jobId: string;
  reason: string;
  actorId?: string | null;
  actorEmail?: string | null;
}) {
  const reason = params.reason.trim();
  if (reason.length < 5) throw new VoidCompletionError('Please give a short reason.');

  const job = await prisma.job.findUnique({
    where: { id: params.jobId },
    select: {
      id: true,
      status: true,
      jobReference: true,
      amountPaid: true,
      JobPayout: { select: { id: true } },
      Invoice: { select: { amountPaid: true, _count: { select: { payments: true } } } },
    },
  });
  if (!job) throw new VoidCompletionError('Job not found', 404);

  const blocker = voidCompletionBlockers({
    status: job.status,
    hasPayout: Boolean(job.JobPayout),
    jobAmountPaid: Number(job.amountPaid ?? 0),
    invoiceAmountPaid: Number(job.Invoice?.amountPaid ?? 0),
    invoicePaymentCount: job.Invoice?._count.payments ?? 0,
  });
  if (blocker) throw new VoidCompletionError(blocker, 409);

  const now = new Date();
  const updated = await prisma.job.updateMany({
    where: { id: job.id, status: 'COMPLETED' },
    data: {
      status: 'CANCELLED',
      cancelledAt: now,
      cancellationReason: `Completion undone by owner: ${reason}`,
    },
  });
  if (updated.count !== 1) throw new VoidCompletionError('The job changed while saving. Reload and try again.', 409);

  await logAuditEntry({
    actorId: params.actorId ?? null,
    actorRole: 'ADMIN',
    action: 'JOB_COMPLETION_VOIDED',
    entityType: 'Job',
    entityId: job.id,
    description: `${job.jobReference ?? job.id}: completion undone (${reason})`,
    changes: { from: 'COMPLETED', to: 'CANCELLED', reason, actorEmail: params.actorEmail ?? null },
  });

  return { jobId: job.id, jobReference: job.jobReference };
}
