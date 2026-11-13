import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildRebookingReminderProviderRequest } from '@/lib/email/cronAutomationEmails';
import {
  evaluateRebookingExecutionControl,
  type RebookingControlRow,
} from '@/lib/cron/rebookingExecutionControl';
import {
  canonicalRebookingProviderRequest,
  fingerprintRebookingProviderRequest,
} from '@/lib/cron/rebookingPayloadFingerprint';
import { readRebookingRuntimeIdentity } from '@/lib/cron/rebookingRuntimeIdentity';
import { orderRebookingCandidates, REBOOKING_V2_BATCH_LIMIT } from '@/lib/cron/rebookingV2Run';

const DEPLOYMENT = 'dpl_AcceptedDeployment123';
const SHA = 'e0dfe44cf94423910c9c5c9d2a05863db224fcfd';

const enabled: RebookingControlRow = {
  workerKey: 'rebooking-reminders',
  enabled: true,
  approvedDeploymentId: DEPLOYMENT,
  approvedCommitSha: SHA,
  generation: 4,
  updatedBy: 'operator:founder',
};

const identity = readRebookingRuntimeIdentity({
  VERCEL_ENV: 'production',
  VERCEL_DEPLOYMENT_ID: DEPLOYMENT,
  VERCEL_GIT_COMMIT_SHA: SHA,
} as unknown as NodeJS.ProcessEnv);

function decide(overrides: Partial<Parameters<typeof evaluateRebookingExecutionControl>[0]> = {}) {
  return evaluateRebookingExecutionControl({
    flag: 'true',
    identity,
    control: enabled,
    ...overrides,
  });
}

describe('rebooking v2 authorization', () => {
  it('rejects every flag that is not the exact word true', () => {
    for (const flag of [null, undefined, '', '   ', 'false', '0', 'off', 'disabled', 'yes', '1', 'TRUE ']) {
      expect(decide({ flag }).ok).toBe(flag?.trim().toLowerCase() === 'true');
    }
    expect(decide({ flag: 'false' })).toEqual({ ok: false, reason: 'flag' });
    expect(decide({ flag: undefined })).toEqual({ ok: false, reason: 'flag' });
    expect(decide({ flag: '' })).toEqual({ ok: false, reason: 'flag' });
    expect(decide({ flag: 'yes' })).toEqual({ ok: false, reason: 'flag' });
  });

  it('accepts an explicit true flag only with production identity and the live control row', () => {
    expect(decide()).toEqual({ ok: true, generation: 4 });
  });

  it('rejects preview, development, missing, and unknown environments', () => {
    for (const VERCEL_ENV of ['preview', 'development', '', 'staging']) {
      const result = decide({
        identity: readRebookingRuntimeIdentity({
          VERCEL_ENV,
          VERCEL_DEPLOYMENT_ID: DEPLOYMENT,
          VERCEL_GIT_COMMIT_SHA: SHA,
        } as unknown as NodeJS.ProcessEnv),
      });
      expect(result).toEqual({ ok: false, reason: 'environment' });
    }
  });

  it('rejects missing or malformed runtime identity and ignores caller-supplied values', () => {
    expect(decide({
      identity: readRebookingRuntimeIdentity({
        VERCEL_ENV: 'production',
        VERCEL_GIT_COMMIT_SHA: SHA,
        'x-vercel-deployment-id': DEPLOYMENT,
      } as unknown as NodeJS.ProcessEnv),
    })).toEqual({ ok: false, reason: 'deployment_id' });
    expect(decide({
      identity: readRebookingRuntimeIdentity({
        VERCEL_ENV: 'production',
        VERCEL_DEPLOYMENT_ID: DEPLOYMENT,
      } as unknown as NodeJS.ProcessEnv),
    })).toEqual({ ok: false, reason: 'commit_sha' });
    expect(decide({
      identity: readRebookingRuntimeIdentity({
        VERCEL_ENV: 'production',
        VERCEL_DEPLOYMENT_ID: 'not-a-deployment',
        VERCEL_GIT_COMMIT_SHA: SHA,
      } as unknown as NodeJS.ProcessEnv),
    })).toEqual({ ok: false, reason: 'deployment_id' });
  });

  it('rejects a deployment or commit that is not the approved value', () => {
    expect(decide({
      identity: readRebookingRuntimeIdentity({
        VERCEL_ENV: 'production',
        VERCEL_DEPLOYMENT_ID: 'dpl_OtherDeployment123',
        VERCEL_GIT_COMMIT_SHA: SHA,
      } as unknown as NodeJS.ProcessEnv),
    })).toEqual({ ok: false, reason: 'deployment_mismatch' });
    expect(decide({
      identity: readRebookingRuntimeIdentity({
        VERCEL_ENV: 'production',
        VERCEL_DEPLOYMENT_ID: DEPLOYMENT,
        VERCEL_GIT_COMMIT_SHA: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      } as unknown as NodeJS.ProcessEnv),
    })).toEqual({ ok: false, reason: 'commit_mismatch' });
  });

  it('rejects a missing, disabled, invalid, or unreadable control record', () => {
    expect(decide({ control: null })).toEqual({ ok: false, reason: 'control_missing' });
    expect(decide({ control: { ...enabled, enabled: false } })).toEqual({ ok: false, reason: 'control_disabled' });
    expect(decide({ control: { ...enabled, generation: 0 } })).toEqual({ ok: false, reason: 'generation_invalid' });
    expect(decide({ control: { ...enabled, updatedBy: '  ' } })).toEqual({ ok: false, reason: 'control_invalid' });
    expect(decide({ controlError: true })).toEqual({ ok: false, reason: 'control_lookup_failed' });
  });

  it('rejects a generation that changed after the run began', () => {
    expect(decide({ expectedGeneration: 4 })).toEqual({ ok: true, generation: 4 });
    expect(decide({ expectedGeneration: 5 })).toEqual({ ok: false, reason: 'generation_changed' });
  });
});

