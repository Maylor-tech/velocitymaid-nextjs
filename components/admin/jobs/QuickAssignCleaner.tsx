'use client';

import { useEffect, useMemo, useState } from 'react';

type Cleaner = {
  id: string;
  name: string | null;
  email?: string | null;
  availability?: 'AVAILABLE' | 'BUSY' | 'CONFLICT';
  todayAvailability?: 'AVAILABLE' | 'BUSY' | 'CONFLICT';
};

function pickBestCleaner(cleaners: Cleaner[]): Cleaner | undefined {
  const avail = (c: Cleaner) => c.todayAvailability ?? c.availability;
  return cleaners
    .filter((c) => avail(c) === 'AVAILABLE')
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))[0];
}

export default function QuickAssignCleaner({
  jobId,
  cleaners: cleanersFromParent,
  onAssigned,
}: {
  jobId: string;
  cleaners: Cleaner[];
  onAssigned: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalCleaners, setModalCleaners] = useState<Cleaner[] | null>(null);
  const [loadingCleaners, setLoadingCleaners] = useState(false);

  const cleaners = modalCleaners ?? cleanersFromParent;

  const sortedCleaners = useMemo(() => {
    return [...cleaners].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [cleaners]);

  const displayAvailability = (c: Cleaner): 'AVAILABLE' | 'BUSY' | 'CONFLICT' | undefined =>
    c.todayAvailability ?? c.availability;

  useEffect(() => {
    if (!open) {
      setModalCleaners(null);
      return;
    }
    setLoadingCleaners(true);
    fetch(`/api/admin/cleaners?jobId=${encodeURIComponent(jobId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setModalCleaners(data?.cleaners ?? []);
      })
      .catch(() => setModalCleaners([]))
      .finally(() => setLoadingCleaners(false));
  }, [open, jobId]);

  useEffect(() => {
    if (!open) return;
    const suggested = pickBestCleaner(cleaners);
    if (suggested) {
      setSelectedCleanerId(suggested.id);
    } else {
      setSelectedCleanerId('');
    }
  }, [open, cleaners]);

  async function assign() {
    if (!selectedCleanerId) {
      setError('Please choose a cleaner.');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/jobs/manual-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, cleanerId: selectedCleanerId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('Assign failed:', data);
        setError(data?.error || 'Could not assign cleaner. Please try again.');
        return;
      }

      setOpen(false);
      setSelectedCleanerId('');
      onAssigned();
    } catch (e) {
      console.error('Assign error:', e);
      setError('Network issue. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
      >
        Assign Cleaner
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">Assign Cleaner</h3>
              <button
                onClick={() => setOpen(false)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <p className="mt-2 text-xs text-gray-600">
              Choose a verified cleaner to assign this job.
            </p>

            {loadingCleaners ? (
              <p className="mt-3 text-sm text-gray-500">Loading cleaners…</p>
            ) : (
              <>
                <select
                  value={selectedCleanerId}
                  onChange={(e) => setSelectedCleanerId(e.target.value)}
                  className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Select a cleaner…</option>
                  {sortedCleaners.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.email || c.id}
                      {displayAvailability(c) === 'AVAILABLE' && ' 🟢'}
                      {displayAvailability(c) === 'BUSY' && ' 🟡'}
                      {displayAvailability(c) === 'CONFLICT' && ' 🔴 Time conflict'}
                      {displayAvailability(c) === 'AVAILABLE' &&
                        c.id === selectedCleanerId &&
                        ' (Suggested)'}
                    </option>
                  ))}
                </select>

                <p className="mt-2 text-xs text-gray-500">
                  🟢 Available &nbsp; 🟡 Already booked today &nbsp; 🔴 Time conflict
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Suggested based on availability. You can change this anytime.
                </p>

                {(() => {
                  const selected = cleaners.find((c) => c.id === selectedCleanerId);
                  return selected && displayAvailability(selected) === 'CONFLICT' ? (
                  <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                    This cleaner already has a job scheduled at this time. You may still assign if needed.
                  </div>
                  ) : null;
                })()}
              </>
            )}

            {error && (
              <div className="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-900">
                {error}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={assign}
                className="rounded-md bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? 'Assigning…' : 'Confirm Assign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
