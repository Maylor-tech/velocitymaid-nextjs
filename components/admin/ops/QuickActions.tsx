'use client';

import Link from 'next/link';
import type { OpsCommandCenterPayload } from '@/lib/admin/opsCommandCenter';

export function QuickActions({
  actions,
  branchScoped,
}: {
  actions: OpsCommandCenterPayload['quickActions'];
  branchScoped: boolean;
}) {
  const visible = branchScoped
    ? actions.filter((a) => a.branchScopedAllowed)
    : actions;

  if (visible.length === 0) return null;

  return (
    <section className="sticky bottom-0 z-10 -mx-7 border-t border-vm-border bg-vm-white/95 px-7 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 font-heading text-[11px] font-bold uppercase tracking-wider text-vm-muted">
          Quick
        </span>
        {visible.map((a) => (
          <Link
            key={a.id}
            href={a.href}
            className="rounded-md border border-vm-border bg-vm-surface px-3 py-1.5 font-heading text-[11px] font-bold uppercase tracking-wide text-vm-navy transition-colors hover:border-vm-cyan hover:bg-vm-cyan-tint"
          >
            {a.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
