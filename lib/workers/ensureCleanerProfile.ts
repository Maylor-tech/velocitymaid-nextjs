import { prisma } from '@/lib/prisma';
import { DEFAULT_CLASSIFICATION_STATUS } from '@/lib/workers/classification';

/**
 * Ensure a CleanerProfile row exists for a cleaner User.
 * Never invents address, startDate, agreements, or non-UNRESOLVED classification.
 */
export async function ensureCleanerProfile(userId: string) {
  const existing = await prisma.cleanerProfile.findUnique({ where: { userId } });
  if (existing) return existing;

  return prisma.cleanerProfile.create({
    data: {
      userId,
      classificationStatus: DEFAULT_CLASSIFICATION_STATUS,
    },
  });
}
