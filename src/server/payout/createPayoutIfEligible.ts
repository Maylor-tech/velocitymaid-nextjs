import { prisma } from "@/lib/prisma";
import { calcPayout } from "@/lib/payoutRules";

export async function createPayoutIfEligible(jobId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      status: true,
      totalPrice: true,
      branchId: true,
      assignedCleanerId: true,
    },
  });

  if (!job) return { ok: false, reason: "JOB_NOT_FOUND" };
  if (job.status !== "COMPLETED") return { ok: false, reason: "NOT_COMPLETED" };
  if (!job.assignedCleanerId) return { ok: false, reason: "NO_CLEANER" };

  // Prevent duplicate payout
  const existing = await prisma.jobPayout.findUnique({ where: { jobId } });
  if (existing) return { ok: true, reason: "ALREADY_EXISTS", payoutId: existing.id };

  const grossAmount = job.totalPrice ? Number(job.totalPrice) : 0;
  const { cleanerAmount, platformFee, rulesVersion } = calcPayout(grossAmount);

  const payout = await prisma.jobPayout.create({
    data: {
      jobId: job.id,
      branchId: job.branchId,
      cleanerId: job.assignedCleanerId,
      grossAmount,
      cleanerAmount,
      platformFee,
      currency: "USD",
      status: "READY",
      rulesVersion,
    },
  });

  // Audit
  await prisma.auditLog.create({
    data: {
      entityType: "JobPayout",
      entityId: payout.id,
      action: "PAYOUT_CREATED",
      actorRole: "SYSTEM",
      description: `Payout created for job ${job.id}`,
      changes: { grossAmount, cleanerAmount, platformFee, rulesVersion },
    },
  });

  return { ok: true, reason: "CREATED", payoutId: payout.id };
}














