import { redirect } from 'next/navigation';
import { CUSTOMER_PORTAL_HOME } from '@/lib/customer/postLoginRedirect';

/** Customer home is the bookings dashboard. */
export default function CustomerPortalHomePage() {
  redirect(CUSTOMER_PORTAL_HOME);
}
