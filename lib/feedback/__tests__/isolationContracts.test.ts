import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { ServiceFeedbackStatus } from '@prisma/client';

/**
 * Guards: Feedback V1 must never touch payout/invoice modules.
 */
describe('Feedback V1 money-isolation contract', () => {
  it('serviceFeedback module does not import payout or invoice writers', () => {
    const src = readFileSync('lib/feedback/serviceFeedback.ts', 'utf8');
    expect(src).not.toMatch(/from ['"]@\/lib\/payout/);
    expect(src).not.toMatch(/from ['"]@\/lib\/invoices/);
    expect(src).not.toMatch(/maybeCreatePayout|generateInvoice|sendLinkedInvoice/);
    expect(src).not.toMatch(/markJobPayoutPaid|createPayoutIfEligible/);
    expect(src).not.toMatch(/prisma\.(jobPayout|invoice)\./i);
  });
});

describe('Google vs private separation', () => {
  it('ReviewRequest helpers live outside ServiceFeedback domain', async () => {
    const review = await import('@/lib/billing/reviewRequestSendState');
    expect(review.stampGoogleReviewRequestSent).toBeTypeOf('function');
    expect(review.wasGoogleReviewRequestSent).toBeTypeOf('function');
  });

  it('private feedback statuses do not include Google concepts', () => {
    expect(Object.values(ServiceFeedbackStatus)).not.toContain('GOOGLE_SENT');
    expect(ServiceFeedbackStatus.REQUESTED).toBe('REQUESTED');
  });
});

describe('Public token cannot use bare jobId', () => {
  it('getPublicFeedbackByToken queries publicToken, not jobId', () => {
    const src = readFileSync('lib/feedback/serviceFeedback.ts', 'utf8');
    expect(src).toMatch(/where:\s*\{\s*publicToken:\s*token\.trim\(\)/);
    expect(src).not.toMatch(
      /getPublicFeedbackByToken[\s\S]{0,400}where:\s*\{\s*jobId/
    );
  });
});
