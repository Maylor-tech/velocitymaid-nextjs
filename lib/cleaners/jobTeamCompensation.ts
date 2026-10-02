/**
 * Assistant compensation ledger — operating-expense records for Job Team
 * assistants. Independent of JobPayout (primary cleaner) and of customer
 * invoice / Job.paymentStatus. Integer cents only.
 */

export const TEAM_COMP_STATUSES = ['OWED', 'PAID'] as const;
export type TeamCompStatus = (typeof TEAM_COMP_STATUSES)[number];

export const TEAM_PAYMENT_METHODS = ['ZELLE', 'CASH', 'CHECK', 'OTHER'] as const;
export type TeamPaymentMethod = (typeof TEAM_PAYMENT_METHODS)[number];

export function isTeamCompStatus(value: unknown): value is TeamCompStatus {
  return value === 'OWED' || value === 'PAID';
}

export function isTeamPaymentMethod(value: unknown): value is TeamPaymentMethod {
  return (
    value === 'ZELLE' ||
    value === 'CASH' ||
    value === 'CHECK' ||
    value === 'OTHER'
  );
}

/** Parse a dollar amount to integer cents. Rejects floats that are not 2-dp money. */
export function parseUsdToCents(value: unknown): number | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) return null;
    const cents = Math.round(value * 100);
    if (Math.abs(value * 100 - cents) > 1e-6) return null;
    return cents;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/^\$/, '');
    const m = trimmed.match(/^(\d+)(?:\.(\d{1,2}))?$/);
    if (!m) return null;
    const dollars = Number.parseInt(m[1], 10);
    const frac = (m[2] ?? '').padEnd(2, '0');
    const centsPart = Number.parseInt(frac || '0', 10);
    return dollars * 100 + centsPart;
  }
  return null;
}

export function centsToUsdNumber(cents: number): number {
  if (!Number.isInteger(cents)) {
    throw new Error('amountCents must be an integer');
  }
  return cents / 100;
}

export function fromDbCompensationRow(row: {
  id: string;
  jobId: string;
  cleanerId: string;
  branchId: string;
  amountCents: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paidAt: Date | null;
  paymentRef: string | null;
  note: string | null;
}): TeamCompensationRecord {
  return {
    id: row.id,
    jobId: row.jobId,
    cleanerId: row.cleanerId,
    branchId: row.branchId,
    amountCents: row.amountCents,
    currency: row.currency,
    status: row.status as TeamCompStatus,
    paymentMethod: (row.paymentMethod as TeamPaymentMethod | null) ?? null,
    paidAt: row.paidAt,
    paymentRef: row.paymentRef,
    note: row.note,
  };
}

export function toCompensationView(row: TeamCompensationRecord) {
  return {
    id: row.id,
    jobId: row.jobId,
    cleanerId: row.cleanerId,
    branchId: row.branchId,
    amountCents: row.amountCents,
    amountUsd: centsToUsdNumber(row.amountCents),
    currency: row.currency,
    status: row.status,
    paymentMethod: row.paymentMethod,
    paidAt: row.paidAt?.toISOString() ?? null,
    paymentRef: row.paymentRef,
    note: row.note,
  };
}

export function formatUsdFromCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(centsToUsdNumber(cents));
}

export function formatPaidSummary(input: {
  amountCents: number;
  paymentMethod: string | null;
  paidAt: Date | string | null;
  currency?: string;
}): string {
  const amount = formatUsdFromCents(input.amountCents, input.currency ?? 'USD');
  const method = input.paymentMethod
    ? input.paymentMethod.charAt(0) + input.paymentMethod.slice(1).toLowerCase()
    : 'other';
  const paidAt = input.paidAt ? new Date(input.paidAt) : null;
  const dateLabel =
    paidAt && !Number.isNaN(paidAt.getTime())
      ? paidAt.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : 'date unknown';
  return `Paid ${amount} via ${method} • ${dateLabel}`;
}

export type TeamCompensationRecord = {
  id: string;
  jobId: string;
  cleanerId: string;
  branchId: string;
  amountCents: number;
  currency: string;
  status: TeamCompStatus;
  paymentMethod: TeamPaymentMethod | null;
  paidAt: Date | null;
  paymentRef: string | null;
  note: string | null;
};

