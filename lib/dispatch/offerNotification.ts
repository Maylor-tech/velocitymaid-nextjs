/**
 * Safe admin view of the latest SEND_CLEANER_OFFER_EMAIL IntegrationEventLog.
 * Never includes provider secrets or raw payloads.
 */

export const SEND_CLEANER_OFFER_EMAIL = 'SEND_CLEANER_OFFER_EMAIL';

export type OfferNotificationStatus = 'SENT' | 'FAILED' | 'NOT_RECORDED';

export type OfferNotificationView = {
  status: OfferNotificationStatus;
  recordedAt: string | null;
  attemptCount: number;
};

export function toOfferNotificationView(
  row: { status: string; createdAt: Date | string } | null | undefined,
  attemptCount = 0
): OfferNotificationView {
  const count = Number.isFinite(attemptCount) ? Math.max(0, Math.floor(attemptCount)) : 0;
  if (!row) {
    return { status: 'NOT_RECORDED', recordedAt: null, attemptCount: count };
  }
  const recordedAt =
    row.createdAt instanceof Date
      ? row.createdAt.toISOString()
      : new Date(row.createdAt).toISOString();
  if (Number.isNaN(new Date(recordedAt).getTime())) {
    return { status: 'NOT_RECORDED', recordedAt: null, attemptCount: count };
  }
  if (row.status === 'SUCCESS') {
    return { status: 'SENT', recordedAt, attemptCount: count };
  }
  if (row.status === 'FAILED') {
    return { status: 'FAILED', recordedAt, attemptCount: count };
  }
  return { status: 'NOT_RECORDED', recordedAt, attemptCount: count };
}

export function offerNotificationLabel(status: OfferNotificationStatus): string {
  if (status === 'SENT') return 'Sent';
  if (status === 'FAILED') return 'Failed';
  return 'Not recorded';
}
