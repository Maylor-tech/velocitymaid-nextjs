import type { ServiceType } from '@/components/booking/types';

/** Top-level bookable markets (Step 1). */
export const BOOKING_MARKETS = [
  { code: 'new-jersey', label: 'New Jersey' },
  { code: 'vermont', label: 'Vermont' },
] as const;

export type BookingMarketCode = (typeof BOOKING_MARKETS)[number]['code'];

/** Branch slugs shown under each market on Step 1. */
export const BRANCH_SLUGS_BY_MARKET: Record<BookingMarketCode, string[]> = {
  vermont: ['vermont', 'vermont-middlebury'],
  'new-jersey': ['new-jersey'],
};

export const ALL_BOOKABLE_BRANCH_SLUGS = new Set(
  Object.values(BRANCH_SLUGS_BY_MARKET).flat(),
);

export function branchBelongsToMarket(
  branchSlug: string,
  market: BookingMarketCode,
): boolean {
  return BRANCH_SLUGS_BY_MARKET[market].includes(branchSlug);
}

export function resolveMarketFromLocationParam(
  value: string | null | undefined,
): BookingMarketCode | null {
  if (value === 'vermont' || value === 'new-jersey') return value;
  return null;
}

export interface ServiceOption {
  value: ServiceType;
  label: string;
  description: string;
}

export const VERMONT_SERVICE_OPTIONS: ServiceOption[] = [
  {
    value: 'VACATION_RENTAL_TURNOVER',
    label: 'Vacation Rental Turnover',
    description: 'Between-guest cleaning and property reset',
  },
  {
    value: 'DEEP_CLEAN',
    label: 'Deep Clean',
    description: 'First-time, seasonal, or post-renovation clean',
  },
  {
    value: 'PROPERTY_WALKTHROUGH',
    label: 'Property Walkthrough',
    description: 'Assessment and planning visit — $75, credited to first service',
  },
  {
    value: 'MOVE_IN_OUT',
    label: 'Move-In / Move-Out Clean',
    description: 'Full detailed clean for property transitions',
  },
  {
    value: 'EMERGENCY_CLEAN',
    label: 'Emergency Clean',
    description: 'Same-day or next-day — $75 response fee applies',
  },
];

export const NJ_SERVICE_OPTIONS: ServiceOption[] = [
  {
    value: 'STANDARD',
    label: 'Standard Residential Clean',
    description: 'Regular maintenance cleaning for your home',
  },
  {
    value: 'DEEP_CLEAN',
    label: 'Deep Clean',
    description: 'Thorough cleaning including hard-to-reach areas',
  },
  {
    value: 'MOVE_IN_OUT',
    label: 'Move-In / Move-Out',
    description: 'Comprehensive cleaning for moving',
  },
  {
    value: 'RECURRING',
    label: 'Recurring Cleaning Plan',
    description: 'Weekly, bi-weekly, or monthly scheduled cleans',
  },
];

export function serviceOptionsForMarket(
  market: BookingMarketCode | null,
): ServiceOption[] {
  if (market === 'vermont') return VERMONT_SERVICE_OPTIONS;
  if (market === 'new-jersey') return NJ_SERVICE_OPTIONS;
  return [];
}

/** Subtitle under branch name on location cards. */
export function branchLocationSubtitle(branch: {
  city: string;
  state: string;
  regionLabel?: string | null;
}): string {
  if (branch.regionLabel) {
    return `${branch.regionLabel}, ${branch.state}`;
  }
  return `${branch.city}, ${branch.state}`;
}
