'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
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

const FILTERS: { id: CustomerListFilter; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'archived', label: 'Archived' },
  { id: 'all', label: 'All' },
  { id: 'system', label: 'System' },
];

function formatDate(iso: string | null): string {
  if (!iso) return 'Never';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<CustomerListFilter>('active');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        params.set('filter', filter);
        const res = await fetch(`/api/admin/customers?${params}`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (data.success) setCustomers(data.customers);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, filter, reloadKey]);

  return (
    <div className="min-h-screen bg-vm-surface p-6">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <h1 className="font-heading text-2xl font-bold text-vm-navy">Customer records</h1>
        <p className="mt-1 font-body text-sm text-vm-muted">
          Portal usage — see who has logged in and who may need a nudge. Archive hides clutter
          without deleting history.
        </p>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vm-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-lg border border-vm-border py-2 pl-10 pr-3 font-body text-sm focus:border-vm-cyan focus:outline-none focus:ring-1 focus:ring-vm-cyan"
            />
          </div>
          <div className="inline-flex rounded-lg border border-vm-border bg-vm-white p-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={`rounded-md px-3 py-1.5 font-heading text-xs font-semibold uppercase tracking-wide transition-colors ${
                  filter === f.id
                    ? 'bg-vm-navy text-vm-white'
                    : 'text-vm-muted hover:text-vm-navy'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-xl border border-vm-border bg-vm-white">
            <table className="w-full font-body text-sm">
              <thead className="border-b border-vm-border bg-vm-surface/80 text-left text-xs uppercase tracking-wide text-vm-muted">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Jobs</th>
                  <th className="px-4 py-3">Portal account</th>
                  <th className="px-4 py-3">Last login</th>
                  <th className="px-4 py-3">Logins</th>
                  <th className="px-4 py-3">Invite</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-vm-border/60 last:border-0 hover:bg-vm-surface/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/customers/${c.id}`}
                        className="font-medium text-vm-navy hover:underline"
                      >
                        {c.firstName} {c.lastName}
                      </Link>
                      <p className="text-xs text-vm-muted">{c.email}</p>
                      {c.recordKind === 'SYSTEM' && (
                        <span className="mt-1 inline-block rounded-full bg-vm-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-vm-muted">
                          System
                        </span>
                      )}
                      {c.archivedAt && (
                        <span className="mt-1 ml-1 inline-block rounded-full bg-vm-warning-bg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-vm-warning">
                          Archived
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-vm-text">{c.jobCount}</td>
                    <td className="px-4 py-3">
                      {c.portal.inviteAccepted ? (
                        <span className="rounded-full bg-vm-success-bg px-2 py-0.5 text-xs font-medium text-vm-success">
                          Active
                        </span>
                      ) : c.portal.portalInviteSent ? (
                        <span className="rounded-full bg-vm-warning-bg px-2 py-0.5 text-xs font-medium text-vm-warning">
                          Invited
                        </span>
                      ) : (
                        <span className="rounded-full bg-vm-surface px-2 py-0.5 text-xs font-medium text-vm-muted">
                          No invite
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-vm-muted">
                      {formatDate(c.portal.lastPortalLoginAt)}
                    </td>
                    <td className="px-4 py-3 text-vm-text">{c.portal.loginCount}</td>
                    <td className="px-4 py-3">
                      {c.portal.inviteAccepted || c.recordKind === 'SYSTEM' ? (
                        <span className="font-body text-xs text-vm-muted">—</span>
                      ) : (
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
                    </td>
                    <td className="px-4 py-3">
                      <CustomerActionsMenu
                        customerId={c.id}
                        customerName={`${c.firstName} ${c.lastName}`.trim() || c.email}
                        isArchived={Boolean(c.archivedAt)}
                        recordKind={c.recordKind}
                        jobCount={c.jobCount}
                        invoiceCount={c.invoiceCount ?? 0}
                        onChanged={() => setReloadKey((k) => k + 1)}
                      />
                    </td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-vm-muted">
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
