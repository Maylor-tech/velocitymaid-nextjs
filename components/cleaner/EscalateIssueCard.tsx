"use client";

import { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

const ISSUE_TYPES = [
  { value: 'CLEANER_ISSUE', label: 'On-site issue' },
  { value: 'JOB_DISPUTE', label: 'Job dispute' },
  { value: 'CUSTOMER_COMPLAINT', label: 'Customer concern' },
  { value: 'TECHNICAL_ISSUE', label: 'Access / technical' },
];

export function EscalateIssueCard({ jobId }: { jobId: string }) {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState('CLEANER_ISSUE');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    if (!reason.trim()) {
      setMessage('Describe the issue.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/cleaner/jobs/${jobId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueType, reason: reason.trim(), notes: notes.trim() }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to flag issue');
      }
      setMessage('Issue flagged. Ops will review.');
      setReason('');
      setNotes('');
      setOpen(false);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Failed to flag issue');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 font-semibold text-amber-800"
      >
        <AlertTriangle className="h-5 w-5" />
        Flag an issue
      </button>
      {open && (
        <div className="mt-4 space-y-3">
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          >
            {ISSUE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="What happened?"
            className="w-full border rounded-lg px-3 py-2 min-h-[80px]"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional notes"
            className="w-full border rounded-lg px-3 py-2 min-h-[60px]"
          />
          <button
            type="button"
            onClick={() => void submit()}
            disabled={busy}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-700 text-white rounded-lg disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Send to ops
          </button>
        </div>
      )}
      {message && <p className="mt-2 text-sm text-vm-text">{message}</p>}
    </div>
  );
}
