import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { createReview, createComplaint, sendWhatsApp, jobFindUnique, customerUpdate } = vi.hoisted(() => ({
  createReview: vi.fn(() => ({ id: 'rev-1' })),
  createComplaint: vi.fn(() => ({ id: 'cmp-1' })),
  sendWhatsApp: vi.fn(),
  jobFindUnique: vi.fn(),
  customerUpdate: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    job: { findUnique: jobFindUnique },
    customer: { update: customerUpdate },
  },
}));
vi.mock('@/utils/reviewData', () => ({ createReview }));
vi.mock('@/utils/complaintData', () => ({ createComplaint }));
vi.mock('@/app/services/whatsappService', () => ({ sendWhatsAppMessage: sendWhatsApp }));
vi.mock('@/lib/reviews/googleReviewUrl', () => ({
  getGoogleReviewUrl: () => 'https://example.com/google-review',
}));

import { POST } from '../smart-filter/route';

const PUBLIC_URL = 'https://example.com/google-review';

function post(rating: number) {
  return POST(
    new NextRequest('http://localhost/api/reviews/smart-filter', {
      method: 'POST',
      body: JSON.stringify({
        jobId: 'job-1',
        cleanerId: 'cleaner-1',
        rating,
        serviceLocation: 'new_jersey',
        comment: 'Noted',
      }),
    })
  );
}

describe('public Google review access for ratings 1 through 5', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jobFindUnique.mockResolvedValue({
      Customer: { firstName: 'Ada', lastName: 'Lovelace', phone: '15551212' },
    });
  });

  it.each([1, 2, 3, 4, 5])('includes the public review URL for rating %s', async (rating) => {
    const response = await post(rating);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.googleReviewUrl).toBe(PUBLIC_URL);
    expect(createReview).toHaveBeenCalledWith(expect.objectContaining({ rating }));
  });

  it('still opens an internal complaint for a low rating', async () => {
    const body = await (await post(2)).json();

    expect(body.action).toBe('complaint_created');
    expect(body.complaintId).toBe('cmp-1');
    expect(createComplaint).toHaveBeenCalledWith(expect.objectContaining({ rating: 2 }));
  });

  it('does not open a complaint for a four or five star rating', async () => {
    await post(4);
    await post(5);

    expect(createComplaint).not.toHaveBeenCalled();
  });
});
