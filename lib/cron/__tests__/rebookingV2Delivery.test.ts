import { beforeEach, describe, expect, it, vi } from 'vitest';

const { create, updateMany, findUnique } = vi.hoisted(() => ({
  create: vi.fn(),
  updateMany: vi.fn(),
  findUnique: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    rebookingReminderDelivery: { create, updateMany, findUnique },
  },
}));

import { deliverAuthorizedRebookingReminder } from '@/lib/cron/rebookingV2Delivery';
import { fingerprintRebookingProviderRequest } from '@/lib/cron/rebookingPayloadFingerprint';
import { buildRebookingReminderProviderRequest } from '@/lib/email/cronAutomationEmails';
import { REBOOKING_SAFE_RETRY_MS } from '@/lib/cron/rebookingReminderClaim';

const now = new Date('2026-11-08T16:00:00.000Z');
const request = buildRebookingReminderProviderRequest({
  toEmail: 'host@example.com',
  hostFirstName: 'Alex',
  propertyAddress: '1 Main St',
  checkoutDate: new Date('2026-09-11T02:00:00.000Z'),
  idempotencyKey: 'rebooking-reminder-job-1',
  from: 'VelocityMaid <notify@example.com>',
});
const fingerprint = fingerprintRebookingProviderRequest(request);
const authorized = async () => ({ ok: true as const, generation: 4 });

type Row = {
  jobId: string;
  status: string;
  claimedAt: Date | null;
  firstProviderAttemptAt: Date | null;
  payloadFingerprint: string | null;
  providerMessageId: string | null;
  sendError: string | null;
};

function installStore(initial: Row | null) {
  let row = initial ? { ...initial } : null;
  create.mockImplementation(async ({ data }: { data: Row }) => {
    if (row) {
      const error = new Error('Unique constraint failed') as Error & { code: string };
      error.code = 'P2002';
      throw error;
    }
    row = {
      jobId: data.jobId,
      status: data.status,
      claimedAt: data.claimedAt,
      firstProviderAttemptAt: data.firstProviderAttemptAt,
      payloadFingerprint: data.payloadFingerprint,
      providerMessageId: null,
      sendError: null,
    };
    return row;
  });
  findUnique.mockImplementation(async () => row);
  updateMany.mockImplementation(async ({ where, data }: { where: Record<string, unknown>; data: Partial<Row> }) => {
    if (!row || row.jobId !== where.jobId) return { count: 0 };
    if (typeof where.status === 'string' && row.status !== where.status) return { count: 0 };
    if (where.claimedAt instanceof Date && row.claimedAt?.getTime() !== where.claimedAt.getTime()) return { count: 0 };
    if (where.payloadFingerprint === null && row.payloadFingerprint !== null) return { count: 0 };
    if (typeof where.payloadFingerprint === 'string' && row.payloadFingerprint !== where.payloadFingerprint) return { count: 0 };
    const window = where.firstProviderAttemptAt as { gte?: Date } | undefined;
    if (window?.gte && (row.firstProviderAttemptAt == null || row.firstProviderAttemptAt < window.gte)) return { count: 0 };
    if (Array.isArray(where.OR)) {
      const stale = where.OR.some((branch) => {
        const item = branch as { status?: string; claimedAt?: { lt?: Date } };
        if (item.status && item.status !== row?.status) return false;
        if (item.claimedAt?.lt && !(row?.claimedAt && row.claimedAt < item.claimedAt.lt)) return false;
        return true;
      });
      if (!stale) return { count: 0 };
    }
    row = { ...row, ...data };
    return { count: 1 };
  });
  return {
    read: () => row,
  };
}

