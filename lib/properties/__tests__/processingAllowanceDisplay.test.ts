import { describe, expect, it } from 'vitest';
import { displayProcessingAllowance } from '../processingAllowanceDisplay';

const policy = {
  enabled: true,
  percentageRate: 0.0349,
  fixedFee: 0.49,
  roundingIncrement: 5,
};

describe('displayProcessingAllowance', () => {
  it('keeps cash, check, and Zelle at zero while the card calculator is on', () => {
    for (const preferredMethod of ['CASH', 'CHECK', 'ZELLE'] as const) {
      expect(
        displayProcessingAllowance({
          preferredMethod,
          operationalSubtotal: 350,
          policy,
        })
      ).toEqual({
        preferredMethod,
        estimatedAllowance: 0,
        customerPriceUnchanged: true,
      });
    }
  });

  it('shows the existing card allowance without treating it as the customer price', () => {
    expect(
      displayProcessingAllowance({
        preferredMethod: 'CARD',
        operationalSubtotal: 350,
        policy,
      })
    ).toEqual({
      preferredMethod: 'CARD',
      estimatedAllowance: 15,
      customerPriceUnchanged: true,
    });
  });

  it('shows zero for card when protection is off or no method is saved', () => {
    expect(
      displayProcessingAllowance({
        preferredMethod: 'CARD',
        operationalSubtotal: 350,
        policy: { ...policy, enabled: false },
      }).estimatedAllowance
    ).toBe(0);
    expect(
      displayProcessingAllowance({
        preferredMethod: null,
        operationalSubtotal: 350,
        policy,
      }).estimatedAllowance
    ).toBe(0);
  });
});
