import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const { create, updateMany, auditFindMany, send } = vi.hoisted(() => ({
  create: vi.fn(),
  updateMany: vi.fn(),
  auditFindMany: vi.fn(),
  send: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    rebookingReminderDelivery: { create, updateMany },
    auditLog: { findMany: auditFindMany },
  },
}));

import {
  REBOOKING_CLAIM_STALE_MS,
  REBOOKING_SAFE_RETRY_MS,
  backfillSentRebookingReminders,
  claimRebookingReminder,
  deliverClaimedRebookingReminder,
  parkExpiredRebookingClaims,
  rebookingReminderIdempotencyKey,
} from '@/lib/cron/rebookingReminderClaim';

const JOB_ID = 'job-1';
const now = new Date('2026-11-08T16:00:00.000Z');

const delivery = {
  jobId: JOB_ID,
  toEmail: 'host@example.com',
  hostFirstName: 'Alex',
  propertyAddress: '1 Main St',
  checkoutDate: new Date('2026-09-11T02:00:00.000Z'),
  now,
  send,
};

type StoredDelivery = {
  jobId: string;
  status: string;
  claimedAt: Date | null;
  firstProviderAttemptAt: Date | null;
  providerMessageId: string | null;
  sendError: string | null;
};

function dateMatches(value: Date | null, filter: unknown): boolean {
  if (filter === null) return value === null;
  if (filter instanceof Date) return value?.getTime() === filter.getTime();
  if (!filter || typeof filter !== 'object') return true;
  const range = filter as { lt?: Date; gte?: Date };
  if (value == null) return false;
  const time = value.getTime();
  if (range.lt && !(time < range.lt.getTime())) return false;
  if (range.gte && !(time >= range.gte.getTime())) return false;
  return true;
}

function whereMatches(row: StoredDelivery, where: Record<string, unknown>): boolean {
  if (where.jobId != null && where.jobId !== row.jobId) return false;
  if (typeof where.status !== 'undefined' && where.status !== row.status) return false;
  if ('claimedAt' in where && !dateMatches(row.claimedAt, where.claimedAt)) return false;
  if (
    'firstProviderAttemptAt' in where &&
    !dateMatches(row.firstProviderAttemptAt, where.firstProviderAttemptAt)
  ) {
    return false;
  }
  if (Array.isArray(where.OR)) {
    return where.OR.some((branch) => whereMatches(row, branch as Record<string, unknown>));
  }
  return true;
}

function uniqueError() {
  return Object.assign(new Error('Unique constraint failed'), { code: 'P2002' });
}

describe('rebooking reminder migration backfill', () => {
  it('records historical sends as accepted without starting an idempotency clock', () => {
    const sql = readFileSync(
      join(
        process.cwd(),
        'prisma/migrations/20261110170000_rebooking_reminder_delivery/migration.sql'
      ),
      'utf8'
    );
    expect(sql).toContain('CREATE UNIQUE INDEX "rebooking_reminder_deliveries_jobId_key"');
    expect(sql).toContain("'REBOOKING_REMINDER_SENT'");
    expect(sql).toContain("'ACCEPTED'");
    expect(sql).toContain('ON CONFLICT ("jobId") DO NOTHING');
    const insert = sql.slice(sql.indexOf('INSERT INTO'));
    expect(insert).not.toContain('claimedAt');
    expect(insert).not.toContain('firstProviderAttemptAt');
  });
});

