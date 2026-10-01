'use client';

import { AlertTriangle, CheckCircle2, Clock, ListChecks } from 'lucide-react';
import {
  buildJobPlaybook,
  type PlaybookJob,
  type PlaybookPriority,
} from '@/lib/playbook/jobPlaybook';

const PRIORITY_META: Record<
  PlaybookPriority,
  { label: string; cls: string; Icon: typeof AlertTriangle }
> = {
  now: {
    label: 'Now',
    cls: 'bg-vm-warning-bg text-vm-warning',
    Icon: AlertTriangle,
  },
  soon: {
    label: 'Soon',
    cls: 'bg-vm-cyan-tint text-vm-navy',
    Icon: Clock,
  },
  later: {
    label: 'Later',
    cls: 'bg-vm-surface text-vm-muted',
    Icon: Clock,
  },
};

/**
 * Rule-based "next actions" playbook for a job. Reads the same policy-derived
 * staffing/money state the strips use and renders prioritised guidance. It is
 * advisory only — no mutations, no payment-status shortcuts.
 */
export function JobPlaybookPanel({
  job,
  className,
}: {
  job: PlaybookJob;
  className?: string;
}) {
  const playbook = buildJobPlaybook(job);

  return (
    <div
      className={`rounded-xl border border-vm-border bg-vm-white p-5 ${className ?? ''}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <ListChecks className="h-5 w-5 text-vm-cyan-dark" />
        <h2 className="font-heading text-lg font-semibold text-vm-navy">
          Shift playbook
        </h2>
        {playbook.urgentCount > 0 && (
          <span className="rounded-full bg-vm-warning-bg px-2 py-0.5 font-body text-xs font-semibold text-vm-warning">
            {playbook.urgentCount} to do now
          </span>
        )}
      </div>

      {playbook.steps.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-vm-success/30 bg-vm-success-bg px-3 py-2 font-body text-sm text-vm-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {playbook.headline}
        </div>
      ) : (
        <ul className="space-y-2">
          {playbook.steps.map((step) => {
            const meta = PRIORITY_META[step.priority];
            const Icon = meta.Icon;
            return (
              <li
                key={step.id}
                className="flex items-start gap-3 rounded-lg border border-vm-border bg-vm-surface/40 px-3 py-2.5"
              >
                <span
                  className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-body text-xs font-semibold ${meta.cls}`}
                >
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </span>
                <div className="font-body text-sm">
                  <p className="font-semibold text-vm-navy">{step.title}</p>
                  <p className="mt-0.5 text-vm-muted">{step.detail}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
