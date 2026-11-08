import { beforeEach, describe, expect, it, vi } from 'vitest';

const { updateMany, deleteMany, logAuditEntry } = vi.hoisted(() => ({
  updateMany: vi.fn(),
  deleteMany: vi.fn(),
  logAuditEntry: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { auditLog: { updateMany, deleteMany } },
}));
vi.mock('@/lib/audit', () => ({ logAuditEntry }));

import { openReferralClaim, settleReferralClaim } from '@/lib/whatsapp/referralNudgeClaim';

describe('referral claim settlement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMany.mockResolvedValue({ count: 1 });
    deleteMany.mockResolvedValue({ count: 1 });
  });

  it('does not release the claim when the network outcome is unknown', async () => {
    await expect(
      settleReferralClaim('claim-1', { status: 'unknown', reason: 'provider_unreachable' })
    ).resolves.toBe('unknown');

    expect(deleteMany).not.toHaveBeenCalled();
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: 'claim-1',
        action: 'REFERRAL_NUDGE_CLAIM',
        changes: { path: ['status'], equals: 'claimed' },
      },
      data: expect.objectContaining({
        changes: expect.objectContaining({ status: 'unknown', requiresReconciliation: true }),
      }),
    });
  });

  it('does not release the claim when a successful response has no message id', async () => {
    await expect(
      settleReferralClaim('claim-1', { status: 'unknown', reason: 'provider_missing_message_id' })
    ).resolves.toBe('unknown');

    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('releases a definite provider rejection and a pre-send skip', async () => {
    await expect(
      settleReferralClaim('claim-1', { status: 'failed', reason: 'invalid number' })
    ).resolves.toBe('failed');
    await expect(
      settleReferralClaim('claim-2', { status: 'skipped', reason: 'recipient_not_allowlisted' })
    ).resolves.toBe('skipped');

    expect(deleteMany).toHaveBeenCalledTimes(2);
    expect(updateMany).not.toHaveBeenCalled();
  });

  it('keeps an accepted claim when the database does not record it', async () => {
    updateMany.mockResolvedValueOnce({ count: 0 });

    await expect(
      settleReferralClaim('claim-1', { status: 'accepted', providerMessageId: 'wamid.1' })
    ).resolves.toBe('accepted_unrecorded');

    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('does not send when a second worker loses the claim insert', async () => {
    logAuditEntry.mockResolvedValueOnce('claim-1').mockResolvedValueOnce(null);

    await expect(openReferralClaim('job-1')).resolves.toBe('claim-1');
    await expect(openReferralClaim('job-1')).resolves.toBeNull();
  });
});
