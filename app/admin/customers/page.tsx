'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Search } from 'lucide-react';
import { PortalInviteButton } from '@/components/admin/PortalInviteButton';

interface CustomerRow {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  jobCount: number;
  portal: {
    portalInviteSent: boolean;
    inviteAccepted: boolean;
    loginCount: number;
    lastPortalLoginAt: string | null;
    invitedAt: string | null;
  };
}

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

  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (q.trim()) params.set('q', q.trim());
        const res = await fetch(`/api/admin/customers?${params}`, { credentials: 'include' });
        const data = await res.json();
        if (data.success) setCustomers(data.customers);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

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
          Portal usage — see who has logged in and who may need a nudge.
        </p>

        <div className="relative mt-6 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vm-muted" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full rounded-lg border border-vm-border py-2 pl-10 pr-3 font-body text-sm focus:border-vm-cyan focus:outline-none focus:ring-1 focus:ring-vm-cyan"
          />
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
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.id} className="border-b border-vm-border/60 last:border-0 hover:bg-vm-surface/40">
                    <td className="px-4 py-3">
                      <Link href={`/admin/customers/${c.id}`} className="font-medium text-vm-navy hover:underline">
                        {c.firstName} {c.lastName}
                      </Link>
                      <p className="text-xs text-vm-muted">{c.email}</p>
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
                    <td className="px-4 py-3 text-vm-muted">{formatDate(c.portal.lastPortalLoginAt)}</td>
                    <td className="px-4 py-3 text-vm-text">{c.portal.loginCount}</td>
                    <td className="px-4 py-3">
                      {c.portal.inviteAccepted ? (
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
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-vm-muted">
                      No customers found.
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
