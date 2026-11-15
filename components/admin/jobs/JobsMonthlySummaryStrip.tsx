'use client';

import type { MonthlySummary } from '@/lib/admin/jobsMonthlyWorkspace';
import { formatUsdDetailed } from '@/lib/admin/jobsOperations';

interface JobsMonthlySummaryStripProps {
  summary: MonthlySummary;
  hideFinancial?: boolean;
  onFocus: (focus: string) => void;
  activeFocus: string;
}

const pill =
  'rounded-lg border border-vm-border bg-vm-white px-3 py-2 text-left outline-none transition-colors hover:border-vm-cyan focus-visible:ring-2 focus-visible:ring-vm-cyan';

export function JobsMonthlySummaryStrip({
  summary,
  hideFinancial,
  onFocus,
  activeFocus,
}: JobsMonthlySummaryStripProps) {
  const items: Array<{
    key: string;
    label: string;
    value: string | number;
    focus?: string;
  }> = [
    { key: 'total', label: 'In scope', value: summary.totalInScope, focus: 'all' },
    {
      key: 'requests',
      label: 'Booking requests',
      value: summary.bookingRequests,
      focus: 'requests',
    },
    {
      key: 'confirmed',
      label: 'Confirmed service',
      value: summary.confirmedServiceJobs,
    },
    {
      key: 'assigned',
      label: 'Assigned / active',
      value: summary.assignedServiceJobs,
    },
    {
      key: 'unassigned',
      label: 'Unassigned demand',
      value: summary.unassignedConfirmedDemand,
      focus: 'unassigned',
    },
    {
      key: 'qc',
      label: 'QC pending',
      value: summary.qcPendingJobs,
      focus: 'qc',
    },
    {
      key: 'completed',
      label: 'Completed',
      value: summary.completedServiceJobs,
      focus: 'completed',
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      value: summary.cancelledJobs,
      focus: 'cancelled',
    },
    {
      key: 'unscheduled',
      label: 'Unscheduled',
      value: summary.unscheduledJobs,
      focus: 'unscheduled',
    },
    {
      key: 'past',
      label: 'Past incomplete',
      value: '→',
      focus: 'past_incomplete',
    },
    {
      key: 'missingPrice',
      label: 'Missing price',
      value: summary.missingPrice,
    },
  ];

  return (
    <div className="mb-5 space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => {
          const active = item.focus ? activeFocus === item.focus : false;
          const Comp = item.focus ? 'button' : 'div';
          return (
            <Comp
              key={item.key}
              type={item.focus ? 'button' : undefined}
              onClick={item.focus ? () => onFocus(item.focus!) : undefined}
              className={`${pill} ${active ? 'border-vm-cyan bg-vm-cyan/10' : ''}`}
            >
              <p className="font-body text-[11px] uppercase tracking-wide text-vm-muted">
                {item.label}
              </p>
              <p className="mt-0.5 font-heading text-lg font-semibold text-vm-navy">
                {item.value}
              </p>
            </Comp>
          );
        })}
      </div>

      {!hideFinancial && (
        <div className="flex flex-wrap items-center gap-4 rounded-lg border border-vm-border bg-vm-surface px-4 py-3 font-body text-sm text-vm-navy">
          <span>
            Service value (priced jobs):{' '}
            <strong>
              {formatUsdDetailed(summary.serviceValueCentsLike)}
            </strong>{' '}
            <span className="text-vm-muted">
              · {summary.serviceValueJobCount} jobs
            </span>
          </span>
          <span className="text-vm-muted">
            Collected revenue: unavailable (CCV2-R2)
          </span>
          <span className="text-vm-muted">
            Outstanding invoices: unavailable (CCV2-R2)
          </span>
        </div>
      )}
    </div>
  );
}
