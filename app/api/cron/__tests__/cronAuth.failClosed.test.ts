import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const effects = vi.hoisted(() => ({
  dbCalls: [] as string[],
  claimFeedbackReminders: vi.fn(async () => []),
  sendServiceFeedbackRequestEmail: vi.fn(),
  sendWhatsAppMessage: vi.fn(),
  sendWhatsAppService: vi.fn(),
  send24HourReminder: vi.fn(),
  createPayout: vi.fn(),
  processApprovedPayoutBatch: vi.fn(),
  runWeeklyPayouts: vi.fn(),
  autoAssignCleaner: vi.fn(),
  checkAndSendTrainingReminder: vi.fn(),
  getStripe: vi.fn(),
  logAuditEntry: vi.fn(),
  createAdminNotification: vi.fn(),
}));

vi.mock('@/lib/prisma', () => {
  const methods = new Map<string, ReturnType<typeof vi.fn>>();
  const prisma = new Proxy(
    {},
    {
      get(_target, model: string) {
        if (model === 'then') return undefined;
        return new Proxy(
          {},
          {
            get(_inner, method: string) {
              const key = `${model}.${String(method)}`;
              let fn = methods.get(key);
              if (!fn) {
                fn = vi.fn(async () => {
                  effects.dbCalls.push(key);
                  return method === 'count' ? 0 : [];
                });
                methods.set(key, fn);
              }
              return fn;
            },
          },
        );
      },
    },
  );
  return { prisma };
});
vi.mock('@/lib/feedback/serviceFeedback', () => ({
  FEEDBACK_AUDIT: { REMINDER_SENT: 'FEEDBACK_REMINDER_SENT' },
  claimFeedbackReminders: effects.claimFeedbackReminders,
  feedbackPublicUrl: () => 'https://example.test/feedback',
}));
vi.mock('@/lib/feedback/sendServiceFeedbackEmail', () => ({
  sendServiceFeedbackRequestEmail: effects.sendServiceFeedbackRequestEmail,
}));
vi.mock('@/lib/whatsapp/sendMessage', () => ({ sendWhatsAppMessage: effects.sendWhatsAppMessage }));
vi.mock('@/app/services/whatsappService', () => ({ sendWhatsAppMessage: effects.sendWhatsAppService }));
vi.mock('@/lib/whatsapp', () => ({ send24HourReminder: effects.send24HourReminder }));
vi.mock('@/app/services/payouts/jamaicaPayoutService', () => ({
  createPayout: effects.createPayout,
  getCleanerPaymentMethod: vi.fn(),
}));
vi.mock('@/lib/payout/stripePayoutWorker', () => ({
  processApprovedPayoutBatch: effects.processApprovedPayoutBatch,
}));
vi.mock('@/workers/weekly-payouts', () => ({ runWeeklyPayouts: effects.runWeeklyPayouts }));
vi.mock('@/lib/cleaner-assignment', () => ({ autoAssignCleaner: effects.autoAssignCleaner }));
vi.mock('@/app/services/trainingNotifications', () => ({
  checkAndSendTrainingReminder: effects.checkAndSendTrainingReminder,
}));
vi.mock('@/lib/stripe', () => ({ getStripe: effects.getStripe }));
vi.mock('@/lib/audit', () => ({ logAuditEntry: effects.logAuditEntry }));
vi.mock('@/lib/notifications/adminNotificationCenter', () => ({
  createAdminNotification: effects.createAdminNotification,
  adminNotificationHelpers: { cleanerNoResponse: vi.fn() },
}));
vi.mock('@/utils/nurtureMessages', () => ({ getNurtureMessage: vi.fn(), shouldStopSequence: vi.fn() }));
vi.mock('@/config/afterHoursMessages', () => ({ getMorningFollowUpMessage: vi.fn(() => 'hello') }));
vi.mock('@/lib/time/isAfterHours', () => ({ isAfterHours: vi.fn(() => false) }));

