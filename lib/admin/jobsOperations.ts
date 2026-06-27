/**
 * Operations helpers for the admin Jobs dashboard.
 * Pure functions — safe to use on client and server.
 */

export type JobPriority = 'urgent' | 'high' | 'medium' | 'normal';

export type PhotoStatusKind = 'none' | 'partial' | 'complete' | 'missing';

export interface JobOperationsInput {
  id: string;
  status: string;
  paymentStatus: string;
  preferredDate: string | null;
  preferredTime?: string | null;
  completedAt?: string | null;
  assignedAt?: string | null;
  onTheWayAt?: string | null;
  assignedCleanerId?: string | null;
  notifiedAt?: string | null;
  scheduleConfirmed?: boolean;
  depositPaidAt?: string | null;
  paidAt?: string | null;
  approvedAt?: string | null;
  reviewStatus?: string | null;
  amountPaid?: number | null;
  balanceDue?: number | null;
  totalPrice?: number | null;
  serviceType?: string | null;
  photoCount?: number;
  checklistTotal?: number;
  checklistCompleted?: number;
  auditActions?: string[];
}

export interface WorkflowStep {
  id: string;
  label: string;
  done: boolean;
}

export interface CommunicationStatus {
  bookingConfirmation: boolean;
  preArrivalReminder: boolean;
  completionMessage: boolean;
  /** TODO: Link Job ↔ Invoice when jobId is stored on Invoice */
  invoiceSent: boolean;
  receiptSent: boolean;
}

export interface NeedsAttentionBreakdown {
  unassigned: number;
  overduePayments: number;
  missingPhotos: number;
  incompleteChecklists: number;
  pastIncomplete: number;
  total: number;
}

export interface OperationsSummary {
  scheduledToday: number;
  awaitingPaymentAmount: number;
  awaitingPaymentCount: number;
  needsAttention: NeedsAttentionBreakdown;
  completedThisMonth: number;
  monthRevenue: number;
  monthName: string;
  healthScore: number;
  healthMetrics: {
    jobsCompletedToday: number;
    jobsAssignedToday: number;
    photosUploadedToday: number;
    invoicesSentToday: number;
    paymentsCollectedToday: number;
    messagesCompletedToday: number;
    todayJobCount: number;
  };
}

const TERMINAL_STATUSES = new Set(['COMPLETED', 'CANCELLED', 'CANCELLED_EMERGENCY']);
const UNPAID_PAYMENT = new Set(['PENDING', 'BALANCE_DUE', 'FAILED']);
const PARTIAL_PAYMENT = new Set(['DEPOSIT_PAID']);

export function expectedPhotoCount(serviceType: string | null | undefined): number {
  const s = (serviceType || '').toLowerCase();
  if (
    s.includes('turnover') ||
    s.includes('vacation') ||
    s.includes('rental') ||
    s.includes('airbnb') ||
    s.includes('villa')
  ) {
    return 15;
  }
  if (s.includes('deep') || s.includes('residential') || s.includes('move')) {
    return 10;
  }
  return 12;
}

export function getPhotoStatus(
  photoCount: number,
  serviceType: string | null | undefined,
  status: string
): { kind: PhotoStatusKind; label: string; expected: number } {
  const expected = expectedPhotoCount(serviceType);
  if (status !== 'COMPLETED' && photoCount === 0) {
    return { kind: 'none', label: 'Photos pending', expected };
  }
  if (photoCount >= expected) {
    return { kind: 'complete', label: 'Photos complete', expected };
  }
  if (photoCount > 0) {
    return {
      kind: 'partial',
      label: `${photoCount} / ${expected} photos uploaded`,
      expected,
    };
  }
  if (status === 'COMPLETED') {
    return { kind: 'missing', label: 'Missing photos', expected };
  }
  return { kind: 'none', label: 'Photos pending', expected };
}

export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(iso: string | null | undefined, now = new Date()): boolean {
  if (!iso) return false;
  return isSameCalendarDay(new Date(iso), now);
}

export function isTomorrow(iso: string | null | undefined, now = new Date()): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameCalendarDay(d, tomorrow);
}

export function isPastDate(iso: string | null | undefined, now = new Date()): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

export function isThisMonth(iso: string | null | undefined, now = new Date()): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