describe('authorized rebooking delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not claim or send when authorization fails before the claim', async () => {
    const store = installStore(null);
    const send = vi.fn();
    const outcome = await deliverAuthorizedRebookingReminder({
      jobId: 'job-1',
      request,
      fingerprint,
      now,
      authorize: async () => ({ ok: false, reason: 'generation_changed' }),
      send,
    });
    expect(outcome).toEqual({ outcome: 'authorization_revoked', reason: 'generation_changed' });
    expect(create).not.toHaveBeenCalled();
    expect(send).not.toHaveBeenCalled();
    expect(store.read()).toBeNull();
  });

  it('stores the first fingerprint atomically and sends that same request', async () => {
    const store = installStore(null);
    const send = vi.fn(async (sent: typeof request) => {
      expect(sent).toBe(request);
      return { sent: true, id: 'msg-1' };
    });
    const outcome = await deliverAuthorizedRebookingReminder({
      jobId: 'job-1',
      request,
      fingerprint,
      now,
      authorize: authorized,
      send,
    });
    expect(outcome).toBe('sent');
    expect(store.read()).toMatchObject({
      status: 'ACCEPTED',
      payloadFingerprint: fingerprint,
      providerMessageId: 'msg-1',
      firstProviderAttemptAt: now,
    });
  });

  it('leaves the claim in place when authorization is revoked after the claim and before the send', async () => {
    const store = installStore(null);
    const send = vi.fn();
    let checks = 0;
    const outcome = await deliverAuthorizedRebookingReminder({
      jobId: 'job-1',
      request,
      fingerprint,
      now,
      authorize: async () => {
        checks += 1;
        return checks === 1 ? { ok: true, generation: 4 } : { ok: false, reason: 'control_disabled' };
      },
      send,
    });
    expect(outcome).toEqual({ outcome: 'authorization_revoked', reason: 'control_disabled' });
    expect(send).not.toHaveBeenCalled();
    expect(store.read()).toMatchObject({ status: 'CLAIMED', payloadFingerprint: fingerprint, firstProviderAttemptAt: now });
  });

  it('records UNKNOWN for a timeout, a missing message id, and both Resend 409 conflicts', async () => {
    for (const result of [
      { sent: false, outcomeUnknown: true, error: 'timeout' },
      { sent: true },
      { sent: false, outcomeUnknown: true, error: 'invalid_idempotent_request' },
      { sent: false, outcomeUnknown: true, error: 'concurrent_idempotent_requests' },
    ]) {
      const store = installStore(null);
      const outcome = await deliverAuthorizedRebookingReminder({
        jobId: 'job-1',
        request,
        fingerprint,
        now,
        authorize: authorized,
        send: async () => result,
      });
      expect(outcome).toBe('unknown');
      expect(store.read()?.status).toBe('UNKNOWN');
      expect(store.read()?.firstProviderAttemptAt).toEqual(now);
    }
  });

  it('records a definite provider failure without moving the first-attempt clock', async () => {
    const store = installStore(null);
    const outcome = await deliverAuthorizedRebookingReminder({
      jobId: 'job-1',
      request,
      fingerprint,
      now,
      authorize: authorized,
      send: async () => ({ sent: false, error: 'invalid email' }),
    });
    expect(outcome).toBe('failed');
    expect(store.read()).toMatchObject({ status: 'FAILED', claimedAt: null, firstProviderAttemptAt: now });
  });

  it('does not invent ACCEPTED when the provider accepts and the ledger write fails', async () => {
    installStore(null);
    updateMany.mockImplementation(async () => {
      throw new Error('database unavailable');
    });
    const outcome = await deliverAuthorizedRebookingReminder({
      jobId: 'job-1',
      request,
      fingerprint,
      now,
      authorize: authorized,
      send: async () => ({ sent: true, id: 'msg-1' }),
    });
    expect(outcome).toBe('accepted_unrecorded');
  });

  it('keeps a historical ACCEPTED row terminal when its fingerprint is null', async () => {
    const store = installStore({
      jobId: 'job-1',
      status: 'ACCEPTED',
      claimedAt: null,
      firstProviderAttemptAt: null,
      payloadFingerprint: null,
      providerMessageId: 'historical',
      sendError: null,
    });
    const send = vi.fn();
    const outcome = await deliverAuthorizedRebookingReminder({
      jobId: 'job-1',
      request,
      fingerprint,
      now,
      authorize: authorized,
      send,
    });
    expect(outcome).toBe('skipped');
    expect(send).not.toHaveBeenCalled();
    expect(store.read()).toMatchObject({ status: 'ACCEPTED', payloadFingerprint: null, providerMessageId: 'historical' });
  });

  it('holds a nonterminal row with no original fingerprint and does not send', async () => {
    const store = installStore({
      jobId: 'job-1',
      status: 'FAILED',
      claimedAt: null,
      firstProviderAttemptAt: now,
      payloadFingerprint: null,
      providerMessageId: null,
      sendError: 'earlier',
    });
    const send = vi.fn();
    const outcome = await deliverAuthorizedRebookingReminder({
      jobId: 'job-1',
      request,
      fingerprint,
      now,
      authorize: authorized,
      send,
    });
    expect(outcome).toBe('fingerprint_missing');
    expect(send).not.toHaveBeenCalled();
    expect(store.read()?.status).toBe('UNKNOWN');
    expect(store.read()?.payloadFingerprint).toBeNull();
  });

  it('retries an identical payload and holds a changed payload without a new key', async () => {
    const stored = installStore({
      jobId: 'job-1',
      status: 'FAILED',
      claimedAt: null,
      firstProviderAttemptAt: now,
      payloadFingerprint: fingerprint,
      providerMessageId: null,
      sendError: 'earlier',
    });
    const send = vi.fn(async () => ({ sent: true, id: 'msg-2' }));
    const same = await deliverAuthorizedRebookingReminder({
      jobId: 'job-1',
      request,
      fingerprint,
      now: new Date(now.getTime() + 60_000),
      authorize: authorized,
      send,
    });
    expect(same).toBe('sent');
    expect(send).toHaveBeenCalledWith(request);
    expect(stored.read()?.payloadFingerprint).toBe(fingerprint);
    expect(stored.read()?.firstProviderAttemptAt).toEqual(now);

    const changedRequest = { ...request, subject: 'Changed subject' };
    const changedStore = installStore({
      jobId: 'job-1',
      status: 'FAILED',
      claimedAt: null,
      firstProviderAttemptAt: now,
      payloadFingerprint: fingerprint,
      providerMessageId: null,
      sendError: null,
    });
    const changedSend = vi.fn();
    const changed = await deliverAuthorizedRebookingReminder({
      jobId: 'job-1',
      request: changedRequest,
      fingerprint: fingerprintRebookingProviderRequest(changedRequest),
      now: new Date(now.getTime() + 60_000),
      authorize: authorized,
      send: changedSend,
    });
    expect(changed).toBe('payload_mismatch');
    expect(changedSend).not.toHaveBeenCalled();
    expect(changedStore.read()?.status).toBe('UNKNOWN');
    expect(changedStore.read()?.payloadFingerprint).toBe(fingerprint);
  });

  it('lets one of two competing claims win and leaves the other unsent', async () => {
    const store = installStore(null);
    const send = vi.fn(async () => ({ sent: true, id: 'msg-1' }));
    const [first, second] = await Promise.all([
      deliverAuthorizedRebookingReminder({ jobId: 'job-1', request, fingerprint, now, authorize: authorized, send }),
      deliverAuthorizedRebookingReminder({ jobId: 'job-1', request, fingerprint, now, authorize: authorized, send }),
    ]);
    expect([first, second].sort()).toEqual(['not_claimed', 'sent']);
    expect(send).toHaveBeenCalledTimes(1);
    expect(store.read()?.status).toBe('ACCEPTED');
  });

  it('does not retry outside the 22 hour window and still retries at the boundary', async () => {
    const expired = installStore({
      jobId: 'job-1',
      status: 'FAILED',
      claimedAt: null,
      firstProviderAttemptAt: new Date(now.getTime() - REBOOKING_SAFE_RETRY_MS - 1),
      payloadFingerprint: fingerprint,
      providerMessageId: null,
      sendError: 'earlier',
    });
    const send = vi.fn();
    expect(await deliverAuthorizedRebookingReminder({
      jobId: 'job-1', request, fingerprint, now, authorize: authorized, send,
    })).toBe('not_claimed');
    expect(send).not.toHaveBeenCalled();
    expect(expired.read()?.status).toBe('FAILED');

    const boundary = installStore({
      jobId: 'job-1',
      status: 'FAILED',
      claimedAt: null,
      firstProviderAttemptAt: new Date(now.getTime() - REBOOKING_SAFE_RETRY_MS),
      payloadFingerprint: fingerprint,
      providerMessageId: null,
      sendError: 'earlier',
    });
    const boundarySend = vi.fn(async () => ({ sent: true, id: 'msg-boundary' }));
    expect(await deliverAuthorizedRebookingReminder({
      jobId: 'job-1', request, fingerprint, now, authorize: authorized, send: boundarySend,
    })).toBe('sent');
    expect(boundary.read()?.firstProviderAttemptAt).toEqual(new Date(now.getTime() - REBOOKING_SAFE_RETRY_MS));
  });
});
