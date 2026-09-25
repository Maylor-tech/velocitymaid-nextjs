/**
 * New Jersey market relaunch — Elaine service territory + messaging.
 * Vermont remain untouched; import from this module for NJ-only surfaces.
 */

export const NJ_BRANCH_SLUG = 'new-jersey' as const;

export const NJ_LEAD_PATH = '/lead/new-jersey' as const;
export const NJ_BOOK_PATH = '/book?branch=new-jersey' as const;

/** Confirmed service cities (Elaine territory). Display order. */
export const NJ_SERVICE_CITIES = [
  'Bloomfield',
  'Montclair',
  'Newark',
  'East Orange',
  'Irvington',
  'South Orange',
  'West Orange',
  'Nutley',
] as const;

export type NjServiceCity = (typeof NJ_SERVICE_CITIES)[number];

/** URL slugs for city SEO pages under /locations/new-jersey/[city]. */
export const NJ_CITY_SLUGS: Record<NjServiceCity, string> = {
  Bloomfield: 'bloomfield',
  Montclair: 'montclair',
  Newark: 'newark',
  'East Orange': 'east-orange',
  Irvington: 'irvington',
  'South Orange': 'south-orange',
  'West Orange': 'west-orange',
  Nutley: 'nutley',
};

export const NJ_CITY_DISPLAY_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(NJ_CITY_SLUGS).map(([name, slug]) => [slug, name])
);

/** Representative ZIPs for Elaine territory (public / seed alignment). */
export const NJ_TERRITORY_ZIPS: Array<{
  zip: string;
  city: NjServiceCity;
  state: 'NJ';
}> = [
  { zip: '07003', city: 'Bloomfield', state: 'NJ' },
  { zip: '07042', city: 'Montclair', state: 'NJ' },
  { zip: '07043', city: 'Montclair', state: 'NJ' },
  { zip: '07101', city: 'Newark', state: 'NJ' },
  { zip: '07102', city: 'Newark', state: 'NJ' },
  { zip: '07103', city: 'Newark', state: 'NJ' },
  { zip: '07104', city: 'Newark', state: 'NJ' },
  { zip: '07105', city: 'Newark', state: 'NJ' },
  { zip: '07106', city: 'Newark', state: 'NJ' },
  { zip: '07107', city: 'Newark', state: 'NJ' },
  { zip: '07108', city: 'Newark', state: 'NJ' },
  { zip: '07112', city: 'Newark', state: 'NJ' },
  { zip: '07114', city: 'Newark', state: 'NJ' },
  { zip: '07017', city: 'East Orange', state: 'NJ' },
  { zip: '07018', city: 'East Orange', state: 'NJ' },
  { zip: '07111', city: 'Irvington', state: 'NJ' },
  { zip: '07079', city: 'South Orange', state: 'NJ' },
  { zip: '07052', city: 'West Orange', state: 'NJ' },
  { zip: '07110', city: 'Nutley', state: 'NJ' },
];

export function njCitiesShortList(): string {
  return NJ_SERVICE_CITIES.join(', ');
}

export function njCitiesHeroList(): string {
  return 'Bloomfield, Montclair, Newark & nearby Essex County towns';
}

/** Public service hierarchy — STR is available on request, not primary. */
export const NJ_PUBLIC_SERVICES = [
  {
    key: 'recurring',
    name: 'Recurring residential cleaning',
    detail: 'Weekly, biweekly, or monthly home care — our primary New Jersey offer.',
    featured: true,
  },
  {
    key: 'deep',
    name: 'Deep cleaning',
    detail: 'First-time, seasonal, or reset cleans for homes and apartments.',
    featured: false,
  },
  {
    key: 'move',
    name: 'Move-in / move-out',
    detail: 'Detailed cleans for property transitions.',
    featured: false,
  },
  {
    key: 'str',
    name: 'Short-term rental cleaning',
    detail: 'Available on request — not our primary New Jersey message.',
    featured: false,
    secondary: true,
  },
] as const;

/**
 * Pricing is under review — do not publish dollar amounts on marketing surfaces.
 * Booking/quote engines may still use internal package data.
 */
export const NJ_PRICING_PUBLIC_LABEL = 'Custom quote';
export const NJ_PRICING_REVIEW_NOTE =
  'New Jersey pricing is confirmed after we review your home details. Request a quote — we do not publish starting prices until the pricing model is finalized.';

export const NJ_LEAD_SOURCES = [
  { value: 'website', label: 'VelocityMaid website' },
  { value: 'google', label: 'Google search' },
  { value: 'referral', label: 'Referral / friend' },
  { value: 'social', label: 'Social media' },
  { value: 'nextdoor', label: 'Nextdoor' },
  { value: 'returning', label: 'Returning customer' },
  { value: 'other', label: 'Other' },
] as const;

export const NJ_SERVICE_TYPE_OPTIONS = [
  { value: 'RECURRING', label: 'Recurring residential cleaning' },
  { value: 'DEEP_CLEAN', label: 'Deep cleaning' },
  { value: 'MOVE_IN_OUT', label: 'Move-in / move-out' },
  { value: 'STANDARD', label: 'One-time standard clean' },
  { value: 'STR', label: 'Short-term rental (on request)' },
] as const;

export const NJ_FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every two weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'one_time', label: 'One-time' },
  { value: 'unsure', label: 'Not sure yet' },
] as const;

/** Ops follow-up assignee key stored on Lead (company retains CRM). */
export const NJ_OPS_ASSIGNEE = 'elaine' as const;
