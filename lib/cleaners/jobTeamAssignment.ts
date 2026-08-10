/**
 * Pure helpers for admin Job Team drafts.
 * cleanerIds[0] = primary (portal/payout); rest = assisting participation only.
 */

export type JobTeamDraft = {
  primaryCleanerId: string | null;
  assistantCleanerIds: string[];
};

export type JobTeamValidation =
  | { ok: true; cleanerIds: string[] }
  | { ok: false; error: string };

/** Dedupe while preserving first-seen order; drops empty strings. */
export function dedupeCleanerIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const trimmed = id?.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export function draftFromOrderedIds(cleanerIds: string[]): JobTeamDraft {
  const ids = dedupeCleanerIds(cleanerIds);
  if (ids.length === 0) {
    return { primaryCleanerId: null, assistantCleanerIds: [] };
  }
  return {
    primaryCleanerId: ids[0],
    assistantCleanerIds: ids.slice(1),
  };
}

/**
 * Build ordered cleanerIds for PUT /api/admin/jobs/[jobId]/team.
 * Empty team → []. Non-empty requires exactly one primary; assistants cannot
 * duplicate primary or each other.
 */
export function validateAndBuildCleanerIds(draft: JobTeamDraft): JobTeamValidation {
  const primary = draft.primaryCleanerId?.trim() || null;
  const assistants = dedupeCleanerIds(draft.assistantCleanerIds).filter(
    (id) => id !== primary
  );

  if (!primary) {
    if (assistants.length > 0) {
      return {
        ok: false,
        error: 'A primary cleaner is required when the team is non-empty.',
      };
    }
    return { ok: true, cleanerIds: [] };
  }

  return { ok: true, cleanerIds: [primary, ...assistants] };
}

export function buildOrderedCleanerIds(draft: JobTeamDraft): string[] {
  const result = validateAndBuildCleanerIds(draft);
  if (!result.ok) throw new Error(result.error);
  return result.cleanerIds;
}
