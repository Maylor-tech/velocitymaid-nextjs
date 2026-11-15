'use client';

import Link from 'next/link';
import { formatServiceDate } from '@/lib/dates/serviceDate';
import { isUnknownServiceTime } from '@/lib/admin/jobsMonthlyWorkspace';
import { formatUsdDetailed } from '@/lib/admin/jobsOperations';
import { resolveWorkspacePresentation } from '@/lib/admin/jobsWorkspacePresentation';
import type { AdminJobListItem } from '@/components/admin/jobs/JobOperationsCard';

interface JobsScheduleRowProps {
  job: AdminJobListItem;
}

export function JobsScheduleRow({ job }: JobsScheduleRowProps) {
  const presentation = resolveWorkspacePresentation(job);
  const unknownTime = isUnknownServiceTime(job.preferredTime);
  const dateLabel = job.preferredDate
    ? formatServiceDate(job.preferredDate, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'Not scheduled';
  const timeLabel = unknownTime ? 'Time unknown' : job.preferredTime!.trim();

  return (
    <li className="border-b border-vm-border last:border-b-0">
      <div className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-4">
        <div className="min-w-[7.5rem] shrink-0 font-body text-sm text-vm-navy">
          <p className="font-semibold">{dateLabel}</p>
          <p className={unknownTime ? 'text-vm-warning' : 'text-vm-muted'}>{timeLabel}</p>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/jobs/${job.id}`}
              className="truncate font-heading text-base font-semibold text-vm-navy outline-none hover:underline focus-visible:ring-2 focus-visible:ring-vm-cyan"
            >
              {presentation.displayName}
            </Link>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${presentation.statusClass}`}>
              {presentation.statusLabel}
            </span>
            {presentation.showActiveStaffing &&
              presentation.staffingLabel !== presentation.statusLabel && (
                <span className="rounded-full bg-vm-warning-bg px-2 py-0.5 text-xs font-medium text-vm-navy">
                  {presentation.staffingLabel}
                </span>
              )}
          </div>
          <p className="mt-0.5 truncate font-body text-sm text-vm-muted">
            {presentation.locationLine}
            {presentation.marketLabel !== '—' ? ` · ${presentation.marketLabel}` : ''}
            {job.serviceType ? ` · ${job.serviceType}` : ''}
          </p>
          <p className="mt-0.5 font-body text-sm text-vm-navy">
            {presentation.cleanerDisplay && presentation.staffingState === 'assigned'
              ? presentation.cleanerDisplay
              : presentation.staffingLabel}
            {presentation.price != null && (
              <span className="text-vm-muted">
                {' '}
                · {formatUsdDetailed(presentation.price, job.currency || 'USD')}
              </span>
            )}
          </p>
        </div>

        <div className="shrink-0 sm:self-center">
          <Link
            href={`/admin/jobs/${job.id}`}
            className="inline-flex min-h-[44px] min-w-[7rem] items-center justify-center rounded-lg bg-vm-navy px-3 py-2 text-center font-heading text-sm text-white outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-vm-cyan focus-visible:ring-offset-2"
          >
            {presentation.primaryActionLabel}
          </Link>
        </div>
      </div>
    </li>
  );
}
