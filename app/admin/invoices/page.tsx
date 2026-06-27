'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Plus, Search } from 'lucide-react';
import type { SerializedInvoice } from '@/lib/invoices/serializeInvoice';
import { INVOICE_STATUS_CLASSES, formatUsd } from '@/lib/invoices/invoiceUtils';

interface Summary {
  totalUnpaidBalance: number;
  paidThisMonth: number;
  overdueCount: number;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<SerializedInvoice[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [q, setQ] = useState('');

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (q.trim()) params.set('q', q.trim());
      const res = await fetch(`/api/admin/invoices?${params}`);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices);
        setSummary(data.summary);
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, q]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return (
    <div className="p-7">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-vm-navy">Invoices</h1>
          <p className="mt-1 font-body text-sm text-vm-muted">
            Quotes, invoices, payments, and balances
          </p>
        </div>
        <Link href="/admin/invoices/new"
          className="inline-flex items-center gap-2 rounded-lg bg-vm-navy px-4 py-2.5 font-heading text-sm font-bold uppercase tracking-wider text-vm-white hover:bg-vm-navy/90">
          <Plus className="h-4 w-4" /> Create invoice
        </Link>
      </div>

      {summary && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-vm-border bg-vm-white p-5">
            <p className="font-body text-xs font-medium uppercase tracking-wide text-vm-muted">Unpaid balance</p>
            <p className="mt-1 font-heading text-2xl font-bold text-vm-navy">{formatUsd(summary.totalUnpaidBalance)}</p>
          </div>
          <div className="rounded-xl border border-vm-border bg-vm-white p-5">
            <p className="font-body text-xs font-medium uppercase tracking-wide text-vm-muted">Paid this month</p>
            <p className="mt-1 font-heading text-2xl font-bold text-vm-success">{formatUsd(summary.paidThisMonth)}</p>
          </div>
          <div className="rounded-xl border border-vm-border bg-vm-white p-5">
            <p className="font-body text-xs font-medium uppercase tracking-wide text-vm-muted">Overdue</p>
            <p className="mt-1 font-heading text-2xl font-bold text-vm-danger">{summary.overdueCount}</p>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vm-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client, email, invoice #, address…"
            className="w-full rounded-lg border border-vm-border py-2 pl-9 pr-3 font-body text-sm focus:border-vm-cyan focus:outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy">
          <option value="all">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="SENT">Sent</option>
          <option value="PARTIALLY_PAID">Partially paid</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button type="button" onClick={fetchInvoices}
          className="rounded-lg border border-vm-border px-4 py-2 font-body text-sm font-medium text-vm-navy hover:bg-vm-surface">
          Search
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-vm-cyan" /></div>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border border-vm-border bg-vm-white py-16 text-center font-body text-sm text-vm-muted">
          No invoices found.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-vm-border bg-vm-white">
          <table className="w-full">
            <thead className="border-b border-vm-border bg-vm-surface">
              <tr>
                {['Invoice', 'Client', 'Service', 'Total', 'Balance', 'Status', 'Due'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-heading text-xs font-bold uppercase tracking-wide text-vm-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-vm-border/60 hover:bg-vm-cyan-tint/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/invoices/${inv.id}`} className="font-body text-sm font-semibold text-vm-navy hover:underline">
                      {inv.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-vm-text">{inv.clientName}</td>
                  <td className="px-4 py-3 font-body text-sm text-vm-muted">{inv.serviceType}</td>
                  <td className="px-4 py-3 font-body text-sm text-vm-text">{inv.totalFormatted}</td>
                  <td className="px-4 py-3 font-body text-sm font-medium text-vm-navy">{inv.balanceDueFormatted}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 font-body text-xs font-medium ${INVOICE_STATUS_CLASSES[inv.status]}`}>
                      {inv.statusLabel}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-vm-muted">{inv.dueDateFormatted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
