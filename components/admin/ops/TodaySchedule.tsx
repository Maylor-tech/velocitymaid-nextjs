'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DataTable, type DataTableColumn } from '@/components/admin/ds/DataTable';
import { StatusBadge } from '@/components/admin/ds/StatusBadge';
import { toDisplayJobStatus } from '@/lib/admin/jobStatusDisplay';
import type { OpsCommandCenterPayload } from '@/lib/admin/opsCommandCenter';

type ScheduleRow = OpsCommandCenterPayload['todaySchedule'][number] &
  Record<string, unknown>;

export function TodaySchedule({
  rows,
}: {
  rows: OpsCommandCenterPayload['todaySchedule'];
}) {
  const router = useRouter();

  const columns: DataTableColumn<ScheduleRow>[] = [
    {
      key: 'time',
      header: 'Time',
      width: '90px',
      render: (v) => (v ? String(v) : '—'),
    },
    { key: 'customer', header: 'Customer' },
    {
      key: 'property',
      header: 'Property',
      render: (v) => (
        <span className="line-clamp-1 max-w-[220px]" title={String(v)}>
          {String(v)}
        </span>
      ),
    },
    { key: 'service', header: 'Service' },
    {
      key: 'cleaner',
      header: 'Cleaner',
      render: (v, row) =>
        v ? (
          <span>{String(v)}</span>
        ) : (
          <span className="inline-flex rounded-full bg-vm-warning-bg px-2.5 py-0.5 font-body text-xs font-medium text-vm-warning">
            Unassigned
          </span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (v, row) => (
        <StatusBadge status={toDisplayJobStatus(String(v), row.assignedCleanerId)} />
      ),
    },
    {
      key: 'travelZone',
      header: 'Zone',
      render: (v) => (v ? String(v) : '—'),
    },
    {
      key: 'id',
      header: '',
      align: 'right',
      render: (_v, row) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {!row.assignedCleanerId && (
            <Link
              href={`/admin/jobs/${row.id}`}
              className="rounded-md border border-vm-border px-2.5 py-1 font-heading text-[11px] font-bold uppercase tracking-wide text-vm-navy hover:bg-vm-cyan-tint"
            >
              Assign
            </Link>
          )}
          <Link
            href={`/admin/jobs/${row.id}`}
            className="rounded-md bg-vm-navy px-2.5 py-1 font-heading text-[11px] font-bold uppercase tracking-wide text-vm-white hover:bg-vm-navy/90"
          >
            Open
          </Link>
        </div>
      ),
    },
  ];

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-vm-navy">
          Today&apos;s Schedule
        </h2>
        <span className="rounded-full bg-vm-cyan-tint px-2.5 py-0.5 font-body text-xs font-semibold text-vm-navy">
          {rows.length} job{rows.length === 1 ? '' : 's'}
        </span>
      </div>
      <DataTable
        columns={columns}
        rows={rows as ScheduleRow[]}
        getRowKey={(row) => row.id}
        onRowClick={(row) => router.push(`/admin/jobs/${row.id}`)}
        emptyMessage="No jobs scheduled for today."
      />
    </section>
  );
}
