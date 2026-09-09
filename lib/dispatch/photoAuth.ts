import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';

export type PhotoActor = {
  role: 'ADMIN' | 'CLEANER';
  userId: string;
};

/**
 * Photo sign/register require an authenticated admin, or the cleaner currently
 * assigned to the job. A historical ACCEPTED JobOffer is not enough after release.
 */
export async function requirePhotoUploadAccess(
  request: NextRequest,
  jobId: string
): Promise<PhotoActor> {
  try {
    const admin = await requireRole(request, 'ADMIN');
    return { role: 'ADMIN', userId: admin.userId };
  } catch {
    // fall through to cleaner
  }

  const cleaner = await requireRole(request, 'CLEANER');
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true, assignedCleanerId: true },
  });
  if (!job) {
    throw NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  if (job.assignedCleanerId === cleaner.userId) {
    return { role: 'CLEANER', userId: cleaner.userId };
  }

  throw NextResponse.json(
    { error: 'Forbidden: you may only upload photos for jobs assigned to you' },
    { status: 403 }
  );
}
