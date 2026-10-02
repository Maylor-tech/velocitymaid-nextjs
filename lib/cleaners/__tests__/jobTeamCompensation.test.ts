import { describe, expect, it } from 'vitest';
import {
  applyRecordPayment,
  aggregateTeamPay,
  canMutateCompensation,
  centsToUsdNumber,
  formatPaidSummary,
  parseUsdToCents,
  type TeamCompensationRecord,
} from '../jobTeamCompensation';

const BRIAN = 'brian-id';
const DORI = 'dori-id';
const STRANGER = 'stranger-id';

function owedRow(overrides: Partial<TeamCompensationRecord> = {}): TeamCompensationRecord {
  return {
    id: 'comp-1',
    jobId: 'job-1',
    cleanerId: DORI,
    branchId: 'branch-vt',
    amountCents: 10000,
    currency: 'USD',
    status: 'OWED',
    paymentMethod: null,
    paidAt: null,
    paymentRef: null,
    note: null,
    ...overrides,
  };
}

describe('jobTeamCompensation money', () => {
  it('parses dollars to integer cents without floats', () => {
    expect(parseUsdToCents('100.00')).toBe(10000);
    expect(parseUsdToCents('$100')).toBe(10000);
    expect(parseUsdToCents('100.5')).toBe(10050);
    expect(parseUsdToCents(100)).toBe(10000);
    expect(parseUsdToCents('0.01')).toBe(1);
    expect(parseUsdToCents('abc')).toBeNull();
    expect(parseUsdToCents(-1)).toBeNull();
    expect(centsToUsdNumber(10000)).toBe(100);
  });
});

describe('canMutateCompensation', () => {
  it('rejects the primary cleaner', () => {
    const gate = canMutateCompensation({
      cleanerId: BRIAN,
      primaryCleanerId: BRIAN,
      assistantCleanerIds: [DORI],
      existing: null,
    });
    expect(gate).toMatchObject({ ok: false, code: 'PRIMARY_CLEANER' });
  });

  it('allows a current assistant', () => {
    expect(
      canMutateCompensation({
        cleanerId: DORI,
        primaryCleanerId: BRIAN,
        assistantCleanerIds: [DORI],
        existing: null,
      }).ok
    ).toBe(true);
  });

  it('rejects an unrelated cleaner with no existing ledger row', () => {
    const gate = canMutateCompensation({
      cleanerId: STRANGER,
      primaryCleanerId: BRIAN,
      assistantCleanerIds: [DORI],
      existing: null,
    });
    expect(gate).toMatchObject({ ok: false, code: 'NOT_ON_TEAM' });
  });

  it('allows historical pay after the assistant is removed from the current team', () => {
    expect(
      canMutateCompensation({
        cleanerId: DORI,
        primaryCleanerId: BRIAN,
        assistantCleanerIds: [],
        existing: { cleanerId: DORI },
      }).ok
    ).toBe(true);
  });
});

describe('applyRecordPayment', () => {
  it('keeps OWED and PAID distinct until confirmed', () => {
    const unconfirmed = applyRecordPayment({
      existing: owedRow(),
      confirm: false,
      amountCents: 10000,
      paymentMethod: 'ZELLE',
      paidAt: new Date('2026-10-02T12:00:00.000Z'),
    });
    expect(unconfirmed).toMatchObject({ ok: false, code: 'CONFIRM_REQUIRED' });

    const paid = applyRecordPayment({
      existing: owedRow(),
      confirm: true,
      amountCents: 10000,
      paymentMethod: 'ZELLE',
      paidAt: new Date('2026-10-02T12:00:00.000Z'),
      paymentRef: 'zelle-dori-100',
    });
    expect(paid.ok).toBe(true);
    if (paid.ok) {
      expect(paid.idempotent).toBe(false);
      expect(paid.next.status).toBe('PAID');
      expect(paid.next.paymentMethod).toBe('ZELLE');
      expect(paid.next.paymentRef).toBe('zelle-dori-100');
    }
  });

  it('treats duplicate identical payment as idempotent', () => {
    const paidAt = new Date('2026-10-02T12:00:00.000Z');
    const existing = owedRow({
      status: 'PAID',
      paymentMethod: 'ZELLE',
      paidAt,
      paymentRef: 'ref-1',
    });
    const result = applyRecordPayment({
      existing,
      confirm: true,
      amountCents: 10000,
      paymentMethod: 'ZELLE',
      paidAt,
      paymentRef: 'ref-1',
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.idempotent).toBe(true);
  });

  it('rejects a second payment with different metadata', () => {
    const result = applyRecordPayment({
      existing: owedRow({
        status: 'PAID',
        paymentMethod: 'ZELLE',
        paidAt: new Date('2026-10-02T12:00:00.000Z'),
      }),
      confirm: true,
      amountCents: 5000,
      paymentMethod: 'CASH',
      paidAt: new Date('2026-10-03T12:00:00.000Z'),
    });
    expect(result).toMatchObject({ ok: false, code: 'ALREADY_PAID' });
  });

  it('formats the paid summary', () => {
    expect(
      formatPaidSummary({
        amountCents: 10000,
        paymentMethod: 'ZELLE',
        paidAt: '2026-10-02T12:00:00.000Z',
      })
    ).toMatch(/^Paid \$100\.00 via Zelle • Oct 2, 2026$/);
  });
});

describe('aggregateTeamPay', () => {
  it('splits owed and paid without mixing statuses', () => {
    expect(
      aggregateTeamPay([
        { amountCents: 10000, status: 'OWED' },
        { amountCents: 2500, status: 'PAID' },
      ])
    ).toEqual({
      owedCents: 10000,
      paidCents: 2500,
      owedCount: 1,
      paidCount: 1,
    });
  });
});