describe('rebooking payload fingerprint', () => {
  const request = buildRebookingReminderProviderRequest({
    toEmail: 'host@example.com',
    hostFirstName: 'Alex',
    propertyAddress: '1 Main St',
    checkoutDate: new Date('2026-09-11T02:00:00.000Z'),
    idempotencyKey: 'rebooking-reminder-job-1',
    from: 'VelocityMaid <notify@example.com>',
  });

  it('hashes the same canonical request that the provider call uses', () => {
    const canonical = canonicalRebookingProviderRequest(request);
    const parsed = JSON.parse(canonical) as Record<string, unknown>;
    expect(Object.keys(parsed)).toEqual([
      'attachments', 'bcc', 'cc', 'from', 'headers', 'html', 'idempotencyKey', 'replyTo', 'subject', 'text', 'to',
    ]);
    expect(parsed.from).toBe(request.from);
    expect(parsed.to).toBe(request.to);
    expect(parsed.subject).toBe(request.subject);
    expect(parsed.text).toBe(request.text);
    expect(parsed.html).toBe(request.html);
    expect(parsed.replyTo).toBeNull();
    expect(fingerprintRebookingProviderRequest(request)).toBe(
      createHash('sha256').update(canonical, 'utf8').digest('hex')
    );
    expect(fingerprintRebookingProviderRequest(request)).toBe(fingerprintRebookingProviderRequest({ ...request }));
    expect(fingerprintRebookingProviderRequest({ ...request, text: `${request.text} ` })).not.toBe(
      fingerprintRebookingProviderRequest(request)
    );
  });
});

describe('rebooking candidate ordering', () => {
  it('orders by checkout and then id, and keeps at most five', () => {
    const same = new Date('2026-11-20T12:00:00.000Z');
    const ordered = orderRebookingCandidates([
      { id: 'b', preferredDate: same },
      { id: 'a', preferredDate: same },
      { id: 'z', preferredDate: new Date('2026-11-21T12:00:00.000Z') },
      { id: 'c', preferredDate: new Date('2026-11-19T12:00:00.000Z') },
      { id: 'd', preferredDate: same },
      { id: 'e', preferredDate: same },
      { id: 'f', preferredDate: same },
    ]);
    expect(REBOOKING_V2_BATCH_LIMIT).toBe(5);
    expect(ordered.map((job) => job.id)).toEqual(['c', 'a', 'b', 'd', 'e']);
    expect(orderRebookingCandidates([])).toEqual([]);
    expect(orderRebookingCandidates([{ id: 'only', preferredDate: same }]).map((job) => job.id)).toEqual(['only']);
  });
});

describe('scheduler and migration locks', () => {
  it('keeps the production scheduler on the original rebooking path', () => {
    const vercel = JSON.parse(readFileSync(join(process.cwd(), 'vercel.json'), 'utf8')) as {
      crons: Array<{ path: string; schedule: string }>;
    };
    expect(vercel.crons).toEqual([
      { path: '/api/cron/send-review-requests', schedule: '0 10 * * *' },
      { path: '/api/cron/send-feedback-reminders', schedule: '0 11 * * *' },
      { path: '/api/cron/invoice-reminders', schedule: '0 15 * * *' },
      { path: '/api/cron/rebooking-reminders', schedule: '0 8 * * *' },
      { path: '/api/cron/lead-followup', schedule: '0 10 * * *' },
      { path: '/api/cron/reminder-24h', schedule: '0 14 * * *' },
      { path: '/api/cron/on-the-way', schedule: '0 12 * * *' },
      { path: '/api/cron/dispatch-offer-expire', schedule: '15 4 * * *' },
    ]);
  });

  it('inserts a disabled control row and does not rewrite the historical ledger migration', () => {
    const sql = readFileSync(
      join(process.cwd(), 'prisma/migrations/20261113140000_rebooking_v2_execution_control/migration.sql'),
      'utf8'
    );
    expect(sql).toContain("'rebooking-reminders'");
    expect(sql).toContain('false');
    expect(sql).toContain('ON CONFLICT ("workerKey") DO NOTHING');
    expect(sql).not.toContain('DROP TABLE');
    expect(sql).toContain('payloadFingerprint');
    const historical = readFileSync(
      join(process.cwd(), 'prisma/migrations/20261110170000_rebooking_reminder_delivery/migration.sql'),
      'utf8'
    );
    expect(historical).toContain('rbkbackfill_');
    expect(historical).not.toContain('payloadFingerprint');
  });
});

describe('authorizeRebookingExecution does not query before the cheap gates', () => {
  const load = vi.fn(async () => enabled);

  beforeEach(() => {
    load.mockClear();
  });

  it('stops on the flag, environment, and identity before the control lookup', async () => {
    const { authorizeRebookingExecution } = await import('@/lib/cron/rebookingExecutionControl');
    const denied = await authorizeRebookingExecution({
      flag: 'false',
      env: { VERCEL_ENV: 'production', VERCEL_DEPLOYMENT_ID: DEPLOYMENT, VERCEL_GIT_COMMIT_SHA: SHA } as unknown as NodeJS.ProcessEnv,
      load,
    });
    expect(denied).toEqual({ ok: false, reason: 'flag' });
    expect(load).not.toHaveBeenCalled();
  });
});
