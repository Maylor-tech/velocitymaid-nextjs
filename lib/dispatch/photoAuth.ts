import { NextRequest, NextResponse } from 'next/server';
import { JobOfferStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth/requireRole';

export type PhotoActor = {
  role: 'ADMIN' | 'CLEANER';
  userId: string;
};

/**
 * Photo sign/register require an authenticated admin, or a cleaner who is
 * assigned to the job (or has an ACCEPTED offer). Unauthenticated uploads
 * are rejected.
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

  const accepted = await prisma.jobOffer.findFirst({
    where: {
      jobId,
      cleanerId: cleaner.userId,
      status: JobOfferStatus.ACCEPTED,
    },
    select: { id: true },
  });
  if (accepted) {
    return { role: 'CLEANER', userId: cleaner.userId };
  }

  throw NextResponse.json(
    { error: 'Forbidden: you may only upload photos for jobs assigned to you' },
    { status: 403 }
  );
}
