/**
 * Google ReviewRequest send-state helpers.
 * Private ServiceFeedback is separate — do not mix.
 */

import { prisma } from '@/lib/prisma';

export async function findReviewRequestForJob(jobId: string) {
  return prisma.reviewRequest.findFirst({
    where: { jobId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function wasGoogleReviewRequestSent(jobId: string): Promise<boolean> {
  const row = await prisma.reviewRequest.findFirst({
    where: { jobId, sentAt: { not: null } },
    select: { id: true },
  });
  return Boolean(row);
}

/**
 * Persist successful Google review email send.
 * Only stamps rows that still have sentAt = null (idempotent).
 */
export async function stampGoogleReviewRequestSent(
  jobId: string
): Promise<{ stamped: number }> {
  const result = await prisma.reviewRequest.updateMany({
    where: { jobId, sentAt: null },
    data: { sentAt: new Date() },
  });
  return { stamped: result.count };
}
