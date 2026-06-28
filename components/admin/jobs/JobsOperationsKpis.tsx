'use client';

import { KpiCard } from '@/components/admin/ds/KpiCard';
import type { OperationsSummary } from '@/lib/admin/jobsOperations';
import { formatUsd } from '@/lib/admin/jobsOperations';
import {
  Activity,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

interface JobsOperationsKpisProps {
  summary: OperationsSummary;
  hideFinancial?: boolean;
}

export function JobsOperationsKpis({ summary, hideFinancial = false }: JobsOperationsKpisProps) {
  const attention = summary.needsAttention;

  return (
    <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <KpiCard
        label="Scheduled Today"
        value={summary.scheduledToday}
        icon={<Calendar className="h-5 w-5" />}
      />
      {!hideFinancial && (
        <KpiCard
          label="Awaiting Payment"
          value={formatUsd(summary.awaitingPaymentAmount)}
          subtitle={`${summary.awaitingPaymentCount} awaiting payment`}
          icon={<DollarSign className="h-5 w-5" />}
        />
      )}
      <KpiCard
        label="Needs Attention"
        value={attention.total}
        subtitle={
          attention.total > 0
            ? [
                attention.unassigned > 0 && `${attention.unassigned} unassigned`,
                !hideFinancial &&
                  attention.overduePayments > 0 &&
                  `${attention.overduePayments} overdue pay`,
                attention.missingPhotos > 0 && `${attention.missingPhotos} missing photos`,
                attention.incompleteChecklists > 0 &&
                  `${attention.incompleteChecklists} incomplete checklist`,
              ]
                .filter(Boolean)
                .join(' · ')
            : 'All clear'
        }
        icon={<AlertTriangle className="h-5 w-5" />}
      />
      <KpiCard
        label={`Completed — ${summary.monthName}`}
        value={summary.completedThisMonth}
        icon={<CheckCircle2 className="h-5 w-5" />}
      />
      {!hideFinancial && (
        <KpiCard
          label={`${summary.monthName} Revenue`}
          value={formatUsd(summary.monthRevenue)}
          subtitle="Paid this month"
          icon={<DollarSign className="h-5 w-5" />}
        />
      )}
    </div>
  );
}

interface OperationsHealthProps {
  summary: OperationsSummary;
}

export function OperationsHealthScore({ summary }: OperationsHealthProps) {
  const m = summary.healthMetrics;
  const scoreColor =
    summary.healthScore >= 80
      ? 'text-vm-success'
      : summary.healthScore >= 50
        ? 'text-vm-warning'
        : 'text-vm-danger';

  return (
    <div className="mb-6 rounded-xl border border-vm-border bg-vm-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-vm-cyan-tint text-vm-cyan-dark">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="font-body text-sm font-medium text-vm-muted">Today&apos;s Operations</p>
            <p className={`font-heading text-2xl font-bold ${scoreColor}`}>
              {summary.healthScore}%
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          <HealthMetric label="Jobs completed" value={m.jobsCompletedToday} total={m.todayJobCount} />
          <HealthMetric label="Assigned" value={m.jobsAssignedToday} total={m.todayJobCount} />
          <HealthMetric label="Photos uploaded" value={m.photosUploadedToday} total={m.todayJobCount} />
          <HealthMetric label="Payments collected" value={m.paymentsCollectedToday} />
          <HealthMetric label="Messages sent" value={m.messagesCompletedToday} total={m.todayJobCount} />
          <HealthMetric label="Invoices sent" value={m.invoicesSentToday} />
        </div>
      </div>
      {m.todayJobCount === 0 && (
        <p className="mt-3 font-body text-xs text-vm-muted">No jobs scheduled today — score reflects readiness.</p>
      )}
    </div>
  );
}

function HealthMetric({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total?: number;
}) {
  return (
    <div>
      <p className="font-body text-xs text-vm-muted">{label}</p>
      <p className="font-heading text-sm font-semibold text-vm-navy">
        {value}
        {total != null && total > 0 ? (
          <span className="font-body font-normal text-vm-muted"> / {total}</span>
        ) : null}
      </p>
    </div>
  );
}
