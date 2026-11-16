/**
 * Owner-facing lifecycle presentation for the Monthly Jobs Workspace.
 * Pure / read-only — does not mutate Job status or assignment.
 */

import { serviceDayRelativeToEastern, serviceDateKey } from '@/lib/dates/serviceDate';
import { CANCELLED_STATUSES } from '@/lib/admin/jobsMonthlyWorkspace';
import { getStatusBadge } from '@/lib/admin/jobsOperations';

export type WorkspaceJobInput = {
  id: string;
  status: string;
  preferredDate: string | null;
  preferredTime?: string | null;
  assignedCleanerId?: string | null;
  assignedCleaner?: { id: string; name: string | null } | null;
  assignedTeamLabel?: string | null;
  customerName?: string | null;
  address?: string | null;
  serviceType?: string | null;
  totalPrice?: number | null;
  quotedTotal?: number | null;
  currency?: string | null;
  branch?: { name: string; slug: string } | null;
  property?: { name: string; address: string; guestDisplayName: string | null } | null;
};

export type WorkspaceStaffingState =
  | 'review_request'
  | 'set_service_date'
  | 'needs_cleaner'
  | 'assignment_needs_review'
  | 'assigned'
  | 'in_field'
  | 'qc_pending'
  | 'completed'
  | 'cancelled'
  | 'review_overdue'
  | 'none';

export type WorkspacePresentation = {
  statusLabel: string;
  statusClass: string;
  staffingState: WorkspaceStaffingState;
  staffingLabel: string;
  primaryActionLabel: string;
  showActiveStaffing: boolean;
  showPhotoPending: boolean;
  cleanerDisplay: string | null;
  displayName: string;
  locationLine: string;
  marketLabel: string;
  price: number | null;
};

function isCancelled(status: string): boolean {
  return CANCELLED_STATUSES.includes(status as (typeof CANCELLED_STATUSES)[number]);
}

/**
 * Resolve owner-facing staffing / next-step language for schedule rows.
 * Synthetic ASSIGNED + missing cleaner → Assignment needs review (not silent Assigned).
 */
export function resolveWorkspacePresentation(
  job: WorkspaceJobInput,
  now: Date = new Date()
): WorkspacePresentation {
  const status = job.status.toUpperCase();
  const badge = getStatusBadge(status);
  const dayRel = serviceDayRelativeToEastern(job.preferredDate, now);
  const hasCleaner = Boolean(job.assignedCleanerId && job.assignedCleaner);
  const cleanerName =
    job.assignedTeamLabel ||
    job.assignedCleaner?.name ||
    (hasCleaner ? 'Assigned cleaner' : null);

  const displayName =
    job.property?.guestDisplayName ||
    job.property?.name ||
    job.customerName ||
    'Guest';

  const locationLine =
    job.property?.address || job.address || job.branch?.name || '—';

  const priceRaw = job.totalPrice ?? job.quotedTotal;
  const price = priceRaw != null && Number(priceRaw) > 0 ? Number(priceRaw) : null;

  let staffingState: WorkspaceStaffingState = 'none';
  let staffingLabel = '';
  let primaryActionLabel = 'Open job';
  let showActiveStaffing = false;
  const showPhotoPending = false;
  let statusLabel = badge.label;

  if (isCancelled(status)) {
    staffingState = 'cancelled';
    staffingLabel = status === 'CANCELLED_EMERGENCY' ? 'Emergency cancel' : 'Cancelled';
    primaryActionLabel = 'Open job';
    statusLabel = staffingLabel;
  } else if (status === 'COMPLETED') {
    staffingState = 'completed';
    staffingLabel = cleanerName ? `Completed · ${cleanerName}` : 'Completed';
    primaryActionLabel = 'Open job';
  } else if (status === 'RECEIVED') {
    staffingState = 'review_request';
    staffingLabel = 'Review request';
    primaryActionLabel = 'Review request';
    showActiveStaffing = true;
  } else if (dayRel === 'past') {
    staffingState = 'review_overdue';
    staffingLabel = 'Review overdue job';
    primaryActionLabel = 'Review overdue job';
    showActiveStaffing = true;
  } else if (status === 'AWAITING_QC') {
    staffingState = 'qc_pending';
    staffingLabel = cleanerName ? `QC pending · ${cleanerName}` : 'Awaiting inspection';
    primaryActionLabel = 'Review QC';
    showActiveStaffing = true;
  } else if (
    status === 'ON_THE_WAY' ||
    status === 'IN_PROGRESS'
  ) {
    staffingState = 'in_field';
    staffingLabel = cleanerName || 'In progress';
    primaryActionLabel = 'Open job';
    showActiveStaffing = true;
  } else if (!job.preferredDate && (status === 'CONFIRMED' || status === 'ASSIGNED')) {
    staffingState = 'set_service_date';
    staffingLabel = 'Set service date';
    primaryActionLabel = 'Set service date';
    showActiveStaffing = true;
  } else if (status === 'ASSIGNED' && !hasCleaner) {
    staffingState = 'assignment_needs_review';
    staffingLabel = 'Assignment needs review';
    primaryActionLabel = 'Review assignment';
    showActiveStaffing = true;
    statusLabel = 'Assigned';
  } else if (
    (status === 'CONFIRMED' || status === 'ASSIGNED') &&
    !hasCleaner &&
    (dayRel === 'today' || dayRel === 'future' || dayRel === 'unscheduled')
  ) {
    staffingState = 'needs_cleaner';
    staffingLabel = 'Needs cleaner';
    primaryActionLabel = 'Needs cleaner';
    showActiveStaffing = true;
  } else if (hasCleaner) {
    staffingState = 'assigned';
    staffingLabel = cleanerName || 'Assigned';
    primaryActionLabel = 'Open job';
  } else {
    staffingState = 'none';
    staffingLabel = statusLabel;
    primaryActionLabel = 'Open job';
  }

  return {
    statusLabel,
    statusClass: badge.cls,
    staffingState,
    staffingLabel,
    primaryActionLabel,
    showActiveStaffing,
    showPhotoPending,
    cleanerDisplay: cleanerName,
    displayName,
    locationLine,
    marketLabel: job.branch?.name || '—',
    price,
  };
}

export function serviceDateSortKey(preferredDate: string | null | undefined): string {
  if (!preferredDate) return '9999-99-99';
  return serviceDateKey(preferredDate) ?? preferredDate.slice(0, 10);
}
