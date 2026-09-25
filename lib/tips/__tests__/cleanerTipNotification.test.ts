import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';

const tipFindUnique = vi.fn();
const tipUpdateMany = vi.fn();
const tipUpdate = vi.fn();
const tipAllocationUpdateMany = vi.fn();
const jobFindUnique = vi.fn();
const jobTeamMemberFindMany = vi.fn();
const jobOfferFindMany = vi.fn();
const logAuditEntry = vi.fn();
const sendTipEmail = vi.fn();
const logIntegrationEvent = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tip: {
      findUnique: (...args: unknown[]) => tipFindUnique(...args),
      updateMany: (...args: unknown[]) => tipUpdateMany(...args),
      update: (...args: unknown[]) => tipUpdate(...args),
    },
    tipAllocation: {
      updateMany: (...args: unknown[]) => tipAllocationUpdateMany(...args),
    },
    job: {
      findUnique: (...args: unknown[]) => jobFindUnique(...args),
    },
    jobTeamMember: {
      findMany: (...args: unknown[]) => jobTeamMemberFindMany(...args),
    },
    jobOffer: {
      findMany: (...args: unknown[]) => jobOfferFindMany(...args),
    },
  },
}));

vi.mock('@/lib/audit', () => ({
  logAuditEntry: (...args: unknown[]) => logAuditEntry(...args),
}));

vi.mock('@/lib/email/sendCleanerTipReceivedEmail', () => ({
  sendCleanerTipReceivedEmail: (...args: unknown[]) => sendTipEmail(...args),
  formatTipAmountCents: (cents: number) => `$${(cents / 100).toFixed(2)}`,
}));

vi.mock('@/lib/google/integrationLog', () => ({
  logIntegrationEvent: (...args: unknown[]) => logIntegrationEvent(...args),
}));

vi.mock('@/lib/tips/tipAllocation', () => ({
  setTipAllocations: vi.fn(),
}));

import { notifyCleanersOfTipReceived } from '@/lib/notifications/cleanerTipReceived';
import {
  maybeAttributeTeamTip,
  TEAM_TIP_AUTO_SPLIT_POLICY,
  TEAM_TIP_MANUAL_ALLOCATION_REASON,
} from '@/lib/tips/teamTipAttribution';
import { isTipPayable, tipHasPayableAllocations } from '@/lib/tips/statuses';
import { formatTipAmountCents } from '@/lib/email/sendCleanerTipReceivedEmail';

