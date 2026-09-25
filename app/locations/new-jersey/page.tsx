import { redirect } from 'next/navigation';

/**
 * Legacy long-form NJ landing published dollar amounts and an outdated
 * service-area list. Canonical NJ journey is /new-jersey (quote-first).
 */
export default function LegacyNewJerseyLocationsPage() {
  redirect('/new-jersey');
}
