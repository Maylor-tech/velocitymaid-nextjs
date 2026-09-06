/**
 * Offer expiry is timestamp-authoritative.
 * Stored status OFFERED + expiresAt <= now is effectively EXPIRED even if
 * the daily Hobby cron has not persisted the row yet.
 */

export function expiresAtMs(expiresAt: Date | string | null | undefined): number | null {
  if (expiresAt == null || expiresAt === '') return null;
  const ms = expiresAt instanceof Date ? expiresAt.getTime() : new Date(expiresAt).getTime();
  return Number.isNaN(ms) ? null : ms;
}

export function isOfferExpiredByTimestamp(
  offer: { expiresAt: Date | string | null | undefined },
  now: Date = new Date()
): boolean {
  const ms = expiresAtMs(offer.expiresAt);
  if (ms == null) return false;
  return ms <= now.getTime();
}

/**
 * ACCEPTED / DECLINED / CANCELLED keep their stored status.
 * OFFERED past expiresAt is EXPIRED. Already-EXPIRED stays EXPIRED.
 */
export function effectiveOfferStatus(
  offer: { status: string; expiresAt: Date | string | null | undefined },
  now: Date = new Date()
): string {
  if (offer.status === 'ACCEPTED' || offer.status === 'DECLINED' || offer.status === 'CANCELLED') {
    return offer.status;
  }
  if (offer.status === 'EXPIRED' || isOfferExpiredByTimestamp(offer, now)) {
    return 'EXPIRED';
  }
  return offer.status;
}

export function isEffectivelyOpen(
  offer: { status: string; expiresAt: Date | string | null | undefined } | null | undefined,
  now: Date = new Date()
): boolean {
  if (!offer) return false;
  return effectiveOfferStatus(offer, now) === 'OFFERED';
}

/** Accept/decline of a non-accepted offer whose TTL has passed. */
export function shouldRejectMutationAsExpired(
  offer: { status: string; expiresAt: Date | string | null | undefined },
  now: Date = new Date()
): boolean {
  if (offer.status === 'ACCEPTED') return false;
  return isOfferExpiredByTimestamp(offer, now) || offer.status === 'EXPIRED';
}
