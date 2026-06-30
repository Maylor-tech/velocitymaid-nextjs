'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { TravelZone } from '@prisma/client';
import { TRAVEL_ZONE_OPTIONS } from '@/lib/vermont/travelZone';
import type { InvoiceQuickAddItem } from '@/lib/admin/invoiceQuickAddSettings';

const inputClass =
  'w-full rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy focus:border-vm-cyan focus:outline-none focus:ring-1 focus:ring-vm-cyan';

export default function AdminSettingsPage() {
  const [items, setItems] = useState<InvoiceQuickAddItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings/invoice-line-items', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setItems(d.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateItem = (index: number, patch: Partial<InvoiceQuickAddItem>) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/settings/invoice-line-items', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setItems(data.items);
      setMessage('Settings saved.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-full bg-vm-surface p-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <h1 className="font-heading text-2xl font-bold text-vm-navy">Admin Settings</h1>
        <p className="mt-1 font-body text-sm text-vm-muted">
          Configure invoice quick-add line items and Vermont travel zone reference.
        </p>

        <section className="mt-8 rounded-xl border border-vm-border bg-vm-white p-6">
          <h2 className="font-heading text-lg font-semibold text-vm-navy">
            Invoice Quick-Add Line Items
          </h2>
          <p className="mt-1 font-body text-sm text-vm-muted">
            Amounts used on Create Invoice quick-add buttons.
          </p>

          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-vm-cyan" />
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.key}
                  className="grid gap-3 rounded-lg border border-vm-border p-3 sm:grid-cols-3"
                >
                  <input
                    className={inputClass}
                    value={item.label}
                    onChange={(e) => updateItem(index, { label: e.target.value })}
                    placeholder="Button label"
                  />
                  <input
                    className={inputClass}
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                    placeholder="Line item description"
                  />
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    className={inputClass}
                    value={item.amount}
                    onChange={(e) => updateItem(index, { amount: Number(e.target.value) })}
                    placeholder="Amount"
                  />
                </div>
              ))}
            </div>
          )}

          {message && (
            <p className="mt-3 font-body text-sm text-vm-muted">{message}</p>
          )}

          <button
            type="button"
            onClick={save}
            disabled={saving || loading}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-vm-navy px-5 py-2.5 font-heading text-sm font-bold uppercase tracking-wider text-vm-white hover:bg-vm-navy/90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save settings
          </button>
        </section>

        <section className="mt-6 rounded-xl border border-vm-border bg-vm-white p-6">
          <h2 className="font-heading text-lg font-semibold text-vm-navy">
            Vermont Travel Zones (reference)
          </h2>
          <ul className="mt-3 space-y-2 font-body text-sm text-vm-text">
            {TRAVEL_ZONE_OPTIONS.map((z) => (
              <li key={z.value}>
                <strong>{z.label}</strong>
                {z.fee != null && z.fee > 0 ? ` — $${z.fee} suggested travel fee` : ''}
              </li>
            ))}
          </ul>
          <p className="mt-3 font-body text-xs text-vm-muted">
            Zones are assigned per customer property on the customer profile page.
          </p>
        </section>
      </div>
    </div>
  );
}
