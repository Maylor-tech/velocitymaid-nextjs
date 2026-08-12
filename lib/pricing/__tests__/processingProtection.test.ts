import { describe, it, expect } from 'vitest';
import {
  applyProcessingProtection,
  ceilToIncrementDollars,
} from '../processingProtection';
import { dollarsToCents, roundMoney } from '../money';

describe('processingProtection', () => {
  it('percentage + fixed fee gross-up ($350 / 3.49% / $0.49 → ~$363.18 → $365)', () => {
    const result = applyProcessingProtection({
      operationalSubtotal: 350,
      percentageRate: 0.0349,
      fixedFee: 0.49,
      roundingIncrement: 5,
    });
    expect(result.rawProtected).toBeGreaterThanOrEqual(363.17);
    expect(result.rawProtected).toBeLessThanOrEqual(363.19);
    expect(result.customerPrice).toBe(365);
    expect(result.processingAllowanceEstimated).toBe(15);
    expect(result.operationalSubtotal).toBe(350);
  });

  it('ceil-to-$5 boundaries', () => {
    expect(ceilToIncrementDollars(361.12, 5)).toBe(365);
    expect(ceilToIncrementDollars(363.18, 5)).toBe(365);
    expect(ceilToIncrementDollars(365.01, 5)).toBe(370);
  });

  it('exact $5 boundary does not jump another $5', () => {
    expect(ceilToIncrementDollars(365, 5)).toBe(365);
    const exact = applyProcessingProtection({
      operationalSubtotal: 350,
      percentageRate: 0.0349,
      fixedFee: 0.49,
      roundingIncrement: 5,
    });
    expect(exact.customerPrice).toBe(365);
  });

  it('zero rate and zero fixed = pass-through', () => {
    const result = applyProcessingProtection({
      operationalSubtotal: 350,
      percentageRate: 0,
      fixedFee: 0,
      roundingIncrement: 5,
    });
    expect(result.customerPrice).toBe(350);
    expect(result.processingAllowanceEstimated).toBe(0);
  });

  it('travel included before protection (ops already includes travel)', () => {
    const withTravel = 175 + 15; // VT turnover + flat travel
    const result = applyProcessingProtection({
      operationalSubtotal: withTravel,
      percentageRate: 0.0349,
      fixedFee: 0.49,
      roundingIncrement: 5,
    });
    expect(result.operationalSubtotal).toBe(190);
    expect(result.customerPrice).toBeGreaterThan(190);
  });

  it('add-ons included before protection', () => {
    const withAddon = 300 + 25; // deep + fridge
    const result = applyProcessingProtection({
      operationalSubtotal: withAddon,
      percentageRate: 0.0349,
      fixedFee: 0.49,
      roundingIncrement: 5,
    });
    expect(result.operationalSubtotal).toBe(325);
    expect(result.customerPrice % 5).toBe(0);
  });

  it('protection applied exactly once (idempotent on customer total input would overcharge — ops only)', () => {
    const once = applyProcessingProtection({
      operationalSubtotal: 350,
      percentageRate: 0.0349,
      fixedFee: 0.49,
      roundingIncrement: 5,
    });
    const twice = applyProcessingProtection({
      operationalSubtotal: once.customerPrice,
      percentageRate: 0.0349,
      fixedFee: 0.49,
      roundingIncrement: 5,
    });
    expect(twice.customerPrice).toBeGreaterThan(once.customerPrice);
  });

  it('currency / Decimal precision via cents', () => {
    expect(dollarsToCents(350.495)).toBe(35050);
    expect(roundMoney(10.005)).toBe(10.01);
  });
});
