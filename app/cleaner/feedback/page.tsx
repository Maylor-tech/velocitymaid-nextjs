'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type Item = {
  id: string;
  overallRating: number | null;
  cleanlinessRating: number | null;
  communicationRating: number | null;
  timelinessRating: number | null;
  comment: string | null;
  cleanerResponse: string | null;
  cleanerRespondedAt: string | null;
  releasedAt: string | null;
  Job: {
    jobReference: string | null;
    preferredDate: string | null;
    address: string | null;
    Property: { name: string } | null;
  };
};

export default function CleanerFeedbackPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    fetch('/api/cleaner/feedback', { credentials: 'include' })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.success) throw new Error(data.error || 'Failed');
        setItems(data.items);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const submitResponse = async (feedbackId: string) => {
    setBusy(true);
    setMessage('');
    try {
      const res = await fetch('/api/cleaner/feedback', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedbackId, response }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed');
      setMessage('Response saved (internal only — not sent to the customer).');
      setResponse('');
      setActiveId(null);
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/cleaner/jobs" className="text-sm text-blue-600 hover:underline">
          ← Back to jobs
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-vm-navy">
          Released service feedback
        </h1>
        <p className="mt-1 text-sm text-vm-muted">
          Admin-reviewed VelocityMaid service feedback for jobs you completed.
          Your optional note is internal only.
        </p>

        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
          </div>
        )}
        {error && <p className="mt-4 text-sm text-vm-danger">{error}</p>}
        {message && <p className="mt-4 text-sm text-vm-muted">{message}</p>}

        {!loading && items.length === 0 && (
          <p className="mt-8 rounded-lg border bg-white p-6 text-sm text-vm-muted">
            No released feedback yet.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-lg border bg-white p-5 shadow-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <p className="font-medium text-vm-navy">
                    {item.Job.Property?.name || item.Job.address || 'Job'}
                  </p>
                  <p className="text-xs text-vm-muted">
                    {item.Job.jobReference} ·{' '}
                    {item.releasedAt
                      ? new Date(item.releasedAt).toLocaleDateString()
                      : ''}
                  </p>
                </div>
                <p className="text-lg font-semibold text-vm-navy">
                  {item.overallRating != null ? `${item.overallRating}/5` : '—'}
                </p>
              </div>
              <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-vm-muted">
                <div>Cleanliness: {item.cleanlinessRating ?? '—'}</div>
                <div>Communication: {item.communicationRating ?? '—'}</div>
                <div>Timeliness: {item.timelinessRating ?? '—'}</div>
              </dl>
              {item.comment && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-vm-navy">
                  {item.comment}
                </p>
              )}
              {item.cleanerResponse ? (
                <p className="mt-3 rounded bg-vm-surface p-3 text-sm text-vm-muted">
                  Your response: {item.cleanerResponse}
                </p>
              ) : activeId === item.id ? (
                <div className="mt-3 space-y-2">
                  <textarea
                    rows={3}
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="w-full rounded border px-3 py-2 text-sm"
                    placeholder="Internal context for ops (optional once)"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={busy || !response.trim()}
                      onClick={() => void submitResponse(item.id)}
                      className="rounded bg-vm-navy px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Save response
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(null);
                        setResponse('');
                      }}
                      className="rounded border px-3 py-2 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="mt-3 text-sm text-blue-600 hover:underline"
                  onClick={() => setActiveId(item.id)}
                >
                  Add internal response
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
