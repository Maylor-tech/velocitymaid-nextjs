import { describe, expect, it } from 'vitest';
import {
  isPathAllowedForBranchScopedAdmin,
  isPathAllowedForBranchScopedAdminApi,
} from '../adminScope';

describe('adminScope — owner profitability access', () => {
  it('allows branch-scoped page /admin/profitability', () => {
    expect(isPathAllowedForBranchScopedAdmin('/admin/profitability')).toBe(true);
  });

  it('allows branch-scoped API owner-profitability', () => {
    expect(
      isPathAllowedForBranchScopedAdminApi('/api/admin/finance/owner-profitability')
    ).toBe(true);
  });

  it('still blocks unrelated finance APIs for branch-scoped admins', () => {
    expect(
      isPathAllowedForBranchScopedAdminApi('/api/admin/finance/overview')
    ).toBe(false);
    expect(
      isPathAllowedForBranchScopedAdminApi('/api/admin/payouts/run')
    ).toBe(false);
  });
});
