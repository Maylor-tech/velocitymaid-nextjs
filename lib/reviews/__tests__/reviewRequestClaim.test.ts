import { beforeEach, describe, expect, it, vi } from 'vitest';

const { updateMany, update, send } = vi.hoisted(() => ({
  updateMany: vi.fn(),
  update: vi.fn(),
  send: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: { reviewRequest: { updateMany, update } },
}));

import {
  claimReviewRequestSend,
  deliverClaimedReviewRequest,
  reviewRequestIdempotencyKey,
} from '@/lib/reviews/reviewRequestClaim';

const request = {
  id: 'rr-1',
  toEmail: 'guest@example.com',
  toName: 'Guest',
  reviewUrl: 'https://example.com/review',
  send,
};

describe('review request claim and provider outcome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateMany.mockResolvedValue({ count: 1 });
    update.mockResolvedValue({});
  });

  it('lets only one of two concurrent claims send', async () => {
    updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    send.mockResolvedValue({ sent: true, id: 'email-1' });

    const [first, second] = await Promise.all([
      deliverClaimedReviewRequest(request),
      deliverClaimedReviewRequest(request),
    ]);

    expect([first, second].sort()).toEqual(['not_claimed', 'sent']);
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].idempotencyKey).toBe(reviewRequestIdempotencyKey('rr-1'));
  });

  it('releases a definite provider failure so a later run can retry', async () => {
    send.mockResolvedValue({ sent: false, error: 'mailbox unavailable', outcomeUnknown: false });

    await expect(deliverClaimedReviewRequest(request)).resolves.toBe('failed');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'rr-1' },
      data: expect.objectContaining({ sendStatus: 'FAILED', claimedAt: null }),
    });
    await expect(claimReviewRequestSend('rr-1')).resolves.toBe(true);
  });

  it('does not clear the claim when the provider may already have accepted', async () => {
    send.mockResolvedValue({ sent: false, error: 'timeout', outcomeUnknown: true });

    await expect(deliverClaimedReviewRequest(request)).resolves.toBe('unknown');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'rr-1' },
      data: expect.objectContaining({ sendStatus: 'UNKNOWN' }),
    });
    expect(update.mock.calls[0][0].data.claimedAt).toBeUndefined();
  });

  it('keeps a claimed row when acceptance is saved after the provider call fails to record', async () => {
    send.mockResolvedValue({ sent: true, id: 'email-accepted' });
    update.mockRejectedValueOnce(new Error('database unavailable'));

    await expect(deliverClaimedReviewRequest(request)).resolves.toBe('accepted_unrecorded');

    updateMany.mockResolvedValueOnce({ count: 0 });
    send.mockClear();
    await expect(deliverClaimedReviewRequest(request)).resolves.toBe('not_claimed');
    expect(send).not.toHaveBeenCalled();
  });

  it('records the provider message id only after acceptance', async () => {
    send.mockResolvedValue({ sent: true, id: 'email-2' });

    await expect(deliverClaimedReviewRequest(request)).resolves.toBe('sent');

    expect(update).toHaveBeenCalledWith({
      where: { id: 'rr-1' },
      data: expect.objectContaining({
        sendStatus: 'ACCEPTED',
        providerMessageId: 'email-2',
        sentAt: expect.any(Date),
      }),
    });
  });
});