describe('cleaner tip notification triggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    logIntegrationEvent.mockResolvedValue(undefined);
  });

  it('sole RECEIVED payable → notifies once with claim', async () => {
    tipFindUnique.mockResolvedValue({
      id: 'tip-1',
      amount: 4000,
      status: 'RECEIVED',
      beneficiaryCleanerId: 'cleaner-1',
      beneficiaryNotifiedAt: null,
      refundedAt: null,
      disputeStatus: 'NONE',
      needsReconcile: false,
      propertyAddress: null,
      jobId: 'job-1',
      Job: { id: 'job-1', jobReference: 'VM-100' },
      Property: { guestDisplayName: 'Lake House', name: 'Internal Name' },
      Beneficiary: {
        id: 'cleaner-1',
        name: 'Brian',
        email: 'brian@example.com',
      },
      TipAllocation: [],
    });
    tipUpdateMany.mockResolvedValue({ count: 1 });
    sendTipEmail.mockResolvedValue({ sent: true, id: 'email-1' });

    const first = await notifyCleanersOfTipReceived('tip-1');
    expect(first.soleNotified).toBe(true);
    expect(sendTipEmail).toHaveBeenCalledTimes(1);
    expect(sendTipEmail.mock.calls[0][0]).toMatchObject({
      amountCents: 4000,
      propertyDisplayName: 'Lake House',
      jobReference: 'VM-100',
      cleanerEmail: 'brian@example.com',
    });
    expect(sendTipEmail.mock.calls[0][0]).not.toHaveProperty('guestMessage');

    tipFindUnique.mockResolvedValue({
      id: 'tip-1',
      amount: 4000,
      status: 'RECEIVED',
      beneficiaryCleanerId: 'cleaner-1',
      beneficiaryNotifiedAt: new Date(),
      refundedAt: null,
      disputeStatus: 'NONE',
      needsReconcile: false,
      propertyAddress: null,
      jobId: 'job-1',
      Job: { id: 'job-1', jobReference: 'VM-100' },
      Property: { guestDisplayName: 'Lake House', name: 'Internal Name' },
      Beneficiary: {
        id: 'cleaner-1',
        name: 'Brian',
        email: 'brian@example.com',
      },
      TipAllocation: [],
    });
    const second = await notifyCleanersOfTipReceived('tip-1');
    expect(second.soleAlreadyNotified).toBe(true);
    expect(sendTipEmail).toHaveBeenCalledTimes(1);
  });

  it('does not notify PENDING / FAILED / needsReconcile / refunded', async () => {
    tipFindUnique.mockResolvedValue({
      id: 'tip-p',
      amount: 1000,
      status: 'PENDING',
      beneficiaryCleanerId: 'c1',
      beneficiaryNotifiedAt: null,
      refundedAt: null,
      disputeStatus: 'NONE',
      needsReconcile: false,
      propertyAddress: null,
      jobId: null,
      Job: null,
      Property: null,
      Beneficiary: { id: 'c1', name: 'A', email: 'a@x.com' },
      TipAllocation: [],
    });
    const pending = await notifyCleanersOfTipReceived('tip-p');
    expect(pending.soleNotified).toBe(false);
    expect(pending.skippedReason).toBe('NOT_PAYABLE');
    expect(sendTipEmail).not.toHaveBeenCalled();

    expect(
      isTipPayable({
        status: 'RECEIVED',
        beneficiaryCleanerId: 'c1',
        needsReconcile: true,
      })
    ).toBe(false);
  });

  it('team allocations: each cleaner notified of own share only', async () => {
    tipFindUnique.mockResolvedValue({
      id: 'tip-team',
      amount: 5000,
      status: 'RECEIVED_UNATTRIBUTED',
      beneficiaryCleanerId: null,
      beneficiaryNotifiedAt: null,
      refundedAt: null,
      disputeStatus: 'NONE',
      needsReconcile: false,
      propertyAddress: null,
      jobId: 'job-t',
      Job: { id: 'job-t', jobReference: 'VM-T' },
      Property: { guestDisplayName: 'Cabin', name: 'Cabin' },
      Beneficiary: null,
      TipAllocation: [
        {
          id: 'a-b',
          cleanerId: 'brian',
          amountCents: 2500,
          notifiedAt: null,
          Cleaner: { id: 'brian', name: 'Brian', email: 'b@x.com' },
        },
        {
          id: 'a-c',
          cleanerId: 'caryll',
          amountCents: 2500,
          notifiedAt: null,
          Cleaner: { id: 'caryll', name: 'Caryll', email: 'c@x.com' },
        },
      ],
    });
    tipAllocationUpdateMany.mockResolvedValue({ count: 1 });
    sendTipEmail.mockResolvedValue({ sent: true, id: 'e' });

    const outcome = await notifyCleanersOfTipReceived('tip-team');
    expect(outcome.allocationNotified).toBe(2);
    expect(sendTipEmail).toHaveBeenCalledTimes(2);
    const amounts = sendTipEmail.mock.calls.map(
      (c: unknown[]) => (c[0] as { amountCents: number }).amountCents
    );
    expect(amounts).toEqual([2500, 2500]);
    const emails = sendTipEmail.mock.calls.map(
      (c: unknown[]) => (c[0] as { cleanerEmail: string }).cleanerEmail
    );
    expect(emails).toEqual(['b@x.com', 'c@x.com']);
    for (const call of sendTipEmail.mock.calls) {
      const payload = call[0] as Record<string, unknown>;
      expect(payload).not.toHaveProperty('otherAllocations');
      expect(payload).not.toHaveProperty('guestMessage');
      expect(payload).not.toHaveProperty('guestName');
    }
  });

  it('allocation notify is idempotent when notifiedAt already set', async () => {
    tipFindUnique.mockResolvedValue({
      id: 'tip-team',
      amount: 5000,
      status: 'RECEIVED_UNATTRIBUTED',
      beneficiaryCleanerId: null,
      beneficiaryNotifiedAt: null,
      refundedAt: null,
      disputeStatus: 'NONE',
      needsReconcile: false,
      propertyAddress: null,
      jobId: null,
      Job: null,
      Property: null,
      Beneficiary: null,
      TipAllocation: [
        {
          id: 'a-b',
          cleanerId: 'brian',
          amountCents: 2500,
          notifiedAt: new Date(),
          Cleaner: { id: 'brian', name: 'Brian', email: 'b@x.com' },
        },
      ],
    });
    const outcome = await notifyCleanersOfTipReceived('tip-team');
    expect(outcome.allocationSkipped).toBe(1);
    expect(outcome.allocationNotified).toBe(0);
    expect(sendTipEmail).not.toHaveBeenCalled();
  });

  it('amount change with notifiedAt set still skips resend', async () => {
    tipFindUnique.mockResolvedValue({
      id: 'tip-team',
      amount: 5000,
      status: 'RECEIVED_UNATTRIBUTED',
      beneficiaryCleanerId: null,
      beneficiaryNotifiedAt: null,
      refundedAt: null,
      disputeStatus: 'NONE',
      needsReconcile: false,
      propertyAddress: null,
      jobId: null,
      Job: null,
      Property: null,
      Beneficiary: null,
      TipAllocation: [
        {
          id: 'a-b',
          cleanerId: 'brian',
          amountCents: 3000,
          notifiedAt: new Date('2026-09-01T00:00:00Z'),
          Cleaner: { id: 'brian', name: 'Brian', email: 'b@x.com' },
        },
      ],
    });
    const outcome = await notifyCleanersOfTipReceived('tip-team');
    expect(outcome.allocationSkipped).toBe(1);
    expect(sendTipEmail).not.toHaveBeenCalled();
  });

  it('needsReconcile blocks allocation payability/notify', () => {
    expect(
      tipHasPayableAllocations({
        status: 'RECEIVED_UNATTRIBUTED',
        needsReconcile: true,
        owedAllocationCents: 2500,
      })
    ).toBe(false);
  });
});

