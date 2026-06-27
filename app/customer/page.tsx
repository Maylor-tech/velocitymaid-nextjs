import { redirect } from 'next/navigation';

/** Customer home is the bookings dashboard. */
export default function CustomerPortalHomePage() {
  redirect('/customer/jobs');
}
