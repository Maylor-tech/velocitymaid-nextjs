import type { JobChecklistItemDto } from "@/lib/jobs/jobChecklist";

/** Build audit log entries for CareChecklist audit mode from API items. */
export function buildAuditLogFromItems(
  items: JobChecklistItemDto[]
): Array<{ itemId: string; completedAt: string; completedBy?: string }> {
  return items
    .filter((i) => i.completed && i.completedAt)
    .map((i) => ({
      itemId: i.checklistItemId,
      completedAt: i.completedAt!,
      completedBy: i.completedByName ?? "Specialist",
    }));
}
