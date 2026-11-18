import { describe, expect, it } from 'vitest';
import { isPathAllowedForBranchScopedAdmin } from '@/lib/auth/adminScope';
import {
  activeAdminNavItem,
  ADMIN_HANDOFF_NAV,
  ADMIN_NAV_GROUPS,
} from '../adminNav';

describe('ADMIN_HANDOFF_NAV', () => {
  it('exposes the eight handoff sections', () => {
    expect(ADMIN_HANDOFF_NAV.map((i) => i.label)).toEqual([
      'Overview',
      'Jobs & Calendar',
      'Customers & Properties',
      'Cleaning Specialists',
      'Quality & Reports',
      'Finance',
      'Communications',
      'Settings',
    ]);
  });

  it('filters to branch-allowed paths for branch-scoped admins', () => {
    const items = ADMIN_HANDOFF_NAV.filter((item) =>
      isPathAllowedForBranchScopedAdmin(item.href)
    );
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toContain('/admin');
    expect(hrefs).toContain('/admin/jobs');
    expect(hrefs).toContain('/admin/feedback');
    expect(hrefs).not.toContain('/admin/invoices');
    expect(hrefs).not.toContain('/admin/settings');
    expect(hrefs).not.toContain('/admin/customers');
  });

  it('keeps ADMIN_NAV_GROUPS as a single handoff group', () => {
    expect(ADMIN_NAV_GROUPS).toHaveLength(1);
    expect(ADMIN_NAV_GROUPS[0].items).toHaveLength(8);
  });

  it('marks exactly one section active for each admin route family', () => {
    const cases: Array<[string, string]> = [
      ['/admin', 'Overview'],
      ['/admin/jobs', 'Jobs & Calendar'],
      ['/admin/jobs/new', 'Jobs & Calendar'],
      ['/admin/customers', 'Customers & Properties'],
      ['/admin/cleaners', 'Cleaning Specialists'],
      ['/admin/feedback', 'Quality & Reports'],
      ['/admin/invoices', 'Finance'],
      ['/admin/payouts', 'Finance'],
      ['/admin/profitability', 'Finance'],
      ['/admin/tips', 'Finance'],
      ['/admin/taxes', 'Finance'],
      ['/admin/notifications', 'Communications'],
      ['/admin/lead-center', 'Communications'],
      ['/admin/inbox', 'Communications'],
      ['/admin/settings', 'Settings'],
      ['/admin/branches', 'Settings'],
      ['/admin/map', 'Settings'],
    ];
    for (const [path, label] of cases) {
      expect(activeAdminNavItem(path)?.label).toBe(label);
    }
  });
});