describe('rebooking reminder claims', () => {
  let rows: Map<string, StoredDelivery>;

  beforeEach(() => {
    rows = new Map();
    send.mockReset();
    create.mockReset();
    updateMany.mockReset();
    auditFindMany.mockReset();
    send.mockResolvedValue({ sent: true, id: 'email-1' });

    create.mockImplementation(async (args: { data: Partial<StoredDelivery> & { jobId: string; status: string } }) => {
      if (rows.has(args.data.jobId)) throw uniqueError();
      rows.set(args.data.jobId, {
        jobId: args.data.jobId,
        status: args.data.status,
        claimedAt: args.data.claimedAt ?? null,
        firstProviderAttemptAt: args.data.firstProviderAttemptAt ?? null,
        providerMessageId: args.data.providerMessageId ?? null,
        sendError: args.data.sendError ?? null,
      });
      return rows.get(args.data.jobId);
    });

    updateMany.mockImplementation(async (args: { where: Record<string, unknown>; data: Partial<StoredDelivery> }) => {
      let count = 0;
      for (const row of rows.values()) {
        if (!whereMatches(row, args.where)) continue;
        if ('status' in args.data && args.data.status) row.status = args.data.status;
        if ('claimedAt' in args.data) row.claimedAt = args.data.claimedAt ?? null;
        if ('firstProviderAttemptAt' in args.data) {
          row.firstProviderAttemptAt = args.data.firstProviderAttemptAt ?? null;
        }
        if ('providerMessageId' in args.data) row.providerMessageId = args.data.providerMessageId ?? null;
        if ('sendError' in args.data) row.sendError = args.data.sendError ?? null;
        count += 1;
      }
      return { count };
    });
  });

  it('lets only one of two concurrent claims call the provider, with one idempotency key', async () => {
    const [first, second] = await Promise.all([
      deliverClaimedRebookingReminder(delivery),
      deliverClaimedRebookingReminder(delivery),
    ]);

    expect(new Set([first, second])).toEqual(new Set(['not_claimed', 'sent']));
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].idempotencyKey).toBe(rebookingReminderIdempotencyKey(JOB_ID));
    expect(rows.get(JOB_ID)?.status).toBe('ACCEPTED');
    expect(rows.get(JOB_ID)?.firstProviderAttemptAt).toEqual(now);
  });

  it('does not send again after a historical reminder is backfilled as accepted', async () => {
    auditFindMany.mockResolvedValue([{ entityId: JOB_ID }, { entityId: JOB_ID }]);

    await expect(backfillSentRebookingReminders()).resolves.toBe(1);
    await expect(backfillSentRebookingReminders()).resolves.toBe(0);

    const row = rows.get(JOB_ID);
    expect(row).toMatchObject({
      status: 'ACCEPTED',
      claimedAt: null,
      firstProviderAttemptAt: null,
    });
    await expect(deliverClaimedRebookingReminder(delivery)).resolves.toBe('not_claimed');
    expect(send).not.toHaveBeenCalled();
  });

  it('backfills every distinct sent job and does not overwrite an in-flight row', async () => {
    const claimedAt = new Date('2026-11-08T15:00:00.000Z');
    rows.set('claimed-job', {
      jobId: 'claimed-job',
      status: 'CLAIMED',
      claimedAt,
      firstProviderAttemptAt: claimedAt,
      providerMessageId: null,
      sendError: null,
    });
    rows.set('failed-job', {
      jobId: 'failed-job',
      status: 'FAILED',
      claimedAt: null,
      firstProviderAttemptAt: claimedAt,
      providerMessageId: null,
      sendError: 'mailbox unavailable',
    });
    rows.set('unknown-job', {
      jobId: 'unknown-job',
      status: 'UNKNOWN',
      claimedAt,
      firstProviderAttemptAt: claimedAt,
      providerMessageId: null,
      sendError: 'timeout',
    });
    auditFindMany.mockResolvedValue([
      { entityId: 'claimed-job' },
      { entityId: 'failed-job' },
      { entityId: 'unknown-job' },
      { entityId: 'new-job' },
      { entityId: 'new-job' },
      { entityId: '' },
      { entityId: null },
    ]);
    create.mockImplementation(async (args: { data: { jobId: string; status: string } }) => {
      if (args.data.jobId === 'missing-job') {
        throw Object.assign(new Error('foreign key'), { code: 'P2003' });
      }
      if (rows.has(args.data.jobId)) throw uniqueError();
      rows.set(args.data.jobId, {
        jobId: args.data.jobId,
        status: args.data.status,
        claimedAt: null,
        firstProviderAttemptAt: null,
        providerMessageId: null,
        sendError: null,
      });
      return rows.get(args.data.jobId);
    });

    await expect(backfillSentRebookingReminders()).resolves.toBe(1);

    expect(rows.get('claimed-job')).toMatchObject({ status: 'CLAIMED', claimedAt, firstProviderAttemptAt: claimedAt });
    expect(rows.get('failed-job')).toMatchObject({ status: 'FAILED', firstProviderAttemptAt: claimedAt });
    expect(rows.get('unknown-job')).toMatchObject({ status: 'UNKNOWN', firstProviderAttemptAt: claimedAt });
    expect(rows.get('new-job')).toMatchObject({
      status: 'ACCEPTED',
      claimedAt: null,
      firstProviderAttemptAt: null,
    });
    expect(rows.has('')).toBe(false);
  });

  it('parks timeouts, missing ids, and uncertain provider results, and does not resend them', async () => {
    send.mockRejectedValueOnce(new Error('timeout'));
    await expect(deliverClaimedRebookingReminder(delivery)).resolves.toBe('unknown');
    expect(rows.get(JOB_ID)?.status).toBe('UNKNOWN');
    expect(rows.get(JOB_ID)?.claimedAt).toEqual(now);

    send.mockClear();
    await expect(deliverClaimedRebookingReminder(delivery)).resolves.toBe('not_claimed');
    expect(send).not.toHaveBeenCalled();

    rows.clear();
    send.mockResolvedValueOnce({ sent: true });
    await expect(deliverClaimedRebookingReminder(delivery)).resolves.toBe('unknown');
    expect(rows.get(JOB_ID)?.status).toBe('UNKNOWN');

    rows.clear();
    send.mockResolvedValueOnce({ sent: false, error: '409 conflict', outcomeUnknown: true });
    await expect(deliverClaimedRebookingReminder(delivery)).resolves.toBe('unknown');
    const parked = rows.get(JOB_ID);
    expect(parked?.status).toBe('UNKNOWN');
    expect(parked?.claimedAt).toEqual(now);
    expect(parked?.firstProviderAttemptAt).toEqual(now);

    send.mockClear();
    const later = new Date(now.getTime() + REBOOKING_SAFE_RETRY_MS);
    await expect(deliverClaimedRebookingReminder({ ...delivery, now: later })).resolves.toBe('not_claimed');
    expect(send).not.toHaveBeenCalled();
    expect(rows.get(JOB_ID)?.status).toBe('UNKNOWN');
  });

  it('clears a definite failure for retry and keeps the original attempt time', async () => {
    send.mockResolvedValue({ sent: false, error: 'mailbox unavailable', outcomeUnknown: false });
    await expect(deliverClaimedRebookingReminder(delivery)).resolves.toBe('failed');

    const failed = rows.get(JOB_ID);
    expect(failed?.status).toBe('FAILED');
    expect(failed?.claimedAt).toBeNull();
    expect(failed?.firstProviderAttemptAt).toEqual(now);

    const inside = new Date(now.getTime() + REBOOKING_SAFE_RETRY_MS);
    send.mockClear();
    send.mockResolvedValue({ sent: false, error: 'mailbox unavailable', outcomeUnknown: false });
    await expect(deliverClaimedRebookingReminder({ ...delivery, now: inside })).resolves.toBe('failed');
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].idempotencyKey).toBe('rebooking-reminder-job-1');
    expect(rows.get(JOB_ID)?.firstProviderAttemptAt).toEqual(now);
    expect(rows.get(JOB_ID)?.claimedAt).toBeNull();
  });

  it('reclaims a stale claim without moving the original attempt time', async () => {
    const firstAttempt = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const staleClaim = new Date(now.getTime() - REBOOKING_CLAIM_STALE_MS - 1);
    rows.set(JOB_ID, {
      jobId: JOB_ID,
      status: 'CLAIMED',
      claimedAt: staleClaim,
      firstProviderAttemptAt: firstAttempt,
      providerMessageId: null,
      sendError: 'previous worker stopped',
    });

    await expect(deliverClaimedRebookingReminder(delivery)).resolves.toBe('sent');

    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].idempotencyKey).toBe('rebooking-reminder-job-1');
    expect(rows.get(JOB_ID)).toMatchObject({
      status: 'ACCEPTED',
      claimedAt: now,
      firstProviderAttemptAt: firstAttempt,
    });
    const reclaim = updateMany.mock.calls.find(
      (call) => call[0].data?.status === 'CLAIMED' && call[0].data?.claimedAt === now
    );
    expect(reclaim?.[0].data).not.toHaveProperty('firstProviderAttemptAt');
  });

  it('does not steal a claim that is still inside 15 minutes', async () => {
    const firstAttempt = new Date(now.getTime() - 60 * 60 * 1000);
    const freshClaim = new Date(now.getTime() - REBOOKING_CLAIM_STALE_MS);
    rows.set(JOB_ID, {
      jobId: JOB_ID,
      status: 'CLAIMED',
      claimedAt: freshClaim,
      firstProviderAttemptAt: firstAttempt,
      providerMessageId: null,
      sendError: null,
    });

    await expect(claimRebookingReminder(JOB_ID, now)).resolves.toBeNull();
    expect(rows.get(JOB_ID)).toMatchObject({
      status: 'CLAIMED',
      claimedAt: freshClaim,
      firstProviderAttemptAt: firstAttempt,
    });
    expect(send).not.toHaveBeenCalled();
  });

  it('does not retry after the 22-hour cutoff even when claimedAt is still fresh', async () => {
    const start = new Date('2026-11-08T00:00:00.000Z');
    const later = new Date(start.getTime() + REBOOKING_SAFE_RETRY_MS + 1);
    rows.set(JOB_ID, {
      jobId: JOB_ID,
      status: 'CLAIMED',
      claimedAt: new Date(later.getTime() - 60_000),
      firstProviderAttemptAt: start,
      providerMessageId: null,
      sendError: null,
    });

    await expect(claimRebookingReminder(JOB_ID, later)).resolves.toBeNull();
    expect(rows.get(JOB_ID)?.claimedAt).toEqual(new Date(later.getTime() - 60_000));
    expect(rows.get(JOB_ID)?.firstProviderAttemptAt).toEqual(start);

    await expect(parkExpiredRebookingClaims(later)).resolves.toBe(1);
    expect(rows.get(JOB_ID)?.status).toBe('UNKNOWN');
    expect(rows.get(JOB_ID)?.firstProviderAttemptAt).toEqual(start);
    expect(send).not.toHaveBeenCalled();
    expect(later.getTime() - start.getTime()).toBeGreaterThan(REBOOKING_SAFE_RETRY_MS);
    expect(later.getTime() - (later.getTime() - 60_000)).toBeLessThan(REBOOKING_CLAIM_STALE_MS);
  });
});
