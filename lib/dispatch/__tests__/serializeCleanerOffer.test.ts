import { describe, expect, it } from 'vitest';
import { serializeCleanerOffer } from '../serializeCleanerOffer';
import { toCleanerOfferLocationView } from '../cleanerViews';
import { deriveDispatchUiState, isCleanerNeeded } from '../dispatchState';

describe('cleaner offer serializer', () => {
  const row = {
    id: 'offer-1',
    jobId: 'job-1',
    status: 'OFFERED',
    compensationAmount: 195,
    compensationCurrency: 'USD',
    estimatedDurationMins: 180,
    operationalNotes: 'Bring extra towels',
    expiresAt: new Date('2026-08-28T16:30:00.000Z'),
    offeredAt: new Date('2026-08-28T16:00:00.000Z'),
    Job: {
      jobReference: 'VM-TEST-1',
      serviceType: 'Vacation Rental Turnover',
      preferredDate: new Date('2026-09-15T00:00:00.000Z'),
      preferredTime: '11:00 AM',
      serviceLocation: 'Ludlow',
      quotedTotal: 300,
      totalPrice: 337.8,
      amountPaid: 0,
      balanceDue: 337.8,
      address: '111 Thomson Drive',
      Property: { city: 'Ludlow', state: 'VT' },
    },
  };

  it('returns compensation and omits customer price fields', () => {
    const json = serializeCleanerOffer(row);
    expect(json.compensationAmount).toBe(195);
    expect(json.location.areaLabel).toBe('Ludlow');
    expect(JSON.stringify(json)).not.toMatch(/300|337/);
    expect(json).not.toHaveProperty('quotedTotal');
    expect(json).not.toHaveProperty('totalPrice');
    expect(json).not.toHaveProperty('balanceDue');
    expect(json).not.toHaveProperty('address');
  });
});

describe('offer location withholds access credentials', () => {
  it('uses city/area only', () => {
    const view = toCleanerOfferLocationView({
      serviceLocation: 'Ludlow',
      property: { city: 'Ludlow', state: 'VT' },
    });
    expect(view.areaLabel).toBe('Ludlow');
    expect(view).not.toHaveProperty('accessNotes');
    expect(view).not.toHaveProperty('address');
  });
});

describe('dispatch UI state', () => {
  it('is cleaner needed when unassigned with no open offer', () => {
    expect(
      isCleanerNeeded({ assignedCleanerId: null, hasOpenOffer: false })
    ).toBe(true);
    expect(
      deriveDispatchUiState({ assignedCleanerId: null }).state
    ).toBe('CLEANER_NEEDED');
  });

  it('shows offer sent while OFFERED', () => {
    expect(
      deriveDispatchUiState({
        assignedCleanerId: null,
        openOffer: {
          id: 'o1',
          status: 'OFFERED',
          cleanerName: 'Brian',
          expiresAt: '2026-08-28T16:30:00.000Z',
          compensationAmount: 195,
        },
      }).label
    ).toBe('Offer sent to Brian');
  });
});
