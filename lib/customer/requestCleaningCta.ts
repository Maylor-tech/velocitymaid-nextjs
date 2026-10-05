/**
 * Authenticated portal CTA: Vermont hosts request via Property Add Cleaning.
 * Residential properties use the same request page without host/Airbnb fields.
 * PREPAY / no-property customers keep the public /book flow.
 */
export function resolveAuthenticatedBookingCta(input: {
  propertyCount: number;
  firstPropertyId: string | null;
  hostPropertyCount?: number;
  residentialPropertyCount?: number;
}): { href: string; label: string; isHostCta: boolean } {
  if (input.propertyCount < 1) {
    return { href: '/book', label: 'New Booking +', isHostCta: false };
  }

  const hostCount = input.hostPropertyCount ?? input.propertyCount;
  const residentialCount = input.residentialPropertyCount ?? 0;
  const href =
    input.propertyCount === 1 && input.firstPropertyId
      ? `/customer/properties/${input.firstPropertyId}/add-cleaning`
      : '/customer/properties';

  if (residentialCount >= 1 && hostCount === 0) {
    return { href, label: 'Request Cleaning', isHostCta: false };
  }

  return { href, label: 'Request Cleaning', isHostCta: true };
}