export function isCurrentAssistant(input: {
  cleanerId: string;
  primaryCleanerId: string | null;
  assistantCleanerIds: string[];
}): boolean {
  if (!input.cleanerId) return false;
  if (input.primaryCleanerId && input.cleanerId === input.primaryCleanerId) {
    return false;
  }
  return input.assistantCleanerIds.includes(input.cleanerId);
}

/**
 * Whether a compensation row may be created/updated for this cleaner.
 * Current assistants may create. Historical rows (already recorded) may be
 * edited/paid even after the assistant is removed from JobTeamMember.
 */
export function canMutateCompensation(input: {
  cleanerId: string;
  primaryCleanerId: string | null;
  assistantCleanerIds: string[];
  existing: { cleanerId: string } | null;
}): { ok: true } | { ok: false; code: string; error: string } {
  if (input.primaryCleanerId && input.cleanerId === input.primaryCleanerId) {
    return {
      ok: false,
      code: 'PRIMARY_CLEANER',
      error:
        'Assistant compensation cannot be recorded for the primary cleaner. Primary pay stays on JobPayout.',
    };
  }
  if (input.existing) return { ok: true };
  if (isCurrentAssistant(input)) return { ok: true };
  return {
    ok: false,
    code: 'NOT_ON_TEAM',
    error: 'Compensation can only be recorded for a current job-team assistant.',
  };
}

export type RecordPaymentInput = {
  existing: TeamCompensationRecord;
  confirm: boolean;
  amountCents: number;
  paymentMethod: TeamPaymentMethod;
  paidAt: Date;
  paymentRef?: string | null;
  note?: string | null;
};

export type RecordPaymentResult =
  | { ok: true; idempotent: boolean; next: TeamCompensationRecord }
  | { ok: false; code: string; error: string };

function samePaidMetadata(
  existing: TeamCompensationRecord,
  input: RecordPaymentInput
): boolean {
  const existingPaid = existing.paidAt?.getTime() ?? null;
  const nextPaid = input.paidAt.getTime();
  return (
    existing.status === 'PAID' &&
    existing.amountCents === input.amountCents &&
    existing.paymentMethod === input.paymentMethod &&
    existingPaid === nextPaid &&
    (existing.paymentRef ?? null) === (input.paymentRef ?? null)
  );
}

export function applyRecordPayment(input: RecordPaymentInput): RecordPaymentResult {
  if (input.amountCents <= 0 || !Number.isInteger(input.amountCents)) {
    return { ok: false, code: 'INVALID_AMOUNT', error: 'Amount must be a positive cent value.' };
  }
  if (input.existing.status === 'PAID') {
    if (samePaidMetadata(input.existing, input)) {
      return { ok: true, idempotent: true, next: input.existing };
    }
    return {
      ok: false,
      code: 'ALREADY_PAID',
      error: 'This assistant compensation is already marked paid.',
    };
  }
  if (!input.confirm) {
    return {
      ok: false,
      code: 'CONFIRM_REQUIRED',
      error: 'Explicit confirmation is required to mark this compensation paid.',
    };
  }
  return {
    ok: true,
    idempotent: false,
    next: {
      ...input.existing,
      amountCents: input.amountCents,
      status: 'PAID',
      paymentMethod: input.paymentMethod,
      paidAt: input.paidAt,
      paymentRef: input.paymentRef ?? null,
      note: input.note ?? input.existing.note,
    },
  };
}

export function aggregateTeamPay(
  rows: Array<{ amountCents: number; status: string }>
): { owedCents: number; paidCents: number; owedCount: number; paidCount: number } {
  let owedCents = 0;
  let paidCents = 0;
  let owedCount = 0;
  let paidCount = 0;
  for (const row of rows) {
    const cents = Number.isInteger(row.amountCents) ? row.amountCents : 0;
    if (row.status === 'PAID') {
      paidCents += cents;
      paidCount += 1;
    } else if (row.status === 'OWED') {
      owedCents += cents;
      owedCount += 1;
    }
  }
  return { owedCents, paidCents, owedCount, paidCount };
}
