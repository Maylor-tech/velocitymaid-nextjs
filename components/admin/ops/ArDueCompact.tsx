'use client';

import Link from 'next/link';
import type { OpsCommandCenterPayload } from '@/lib/admin/opsCommandCenter';

type ArBucket = OpsCommandCenterPayload['accountsReceivable'];

/** HQ-only: overdue + due today — no week/paid vanity lists on the home desk. */
export function ArDueCompact({ data }: { data: ArBucket }) {
  const rows = [...data.overdue, ...data.dueToday];
  if (rows.length === 0) return null;

  return (
    <section className="mb-6 rounded-xl border border-vm-border bg-vm-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-vm-navy">
          Cash due today
        </h2>
        <Link
          href="/admin/invoices"
          className="font-body text-xs font-semibold text-vm-cyan-dark hover:underline"
        >
          All invoices →
        </Link>
      </div>
      <ul className="space-y-2">
        {rows.slice(0, 8).map((row) => (
          <li key={row.id}>
            <Link
              href={row.href}
              className="flex items-center justify-between gap-2 rounded-lg border border-vm-border px-3 py-2 transition-colors hover:bg-vm-cyan-tint/50"
            >
              <div className="min-w-0">
                <p className="truncate font-body text-sm font-medium text-vm-navy">
                  {row.clientName}
                </p>
                <p className="font-body text-xs text-vm-muted">
                  {row.invoiceNumber}
                  {data.overdue.some((o) => o.id === row.id) ? ' · Overdue' : ' · Due today'}
                </p>
              </div>
              <span className="shrink-0 font-heading text-sm font-semibold text-vm-navy">
                {row.balanceDueFormatted}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
