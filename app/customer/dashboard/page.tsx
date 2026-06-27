'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — customer home is /customer */
export default function CustomerDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/customer');
  }, [router]);

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="font-body text-sm text-vm-muted">Redirecting to your home…</p>
    </div>
  );
}
