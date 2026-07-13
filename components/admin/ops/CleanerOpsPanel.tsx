'use client';

import Link from 'next/link';
import type { OpsCommandCenterPayload } from '@/lib/admin/opsCommandCenter';

export function CleanerOpsPanel({
  data,
}: {
  data: OpsCommandCenterPayload['cleanerOps'];
}) {
  const rows = [
    { label: 'Active cleaners', value: data.active },
    { label: 'Available now', value: data.available },
    { label: 'Unassigned jobs', value: data.unassignedJobs, href: '/admin/jobs' },
    { label: 'Training incomplete', value: data.trainingIncomplete },
    { label: 'Pending payouts', value: data.pendingPayouts },
  ];

  return (
    <section className="rounded-xl border border-vm-border bg-vm-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-vm-navy">Cleaner Ops</h2>
        <Link
          href="/admin/jobs"
          className="font-body text-xs font-semibold text-vm-cyan-dark hover:underline"
        >
          Jobs →
        </Link>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => {
          const inner = (
            <div className="flex items-center justify-between rounded-lg border border-vm-border px-3 py-2.5">
              <span className="font-body text-sm text-vm-navy">{row.label}</span>
              <span
                className={`font-heading text-lg font-bold ${
                  row.value > 0 && row.label === 'Unassigned jobs'
                    ? 'text-vm-warning'
                    : 'text-vm-navy'
                }`}
              >
                {row.value}
              </span>
            </div>
          );
          return (
            <li key={row.label}>
              {row.href ? (
                <Link href={row.href} className="block hover:bg-vm-cyan-tint/30 rounded-lg">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
