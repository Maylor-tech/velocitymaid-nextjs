/**
 * Verify JobChecklistItem migration + idempotent init.
 * Run: npx tsx scripts/verify-job-checklist.ts
 * Requires DATABASE_URL (direct connection recommended for migrations).
 */
import { prisma } from "../lib/prisma";
import {
  ensureJobChecklistInitialized,
  getJobChecklistState,
  updateJobChecklistItem,
} from "../lib/jobs/jobChecklist";
import { CARE_CHECKLIST_TOTAL } from "../lib/brand/careChecklist";

async function main() {
  const job = await prisma.job.findFirst({
    where: { assignedCleanerId: { not: null } },
    select: { id: true, assignedCleanerId: true },
    orderBy: { createdAt: "desc" },
  });

  if (!job?.assignedCleanerId) {
    console.log("SKIP: No assigned job found for integration test.");
    process.exit(0);
  }

  const jobId = job.id;
  const cleanerId = job.assignedCleanerId;

  await ensureJobChecklistInitialized(jobId);
  const first = await getJobChecklistState(jobId);
  if (first.items.length !== CARE_CHECKLIST_TOTAL) {
    throw new Error(
      `Expected ${CARE_CHECKLIST_TOTAL} items, got ${first.items.length}`
    );
  }

  await ensureJobChecklistInitialized(jobId);
  const second = await getJobChecklistState(jobId);
  if (second.items.length !== CARE_CHECKLIST_TOTAL) {
    throw new Error("Duplicate init changed item count");
  }

  const testItemId = first.items[0].checklistItemId;
  await updateJobChecklistItem(jobId, testItemId, true, cleanerId);
  const after = await getJobChecklistState(jobId);
  if (!after.completedIds.includes(testItemId)) {
    throw new Error("PATCH persistence failed");
  }

  await updateJobChecklistItem(jobId, testItemId, false, cleanerId);
  const reverted = await getJobChecklistState(jobId);
  if (reverted.completedIds.includes(testItemId)) {
    throw new Error("Uncheck persistence failed");
  }

  console.log("OK: checklist init idempotent, update/uncheck persisted.");
}

main()
  .catch((e) => {
    console.error("FAIL:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
