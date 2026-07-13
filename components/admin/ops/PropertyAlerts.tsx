'use client';

import Link from 'next/link';
import type { OpsCommandCenterPayload } from '@/lib/admin/opsCommandCenter';

const categoryTone: Record<string, string> = {
  Damage: 'bg-vm-danger-bg text-vm-danger',
  Supplies: 'bg-vm-cyan-tint text-vm-cyan-dark',
  Access: 'bg-vm-warning-bg text-vm-warning',
  'Hot tub': 'bg-vm-cyan-tint text-vm-navy',
  Trash: 'bg-vm-surface text-vm-muted',
  Maintenance: 'bg-vm-warning-bg text-vm-warning',
  Unresolved: 'bg-vm-surface text-vm-navy',
};

export function PropertyAlerts({
  alerts,
}: {
  alerts: OpsCommandCenterPayload['propertyAlerts'];
}) {
  return (
    <section id="property-alerts" className="mb-6 scroll-mt-6">
      <h2 className="mb-3 font-heading text-lg font-semibold text-vm-navy">
        Property Alerts
      </h2>
      {alerts.length === 0 ? (
        <div className="rounded-xl border border-vm-border bg-vm-white px-5 py-8 text-center font-body text-sm text-vm-muted">
          No open property alerts.
        </div>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id}>
              <div className="flex flex-col gap-2 rounded-xl border border-vm-border bg-vm-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 font-body text-[11px] font-semibold ${
                        categoryTone[a.category] ?? categoryTone.Unresolved
                      }`}
                    >
                      {a.category}
                    </span>
                    <span className="font-body text-xs text-vm-muted">
                      {new Date(a.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="font-body text-sm text-vm-navy">{a.summary}</p>
                  <p className="mt-0.5 font-body text-xs text-vm-muted">{a.property}</p>
                </div>
                {a.jobId && (
                  <Link
                    href={`/admin/jobs/${a.jobId}`}
                    className="shrink-0 rounded-md border border-vm-border px-3 py-1.5 text-center font-heading text-[11px] font-bold uppercase tracking-wide text-vm-navy hover:bg-vm-cyan-tint"
                  >
                    Open job
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
