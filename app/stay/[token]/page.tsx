'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Loader2 } from 'lucide-react';

type PageState =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | { kind: 'ready'; displayName: string }
  | { kind: 'resolving' };

export default function GuestStayPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [view, setView] = useState<PageState>({ kind: 'loading' });
  const [checkoutDate, setCheckoutDate] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setView({ kind: 'invalid' });
      return;
    }
    fetch(`/api/stay/${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok || !data.success) {
          setView({ kind: 'invalid' });
          return;
        }
        setView({
          kind: 'ready',
          displayName: data.displayName || 'this property',
        });
      })
      .catch(() => setView({ kind: 'invalid' }));
  }, [token]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!checkoutDate || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/stay/${encodeURIComponent(token)}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkoutDate }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not match this stay');
      }
      if (data.feedbackToken) {
        router.push(`/feedback/${data.feedbackToken}`);
        return;
      }
      throw new Error('Could not open feedback form');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not match this stay');
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
              Stay link unavailable
            </h1>
            <p className="mt-2 font-body text-sm text-vm-muted">
              This link is invalid or no longer active. Please ask your host for an
              updated card, or contact VelocityMaid.
            </p>
          </div>
        )}

        {view.kind === 'ready' && (
          <div className="rounded-2xl border border-vm-border bg-white p-8 shadow-sm">
            <h1 className="font-heading text-2xl font-bold text-vm-navy">
              How was your clean?
            </h1>
            <p className="mt-2 font-body text-sm text-vm-muted">
              Private feedback for{' '}
              <span className="font-semibold text-vm-navy">{view.displayName}</span>.
              Enter your checkout date so we can match your stay.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <label className="block font-body text-sm text-vm-navy">
                Checkout / service date
                <input
                  type="date"
                  required
                  value={checkoutDate}
                  onChange={(e) => setCheckoutDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-vm-navy/15 px-3 py-2 font-body text-sm text-vm-navy focus:outline-none focus:ring-2 focus:ring-vm-cyan"
                />
              </label>

              {error && (
                <p className="rounded-lg border border-vm-danger/20 bg-vm-danger-bg px-3 py-2 text-sm text-vm-danger">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !checkoutDate}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-vm-cyan px-4 py-2.5 font-heading text-sm font-semibold text-vm-navy disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Matching stay…
                  </>
                ) : (
                  'Continue to feedback'
                )}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
