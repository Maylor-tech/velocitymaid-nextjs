'use client';

import Link from 'next/link';
import type { OpsCommandCenterPayload } from '@/lib/admin/opsCommandCenter';

export function PortalAdoptionPanel({
  data,
  branchScoped,
}: {
  data: OpsCommandCenterPayload['portalAdoption'];
  branchScoped: boolean;
}) {
  const stats = [
    { label: 'Active', value: data.active },
    { label: 'Invited', value: data.invited },
    { label: 'Never logged in', value: data.neverLoggedIn },
    { label: 'Never invited', value: data.neverInvited },
  ];

  return (
    <section className="rounded-xl border border-vm-border bg-vm-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-vm-navy">Portal Adoption</h2>
        {!branchScoped && (
          <Link
            href="/admin/customers"
            className="font-body text-xs font-semibold text-vm-cyan-dark hover:underline"
          >
            Customers →
          </Link>
        )}
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-vm-border bg-vm-surface px-3 py-3">
            <p className="font-heading text-2xl font-bold text-vm-navy">{s.value}</p>
            <p className="font-body text-xs text-vm-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {data.needsNudge.length > 0 && !branchScoped && (
        <>
          <h3 className="mb-2 font-heading text-xs font-bold uppercase tracking-wide text-vm-muted">
            Needs nudge
          </h3>
          <ul className="space-y-2">
            {data.needsNudge.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/admin/customers/${c.id}`}
                  className="flex items-center justify-between rounded-lg border border-vm-border px-3 py-2 hover:bg-vm-cyan-tint/50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-body text-sm font-medium text-vm-navy">
                      {c.name}
                    </p>
                    <p className="truncate font-body text-xs text-vm-muted">{c.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-vm-warning-bg px-2 py-0.5 font-body text-[11px] font-medium text-vm-warning">
                    Invited
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
