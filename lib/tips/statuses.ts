/** Canonical Tip statuses (new writes). Legacy: pending | succeeded | failed. */

export const TIP_STATUSES = [
  'PENDING',
  'RECEIVED',
  'RECEIVED_UNATTRIBUTED',
  'PAID_OUT',
  'CANCELLED',
  'FAILED',
  'REFUNDED',
] as const;

export type TipStatus = (typeof TIP_STATUSES)[number];

export const TIP_PAYMENT_METHODS = ['STRIPE', 'ZELLE', 'MANUAL'] as const;
export type TipPaymentMethod = (typeof TIP_PAYMENT_METHODS)[number];

/** Normalize legacy + canonical status strings. */
export function normalizeTipStatus(raw: string | null | undefined): TipStatus | string {
  if (!raw) return 'PENDING';
  const s = raw.trim();
  const upper = s.toUpperCase();
  if (upper === 'SUCCEEDED') return 'RECEIVED';
  if (upper === 'PENDING') return 'PENDING';
  if (upper === 'FAILED') return 'FAILED';
  if ((TIP_STATUSES as readonly string[]).includes(upper)) return upper;
  return s;
}

export function isTipPending(status: string): boolean {
  return normalizeTipStatus(status) === 'PENDING';
}

export function isTipReceived(status: string): boolean {
  const n = normalizeTipStatus(status);
  return n === 'RECEIVED' || n === 'RECEIVED_UNATTRIBUTED' || n === 'SUCCEEDED';
}

export function isTipPaidOut(status: string): boolean {
  return normalizeTipStatus(status) === 'PAID_OUT';
}

export function receivedStatusForBeneficiary(
  beneficiaryCleanerId: string | null | undefined
): 'RECEIVED' | 'RECEIVED_UNATTRIBUTED' {
  return beneficiaryCleanerId ? 'RECEIVED' : 'RECEIVED_UNATTRIBUTED';
}
