import { describe, expect, it } from 'vitest';
import {
  auditEntityBranchKey,
  bucketInvoiceDueDate,
  categorizePropertyAlertText,
  filterAuditLogsForBranch,
  standardActiveCustomerWhere,
  visibleExceptionItems,
  type ActionItem,
  type AuditFeedEntry,
} from '@/lib/admin/opsCommandCenter';

describe('categorizePropertyAlertText', () => {
  it('maps supplies source to Supplies', () => {
    expect(categorizePropertyAlertText('anything', 'supplies')).toBe('Supplies');
  });

  it('maps compliance source to Damage', () => {
    expect(categorizePropertyAlertText('scratch on wall', 'compliance')).toBe('Damage');
  });

  it('buckets issue keywords', () => {
    expect(categorizePropertyAlertText('hot tub cloudy', 'issues')).toBe('Hot tub');
    expect(categorizePropertyAlertText('trash left out', 'issues')).toBe('Trash');
    expect(categorizePropertyAlertText('lockbox code failed', 'issues')).toBe('Access');
    expect(categorizePropertyAlertText('broken vase damage', 'issues')).toBe('Damage');
    expect(categorizePropertyAlertText('need more paper towels', 'issues')).toBe('Supplies');
    expect(categorizePropertyAlertText('HVAC needs repair', 'issues')).toBe('Maintenance');
    expect(categorizePropertyAlertText('general note', 'issues')).toBe('Unresolved');
  });
});

describe('bucketInvoiceDueDate', () => {
  // Local dates — dateRanges helpers use setHours (local timezone)
  const now = new Date(2026, 6, 13, 15, 0, 0);

  it('treats OVERDUE status as overdue', () => {
    expect(bucketInvoiceDueDate(new Date(2026, 6, 20), 'OVERDUE', now)).toBe('overdue');
  });

  it('buckets by due date relative to today', () => {
    expect(bucketInvoiceDueDate(new Date(2026, 6, 10, 12), 'SENT', now)).toBe('overdue');
    expect(bucketInvoiceDueDate(new Date(2026, 6, 13, 12), 'SENT', now)).toBe('dueToday');
    expect(bucketInvoiceDueDate(new Date(2026, 6, 16, 12), 'SENT', now)).toBe('dueThisWeek');
    expect(bucketInvoiceDueDate(new Date(2026, 7, 1, 12), 'SENT', now)).toBe('other');
  });

  it('returns other when due date is null and not OVERDUE', () => {
    expect(bucketInvoiceDueDate(null, 'SENT', now)).toBe('other');
  });
});

describe('standardActiveCustomerWhere', () => {
  it('excludes archived and non-STANDARD record kinds', () => {
    expect(standardActiveCustomerWhere).toEqual({
      archivedAt: null,
      recordKind: 'STANDARD',
    });
  });
});

