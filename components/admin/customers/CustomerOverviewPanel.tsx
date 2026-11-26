'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CalendarClock, Home, Loader2 } from 'lucide-react';
import type { CustomerOverview, OverviewJob } from '@/lib/admin/customerOverview';

type Tab = 'upcoming' | 'past' | 'cancelled';

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

function shortDate(iso: string | null): string {
  if (!iso) return 'No date';
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function ago(iso: string | null): string {
  if (!iso) return 'never';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} h ago`;
  return `${Math.round(hrs / 24)} days ago`;
}

const STATUS_LABEL: Record<string, string> = {
  RECEIVED: 'Requested',
  CONFIRMED: 'Confirmed',
  ASSIGNED: 'Cleaner assigned',
  ON_THE_WAY: 'On the way',
  IN_PROGRESS: 'In progress',
  AWAITING_QC: 'Awaiting check',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  CANCELLED_EMERGENCY: 'Cancelled',
};

const PAY_LABEL: Record<string, string> = {
  PENDING: 'Not paid',
  DEPOSIT_PAID: 'Deposit paid',
  BALANCE_DUE: 'Balance due',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
  FAILED: 'Payment failed',
};

export function CustomerOverviewPanel({ customerId }: { customerId: string }) {
  const [data, setData] = useState<CustomerOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('upcoming');

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/admin/customers/${customerId}/overview`, { credentials: 'include' })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (cancelled) return;
        if (d?.success) setData(d.overview);
        else setError(d?.error || `Could not load jobs (error ${r.status}).`);
      })
      .catch(() => !cancelled && setError('Could not reach the server.'));
    return () => {
      cancelled = true;
    };
  }, [customerId]);

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-vm-danger/30 bg-vm-white p-4 font-body text-sm text-vm-danger">
        <AlertCircle className="h-4 w-4" /> {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex justify-center rounded-xl border border-vm-border bg-vm-white py-10">
        <Loader2 className="h-6 w-6 animate-spin text-vm-cyan" />
      </div>
    );
  }

  const list = data.jobs[tab];
  const flagged = data.jobs.upcoming.filter((j) => j.flags.length > 0).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Upcoming cleans" value={String(data.stats.upcoming)} />
        <Stat label="Completed this year" value={String(data.stats.completedThisYear)} />
        <Stat label="Billed this year" value={money(data.stats.billedThisYear)} />
        <Stat label="Unpaid" value={money(data.stats.unpaid)} warn={data.stats.unpaid > 0} />
      </div>

      <section className="rounded-xl border border-vm-border bg-vm-white">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-vm-border px-4 py-3">
          <h2 className="font-heading text-base font-bold text-vm-navy">Jobs</h2>
          <div className="inline-flex rounded-lg border border-vm-border p-1">
            {(['upcoming', 'past', 'cancelled'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-md px-3 py-1 font-heading text-xs font-semibold capitalize ${
                  tab === t ? 'bg-vm-navy text-vm-white' : 'text-vm-muted hover:text-vm-navy'
                }`}
              >
                {t} ({data.jobs[t].length})
              </button>
            ))}
          </div>
        </div>
        {tab === 'upcoming' && flagged > 0 && (
          <p className="border-b border-vm-border bg-vm-warning-bg/50 px-4 py-2 font-body text-xs text-vm-warning">
            {flagged} upcoming {flagged === 1 ? 'clean needs' : 'cleans need'} attention (see the flags below).
          </p>
        )}
        {list.length === 0 ? (
          <p className="px-4 py-8 text-center font-body text-sm text-vm-muted">No {tab} jobs.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] font-body text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-vm-muted">
                <tr className="border-b border-vm-border">
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Job</th>
                  <th className="px-4 py-2">Property</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Cleaner</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2">Payment</th>
                </tr>
              </thead>
              <tbody>
                {list.map((j) => (
                  <JobRow key={j.id} job={j} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-vm-border bg-vm-white p-4">
        <h2 className="font-heading text-base font-bold text-vm-navy">Properties</h2>
        {data.properties.length === 0 ? (
          <p className="mt-2 font-body text-sm text-vm-muted">No properties on file.</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {data.properties.map((p) => (
              <li key={p.id} className="rounded-lg border border-vm-border p-3">
                <div className="flex items-start gap-2">
                  <Home className="mt-0.5 h-4 w-4 text-vm-cyan-dark" />
                  <div className="min-w-0">
                    <Link
                      href={`/admin/properties/${p.id}/service-agreement`}
                      className="font-heading text-sm font-semibold text-vm-navy hover:underline"
                    >
                      {p.name || p.address}
                    </Link>
                    <p className="font-body text-xs text-vm-muted">
                      {p.address}
                      {p.bedrooms ? ` · ${p.bedrooms} bed` : ''}
                      {p.bathrooms ? ` / ${p.bathrooms} bath` : ''}
                    </p>
                    <p className="mt-1 font-body text-xs text-vm-text">
                      {p.upcomingCleans} upcoming {p.upcomingCleans === 1 ? 'clean' : 'cleans'}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 font-body text-xs">
                  <CalendarClock className="h-4 w-4 text-vm-muted" />
                  {p.feeds.length === 0 ? (
                    <span className="text-vm-muted">No booking calendar connected</span>
                  ) : (
                    p.feeds.map((f, i) => (
                      <span
                        key={i}
                        className={`rounded-full px-2 py-0.5 ${
                          f.active && f.lastStatus !== 'ERROR'
                            ? 'bg-vm-success-bg text-vm-success'
                            : 'bg-vm-warning-bg text-vm-warning'
                        }`}
                      >
                        {f.source === 'VRBO' ? 'Vrbo' : f.source === 'AIRBNB' ? 'Airbnb' : f.source}
                        {f.active ? ` · synced ${ago(f.lastSyncedAt)}` : ' · paused'}
                        {f.lastStatus === 'ERROR' ? ' · error' : ''}
                      </span>
                    ))
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-xl border border-vm-border bg-vm-white p-4">
        <h2 className="font-heading text-base font-bold text-vm-navy">Invoices</h2>
        {data.invoices.length === 0 ? (
          <p className="mt-2 font-body text-sm text-vm-muted">No invoices yet.</p>
        ) : (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[560px] font-body text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-vm-muted">
                <tr className="border-b border-vm-border">
                  <th className="py-2 pr-4">Invoice</th>
                  <th className="py-2 pr-4">Clean date</th>
                  <th className="py-2 pr-4 text-right">Total</th>
                  <th className="py-2 pr-4 text-right">Still owed</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.invoices.map((i) => (
                  <tr key={i.id} className="border-b border-vm-border/60 last:border-0">
                    <td className="py-2 pr-4">
                      <Link href={`/admin/invoices/${i.id}`} className="font-medium text-vm-navy hover:underline">
                        {i.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-2 pr-4 text-vm-muted">{i.jobDate ? shortDate(i.jobDate) : '—'}</td>
                    <td className="py-2 pr-4 text-right">{money(i.total)}</td>
                    <td className={`py-2 pr-4 text-right ${i.balanceDue > 0 ? 'font-semibold text-vm-warning' : 'text-vm-muted'}`}>
                      {i.balanceDue > 0 ? money(i.balanceDue) : '—'}
                    </td>
                    <td className="py-2 text-xs text-vm-muted">{i.status.replace('_', ' ').toLowerCase()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function JobRow({ job: j }: { job: OverviewJob }) {
  return (
    <tr className="border-b border-vm-border/60 last:border-0 hover:bg-vm-surface/50">
      <td className="whitespace-nowrap px-4 py-2 font-medium text-vm-navy">{shortDate(j.date)}</td>
      <td className="px-4 py-2">
        <Link href={`/admin/jobs/${j.id}`} className="font-medium text-vm-cyan-dark hover:underline">
          {j.jobReference || 'Open job'}
        </Link>
        <p className="text-xs text-vm-muted">{j.serviceType || ''}</p>
        {j.flags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {j.flags.map((f) => (
              <span key={f} className="rounded-full bg-vm-warning-bg px-2 py-0.5 text-[11px] font-semibold text-vm-warning">
                {f}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-2 text-vm-text">{j.propertyName || '—'}</td>
      <td className="px-4 py-2 text-vm-text">{STATUS_LABEL[j.status] ?? j.status}</td>
      <td className="px-4 py-2 text-vm-text">{j.cleanerName || <span className="text-vm-muted">—</span>}</td>
      <td className="px-4 py-2 text-right">{j.price != null ? money(j.price) : <span className="text-vm-muted">—</span>}</td>
      <td className="px-4 py-2 text-xs text-vm-muted">
        {PAY_LABEL[j.paymentStatus] ?? j.paymentStatus}
        {j.invoiceNumber ? ` · ${j.invoiceNumber}` : ''}
      </td>
    </tr>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div className="rounded-xl border border-vm-border bg-vm-white px-4 py-3">
      <p className="font-body text-xs text-vm-muted">{label}</p>
      <p className={`mt-1 font-heading text-xl font-bold ${warn ? 'text-vm-warning' : 'text-vm-navy'}`}>{value}</p>
    </div>
  );
}
