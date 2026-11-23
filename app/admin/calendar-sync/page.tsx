'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Pause, Play, RefreshCw, Trash2 } from 'lucide-react';

type AdminFeed = {
  id: string;
  propertyId: string;
  sourceLabel: string;
  label: string | null;
  maskedUrl: string;
  active: boolean;
  lastSyncedAt: string | null;
  lastStatus: string | null;
  lastError: string | null;
  upcomingStays: number;
  propertyName: string;
  propertyAddress: string;
  customerName: string;
};

type PropertyOption = { id: string; name: string; address: string; customerName: string };

const inputClass =
  'mt-1 w-full rounded-lg border border-vm-navy/15 px-3 py-2 font-body text-sm text-vm-navy focus:outline-none focus:ring-2 focus:ring-vm-cyan';

function when(iso: string | null): string {
  if (!iso) return 'never';
  return new Date(iso).toLocaleString('en-US', {
    timeZone: 'America/New_York',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function AdminCalendarSyncPage() {
  const [feeds, setFeeds] = useState<AdminFeed[]>([]);
  const [properties, setProperties] = useState<PropertyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const [propertyId, setPropertyId] = useState('');
  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/calendar-feeds');
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
      setFeeds(data.feeds);
      setProperties(data.properties);
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Failed to load' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const describe = (sync: { ok: boolean; created: number; linked: number; moved: number; removed: number; error?: string }) =>
    sync.ok
      ? `Synced: ${sync.created} new turnover request${sync.created === 1 ? '' : 's'}, ${sync.linked} linked to existing jobs, ${sync.moved} date change${sync.moved === 1 ? '' : 's'}, ${sync.removed} removed stay${sync.removed === 1 ? '' : 's'}.`
      : `Sync failed: ${sync.error || 'unknown error'}`;

  const connect = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('add');
    setMessage(null);
    try {
      const res = await fetch('/api/admin/calendar-feeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertyId, url, label }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Could not connect');
      setMessage({ tone: data.sync?.ok ? 'ok' : 'error', text: `Connected. ${describe(data.sync)}` });
      setUrl('');
      setLabel('');
      await load();
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Could not connect' });
    } finally {
      setBusy(null);
    }
  };

  const act = async (feedId: string, kind: 'sync' | 'pause' | 'resume' | 'delete') => {
    if (kind === 'delete' && !window.confirm('Disconnect this calendar? Jobs already created stay.')) return;
    setBusy(feedId);
    setMessage(null);
    try {
      const res =
        kind === 'sync'
          ? await fetch(`/api/admin/calendar-feeds/${feedId}/sync`, { method: 'POST' })
          : kind === 'delete'
            ? await fetch(`/api/admin/calendar-feeds/${feedId}`, { method: 'DELETE' })
            : await fetch(`/api/admin/calendar-feeds/${feedId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: kind === 'resume' }),
              });
      const data = await res.json();
      if (kind === 'sync' && data.sync) {
        setMessage({ tone: data.sync.ok ? 'ok' : 'error', text: describe(data.sync) });
      } else if (!res.ok || !data.success) {
        throw new Error(data.error || 'Action failed');
      }
      await load();
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Action failed' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <div>
        <Link href="/admin/customers" className="inline-flex items-center gap-1 font-body text-sm text-vm-muted">
          <ArrowLeft className="h-4 w-4" /> Customers &amp; Properties
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-vm-navy">Booking calendar sync</h1>
        <p className="mt-1 max-w-3xl font-body text-sm text-vm-muted">
          Each host&apos;s Airbnb / VRBO export link is checked daily (and when anyone presses
          Sync). New checkouts become turnover requests in Jobs with status Received for you to
          confirm. Date changes and removed stays raise a notification; nothing is cancelled
          automatically.
        </p>
      </div>

      <section className="rounded-xl border border-vm-navy/10 bg-vm-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-vm-navy">Connect a calendar for a host</h2>
        <form onSubmit={connect} className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="block font-body text-sm text-vm-muted md:col-span-2">
            Property
            <select className={inputClass} value={propertyId} onChange={(e) => setPropertyId(e.target.value)} required>
              <option value="">Choose a property…</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {p.customerName} · {p.address}
                </option>
              ))}
            </select>
          </label>
          <label className="block font-body text-sm text-vm-muted">
            Calendar export link (iCal)
            <input
              className={inputClass}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.vrbo.com/icalendar/…"
              autoComplete="off"
              required
            />
          </label>
          <label className="block font-body text-sm text-vm-muted">
            Label (optional)
            <input
              className={inputClass}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. VRBO main listing"
            />
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={busy !== null}
              className="inline-flex items-center gap-2 rounded-lg bg-vm-cyan px-4 py-2 font-heading text-sm font-semibold text-vm-navy disabled:opacity-60"
            >
              {busy === 'add' && <Loader2 className="h-4 w-4 animate-spin" />}
              Connect and sync
            </button>
          </div>
        </form>
      </section>

      {message && (
        <p
          role="status"
          className={`rounded-lg px-3 py-2 font-body text-sm ${
            message.tone === 'ok'
              ? 'border border-vm-success/30 bg-vm-success-bg text-vm-navy'
              : 'border border-vm-danger/20 bg-vm-danger-bg text-vm-danger'
          }`}
        >
          {message.text}
        </p>
      )}

      <section className="rounded-xl border border-vm-navy/10 bg-vm-white p-6 shadow-sm">
        <h2 className="font-heading text-lg font-semibold text-vm-navy">Connected calendars</h2>
        {loading ? (
          <Loader2 className="mt-4 h-5 w-5 animate-spin text-vm-cyan" />
        ) : feeds.length === 0 ? (
          <p className="mt-3 font-body text-sm text-vm-muted">No calendars connected yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {feeds.map((f) => (
              <li key={f.id} className="rounded-lg border border-vm-navy/10 px-4 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-heading text-sm font-semibold text-vm-navy">
                      {f.propertyName} · {f.label || f.sourceLabel}
                      {!f.active && <span className="ml-2 text-xs font-normal text-vm-muted">(paused)</span>}
                    </p>
                    <p className="font-body text-xs text-vm-muted">
                      {f.customerName} · {f.propertyAddress} · {f.maskedUrl}
                    </p>
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
                      disabled={busy !== null || !f.active}
                      onClick={() => void act(f.id, 'sync')}
                      className="inline-flex items-center gap-1 rounded-lg border border-vm-navy/15 px-3 py-2 font-heading text-xs font-semibold text-vm-navy disabled:opacity-60"
                    >
                      {busy === f.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Sync
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void act(f.id, f.active ? 'pause' : 'resume')}
                      aria-label={f.active ? 'Pause syncing' : 'Resume syncing'}
                      className="inline-flex items-center rounded-lg border border-vm-navy/15 px-3 py-2 text-vm-navy disabled:opacity-60"
                    >
                      {f.active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      disabled={busy !== null}
                      onClick={() => void act(f.id, 'delete')}
                      aria-label="Disconnect calendar"
                      className="inline-flex items-center rounded-lg border border-vm-danger/30 px-3 py-2 text-vm-danger disabled:opacity-60"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
