import { afterEach, describe, expect, it } from 'vitest';
import {
  dispatchOfferBranchSlugs,
  isDispatchOffersEnabledForBranch,
  isDispatchOffersFlagOn,
} from '../featureFlags';

describe('dispatch feature flags', () => {
  afterEach(() => {
    delete process.env.DISPATCH_OFFERS_VERMONT;
    delete process.env.DISPATCH_OFFERS_BRANCH_SLUGS;
  });

  it('is off by default', () => {
    expect(isDispatchOffersFlagOn({})).toBe(false);
    expect(isDispatchOffersEnabledForBranch('vermont', {})).toBe(false);
  });

  it('enables Vermont only when the flag is true', () => {
    const env = { DISPATCH_OFFERS_VERMONT: 'true' };
    expect(isDispatchOffersFlagOn(env)).toBe(true);
    expect(isDispatchOffersEnabledForBranch('vermont', env)).toBe(true);
    expect(isDispatchOffersEnabledForBranch('new-jersey', env)).toBe(false);
  });

  it('does not enable other markets until listed', () => {
    const env = {
      DISPATCH_OFFERS_VERMONT: 'true',
      DISPATCH_OFFERS_BRANCH_SLUGS: 'new-jersey',
    };
    expect(dispatchOfferBranchSlugs(env)).toEqual(['vermont', 'new-jersey']);
    expect(isDispatchOffersEnabledForBranch('new-jersey', env)).toBe(true);
  });
});
