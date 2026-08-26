/**
 * Authenticated portal CTA: Vermont hosts request via Property Add Cleaning.
 * PREPAY / no-property customers keep the public /book flow.
 */
export function resolveAuthenticatedBookingCta(input: {
  propertyCount: number;
  firstPropertyId: string | null;
}): { href: string; label: string; isHostCta: boolean } {
  if (input.propertyCount >= 1) {
    const href =
      input.propertyCount === 1 && input.firstPropertyId
        ? `/customer/properties/${input.firstPropertyId}/add-cleaning`
        : '/customer/properties';
    return { href, label: 'Request Cleaning', isHostCta: true };
  }
  return { href: '/book', label: 'New Booking +', isHostCta: false };
}
