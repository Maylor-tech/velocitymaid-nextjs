import { describe, expect, it } from 'vitest';
import { calcPayout } from '@/lib/payoutRules';
import {
  CompensationRequiredError,
  assertCompensationNotCustomerTotal,
  parseApprovedCompensation,
  parseCompensationBasis,
  previewCompensationFromOperationalTotal,
  toCleanerCompensationView,
} from '../compensation';

describe('offer compensation snapshot', () => {
  it('requires an explicit positive amount from ops', () => {
    expect(() => parseApprovedCompensation(null)).toThrow(CompensationRequiredError);
    expect(() => parseApprovedCompensation(0)).toThrow(CompensationRequiredError);
    expect(() => parseApprovedCompensation('abc')).toThrow(CompensationRequiredError);
    expect(parseApprovedCompensation('125.5')).toBe(125.5);
  });

  it('parses payment basis and defaults to FLAT', () => {
    expect(parseCompensationBasis(null)).toBe('FLAT');
    expect(parseCompensationBasis('hourly')).toBe('HOURLY');
    expect(parseCompensationBasis('OTHER')).toBe('OTHER');
    expect(() => parseCompensationBasis('WEEKLY')).toThrow(/FLAT, HOURLY, or OTHER/);
    expect(toCleanerCompensationView({ amount: 195, basis: 'HOURLY' })).toEqual({
      amount: 195,
      currency: 'USD',
      basis: 'HOURLY',
      basisLabel: 'Hourly',
    });
  });

  it('previews from operationalTotal only, never quotedTotal/totalPrice', () => {
    expect(previewCompensationFromOperationalTotal(200)).toBe(calcPayout(200).cleanerAmount);
    expect(previewCompensationFromOperationalTotal(null)).toBeNull();
    expect(previewCompensationFromOperationalTotal(0)).toBeNull();
  });

  it('rejects a snapshot that equals the customer invoice total', () => {
    expect(() =>
      assertCompensationNotCustomerTotal({
        compensationAmount: 300,
        quotedTotal: 300,
      })
    ).toThrow(/customer quoted total/i);
    expect(() =>
      assertCompensationNotCustomerTotal({
        compensationAmount: 337.8,
        totalPrice: 337.8,
      })
    ).toThrow(/customer total/i);
  });
});
