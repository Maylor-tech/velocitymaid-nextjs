'use client';

import { useState } from 'react';
import { Loader2, RotateCcw } from 'lucide-react';

/** Owner-only: shown on completed jobs. Undoes a completion made by mistake. */
export function VoidCompletionPanel({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/void-completion`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.success) throw new Error(data?.error || `Error ${res.status}`);
      setOpen(false);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not undo the completion');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-vm-border bg-white p-4">
      {!open ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-body text-sm text-vm-muted">
            Marked completed by mistake, for example a test run? The owner account can undo it.
          </p>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-vm-border px-3 py-1.5 font-heading text-xs font-semibold text-vm-navy hover:border-vm-cyan"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Completed by mistake
          </button>
        </div>
      ) : (
        <div>
          <p className="font-heading text-sm font-semibold text-vm-navy">Undo this completion</p>
          <p className="mt-1 font-body text-xs text-vm-muted">
            The job becomes cancelled, with your reason saved on it. Not possible once a cleaner
            payout exists or money has been received.
          </p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Why, e.g. test run from the admin account"
            className="mt-2 w-full rounded-lg border border-vm-border px-3 py-2 font-body text-sm"
          />
          {error && <p className="mt-1 font-body text-xs text-vm-danger">{error}</p>}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={saving || reason.trim().length < 5}
              className="inline-flex items-center gap-1.5 rounded-lg bg-vm-navy px-3 py-1.5 font-heading text-xs font-semibold text-white disabled:opacity-50"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Undo completion
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-1.5 font-heading text-xs font-semibold text-vm-muted"
            >
              Keep as completed
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
