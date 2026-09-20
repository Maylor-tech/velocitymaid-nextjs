import { prisma } from '@/lib/prisma';
import { formatCustomerAddress } from './customerAddress';
import { geocodeAddress, getGoogleMapsApiKey } from './googleGeocode';

export type GeocodeCustomerOutcome =
  | {
      ok: true;
      latitude: number;
      longitude: number;
      address: string;
    }
  | {
      ok: false;
      reason: 'NOT_FOUND' | 'NO_ADDRESS' | 'NO_API_KEY' | 'GEOCODE_FAILED';
      message: string;
    };

/** Geocode a customer by ID and persist lat/lng when an address is available. */
export async function geocodeCustomerById(customerId: string): Promise<boolean> {
  const result = await geocodeCustomerDetailed(customerId);
  return result.ok;
}

/**
 * Explicit admin geocode with structured outcome — used by map Missing-location
 * actions. Never bulk-runs; one customer per call.
 */
export async function geocodeCustomerDetailed(
  customerId: string
): Promise<GeocodeCustomerOutcome> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      defaultAddress: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      state: true,
      postalCode: true,
    },
  });

  if (!customer) {
    return {
      ok: false,
      reason: 'NOT_FOUND',
      message: 'Customer not found',
    };
  }

  const address = formatCustomerAddress(customer);
  if (!address) {
    return {
      ok: false,
      reason: 'NO_ADDRESS',
      message: 'Add a street address on the customer record before geocoding',
    };
  }

  if (!getGoogleMapsApiKey()) {
    return {
      ok: false,
      reason: 'NO_API_KEY',
      message: 'GOOGLE_MAPS_API_KEY is not configured',
    };
  }

  const coords = await geocodeAddress(address);
  if (!coords) {
    return {
      ok: false,
      reason: 'GEOCODE_FAILED',
      message: `Could not geocode address: ${address}`,
    };
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      updatedAt: new Date(),
    },
  });

  return {
    ok: true,
    latitude: coords.latitude,
    longitude: coords.longitude,
    address,
  };
}

/** Fire-and-forget geocode — logs failures but never throws to callers. */
export function geocodeCustomerInBackground(customerId: string): void {
  geocodeCustomerById(customerId).catch((err) => {
    console.error('[geocodeCustomerInBackground]', customerId, err);
  });
}
