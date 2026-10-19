/** Booking WhatsApp widget — hidden on NJ market and cleaner-recruitment paths. */
export const WHATSAPP_WIDGET_HIDDEN_PREFIXES = [
  '/new-jersey',
  '/locations/new-jersey',
  '/lead/new-jersey',
  '/review-us/new-jersey',
  '/vermont/work-with-us',
  '/jamaica/work-with-us',
  '/cleaners/apply',
  '/careers',
] as const;

export function shouldHideWhatsAppWidget(
  pathname: string | null | undefined
): boolean {
  if (!pathname) return false;
  if (pathname.startsWith('/admin')) return true;
  return WHATSAPP_WIDGET_HIDDEN_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}
