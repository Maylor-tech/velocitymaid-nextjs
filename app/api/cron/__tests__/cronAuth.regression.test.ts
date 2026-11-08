import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { reviewFindMany, jobFindMany, reviewUpdate, reviewUpdateMany, sendReview, requireUrl, GoogleReviewUrlError } = vi.hoisted(() => {
  class GoogleReviewUrlError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'GoogleReviewUrlError';
    }
  }
  return {
    reviewFindMany: vi.fn(),
    jobFindMany: vi.fn(),
    reviewUpdate: vi.fn(),
    reviewUpdateMany: vi.fn(),
    sendReview: vi.fn(),
    requireUrl: vi.fn(),
    GoogleReviewUrlError,
  };
});

const { ratingFindMany, auditFindMany, sendWhatsApp, logAudit } = vi.hoisted(() => ({
  ratingFindMany: vi.fn(),
  auditFindMany: vi.fn(),
  sendWhatsApp: vi.fn(),
  logAudit: vi.fn(),
}));

const { leadFindMany, leadUpdate, sendLead } = vi.hoisted(() => ({
  leadFindMany: vi.fn(),
  leadUpdate: vi.fn(),
  sendLead: vi.fn(),
}));

const { rebookingCount, sendRebooking } = vi.hoisted(() => ({
  rebookingCount: vi.fn(),
  sendRebooking: vi.fn(),
}));

const { expireOpenOffers } = vi.hoisted(() => ({ expireOpenOffers: vi.fn() }));
const { invoiceFindMany, sendInvoice } = vi.hoisted(() => ({
  invoiceFindMany: vi.fn(),
  sendInvoice: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    reviewRequest: { findMany: reviewFindMany, update: reviewUpdate, updateMany: reviewUpdateMany },
    job: { findMany: jobFindMany, count: rebookingCount },
    cleanerRating: { findMany: ratingFindMany },
    auditLog: { findMany: auditFindMany },
    customer: { findMany: leadFindMany, update: leadUpdate },
    invoice: { findMany: invoiceFindMany },
  },
}));
vi.mock('@/lib/email/sendReviewRequestEmail', () => ({ sendReviewRequestEmail: sendReview }));
vi.mock('@/lib/reviews/googleReviewUrl', () => ({ GoogleReviewUrlError, requireGoogleReviewUrl: requireUrl }));
vi.mock('@/lib/whatsapp/sendMessage', () => ({ sendWhatsAppMessage: sendWhatsApp }));
vi.mock('@/lib/audit', () => ({ logAuditEntry: logAudit }));
vi.mock('@/lib/email/cronAutomationEmails', () => ({
  sendLeadFollowUpEmail: sendLead,
  sendRebookingReminderEmail: sendRebooking,
}));
vi.mock('@/lib/dispatch/jobOffer', () => ({ expireOpenOffers }));
vi.mock('@/lib/invoices/sendReminder', () => ({
  REMINDABLE_STATUSES: ['SENT', 'OVERDUE', 'PARTIALLY_PAID'],
  sendRecordedInvoiceReminder: sendInvoice,
}));

import { GET as sendReviewRequests } from '../send-review-requests/route';
import { GET as referralNudge } from '../referral-nudge/route';
import { GET as leadFollowup } from '../lead-followup/route';
import { GET as rebookingReminders } from '../rebooking-reminders/route';
import { GET as expireOffers } from '../dispatch-offer-expire/route';
import { GET as invoiceReminders } from '../invoice-reminders/route';

const SECRET = 'test-cron-secret';

function request(path: string, authorization?: string) {
  const headers = new Headers();
  if (authorization !== undefined) headers.set('authorization', authorization);
  return new NextRequest(`http://localhost${path}`, { headers });
}

