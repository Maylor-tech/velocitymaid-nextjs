'use client';

import Link from 'next/link';
import type { OpsCommandCenterPayload } from '@/lib/admin/opsCommandCenter';

export function RecentActivity({
  items,
}: {
  items: OpsCommandCenterPayload['recentActivity'];
}) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 font-heading text-lg font-semibold text-vm-navy">
        Recent Activity
      </h2>
      {items.length === 0 ? (
        <div className="rounded-xl border border-vm-border bg-vm-white px-5 py-8 text-center font-body text-sm text-vm-muted">
          No recent activity.
        </div>
      ) : (
        <ol className="relative space-y-0 border-l border-vm-border ml-3">
          {items.map((item) => (
            <li key={item.id} className="relative pb-4 pl-5 last:pb-0">
              <span className="absolute -left-1.5 top-1.5 h-3 w-3 rounded-full border-2 border-vm-cyan bg-vm-white" />
              <p className="font-body text-xs text-vm-muted">
                {new Date(item.at).toLocaleString()}
              </p>
              {item.href ? (
                <Link
                  href={item.href}
                  className="font-body text-sm text-vm-navy hover:text-vm-cyan-dark hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <p className="font-body text-sm text-vm-navy">{item.label}</p>
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
