'use client';

import Link from 'next/link';
import type { OpsCommandCenterPayload } from '@/lib/admin/opsCommandCenter';

function stageLabel(stage: string): string {
  return stage
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export function LeadPipelinePanel({
  data,
  branchScoped = false,
}: {
  data: OpsCommandCenterPayload['leadPipeline'];
  branchScoped?: boolean;
}) {
  return (
    <section className="rounded-xl border border-vm-border bg-vm-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-vm-navy">Lead Pipeline</h2>
        {!branchScoped && (
          <Link
            href="/admin/lead-center"
            className="font-body text-xs font-semibold text-vm-cyan-dark hover:underline"
          >
            Lead center →
          </Link>
        )}
      </div>

      <p className="mb-4 font-body text-sm text-vm-muted">
        Pipeline potential{' '}
        <span className="font-heading font-semibold text-vm-navy">
          {data.potentialMonthlyRevenueFormatted}
        </span>
      </p>

      <div className="mb-5 flex flex-wrap gap-2">
        {data.stages.map((s) => (
          <div
            key={s.stage}
            className="rounded-lg border border-vm-border bg-vm-surface px-3 py-2"
          >
            <p className="font-heading text-lg font-bold text-vm-navy">{s.count}</p>
            <p className="font-body text-[11px] text-vm-muted">{stageLabel(s.stage)}</p>
          </div>
        ))}
      </div>

      <h3 className="mb-2 font-heading text-xs font-bold uppercase tracking-wide text-vm-muted">
        Upcoming follow-ups
      </h3>
      {data.upcoming.length === 0 ? (
        <p className="font-body text-xs text-vm-muted">No upcoming follow-ups.</p>
      ) : (
        <ul className="space-y-2">
          {data.upcoming.map((lead) => {
            const body = (
              <>
                <div className="min-w-0">
                  <p className="truncate font-body text-sm font-medium text-vm-navy">
                    {lead.name}
                  </p>
                  <p className="font-body text-xs text-vm-muted">
                    {stageLabel(lead.stage)}
                    {lead.nextActionDate
                      ? ` · ${new Date(lead.nextActionDate).toLocaleDateString()}`
                      : ''}
                  </p>
                </div>
                {lead.estimatedRevenue != null && (
                  <span className="shrink-0 font-heading text-sm font-semibold text-vm-navy">
                    ${Math.round(lead.estimatedRevenue).toLocaleString()}
                  </span>
                )}
              </>
            );
            return (
              <li key={lead.id}>
                {branchScoped ? (
                  <div className="flex items-center justify-between gap-2 rounded-lg border border-vm-border px-3 py-2">
                    {body}
                  </div>
                ) : (
                  <Link
                    href={`/admin/lead-center?lead=${lead.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-vm-border px-3 py-2 hover:bg-vm-cyan-tint/50"
                  >
                    {body}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
