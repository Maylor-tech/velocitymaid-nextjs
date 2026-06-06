import { prisma } from "@/lib/prisma";
import {
  CARE_CHECKLIST,
  CARE_CHECKLIST_TOTAL,
  getChecklistProgress,
} from "@/lib/brand/careChecklist";

const VALID_ITEM_IDS = new Set(CARE_CHECKLIST.map((i) => i.id));

export interface JobChecklistItemDto {
  checklistItemId: string;
  completed: boolean;
  completedAt: string | null;
  completedById: string | null;
  completedByName: string | null;
  notes: string | null;
}

export interface JobChecklistStateResponse {
  items: JobChecklistItemDto[];
  completedIds: string[];
  progress: ReturnType<typeof getChecklistProgress>;
}

function assertValidItemId(checklistItemId: string): void {
  if (!VALID_ITEM_IDS.has(checklistItemId)) {
    throw new Error(`Invalid checklist item: ${checklistItemId}`);
  }
}

/** Seed rows for all 50 standard items when a job has no checklist records yet. */
export async function ensureJobChecklistInitialized(jobId: string): Promise<void> {
  const count = await prisma.jobChecklistItem.count({ where: { jobId } });
  if (count > 0) return;

  await prisma.jobChecklistItem.createMany({
    data: CARE_CHECKLIST.map((item) => ({
      jobId,
      checklistItemId: item.id,
      completed: false,
    })),
    skipDuplicates: true,
  });
}

function mapRow(row: {
  checklistItemId: string;
  completed: boolean;
  completedAt: Date | null;
  completedById: string | null;
  notes: string | null;
  completedBy: { name: string | null; email: string } | null;
}): JobChecklistItemDto {
  return {
    checklistItemId: row.checklistItemId,
    completed: row.completed,
    completedAt: row.completedAt?.toISOString() ?? null,
    completedById: row.completedById,
    completedByName:
      row.completedBy?.name ?? row.completedBy?.email ?? null,
    notes: row.notes,
  };
}

export async function getJobChecklistState(
  jobId: string
): Promise<JobChecklistStateResponse> {
  await ensureJobChecklistInitialized(jobId);

  const rows = await prisma.jobChecklistItem.findMany({
    where: { jobId },
    include: {
      completedBy: { select: { name: true, email: true } },
    },
    orderBy: { checklistItemId: "asc" },
  });

  const items = rows.map(mapRow);
  const completedIds = items.filter((i) => i.completed).map((i) => i.checklistItemId);

  return {
    items,
    completedIds,
    progress: getChecklistProgress(completedIds),
  };
}

export async function updateJobChecklistItem(
  jobId: string,
  checklistItemId: string,
  completed: boolean,
  completedById: string,
  notes?: string | null
): Promise<JobChecklistItemDto> {
  assertValidItemId(checklistItemId);
  await ensureJobChecklistInitialized(jobId);

  const now = new Date();
  const row = await prisma.jobChecklistItem.upsert({
    where: {
      jobId_checklistItemId: { jobId, checklistItemId },
    },
    create: {
      jobId,
      checklistItemId,
      completed,
      completedAt: completed ? now : null,
      completedById: completed ? completedById : null,
      notes: notes ?? null,
    },
    update: {
      completed,
      completedAt: completed ? now : null,
      completedById: completed ? completedById : null,
      ...(notes !== undefined ? { notes } : {}),
    },
    include: {
      completedBy: { select: { name: true, email: true } },
    },
  });

  return mapRow(row);
}

export async function bulkUpdateJobChecklist(
  jobId: string,
  updates: Array<{
    checklistItemId: string;
    completed: boolean;
    notes?: string | null;
  }>,
  completedById: string
): Promise<JobChecklistStateResponse> {
  await ensureJobChecklistInitialized(jobId);

  for (const u of updates) {
    await updateJobChecklistItem(
      jobId,
      u.checklistItemId,
      u.completed,
      completedById,
      u.notes
    );
  }

  return getJobChecklistState(jobId);
}

export function formatChecklistAuditLog(
  items: JobChecklistItemDto[]
): Array<{ itemId: string; completedAt: string; completedBy?: string }> {
  return items
    .filter((i) => i.completed && i.completedAt)
    .map((i) => ({
      itemId: i.checklistItemId,
      completedAt: i.completedAt!,
      completedBy: i.completedByName ?? undefined,
    }));
}

export { CARE_CHECKLIST_TOTAL };