import { GET as feedbackGet } from '../send-feedback-reminders/route';
import { GET as onTheWayGet } from '../on-the-way/route';
import { GET as reminderGet, POST as reminderPost } from '../reminder-24h/route';
import { GET as jamaicaGet, POST as jamaicaPost } from '../payouts/jamaica/route';
import { GET as winbackGet } from '../winback/route';
import { GET as digestGet } from '../weekly-digest/route';
import { GET as trainingGet } from '../training/reminders/route';
import { GET as tipGet } from '../tip-prompt/route';
import { GET as renewalGet } from '../subscription-renewal/route';
import { GET as serviceGet } from '../service-reminder/route';
import { GET as seasonalGet } from '../seasonal-promo/route';
import { GET as followupGet } from '../reviews/send-followup/route';
import { GET as referralReminderGet } from '../referrals/send-reminders/route';
import { GET as monthlyPromoGet } from '../promo/monthly-send/route';
import { GET as priceGet } from '../price-change-notice/route';
import { GET as postCleanGet } from '../post-clean-feedback/route';
import { GET as pilotGet } from '../pilot/weekly-payouts/route';
import { GET as nurtureGet } from '../nurture/process/route';
import { GET as morningGet } from '../morning-queue/process/route';
import { GET as summaryGet } from '../weekly-payout-summary/route';
import { GET as dailyGet } from '../daily-summary/route';
import { GET as responseGet } from '../cleaner-response-check/route';
import { GET as assignGet } from '../assign-unassigned/route';
import { GET as payoutGet, POST as payoutPost } from '../process-payouts/route';
import { GET as readinessGet, POST as readinessPost } from '../weekly-1099-readiness/route';
import { GET as w9Get, POST as w9Post } from '../w9-reminders/route';
import { GET as archiveGet, POST as archivePost } from '../archive-tax-year/route';

const SECRET = 'test-cron-secret';

function request(path: string, authorization?: string, cronHeader?: string) {
  const headers = new Headers();
  if (authorization !== undefined) headers.set('authorization', authorization);
  if (cronHeader !== undefined) headers.set('x-cron-secret', cronHeader);
  return new NextRequest(`http://localhost${path}`, { headers });
}

const secured = [
  ['send-feedback-reminders GET', feedbackGet],
  ['on-the-way GET', onTheWayGet],
  ['reminder-24h GET', reminderGet],
  ['reminder-24h POST', reminderPost],
  ['jamaica GET', jamaicaGet],
  ['jamaica POST', jamaicaPost],
  ['winback GET', winbackGet],
  ['weekly-digest GET', digestGet],
  ['training GET', trainingGet],
  ['tip-prompt GET', tipGet],
  ['subscription-renewal GET', renewalGet],
  ['service-reminder GET', serviceGet],
  ['seasonal-promo GET', seasonalGet],
  ['review-followup GET', followupGet],
  ['referral-reminders GET', referralReminderGet],
  ['monthly-promo GET', monthlyPromoGet],
  ['price-change GET', priceGet],
  ['post-clean GET', postCleanGet],
  ['pilot-payouts GET', pilotGet],
  ['nurture GET', nurtureGet],
  ['morning-queue GET', morningGet],
  ['weekly-payout-summary GET', summaryGet],
  ['daily-summary GET', dailyGet],
  ['cleaner-response GET', responseGet],
  ['assign-unassigned GET', assignGet],
  ['process-payouts GET', payoutGet],
  ['process-payouts POST', payoutPost],
  ['1099-readiness POST', readinessPost],
  ['w9-reminders POST', w9Post],
  ['archive-tax-year POST', archivePost],
] as const;

function untouched() {
  expect(effects.dbCalls).toEqual([]);
  expect(effects.claimFeedbackReminders).not.toHaveBeenCalled();
  expect(effects.sendServiceFeedbackRequestEmail).not.toHaveBeenCalled();
  expect(effects.sendWhatsAppMessage).not.toHaveBeenCalled();
  expect(effects.sendWhatsAppService).not.toHaveBeenCalled();
  expect(effects.send24HourReminder).not.toHaveBeenCalled();
  expect(effects.createPayout).not.toHaveBeenCalled();
  expect(effects.processApprovedPayoutBatch).not.toHaveBeenCalled();
  expect(effects.runWeeklyPayouts).not.toHaveBeenCalled();
  expect(effects.autoAssignCleaner).not.toHaveBeenCalled();
  expect(effects.checkAndSendTrainingReminder).not.toHaveBeenCalled();
  expect(effects.getStripe).not.toHaveBeenCalled();
  expect(effects.logAuditEntry).not.toHaveBeenCalled();
  expect(effects.createAdminNotification).not.toHaveBeenCalled();
}

