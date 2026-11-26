'use client';

import { useEffect, useState } from 'react';
import { Copy, Loader2 } from 'lucide-react';

type Candidate = { id: string; reference: string | null; date: string | null; status: string };

const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' }) : 'no date';

/** Shown on open jobs. Lists other cleans at the same property within a week; "this one is a duplicate". */
export function MergeDuplicatePanel({ jobId, onDone }: { jobId: string; onDone: () => void }) {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [keep, setKeep] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/jobs/${jobId}/merge-duplicate`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setCandidates(d?.success ? d.candidates : []))
      .catch(() => setCandidates([]));
  }, [jobId]);

  if (!candidates || candidates.length === 0) return null;

  const merge = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/merge-duplicate`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keepJobId: keep }),
      });
      const data = await res.json().catch(() => null);
      if (!data?.success) throw new Error(data?.error || `Error ${res.status}`);
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not merge');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-vm-border bg-white p-4">
      <p className="flex items-center gap-2 font-heading text-sm font-semibold text-vm-navy">
        <Copy className="h-4 w-4 text-vm-cyan-dark" /> Same property within a week
      </p>
      <p className="mt-1 font-body text-xs text-vm-muted">
        If this clean is a duplicate of one below, pick the one to keep. This clean is cancelled (cleaner told,
        calendar updated) and any Airbnb/Vrbo link moves to the one you keep.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={keep}
          onChange={(e) => setKeep(e.target.value)}
          className="rounded-lg border border-vm-border px-3 py-1.5 font-body text-sm"
        >
          <option value="">Keep which clean?</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {(c.reference || 'Job') + ' · ' + day(c.date) + ' · ' + c.status.toLowerCase()}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!keep || saving}
          onClick={merge}
          className="inline-flex items-center gap-1.5 rounded-lg bg-vm-navy px-3 py-1.5 font-heading text-xs font-semibold text-white disabled:opacity-50"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />} This one is a duplicate
        </button>
      </div>
      {error && <p className="mt-2 font-body text-xs text-vm-danger">{error}</p>}
    </div>
  );
}
