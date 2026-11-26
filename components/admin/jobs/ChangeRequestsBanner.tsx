'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarClock } from 'lucide-react';

/** Shows "N change requests waiting" when clients have asked for changes. */
export function ChangeRequestsBanner() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    fetch('/api/admin/jobs/change-requests?status=PENDING', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => d?.success && setCount(d.requests.length))
      .catch(() => {});
  }, []);
  if (count === 0) return null;
  return (
    <Link
      href="/admin/jobs/change-requests"
      className="mb-3 flex items-center gap-2 rounded-xl border border-vm-warning/30 bg-vm-warning-bg px-4 py-3 font-body text-sm font-semibold text-vm-warning hover:underline"
    >
      <CalendarClock className="h-4 w-4" />
      {count} {count === 1 ? 'client is' : 'clients are'} waiting on a change request. Review now →
    </Link>
  );
}
