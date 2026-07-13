'use client';

import Link from 'next/link';
import type { OpsCommandCenterPayload } from '@/lib/admin/opsCommandCenter';

type ArBucket = OpsCommandCenterPayload['accountsReceivable'];

function ArList({
  title,
  rows,
  empty,
}: {
  title: string;
  rows: ArBucket['overdue'];
  empty: string;
}) {
  return (
    <div>
      <h3 className="mb-2 font-heading text-xs font-bold uppercase tracking-wide text-vm-muted">
        {title}
        <span className="ml-2 font-body font-semibold text-vm-navy">({rows.length})</span>
      </h3>
      {rows.length === 0 ? (
        <p className="font-body text-xs text-vm-muted">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row) => (
            <li key={row.id}>
              <Link
                href={row.href}
                className="flex items-center justify-between gap-2 rounded-lg border border-vm-border bg-vm-white px-3 py-2 transition-colors hover:bg-vm-cyan-tint/50"
              >
                <div className="min-w-0">
                  <p className="truncate font-body text-sm font-medium text-vm-navy">
                    {row.clientName}
                  </p>
                  <p className="font-body text-xs text-vm-muted">{row.invoiceNumber}</p>
                </div>
                <span className="shrink-0 font-heading text-sm font-semibold text-vm-navy">
                  {row.balanceDueFormatted}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function ArPanel({ data }: { data: ArBucket }) {
  return (
    <section className="rounded-xl border border-vm-border bg-vm-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-heading text-lg font-semibold text-vm-navy">
          Accounts Receivable
        </h2>
        <Link
          href="/admin/invoices"
          className="font-body text-xs font-semibold text-vm-cyan-dark hover:underline"
        >
          All invoices →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ArList title="Overdue" rows={data.overdue} empty="None overdue" />
        <ArList title="Due today" rows={data.dueToday} empty="Nothing due today" />
        <ArList title="Due this week" rows={data.dueThisWeek} empty="Nothing due this week" />
        <ArList title="Recently paid" rows={data.recentlyPaid} empty="No recent payments" />
      </div>
    </section>
  );
}
