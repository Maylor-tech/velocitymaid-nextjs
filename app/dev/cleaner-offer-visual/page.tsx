import { notFound } from 'next/navigation';
import { CleanerOfferVisualClient } from './CleanerOfferVisualClient';

export const dynamic = 'force-dynamic';

/** Local-dev visual capture only. Never in production/Preview builds. */
export default function CleanerOfferVisualPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <CleanerOfferVisualClient />;
}