describe('filterAuditLogsForBranch', () => {
  const vermontBranchId = 'branch-vermont';
  const newJerseyBranchId = 'branch-new-jersey';

  const entries: AuditFeedEntry[] = [
    {
      id: 'a-vt-job',
      action: 'JOB_COMPLETED',
      entityType: 'Job',
      entityId: 'job-vt-1',
      description: 'Job completed — Chipman Park, Middlebury VT',
      createdAt: new Date('2026-07-13T12:00:00Z'),
    },
    {
      id: 'a-nj-job',
      action: 'JOB_COMPLETED',
      entityType: 'Job',
      entityId: 'job-nj-1',
      description: 'Job completed — Newark, New Jersey apartment',
      createdAt: new Date('2026-07-13T12:01:00Z'),
    },
    {
      id: 'a-nj-customer',
      action: 'PORTAL_INVITE',
      entityType: 'Customer',
      entityId: 'cust-nj-1',
      description: 'Portal invited — Jane Doe (Jersey City, NJ)',
      createdAt: new Date('2026-07-13T12:02:00Z'),
    },
    {
      id: 'a-system',
      action: 'CRON_RAN',
      entityType: 'System',
      entityId: 'system',
      description: 'Seasonal promo cron completed across all markets',
      createdAt: new Date('2026-07-13T12:03:00Z'),
    },
    {
      id: 'a-nj-branch',
      action: 'BRANCH_UPDATED',
      entityType: 'Branch',
      entityId: newJerseyBranchId,
      description: 'New Jersey branch settings updated',
      createdAt: new Date('2026-07-13T12:04:00Z'),
    },
    {
      id: 'a-vt-customer',
      action: 'PORTAL_INVITE',
      entityType: 'Customer',
      entityId: 'cust-vt-1',
      description: 'Portal invited — Tiffany P., Ludlow, VT',
      createdAt: new Date('2026-07-13T12:05:00Z'),
    },
  ];

  const entityBranchByKey = new Map<string, string | null>([
    [auditEntityBranchKey('Job', 'job-vt-1'), vermontBranchId],
    [auditEntityBranchKey('Job', 'job-nj-1'), newJerseyBranchId],
    [auditEntityBranchKey('Customer', 'cust-nj-1'), newJerseyBranchId],
    [auditEntityBranchKey('Customer', 'cust-vt-1'), vermontBranchId],
    [auditEntityBranchKey('System', 'system'), null],
    [auditEntityBranchKey('Branch', newJerseyBranchId), newJerseyBranchId],
  ]);

  it("Vermont-scoped feed contains zero entries referencing New Jersey entities", () => {
    const filtered = filterAuditLogsForBranch(
      entries,
      vermontBranchId,
      entityBranchByKey
    );

    expect(filtered.map((e) => e.id).sort()).toEqual(['a-vt-customer', 'a-vt-job']);

    const njLeak = filtered.filter(
      (e) =>
        e.entityId === 'job-nj-1' ||
        e.entityId === 'cust-nj-1' ||
        e.entityId === newJerseyBranchId ||
        /new\s*jersey|newark|jersey\s*city/i.test(e.description ?? '') ||
        e.entityId.toLowerCase().includes('nj')
    );
    expect(njLeak).toEqual([]);
    expect(filtered).toHaveLength(2);
  });

  it('excludes system/unresolvable entries for branch-scoped admins (fail closed)', () => {
    const filtered = filterAuditLogsForBranch(
      entries,
      vermontBranchId,
      entityBranchByKey
    );
    expect(filtered.some((e) => e.entityType === 'System')).toBe(false);
    expect(filtered.some((e) => e.id === 'a-system')).toBe(false);
  });
});

describe('visibleExceptionItems', () => {
  const base: Omit<ActionItem, 'id' | 'label' | 'count' | 'urgency' | 'branchScopedVisible'> = {
    reason: 'test',
    cta: 'Go',
    href: '/admin/jobs',
  };

  it('hides zero counts and sorts danger first', () => {
    const items: ActionItem[] = [
      {
        ...base,
        id: 'a',
        label: 'Quiet',
        count: 0,
        urgency: 'danger',
        branchScopedVisible: true,
      },
      {
        ...base,
        id: 'b',
        label: 'Warn',
        count: 2,
        urgency: 'warning',
        branchScopedVisible: true,
      },
      {
        ...base,
        id: 'c',
        label: 'Hot',
        count: 1,
        urgency: 'danger',
        branchScopedVisible: true,
      },
    ];
    expect(visibleExceptionItems(items, false).map((i) => i.id)).toEqual([
      'c',
      'b',
    ]);
  });

  it('hides HQ-only rows for branch-scoped admins', () => {
    const items: ActionItem[] = [
      {
        ...base,
        id: 'unassigned',
        label: 'Unassigned',
        count: 3,
        urgency: 'danger',
        branchScopedVisible: true,
      },
      {
        ...base,
        id: 'ar',
        label: 'AR',
        count: 5,
        urgency: 'danger',
        branchScopedVisible: false,
        href: '/admin/invoices',
      },
    ];
    expect(visibleExceptionItems(items, true).map((i) => i.id)).toEqual([
      'unassigned',
    ]);
  });
});