describe('cron authorization and existing empty-run behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('CRON_SECRET', SECRET);
    vi.stubEnv('INVOICE_REMINDER_STAGES_ENABLED', 'false');
    reviewFindMany.mockResolvedValue([]);
    reviewUpdateMany.mockResolvedValue({ count: 0 });
    jobFindMany.mockResolvedValue([]);
    ratingFindMany.mockResolvedValue([]);
    auditFindMany.mockResolvedValue([]);
    leadFindMany.mockResolvedValue([]);
    invoiceFindMany.mockResolvedValue([]);
    expireOpenOffers.mockResolvedValue({ expired: 0, offerIds: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it.each([
    ['send-review-requests', sendReviewRequests, reviewFindMany],
    ['referral-nudge', referralNudge, ratingFindMany],
    ['lead-followup', leadFollowup, leadFindMany],
    ['rebooking-reminders', rebookingReminders, jobFindMany],
    ['dispatch-offer-expire', expireOffers, expireOpenOffers],
    ['invoice-reminders', invoiceReminders, invoiceFindMany],
  ] as const)('rejects %s when the secret is missing, empty, or wrong', async (path, handler, probe) => {
    const url = `/api/cron/${path}`;
    delete process.env.CRON_SECRET;
    expect((await handler(request(url, `Bearer ${SECRET}`))).status).toBe(401);

    vi.stubEnv('CRON_SECRET', '   ');
    expect((await handler(request(url, 'Bearer    '))).status).toBe(401);

    vi.stubEnv('CRON_SECRET', SECRET);
    const missing = await handler(request(url));
    const wrong = await handler(request(url, 'Bearer wrong-secret'));
    expect(missing.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(await missing.json()).toEqual({ error: 'Unauthorized' });
    expect(JSON.stringify(await wrong.json())).not.toContain(SECRET);
    expect(probe).not.toHaveBeenCalled();
  });

  it('keeps the review-request empty queue and the unresolved-url skip', async () => {
    const empty = await sendReviewRequests(request('/api/cron/send-review-requests', `Bearer ${SECRET}`));
    expect(empty.status).toBe(200);
    expect(await empty.json()).toEqual({
      success: true,
      processed: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      unknown: 0,
      acceptedUnrecorded: 0,
      reconciled: 0,
    });

    reviewFindMany.mockResolvedValue([{ id: 'r1', jobId: 'j1', clientEmail: 'guest@example.com' }]);
    jobFindMany.mockResolvedValue([]);
    requireUrl.mockImplementation(() => {
      throw new GoogleReviewUrlError('unresolved');
    });
    const skipped = await sendReviewRequests(request('/api/cron/send-review-requests', `Bearer ${SECRET}`));
    expect(await skipped.json()).toMatchObject({ success: true, processed: 1, sent: 0, failed: 0, skipped: 1 });
    expect(sendReview).not.toHaveBeenCalled();
    expect(reviewUpdate).not.toHaveBeenCalled();
  });

  it('keeps the referral nudge from sending when the five-star rating has no phone', async () => {
    ratingFindMany.mockResolvedValue([
      { jobId: 'j1', Job: { id: 'j1', branchId: 'b1', customerId: 'c1', Customer: { phone: '  ' } } },
    ]);
    const response = await referralNudge(request('/api/cron/referral-nudge', `Bearer ${SECRET}`));
    expect(await response.json()).toEqual({
      ok: true,
      sent: 0,
      failed: 0,
      skipped: 1,
      unknown: 0,
      acceptedUnrecorded: 0,
    });
    expect(sendWhatsApp).not.toHaveBeenCalled();
    expect(logAudit).not.toHaveBeenCalled();
  });

  it('keeps an authorized empty lead follow-up and rebooking run', async () => {
    expect(await (await leadFollowup(request('/api/cron/lead-followup', `Bearer ${SECRET}`))).json()).toEqual({
      success: true, processed: 0, sent: 0, failed: 0,
    });
    expect(await (await rebookingReminders(request('/api/cron/rebooking-reminders', `Bearer ${SECRET}`))).json()).toEqual({
      success: true, processed: 0, sent: 0, failed: 0,
    });
    expect(sendLead).not.toHaveBeenCalled();
    expect(sendRebooking).not.toHaveBeenCalled();
  });

  it('keeps an authorized offer-expiry run on the existing result', async () => {
    expireOpenOffers.mockResolvedValue({ expired: 2, offerIds: ['o1', 'o2'] });
    expect(await (await expireOffers(request('/api/cron/dispatch-offer-expire', `Bearer ${SECRET}`))).json()).toEqual({
      success: true, expired: 2, offerIds: ['o1', 'o2'],
    });
  });

  it('keeps the invoice reminder window skip after a valid bearer token', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-31T09:00:00Z'));
    const body = await (await invoiceReminders(request('/api/cron/invoice-reminders', `Bearer ${SECRET}`))).json();
    expect(body.skipped).toContain('send window');
    expect(invoiceFindMany).not.toHaveBeenCalled();
    expect(sendInvoice).not.toHaveBeenCalled();
  });
});
