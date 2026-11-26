'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertCircle, CalendarClock, Loader2, Search } from 'lucide-react';
import { PortalInviteButton } from '@/components/admin/PortalInviteButton';
import { CustomerActionsMenu } from '@/components/admin/CustomerActionsMenu';
import type { CustomerListFilter } from '@/lib/admin/customerListTypes';

interface CustomerRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobCount: number;
  invoiceCount?: number;
  propertyCount?: number;
  nextCleanDate?: string | null;
  lastCleanDate?: string | null;
  unpaidTotal?: number;
  archivedAt: string | null;
  recordKind: 'STANDARD' | 'SYSTEM' | 'TEST';
  portal: {
    portalInviteSent: boolean;
    inviteAccepted: boolean;
    loginCount: number;
    lastPortalLoginAt: string | null;
    invitedAt: string | null;
  };
}

type SortKey = 'next' | 'name' | 'unpaid' | 'recent';

const FILTERS: { id: CustomerListFilter; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
  { id: 'all', label: 'All' },
  { id: 'system', label: 'System' },
];

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'next', label: 'Next clean' },
  { id: 'name', label: 'Name' },
  { id: 'unpaid', label: 'Unpaid' },
  { id: 'recent', label: 'Recently updated' },
];

function shortDate(iso: string | null | undefined, empty = '—'): string {
  if (!iso) return empty;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

const money = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });

/** Test records: flagged as TEST, or obvious placeholder addresses. */
function isTestRecord(c: CustomerRow): boolean {
  return c.recordKind === 'TEST' || /@example\.(com|org|net)$/i.test(c.email);
}

