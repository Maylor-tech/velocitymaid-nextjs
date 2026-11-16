'use client';

import type { MonthlySummary } from '@/lib/admin/jobsMonthlyWorkspace';
import { formatUsdDetailed } from '@/lib/admin/jobsOperations';

interface JobsMonthlySummaryStripProps {
  summary: MonthlySummary;
  periodLabel: string;
  hideFinancial?: boolean;
  onFocus: (focus: string) => void;
  activeFocus: string;
}

const primaryCard =
  'rounded-lg border border-vm-border bg-vm-white px-3 py-2.5 text-left outline-none transition-colors hover:border-vm-cyan focus-visible:ring-2 focus-visible:ring-vm-cyan';

const chip =
  'inline-flex items-center gap-1.5 rounded-full border border-vm-border bg-vm-white px-2.5 py-1 font-body text-xs text-vm-navy outline-none transition-colors hover:border-vm-cyan focus-visible:ring-2 focus-visible:ring-vm-cyan';

export function JobsMonthlySummaryStrip({
  summary,
  periodLabel,
  hideFinancial,
  onFocus,
  activeFocus,
}: JobsMonthlySummaryStripProps) {
  const primary = [
    {
      key: 'confirmed',
      label: 'Confirmed bookings',
      value: summary.confirmedBookings,
      hint: 'Open confirmed work (excludes requests & completed)',
      focus: 'all',
    },
    {
      key: 'assigned',
      label: 'Assigned jobs',
      value: summary.assignedJobs,
      hint: 'Active jobs with a cleaner assigned',
      focus: 'all',
    },
    {
      key: 'needs',
      label: 'Needs cleaner',
      value: summary.needsCleaner,
      hint: 'Future/today confirmed demand without a cleaner',
      focus: 'unassigned',
    },
    {
      key: 'value',
      label: 'Confirmed service value',
      value: hideFinancial
        ? '—'
        : formatUsdDetailed(summary.confirmedServiceValue),
      hint: `${summary.confirmedServiceValueJobCount} priced confirmed jobs`,
    },
  ];

  const attention = [
    { focus: 'requests', label: 'Booking requests', count: summary.bookingRequests },
    { focus: 'qc', label: 'Awaiting inspection', count: summary.qcPendingJobs },
    { focus: 'past_incomplete', label: 'Overdue jobs', count: summary.pastIncompleteJobs },
    { focus: 'all', label: 'Pricing needed', count: summary.missingPrice, skipFocus: true },
    { focus: 'unscheduled', label: 'Unscheduled', count: summary.unscheduledJobs },
    { focus: 'completed', label: 'Completed', count: summary.completedServiceJobs },
    { focus: 'cancelled', label: 'Cancelled', count: summary.cancelledJobs },
  ];

  const attentionActive =
    activeFocus !== 'all' && attention.some((a) => a.focus === activeFocus);

  return (
    <div className="mb-3 space-y-2 sm:mb-4 sm:space-y-3">
      <p className="font-body text-xs text-vm-muted">
        Period · <span className="font-semibold text-vm-navy">{periodLabel}</span>
        <span className="mx-2 text-vm-border">·</span>
        {summary.totalInScope} in this view
      </p>

      <div className="grid grid-cols-2 gap-1.5 sm:gap-2 lg:grid-cols-4">
        {primary.map((item) => {
          const active = item.focus ? activeFocus === item.focus && item.key === 'needs' : false;
          const Comp = item.focus ? 'button' : 'div';
          return (
            <Comp
              key={item.key}
              type={item.focus ? 'button' : undefined}
              title={item.hint}
              onClick={
                item.focus && item.key === 'needs'
                  ? () => onFocus(item.focus!)
                  : undefined
              }
              className={`${primaryCard} px-2.5 py-2 sm:px-3 sm:py-2.5 ${active ? 'border-vm-cyan bg-vm-cyan/10' : ''}`}
            >
              <p className="font-body text-[10px] uppercase tracking-wide text-vm-muted sm:text-[11px]">
                {item.label}
              </p>
              <p className="mt-0.5 font-heading text-lg font-semibold text-vm-navy sm:text-xl">
                {item.value}
              </p>
            </Comp>
          );
        })}
      </div>

      <div className="hidden flex-wrap items-center gap-2 sm:flex">
        <span className="font-body text-xs font-semibold uppercase tracking-wide text-vm-muted">
          Needs attention
        </span>
        {attention.map((item) => {
          const active =
            !('skipFocus' in item && item.skipFocus) && activeFocus === item.focus;
          return (
            <button
              key={`desk-${item.label}`}
              type="button"
              className={`${chip} ${active ? 'border-vm-cyan bg-vm-cyan/10' : ''}`}
              onClick={() => {
                if ('skipFocus' in item && item.skipFocus) return;
                onFocus(item.focus);
              }}
            >
              {item.label}
              <span className="font-semibold">{item.count}</span>
            </button>
          );
        })}
      </div>

      <details
        className="rounded-lg border border-vm-border bg-vm-white sm:hidden"
        open={attentionActive || undefined}
      >
        <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-2 px-3 py-2 font-body text-xs font-semibold uppercase tracking-wide text-vm-muted outline-none focus-visible:ring-2 focus-visible:ring-vm-cyan [&::-webkit-details-marker]:hidden">
          <span>Needs attention</span>
          <span className="font-normal normal-case tracking-normal text-vm-cyan-dark">
            {attentionActive ? 'Filtered' : 'Queues'}
          </span>
        </summary>
        <div className="flex flex-wrap gap-2 px-3 pb-3">
          {attention.map((item) => {
            const active =
              !('skipFocus' in item && item.skipFocus) && activeFocus === item.focus;
            return (
              <button
                key={`mob-${item.label}`}
                type="button"
                className={`${chip} min-h-[40px] ${active ? 'border-vm-cyan bg-vm-cyan/10' : ''}`}
                onClick={() => {
                  if ('skipFocus' in item && item.skipFocus) return;
                  onFocus(item.focus);
                }}
              >
                {item.label}
                <span className="font-semibold">{item.count}</span>
              </button>
            );
          })}
        </div>
      </details>
    </div>
  );
}
