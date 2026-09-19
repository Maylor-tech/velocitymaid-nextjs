import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const requireRole = vi.fn();
const loadOwnerProfitability = vi.fn();
const branchFindUnique = vi.fn();

vi.mock('@/lib/auth/requireRole', () => ({
  requireRole: (...a: unknown[]) => requireRole(...a),
}));

vi.mock('@/lib/finance/ownerProfitabilityReadModel', () => ({
  loadOwnerProfitability: (...a: unknown[]) => loadOwnerProfitability(...a),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    branch: { findUnique: (...a: unknown[]) => branchFindUnique(...a) },
  },
}));

import { GET } from '../route';

function req(url: string) {
  return new NextRequest(url, { method: 'GET' });
}

describe('GET /api/admin/finance/owner-profitability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadOwnerProfitability.mockResolvedValue({
      scope: { mode: 'branch', branchId: 'branch-vt', branchName: 'Vermont' },
      primary: {
        invoicedRevenue: 300,
        draftInvoicedTotal: 0,
        collectedRevenue: 300,
        outstandingAr: 0,
        cleanerPayable: 195,
        cleanerPaid: 0,
        platformGrossShare: 105,
      },
      secondary: {
        processingCost: null,
        processingCostLabel: 'Not recorded',
        directJobCosts: null,
        directJobCostsLabel: 'Not recorded',
        contributionProfit: null,
        contributionProfitLabel: 'Unavailable',
        contributionMargin: null,
        contributionMarginLabel: 'Unavailable',
        costsComplete: false,
      },
      disclaimer: 'Invoiced is not the same as collected.',
      counts: {
        issuedInvoiceCount: 1,
        draftInvoiceCount: 0,
        paymentCount: 1,
        payablePayoutCount: 1,
        paidPayoutCount: 0,
      },
    });
  });

  it('forces branch-scoped admin to auth.branchId', async () => {
    requireRole.mockResolvedValue({
      userId: 'admin-vt',
      role: 'ADMIN',
      branchId: 'branch-vt',
      branchName: 'Vermont',
    });

    const res = await GET(
      req('http://localhost/api/admin/finance/owner-profitability?branchId=branch-nj')
    );
    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe('BRANCH_SCOPE_VIOLATION');
    expect(loadOwnerProfitability).not.toHaveBeenCalled();
  });

  it('loads Vermont scope for branch-scoped admin without query param', async () => {
    requireRole.mockResolvedValue({
      userId: 'admin-vt',
      role: 'ADMIN',
      branchId: 'branch-vt',
      branchName: 'Vermont',
    });

    const res = await GET(
      req('http://localhost/api/admin/finance/owner-profitability')
    );
    expect(res.status).toBe(200);
    expect(loadOwnerProfitability).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ branchId: 'branch-vt' })
    );
  });

  it('allows global admin to aggregate globally', async () => {
    requireRole.mockResolvedValue({
      userId: 'owner',
      role: 'ADMIN',
    });

    const res = await GET(
      req('http://localhost/api/admin/finance/owner-profitability')
    );
    expect(res.status).toBe(200);
    expect(loadOwnerProfitability).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ branchId: null })
    );
  });

  it('rejects unauthenticated callers', async () => {
    requireRole.mockRejectedValue(
      NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    );
    const res = await GET(
      req('http://localhost/api/admin/finance/owner-profitability')
    );
    expect(res.status).toBe(401);
  });
});