export function isOverduePayment(job: JobOperationsInput, now = new Date()): boolean {
  if (job.paymentStatus === 'PAID' || job.paymentStatus === 'REFUNDED') return false;
  const balance = job.balanceDue ?? 0;
  const hasBalance = balance > 0 || UNPAID_PAYMENT.has(job.paymentStatus);
  if (!hasBalance) return false;
  if (job.status === 'COMPLETED' && job.completedAt) {
    const completed = new Date(job.completedAt);
    const daysSince = (now.getTime() - completed.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 7;
  }
  if (job.preferredDate && isPastDate(job.preferredDate, now) && !TERMINAL_STATUSES.has(job.status)) {
    return UNPAID_PAYMENT.has(job.paymentStatus) || PARTIAL_PAYMENT.has(job.paymentStatus);
  }
  if (job.status === 'COMPLETED') {
    return job.paymentStatus !== 'PAID';
  }
  return false;
}

export function jobHasOutstandingPayment(job: JobOperationsInput): boolean {
  if (job.paymentStatus === 'PAID' || job.paymentStatus === 'REFUNDED') return false;
  if ((job.balanceDue ?? 0) > 0) return true;
  return UNPAID_PAYMENT.has(job.paymentStatus) || PARTIAL_PAYMENT.has(job.paymentStatus);
}

export function outstandingBalance(job: JobOperationsInput): number {
  if (job.balanceDue != null && job.balanceDue > 0) return job.balanceDue;
  if (job.paymentStatus === 'PAID') return 0;
  const total = job.totalPrice ?? 0;
  const paid = job.amountPaid ?? 0;
  const diff = total - paid;
  return diff > 0 ? diff : 0;
}

export function getJobPriority(job: JobOperationsInput, now = new Date()): JobPriority {
  const pastIncomplete =
    isPastDate(job.preferredDate, now) &&
    !TERMINAL_STATUSES.has(job.status);

  if (pastIncomplete || isOverduePayment(job, now)) return 'urgent';
  if (isToday(job.preferredDate, now)) return 'high';
  if (isTomorrow(job.preferredDate, now)) return 'medium';
  return 'normal';
}

export function priorityLabel(p: JobPriority): string {
  switch (p) {
    case 'urgent':
      return 'Urgent';
    case 'high':
      return 'Today';
    case 'medium':
      return 'Tomorrow';
    default:
      return '';
  }
}

export function priorityClasses(p: JobPriority): string {
  switch (p) {
    case 'urgent':
      return 'bg-vm-danger-bg text-vm-danger border-vm-danger/20';
    case 'high':
      return 'bg-vm-warning-bg text-vm-warning border-vm-warning/30';
    case 'medium':
      return 'bg-vm-cyan-tint text-vm-navy border-vm-cyan/30';
    default:
      return 'bg-vm-surface text-vm-muted border-vm-border';
  }
}

export function isMissingPhotos(job: JobOperationsInput): boolean {
  if (job.status !== 'COMPLETED') return false;
  const count = job.photoCount ?? 0;
  const expected = expectedPhotoCount(job.serviceType);
  return count < expected;
}

export function isIncompleteChecklist(job: JobOperationsInput): boolean {
  const total = job.checklistTotal ?? 0;
  if (total === 0) return false;
  return (job.checklistCompleted ?? 0) < total;
}

export function isUnassigned(job: JobOperationsInput): boolean {
  return (
    !job.assignedCleanerId &&
    !TERMINAL_STATUSES.has(job.status)
  );
}

export function jobNeedsAttention(job: JobOperationsInput, now = new Date()): boolean {
  return (
    isUnassigned(job) ||
    isOverduePayment(job, now) ||
    isMissingPhotos(job) ||
    isIncompleteChecklist(job) ||
    (isPastDate(job.preferredDate, now) && !TERMINAL_STATUSES.has(job.status))
  );
}

export function computeNeedsAttentionBreakdown(
  jobs: JobOperationsInput[],
  now = new Date()
): NeedsAttentionBreakdown {
  const active = jobs.filter((j) => !TERMINAL_STATUSES.has(j.status) || j.status === 'COMPLETED');
  const unassigned = active.filter(isUnassigned).length;
  const overduePayments = active.filter((j) => isOverduePayment(j, now)).length;
  const missingPhotos = active.filter(isMissingPhotos).length;
  const incompleteChecklists = active.filter(isIncompleteChecklist).length;
  const pastIncomplete = active.filter(
    (j) => isPastDate(j.preferredDate, now) && !TERMINAL_STATUSES.has(j.status)
  ).length;

  const ids = new Set<string>();
  for (const j of active) {
    if (jobNeedsAttention(j, now)) ids.add(j.id);
  }

  return {
    unassigned,
    overduePayments,
    missingPhotos,
    incompleteChecklists,
    pastIncomplete,
    total: ids.size,
  };
}

export function buildCommunicationStatus(job: JobOperationsInput): CommunicationStatus {
  const actions = new Set(job.auditActions ?? []);
  const depositPaid =
    Boolean(job.depositPaidAt) ||
    job.paymentStatus === 'DEPOSIT_PAID' ||
    job.paymentStatus === 'PAID' ||
    actions.has('CHECKOUT_COMPLETED');

  return {
    bookingConfirmation:
      depositPaid ||
      job.status !== 'RECEIVED' ||
      actions.has('JOB_BOOKING_APPROVED'),
    preArrivalReminder:
      Boolean(job.scheduleConfirmed) ||
      actions.has('SCHEDULE_CONFIRMED') ||
      actions.has('ON_THE_WAY_NOTIFICATION_SENT'),
    completionMessage:
      Boolean(job.notifiedAt) ||
      actions.has('POST_CLEAN_FEEDBACK_REQUESTED') ||
      actions.has('JOB_COMPLETED'),
    // TODO: Set true when Invoice.jobId link exists or audit INVOICE_SENT is logged
    invoiceSent: actions.has('INVOICE_SENT'),
    receiptSent:
      job.paymentStatus === 'PAID' ||
      Boolean(job.paidAt) ||
      actions.has('PAYMENT_RECEIPT_SENT'),
  };
}

export function buildWorkflowSteps(job: JobOperationsInput): WorkflowStep[] {
  const photo = getPhotoStatus(job.photoCount ?? 0, job.serviceType, job.status);
  const comms = buildCommunicationStatus(job);
  const checklistDone =
    (job.checklistTotal ?? 0) === 0 ||
    (job.checklistCompleted ?? 0) >= (job.checklistTotal ?? 0);

  const inProgress =
    job.status === 'IN_PROGRESS' ||
    job.status === 'ON_THE_WAY' ||
    Boolean(job.onTheWayAt);

  return [
    {
      id: 'booking',
      label: 'Booking confirmed',
      done:
        job.status !== 'RECEIVED' ||
        job.paymentStatus === 'DEPOSIT_PAID' ||
        job.paymentStatus === 'PAID',
    },
    {
      id: 'assigned',
      label: 'Cleaner assigned',
      done: Boolean(job.assignedCleanerId),
    },
    {
      id: 'arrival',
      label: 'Arrival/check-in',
      done: Boolean(job.onTheWayAt) || job.status === 'ON_THE_WAY' || inProgress,
    },
    {
      id: 'started',
      label: 'Cleaning started',
      done: job.status === 'IN_PROGRESS' || job.status === 'COMPLETED' || inProgress,
    },
    {
      id: 'completed',
      label: 'Cleaning completed',
      done: job.status === 'COMPLETED',
    },
    {
      id: 'photos',
      label: 'Photos uploaded',
      done: photo.kind === 'complete' || photo.kind === 'partial',
    },
    {
      id: 'inspection',
      label: 'Inspection complete',
      done: checklistDone && job.status === 'COMPLETED',
    },
    {
      id: 'invoice',
      label: 'Invoice sent',
      done: comms.invoiceSent,
    },
    {
      id: 'payment',
      label: 'Payment received',
      done: job.paymentStatus === 'PAID',
    },
  ];
}

export function computeOperationsSummary(
  jobs: JobOperationsInput[],
  invoiceOutstanding = 0,
  invoiceAwaitingCount = 0,
  now = new Date()
): OperationsSummary {
  const active = jobs.filter((j) => !(j as { archivedAt?: string | null }).archivedAt);
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });

  const scheduledToday = active.filter(
    (j) => isToday(j.preferredDate, now) && !TERMINAL_STATUSES.has(j.status)
  ).length;

  const awaitingJobs = active.filter(jobHasOutstandingPayment);
  const awaitingPaymentAmount =
    awaitingJobs.reduce((s, j) => s + outstandingBalance(j), 0) + invoiceOutstanding;
  const awaitingPaymentCount = awaitingJobs.length + invoiceAwaitingCount;

  const needsAttention = computeNeedsAttentionBreakdown(active, now);

  const completedThisMonth = active.filter(
    (j) => j.status === 'COMPLETED' && isThisMonth(j.completedAt ?? j.preferredDate, now)
  ).length;

  const monthRevenue = active
    .filter(
      (j) =>
        j.paymentStatus === 'PAID' &&
        isThisMonth(j.paidAt ?? j.completedAt ?? j.preferredDate, now)
    )
    .reduce((s, j) => s + (j.amountPaid ?? j.totalPrice ?? 0), 0);

  const todayJobs = active.filter(
    (j) => isToday(j.preferredDate, now) && j.status !== 'CANCELLED' && j.status !== 'CANCELLED_EMERGENCY'
  );
  const todayJobCount = todayJobs.length;

  const jobsCompletedToday = todayJobs.filter(
    (j) => j.status === 'COMPLETED' && isToday(j.completedAt, now)
  ).length;

  const jobsAssignedToday = todayJobs.filter((j) => Boolean(j.assignedCleanerId)).length;

  const photosUploadedToday = todayJobs.filter((j) => (j.photoCount ?? 0) > 0).length;

  const paymentsCollectedToday = active.filter(
    (j) => j.paymentStatus === 'PAID' && isToday(j.paidAt ?? j.completedAt, now)
  ).length;

  const messagesCompletedToday = todayJobs.filter((j) => {
    const c = buildCommunicationStatus(j);
    return c.bookingConfirmation && c.preArrivalReminder;
  }).length;

  // TODO: Count invoices sent today when Invoice.jobId exists
  const invoicesSentToday = 0;

  const ratios: number[] = [];
  if (todayJobCount > 0) {
    ratios.push(jobsCompletedToday / todayJobCount);
    ratios.push(jobsAssignedToday / todayJobCount);
    ratios.push(photosUploadedToday / todayJobCount);
    ratios.push(messagesCompletedToday / todayJobCount);
  }
  if (paymentsCollectedToday > 0) ratios.push(1);
  if (invoicesSentToday > 0) ratios.push(1);

  const healthScore =
    ratios.length > 0
      ? Math.round((ratios.reduce((a, b) => a + b, 0) / Math.max(ratios.length, 1)) * 100)
      : todayJobCount === 0
        ? 100
        : 0;

  return {
    scheduledToday,
    awaitingPaymentAmount,
    awaitingPaymentCount,
    needsAttention,
    completedThisMonth,
    monthRevenue,
    monthName,
    healthScore,
    healthMetrics: {
      jobsCompletedToday,
      jobsAssignedToday,
      photosUploadedToday,
      invoicesSentToday,
      paymentsCollectedToday,
      messagesCompletedToday,
      todayJobCount,
    },
  };
}

