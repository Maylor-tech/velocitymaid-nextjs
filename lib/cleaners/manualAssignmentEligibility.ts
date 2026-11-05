import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { APPROVED_CLEANER_APPLICATION_STATUSES } from '@/lib/cleaners/applicationStatus';

export type AssignableCleaner = {
  id: string;
  name: string | null;
  email: string;
};

/**
 * Cleaner checks from POST /api/admin/jobs/manual-assign.
 * Active, approved (or internal), same branch, and Jamaica training when required.
 */
export async function assertManualAssignmentCleaner(input: {
  cleanerId: string;
  jobBranchId: string;
  jobCountry?: string | null;
  jobSlug?: string | null;
}): Promise<AssignableCleaner> {
  const cleaner = await prisma.user.findUnique({
    where: { id: input.cleanerId, role: 'CLEANER' },
    include: {
      UserBranch: {
        include: {
          Branch: { select: { id: true } },
        },
      },
      TrainingStatus: { select: { overallStatus: true } },
      CleanerProfile: { select: { isInternalTeam: true } },
    },
  });

  if (!cleaner) {
    throw NextResponse.json(
      {
        success: false,
        error: 'Cleaner not found or is not a CLEANER',
        code: 'CLEANER_NOT_FOUND',
      },
      { status: 404 }
    );
  }

  if (!cleaner.isActive) {
    throw NextResponse.json(
      {
        success: false,
        error: 'Cleaner is not active and cannot be assigned to jobs',
        code: 'CLEANER_INACTIVE',
      },
      { status: 403 }
    );
  }

  const isInternalTeam = cleaner.CleanerProfile?.isInternalTeam === true;
  const approvedApplication = await prisma.cleanerApplication.findFirst({
    where: {
      email: cleaner.email,
      status: { in: [...APPROVED_CLEANER_APPLICATION_STATUSES] },
    },
  });
  if (!isInternalTeam && !approvedApplication) {
    throw NextResponse.json(
      {
        success: false,
        error: 'Cleaner does not have an approved application',
        code: 'NOT_APPROVED',
      },
      { status: 403 }
    );
  }

  const cleanerBranchIds = [
    cleaner.primaryBranchId,
    ...cleaner.UserBranch.map((membership) => membership.Branch.id),
  ].filter(Boolean) as string[];
  if (!cleanerBranchIds.includes(input.jobBranchId)) {
    throw NextResponse.json(
      {
        success: false,
        error: 'Cleaner must be in the same branch as the job',
        code: 'BRANCH_MISMATCH',
        jobBranchId: input.jobBranchId,
        cleanerBranchIds,
      },
      { status: 400 }
    );
  }

  const isJamaicaBranch =
    input.jobCountry === 'Jamaica' ||
    input.jobCountry === 'JM' ||
    input.jobSlug === 'port-antonio';
  if (isJamaicaBranch && cleaner.TrainingStatus?.overallStatus !== 'PASSED') {
    throw NextResponse.json(
      {
        success: false,
        error: 'Cleaner has not passed required training for Jamaica jobs',
        code: 'TRAINING_REQUIRED',
      },
      { status: 403 }
    );
  }

  return { id: cleaner.id, name: cleaner.name, email: cleaner.email };
}
