import { describe, expect, it } from 'vitest';
import { getJobLoopProgress } from '../jobLoopProgress';

const hostAssignable = {
  paymentStatus: 'PENDING',
  reviewStatus: 'APPROVED',
  assignedCleanerId: null as string | null,
  billingPolicy: 'INVOICE_AFTER_SERVICE',
  dispatchOffersEnabled: true,
  dispatchState: 'CLEANER_NEEDED' as const,
};

describe('jobLoopProgress truthfulness', () => {
  it('cancelled jobs never advertise Cleaner needed or dispatch CTAs', () => {
    const loop = getJobLoopProgress('job-cancel', {
      ...hostAssignable,
      status: 'CANCELLED',
    });
    expect(loop.label).toBe('Cancelled');
    expect(loop.nextAction).toMatch(/cancelled/i);
    expect(loop.nextAction).not.toMatch(/Send offer|Assign Cleaner|Cleaner needed/i);
    expect(loop.label).not.toBe('Cleaner needed');
    expect(loop.cleanerJobUrl).toBeNull();
    expect(loop.steps.find((s) => s.id === 'deposit')?.label).toBe('Deposit not required');
    expect(loop.steps.find((s) => s.id === 'deposit')?.done).toBe(true);
    expect(loop.steps.find((s) => s.id === 'assign')?.current).toBe(false);
  });

  it('cancelled emergency jobs are also operationally closed', () => {
    const loop = getJobLoopProgress('job-em', {
      ...hostAssignable,
      status: 'CANCELLED_EMERGENCY',
    });
    expect(loop.label).toBe('Cancelled');
    expect(loop.nextAction).toMatch(/no dispatch/i);
  });

  it('invoice-after-service progress does not claim Deposit paid when none was taken', () => {
    const loop = getJobLoopProgress('job-host', {
      ...hostAssignable,
      status: 'RECEIVED',
    });
    const deposit = loop.steps.find((s) => s.id === 'deposit');
    expect(deposit?.label).toBe('Deposit not required');
    expect(deposit?.done).toBe(true);
    expect(loop.label).toBe('Cleaner needed');
  });

  it('assigned cleaner next-action is On the Way → Start → Submit for QC', () => {
    const loop = getJobLoopProgress('job-assigned', {
      status: 'ASSIGNED',
      paymentStatus: 'PENDING',
      reviewStatus: 'APPROVED',
      assignedCleanerId: 'cleaner-1',
      billingPolicy: 'INVOICE_AFTER_SERVICE',
      dispatchOffersEnabled: true,
    });
    expect(loop.step).toBe('ASSIGNED');
    expect(loop.nextAction).toMatch(/On the Way → Start Service → Submit for QC/);
    expect(loop.nextAction).not.toMatch(/Accept → Start/);
    expect(loop.nextAction).not.toMatch(/Complete Job/);
  });

  it('in-progress cleaner is told to Submit for QC, not Complete Job', () => {
    const loop = getJobLoopProgress('job-ip', {
      status: 'IN_PROGRESS',
      paymentStatus: 'PENDING',
      reviewStatus: 'APPROVED',
      assignedCleanerId: 'cleaner-1',
      billingPolicy: 'INVOICE_AFTER_SERVICE',
    });
    expect(loop.nextAction).toMatch(/Submit for QC/);
    expect(loop.nextAction).not.toMatch(/Complete Job/);
  });
});