export function formatUsd(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUsdDetailed(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatJobDate(dateStr: string | null): string {
  if (!dateStr) return 'Not scheduled';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getStatusBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case 'COMPLETED':
      return { label: 'Completed', cls: 'bg-vm-success-bg text-vm-success' };
    case 'CONFIRMED':
      return { label: 'Confirmed', cls: 'bg-vm-cyan-tint text-vm-navy' };
    case 'ASSIGNED':
      return { label: 'Scheduled', cls: 'bg-purple-100 text-purple-700' };
    case 'ON_THE_WAY':
      return { label: 'On the way', cls: 'bg-purple-100 text-purple-700' };
    case 'IN_PROGRESS':
      return { label: 'In progress', cls: 'bg-vm-warning-bg text-vm-warning' };
    case 'RECEIVED':
      return { label: 'Received', cls: 'bg-vm-surface text-vm-muted' };
    case 'CANCELLED':
    case 'CANCELLED_EMERGENCY':
      return { label: 'Cancelled', cls: 'bg-vm-danger-bg text-vm-danger' };
    default:
      return { label: status, cls: 'bg-vm-surface text-vm-muted' };
  }
}

export function getPaymentBadge(status: string): { label: string; cls: string } {
  switch (status) {
    case 'PAID':
      return { label: 'Paid', cls: 'bg-vm-success-bg text-vm-success' };
    case 'DEPOSIT_PAID':
      return { label: 'Deposit paid', cls: 'bg-vm-cyan-tint text-vm-navy' };
    case 'PENDING':
      return { label: 'Pending', cls: 'bg-vm-warning-bg text-vm-warning' };
    case 'BALANCE_DUE':
      return { label: 'Balance due', cls: 'bg-vm-warning-bg text-vm-warning' };
    case 'REFUNDED':
      return { label: 'Refunded', cls: 'bg-vm-surface text-vm-muted' };
    case 'FAILED':
      return { label: 'Failed', cls: 'bg-vm-danger-bg text-vm-danger' };
    default:
      return { label: status, cls: 'bg-vm-surface text-vm-muted' };
  }
}

export function getPrimaryAction(job: JobOperationsInput & { id: string }): {
  label: string;
  href: string;
  actionable: boolean;
} {
  if (job.status === 'COMPLETED') {
    const photo = getPhotoStatus(job.photoCount ?? 0, job.serviceType, job.status);
    if (photo.kind === 'missing' || photo.kind === 'partial') {
      return {
        label: 'Upload photos',
        href: `/admin/jobs/${job.id}/complete`,
        actionable: true,
      };
    }
    if (job.paymentStatus !== 'PAID') {
      return {
        label: 'Chase payment',
        href: `/admin/jobs/${job.id}`,
        actionable: true,
      };
    }
    return { label: 'View job', href: `/admin/jobs/${job.id}`, actionable: false };
  }
  if (job.paymentStatus === 'DEPOSIT_PAID' && job.reviewStatus === 'PENDING') {
    return {
      label: 'Approve booking',
      href: `/admin/jobs/${job.id}`,
      actionable: true,
    };
  }
  if (
    (job.status === 'CONFIRMED' || job.status === 'RECEIVED') &&
    !job.assignedCleanerId
  ) {
    return {
      label: 'Assign cleaner',
      href: `/admin/jobs/${job.id}`,
      actionable: true,
    };
  }
  return { label: 'View job', href: `/admin/jobs/${job.id}`, actionable: false };
}
