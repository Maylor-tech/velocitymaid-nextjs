'use client';

import { FormEvent, useEffect, useState } from 'react';
import { CalendarClock, Loader2, RefreshCw, Trash2 } from 'lucide-react';

type FeedView = {
  id: string;
  sourceLabel: string;
  label: string | null;
  maskedUrl: string;
  active: boolean;
  lastSyncedAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  upcomingStays: number;
};

const inputClass =
  'mt-1 w-full rounded-lg border border-vm-navy/15 px-3 py-2 font-body text-sm text-vm-navy focus:outline-none focus:ring-2 focus:ring-vm-cyan';

function when(iso: string | null): string {
  if (!iso) return 'not yet';
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Host portal: connect an Airbnb / VRBO calendar so each checkout becomes a
 * turnover request automatically. The link itself is never shown back in full.
 */
export default function CalendarSyncCard({
  propertyId,
  onSynced,
}: {
  propertyId: string;
  onSynced?: () => void;
}) {
  const [feeds, setFeeds] = useState<FeedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const base = `/api/customer/properties/${propertyId}/calendar-feeds`;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(base);
        const data = await res.json();
        if (!cancelled && res.ok && data.success) setFeeds(data.feeds);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [base]);

  const connect = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('add');
    setMessage(null);
    try {
      const res = await fetch(base, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not connect the calendar');
      setFeeds((f) => [...f, data.feed]);
      setUrl('');
      const first = data.firstSync;
      setMessage(
        first?.ok
          ? {
              tone: 'ok',
              text:
                first.created > 0
                  ? `Connected. We found ${first.created} upcoming checkout${first.created === 1 ? '' : 's'} and added them to your cleans for us to confirm.`
                  : 'Connected. No upcoming checkouts yet; new bookings will appear here automatically.',
            }
          : { tone: 'error', text: `Connected, but the first check failed: ${first?.error || 'unknown error'}` }
      );
      onSynced?.();
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Could not connect the calendar' });
    } finally {
      setBusy(null);
    }
  };

  const syncNow = async (feedId: string) => {
    setBusy(feedId);
    setMessage(null);
    try {
      const res = await fetch(`${base}/${feedId}/sync`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Sync failed');
      if (data.feed) setFeeds((f) => f.map((x) => (x.id === feedId ? data.feed : x)));
      if (data.sync && !data.sync.ok) {
        setMessage({ tone: 'error', text: data.sync.error || 'Sync failed' });
      } else {
        setMessage({
          tone: 'ok',
          text: data.sync
            ? data.sync.created > 0
              ? `${data.sync.created} new checkout${data.sync.created === 1 ? '' : 's'} added.`
              : 'Up to date.'
            : 'Checked in the last two minutes: already up to date.',
        });
      }
      onSynced?.();
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Sync failed' });
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async (feedId: string) => {
    if (!window.confirm('Stop syncing this calendar? Cleans already on your list stay as they are.')) return;
    setBusy(feedId);
    try {
      const res = await fetch(`${base}/${feedId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not disconnect');
      setFeeds((f) => f.filter((x) => x.id !== feedId));
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Could not disconnect' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-xl border border-vm-navy/10 bg-vm-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <CalendarClock className="mt-0.5 h-5 w-5 text-vm-cyan-dark" aria-hidden="true" />
        <div>
          <h2 className="font-heading text-lg font-semibold text-vm-navy">Booking calendar sync</h2>
          <p className="mt-1 font-body text-sm text-vm-muted">
            Connect your Airbnb or VRBO calendar and every checkout is added to your cleans
            automatically. We confirm each one before it is scheduled. We only see booked
            dates, never guest names or payments.
          </p>
        </div>
      </div>

      {loading ? (
        <Loader2 className="mt-4 h-5 w-5 animate-spin text-vm-cyan" />
      ) : feeds.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {feeds.map((f) => (
            <li key={f.id} className="rounded-lg border border-vm-navy/10 px-3 py-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-heading text-sm font-semibold text-vm-navy">
                    {f.label || f.sourceLabel}
                    {!f.active && <span className="ml-2 text-xs text-vm-muted">(paused)</span>}
                  </p>
                  <p className="font-body text-xs text-vm-muted">{f.maskedUrl}</p>
                  <p className="mt-1 font-body text-xs text-vm-muted">
                    Last checked {when(f.lastSyncedAt)} · {f.upcomingStays} upcoming stay
                    {f.upcomingStays === 1 ? '' : 's'}
                  </p>
                  {f.lastStatus === 'ERROR' && f.lastError && (
                    <p className="mt-1 font-body text-xs text-vm-danger">{f.lastError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void syncNow(f.id)}
                    className="inline-flex items-center gap-1 rounded-lg border border-vm-navy/15 px-3 py-2 font-heading text-xs font-semibold text-vm-navy disabled:opacity-60"
                  >
                    {busy === f.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                    Sync now
                  </button>
                  <button
                    type="button"
                    disabled={busy !== null}
                    onClick={() => void disconnect(f.id)}
                    aria-label={`Disconnect ${f.label || f.sourceLabel}`}
                    className="inline-flex items-center rounded-lg border border-vm-danger/30 px-3 py-2 text-vm-danger disabled:opacity-60"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <form onSubmit={connect} className="mt-4">
        <label className="block font-body text-sm text-vm-muted">
          {feeds.length ? 'Add another calendar link' : 'Calendar export link (iCal)'}
          <input
            className={inputClass}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.airbnb.com/calendar/ical/…"
            inputMode="url"
            autoComplete="off"
            required
          />
        </label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={busy !== null || !url.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-vm-cyan px-4 py-2 font-heading text-sm font-semibold text-vm-navy disabled:opacity-60"
          >
            {busy === 'add' && <Loader2 className="h-4 w-4 animate-spin" />}
            Connect calendar
          </button>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="font-body text-sm font-semibold text-vm-cyan-dark"
            aria-expanded={showHelp}
          >
            Where do I find this link?
          </button>
        </div>
      </form>

      {showHelp && (
        <div className="mt-3 space-y-2 rounded-lg bg-vm-canvas px-4 py-3 font-body text-sm text-vm-navy">
          <p>
            <b>Airbnb:</b> Calendar → choose the listing → Availability → Connect calendars
            (or &ldquo;Sync calendars&rdquo;) → Export calendar → copy the link.
          </p>
          <p>
            <b>VRBO:</b> Calendar → Import/Export (or &ldquo;Sync calendars&rdquo;) → Export calendar →
            copy the link.
          </p>
          <p className="text-vm-muted">
            Menu names change from time to time. Look for &ldquo;export&rdquo; and a link ending in .ics.
            Keep this link private: anyone with it can see your booked dates.
          </p>
        </div>
      )}

      {message && (
        <p
          role="status"
          className={`mt-3 rounded-lg px-3 py-2 font-body text-sm ${
            message.tone === 'ok'
              ? 'border border-vm-success/30 bg-vm-success-bg text-vm-navy'
              : 'border border-vm-danger/20 bg-vm-danger-bg text-vm-danger'
          }`}
        >
          {message.text}
        </p>
      )}
    </section>
  );
}
