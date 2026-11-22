'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isInternalPath } from '@/lib/analytics/internalPaths';

/**
 * Turns Google Analytics off while someone is on an internal page
 * (admin, cleaner, customer portal, invoices, reports) and back on for
 * public pages, including when they move between pages without a reload.
 */
export default function GaInternalTrafficGuard({ gaId }: { gaId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    (window as unknown as Record<string, unknown>)[`ga-disable-${gaId}`] = isInternalPath(pathname);
  }, [gaId, pathname]);

  return null;
}
