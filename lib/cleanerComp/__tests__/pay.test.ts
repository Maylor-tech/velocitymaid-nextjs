import { describe, expect, it } from 'vitest';
import {
  confirmVerifiedHours,
  eligibleCleaningAmount,
  expectedPay,
  parseHomeSizeException,
  resolveAssignmentAgreement,
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

  it('keeps a 4 bedroom solo clean on standard terms when no exception is set', () => {
    expect(parseHomeSizeException(null)).toBeNull();
    expect(parseHomeSizeException({ minBedrooms: '', method: '', rate: '' })).toBeNull();
    const agreed = resolveAssignmentAgreement({
      choice: 'solo',
      storedTerms: {
        soloMethod: 'PERCENTAGE',
        soloRate: 65,
        assistedMethod: 'HOURLY',
        assistedRate: 30,
        homeSizeException: null,
      },
      w9Status: 'ON_FILE',
      eligibleBase: 390,
      bedrooms: 4,
    });
    expect(agreed).toMatchObject({
      method: 'PERCENTAGE',
      rate: 65,
      compensationAmount: 253.5,
      includedAddOns: [],
    });
  });

  it('uses a saved 4+ bedroom flat amount and leaves smaller homes on standard solo terms', () => {
    const terms = {
      soloMethod: 'PERCENTAGE' as const,
      soloRate: 65,
      assistedMethod: 'HOURLY' as const,
      assistedRate: 30,
      homeSizeException: { minBedrooms: 4, method: 'FLAT' as const, rate: 180 },
    };
    expect(
      resolveAssignmentAgreement({
        choice: 'solo',
        storedTerms: terms,
        w9Status: 'ON_FILE',
        eligibleBase: 455,
        bedrooms: 4,
      })
    ).toMatchObject({ method: 'FLAT', rate: 180, compensationAmount: 180, includedAddOns: [] });
    expect(
      resolveAssignmentAgreement({
        choice: 'solo',
        storedTerms: terms,
        w9Status: 'ON_FILE',
        eligibleBase: 325,
        bedrooms: 3,
      })
    ).toMatchObject({ method: 'PERCENTAGE', rate: 65, compensationAmount: 211.25 });
    expect(
      resolveAssignmentAgreement({
        choice: 'assisted',
        storedTerms: terms,
        w9Status: 'MISSING',
        eligibleBase: 455,
        bedrooms: 5,
      })
    ).toMatchObject({ method: 'HOURLY', rate: 30, assisted: true });
    expect(
      resolveAssignmentAgreement({
        choice: 'solo',
        storedTerms: terms,
        w9Status: 'MISSING',
        eligibleBase: 455,
        bedrooms: 4,
      }).method
    ).toBe('FLAT');
  });

  it('excludes an add-on from the percentage base unless the agreement includes it', () => {
    const excluded = job({
      agreedCleaningPrice: 430,
      otherAddOns: [{ key: 'laundry', amount: 40 }],
      agreement: agreement({ eligibleBase: null, includedAddOns: [] }),
    });
    expect(eligibleCleaningAmount(excluded)).toBe(390);
    expect(expectedPay(excluded)).toBe(253.5);

    const included = job({
      agreedCleaningPrice: 430,
      otherAddOns: [{ key: 'laundry', amount: 40 }],
      agreement: agreement({ eligibleBase: null, includedAddOns: ['laundry'] }),
    });
    expect(eligibleCleaningAmount(included)).toBe(430);
    expect(expectedPay(included)).toBe(279.5);
  });

  it('records verified hours once', () => {
    const open = agreement({ method: 'HOURLY', rate: 30, assisted: true });
    const confirmed = confirmVerifiedHours(open, 4.5, 'Avery', '2026-11-19T16:00:00.000Z');
    const again = confirmVerifiedHours(confirmed, 8, 'Someone else', '2026-11-20T16:00:00.000Z');
    expect(again.verifiedHours).toBe(4.5);
    expect(again.hoursVerifiedBy).toBe('Avery');
  });
});
