'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2, AlertCircle, ChevronRight } from 'lucide-react';

interface HostProperty {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
}

export default function CustomerPropertiesPage() {
  const [properties, setProperties] = useState<HostProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/customer/properties');
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to load properties');
        }
        if (!cancelled) setProperties(data.properties || []);
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load properties');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold text-vm-navy">Properties</h1>
        <p className="mt-1 font-body text-vm-muted">
          Maintain standing property instructions once, then add cleanings by date.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-vm-danger/20 bg-vm-danger-bg px-4 py-3 text-sm text-vm-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {!error && properties.length === 0 && (
        <div className="rounded-xl border border-vm-navy/10 bg-vm-white p-8 text-center shadow-sm">
          <Building2 className="mx-auto h-10 w-10 text-vm-muted" />
          <p className="mt-3 font-heading font-semibold text-vm-navy">No properties yet</p>
          <p className="mt-1 font-body text-sm text-vm-muted">
            After Vermont host intake, your property profile will appear here.
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {properties.map((p) => (
          <li key={p.id}>
            <Link
              href={`/customer/properties/${p.id}`}
              className="flex items-center justify-between rounded-xl border border-vm-navy/10 bg-vm-white p-5 shadow-sm transition hover:border-vm-cyan/40"
            >
              <div>
                <p className="font-heading font-semibold text-vm-navy">{p.name}</p>
                <p className="mt-1 font-body text-sm text-vm-muted">
                  {p.address}
                  {p.city ? `, ${p.city}` : ''}
                  {p.state ? `, ${p.state}` : ''}
                </p>
                {(p.bedrooms != null || p.bathrooms != null) && (
                  <p className="mt-1 font-body text-xs text-vm-muted">
                    {p.bedrooms ?? '—'} bed · {p.bathrooms ?? '—'} bath
                  </p>
                )}
              </div>
              <ChevronRight className="h-5 w-5 text-vm-muted" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
