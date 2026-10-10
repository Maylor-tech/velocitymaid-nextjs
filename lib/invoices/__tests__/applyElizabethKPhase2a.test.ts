import { beforeEach, describe, expect, it, vi } from 'vitest';

const invoiceFindUnique = vi.fn();
const jobFindUnique = vi.fn();
const payoutFindUnique = vi.fn();
const logAuditEntry = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: { findUnique: (...a: unknown[]) => invoiceFindUnique(...a) },
    job: { findUnique: (...a: unknown[]) => jobFindUnique(...a) },
    jobPayout: { findUnique: (...a: unknown[]) => payoutFindUnique(...a) },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...a: unknown[]) => logAuditEntry(...a),
}));

import { applyElizabethKPhase2a } from '../applyElizabethKPhase2a';
import { PHASE2A_MUTATION_ENV } from '@/lib/billing/elizabethKPhase2';

describe('applyElizabethKPhase2a', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ALLOW_PROD_MUTATION;
  });

  it('refuses without the operator env flag', async () => {
    await expect(
      applyElizabethKPhase2a({ dryRun: false, confirmToken: 'APPLY_ELIZABETH_K_PHASE2A' })
    ).rejects.toThrow(/ALLOW_PROD_MUTATION/);
    expect(invoiceFindUnique).not.toHaveBeenCalled();
  });

  it('stops before writes when the invoice is no longer DRAFT $400', async () => {
    process.env.ALLOW_PROD_MUTATION = PHASE2A_MUTATION_ENV;
    invoiceFindUnique.mockResolvedValue({
      id: 'cmuzcjuyy0006ic04rer9q3pr',
      invoiceNumber: 'VM-2026-0053',
      status: 'SENT',
      jobId: '874c4802-8cc0-433e-af51-72baa78d58d9',
      customerId: '528ae327-1257-49a3-b29c-77487dca2e46',
      total: 400,
      amountPaid: 0,
      balanceDue: 400,
      sentAt: new Date(),
      items: [{ id: 'line-1', description: 'Deep Clean', quantity: 1, unitPrice: 400, lineTotal: 400 }],
      payments: [],
      jobDate: new Date('2026-10-04T00:00:00.000Z'),
    });
    jobFindUnique.mockResolvedValue({
      id: '874c4802-8cc0-433e-af51-72baa78d58d9',
      customerId: '528ae327-1257-49a3-b29c-77487dca2e46',
      quotedTotal: 425,
      totalPrice: 425,
      amountPaid: 25,
      depositAmount: 25,
      depositPaymentIntentId: 'pi_3UMZs9RqPKxN0h8W1cV0LYQg',
      preferredDate: new Date('2026-10-04T00:00:00.000Z'),
    });
    payoutFindUnique.mockResolvedValue({
      id: '30051886-30d6-4cc6-babc-4275c1b07d9e',
      status: 'READY',
      cleanerAmount: 276.25,
      executedAt: null,
      paidAt: null,
    });

    await expect(
      applyElizabethKPhase2a({ dryRun: false, confirmToken: 'APPLY_ELIZABETH_K_PHASE2A' })
    ).rejects.toThrow(/invoice status is SENT/);
    expect(logAuditEntry).not.toHaveBeenCalled();
  });
});
