import { describe, expect, it } from 'vitest';
import { serializeCleanerOffer } from '../serializeCleanerOffer';
import { toCleanerOfferLocationView } from '../cleanerViews';
import { deriveDispatchUiState, isCleanerNeeded } from '../dispatchState';
import { assertNoCustomerFinancials } from '../cleanerFinancialGuard';

describe('cleaner offer serializer', () => {
  const row = {
    id: 'offer-1',
    jobId: 'job-1',
    status: 'OFFERED',
    compensationAmount: 195,
    compensationCurrency: 'USD',
    compensationBasis: 'FLAT' as const,
    estimatedDurationMins: 180,
    operationalNotes: 'Bring extra towels',
    expiresAt: new Date('2099-01-01T00:00:00.000Z'),
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
      operationalTotal: 200,
      address: '111 Thomson Drive',
      Property: { city: 'Ludlow', state: 'VT' },
    },
  };

  it('returns explicit compensation and required offer fields', () => {
    const json = serializeCleanerOffer(row);
    expect(json.compensation).toEqual({
      amount: 195,
      currency: 'USD',
      basis: 'FLAT',
      basisLabel: 'Flat rate',
    });
    expect(json.compensationAmount).toBe(195);
    expect(json.compensationBasis).toBe('FLAT');
    expect(json.status).toBe('OFFERED');
    expect(json.serviceType).toBe('Vacation Rental Turnover');
    expect(json.serviceDate).toMatch(/Sep/);
    expect(json.preferredTime).toBe('11:00 AM');
    expect(json.location.areaLabel).toBe('Ludlow');
    expect(json.estimatedDurationMins).toBe(180);
  });

  it('cannot leak customer financial values', () => {
    const json = serializeCleanerOffer(row);
    const blob = JSON.stringify(json);
    expect(blob).not.toMatch(/300|337/);
    expect(json).not.toHaveProperty('quotedTotal');
    expect(json).not.toHaveProperty('totalPrice');
    expect(json).not.toHaveProperty('balanceDue');
    expect(json).not.toHaveProperty('operationalTotal');
    expect(json).not.toHaveProperty('address');
    expect(() => assertNoCustomerFinancials(json)).not.toThrow();
  });

  it('serializes a stored OFFERED row past expiresAt as EXPIRED (cron never ran)', () => {
    const json = serializeCleanerOffer({
      ...row,
      expiresAt: new Date('2020-01-01T00:00:00.000Z'),
    });
    expect(json.status).toBe('EXPIRED');
  });

  it('rejects a payload that includes customer totals', () => {
    expect(() =>
      assertNoCustomerFinancials({ compensationAmount: 195, quotedTotal: 300 })
    ).toThrow(/quotedtotal/i);
    expect(() =>
      assertNoCustomerFinancials({ operationalTotal: 200, platformFee: 20 })
    ).toThrow(/operationaltotal/i);
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

  it('shows offer sent while OFFERED and still within TTL', () => {
    expect(
      deriveDispatchUiState({
        assignedCleanerId: null,
        openOffer: {
          id: 'o1',
          status: 'OFFERED',
          cleanerName: 'Brian',
          expiresAt: '2099-01-01T00:00:00.000Z',
          compensationAmount: 195,
        },
      }).label
    ).toBe('Offer sent to Brian');
  });
});
