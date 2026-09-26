'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CUSTOMER_PORTAL_HOME } from '@/lib/customer/postLoginRedirect';

/** Legacy route — canonical portal home is /customer/jobs */
export default function CustomerDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(CUSTOMER_PORTAL_HOME);
  }, [router]);

  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <p className="font-body text-sm text-vm-muted">Redirecting to your home…</p>
    </div>
  );
}
