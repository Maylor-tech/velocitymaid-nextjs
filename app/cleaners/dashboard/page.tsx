import { redirect } from 'next/navigation';

/** Legacy dashboard — job portal lives at /cleaner/jobs */
export default function CleanerDashboardRedirect() {
  redirect('/cleaner/jobs');
}