describe('remaining cron routes fail closed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    effects.dbCalls.length = 0;
    vi.stubEnv('CRON_SECRET', SECRET);
    vi.stubEnv('ENABLE_PAYOUTS', '');
    delete process.env.WHATSAPP_TOKEN;
    delete process.env.WHATSAPP_PHONE_NUMBER_ID;
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('rejects missing, blank, and incorrect credentials before any side effect', async () => {
    for (const [name, handler] of secured) {
      delete process.env.CRON_SECRET;
      const missing = await handler(request(`/api/cron/${name}`, `Bearer ${SECRET}`));
      expect({ name, status: missing.status }).toEqual({ name, status: 401 });

      vi.stubEnv('CRON_SECRET', '   ');
      const blank = await handler(request(`/api/cron/${name}`, `Bearer ${SECRET}`));
      expect({ name, status: blank.status }).toEqual({ name, status: 401 });

      vi.stubEnv('CRON_SECRET', SECRET);
      const wrong = await handler(request(`/api/cron/${name}`, 'Bearer wrong-secret'));
      const crafted = await handler(request(`/api/cron/${name}`, 'Bearer undefined'));
      const queried = await handler(request(`/api/cron/${name}?secret=${encodeURIComponent(SECRET)}`));
      const header = await handler(request(`/api/cron/${name}`, undefined, 'wrong-secret'));
      expect({ name, status: wrong.status }).toEqual({ name, status: 401 });
      expect(crafted.status).toBe(401);
      expect(queried.status).toBe(401);
      expect(header.status).toBe(401);
      expect(JSON.stringify(await wrong.json())).not.toContain(SECRET);
    }
    untouched();
  });

  it('keeps reminder test mode and Jamaica query secrets from running the job', async () => {
    delete process.env.CRON_SECRET;
    vi.stubEnv('WHATSAPP_TOKEN', 'whatsapp-token');
    vi.stubEnv('WHATSAPP_PHONE_NUMBER_ID', 'phone-id');
    const reminder = await reminderGet(request('/api/cron/reminder-24h?test=true'));
    const reminderPostResponse = await reminderPost(request('/api/cron/reminder-24h?test=true', 'Bearer undefined'));
    expect(reminder.status).toBe(401);
    expect(reminderPostResponse.status).toBe(401);

    vi.stubEnv('CRON_SECRET', SECRET);
    const jamaica = await jamaicaGet(request(`/api/cron/payouts/jamaica?secret=${encodeURIComponent(SECRET)}`));
    const jamaicaByPost = await jamaicaPost(request(`/api/cron/payouts/jamaica?secret=${encodeURIComponent(SECRET)}`));
    expect(jamaica.status).toBe(401);
    expect(jamaicaByPost.status).toBe(401);
    untouched();
  });

  it('still runs the guarded empty paths for a valid credential', async () => {
    const onTheWay = await onTheWayGet(request('/api/cron/on-the-way', `Bearer ${SECRET}`));
    expect(onTheWay.status).toBe(200);
    expect(effects.sendWhatsAppMessage).not.toHaveBeenCalled();

    const jamaica = await jamaicaGet(request('/api/cron/payouts/jamaica', `Bearer ${SECRET}`));
    expect(await jamaica.json()).toMatchObject({ success: true, payoutsCreated: 0 });
    expect(effects.createPayout).not.toHaveBeenCalled();

    const seasonal = await seasonalGet(request('/api/cron/seasonal-promo', `Bearer ${SECRET}`));
    expect(seasonal.status).toBe(400);

    const disabled = await payoutPost(request('/api/cron/process-payouts', undefined, SECRET));
    expect(await disabled.json()).toMatchObject({ processedBatches: 0 });
    expect(effects.processApprovedPayoutBatch).not.toHaveBeenCalled();

    const counted = await payoutGet(request('/api/cron/process-payouts', undefined, SECRET));
    expect(await counted.json()).toMatchObject({ ok: true, approvedBatches: 0 });

    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-08T15:00:00Z'));
    const readiness = await readinessPost(request('/api/cron/weekly-1099-readiness', undefined, SECRET));
    expect(await readiness.json()).toMatchObject({ skipped: true });
    vi.useRealTimers();
  });

  it('does not process payouts when the credential is wrong, even if payouts are enabled', async () => {
    vi.stubEnv('ENABLE_PAYOUTS', 'true');
    const response = await payoutPost(request('/api/cron/process-payouts', 'Bearer wrong-secret'));
    expect(response.status).toBe(401);
    expect(effects.processApprovedPayoutBatch).not.toHaveBeenCalled();
    expect(effects.dbCalls).toEqual([]);
  });

  it('leaves the static tax health checks public and free of database access', async () => {
    delete process.env.CRON_SECRET;
    expect((await w9Get()).status).toBe(200);
    expect((await readinessGet()).status).toBe(200);
    expect((await archiveGet()).status).toBe(200);
    expect(effects.dbCalls).toEqual([]);
  });

  it('requires a credential before the 24-hour reminder reports its WhatsApp configuration', async () => {
    const response = await reminderGet(request('/api/cron/reminder-24h', `Bearer ${SECRET}`));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: 'WHATSAPP_TOKEN not configured' });
    expect(effects.send24HourReminder).not.toHaveBeenCalled();
  });
});
