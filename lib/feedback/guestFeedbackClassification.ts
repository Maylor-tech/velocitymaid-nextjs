/**
 * Guest Stay Card feedback ops classification (deterministic, no LLM).
 * Durable class is stored in ServiceFeedback.adminNotes as a structured block
 * until a dedicated schema column exists — same pattern as host attribution notes.
 */

export const GUEST_FEEDBACK_CLASS_START = '[VM_GUEST_CLASS v1]';
export const GUEST_FEEDBACK_CLASS_END = '[/VM_GUEST_CLASS]';

export const GUEST_ISSUE_TOPICS = ['good', 'cleaning', 'attention'] as const;
export type GuestIssueTopic = (typeof GUEST_ISSUE_TOPICS)[number];

export type GuestFeedbackOpsClass = 'NORMAL' | 'CONCERN' | 'URGENT';

export const LOW_RATING_MAX = 3;

export type ClassifyGuestFeedbackInput = {
  overallRating: number;
  cleanlinessRating: number;
  /** Optional guest selector — preferred signal for URGENT. */
  issueTopic?: GuestIssueTopic | null;
};

export type GuestFeedbackClassification = {
  opsClass: GuestFeedbackOpsClass;
  issueTopic: GuestIssueTopic | null;
  reasons: string[];
};

export function parseGuestIssueTopic(
  value: unknown
): GuestIssueTopic | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  if ((GUEST_ISSUE_TOPICS as readonly string[]).includes(trimmed)) {
    return trimmed as GuestIssueTopic;
  }
  return null;
}

/**
 * Deterministic classification:
 * - URGENT: guest selected "Something needs attention"
 * - CONCERN: guest selected cleaning issue, OR overall/cleanliness ≤ 3
 * - NORMAL: otherwise
 */
export function classifyGuestFeedback(
  input: ClassifyGuestFeedbackInput
): GuestFeedbackClassification {
  const topic = input.issueTopic ?? null;
  const reasons: string[] = [];

  if (topic === 'attention') {
    reasons.push('guest_selected_attention');
    return { opsClass: 'URGENT', issueTopic: topic, reasons };
  }

  if (topic === 'cleaning') {
    reasons.push('guest_selected_cleaning');
  }
  if (input.cleanlinessRating <= LOW_RATING_MAX) {
    reasons.push('low_cleanliness_rating');
  }
  if (input.overallRating <= LOW_RATING_MAX) {
    reasons.push('low_overall_rating');
  }

  if (reasons.length > 0) {
    return { opsClass: 'CONCERN', issueTopic: topic, reasons };
  }

  if (topic === 'good') {
    reasons.push('guest_selected_good');
  }
  return { opsClass: 'NORMAL', issueTopic: topic, reasons };
}

export function formatGuestClassBlock(
  classification: GuestFeedbackClassification
): string {
  return [
    GUEST_FEEDBACK_CLASS_START,
    `class=${classification.opsClass}`,
    `topic=${classification.issueTopic || ''}`,
    `reasons=${classification.reasons.join(',')}`,
    GUEST_FEEDBACK_CLASS_END,
  ].join('\n');
}

export function parseGuestClassFromAdminNotes(
  adminNotes: string | null | undefined
): GuestFeedbackClassification | null {
  if (!adminNotes) return null;
  const start = adminNotes.indexOf(GUEST_FEEDBACK_CLASS_START);
  const end = adminNotes.indexOf(GUEST_FEEDBACK_CLASS_END);
  if (start === -1 || end === -1 || end <= start) return null;
  const body = adminNotes
    .slice(start + GUEST_FEEDBACK_CLASS_START.length, end)
    .trim();
  const map: Record<string, string> = {};
  for (const line of body.split(/\r?\n/)) {
    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    map[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
  const opsClass = map.class;
  if (opsClass !== 'NORMAL' && opsClass !== 'CONCERN' && opsClass !== 'URGENT') {
    return null;
  }
  const topicRaw = map.topic || '';
  const issueTopic =
    topicRaw && (GUEST_ISSUE_TOPICS as readonly string[]).includes(topicRaw)
      ? (topicRaw as GuestIssueTopic)
      : null;
  const reasons = map.reasons
    ? map.reasons.split(',').map((r) => r.trim()).filter(Boolean)
    : [];
  return { opsClass, issueTopic, reasons };
}

/** Free-text admin notes with the machine class block removed. */
export function stripGuestClassBlock(
  adminNotes: string | null | undefined
): string {
  if (!adminNotes) return '';
  const start = adminNotes.indexOf(GUEST_FEEDBACK_CLASS_START);
  const end = adminNotes.indexOf(GUEST_FEEDBACK_CLASS_END);
  if (start === -1 || end === -1 || end <= start) {
    return adminNotes.trim();
  }
  const before = adminNotes.slice(0, start);
  const after = adminNotes.slice(end + GUEST_FEEDBACK_CLASS_END.length);
  return `${before}${after}`.trim();
}

/** Preserve durable class block when ops edits free-text notes. */
export function mergeAdminNotesPreservingGuestClass(options: {
  existingNotes: string | null | undefined;
  editableNotes: string | null | undefined;
}): string | null {
  const existingClass = parseGuestClassFromAdminNotes(options.existingNotes);
  const free = (options.editableNotes ?? '').trim();
  if (!existingClass && !free) return null;
  if (!existingClass) return free || null;
  const block = formatGuestClassBlock(existingClass);
  return free ? `${block}\n\n${free}` : block;
}

export function buildAdminNotesWithGuestClass(
  classification: GuestFeedbackClassification,
  existingNotes?: string | null
): string {
  const free = stripGuestClassBlock(existingNotes);
  const block = formatGuestClassBlock(classification);
  return free ? `${block}\n\n${free}` : block;
}
