/**
 * The dedicated pricing route uses the same owner rule as the general job PATCH.
 */
import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const jobUpdate = vi.fn();

vi.mock('@/lib/middleware/pricingGuard', () => ({
  requireAdminPricingAccess: async () => ({
    userId: 'multi-1',
    role: 'ADMIN',
    isOwner: false,
    isBranchScoped: false,
    branchIds: ['fictional-vt', 'fictional-nj'],
  }),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { update: (...args: unknown[]) => jobUpdate(...args), findUnique: vi.fn() },
  },
}));

vi.mock('@/lib/audit', () => ({ logAuditEntry: vi.fn() }));

import { PATCH } from '../route';

describe('PATCH /api/admin/jobs/[jobId]/pricing owner rule', () => {
  it('rejects a multi-branch non-owner before writing a price', async () => {
    const res = await PATCH(
      new NextRequest('http://localhost/api/admin/jobs/job-1/pricing', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ totalPrice: 275, confirmChange: true }),
      }),
      { params: { jobId: 'job-1' } }
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe('Forbidden: Owner authorization required');
    expect(jobUpdate).not.toHaveBeenCalled();
  });
});
