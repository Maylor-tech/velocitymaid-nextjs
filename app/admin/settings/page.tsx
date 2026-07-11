'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import type { TravelZone } from '@prisma/client';
import { TRAVEL_ZONE_OPTIONS } from '@/lib/vermont/travelZone';
import type { InvoiceQuickAddItem } from '@/lib/admin/invoiceQuickAddSettings';
import type { GoogleIntegrationStatus } from '@/lib/admin/googleIntegrationSettings';

const inputClass =
  'w-full rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy focus:border-vm-cyan focus:outline-none focus:ring-1 focus:ring-vm-cyan';

function IntegrationsSection() {
  const [status, setStatus] = useState<GoogleIntegrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState<'drive' | 'calendar' | null>(null);
  const [testResult, setTestResult] = useState<{ provider: string; ok: boolean; message: string } | null>(null);
  const [toggling, setToggling] = useState<'drive' | 'calendar' | null>(null);

  const load = () => {
    setLoading(true);
    fetch('/api/admin/settings/integrations', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setStatus(d);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggle = async (provider: 'drive' | 'calendar', nextEnabled: boolean) => {
    setToggling(provider);
    try {
      const res = await fetch('/api/admin/settings/integrations', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          provider === 'drive' ? { driveEnabled: nextEnabled } : { calendarEnabled: nextEnabled }
        ),
      });
      const data = await res.json();
      if (data.success) setStatus(data);
    } finally {
      setToggling(null);
    }
  };

  const testConnection = async (provider: 'drive' | 'calendar') => {
    setTesting(provider);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/settings/integrations/test', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      setTestResult({ provider, ok: Boolean(data.ok), message: data.message || data.error || 'Unknown result' });
      load(); // refresh in case the test updated lastSyncError
    } finally {
      setTesting(null);
    }
  };

  if (loading || !status) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-vm-cyan" />
      </div>
    );
  }

  const rows: Array<{
    key: 'drive' | 'calendar';
    label: string;
    envConfigured: boolean;
    enabled: boolean;
    idLabel: string;
    idValue: string | null;
  }> = [
    {
      key: 'drive',
      label: 'Google Drive',
      envConfigured: status.drive.envConfigured,
      enabled: status.drive.enabled,
      idLabel: 'Client Records root folder ID',
      idValue: status.drive.rootFolderId,
    },
    {
      key: 'calendar',
      label: 'Google Calendar',
      envConfigured: status.calendar.envConfigured,
      enabled: status.calendar.enabled,
      idLabel: 'Operations calendar ID',
      idValue: status.calendar.calendarId,
    },
  ];

  return (
    <div className="mt-4 space-y-4">
      <div className="rounded-lg border border-vm-border p-3">
        <p className="font-body text-xs uppercase tracking-wide text-vm-muted">Sender email (Resend)</p>
        <p className="mt-1 font-body text-sm text-vm-navy">{status.senderEmail}</p>
        <p className="mt-1 font-body text-xs text-vm-muted">
          Email continues to be sent via Resend. Gmail is not used for sending in this phase.
        </p>
      </div>

      {rows.map((row) => (
        <div key={row.key} className="rounded-lg border border-vm-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {row.envConfigured ? (
                <CheckCircle2 className="h-5 w-5 text-vm-success" />
              ) : (
                <XCircle className="h-5 w-5 text-vm-muted" />
              )}
              <span className="font-heading text-sm font-semibold text-vm-navy">{row.label}</span>
              <span
                className={`rounded-full px-2 py-0.5 font-body text-xs font-semibold ${
                  row.enabled ? 'bg-vm-success-bg text-vm-success' : 'bg-vm-surface text-vm-muted'
                }`}
              >
                {row.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <button
              type="button"
              disabled={!row.envConfigured || toggling === row.key}
              onClick={() => toggle(row.key, !row.enabled)}
              className="rounded-lg border border-vm-border px-3 py-1.5 font-body text-xs font-semibold text-vm-navy hover:bg-vm-surface disabled:opacity-50"
            >
              {toggling === row.key ? 'Saving…' : row.enabled ? 'Disable' : 'Enable'}
            </button>
          </div>

          {!row.envConfigured && (
            <p className="mt-2 font-body text-xs text-vm-muted">
              Not configured — credentials or IDs are missing from environment variables.
            </p>
          )}

          <p className="mt-2 font-body text-xs text-vm-muted">
            {row.idLabel}: <span className="text-vm-navy">{row.idValue || '—'}</span>
          </p>

          <button
            type="button"
            disabled={!row.envConfigured || testing === row.key}
            onClick={() => testConnection(row.key)}
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-vm-surface px-3 py-1.5 font-body text-xs font-semibold text-vm-navy hover:bg-vm-border disabled:opacity-50"
          >
            {testing === row.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Run connection test
          </button>

          {testResult && testResult.provider === row.key && (
            <p
              className={`mt-2 font-body text-xs ${testResult.ok ? 'text-vm-success' : 'text-vm-danger'}`}
            >
              {testResult.message}
            </p>
          )}
        </div>
      ))}

      {status.lastSyncError && (
        <div className="flex items-start gap-2 rounded-lg border border-vm-border bg-vm-surface p-3">
          <AlertTriangle className="h-4 w-4 shrink-0 text-vm-danger mt-0.5" />
          <div>
            <p className="font-body text-xs font-semibold text-vm-navy">Most recent sync error</p>
            <p className="mt-0.5 font-body text-xs text-vm-muted">{status.lastSyncError}</p>
            {status.lastSyncErrorAt && (
              <p className="mt-0.5 font-body text-xs text-vm-muted">
                {new Date(status.lastSyncErrorAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
            Google Workspace Integrations
          </h2>
          <p className="mt-1 font-body text-sm text-vm-muted">
            Drive folder creation and Calendar sync for client jobs. Supabase remains the source
            of truth — these only mirror state outward.
          </p>
          <IntegrationsSection />
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
