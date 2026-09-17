'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Minimal cleaner self-service worker fields.
 * Legal name / classification / agreements are admin-only.
 */
export default function CleanerProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [classificationStatus, setClassificationStatus] = useState('UNRESOLVED');
  const [publicDisplayName, setPublicDisplayName] = useState('');
  const [mailingAddressLine1, setMailingAddressLine1] = useState('');
  const [mailingCity, setMailingCity] = useState('');
  const [mailingState, setMailingState] = useState('');
  const [mailingPostalCode, setMailingPostalCode] = useState('');
  const [mailingCountry, setMailingCountry] = useState('US');
  const [paymentPreference, setPaymentPreference] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/cleaner/worker-record');
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Failed to load');
        const r = data.record;
        setClassificationStatus(r.workStatus?.classificationStatus || 'UNRESOLVED');
        setPublicDisplayName(r.identity?.preferredDisplayName || '');
        setMailingAddressLine1(r.identity?.mailingAddressLine1 || '');
        setMailingCity(r.identity?.mailingCity || '');
        setMailingState(r.identity?.mailingState || '');
        setMailingPostalCode(r.identity?.mailingPostalCode || '');
        setMailingCountry(r.identity?.mailingCountry || 'US');
        setPaymentPreference(r.paymentPreference || '');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch('/api/cleaner/worker-record', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          publicDisplayName: publicDisplayName || null,
          mailingAddressLine1: mailingAddressLine1 || null,
          mailingCity: mailingCity || null,
          mailingState: mailingState || null,
          mailingPostalCode: mailingPostalCode || null,
          mailingCountry: mailingCountry || null,
          paymentPreference: paymentPreference || null,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Save failed');
      setOk('Saved');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg p-6">
      <h1 className="font-heading text-xl font-bold text-vm-navy">My profile</h1>
      <p className="mt-1 font-body text-sm text-vm-muted">
        Update preferred name, mailing address, and payment preference.
      </p>
      <p className="mt-3 font-body text-sm text-vm-navy">
        Classification:{' '}
        <span className="font-semibold">{classificationStatus}</span>
        {classificationStatus === 'UNRESOLVED' && (
          <span className="ml-2 text-vm-muted">(confirmed by VelocityMaid separately)</span>
        )}
      </p>

      <form onSubmit={save} className="mt-6 space-y-4">
        <label className="block font-body text-sm">
          Preferred display name
          <input
            className="mt-1 w-full rounded-lg border border-vm-border px-3 py-2"
            value={publicDisplayName}
            onChange={(e) => setPublicDisplayName(e.target.value)}
          />
        </label>
        <label className="block font-body text-sm">
          Mailing address
          <input
            className="mt-1 w-full rounded-lg border border-vm-border px-3 py-2"
            value={mailingAddressLine1}
            onChange={(e) => setMailingAddressLine1(e.target.value)}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block font-body text-sm">
            City
            <input
              className="mt-1 w-full rounded-lg border border-vm-border px-3 py-2"
              value={mailingCity}
              onChange={(e) => setMailingCity(e.target.value)}
            />
          </label>
          <label className="block font-body text-sm">
            State
            <input
              className="mt-1 w-full rounded-lg border border-vm-border px-3 py-2"
              value={mailingState}
              onChange={(e) => setMailingState(e.target.value)}
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="block font-body text-sm">
            Postal code
            <input
              className="mt-1 w-full rounded-lg border border-vm-border px-3 py-2"
              value={mailingPostalCode}
              onChange={(e) => setMailingPostalCode(e.target.value)}
            />
          </label>
          <label className="block font-body text-sm">
            Country
            <input
              className="mt-1 w-full rounded-lg border border-vm-border px-3 py-2"
              value={mailingCountry}
              onChange={(e) => setMailingCountry(e.target.value)}
            />
          </label>
        </div>
        <label className="block font-body text-sm">
          Payment preference
          <select
            className="mt-1 w-full rounded-lg border border-vm-border px-3 py-2"
            value={paymentPreference}
            onChange={(e) => setPaymentPreference(e.target.value)}
          >
            <option value="">—</option>
            <option value="ZELLE">Zelle</option>
            <option value="CHECK">Check</option>
            <option value="ACH_PROVIDER">ACH (provider)</option>
            <option value="STRIPE_CONNECT">Stripe Connect</option>
            <option value="OTHER">Other</option>
          </select>
        </label>

        {error && <p className="text-sm text-red-700">{error}</p>}
        {ok && <p className="text-sm text-vm-success">{ok}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-vm-navy px-4 py-2 font-heading text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  );
}
