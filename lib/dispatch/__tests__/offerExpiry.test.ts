import { describe, expect, it } from 'vitest';
import {
  effectiveOfferStatus,
  isEffectivelyOpen,
  isOfferExpiredByTimestamp,
  shouldRejectMutationAsExpired,
} from '../offerExpiry';
import { deriveDispatchUiState } from '../dispatchState';

const PAST = '2026-08-28T16:10:00.000Z';
const FUTURE = '2099-01-01T00:00:00.000Z';
const NOW = new Date('2026-08-28T16:40:00.000Z');

describe('offerExpiry', () => {
  it('treats OFFERED past expiresAt as expired even if cron never ran', () => {
    const stale = { status: 'OFFERED', expiresAt: PAST };
    expect(isOfferExpiredByTimestamp(stale, NOW)).toBe(true);
    expect(effectiveOfferStatus(stale, NOW)).toBe('EXPIRED');
    expect(isEffectivelyOpen(stale, NOW)).toBe(false);
  });

  it('keeps a live OFFERED row open when expiresAt is in the future', () => {
    const live = { status: 'OFFERED', expiresAt: FUTURE };
    expect(effectiveOfferStatus(live, NOW)).toBe('OFFERED');
    expect(isEffectivelyOpen(live, NOW)).toBe(true);
  });

  it('does not treat a missing expiresAt as expired', () => {
    const missing = { status: 'OFFERED', expiresAt: null };
    expect(isOfferExpiredByTimestamp(missing, NOW)).toBe(false);
    expect(effectiveOfferStatus(missing, NOW)).toBe('OFFERED');
    expect(isEffectivelyOpen(missing, NOW)).toBe(true);
  });

  it('does not rewrite ACCEPTED when expiresAt is in the past', () => {
    expect(
      effectiveOfferStatus(
        { status: 'ACCEPTED', expiresAt: PAST },
        NOW
      )
    ).toBe('ACCEPTED');
    expect(
      shouldRejectMutationAsExpired(
        { status: 'ACCEPTED', expiresAt: PAST },
        NOW
      )
    ).toBe(false);
  });
});

describe('deriveDispatchUiState expiry', () => {
  it('shows Expired (not Awaiting Response) when stored OFFERED is past expiresAt and cron never ran', () => {
    const ui = deriveDispatchUiState({
      assignedCleanerId: null,
      openOffer: {
        id: 'o1',
        status: 'OFFERED',
        cleanerName: 'Brian',
        expiresAt: PAST,
        compensationAmount: 85,
      },
    }, NOW);
    expect(ui.state).toBe('EXPIRED');
    expect(ui.label).toMatch(/expired/i);
    expect(ui.label).not.toMatch(/awaiting/i);
  });

  it('shows offer sent while OFFERED and still within TTL', () => {
    const ui = deriveDispatchUiState({
      assignedCleanerId: null,
      openOffer: {
        id: 'o1',
        status: 'OFFERED',
        cleanerName: 'Brian',
        expiresAt: FUTURE,
        compensationAmount: 195,
      },
    }, NOW);
    expect(ui.state).toBe('OFFER_SENT');
    expect(ui.label).toBe('Offer sent to Brian');
  });
});
