import { describe, expect, it } from 'vitest';
import { reviewPayables, resolveAssignmentAgreement, thresholdNotice, yearToDateTotal } from '@/lib/cleanerComp/pay';
import { linkUnmatchedAllocation, planCleanerPaymentImport } from '@/lib/cleanerComp/importHistory';

const CSV = `paymentKey,paidOn,cleaner,cleanerEmail,paymentAmount,method,paidFrom,allocationType,jobReference,allocationAmount,payBasis,memo,evidence,status
DORI-2026-08-17,2026-08-17,Dory (Dori),dory.history@example.test,100.00,ZELLE,PERSONAL_FUNDS:Caryll,JOB,VM-2026-0015,100.00,HISTORICAL_AS_PAID,Deep clean,ledger,CONFIRMED
DORI-2026-08-31,2026-08-31,Dory (Dori),dory.history@example.test,260.00,ZELLE,BUSINESS:VelocityMaid Chase,JOB,VM-2026-0031,170.00,HISTORICAL_AS_PAID,Turnover,ledger,CONFIRMED
DORI-2026-08-31,2026-08-31,Dory (Dori),dory.history@example.test,260.00,ZELLE,BUSINESS:VelocityMaid Chase,JOB,VM-2026-0033,57.41,HISTORICAL_AS_PAID,Turnover,ledger,CONFIRMED
DORI-2026-08-31,2026-08-31,Dory (Dori),dory.history@example.test,260.00,ZELLE,BUSINESS:VelocityMaid Chase,ADVANCE,,32.59,,TDS reset / advance,ledger,CONFIRMED
AURORA-2026-10-27,2026-10-27,Aurora Burroughs,aurora.history@example.test,90.00,ZELLE,UNKNOWN,JOB,MATCH:354 Grout Road 2026-10-27,90.00,HOURLY 3h x $30 (assisted - worked with Brian),11:30 AM-2:30 PM,confirmed,CONFIRMED
`;

const cleaners = [
  { id: 'dory', name: 'Dory', email: 'dory.history@example.test' },
  { id: 'aurora', name: 'Aurora Burroughs', email: 'aurora.history@example.test' },
];

const jobsByReference = {
  'VM-2026-0015': { jobId: 'job-15', serviceDate: '2026-08-17', cleanerId: 'dory' },
  'VM-2026-0031': { jobId: 'job-31', serviceDate: '2026-08-31', cleanerId: 'dory' },
  'VM-2026-0033': { jobId: 'job-33', serviceDate: '2026-08-30', cleanerId: 'dory' },
};

function importHistory() {
  return planCleanerPaymentImport({
    csv: CSV,
    jobsByReference,
    cleaners,
    termsEffectiveFrom: { dory: '2026-10-09', aurora: '2026-11-04' },
  });
}

