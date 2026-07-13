import { describe, expect, it } from 'vitest';
import {
  canPermanentlyDelete,
  sumBlockers,
  type CustomerDeletionBlockers,
} from '@/lib/admin/customerLifecycle';
import { customerListWhere } from '@/lib/admin/customerLifecycle';

const empty: CustomerDeletionBlockers = {
  jobs: 0,
  invoices: 0,
  payments: 0,
  receipts: 0,
  portalTokens: 0,
  changeRequests: 0,
  ratings: 0,
  referrals: 0,
  nurture: 0,
  pipelineLead: 0,
};

describe('customerLifecycle', () => {
  it('allows delete only when all blockers are zero', () => {
    expect(canPermanentlyDelete(empty)).toBe(true);
    expect(canPermanentlyDelete({ ...empty, jobs: 1 })).toBe(false);
    expect(sumBlockers({ ...empty, invoices: 2, payments: 3 })).toBe(5);
  });

  it('builds list filters without email hardcoding', () => {
    expect(customerListWhere('active')).toEqual({
      archivedAt: null,
      recordKind: { in: ['STANDARD', 'TEST'] },
    });
    expect(customerListWhere('archived')).toEqual({
      archivedAt: { not: null },
      recordKind: { in: ['STANDARD', 'TEST'] },
    });
    expect(customerListWhere('system')).toEqual({ recordKind: 'SYSTEM' });
  });
});
