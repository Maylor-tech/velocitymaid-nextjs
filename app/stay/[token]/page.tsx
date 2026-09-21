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
      recentCheckoutDates: string[];
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
  const [useOtherDate, setUseOtherDate] = useState(false);
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
        const dates: string[] = Array.isArray(data.recentCheckoutDates)
          ? data.recentCheckoutDates.filter(
              (d: unknown): d is string => typeof d === 'string'
            )
          : [];
        setView({
          kind: 'ready',
          displayName: data.displayName || 'this property',
          recentCheckoutDates: dates,
        });
        if (dates.length === 1) {
          setCheckoutDate(dates[0]!);
          setUseOtherDate(false);
        } else if (dates.length === 0) {
          setUseOtherDate(true);
        }
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
        serviceDate: data.serviceDate,
        feedbackToken: data.feedbackToken,
        tipGrantToken: data.tipGrantToken,
        tipUrl: data.tipUrl,
        tipGrantStatus,
      });
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
              How was your stay?
            </h1>
            <p className="mt-2 font-body text-sm text-vm-muted">
              For{' '}
              <span className="font-semibold text-vm-navy">{view.displayName}</span>.
              Choose the checkout date that matches your completed clean, then you
              can leave optional private feedback or a tip.
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              {view.recentCheckoutDates.length > 0 ? (
                <fieldset className="space-y-2">
                  <legend className="font-body text-sm font-semibold text-vm-navy">
                    Checkout / service date
                  </legend>
                  <div className="space-y-2">
                    {view.recentCheckoutDates.map((day) => (
                      <label
                        key={day}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 font-body text-sm ${
                          !useOtherDate && checkoutDate === day
                            ? 'border-vm-cyan bg-vm-cyan/10 text-vm-navy'
                            : 'border-vm-navy/15 text-vm-navy'
                        }`}
                      >
                        <input
                          type="radio"
                          name="checkoutDate"
                          className="accent-vm-navy"
                          checked={!useOtherDate && checkoutDate === day}
                          onChange={() => {
                            setUseOtherDate(false);
                            setCheckoutDate(day);
                          }}
                        />
                        <span>{formatStayDateLabel(day)}</span>
                      </label>
                    ))}
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 font-body text-sm ${
                        useOtherDate
                          ? 'border-vm-cyan bg-vm-cyan/10 text-vm-navy'
                          : 'border-vm-navy/15 text-vm-navy'
                      }`}
                    >
                      <input
                        type="radio"
                        name="checkoutDate"
                        className="accent-vm-navy"
                        checked={useOtherDate}
                        onChange={() => {
                          setUseOtherDate(true);
                          setCheckoutDate('');
                        }}
                      />
                      <span>Other date…</span>
                    </label>
                  </div>
                  {useOtherDate ? (
                    <input
                      type="date"
                      required
                      value={checkoutDate}
                      onChange={(e) => setCheckoutDate(e.target.value)}
                      className="mt-2 w-full rounded-lg border border-vm-navy/15 px-3 py-2 font-body text-sm text-vm-navy focus:outline-none focus:ring-2 focus:ring-vm-cyan"
                    />
                  ) : null}
                </fieldset>
              ) : (
                <label className="block font-body text-sm text-vm-navy">
                  Checkout / service date
                  <input
                    type="date"
                    required
                    value={checkoutDate}
                    onChange={(e) => setCheckoutDate(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-vm-navy/15 px-3 py-2 font-body text-sm text-vm-navy focus:outline-none focus:ring-2 focus:ring-vm-cyan"
                  />
                  <span className="mt-1 block font-body text-xs text-vm-muted">
                    No completed cleans are listed yet for this property. Enter the
                    date of your completed clean if you have it.
                  </span>
                </label>
              )}

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
                  'Continue to feedback & tip'
                )}
              </button>
            </form>
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
                Leave a tip
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export { TIP_GRANT_STORAGE_KEY };