describe('confirmed cleaner payment history', () => {
  it('records Dory’s August jobs as paid manually, plus one advance, with nothing owed', () => {
    const plan = importHistory();
    const reviewed = reviewPayables({ jobs: plan.jobs.filter((job) => job.cleanerId === 'dory'), payments: plan.payments });
    expect(reviewed.rows).toHaveLength(3);
    expect(reviewed.rows.every((row) => row.status === 'PAID_MANUALLY' && row.payBasis === 'HISTORICAL_AS_PAID')).toBe(true);
    expect(reviewed.rows.every((row) => row.balance === 0)).toBe(true);
    expect(reviewed.rows.some((row) => row.status === 'OWED')).toBe(false);
    expect(plan.advances).toEqual([
      { paymentKey: 'DORI-2026-08-31', amount: 32.59, memo: 'TDS reset / advance' },
    ]);
    expect(plan.payments.filter((payment) => payment.cleanerId === 'dory')).toHaveLength(2);
    expect(plan.payments.find((payment) => payment.paymentKey === 'DORI-2026-08-31')?.allocations).toHaveLength(3);
  });

  it('lists Caryll’s reimbursement once and keeps it out of a second cleaner total', () => {
    const plan = importHistory();
    expect(plan.reimbursements).toEqual([{ paymentId: 'import-DORI-2026-08-17', person: 'Caryll', amount: 100 }]);
    const ytd = yearToDateTotal(plan.payments, 'dory', 2026);
    expect(ytd).toBe(360);
    expect(plan.reimbursements.reduce((sum, line) => sum + line.amount, 0)).toBe(100);
    expect(ytd).not.toBe(460);
  });

  it('leaves Aurora unmatched until an admin links the job, then pays 3 hours at $30', () => {
    const plan = importHistory();
    expect(plan.unmatched).toEqual([
      {
        paymentKey: 'AURORA-2026-10-27',
        cleanerId: 'aurora',
        amount: 90,
        jobReference: 'MATCH:354 Grout Road 2026-10-27',
        payBasisNote: 'HOURLY 3h x $30 (assisted - worked with Brian)',
      },
    ]);
    expect(plan.jobs.some((job) => job.cleanerId === 'aurora')).toBe(false);
    const payment = plan.payments.find((row) => row.paymentKey === 'AURORA-2026-10-27');
    expect(payment).toBeTruthy();
    const linked = linkUnmatchedAllocation({
      payment: payment!,
      jobReference: 'MATCH:354 Grout Road 2026-10-27',
      job: { jobId: 'job-grout', serviceDate: '2026-10-27', cleanerId: 'aurora' },
      termsEffectiveFrom: '2026-11-04',
    });
    const reviewed = reviewPayables({ jobs: [linked.job], payments: [linked.payment] });
    expect(reviewed.rows).toHaveLength(1);
    expect(reviewed.rows[0]).toMatchObject({
      status: 'PAID_MANUALLY',
      method: 'HOURLY',
      rate: 30,
      verifiedHours: 3,
      expected: 90,
      paid: 90,
      balance: 0,
    });
  });

  it('creates nothing when the same payment keys already exist', () => {
    const first = importHistory();
    const second = planCleanerPaymentImport({
      csv: CSV,
      jobsByReference,
      cleaners,
      existingPaymentKeys: first.payments.map((payment) => payment.paymentKey),
    });
    expect(second.payments).toHaveLength(0);
    expect(second.jobs).toHaveLength(0);
    expect(second.advances).toHaveLength(0);
    expect(second.reimbursements).toHaveLength(0);
    expect(second.unmatched).toHaveLength(0);
    expect(second.skippedKeys).toEqual(['DORI-2026-08-17', 'DORI-2026-08-31', 'AURORA-2026-10-27']);
  });

  it('blocks a solo percentage offer when tax paperwork is missing and still allows assisted hourly', () => {
    const terms = {
      soloMethod: 'PERCENTAGE' as const,
      soloRate: 65,
      assistedMethod: 'HOURLY' as const,
      assistedRate: 30,
      effectiveFrom: '2026-10-09',
    };
    expect(() =>
      resolveAssignmentAgreement({
        choice: 'solo',
        storedTerms: terms,
        paperwork: { type: 'W9', status: 'MISSING' },
        eligibleBase: 390,
      })
    ).toThrow(/tax paperwork/);
    const assisted = resolveAssignmentAgreement({
      choice: 'assisted',
      storedTerms: terms,
      paperwork: { type: 'W9', status: 'MISSING' },
      eligibleBase: 390,
    });
    expect(assisted).toMatchObject({ method: 'HOURLY', rate: 30, assisted: true });
  });

  it('uses a typed percentage base for the job', () => {
    const agreed = resolveAssignmentAgreement({
      choice: 'custom',
      storedTerms: null,
      paperwork: { type: 'W9', status: 'ON_FILE' },
      custom: { method: 'PERCENTAGE', rate: 65 },
      eligibleBase: 390,
      manualBase: 200,
    });
    expect(agreed.manualEligibleBase).toBe(true);
    expect(agreed.eligibleBase).toBe(200);
    expect(agreed.compensationAmount).toBe(130);
  });

  it('warns at 80 percent of the 1099 threshold', () => {
    expect(thresholdNotice(1599.99)).toMatchObject({ threshold: 2000, warnAt: 1600, warning: false });
    expect(thresholdNotice(1600).warning).toBe(true);
    expect(thresholdNotice(360).warning).toBe(false);
  });
});
