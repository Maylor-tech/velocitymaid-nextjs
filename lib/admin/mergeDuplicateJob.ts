/**
 * "Merge duplicate": two cleans for the same stay. Keep one, cancel the other
 * (normal admin cancellation, so cleaners and the calendar are handled), and move
 * any booking-calendar links over to the clean that stays.
 */
import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { applyAdminTerminalCancellation } from '@/lib/admin/applyAdminTerminalCancellation';
import { awaitJobCalendarCancel } from '@/lib/google/jobGoogleSync';
import { notifyCleanerOfJobCancellation } from '@/lib/notifications/cleanerCancellationEmail';

export class MergeError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const OPEN: JobStatus[] = ['RECEIVED', 'CONFIRMED', 'ASSIGNED'];
export const DUPLICATE_WINDOW_DAYS = 7;

/** Pure: may `dup` be merged into `keep`? Returns the reason it may not, or null. */
export function mergeBlocker(
  dup: { id: string; status: string; propertyId: string | null; amountPaid: number; hasPayout: boolean },
  keep: { id: string; status: string; propertyId: string | null } | null
): string | null {
  if (!keep) return 'The clean to keep was not found.';
  if (dup.id === keep.id) return 'Pick a different clean to keep.';
  if (!dup.propertyId || dup.propertyId !== keep.propertyId) return 'Both cleans must be for the same property.';
  if (!OPEN.includes(dup.status as JobStatus)) return 'Only a clean that has not started can be removed as a duplicate.';
  if (keep.status === 'CANCELLED' || keep.status === 'CANCELLED_EMERGENCY') return 'The clean to keep is cancelled.';
  if (dup.hasPayout || dup.amountPaid > 0) return 'This clean has money or a payout attached, so it cannot be removed here.';
  return null;
}

export async function listDuplicateCandidates(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, propertyId: true, preferredDate: true },
  });
  if (!job?.propertyId || !job.preferredDate) return [];
  const span = DUPLICATE_WINDOW_DAYS * 86400000;
  const rows = await prisma.job.findMany({
    where: {
      id: { not: job.id },
      propertyId: job.propertyId,
      status: { notIn: ['CANCELLED', 'CANCELLED_EMERGENCY'] },
      preferredDate: {
        gte: new Date(job.preferredDate.getTime() - span),
        lte: new Date(job.preferredDate.getTime() + span),
      },
    },
    orderBy: { preferredDate: 'asc' },
    select: { id: true, jobReference: true, preferredDate: true, status: true },
  });
  return rows.map((r) => ({
    id: r.id,
    reference: r.jobReference,
    date: r.preferredDate?.toISOString() ?? null,
    status: r.status,
  }));
}

export async function mergeDuplicateJob(params: { duplicateJobId: string; keepJobId: string; adminId: string | null }) {
  const [dup, keep] = await Promise.all([
    prisma.job.findUnique({
      where: { id: params.duplicateJobId },
      select: { id: true, status: true, propertyId: true, amountPaid: true, jobReference: true, JobPayout: { select: { id: true } } },
    }),
    prisma.job.findUnique({
      where: { id: params.keepJobId },
      select: { id: true, status: true, propertyId: true, jobReference: true },
    }),
  ]);
  if (!dup) throw new MergeError('Job not found', 404);
  const blocker = mergeBlocker(
    { ...dup, amountPaid: Number(dup.amountPaid ?? 0), hasPayout: Boolean(dup.JobPayout) },
    keep
  );
  if (blocker) throw new MergeError(blocker, 409);

  const result = await applyAdminTerminalCancellation({
    jobId: dup.id,
    adminId: params.adminId,
    nextStatus: JobStatus.CANCELLED,
    reasonLabel: `Duplicate of ${keep!.jobReference ?? keep!.id}`,
    reasonCode: 'DUPLICATE',
    auditAction: 'JOB_MERGED_AS_DUPLICATE',
    auditDescription: `${dup.jobReference ?? dup.id} cancelled as a duplicate of ${keep!.jobReference ?? keep!.id}`,
  });

  // Booking-calendar stays that pointed at the duplicate now point at the clean we keep.
  await prisma.calendarFeedEvent.updateMany({ where: { jobId: dup.id }, data: { jobId: keep!.id } });
  await awaitJobCalendarCancel(dup.id);
  if (result.releasedCleanerId) {
    await notifyCleanerOfJobCancellation({ jobId: dup.id, cleanerId: result.releasedCleanerId, triggeredBy: 'admin' }).catch(() => {});
  }
  return { cancelledJobId: dup.id, keptJobId: keep!.id, keptReference: keep!.jobReference };
}
