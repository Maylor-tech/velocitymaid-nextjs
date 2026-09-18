'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';

type Item = {
  id: string;
  status: string;
  overallRating: number | null;
  submittedAt: string | null;
  requestedAt: string;
  lowRating: boolean;
  underReview: boolean;
  customer: { name: string; email: string } | null;
  cleaner: { name: string | null; email: string } | null;
  property: { name: string; address: string } | null;
  job: { jobReference: string | null; preferredDate: string | null };
};

export default function AdminFeedbackListPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'low' | 'UNDER_REVIEW'>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const qs =
      filter === 'low'
        ? '?lowOnly=1'
        : filter === 'UNDER_REVIEW'
          ? '?status=UNDER_REVIEW'
          : '';
    fetch(`/api/admin/feedback${qs}`, { credentials: 'include' })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.success) throw new Error(data.error || 'Failed');
        setItems(data.items);
        setError(null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-vm-navy">
            Feedback &amp; Quality
          </h1>
          <p className="mt-1 font-body text-sm text-vm-muted">
            Private service feedback — separate from Google reviews.
          </p>
        </div>
        <div className="flex gap-2">
          {(
            [
              ['all', 'Recent'],
              ['low', 'Low ratings'],
              ['UNDER_REVIEW', 'Under review'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={`rounded-full px-3 py-1.5 font-body text-xs font-semibold ${
                filter === key
                  ? 'bg-vm-navy text-white'
                  : 'border border-vm-border text-vm-muted hover:bg-vm-surface'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
        </div>
      )}
      {error && <p className="text-sm text-vm-danger">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="rounded-xl border border-vm-border bg-white p-8 text-center font-body text-sm text-vm-muted">
          No feedback records yet.
        </p>
      )}

      {!loading && items.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-vm-border bg-white">
          <table className="w-full text-left font-body text-sm">
            <thead className="bg-vm-surface text-xs uppercase tracking-wide text-vm-muted">
              <tr>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Cleaner</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-t border-vm-border hover:bg-vm-surface/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/feedback/${item.id}`}
                      className="font-medium text-vm-cyan-dark hover:underline"
                    >
                      {item.submittedAt
                        ? new Date(item.submittedAt).toLocaleDateString()
                        : 'Requested'}
                    </Link>
                    <div className="text-xs text-vm-muted">
                      {item.job.jobReference || item.job.preferredDate?.slice(0, 10)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.overallRating != null ? (
                      <span
                        className={
                          item.lowRating
                            ? 'font-semibold text-vm-danger'
                            : 'text-vm-navy'
                        }
                      >
                        {item.overallRating}/5
                        {item.lowRating ? ' · low' : ''}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">{item.customer?.name || '—'}</td>
                  <td className="px-4 py-3">
                    {item.property?.name || item.property?.address || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {item.cleaner?.name || item.cleaner?.email || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        item.underReview
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-vm-surface text-vm-muted'
                      }`}
                    >
                      {item.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
