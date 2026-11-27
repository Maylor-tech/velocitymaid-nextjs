'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ChangeRequestsList } from '@/components/admin/jobs/ChangeRequestsList';

export default function ChangeRequestsPage() {
  const [showHandled, setShowHandled] = useState(false);
  return (
    <div className="min-h-screen bg-vm-surface p-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/admin/jobs" className="inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline">
          <ArrowLeft className="h-4 w-4" /> Jobs & Calendar
        </Link>
        <h1 className="mt-3 font-heading text-2xl font-bold text-vm-navy">Change requests</h1>
        <p className="mt-1 font-body text-sm text-vm-muted">
          Clients ask for a new date, time or note from their portal. Approving moves the clean and updates Google
          Calendar. Declining tells the client in their portal.
        </p>
        <label className="mt-4 inline-flex items-center gap-2 font-body text-xs text-vm-muted">
          <input type="checkbox" checked={showHandled} onChange={(e) => setShowHandled(e.target.checked)} />
          Show handled requests too
        </label>
        <div className="mt-4">
          <ChangeRequestsList key={String(showHandled)} showHandled={showHandled} />
        </div>
      </div>
    </div>
  );
}
