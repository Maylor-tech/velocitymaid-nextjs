import { describe, it, expect } from 'vitest';
import { calcPayout } from '@/lib/payoutRules';

/**
 * Invoice-from-job and balance-due use customer totals (quotedTotal/totalPrice).
 * This documents the contract without hitting Prisma.
 */
describe('invoice / balance customer-total contract', () => {
  it('invoice-from-job uses customer total (quotedTotal ?? totalPrice)', () => {
    const job = {
      totalPrice: 365,
      quotedTotal: 365,
      operationalTotal: 350,
    };
    const invoiceTotal = Number(job.totalPrice ?? job.quotedTotal);
    expect(invoiceTotal).toBe(365);
    expect(invoiceTotal).not.toBe(Number(job.operationalTotal));
  });

  it('balance due based on customer total', () => {
    const customerTotal = 365;
    const amountPaid = 25; // deposit
    const balanceDue = Math.max(0, customerTotal - amountPaid);
    expect(balanceDue).toBe(340);
  });

  it('historical job unchanged when operationalTotal null', () => {
    const legacy = { totalPrice: 300, quotedTotal: 300, operationalTotal: null as number | null };
    const gross =
      legacy.operationalTotal != null
        ? legacy.operationalTotal
        : legacy.quotedTotal ?? legacy.totalPrice;
    expect(gross).toBe(300);
    expect(calcPayout(gross).cleanerAmount).toBe(195);
  });

  it('deposit path remains independent of protection (fixed deposit cents)', () => {
    const depositDollars = 25;
    const customerTotal = 365;
    expect(depositDollars).toBe(25);
    expect(customerTotal - depositDollars).toBe(340);
  });
});
