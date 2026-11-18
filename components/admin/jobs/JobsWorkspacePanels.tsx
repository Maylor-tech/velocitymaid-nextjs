'use client';

import Link from 'next/link';
import type { AdminJobListItem } from '@/components/admin/jobs/JobOperationsCard';
import { attentionRowTitle } from '@/lib/admin/attentionRowTitle';
import {
  formatOfferLifecycleLabel,
  offerLifecyclePill,
} from '@/lib/dispatch/offerLifecycleLabel';
import { formatServiceDate } from '@/lib/dates/serviceDate';

/**
 * Read-only Jobs workspace panels (handoff §6).
 * Uses existing job list fields only. Empty states are plain user copy —
 * backend gaps live in VDES01A_HANDOFF_RECONCILIATION.md.
 */

function dateLabel(job: AdminJobListItem): string {
  if (!job.preferredDate) return 'Unscheduled';
  return formatServiceDate(job.preferredDate, {
    month: 'short',
    day: 'numeric',
  });
}

function rowTitle(job: AdminJobListItem): string {
  return attentionRowTitle({
    serviceType: job.serviceType,
    propertyName: job.property?.name,
    guestDisplayName: job.property?.guestDisplayName,
    customerName: job.customerName,
    dateLabel: dateLabel(job),
  });
}

function buildAttentionRows(jobs: AdminJobListItem[]) {
  const rows: Array<{
    id: string;
    title: string;
    detail: string;
    pill: string;
    href: string;
    actionLabel: string;
  }> = [];

  for (const job of jobs) {
    if (job.status === 'AWAITING_QC') {
      rows.push({
        id: `${job.id}-qc`,
        title: rowTitle(job),
        detail: 'Photos submitted · awaiting QC',
        pill: 'Awaiting QC',
        href: `/admin/jobs/${job.id}`,
        actionLabel: 'Review →',
      });
      continue;
    }

    if (job.openOffer) {
      rows.push({
        id: `${job.id}-offer`,
        title: rowTitle(job),
        detail: formatOfferLifecycleLabel({
          offer: job.openOffer,
          // Monthly payload does not include IntegrationEventLog — never invent delivery.
          notification: { status: 'NOT_RECORDED' },
          jobAssigned: Boolean(job.assignedCleanerId),
        }),
        pill: offerLifecyclePill({
          offer: job.openOffer,
          notification: { status: 'NOT_RECORDED' },
          jobAssigned: Boolean(job.assignedCleanerId),
        }),
        href: `/admin/jobs/${job.id}`,
        actionLabel: 'Open →',
      });
      continue;
    }

    if (
      !job.assignedCleanerId &&
      (job.status === 'CONFIRMED' ||
        job.status === 'ASSIGNED' ||
        job.status === 'RECEIVED')
    ) {
      rows.push({
        id: `${job.id}-dispatch`,
        title: rowTitle(job),
        detail: 'No cleaner · no offer sent',
        pill: 'Needs cleaner',
        href: `/admin/jobs/${job.id}`,
        actionLabel: 'Dispatch →',
      });
    }
  }

  return rows.slice(0, 8);
}

export function JobsWorkspacePanels({
  jobs,
}: {
  jobs: AdminJobListItem[];
  /** @deprecated Empty states no longer surface sample-data notes. */
  sampleData?: boolean;
}) {
  const attention = buildAttentionRows(jobs);

  return (
    <>
      <section className="rounded-[14px] border border-vm-line bg-vm-surface p-[23px]">
        <h2 className="font-heading text-lg font-bold leading-[1.2] tracking-tight text-vm-navy">
          Needs attention
        </h2>
        {attention.length === 0 ? (
          <p className="mt-3 font-body text-sm text-vm-muted">
            Nothing needs attention in this view.
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-vm-line">
            {attention.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3.5"
              >
                <div className="min-w-0">
                  <p className="font-body text-sm font-semibold text-vm-navy">
                    {row.title}
                  </p>
                  <p className="font-body text-xs text-vm-muted">{row.detail}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="whitespace-nowrap rounded-full bg-vm-warning-bg px-2.5 py-1 font-body text-[11px] font-bold text-vm-warning">
                    {row.pill}
                  </span>
                  <Link
                    href={row.href}
                    className="min-h-touch inline-flex items-center font-body text-sm font-bold text-vm-cyan-dark outline-none hover:text-vm-navy focus-visible:ring-2 focus-visible:ring-vm-cyan"
                  >
                    {row.actionLabel}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-[14px] border border-vm-line bg-vm-surface p-[23px]">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-bold leading-[1.2] tracking-tight text-vm-navy">
            Flagged in reports
          </h2>
        </div>
        <p className="mt-3 font-body text-sm text-vm-muted">Nothing flagged yet.</p>
      </section>

      <section className="rounded-[14px] border border-vm-line bg-vm-surface p-[23px]">
        <h2 className="mb-1.5 font-heading text-lg font-bold leading-[1.2] tracking-tight text-vm-navy">
          Reports and invoices
        </h2>
        <p className="mt-3 font-body text-sm text-vm-muted">No reports waiting.</p>
      </section>
    </>
  );
}

export default JobsWorkspacePanels;
