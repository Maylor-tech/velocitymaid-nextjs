import { describe, expect, it } from 'vitest';
import { calcPayout } from '@/lib/payoutRules';
import {
  CompensationRequiredError,
  assertCompensationNotCustomerTotal,
  parseApprovedCompensation,
  previewCompensationFromOperationalTotal,
} from '../compensation';

describe('offer compensation snapshot', () => {
  it('requires an explicit positive amount from ops', () => {
    expect(() => parseApprovedCompensation(null)).toThrow(CompensationRequiredError);
    expect(() => parseApprovedCompensation(0)).toThrow(CompensationRequiredError);
    expect(() => parseApprovedCompensation('abc')).toThrow(CompensationRequiredError);
    expect(parseApprovedCompensation('125.5')).toBe(125.5);
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
