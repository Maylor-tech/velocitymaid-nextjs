import { isJobAssignable } from '@/lib/billing/billingPolicy';
import type { DispatchUiState } from '@/lib/dispatch/dispatchState';

export type JobLoopStep =
  | 'DEPOSIT_PAID'
  | 'REVIEW_PENDING'
  | 'READY_TO_ASSIGN'
  | 'ASSIGNED'
  | 'IN_FIELD'
  | 'COMPLETED_BALANCE_DUE'
  | 'PAID'
  | 'OTHER';

export type JobLoopInput = {
  status: string;
  paymentStatus: string;
  reviewStatus?: string | null;
  assignedCleanerId?: string | null;
  balanceDue?: number | null;
  billingPolicy?: string | null;
  dispatchOffersEnabled?: boolean;
  dispatchState?: DispatchUiState | null;
};

export type JobLoopProgress = {
  step: JobLoopStep;
  label: string;
  nextAction: string;
  cleanerJobUrl: string | null;
  customerJobUrl: string | null;
  steps: Array<{ id: string; label: string; done: boolean; current: boolean }>;
};

export function getJobLoopProgress(
  jobId: string,
  job: JobLoopInput
): JobLoopProgress {
  const status = job.status.toUpperCase();
  const payment = job.paymentStatus.toUpperCase();
  const review = (job.reviewStatus || 'PENDING').toUpperCase();
  const hasCleaner = Boolean(job.assignedCleanerId);
  const balanceDue = job.balanceDue ?? 0;

  const steps = [
    { id: 'deposit', label: 'Deposit paid', done: false, current: false },
    { id: 'review', label: 'Admin approved', done: false, current: false },
    { id: 'assign', label: 'Cleaner assigned', done: false, current: false },
    { id: 'complete', label: 'Service completed', done: false, current: false },
    { id: 'balance', label: 'Balance paid', done: false, current: false },
    { id: 'payout', label: 'Payout ready', done: false, current: false },
  ];

  const markDone = (ids: string[]) => {
    for (const s of steps) {
      if (ids.includes(s.id)) s.done = true;
    }
  };

  if (payment === 'PAID' && status === 'COMPLETED') {
    markDone(['deposit', 'review', 'assign', 'complete', 'balance', 'payout']);
    steps.find((s) => s.id === 'payout')!.current = true;
    return {
      step: 'PAID',
      label: 'Fully paid',
      nextAction: 'Payout should be READY. Verify in Cleaner Payout section below.',
      cleanerJobUrl: `/cleaner/jobs/${jobId}`,
      customerJobUrl: `/customer/jobs/${jobId}`,
      steps,
    };
  }

  if (status === 'COMPLETED' && payment === 'BALANCE_DUE' && balanceDue > 0) {
    markDone(['deposit', 'review', 'assign', 'complete']);
    steps.find((s) => s.id === 'balance')!.current = true;
    return {
      step: 'COMPLETED_BALANCE_DUE',
      label: 'Completed — balance due',
      nextAction:
        'Customer pays remaining balance at their job detail page. Share /customer/jobs link or have them log in.',
      cleanerJobUrl: `/cleaner/jobs/${jobId}`,
      customerJobUrl: `/customer/jobs/${jobId}`,
      steps,
    };
  }

  if (status === 'AWAITING_QC') {
    markDone(['deposit', 'review', 'assign']);
    steps.find((s) => s.id === 'complete')!.current = true;
    return {
      step: 'IN_FIELD',
      label: 'Submitted for QC',
      nextAction:
        'Review photos and checklist, then Mark Clean Complete to invoice and notify the customer.',
      cleanerJobUrl: `/cleaner/jobs/${jobId}`,
      customerJobUrl: null,
      steps,
    };
  }

  if (status === 'ON_THE_WAY' || status === 'IN_PROGRESS') {
    markDone(['deposit', 'review', 'assign']);
    steps.find((s) => s.id === 'complete')!.current = true;
    return {
      step: 'IN_FIELD',
      label: 'Cleaner in field',
      nextAction:
        'Cleaner completes service at /cleaner/jobs/' +
        jobId +
        ' (Start Service → Complete Job).',
      cleanerJobUrl: `/cleaner/jobs/${jobId}`,
      customerJobUrl: null,
      steps,
    };
  }

  if (hasCleaner && status === 'ASSIGNED') {
    markDone(['deposit', 'review']);
    steps.find((s) => s.id === 'assign')!.current = true;
    return {
      step: 'ASSIGNED',
      label: 'Assigned to cleaner',
      nextAction:
        'Cleaner completes service at /cleaner/jobs/' +
        jobId +
        ' (Accept → Start Service → Complete Job).',
      cleanerJobUrl: `/cleaner/jobs/${jobId}`,
      customerJobUrl: null,
      steps,
    };
  }

  if (review === 'PENDING' && payment === 'DEPOSIT_PAID') {
    markDone(['deposit']);
    steps.find((s) => s.id === 'review')!.current = true;
    return {
      step: 'REVIEW_PENDING',
      label: 'Awaiting admin review',
      nextAction: job.dispatchOffersEnabled
        ? 'Approve this booking, then send an offer.'
        : 'Approve this booking, then assign a cleaner.',
      cleanerJobUrl: null,
      customerJobUrl: null,
      steps,
    };
  }

  if (isJobAssignableForLoop(job) && !hasCleaner) {
    markDone(['deposit', 'review']);
    steps.find((s) => s.id === 'assign')!.current = true;
    if (job.dispatchOffersEnabled) {
      if (job.dispatchState === 'OFFER_SENT') {
        return {
          step: 'READY_TO_ASSIGN',
          label: 'Awaiting cleaner response',
          nextAction:
            'An offer is outstanding. Wait for the cleaner or cancel it from Dispatch.',
          cleanerJobUrl: null,
          customerJobUrl: null,
          steps,
        };
      }
      if (
        job.dispatchState === 'DECLINED' ||
        job.dispatchState === 'EXPIRED' ||
        job.dispatchState === 'CANCELLED'
      ) {
        return {
          step: 'READY_TO_ASSIGN',
          label: 'Cleaner needed',
          nextAction:
            'The previous offer ended. Select a cleaner and send a new offer.',
          cleanerJobUrl: null,
          customerJobUrl: null,
          steps,
        };
      }
      return {
        step: 'READY_TO_ASSIGN',
        label: 'Cleaner needed',
        nextAction: 'Select a cleaner below and click Send offer.',
        cleanerJobUrl: null,
        customerJobUrl: null,
        steps,
      };
    }
    return {
      step: 'READY_TO_ASSIGN',
      label: 'Ready to assign',
      nextAction: 'Select a cleaner below and click Assign Cleaner.',
      cleanerJobUrl: null,
      customerJobUrl: null,
      steps,
    };
  }

  if (payment === 'DEPOSIT_PAID') {
    markDone(['deposit']);
  }

  return {
    step: 'OTHER',
    label: `${status} · ${payment}`,
    nextAction: 'Review job status and payment fields.',
    cleanerJobUrl: hasCleaner ? `/cleaner/jobs/${jobId}` : null,
    customerJobUrl: `/customer/jobs/${jobId}`,
    steps,
  };
}

function isJobAssignableForLoop(job: JobLoopInput): boolean {
  return isJobAssignable({
    paymentStatus: job.paymentStatus,
    reviewStatus: job.reviewStatus,
    billingPolicy: job.billingPolicy,
  });
}
