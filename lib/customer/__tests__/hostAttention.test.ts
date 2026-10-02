import { describe, expect, it } from 'vitest';
import {
  getHostAttentionItems,
  HOST_REQUEST_CONFIRMATION,
  HOST_EMPTY_STATE,
  type HostAttentionJob,
} from '@/lib/customer/hostAttention';
import { customerJobListWhere } from '@/lib/customer/customerJobList';

function job(overrides: Partial<HostAttentionJob> & { id: string }): HostAttentionJob {
  return {
    serviceStatus: 'RECEIVED',
    paymentStatus: 'PENDING',
    billingPolicy: 'INVOICE_AFTER_SERVICE',
    scheduledDate: '2026-12-20T00:00:00.000Z',
    ...overrides,
  };
}

describe('getHostAttentionItems', () => {
  it('does NOT flag a normal invoice-after-service PENDING request (no artificial urgency)', () => {
    const items = getHostAttentionItems([
      job({ id: 'ias', billingPolicy: 'INVOICE_AFTER_SERVICE', paymentStatus: 'PENDING' }),
    ]);
    expect(items).toEqual([]);
  });

  it('flags unpaid PREPAY as payment needed before service', () => {
    const items = getHostAttentionItems([
      job({ id: 'pp', billingPolicy: 'PREPAY', paymentStatus: 'PENDING' }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ jobId: 'pp', kind: 'payment', title: 'Payment needed' });
  });

  it('flags a FAILED PREPAY payment', () => {
    const items = getHostAttentionItems([
      job({ id: 'f', billingPolicy: 'PREPAY', paymentStatus: 'FAILED' }),
    ]);
    expect(items.some((i) => i.kind === 'payment')).toBe(true);
  });

  it('flags BALANCE_DUE even on a completed invoice-after-service job', () => {
    const items = getHostAttentionItems([
      job({
        id: 'bd',
        serviceStatus: 'COMPLETED',
        billingPolicy: 'INVOICE_AFTER_SERVICE',
        paymentStatus: 'BALANCE_DUE',
      }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ jobId: 'bd', kind: 'payment', title: 'Balance due' });
  });

  it('does NOT flag DEPOSIT_PAID (awaiting ops approval, not a host payment action)', () => {
    const items = getHostAttentionItems([
      job({ id: 'dp', billingPolicy: 'PREPAY', paymentStatus: 'DEPOSIT_PAID' }),
    ]);
    expect(items.some((i) => i.kind === 'payment')).toBe(false);
  });

  it('does NOT flag a PAID job', () => {
    const items = getHostAttentionItems([
      job({ id: 'paid', billingPolicy: 'PREPAY', paymentStatus: 'PAID' }),
    ]);
    expect(items).toEqual([]);
  });

  it('flags a missing service date on an active request', () => {
    const items = getHostAttentionItems([
      job({ id: 'nodate', scheduledDate: null }),
    ]);
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: 'details', title: 'Add a service date' });
  });

  it('does NOT flag a missing date on a terminal job', () => {
    const items = getHostAttentionItems([
      job({ id: 'done', serviceStatus: 'COMPLETED', paymentStatus: 'PAID', scheduledDate: null }),
    ]);
    expect(items).toEqual([]);
  });

  it('ignores a cancelled job with no outstanding balance', () => {
    const items = getHostAttentionItems([
      job({ id: 'x', serviceStatus: 'CANCELLED', paymentStatus: 'PENDING' }),
    ]);
    expect(items).toEqual([]);
  });

  it('returns [] for an empty list', () => {
    expect(getHostAttentionItems([])).toEqual([]);
  });
});

describe('host job visibility is not coupled to payment status', () => {
  it('customerJobListWhere never filters by paymentStatus', () => {
    for (const type of ['upcoming', 'past', 'all']) {
      const where = customerJobListWhere('cust-1', type) as Record<string, unknown>;
      expect(where).not.toHaveProperty('paymentStatus');
      expect(JSON.stringify(where)).not.toContain('paymentStatus');
    }
  });

  it('attention never removes a PENDING invoice-after-service job from the input', () => {
    // The helper annotates; it must not be used to hide jobs. A PENDING IAS job
    // yields no attention item yet is still a legitimate (visible) job.
    const jobs = [job({ id: 'visible-ias', paymentStatus: 'PENDING' })];
    expect(getHostAttentionItems(jobs)).toEqual([]);
    expect(jobs).toHaveLength(1); // input untouched
  });
});

describe('host confirmation + empty-state copy', () => {
  it('confirmation copy does not imply a cleaner is assigned/staffed', () => {
    const text = `${HOST_REQUEST_CONFIRMATION.title} ${HOST_REQUEST_CONFIRMATION.detail}`.toLowerCase();
    expect(HOST_REQUEST_CONFIRMATION.title).toBe('Cleaning request received');
    expect(text).toContain('confirm staffing');
    expect(text).not.toContain('assigned');
    expect(text).not.toContain('your cleaner');
    expect(text).not.toContain('cleaner is on');
    expect(text).not.toContain('scheduled for');
  });

  it('empty-state copy is calm and makes Add Cleaning the CTA', () => {
    expect(HOST_EMPTY_STATE.ctaLabel).toBe('Add Cleaning');
    const text = `${HOST_EMPTY_STATE.title} ${HOST_EMPTY_STATE.detail}`.toLowerCase();
    expect(text).not.toContain('urgent');
    expect(text).not.toContain('overdue');
    expect(text).not.toContain('action required');
    expect(text).not.toContain('warning');
  });
});
