import { redirect } from 'next/navigation';

/** Legacy path — operations dashboard lives at /admin */
export default function AdminDashboardRedirectPage() {
  redirect('/admin');
}
