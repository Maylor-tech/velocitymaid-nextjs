import { describe, expect, it } from 'vitest';
import {
  assertAllocationsWithinPayment,
  jobDeleteBlockReason,
  resolveAssignmentAgreement,
  reviewPayables,
  termsInEffect,
  type CleanerTerms,
} from '@/lib/cleanerComp/pay';

const october: CleanerTerms = {
  soloMethod: 'PERCENTAGE',
  soloRate: 65,
  assistedMethod: 'HOURLY',
  assistedRate: 30,
  effectiveFrom: '2026-10-09',
};

const january: CleanerTerms = {
  soloMethod: 'PERCENTAGE',
  soloRate: 50,
  assistedMethod: 'HOURLY',
  assistedRate: 25,
  effectiveFrom: '2027-01-01',
};

describe('pay record guards', () => {
  it('creates a $30 per hour payable for a directly assigned assisted job', () => {
    const terms = termsInEffect([october, january], '2026-12-15');
    const agreed = resolveAssignmentAgreement({
      choice: 'assisted',
      storedTerms: terms,
      paperwork: { type: 'W9', status: 'MISSING' },
      eligibleBase: null,
    });
    expect(agreed).toMatchObject({ method: 'HOURLY', rate: 30, assisted: true });
    const reviewed = reviewPayables({
      jobs: [
        {
          jobId: 'job-direct',
          cleanerId: 'dory',
          serviceDate: '2026-12-15',
          completed: true,
          agreedCleaningPrice: null,
          termsEffectiveFrom: terms?.effectiveFrom,
          agreement: {
            method: 'HOURLY',
            rate: agreed.rate,
            eligibleBase: null,
            payBasis: 'TERMS',
            includedAddOns: [],
            assisted: true,
            verifiedHours: 1,
            hoursVerifiedBy: 'admin',
            hoursVerifiedAt: '2026-12-15',
            frozenAt: '2026-12-15',
          },
        },
      ],
      payments: [],
    });
    expect(reviewed.created).toBe(1);
    expect(reviewed.obligations[0]).toMatchObject({ expected: 30, paid: 0, balance: 30, status: 'OWED' });
  });

  it('blocks deleting a job that has a payable', () => {
    expect(jobDeleteBlockReason({ agreements: 0, payables: 1, allocations: 0 })).toBe(
      'This job has cleaner pay records, so it cannot be deleted.'
    );
    expect(jobDeleteBlockReason({ agreements: 0, payables: 0, allocations: 0 })).toBeNull();
  });

  it('rejects an allocation total above the payment', () => {
    expect(() => assertAllocationsWithinPayment(100, 100.01)).toThrow(/cannot exceed the payment/);
    expect(() => assertAllocationsWithinPayment(260, 260)).not.toThrow();
  });

  it('keeps December 2026 on the October terms when January terms are added', () => {
    expect(termsInEffect([october, january], '2026-12-15')).toMatchObject({ soloRate: 65, assistedRate: 30 });
    expect(termsInEffect([october, january], '2027-01-01')).toMatchObject({ soloRate: 50, assistedRate: 25 });
    const reviewed = reviewPayables({
      jobs: [
        {
          jobId: 'job-dec',
          cleanerId: 'dory',
          serviceDate: '2026-12-15',
          completed: true,
          agreedCleaningPrice: 390,
          termsEffectiveFrom: '2026-10-09',
          agreement: {
            method: 'PERCENTAGE',
            rate: 65,
            eligibleBase: 390,
            payBasis: 'TERMS',
            includedAddOns: [],
            assisted: false,
            verifiedHours: null,
            hoursVerifiedBy: null,
            hoursVerifiedAt: null,
            frozenAt: '2026-12-15',
          },
        },
      ],
      payments: [],
    });
    expect(reviewed.obligations[0]).toMatchObject({ expected: 253.5, status: 'OWED' });
  });
});
