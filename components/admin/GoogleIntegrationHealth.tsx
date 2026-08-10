'use client';

/**
 * Google Workspace Integration Health — exception desk UI.
 * Retry reuses POST /api/admin/jobs/[jobId]/sync-google then refetches health GET.
 */
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import {
  retryJobGoogleSyncAndRefreshHealth,
  type HealthJobIssue,
  type HealthReason,
  type IntegrationHealthReport,
  type OverallHealthStatus,
} from '@/lib/google/integrationHealth';

const REASON_LABEL: Record<HealthReason, string> = {
  CALENDAR_ERROR: 'Calendar error',
  MISSING_CALENDAR_EVENT: 'Missing calendar event',
  MISSING_DRIVE_FOLDER: 'Missing Drive folder',
};

function overallLabel(status: OverallHealthStatus): string {
  if (status === 'critical') return 'Critical';
  if (status === 'attention') return 'Needs attention';
  return 'Healthy';
}

function overallClass(status: OverallHealthStatus): string {
  if (status === 'critical') return 'bg-vm-danger/10 text-vm-danger';
  if (status === 'attention') return 'bg-amber-50 text-amber-800';
  return 'bg-vm-success-bg text-vm-success';
}

async function fetchHealthReport(): Promise<IntegrationHealthReport> {
  const res = await fetch('/api/admin/settings/integrations/health', {
    credentials: 'include',
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error || 'Failed to load integration health');
  }
  return {
    overallStatus: data.overallStatus,
    jobs: data.jobs,
    recentFailures: data.recentFailures,
    lastSyncError: data.lastSyncError ?? null,
    lastSyncErrorAt: data.lastSyncErrorAt ?? null,
    driveEnabled: Boolean(data.driveEnabled),
    calendarEnabled: Boolean(data.calendarEnabled),
  } as IntegrationHealthReport;
}

async function postSyncGoogle(jobId: string): Promise<{ ok: boolean; body: unknown }> {
  const res = await fetch(`/api/admin/jobs/${jobId}/sync-google`, {
    method: 'POST',
    credentials: 'include',
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok && Boolean((body as { success?: boolean }).success), body };
}

export default function GoogleIntegrationHealth() {
  const [report, setReport] = useState<IntegrationHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncingJobId, setSyncingJobId] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchHealthReport());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load health');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onRetry = async (job: HealthJobIssue) => {
    setSyncingJobId(job.jobId);
    setRetryMessage(null);
    try {
      const result = await retryJobGoogleSyncAndRefreshHealth({
        jobId: job.jobId,
        sync: postSyncGoogle,
        fetchHealth: fetchHealthReport,
      });
      setReport(result.health);
      const body = result.sync.body as {
        drive?: { status?: string; message?: string };
        calendar?: { status?: string; message?: string };
        error?: string;
      };
      if (!result.sync.ok) {
        setRetryMessage(body.error || 'Sync request failed — health refreshed from server.');
      } else {
        setRetryMessage(
          `Sync finished (Drive: ${body.drive?.status ?? '—'}, Calendar: ${body.calendar?.status ?? '—'}). List refreshed from server.`
        );
      }
    } catch (err) {
      setRetryMessage(err instanceof Error ? err.message : 'Retry failed');
      await load();
    } finally {
      setSyncingJobId(null);
    }
  };

  if (loading && !report) {
    return (
      <div className="mt-6 flex justify-center border-t border-vm-border pt-6">
        <Loader2 className="h-5 w-5 animate-spin text-vm-cyan" />
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="mt-6 border-t border-vm-border pt-6">
        <p className="font-body text-sm text-vm-danger">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-2 font-body text-xs font-semibold text-vm-navy underline"
        >
          Retry load
        </button>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="mt-6 space-y-4 border-t border-vm-border pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-base font-semibold text-vm-navy">Integration Health</h3>
          <p className="mt-1 font-body text-sm text-vm-muted">
            Jobs that need Google attention. Supabase remains the source of truth.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-1 font-body text-xs font-semibold ${overallClass(report.overallStatus)}`}
          >
            {overallLabel(report.overallStatus)}
          </span>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-lg border border-vm-border px-2 py-1 font-body text-xs text-vm-navy hover:bg-vm-surface disabled:opacity-50"
            aria-label="Refresh health"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {retryMessage && (
        <p className="font-body text-xs text-vm-muted">{retryMessage}</p>
      )}

      {report.jobs.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg border border-vm-border bg-vm-surface/50 px-3 py-3">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-vm-success" />
          <p className="font-body text-sm text-vm-navy">No Google sync issues.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {report.jobs.map((job) => (
            <li
              key={job.jobId}
              className="flex flex-col gap-2 rounded-lg border border-vm-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/jobs/${job.jobId}`}
                    className="font-heading text-sm font-semibold text-vm-navy hover:underline"
                  >
                    {job.jobReference || job.jobId}
                  </Link>
                  <span className="font-body text-sm text-vm-muted truncate">
                    {job.customerName || '—'}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {job.reasons.map((reason) => (
                    <span
                      key={reason}
                      className={`rounded-full px-2 py-0.5 font-body text-[11px] font-semibold ${
                        reason === 'CALENDAR_ERROR'
                          ? 'bg-vm-danger/10 text-vm-danger'
                          : 'bg-vm-surface text-vm-navy'
                      }`}
                    >
                      {REASON_LABEL[reason]}
                    </span>
                  ))}
                </div>
              </div>
              <button
                type="button"
                disabled={syncingJobId === job.jobId}
                onClick={() => void onRetry(job)}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-vm-navy px-3 py-1.5 font-body text-xs font-semibold text-vm-white hover:bg-vm-navy/90 disabled:opacity-60"
              >
                {syncingJobId === job.jobId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : null}
                Sync to Google
              </button>
            </li>
          ))}
        </ul>
      )}

      {(report.lastSyncError || report.recentFailures.length > 0) && (
        <div className="rounded-lg border border-dashed border-vm-border bg-vm-surface/40 p-3">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-vm-muted">
            Supporting history (does not set Critical alone)
          </p>
          {report.lastSyncError && (
            <div className="mt-2 flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-vm-muted" />
              <div>
                <p className="font-body text-xs text-vm-navy">{report.lastSyncError}</p>
                {report.lastSyncErrorAt && (
                  <p className="mt-0.5 font-body text-[11px] text-vm-muted">
                    {new Date(report.lastSyncErrorAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
          {report.recentFailures.length > 0 && (
            <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
              {report.recentFailures.map((log) => (
                <li key={log.id} className="font-body text-[11px] text-vm-muted">
                  <span className="text-vm-navy">{log.channel}</span> · {log.action}
                  {log.jobReference ? ` · ${log.jobReference}` : ''}
                  {log.errorSummary ? ` — ${log.errorSummary}` : ''}
                  <span className="ml-1 opacity-70">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
