'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/admin/ds/StatusBadge';
import { toDisplayJobStatus } from '@/lib/admin/jobStatusDisplay';
import type { OpsDesk, OpsDeskJob } from '@/lib/admin/opsDeskData';

function JobRow({ job }: { job: OpsDeskJob }) {
  return (
    <li className="flex flex-col gap-3 border-b border-vm-border px-4 py-3 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-body text-sm font-semibold text-vm-navy">{job.when}</p>
        <p className="mt-0.5 truncate font-body text-sm text-vm-text">
          {job.client}
          <span className="text-vm-muted"> · {job.property}</span>
        </p>
        <p className="mt-0.5 font-body text-xs text-vm-muted">
          {job.service} · {job.price}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <StatusBadge status={toDisplayJobStatus(job.status, job.assigned ? 'assigned' : null)} />
        <Link
          href={job.action.href}
          className="shrink-0 rounded-md bg-vm-navy px-3 py-1.5 font-heading text-[11px] font-bold uppercase tracking-wide text-vm-white no-underline hover:bg-vm-navy/90"
        >
          {job.action.label}
        </Link>
      </div>
    </li>
  );
}

function Group({
  title,
  jobs,
  collapsed,
  showEmpty,
}: {
  title: string;
  jobs: OpsDeskJob[];
  collapsed?: boolean;
  showEmpty?: boolean;
}) {
  if (jobs.length === 0 && !showEmpty) return null;
  const list = jobs.length === 0 ? (
    <p className="px-4 py-4 font-body text-sm text-vm-muted">No jobs in the next 48 hours.</p>
  ) : (
    <ul className="divide-y divide-vm-border">
      {jobs.map((job) => (
        <JobRow key={job.id} job={job} />
      ))}
    </ul>
  );
  if (!collapsed) {
    return (
      <section className="overflow-hidden rounded-xl border border-vm-border bg-vm-white">
        <h3 className="border-b border-vm-border px-4 py-3 font-heading text-sm font-semibold text-vm-navy">
          {title}
          <span className="ml-2 font-body text-xs font-medium text-vm-muted">{jobs.length}</span>
        </h3>
        {list}
      </section>
    );
  }
  return (
    <details className="overflow-hidden rounded-xl border border-vm-border bg-vm-white">
      <summary className="cursor-pointer px-4 py-3 font-heading text-sm font-semibold text-vm-navy">
        {title}
        <span className="ml-2 font-body text-xs font-medium text-vm-muted">{jobs.length}</span>
      </summary>
      {list}
    </details>
  );
}

const FILTERS = {
  today: { title: 'Today', jobs: (desk: OpsDesk) => desk.lists.today },
  next7: { title: 'Next 7 days', jobs: (desk: OpsDesk) => desk.lists.next7Days },
  cleaner: { title: 'Needs a cleaner', jobs: (desk: OpsDesk) => desk.lists.needsCleaner },
  payment: { title: 'Waiting on client payment', jobs: (desk: OpsDesk) => desk.lists.waitingOnPayment },
} as const;

export function OpsJobList({
  desk,
  list,
}: {
  desk: OpsDesk;
  list: string | null;
}) {
  const filter = list && list in FILTERS ? FILTERS[list as keyof typeof FILTERS] : null;

  return (
    <section className="mb-6 space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-vm-navy">
            {filter ? filter.title : 'Jobs needing action'}
          </h2>
          <p className="mt-0.5 font-body text-xs text-vm-muted">
            {filter
              ? `${filter.jobs(desk).length} jobs · Eastern time`
              : `${desk.jobsNeedingAction} jobs · next 48 hours, this week, then later`}
          </p>
        </div>
        {filter && (
          <Link href="/admin" className="font-body text-xs font-semibold text-vm-navy hover:underline">
            All action jobs
          </Link>
        )}
      </div>

      {filter ? (
        filter.jobs(desk).length === 0 ? (
          <p className="rounded-xl border border-vm-border bg-vm-white px-4 py-8 text-center font-body text-sm text-vm-muted">
            Nothing in this list.
          </p>
        ) : (
          <Group title={filter.title} jobs={filter.jobs(desk)} />
        )
      ) : (
        <>
          <Group title="Next 48 hours" jobs={desk.groups.next48} showEmpty />
          <Group title="This week" jobs={desk.groups.thisWeek} />
          <Group title="Later" jobs={desk.groups.later} collapsed />
        </>
      )}
    </section>
  );
}
