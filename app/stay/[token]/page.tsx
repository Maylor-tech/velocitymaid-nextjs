'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { Loader2 } from 'lucide-react';

const TIP_GRANT_STORAGE_KEY = 'vm_guest_tip_grant';

type PageState =
  | { kind: 'loading' }
  | { kind: 'invalid' }
  | {
      kind: 'ready';
      displayName: string;
      fallbackEligible: boolean;
    }
  | {
      kind: 'actions';
      displayName: string;
      serviceDate: string;
      feedbackToken: string;
      tipGrantToken: string;
      tipUrl: string;
      tipGrantStatus: 'MINTED' | 'REISSUED';
    };

function formatStayDateLabel(isoDay: string): string {
  const [y, m, d] = isoDay.split('-').map(Number);
  if (!y || !m || !d) return isoDay;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function GuestStayPage() {
  const params = useParams();
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
          fallbackEligible: data.fallbackEligible === true,
        });
      })
      .catch(() => setView({ kind: 'invalid' }));
  }, [token]);

  const applyResolveSuccess = (data: {
    feedbackToken: string;
    tipGrantToken: string;
    tipUrl: string;
    tipGrantStatus?: string;
    propertyLabel?: string;
    serviceDate?: string;
  }) => {
    if (!data.feedbackToken) {
      throw new Error('Could not open guest actions for this stay');
    }
    if (!data.tipGrantToken || !data.tipUrl) {
      throw new Error(
        'We matched your stay but could not open tipping. Please try again.'
      );
    }

    const tipGrantStatus =
      data.tipGrantStatus === 'REISSUED' ? 'REISSUED' : 'MINTED';

    try {
      sessionStorage.setItem(
        TIP_GRANT_STORAGE_KEY,
        JSON.stringify({
          tipGrantToken: data.tipGrantToken,
          tipUrl: data.tipUrl,
          propertyLabel: data.propertyLabel,
          serviceDate: data.serviceDate,
        })
      );
    } catch {
      /* ignore storage failures */
    }

    setView({
      kind: 'actions',
      displayName: data.propertyLabel || 'this property',
      serviceDate: data.serviceDate || '',
      feedbackToken: data.feedbackToken,
      tipGrantToken: data.tipGrantToken,
      tipUrl: data.tipUrl,
      tipGrantStatus,
    });
  };

  const onSubmitDate = async (e: FormEvent) => {
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
      applyResolveSuccess(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not match this stay');
    } finally {
      setSubmitting(false);
    }
  };

  const onFallbackContinue = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/stay/${encodeURIComponent(token)}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'SINGLE_RECENT_ELIGIBLE' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Could not identify your stay');
      }
      applyResolveSuccess(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not identify your stay'
      );
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
              How was your stay?
            </h1>
            <p className="mt-2 font-body text-sm text-vm-muted">
              For{' '}
              <span className="font-semibold text-vm-navy">{view.displayName}</span>.
              No login required. Feedback is private; tipping is optional.
            </p>

            <form onSubmit={onSubmitDate} className="mt-6 space-y-4">
              <div>
                <h2 className="font-heading text-sm font-semibold text-vm-navy">
                  Find your stay
                </h2>
                <p className="mt-1 font-body text-xs text-vm-muted">
                  Enter your checkout date so we can connect your feedback to the
                  correct cleaning.
                </p>
                <label className="mt-3 block font-body text-sm text-vm-navy">
                  Checkout date
                  <input
                    type="date"
                    required
                    value={checkoutDate}
                    onChange={(e) => setCheckoutDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-vm-navy/15 px-3 py-2 font-body text-sm text-vm-navy focus:outline-none focus:ring-2 focus:ring-vm-cyan"
                  />
                </label>
              </div>

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
                  'Continue'
                )}
              </button>
            </form>

            {view.fallbackEligible ? (
              <div className="mt-6 border-t border-vm-border pt-5">
                <p className="font-body text-sm font-semibold text-vm-navy">
                  Not sure of your checkout date?
                </p>
                <p className="mt-1 font-body text-xs text-vm-muted">
                  We found the most recent eligible stay for this property.
                </p>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void onFallbackContinue()}
                  className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-vm-navy/20 px-4 py-2.5 font-heading text-sm font-semibold text-vm-navy hover:bg-vm-surface disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Continuing…
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            ) : (
              <p className="mt-5 font-body text-xs text-vm-muted">
                Not sure of your date? Contact VelocityMaid and we’ll help you
                identify your stay — without sharing booking details on this page.
              </p>
            )}
          </div>
        )}

        {view.kind === 'actions' && (
          <div className="rounded-2xl border border-vm-border bg-white p-8 shadow-sm">
            <h1 className="font-heading text-2xl font-bold text-vm-navy">
              Thanks for staying
            </h1>
            <p className="mt-2 font-body text-sm text-vm-muted">
              Matched clean for{' '}
              <span className="font-semibold text-vm-navy">{view.displayName}</span>
              {view.serviceDate ? ` on ${formatStayDateLabel(view.serviceDate)}` : ''}
              . Feedback and tipping are optional and independent — you can tip
              without leaving feedback.
            </p>
            <div className="mt-6 space-y-3">
              <Link
                href={`/feedback/${view.feedbackToken}`}
                className="flex w-full items-center justify-center rounded-lg border border-vm-navy/15 px-4 py-3 font-heading text-sm font-semibold text-vm-navy"
              >
                Leave private feedback
              </Link>
              <Link
                href={view.tipUrl}
                className="flex w-full items-center justify-center rounded-lg bg-vm-cyan px-4 py-3 font-heading text-sm font-semibold text-vm-navy"
              >
                Leave a tip (optional)
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export { TIP_GRANT_STORAGE_KEY };
