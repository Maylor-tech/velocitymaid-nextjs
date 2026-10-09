import { prisma } from '@/lib/prisma';

export async function ensureAssignedCleanerOnJobTeam(jobId: string): Promise<{
  synced: boolean;
  reason: 'NO_ASSIGNED' | 'ALREADY_ON_TEAM' | 'CREATED';
  cleanerId?: string;
}> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      assignedCleanerId: true,
      JobTeamMember: { select: { cleanerId: true } },
    },
  });

  if (!job?.assignedCleanerId) {
    return { synced: false, reason: 'NO_ASSIGNED' };
  }
  if (job.JobTeamMember.some((member) => member.cleanerId === job.assignedCleanerId)) {
    return { synced: false, reason: 'ALREADY_ON_TEAM', cleanerId: job.assignedCleanerId };
  }

  await prisma.jobTeamMember.create({
    data: {
      jobId,
      cleanerId: job.assignedCleanerId,
      sortOrder: 0,
    },
  });

  return { synced: true, reason: 'CREATED', cleanerId: job.assignedCleanerId };
}
