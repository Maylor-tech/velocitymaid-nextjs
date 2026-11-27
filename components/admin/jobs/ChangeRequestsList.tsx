'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, X } from 'lucide-react';

type Row = {
  id: string;
  status: string;
  requestedAt: string;
  payload: {
    newDate?: string | null;
    newStartTime?: string | null;
    newDuration?: number | null;
    newAddress?: string | null;
    notes?: string | null;
    decision?: { action: string; at: string; note: string | null };
  };
  customer: { id: string; name: string };
  job: { id: string; reference: string | null; status: string; date: string | null; time: string | null; hasCleaner: boolean; property: string | null };
};

const day = (iso: string | null | undefined) =>
  iso
    ? new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : '—';

/** Client change requests. With jobId: only that job's pending requests (job page panel). */
export function ChangeRequestsList({
  jobId,
  showHandled = false,
  onDecided,
  compact = false,
}: {
  jobId?: string;
  showHandled?: boolean;
  onDecided?: () => void;
  compact?: boolean;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    const qs = new URLSearchParams({ status: showHandled ? 'ALL' : 'PENDING' });
    if (jobId) qs.set('jobId', jobId);
    try {
      const res = await fetch(`/api/admin/jobs/change-requests?${qs}`, { credentials: 'include' });
      const data = await res.json().catch(() => null);
      if (data?.success) setRows(data.requests);
      else setError(data?.error || `Could not load requests (error ${res.status}).`);
    } catch {
      setError('Could not reach the server.');
    }
  }, [jobId, showHandled]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (id: string, action: 'approve' | 'decline') => {
    setBusy(id + action);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/jobs/change-requests/${id}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: notes[id] || null }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.success) throw new Error(data?.error || `Error ${res.status}`);
      const follow = (data.manualFollowUp as string[] | undefined)?.join(' ');
      setMessage(
        action === 'approve'
          ? `Approved. The clean and Google Calendar are updated.${follow ? ` ${follow}` : ''}`
          : 'Declined. The client sees it in their portal.'
      );
      await load();
      onDecided?.();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not save.');
    } finally {
      setBusy(null);
    }
  };

  if (error) return <p className="font-body text-sm text-vm-danger">{error}</p>;
  if (!rows) return <Loader2 className="h-5 w-5 animate-spin text-vm-cyan" />;
  if (rows.length === 0) {
    return compact ? null : <p className="font-body text-sm text-vm-muted">No change requests waiting.</p>;
  }

  return (
    <div className="space-y-3">
      {message && <p className="rounded-lg bg-vm-surface px-3 py-2 font-body text-sm text-vm-navy">{message}</p>}
      {rows.map((r) => {
        const p = r.payload;
        const pending = r.status === 'PENDING';
        return (
          <div key={r.id} className="rounded-xl border border-vm-border bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-heading text-sm font-semibold text-vm-navy">
                  {r.customer.name}
                  {r.job.property ? ` · ${r.job.property}` : ''}
                </p>
                <p className="font-body text-xs text-vm-muted">
                  Asked {new Date(r.requestedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  {' · '}
                  <Link href={`/admin/jobs/${r.job.id}`} className="text-vm-cyan-dark hover:underline">
                    {r.job.reference || 'Open job'}
                  </Link>
                </p>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 font-body text-[11px] font-semibold ${
                  pending ? 'bg-vm-warning-bg text-vm-warning' : r.status === 'APPROVED' ? 'bg-vm-success-bg text-vm-success' : 'bg-vm-surface text-vm-muted'
                }`}
              >
                {pending ? 'Waiting for you' : r.status === 'APPROVED' ? 'Approved' : 'Declined'}
              </span>
            </div>
            <ul className="mt-2 space-y-1 font-body text-sm text-vm-text">
              <li>
                Clean date: <strong>{day(r.job.date)}</strong>
                {p.newDate ? (
                  <>
                    {' → '}
                    <strong className="text-vm-navy">{day(p.newDate)}</strong>
                  </>
                ) : null}
              </li>
              {p.newStartTime && <li>New time: {p.newStartTime}</li>}
              {p.newDuration && <li>New length: {p.newDuration} h</li>}
              {p.newAddress && <li>New address: {p.newAddress}</li>}
              {p.notes && <li>Note: “{p.notes}”</li>}
              {pending && r.job.hasCleaner && p.newDate && (
                <li className="text-vm-warning">A cleaner is assigned. Let them know the new date after approving.</li>
              )}
              {p.decision?.note && <li className="text-vm-muted">Your note: {p.decision.note}</li>}
            </ul>
            {pending && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  value={notes[r.id] ?? ''}
                  onChange={(e) => setNotes((n) => ({ ...n, [r.id]: e.target.value }))}
                  placeholder="Optional note to the client"
                  className="min-w-[200px] flex-1 rounded-lg border border-vm-border px-3 py-1.5 font-body text-sm"
                />
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => decide(r.id, 'approve')}
                  className="inline-flex items-center gap-1 rounded-lg bg-vm-navy px-3 py-1.5 font-heading text-xs font-semibold text-white disabled:opacity-50"
                >
                  {busy === r.id + 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Approve{p.newDate ? ' and move the clean' : ''}
                </button>
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => decide(r.id, 'decline')}
                  className="inline-flex items-center gap-1 rounded-lg border border-vm-border px-3 py-1.5 font-heading text-xs font-semibold text-vm-navy disabled:opacity-50"
                >
                  {busy === r.id + 'decline' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  Decline
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
