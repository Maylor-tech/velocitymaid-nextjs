import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import type { TeamMemberDisplay } from '@/lib/cleaners/teamDisplay';
import { isCertifiedMember } from '@/lib/cleaners/teamDisplay';

export interface CreateInternalCleanerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  publicDisplayName?: string;
  jobTitle?: string;
  branchId: string;
  serviceAreas?: string[];
  memberStatus?: string;
  certificationLabel?: string;
  internalNotes?: string;
  isInternalTeam?: boolean;
  trainingPassed?: boolean;
}

export async function createInternalCleaner(input: CreateInternalCleanerInput) {
  const email = input.email.trim().toLowerCase();
  const fullName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  const now = new Date();

  const existing = await prisma.user.findUnique({ where: { email } });

  let userId: string;
  if (existing) {
    userId = existing.id;
    await prisma.user.update({
      where: { id: userId },
      data: {
        name: fullName,
        phone: input.phone?.trim() || existing.phone,
        role: 'CLEANER',
        primaryBranchId: input.branchId,
        isActive: input.memberStatus !== 'INACTIVE',
        updatedAt: now,
      },
    });
  } else {
    userId = randomUUID();
    await prisma.user.create({
      data: {
        id: userId,
        email,
        name: fullName,
        phone: input.phone?.trim() || null,
        role: 'CLEANER',
        primaryBranchId: input.branchId,
        isActive: input.memberStatus !== 'INACTIVE',
        updatedAt: now,
      },
    });
  }

  await prisma.userBranch.upsert({
    where: { userId_branchId: { userId, branchId: input.branchId } },
    create: { id: randomUUID(), userId, branchId: input.branchId },
    update: {},
  });

  const trainingStatus = input.trainingPassed ? 'PASSED' : 'PENDING';
  const existingTraining = await prisma.trainingStatus.findUnique({
    where: { cleanerId: userId },
  });
  if (existingTraining) {
    await prisma.trainingStatus.update({
      where: { cleanerId: userId },
      data: { overallStatus: trainingStatus, updatedAt: now },
    });
  } else {
    await prisma.trainingStatus.create({
      data: {
        id: randomUUID(),
        cleanerId: userId,
        overallStatus: trainingStatus,
        updatedAt: now,
      },
    });
  }

  const profile = await prisma.cleanerProfile.upsert({
    where: { userId },
    create: {
      userId,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      publicDisplayName: input.publicDisplayName?.trim() || null,
      jobTitle: input.jobTitle?.trim() || null,
      serviceAreas: input.serviceAreas ?? [],
      memberStatus: input.memberStatus || 'ACTIVE',
      certificationLabel: input.certificationLabel || 'PENDING',
      internalNotes: input.internalNotes?.trim() || null,
      isInternalTeam: input.isInternalTeam ?? false,
    },
    update: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      publicDisplayName: input.publicDisplayName?.trim() || null,
      jobTitle: input.jobTitle?.trim() || null,
      serviceAreas: input.serviceAreas ?? [],
      memberStatus: input.memberStatus || 'ACTIVE',
      certificationLabel: input.certificationLabel || 'PENDING',
      internalNotes: input.internalNotes?.trim() || null,
      isInternalTeam: input.isInternalTeam ?? false,
    },
  });

  return { userId, profile };
}

export async function loadJobTeamMembers(jobId: string): Promise<TeamMemberDisplay[]> {
  const rows = await prisma.jobTeamMember.findMany({
    where: { jobId },
    orderBy: { sortOrder: 'asc' },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          CleanerProfile: {
            select: {
              publicDisplayName: true,
              jobTitle: true,
              certificationLabel: true,
            },
          },
          TrainingStatus: { select: { overallStatus: true } },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.User.id,
    name: row.User.name,
    publicDisplayName: row.User.CleanerProfile?.publicDisplayName,
    jobTitle: row.User.CleanerProfile?.jobTitle,
    certificationLabel: row.User.CleanerProfile?.certificationLabel,
    isCertified:
      row.User.TrainingStatus?.overallStatus === 'PASSED' ||
      isCertifiedMember({
        id: row.User.id,
        name: row.User.name,
        certificationLabel: row.User.CleanerProfile?.certificationLabel ?? null,
      }),
  }));
}

export async function loadJobTeamBatch(
  jobIds: string[]
): Promise<Map<string, TeamMemberDisplay[]>> {
  const map = new Map<string, TeamMemberDisplay[]>();
  if (jobIds.length === 0) return map;

  const rows = await prisma.jobTeamMember.findMany({
    where: { jobId: { in: jobIds } },
    orderBy: { sortOrder: 'asc' },
    include: {
      User: {
        select: {
          id: true,
          name: true,
          CleanerProfile: {
            select: {
              publicDisplayName: true,
              jobTitle: true,
              certificationLabel: true,
            },
          },
          TrainingStatus: { select: { overallStatus: true } },
        },
      },
    },
  });

  for (const row of rows) {
    const list = map.get(row.jobId) ?? [];
    list.push({
      id: row.User.id,
      name: row.User.name,
      publicDisplayName: row.User.CleanerProfile?.publicDisplayName,
      jobTitle: row.User.CleanerProfile?.jobTitle,
      certificationLabel: row.User.CleanerProfile?.certificationLabel,
      isCertified:
        row.User.TrainingStatus?.overallStatus === 'PASSED' ||
        isCertifiedMember({
          id: row.User.id,
          name: row.User.name,
          certificationLabel: row.User.CleanerProfile?.certificationLabel ?? null,
        }),
    });
    map.set(row.jobId, list);
  }

  return map;
}