export default function AdminCustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<CustomerListFilter>('active');
  const [sort, setSort] = useState<SortKey>('next');
  const [clientsOnly, setClientsOnly] = useState(true);
  const [showTest, setShowTest] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        params.set('filter', filter);
        const res = await fetch(`/api/admin/customers?${params}`, {
          credentials: 'include',
        });
        const data = await res.json().catch(() => null);
        if (data?.success) setCustomers(data.customers);
        else setError(data?.error || `Could not load customers (error ${res.status}).`);
      } catch {
        setError('Could not reach the server. Check your connection and try again.');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, filter, reloadKey]);

  const visible = useMemo(() => {
    let rows = customers.filter((c) => (showTest ? true : !isTestRecord(c)));
    if (clientsOnly && filter === 'active' && !q.trim()) rows = rows.filter((c) => c.jobCount > 0);
    const name = (c: CustomerRow) => `${c.firstName} ${c.lastName}`.trim().toLowerCase() || c.email;
    const sorted = [...rows];
    if (sort === 'name') sorted.sort((a, b) => name(a).localeCompare(name(b)));
    if (sort === 'unpaid') sorted.sort((a, b) => (b.unpaidTotal ?? 0) - (a.unpaidTotal ?? 0));
    if (sort === 'next') {
      sorted.sort((a, b) => {
        const an = a.nextCleanDate ?? '9999';
        const bn = b.nextCleanDate ?? '9999';
        return an === bn ? name(a).localeCompare(name(b)) : an.localeCompare(bn);
      });
    }
    return sorted;
  }, [customers, sort, clientsOnly, showTest, filter, q]);

  const totals = useMemo(() => {
    const real = customers.filter((c) => !isTestRecord(c));
    return {
      withUpcoming: real.filter((c) => c.nextCleanDate).length,
      unpaid: real.reduce((s, c) => s + (c.unpaidTotal ?? 0), 0),
      portalActive: real.filter((c) => c.portal.inviteAccepted).length,
      leads: real.filter((c) => c.jobCount === 0).length,
      hiddenTest: customers.filter(isTestRecord).length,
    };
  }, [customers]);

  return (
    <div className="min-h-screen bg-vm-surface p-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-bold text-vm-navy">Customers</h1>
            <p className="mt-1 font-body text-sm text-vm-muted">
              Who you clean for, when you see them next, and what is still unpaid. Click a
              customer to see all their jobs.
            </p>
          </div>
          <Link
            href="/admin/calendar-sync"
            className="inline-flex items-center gap-1.5 rounded-lg border border-vm-border bg-vm-white px-3 py-2 font-body text-sm font-semibold text-vm-cyan-dark hover:border-vm-cyan"
          >
            <CalendarClock className="h-4 w-4" />
            Booking calendar sync
          </Link>
        </div>

        {filter === 'active' && !loading && !error && (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="With upcoming cleans" value={String(totals.withUpcoming)} />
            <Stat label="Unpaid invoices" value={money(totals.unpaid)} warn={totals.unpaid > 0} />
            <Stat label="Using the portal" value={String(totals.portalActive)} />
            <Stat label="Not booked yet" value={String(totals.leads)} />
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vm-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-lg border border-vm-border bg-vm-white py-2 pl-10 pr-3 font-body text-sm focus:border-vm-cyan focus:outline-none focus:ring-1 focus:ring-vm-cyan"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5 font-body text-xs text-vm-muted">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="rounded-md border border-vm-border bg-vm-white px-2 py-1.5 text-xs text-vm-navy"
              >
                {SORTS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="inline-flex rounded-lg border border-vm-border bg-vm-white p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  className={`rounded-md px-3 py-1.5 font-heading text-xs font-semibold uppercase tracking-wide transition-colors ${
                    filter === f.id ? 'bg-vm-navy text-vm-white' : 'text-vm-muted hover:text-vm-navy'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-4 font-body text-xs text-vm-muted">
          {filter === 'active' && (
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={clientsOnly}
                onChange={(e) => setClientsOnly(e.target.checked)}
              />
              Only customers with jobs (hides {totals.leads} not booked yet)
            </label>
          )}
          {totals.hiddenTest > 0 && (
            <label className="inline-flex items-center gap-1.5">
              <input type="checkbox" checked={showTest} onChange={(e) => setShowTest(e.target.checked)} />
              Show test accounts ({totals.hiddenTest})
            </label>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
          </div>
        ) : error ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-vm-danger/30 bg-vm-white p-5 font-body text-sm text-vm-danger">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className="mt-2 font-semibold text-vm-cyan-dark underline"
              >
                Try again
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-vm-border bg-vm-white">
            <table className="w-full min-w-[820px] font-body text-sm">
              <thead className="border-b border-vm-border bg-vm-surface/80 text-left text-xs uppercase tracking-wide text-vm-muted">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Next clean</th>
                  <th className="px-4 py-3">Last clean</th>
                  <th className="px-4 py-3 text-right">Unpaid</th>
                  <th className="px-4 py-3">Portal</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((c) => {
                  const displayName = `${c.firstName} ${c.lastName}`.trim() || c.email;
                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/admin/customers/${c.id}`)}
                      className="cursor-pointer border-b border-vm-border/60 last:border-0 hover:bg-vm-surface/50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/customers/${c.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-vm-navy hover:underline"
                        >
                          {displayName}
                        </Link>
                        <p className="text-xs text-vm-muted">
                          {c.email}
                          {c.propertyCount ? ` · ${c.propertyCount} ${c.propertyCount === 1 ? 'property' : 'properties'}` : ''}
                          {` · ${c.jobCount} ${c.jobCount === 1 ? 'job' : 'jobs'}`}
                        </p>
                        <div className="mt-1 flex gap-1">
                          {c.recordKind === 'SYSTEM' && <Badge tone="muted">System</Badge>}
                          {isTestRecord(c) && <Badge tone="muted">Test</Badge>}
                          {c.archivedAt && <Badge tone="warn">Archived</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {c.nextCleanDate ? (
                          <span className="font-medium text-vm-navy">{shortDate(c.nextCleanDate)}</span>
                        ) : (
                          <span className="text-vm-muted">None booked</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-vm-muted">{shortDate(c.lastCleanDate)}</td>
                      <td className="px-4 py-3 text-right">
                        {(c.unpaidTotal ?? 0) > 0 ? (
                          <span className="font-semibold text-vm-warning">{money(c.unpaidTotal ?? 0)}</span>
                        ) : (
                          <span className="text-vm-muted">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {c.portal.inviteAccepted ? (
                          <Badge tone="ok">Active</Badge>
                        ) : c.portal.portalInviteSent ? (
                          <Badge tone="warn">Invited</Badge>
                        ) : (
                          <Badge tone="muted">No invite</Badge>
                        )}
                        <p className="mt-1 text-xs text-vm-muted">
                          {c.portal.lastPortalLoginAt
                            ? `Last login ${shortDate(c.portal.lastPortalLoginAt)}`
                            : 'Never logged in'}
                        </p>
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {!c.portal.inviteAccepted && c.recordKind !== 'SYSTEM' && (
                            <PortalInviteButton
                              customerId={c.id}
                              alreadyInvited={c.portal.portalInviteSent}
                              onInvited={() => {
                                setCustomers((prev) =>
                                  prev.map((row) =>
                                    row.id === c.id
                                      ? {
                                          ...row,
                                          portal: {
                                            ...row.portal,
                                            portalInviteSent: true,
                                            invitedAt: new Date().toISOString(),
                                          },
                                        }
                                      : row
                                  )
                                );
                              }}
                            />
                          )}
                          <CustomerActionsMenu
                            customerId={c.id}
                            customerName={displayName}
                            isArchived={Boolean(c.archivedAt)}
                            recordKind={c.recordKind}
                            jobCount={c.jobCount}
                            invoiceCount={c.invoiceCount ?? 0}
                            onChanged={() => setReloadKey((k) => k + 1)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-vm-muted">
                      No customers found for this filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
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

function Badge({ tone, children }: { tone: 'ok' | 'warn' | 'muted'; children: React.ReactNode }) {
  const cls =
    tone === 'ok'
      ? 'bg-vm-success-bg text-vm-success'
      : tone === 'warn'
        ? 'bg-vm-warning-bg text-vm-warning'
        : 'bg-vm-surface text-vm-muted';
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{children}</span>
  );
}
