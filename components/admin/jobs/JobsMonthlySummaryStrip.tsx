'use client';

import { MetricCard } from '@/components/vm/MetricCard';
import type { MonthlySummary } from '@/lib/admin/jobsMonthlyWorkspace';

interface JobsMonthlySummaryStripProps {
  summary: MonthlySummary;
  periodLabel: string;
  hideFinancial?: boolean;
  onFocus: (focus: string) => void;
  activeFocus: string;
  /** When summary failed to load, show em dashes instead of inventing counts. */
  unknown?: boolean;
}

/**
 * Metrics row — Scheduled · Needs cleaner · New requests · Awaiting QC.
 * Show "—" when unknown; never guess.
 */
export function JobsMonthlySummaryStrip({
  summary,
  periodLabel,
  onFocus,
  activeFocus,
  unknown = false,
}: JobsMonthlySummaryStripProps) {
  const dash = '—';
  const metrics = [
    {
      key: 'scheduled',
      label: 'Scheduled',
      value: unknown ? dash : summary.confirmedBookings,
      hint: 'Open confirmed work in this period',
      focus: 'all' as const,
    },
    {
      key: 'needs',
      label: 'Needs cleaner',
      value: unknown ? dash : summary.needsCleaner,
      hint: 'Future/today confirmed demand without a cleaner',
      focus: 'unassigned' as const,
    },
    {
      key: 'requests',
      label: 'New requests',
      value: unknown ? dash : summary.bookingRequests,
      hint: 'RECEIVED requests — not confirmed revenue',
      focus: 'requests' as const,
    },
    {
      key: 'qc',
      label: 'Awaiting QC',
      value: unknown ? dash : summary.qcPendingJobs,
      hint: 'Jobs waiting on photo inspection',
      focus: 'qc' as const,
    },
  ];

  return (
    <div className="mb-4 space-y-3">
      <p className="font-body text-xs text-vm-muted">
        Period · <span className="font-semibold text-vm-navy">{periodLabel}</span>
        <span className="mx-2 text-vm-line">·</span>
        {unknown ? dash : summary.totalInScope} in this view
      </p>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {metrics.map((item) => {
          const active = activeFocus === item.focus && item.focus !== 'all';
          return (
            <button
              key={item.key}
              type="button"
              title={item.hint}
              onClick={() => onFocus(item.focus)}
              className={`rounded-[14px] text-left outline-none focus-visible:ring-2 focus-visible:ring-vm-cyan ${
                active ? 'ring-2 ring-vm-cyan' : ''
              }`}
            >
              <MetricCard
                label={item.label}
                value={item.value}
                className="h-full transition-colors hover:border-vm-cyan"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
