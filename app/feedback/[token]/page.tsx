'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/brand';
import { Loader2, Star } from 'lucide-react';

const TIP_GRANT_STORAGE_KEY = 'vm_guest_tip_grant';

function GuestTipCta() {
  const [tipHref, setTipHref] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(TIP_GRANT_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { tipUrl?: string; tipGrantToken?: string };
      if (parsed.tipUrl) {
        setTipHref(parsed.tipUrl);
      } else if (parsed.tipGrantToken) {
        setTipHref(`/tip?grant=${encodeURIComponent(parsed.tipGrantToken)}`);
      }
    } catch {
      /* ignore */
    }
  }, []);
  if (!tipHref) return null;
  return (
    <div className="mt-6">
      <p className="font-body text-sm text-vm-muted">
        Optional — tipping is independent of your feedback rating.
      </p>
      <Link
        href={tipHref}
        className="mt-3 inline-flex rounded-lg border border-vm-navy/15 px-4 py-2.5 font-heading text-sm font-semibold text-vm-navy"
      >
        Leave a tip
      </Link>
    </div>
  );
}

type ViewState =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'ready'; propertyLabel: string | null }
  | { kind: 'thanks'; already?: boolean };

const DIMENSIONS = [
  { key: 'overallRating', label: 'Overall Experience' },
  { key: 'cleanlinessRating', label: 'Cleanliness' },
  { key: 'communicationRating', label: 'Communication' },
  { key: 'timelinessRating', label: 'Timeliness' },
] as const;

type DimKey = (typeof DIMENSIONS)[number]['key'];

export default function PublicFeedbackPage({
  params,
}: {
  params: { token: string };
}) {
  const [view, setView] = useState<ViewState>({ kind: 'loading' });
  const [ratings, setRatings] = useState<Record<DimKey, number>>({
    overallRating: 0,
    cleanlinessRating: 0,
    communicationRating: 0,
    timelinessRating: 0,
  });
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/feedback/${params.token}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.success) {
          setView({ kind: 'invalid' });
          return;
        }
        if (data.state === 'already_submitted') {
          setView({ kind: 'thanks', already: true });
          return;
        }
        setView({
          kind: 'ready',
          propertyLabel: data.propertyLabel ?? null,
        });
      })
      .catch(() => setView({ kind: 'invalid' }));
  }, [params.token]);

  const allSet = DIMENSIONS.every((d) => ratings[d.key] >= 1);

  const submit = async () => {
    if (!allSet || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/feedback/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...ratings,
          comment: comment.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not submit feedback');
      }
      setView({ kind: 'thanks', already: Boolean(data.alreadySubmitted) });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-vm-surface">
      <header className="bg-vm-navy px-5 py-4">
        <BrandLogo theme="dark" size="header" showTagline={false} />
      </header>

      <main className="mx-auto max-w-lg px-4 py-10">
        {view.kind === 'loading' && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
          </div>
        )}

        {view.kind === 'invalid' && (
          <div className="rounded-2xl border border-vm-border bg-white p-8 text-center shadow-sm">
            <h1 className="font-heading text-xl font-bold text-vm-navy">
              Link unavailable
            </h1>
            <p className="mt-3 font-body text-sm text-vm-muted">
              This feedback link is invalid or no longer available. If you need
              help, contact VelocityMaid support.
            </p>
            <Link href="/" className="mt-6 inline-block text-sm text-vm-cyan-dark hover:underline">
              Back to VelocityMaid
            </Link>
          </div>
        )}

        {view.kind === 'thanks' && (
          <div className="rounded-2xl border border-vm-border bg-white p-8 text-center shadow-sm">
            <h1 className="font-heading text-2xl font-bold text-vm-navy">
              Thank you
            </h1>
            <p className="mt-3 font-body text-sm text-vm-muted">
              {view.already
                ? 'We already received your feedback for this visit.'
                : 'We received your feedback. It helps us keep every VelocityMaid experience guest-ready.'}
            </p>
            <GuestTipCta />
            <Link href="/" className="mt-6 inline-block text-sm text-vm-cyan-dark hover:underline">
              Back to VelocityMaid
            </Link>
          </div>
        )}

        {view.kind === 'ready' && (
          <div className="rounded-2xl border border-vm-border bg-white p-6 shadow-sm sm:p-8">
            <p className="font-heading text-xs font-bold uppercase tracking-wider text-vm-cyan">
              Private feedback
            </p>
            <h1 className="mt-2 font-heading text-2xl font-bold text-vm-navy">
              How was your VelocityMaid experience?
            </h1>
            <p className="mt-2 font-body text-sm text-vm-muted">
              Rate the overall service — not just one person. Your answers stay
              private with VelocityMaid.
            </p>
            {view.propertyLabel && (
              <p className="mt-3 font-body text-sm text-vm-navy">
                <span className="text-vm-muted">Property: </span>
                {view.propertyLabel}
              </p>
            )}

            <div className="mt-8 space-y-6">
              {DIMENSIONS.map((dim) => (
                <div key={dim.key}>
                  <p className="mb-2 font-heading text-sm font-semibold text-vm-navy">
                    {dim.label}
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => {
                      const active = ratings[dim.key] >= n;
                      return (
                        <button
                          key={n}
                          type="button"
                          aria-label={`${dim.label} ${n} stars`}
                          onClick={() =>
                            setRatings((prev) => ({ ...prev, [dim.key]: n }))
                          }
                          className="rounded-lg p-1.5 transition hover:bg-vm-surface"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              active
                                ? 'fill-vm-cyan text-vm-cyan'
                                : 'text-vm-border'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div>
                <label className="mb-2 block font-heading text-sm font-semibold text-vm-navy">
                  Anything you&apos;d like us to know?{' '}
                  <span className="font-normal text-vm-muted">(optional)</span>
                </label>
                <textarea
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy focus:border-vm-cyan focus:outline-none focus:ring-1 focus:ring-vm-cyan"
                  placeholder="Access notes, timing, supplies, or anything else…"
                  maxLength={4000}
                />
              </div>
            </div>

            {error && (
              <p className="mt-4 font-body text-sm text-vm-danger">{error}</p>
            )}

            <button
              type="button"
              disabled={!allSet || submitting}
              onClick={() => void submit()}
              className="mt-6 w-full rounded-full bg-vm-navy py-3 font-heading text-sm font-bold text-white hover:bg-vm-navy/90 disabled:opacity-50"
            >
              {submitting ? 'Submitting…' : 'Submit feedback'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