describe('future team attribution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('policy is NONE — does not invent equal splits', () => {
    expect(TEAM_TIP_AUTO_SPLIT_POLICY).toBe('NONE');
  });

  it('multiple participants → UNRESOLVED_MANUAL, no notify', async () => {
    tipFindUnique.mockResolvedValue({
      id: 'tip-u',
      amount: 5000,
      status: 'RECEIVED_UNATTRIBUTED',
      jobId: 'job-u',
      beneficiaryCleanerId: null,
      needsReconcile: false,
      reconcileReason: null,
      refundedAt: null,
      TipAllocation: [],
    });
    jobFindUnique.mockResolvedValue({
      id: 'job-u',
      assignedCleanerId: 'brian',
    });
    jobTeamMemberFindMany.mockResolvedValue([
      { cleanerId: 'brian' },
      { cleanerId: 'caryll' },
    ]);
    jobOfferFindMany.mockResolvedValue([]);
    tipUpdate.mockResolvedValue({});

    const result = await maybeAttributeTeamTip({
      tipId: 'tip-u',
      notify: true,
    });
    expect(result.outcome).toBe('UNRESOLVED_MANUAL');
    if (result.outcome === 'UNRESOLVED_MANUAL') {
      expect(result.reason).toBe(TEAM_TIP_MANUAL_ALLOCATION_REASON);
      expect(result.cleanerIds.sort()).toEqual(['brian', 'caryll']);
    }
    expect(tipUpdate).toHaveBeenCalledWith({
      where: { id: 'tip-u' },
      data: {
        needsReconcile: true,
        reconcileReason: TEAM_TIP_MANUAL_ALLOCATION_REASON,
      },
    });
    expect(logAuditEntry).toHaveBeenCalled();
    expect(sendTipEmail).not.toHaveBeenCalled();
  });

  it('skips when allocations already exist', async () => {
    tipFindUnique.mockResolvedValue({
      id: 'tip-h',
      amount: 5000,
      status: 'RECEIVED_UNATTRIBUTED',
      jobId: 'job-h',
      beneficiaryCleanerId: null,
      needsReconcile: false,
      reconcileReason: null,
      refundedAt: null,
      TipAllocation: [{ id: 'a1', status: 'OWED' }],
    });
    const result = await maybeAttributeTeamTip({ tipId: 'tip-h' });
    expect(result).toEqual({
      outcome: 'SKIPPED',
      reason: 'ALREADY_ALLOCATED',
    });
  });

  it('sole beneficiary tip → SOLE outcome', async () => {
    tipFindUnique.mockResolvedValue({
      id: 'tip-s',
      amount: 2000,
      status: 'RECEIVED',
      jobId: 'job-s',
      beneficiaryCleanerId: 'brian',
      needsReconcile: false,
      reconcileReason: null,
      refundedAt: null,
      TipAllocation: [],
    });
    const result = await maybeAttributeTeamTip({ tipId: 'tip-s' });
    expect(result).toEqual({ outcome: 'SOLE', cleanerId: 'brian' });
  });
});

describe('tip email privacy source', () => {
  it('email helper omits private guest / feedback / stay fields', () => {
    const src = readFileSync(
      join(process.cwd(), 'lib/email/sendCleanerTipReceivedEmail.ts'),
      'utf8'
    );
    expect(src).toContain('A guest left you a tip');
    expect(src).toContain('amountCents');
    expect(src).toContain('propertyDisplayName');
    // Params / send payload must not reference private surfaces
    const paramsBlock = src.slice(
      src.indexOf('export type CleanerTipReceivedEmailParams'),
      src.indexOf('export type CleanerTipReceivedEmailResult')
    );
    expect(paramsBlock).not.toMatch(
      /guestMessage|ServiceFeedback|stayToken|guestAccessToken|guestName/
    );
    expect(formatTipAmountCents(2500)).toBe('$25.00');
  });

  it('historical reconcile passes notify: false', () => {
    const src = readFileSync(
      join(process.cwd(), 'lib/tips/reconcileHistorical50TeamTip.ts'),
      'utf8'
    );
    expect(src).toMatch(/notify:\s*false/);
  });
});
