import { describe, expect, it, vi } from 'vitest';
vi.mock('@/lib/prisma', () => ({ prisma: {} }));
import { jobFlags, splitJobs, type OverviewJob } from '../customerOverview';
import { voidCompletionBlockers } from '../voidMistakenCompletion';

const now = new Date('2026-11-26T15:00:00Z');
const job = (over: Partial<OverviewJob>): OverviewJob => ({
  id: Math.random().toString(36).slice(2),
  jobReference: null,
  date: null,
  status: 'RECEIVED',
  paymentStatus: 'PENDING',
  serviceType: null,
  propertyName: null,
  cleanerName: null,
  price: 265,
  invoiceNumber: null,
  invoiceStatus: null,
  flags: [],
  ...over,
});

describe('splitJobs', () => {
  it('puts future open jobs in upcoming (soonest first), completed in past, cancelled apart', () => {
    const out = splitJobs(
      [
        job({ id: 'b', date: '2027-01-03T00:00:00.000Z' }),
        job({ id: 'a', date: '2026-11-28T00:00:00.000Z' }),
        job({ id: 'c', date: '2026-10-11T00:00:00.000Z', status: 'COMPLETED' }),
        job({ id: 'd', date: '2026-12-31T00:00:00.000Z', status: 'CANCELLED' }),
        job({ id: 'e', date: '2026-11-26T00:00:00.000Z' }),
      ],
      now
    );
    expect(out.upcoming.map((j) => j.id)).toEqual(['e', 'a', 'b']);
    expect(out.past.map((j) => j.id)).toEqual(['c']);
    expect(out.cancelled.map((j) => j.id)).toEqual(['d']);
  });

  it('keeps an open job whose date passed in past, so it is not hidden', () => {
    const out = splitJobs([job({ id: 'x', date: '2026-11-08T00:00:00.000Z' })], now);
    expect(out.past.map((j) => j.id)).toEqual(['x']);
  });
});

describe('jobFlags', () => {
  const todayIso = '2026-11-26T00:00:00.000Z';
  it('flags a missing price, a missing cleaner and a passed date', () => {
    expect(
      jobFlags({ status: 'RECEIVED', date: '2026-11-08T00:00:00.000Z', price: null, hasCleaner: false, todayIso })
    ).toEqual(['No price set', 'Needs a cleaner', 'Date has passed']);
  });
  it('does not flag cancelled jobs or completed jobs without a cleaner', () => {
    expect(jobFlags({ status: 'CANCELLED', date: null, price: null, hasCleaner: false, todayIso })).toEqual([]);
    expect(jobFlags({ status: 'COMPLETED', date: todayIso, price: 265, hasCleaner: false, todayIso })).toEqual([]);
  });
});

describe('voidCompletionBlockers', () => {
  const base = { status: 'COMPLETED', hasPayout: false, jobAmountPaid: 0, invoiceAmountPaid: 0, invoicePaymentCount: 0 };
  it('allows a completed job with no payout and no money', () => {
    expect(voidCompletionBlockers(base)).toBeNull();
  });
  it('refuses when not completed, when a payout exists, or when money was received', () => {
    expect(voidCompletionBlockers({ ...base, status: 'RECEIVED' })).toMatch(/Only a completed job/);
    expect(voidCompletionBlockers({ ...base, hasPayout: true })).toMatch(/payout/);
    expect(voidCompletionBlockers({ ...base, invoiceAmountPaid: 265 })).toMatch(/Money/);
    expect(voidCompletionBlockers({ ...base, invoicePaymentCount: 1 })).toMatch(/Money/);
  });
});
