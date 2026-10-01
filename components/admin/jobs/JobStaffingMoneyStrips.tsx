'use client';

import {
  deriveMoneyState,
  deriveStaffingState,
  type StaffingMoneyJob,
} from '@/lib/admin/jobStaffingMoney';

/**
 * Two independent read-outs for an admin job: Staffing (derived from the
 * isJobAssignable policy) and Money (policy-aware payment label). They never
 * cross-contaminate — e.g. invoice-after-service can be "Ready to staff" while
 * money reads "Invoice after service".
 */
export function JobStaffingMoneyStrips({
  job,
  className,
}: {
  job: StaffingMoneyJob;
  className?: string;
}) {
  const staffing = deriveStaffingState(job);
  const money = deriveMoneyState(job);

  return (
    <div className={`grid gap-2 sm:grid-cols-2 ${className ?? ''}`}>
      <Strip
        title="Staffing"
        label={staffing.label}
        cls={staffing.cls}
        emphasize={staffing.urgent}
      />
      <Strip title="Money" label={money.label} cls={money.cls} />
    </div>
  );
}

function Strip({
  title,
  label,
  cls,
  emphasize,
}: {
  title: string;
  label: string;
  cls: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 ${
        emphasize ? 'border-vm-cyan/40 bg-vm-cyan-tint/30' : 'border-vm-border bg-vm-surface/40'
      }`}
    >
      <span className="font-body text-xs font-semibold uppercase tracking-wide text-vm-muted">
        {title}
      </span>
      <span className={`rounded-full px-2 py-0.5 font-body text-xs font-medium ${cls}`}>
        {label}
      </span>
    </div>
  );
}
