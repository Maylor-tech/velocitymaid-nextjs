import { notFound } from 'next/navigation';
import { AdminJobsVisualClient } from './AdminJobsVisualClient';

export const dynamic = 'force-dynamic';

/**
 * Local-dev visual capture only (QA screenshots).
 * Never available in production or Preview builds (NODE_ENV !== 'development').
 * Not an auth bypass for /admin — outside the authenticated admin layout.
 */
export default function AdminJobsVisualPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <AdminJobsVisualClient />;
}
