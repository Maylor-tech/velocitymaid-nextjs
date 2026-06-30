import type { LeadStatus } from '@prisma/client';

export type CustomerMapStatusFilter = 'all' | 'active' | 'lead' | 'inactive';

const ACTIVE_STATUSES = new Set<LeadStatus>([
  'ACTIVE_CLIENT',
  'ACTIVE',
  'BOOKED',
  'WON',
]);

const LEAD_STATUSES = new Set<LeadStatus>([
  'NEW',
  'INTAKE_RECEIVED',
  'WALKTHROUGH_SCHEDULED',
  'QUOTE_SENT',
  'FOLLOW_UP',
  'QUALIFIED',
]);

const INACTIVE_STATUSES = new Set<LeadStatus>(['CLOSED', 'REJECTED']);

export function customerMapStatusCategory(
  leadStatus: LeadStatus,
  isBlocked: boolean
): Exclude<CustomerMapStatusFilter, 'all'> {
  if (isBlocked || INACTIVE_STATUSES.has(leadStatus)) return 'inactive';
  if (ACTIVE_STATUSES.has(leadStatus)) return 'active';
  if (LEAD_STATUSES.has(leadStatus)) return 'lead';
  return 'lead';
}

export function matchesCustomerMapStatus(
  leadStatus: LeadStatus,
  isBlocked: boolean,
  filter: CustomerMapStatusFilter
): boolean {
  if (filter === 'all') return true;
  return customerMapStatusCategory(leadStatus, isBlocked) === filter;
}
