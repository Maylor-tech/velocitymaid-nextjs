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
  let admin: Awaited<ReturnType<typeof requireRole>> | null = null;
  try {
    admin = await requireRole(request, 'ADMIN');
  } catch {
    // fall through to cleaner
  }

  if (admin) {
    // A branch-scoped admin (for example a branch manager) may only add
    // photos to jobs in their own branch. The owner account is unscoped.
    if (admin.isBranchScoped) {
      const scopedJob = await prisma.job.findUnique({
        where: { id: jobId },
        select: { id: true, branchId: true },
      });
      if (!scopedJob) {
        throw NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      const allowed = admin.branchIds ?? (admin.branchId ? [admin.branchId] : []);
      if (!allowed.includes(scopedJob.branchId)) {
        throw NextResponse.json(
          { error: 'Forbidden: this job belongs to another branch' },
          { status: 403 }
        );
      }
    }
    return { role: 'ADMIN', userId: admin.userId };
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
