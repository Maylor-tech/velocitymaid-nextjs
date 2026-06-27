'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  DollarSign,
  Download,
  FileText,
  Loader2,
  Plus,
  Star,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdminPageHeader } from '@/components/admin/shell/AdminShell';
import { KpiCard, type KpiDelta } from '@/components/admin/ds/KpiCard';
import { Tabs } from '@/components/admin/ds/Tabs';
import { DataTable, type DataTableColumn } from '@/components/admin/ds/DataTable';
import { StatusBadge } from '@/components/admin/ds/StatusBadge';
import { Avatar } from '@/components/admin/ds/Avatar';
import {
  formatJobRef,
  toDisplayJobStatus,
} from '@/lib/admin/jobStatusDisplay';

interface OperationsKpis {
  jobsThisWeek: number;
  jobsWeekDelta?: KpiDelta;
  revenueWeek: number;
  revenueWeekDelta?: KpiDelta;
  activeCleaners: number;
  onboardingCleaners: number;
  newCleanerApplications: number;
  avgRating: number | null;
  ratingDelta?: KpiDelta;
  outstandingInvoices?: number;
  outstandingBalanceFormatted?: string;
  paymentsThisMonthFormatted?: string;
  completionReportsPending?: number;
  reviewsRequested?: number;
}

interface DashboardJob {
  id: string;
  customerName: string | null;
  serviceType: string | null;
  status: string;
  totalPrice: number | null;
  currency: string | null;
  assignedCleanerId: string | null;
  assignedCleaner: { id: string; name: string | null; email: string } | null;
  branch: { id: string; name: string; slug: string; state?: string | null };
}

type JobTab = 'all' | 'pending' | 'in_progress' | 'needs';

interface JobRow extends Record<string, unknown> {
  id: string;
  jobRef: string;
  customer: string;
  service: string;
  specialist: string;
  branch: string;
  status: string;
  total: string;
  assignedCleanerId: string | null;
  rawStatus: string;
}

function formatHeaderDate(): string {
  const now = new Date();
  const day = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  return `${day} · NJ & Vermont`;
}

function formatRevenue(value: number): string {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

function formatCurrency(amount: number | null, currency: string | null): string {
  if (amount == null) return '—';
  const code = currency || 'USD';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    maximumFractionDigits: 0,
  }).format(amount);
}

function branchLabel(job: DashboardJob): string {
  const b = job.branch;
  if (b.state && b.name) {
    const city = b.name.split('—')[0]?.trim() || b.name;
    return `${city}, ${b.state}`;
  }
  return b.name;
}

function jobMatchesTab(job: DashboardJob, tab: JobTab): boolean {
  const display = toDisplayJobStatus(job.status, job.assignedCleanerId);
  switch (tab) {
    case 'pending':
      return display === 'pending';
    case 'in_progress':
      return display === 'in_progress';
    case 'needs':
      return !job.assignedCleanerId && display !== 'completed' && display !== 'cancelled';
    default:
      return true;
  }
}

function jobsToCsv(rows: JobRow[]): string {
  const header = ['Job', 'Customer', 'Service', 'Specialist', 'Branch', 'Status', 'Total'];
  const lines = rows.map((r) =>
    [r.jobRef, r.customer, r.service, r.specialist, r.branch, r.status, r.total]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header.join(','), ...lines].join('\n');
}

