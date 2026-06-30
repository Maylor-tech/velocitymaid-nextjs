import type { TravelZone } from '@prisma/client';

export const TRAVEL_ZONE_OPTIONS: {
  value: TravelZone;
  label: string;
  fee: number | null;
}[] = [
  { value: 'ZONE_A', label: 'Zone A — Included (0–20 mi)', fee: 0 },
  { value: 'ZONE_B', label: 'Zone B — +$20 (21–40 mi)', fee: 20 },
  { value: 'ZONE_C', label: 'Zone C — +$40 (41–60 mi)', fee: 40 },
  { value: 'ZONE_D', label: 'Zone D — Custom Quote (61+ mi)', fee: null },
];

export const TRAVEL_ZONE_FEE: Record<TravelZone, number | null> = {
  ZONE_A: 0,
  ZONE_B: 20,
  ZONE_C: 40,
  ZONE_D: null,
};

export const TRAVEL_ZONE_SHORT_LABEL: Record<TravelZone, string> = {
  ZONE_A: 'Zone A',
  ZONE_B: 'Zone B',
  ZONE_C: 'Zone C',
  ZONE_D: 'Zone D',
};

/** Bundled Vermont services — travel is typically included in the main price. */
const BUNDLED_VERMONT_SERVICES = new Set([
  'Vacation Rental Turnover',
  'Deep Cleaning & Property Reset',
  'Move-In Cleaning',
  'Move-Out Cleaning',
  'Property Readiness',
  'Emergency Response Cleaning',
]);

/** Standalone visits where a travel fee is commonly added. */
const STANDALONE_VERMONT_SERVICES = new Set([
  'Office Prep',
  'Garage Cleanup',
  'Grill Deep Clean',
  'Property Walkthrough',
]);

export function isStandaloneVermontService(serviceType: string): boolean {
  if (STANDALONE_VERMONT_SERVICES.has(serviceType)) return true;
  if (BUNDLED_VERMONT_SERVICES.has(serviceType)) return false;
  // Other add-on style services default to standalone suggestion
  return serviceType.length > 0;
}

export function shouldSuggestTravelFee(
  state: string,
  serviceType: string,
  travelZone: TravelZone | null | undefined
): travelZone is TravelZone {
  if (state !== 'VT' || !travelZone) return false;
  if (travelZone === 'ZONE_A' || travelZone === 'ZONE_D') return false;
  if (!isStandaloneVermontService(serviceType)) return false;
  return TRAVEL_ZONE_FEE[travelZone] != null && TRAVEL_ZONE_FEE[travelZone]! > 0;
}

export function travelFeeLineDescription(
  zone: TravelZone,
  propertyLabel: string
): string {
  return `${TRAVEL_ZONE_SHORT_LABEL[zone]} Travel Fee — ${propertyLabel}`;
}
