import { notFound } from 'next/navigation';
import { CustomerReportVisualClient } from './CustomerReportVisualClient';

export const dynamic = 'force-dynamic';

/** Local-dev visual capture only. Never in production/Preview builds. */
export default function CustomerReportVisualPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <CustomerReportVisualClient />;
}
