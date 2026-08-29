import type { Property } from '@prisma/client';
import {
  toCleanerPropertyView,
  type CleanerPropertyView,
} from '@/lib/properties/propertyService';

/**
 * General location a cleaner may use to decide whether to accept.
 * Omits access credentials, storage locations, and standing notes
 * that can include codes.
 */
export type CleanerOfferLocationView = {
  city: string | null;
  state: string | null;
  /** Town/area label — not a street address with unit/gate detail. */
  areaLabel: string | null;
};

export function toCleanerOfferLocationView(input: {
  city?: string | null;
  state?: string | null;
  serviceLocation?: string | null;
  property?: Pick<Property, 'city' | 'state'> | null;
}): CleanerOfferLocationView {
  const city =
    input.property?.city?.trim() ||
    input.city?.trim() ||
    null;
  const state =
    input.property?.state?.trim() ||
    input.state?.trim() ||
    null;
  const areaLabel =
    input.serviceLocation?.trim() ||
    [city, state].filter(Boolean).join(', ') ||
    null;
  return { city, state, areaLabel };
}

export function toAcceptedCleanerPropertyView(
  property: Property
): CleanerPropertyView {
  return toCleanerPropertyView(property);
}

/** Fields that must never appear on an unaccepted offer payload. */
export const SENSITIVE_PROPERTY_FIELDS = [
  'accessType',
  'accessNotes',
  'supplyStorageLocation',
  'address',
] as const;
