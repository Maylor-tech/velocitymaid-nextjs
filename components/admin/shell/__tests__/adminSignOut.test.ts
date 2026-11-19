import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  ADMIN_LOGOUT_PATH,
  adminRoleLabel,
  beginAdminSignOut,
  isAdminSignOutPending,
  resetAdminSignOutGuardForTests,
} from '../adminSignOut';
import { isPathAllowedForBranchScopedAdmin } from '@/lib/auth/adminScope';
import { ADMIN_NAV_GROUPS } from '../adminNav';

describe('adminRoleLabel', () => {
  it('labels explicit owners as Owner', () => {
    expect(adminRoleLabel({ isOwner: true, isBranchScoped: false })).toBe('Owner');
    expect(adminRoleLabel({ isOwner: true, isBranchScoped: true })).toBe('Owner');
  });

  it('labels branch-scoped non-owners as Branch administrator', () => {
    expect(adminRoleLabel({ isOwner: false, isBranchScoped: true })).toBe(
      'Branch administrator'
    );
  });

  it('labels multi-branch non-owners as Administrator', () => {
    expect(adminRoleLabel({ isOwner: false, isBranchScoped: false })).toBe(
      'Administrator'
    );
    expect(adminRoleLabel({})).toBe('Administrator');
  });
});

describe('beginAdminSignOut', () => {
  beforeEach(() => {
    resetAdminSignOutGuardForTests();
  });

  it('navigates exactly once to the logout endpoint', () => {
    const assign = vi.fn();
    expect(beginAdminSignOut(assign)).toBe(true);
    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith(ADMIN_LOGOUT_PATH);
    expect(isAdminSignOutPending()).toBe(true);
  });

  it('blocks duplicate navigation while pending', () => {
    const assign = vi.fn();
    expect(beginAdminSignOut(assign)).toBe(true);
    expect(beginAdminSignOut(assign)).toBe(false);
    expect(assign).toHaveBeenCalledTimes(1);
  });

  it('releases the guard when assign throws synchronously', () => {
    const assign = vi.fn(() => {
      throw new Error('navigation blocked');
    });
    expect(beginAdminSignOut(assign)).toBe(false);
    expect(isAdminSignOutPending()).toBe(false);
    expect(beginAdminSignOut(vi.fn())).toBe(true);
  });
});

describe('branch-scoped nav filtering unchanged', () => {
  it('filters handoff nav to allowlisted paths for branch-scoped admins', () => {
    const groups = ADMIN_NAV_GROUPS.flatMap((group) => {
      const items = group.items.filter((item) =>
        isPathAllowedForBranchScopedAdmin(item.href)
      );
      return items.length ? [{ ...group, items }] : [];
    });
    const hrefs = groups.flatMap((g) => g.items.map((i) => i.href));
    expect(hrefs.every((href) => isPathAllowedForBranchScopedAdmin(href))).toBe(
      true
    );
    expect(hrefs).not.toContain('/admin/settings');
    expect(hrefs).not.toContain('/admin/invoices');
  });
});
