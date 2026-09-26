import { redirect } from 'next/navigation';
import { CUSTOMER_PORTAL_HOME } from '@/lib/customer/postLoginRedirect';

/**
 * Compatibility alias — Incident #001.
 * Do not mount CustomerHomePage here; canonical portal home is /customer/jobs.
 */
export default function CustomerHomeAliasPage() {
  redirect(CUSTOMER_PORTAL_HOME);
}
