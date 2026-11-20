import { describe, expect, it } from 'vitest';
import {
  confirmVerifiedHours,
  expectedPay,
  reviewPayables,
  withRateChange,
  type AgreementSnapshot,
  type JobPayInput,
} from '@/lib/cleanerComp/pay';

function agreement(overrides: Partial<AgreementSnapshot> = {}): AgreementSnapshot {
  return {
    method: 'PERCENTAGE',
    rate: 65,
    eligibleBase: 390,
    includedAddOns: [],
    assisted: false,
    verifiedHours: null,
    hoursVerifiedBy: null,
    hoursVerifiedAt: null,
    frozenAt: null,
    ...overrides,
  };
}

function job(overrides: Partial<JobPayInput> = {}): JobPayInput {
  return {
    jobId: 'job-solo',
    cleanerId: 'dorothy',
    serviceDate: '2026-11-18',
    completed: true,
    agreedCleaningPrice: 390,
    tip: 0,
    agreement: agreement(),
    ...overrides,
  };
}

describe('cleaner compensation review', () => {
  it('pays 65% of a $390 solo clean', () => {
    expect(expectedPay(job())).toBe(253.5);
  });

  it('pays 4.5 verified hours at $30', () => {
    const assisted = job({
      jobId: 'job-assisted',
      agreedCleaningPrice: 390,
      tip: 0,
      agreement: agreement({
        method: 'HOURLY',
        rate: 30,
        assisted: true,
        verifiedHours: 4.5,
        hoursVerifiedBy: 'admin',
        hoursVerifiedAt: '2026-11-19T12:00:00.000Z',
      }),
    });
    expect(expectedPay(assisted)).toBe(135);
  });

  it('excludes a tip from the eligible cleaning amount', () => {
    const withTip = job({ tip: 40 });
    expect(expectedPay(withTip)).toBe(253.5);
  });

  it('marks a fully allocated manual payment as paid and does not create a second obligation', () => {
    const solo = job();
    const first = reviewPayables({
      jobs: [solo],
      payments: [
        {
          id: 'pay-1',
          cleanerId: 'dorothy',
          date: '2026-11-18',
          amount: 253.5,
          allocations: [{ jobId: 'job-solo', amount: 253.5 }],
        },
      ],
    });
    expect(first.rows[0]?.status).toBe('PAID_MANUALLY');
    expect(first.created).toBe(1);
    expect(first.obligations).toHaveLength(1);

    const second = reviewPayables({
      jobs: [solo],
      payments: [
        {
          id: 'pay-1',
          cleanerId: 'dorothy',
          date: '2026-11-18',
          amount: 253.5,
          allocations: [{ jobId: 'job-solo', amount: 253.5 }],
        },
      ],
      existing: first.obligations,
    });
    expect(second.created).toBe(0);
    expect(second.obligations).toHaveLength(1);
    expect(second.rows[0]?.status).toBe('PAID_MANUALLY');
  });

  it('does not create a payable when hourly hours are not verified', () => {
    const unverified = job({
      jobId: 'job-hours',
      agreement: agreement({
        method: 'HOURLY',
        rate: 30,
        assisted: true,
        verifiedHours: null,
      }),
    });
    const result = reviewPayables({ jobs: [unverified], payments: [] });
    expect(result.rows[0]?.status).toBe('NEEDS_HOURS');
    expect(result.created).toBe(0);
    expect(result.obligations).toHaveLength(0);
  });

  it('keeps the frozen rate after completion', () => {
    const frozen = agreement({
      frozenAt: '2026-11-19T15:00:00.000Z',
      eligibleBase: 390,
    });
    const afterChange = withRateChange(frozen, 50, true);
    expect(afterChange.rate).toBe(65);
    expect(
      expectedPay(
        job({
          agreedCleaningPrice: 999,
          tip: 80,
          agreement: afterChange,
        })
      )
    ).toBe(253.5);
  });

  it('does not create a payable while a same-day manual payment is unallocated', () => {
    const result = reviewPayables({
      jobs: [job()],
      payments: [
        {
          id: 'pay-open',
          cleanerId: 'dorothy',
          date: '2026-11-18',
          amount: 100,
          allocations: [],
        },
      ],
    });
    expect(result.rows[0]?.status).toBe('NEEDS_RECONCILIATION');
    expect(result.obligations).toHaveLength(0);
  });

  it('records verified hours once', () => {
    const open = agreement({ method: 'HOURLY', rate: 30, assisted: true });
    const confirmed = confirmVerifiedHours(open, 4.5, 'Avery', '2026-11-19T16:00:00.000Z');
    const again = confirmVerifiedHours(confirmed, 8, 'Someone else', '2026-11-20T16:00:00.000Z');
    expect(again.verifiedHours).toBe(4.5);
    expect(again.hoursVerifiedBy).toBe('Avery');
  });
});
