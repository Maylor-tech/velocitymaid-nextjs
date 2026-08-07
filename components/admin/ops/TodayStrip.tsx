'use client';

import type { OpsCommandCenterPayload } from '@/lib/admin/opsCommandCenter';

export function TodayStrip({
  brief,
  branchScoped,
}: {
  brief: OpsCommandCenterPayload['todayBrief'];
  branchScoped: boolean;
}) {
  const items = [
    {
      label: 'Today',
      value: `${brief.jobsToday} job${brief.jobsToday === 1 ? '' : 's'}`,
    },
    {
      label: 'Unassigned',
      value: String(brief.unassignedToday),
      alert: brief.unassignedToday > 0,
    },
    {
      label: 'Needs you',
      value: String(brief.exceptionCount),
      alert: brief.exceptionCount > 0,
    },
  ];

  if (!branchScoped && brief.cashDueFormatted != null) {
    items.push({
      label: 'Cash due',
      value: brief.cashDueFormatted,
      alert: brief.exceptionCount > 0 && brief.cashDueFormatted !== '$0.00',
    });
  }

  return (
    <section className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-xl border px-4 py-3 ${
            item.alert
              ? 'border-vm-warning/40 bg-vm-warning-bg'
              : 'border-vm-border bg-vm-white'
          }`}
        >
          <p className="font-body text-[10px] font-bold uppercase tracking-wider text-vm-muted">
            {item.label}
          </p>
          <p className="mt-1 font-heading text-xl font-semibold text-vm-navy">
            {item.value}
          </p>
        </div>
      ))}
    </section>
  );
}
