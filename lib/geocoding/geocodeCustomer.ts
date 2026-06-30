import { prisma } from '@/lib/prisma';
import { formatCustomerAddress } from './customerAddress';
import { geocodeAddress } from './googleGeocode';

/** Geocode a customer by ID and persist lat/lng when an address is available. */
export async function geocodeCustomerById(customerId: string): Promise<boolean> {
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

  if (!customer) return false;

  const address = formatCustomerAddress(customer);
  if (!address) return false;

  const coords = await geocodeAddress(address);
  if (!coords) return false;

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      latitude: coords.latitude,
      longitude: coords.longitude,
      updatedAt: new Date(),
    },
  });

  return true;
}

/** Fire-and-forget geocode — logs failures but never throws to callers. */
export function geocodeCustomerInBackground(customerId: string): void {
  geocodeCustomerById(customerId).catch((err) => {
    console.error('[geocodeCustomerInBackground]', customerId, err);
  });
}