export default function OperationsDashboardPage() {
  const router = useRouter();
  const [kpis, setKpis] = useState<OperationsKpis | null>(null);
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [tab, setTab] = useState<JobTab>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [opsRes, jobsRes] = await Promise.all([
        fetch('/api/admin/dashboard/operations', {
          cache: 'no-store',
          credentials: 'include',
        }),
        fetch('/api/admin/jobs/list', {
          cache: 'no-store',
          credentials: 'include',
        }),
      ]);

      const opsData = await opsRes.json();
      const jobsData = await jobsRes.json();

      if (!opsData.success) {
        throw new Error(opsData.error || 'Failed to load KPIs');
      }
      setKpis(opsData.kpis);

      if (jobsData.success) {
        setJobs((jobsData.jobs ?? []).slice(0, 50));
      } else {
        setJobs([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredJobs = useMemo(
    () => jobs.filter((j) => jobMatchesTab(j, tab)),
    [jobs, tab]
  );

  const tableRows: JobRow[] = useMemo(
    () =>
      filteredJobs.map((job) => ({
        id: job.id,
        jobRef: formatJobRef(job.id),
        customer: job.customerName || '—',
        service: job.serviceType || '—',
        specialist: job.assignedCleaner?.name || job.assignedCleaner?.email || 'Unassigned',
        branch: branchLabel(job),
        status: toDisplayJobStatus(job.status, job.assignedCleanerId),
        total: formatCurrency(job.totalPrice, job.currency),
        assignedCleanerId: job.assignedCleanerId,
        rawStatus: job.status,
      })),
    [filteredJobs]
  );

  const tabCounts = useMemo(
    () => ({
      all: jobs.length,
      pending: jobs.filter((j) => jobMatchesTab(j, 'pending')).length,
      in_progress: jobs.filter((j) => jobMatchesTab(j, 'in_progress')).length,
      needs: jobs.filter((j) => jobMatchesTab(j, 'needs')).length,
    }),
    [jobs]
  );

  const columns: DataTableColumn<JobRow>[] = useMemo(
    () => [
      { key: 'jobRef', header: 'Job' },
      { key: 'customer', header: 'Customer' },
      { key: 'service', header: 'Service' },
      {
        key: 'specialist',
        header: 'Specialist',
        render: (value, row) =>
          row.specialist === 'Unassigned' ? (
            <span className="inline-flex rounded-full bg-vm-warning-bg px-2.5 py-0.5 font-body text-xs font-medium text-vm-warning">
              Unassigned
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Avatar name={String(value)} size="sm" />
              <span>{String(value)}</span>
            </span>
          ),
      },
      { key: 'branch', header: 'Branch' },
      {
        key: 'status',
        header: 'Status',
        render: (value) => <StatusBadge status={String(value)} />,
      },
      { key: 'total', header: 'Total', align: 'right' },
    ],
    []
  );

  const handleExport = () => {
    const csv = jobsToCsv(tableRows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `velocitymaid-jobs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <AdminPageHeader
        title="Operations Dashboard"
        subtitle={formatHeaderDate()}
        actions={
          <>
            <Button variant="navyOutline" size="sm" onClick={handleExport} type="button">
              <Download className="mr-1.5 h-4 w-4" />
              Export
            </Button>
            <Link href="/admin/jobs/new" className="inline-flex h-9 items-center rounded-md bg-vm-navy px-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-white shadow-md transition-opacity hover:bg-vm-navy/90">
              <Plus className="mr-1.5 h-4 w-4" />
              New job
            </Link>
          </>
        }
      />

      <div className="p-7">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-vm-danger-bg p-6 text-vm-danger">
            {error}
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Jobs this week"
                value={kpis?.jobsThisWeek ?? 0}
                delta={kpis?.jobsWeekDelta}
                icon={<Calendar className="h-5 w-5" />}
              />
              <KpiCard
                label="Revenue (wk)"
                value={formatRevenue(kpis?.revenueWeek ?? 0)}
                delta={kpis?.revenueWeekDelta}
                icon={<DollarSign className="h-5 w-5" />}
              />
              <KpiCard
                label="Active cleaners"
                value={kpis?.activeCleaners ?? 0}
                subtitle={
                  kpis?.onboardingCleaners
                    ? `${kpis.onboardingCleaners} onboarding`
                    : undefined
                }
                icon={<Users className="h-5 w-5" />}
              />
              <KpiCard
                label="Avg. rating"
                value={kpis?.avgRating != null ? kpis.avgRating.toFixed(1) : '—'}
                delta={kpis?.ratingDelta}
                icon={<Star className="h-5 w-5 fill-vm-cyan-dark text-vm-cyan-dark" />}
              />
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="Outstanding invoices"
                value={kpis?.outstandingInvoices ?? 0}
                subtitle={kpis?.outstandingBalanceFormatted}
                icon={<DollarSign className="h-5 w-5" />}
              />
              <KpiCard
                label="Payments this month"
                value={kpis?.paymentsThisMonthFormatted ?? '$0'}
                icon={<DollarSign className="h-5 w-5" />}
              />
              <KpiCard
                label="Reports pending"
                value={kpis?.completionReportsPending ?? 0}
                icon={<FileText className="h-5 w-5" />}
              />
              <KpiCard
                label="Reviews requested"
                value={kpis?.reviewsRequested ?? 0}
                icon={<Star className="h-5 w-5" />}
              />
            </div>

            {(kpis?.newCleanerApplications ?? 0) > 0 && (
              <Link
                href="/admin/cleaners/applications"
                className="mb-6 flex items-center justify-between rounded-xl border border-vm-cyan/40 bg-vm-cyan-tint px-5 py-4 transition-colors hover:bg-vm-cyan/10"
              >
                <div>
                  <p className="font-heading text-sm font-semibold text-vm-navy">Cleaner applications</p>
                  <p className="font-body text-xs text-vm-muted">New talent portal submissions need review</p>
                </div>
                <span className="rounded-full bg-vm-navy px-3 py-1 font-heading text-sm font-bold text-white">
                  {kpis?.newCleanerApplications} New
                </span>
              </Link>
            )}

            <div className="overflow-hidden rounded-xl border border-vm-border bg-vm-white shadow-sm">
              <div className="px-5 pt-5">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <h2 className="font-heading text-lg font-semibold text-vm-navy">
                    Recent jobs
                  </h2>
                  <span className="rounded-full bg-vm-cyan-tint px-2.5 py-0.5 font-body text-xs font-semibold text-vm-navy">
                    {tableRows.length} this view
                  </span>
                </div>
                <Tabs
                  value={tab}
                  onChange={(v) => setTab(v as JobTab)}
                  tabs={[
                    { value: 'all', label: 'All', count: tabCounts.all },
                    { value: 'pending', label: 'Pending', count: tabCounts.pending },
                    {
                      value: 'in_progress',
                      label: 'In progress',
                      count: tabCounts.in_progress,
                    },
                    {
                      value: 'needs',
                      label: 'Needs assignment',
                      count: tabCounts.needs,
                    },
                  ]}
                />
              </div>
              <div className="p-5 pt-4">
                <DataTable
                  columns={columns}
                  rows={tableRows}
                  getRowKey={(row) => row.id}
                  onRowClick={(row) => router.push(`/admin/jobs/${row.id}`)}
                  emptyMessage="No jobs match this filter."
                />
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
