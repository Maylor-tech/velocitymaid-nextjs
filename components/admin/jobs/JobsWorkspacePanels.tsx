'use client';

import Link from 'next/link';
import type { AdminJobListItem } from '@/components/admin/jobs/JobOperationsCard';
import { attentionRowTitle } from '@/lib/admin/attentionRowTitle';
import {
  describeReportInvoice,
  orderCompletedReportInvoiceJobs,
} from '@/lib/admin/jobsMonthlyWorkspace';
import {
  formatOfferLifecycleLabel,
  offerLifecyclePill,
} from '@/lib/dispatch/offerLifecycleLabel';
import { formatServiceDate } from '@/lib/dates/serviceDate';
import { FlaggedReportsPanel } from '@/components/admin/jobs/FlaggedReportsPanel';
import type { DeskJobFlag } from '@/lib/flags/jobFlagDisplay';

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
  openFlags = [],
  flagsPreview = false,
}: {
  jobs: AdminJobListItem[];
  openFlags?: DeskJobFlag[];
  /** Visual fixture. Flag actions stay on screen and do not call the API. */
  flagsPreview?: boolean;
  /** @deprecated Empty states no longer surface sample-data notes. */
  sampleData?: boolean;
}) {
  const attention = buildAttentionRows(jobs);
  const reportRows = orderCompletedReportInvoiceJobs(
    jobs.map((job) => ({
      id: job.id,
      status: job.status,
      preferredDate: job.preferredDate,
      completionReport: job.completionReport ?? null,
      invoice: job.invoice ?? null,
      title: rowTitle(job),
    }))
  );

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

      <FlaggedReportsPanel flags={openFlags} preview={flagsPreview} />

      <section
        id="desk-reports"
        className="rounded-[14px] border border-vm-line bg-vm-surface p-[23px]"
        aria-labelledby="desk-reports-heading"
      >
        <h2
          id="desk-reports-heading"
          className="mb-1.5 font-heading text-lg font-bold leading-[1.2] tracking-tight text-vm-navy"
        >
          Reports and invoices
        </h2>
        {reportRows.length === 0 ? (
          <p className="mt-3 font-body text-sm text-vm-text">No reports waiting.</p>
        ) : (
          <ul className="mt-2 divide-y divide-vm-line">
            {reportRows.map((job) => {
              const described = describeReportInvoice(job);
              return (
                <li
                  key={job.id}
                  className={`flex flex-col items-start gap-1 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 ${
                    described.warn
                      ? '-mx-2 rounded-[10px] border border-vm-warning-border bg-vm-warning-bg px-2'
                      : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-body text-sm font-semibold text-vm-navy">
                      {job.title}
                    </p>
                    <p className="font-body text-sm text-vm-text">{described.reportLabel}</p>
                    <p className="font-body text-sm text-vm-text">{described.invoiceLabel}</p>
                    {described.warn ? (
                      <p className="font-body text-sm font-semibold text-vm-warning">
                        Invoice went out before the report.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3">
                    <Link
                      href={`/admin/jobs/${job.id}`}
                      className="inline-flex min-h-[44px] items-center font-body text-sm font-bold text-vm-cyan-dark outline-none hover:text-vm-navy focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan sm:order-2"
                    >
                      Open →
                    </Link>
                    {described.warn ? (
                      <Link
                        href={`/admin/jobs/${job.id}/complete`}
                        className="inline-flex min-h-[44px] items-center rounded-[10px] bg-vm-navy px-3.5 font-heading text-sm font-semibold text-vm-white no-underline outline-none hover:opacity-90 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan sm:order-1"
                      >
                        Send report
                      </Link>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2.5 rounded-[10px] border border-vm-cyan-border bg-vm-cyan-tint px-3.5 py-3 font-body text-sm text-vm-navy">
          Hosts get the report first, then the invoice.
        </p>
      </section>
    </>
  );
}

export default JobsWorkspacePanels;
