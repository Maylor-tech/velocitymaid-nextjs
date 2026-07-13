'use client';

import Link from 'next/link';
import type { ActionItem } from '@/lib/admin/opsCommandCenter';

const urgencyClass: Record<ActionItem['urgency'], string> = {
  normal: 'border-vm-border bg-vm-white',
  warning: 'border-vm-warning/40 bg-vm-warning-bg',
  danger: 'border-vm-danger/40 bg-vm-danger-bg',
};

const countClass: Record<ActionItem['urgency'], string> = {
  normal: 'bg-vm-cyan-tint text-vm-navy',
  warning: 'bg-vm-warning text-vm-white',
  danger: 'bg-vm-danger text-vm-white',
};

/** Branch-scoped admins only have /admin + /admin/jobs — remap other deep links. */
function resolveHref(item: ActionItem, branchScoped: boolean): string {
  if (!branchScoped) return item.href;
  if (item.href.startsWith('/admin/jobs') || item.href.startsWith('#')) {
    return item.href;
  }
  return '/admin/jobs';
}

export function ActionCenter({
  items,
  branchScoped = false,
}: {
  items: ActionItem[];
  branchScoped?: boolean;
}) {
  const actionable = items.filter((i) => i.count > 0);
  const display = actionable.length > 0 ? actionable : items.slice(0, 4);

  return (
    <section className="mb-6">
      <h2 className="mb-3 font-heading text-lg font-semibold text-vm-navy">
        Daily Action Center
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {display.map((item) => (
          <Link
            key={item.id}
            href={resolveHref(item, branchScoped)}
            className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 transition-opacity hover:opacity-90 ${urgencyClass[item.urgency]}`}
          >
            <div className="min-w-0">
              <p className="font-body text-sm font-medium text-vm-navy">{item.label}</p>
              <p className="mt-0.5 font-body text-xs text-vm-muted">View →</p>
            </div>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 font-heading text-sm font-bold ${countClass[item.urgency]}`}
            >
              {item.count}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
