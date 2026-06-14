'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** Legacy route — customer home is /customer/jobs */
export default function CustomerDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/customer/jobs');
  }, [router]);

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="font-body text-sm text-vm-muted">Redirecting to your jobs…</p>
    </div>
  );
}
