'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { TravelZone } from '@prisma/client';
import { TRAVEL_ZONE_OPTIONS } from '@/lib/vermont/travelZone';

const inputClass =
  'w-full rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy focus:border-vm-cyan focus:outline-none focus:ring-1 focus:ring-vm-cyan';
const labelClass = 'mb-1 block font-heading text-xs font-semibold uppercase tracking-wide text-vm-muted';

interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  defaultAddress: string | null;
  travelZone: TravelZone | null;
  Branch: { name: string; slug: string } | null;
}

export default function AdminCustomerProfilePage() {
  const params = useParams<{ customerId: string }>();
  const customerId = params.customerId;
  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [travelZone, setTravelZone] = useState<TravelZone | ''>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/customers/${customerId}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setCustomer(d.customer);
          setTravelZone(d.customer.travelZone || '');
        }
      })
      .finally(() => setLoading(false));
  }, [customerId]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ travelZone: travelZone || null }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setCustomer((c) => (c ? { ...c, travelZone: data.customer.travelZone } : c));
      setMessage('Travel zone saved.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vm-surface">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6 font-body text-sm text-vm-danger">Customer not found.</div>
    );
  }

  const propertyAddress =
    customer.defaultAddress ||
    [customer.addressLine1, customer.city, customer.state].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-vm-surface p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/jobs"
          className="mb-4 inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to jobs
        </Link>

        <h1 className="font-heading text-2xl font-bold text-vm-navy">Property Profile</h1>
        <p className="mt-1 font-body text-sm text-vm-muted">
          {customer.firstName} {customer.lastName} · {customer.email}
        </p>

        <div className="mt-6 space-y-6 rounded-xl border border-vm-border bg-vm-white p-6">
          <div>
            <p className={labelClass}>Property address</p>
            <p className="font-body text-sm text-vm-text">{propertyAddress || '—'}</p>
          </div>
          {customer.Branch && (
            <div>
              <p className={labelClass}>Branch</p>
              <p className="font-body text-sm text-vm-text">{customer.Branch.name}</p>
            </div>
          )}

          <div>
            <label className={labelClass} htmlFor="travelZone">
              Travel Zone
            </label>
            <select
              id="travelZone"
              className={inputClass}
              value={travelZone}
              onChange={(e) => setTravelZone(e.target.value as TravelZone | '')}
            >
              <option value="">Not set</option>
              {TRAVEL_ZONE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="mt-2 font-body text-xs text-vm-muted">
              Set once per property. Used to suggest travel fees on standalone Vermont visits.
            </p>
          </div>

          {message && <p className="font-body text-sm text-vm-muted">{message}</p>}

          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-vm-cyan px-5 py-2.5 font-heading text-sm font-semibold text-vm-navy hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save travel zone
          </button>
        </div>
      </div>
    </div>
  );
}
