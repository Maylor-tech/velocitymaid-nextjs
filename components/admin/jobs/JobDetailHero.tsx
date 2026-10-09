'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { JobPlaybookPanel } from '@/components/admin/jobs/JobPlaybookPanel';
import { JobStaffingMoneyStrips } from '@/components/admin/jobs/JobStaffingMoneyStrips';
import {
  paymentStatusLabel,
  resolveBillingPolicy,
  serviceStatusLabel,
} from '@/lib/billing/billingPolicy';
import { formatServiceDate } from '@/lib/dates/serviceDate';
import { isTerminalStatus } from '@/lib/jobStatus';
import type { PlaybookJob } from '@/lib/playbook/jobPlaybook';

export type JobDetailHeroJob = PlaybookJob & {
  id: string;
  customerName: string | null;
  address: string | null;
  preferredTime: string | null;
  serviceType: string | null;
  customer?: {
    firstName: string | null;
    lastName: string | null;
  } | null;
  property?: {
    name?: string | null;
    accessType?: string | null;
    standingInstructions?: string | null;
  } | null;
  branch?: {
    name: string;
  } | null;
};

function customerTitle(job: JobDetailHeroJob): string {
  if (job.customerName?.trim()) return job.customerName.trim();
  const fromRecord = [job.customer?.firstName, job.customer?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return fromRecord || 'Untitled job';
}

function statusChipClass(kind: 'service' | 'money' | 'review'): string {
  if (kind === 'money') return 'bg-vm-success-bg text-vm-success';
  if (kind === 'review') return 'bg-amber-50 text-amber-900';
  return 'bg-vm-surface text-vm-navy';
}

export function JobDetailHero({
  job,
  isBranchScoped,
}: {
  job: JobDetailHeroJob;
  isBranchScoped: boolean;
}) {
  const policy = resolveBillingPolicy({ jobPolicy: job.billingPolicy ?? undefined });
  const title = customerTitle(job);
  const property = job.property?.name?.trim() || job.address || 'Address not set';
  const when = formatServiceDate(job.preferredDate, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const showReview =
    Boolean(job.reviewStatus) && !isTerminalStatus(job.status);

  return (
    <header className="mb-6">
      <Link
        href="/admin/jobs"
        className="mb-4 inline-flex items-center font-body text-sm text-vm-cyan-dark hover:underline"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Jobs
      </Link>

      <div className="rounded-xl border border-vm-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="font-body text-[11px] font-bold uppercase tracking-[0.18em] text-vm-cyan-dark">
              {job.branch?.name || 'Job'}
            </p>
            <h1 className="mt-1 font-heading text-3xl font-bold text-vm-navy">{title}</h1>
            <p className="mt-1 font-body text-sm text-vm-muted">
              {property}
              {job.serviceType ? ` · ${job.serviceType}` : ''}
            </p>
            <p className="mt-0.5 font-body text-sm text-vm-navy">
              {when}
              {job.preferredTime ? ` · ${job.preferredTime}` : ''}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <span
              className={`rounded-full px-3 py-1 font-body text-xs font-semibold ${statusChipClass('service')}`}
            >
              {serviceStatusLabel(job.status)}
            </span>
            {!isBranchScoped && (
              <span
                className={`rounded-full px-3 py-1 font-body text-xs font-semibold ${statusChipClass('money')}`}
              >
                {paymentStatusLabel(job.paymentStatus, policy)}
              </span>
            )}
            {showReview && (
              <span
                className={`rounded-full px-3 py-1 font-body text-xs font-semibold ${statusChipClass('review')}`}
              >
                Review {job.reviewStatus?.toLowerCase()}
              </span>
            )}
          </div>
        </div>

        {!isBranchScoped && (
          <JobStaffingMoneyStrips
            job={{
              status: job.status,
              paymentStatus: job.paymentStatus,
              reviewStatus: job.reviewStatus,
              billingPolicy: job.billingPolicy,
              assignedCleanerId: job.assignedCleanerId,
            }}
            className="mt-4"
          />
        )}

        {!isBranchScoped && (
          <JobPlaybookPanel
            job={job}
            className="mt-4 border-0 bg-transparent p-0 shadow-none"
          />
        )}
      </div>
    </header>
  );
}
