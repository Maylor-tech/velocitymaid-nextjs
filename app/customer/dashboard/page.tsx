import { redirect } from 'next/navigation';

/** Legacy route — customer home is /customer/jobs */
export default function CustomerDashboardPage() {
  redirect('/customer/jobs');
}
