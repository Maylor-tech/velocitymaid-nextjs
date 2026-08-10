'use client';

import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatServiceDate } from '@/lib/dates/serviceDate';

interface CustomerPreview {
  id: string;
  status: string;
  serviceType: string;
  scheduledDate: string | null;
  timeWindow: string | null;
  address: string;
  price: number | null;
  balanceDue: number | null;
  paymentStatus: string;
  serviceTeamLine: string | null;
  photos: Array<{ url: string; caption: string | null }>;
  customerId: string | null;
}

function formatDate(dateStr: string | null, timeWindow: string | null): string {
  if (!dateStr) return timeWindow || 'Date TBD';
  const datePart = formatServiceDate(dateStr, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  return timeWindow ? `${datePart} · ${timeWindow}` : datePart;
}

function formatUsd(amount: number | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export function CustomerPortalPreview({ jobId, customerId }: { jobId: string; customerId?: string | null }) {
  const [preview, setPreview] = useState<CustomerPreview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/customer-preview`, { credentials: 'include' });
      const data = await res.json();
      if (data.success) setPreview(data.preview);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-vm-cyan" />
      </div>
    );
  }

  if (!preview) return null;

  const cid = customerId || preview.customerId;

  return (
    <div className="rounded-xl border border-vm-border bg-vm-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-xl font-semibold text-vm-navy">Customer portal preview</h2>
          <p className="font-body text-sm text-vm-muted">Read-only — exactly what the client sees for this job.</p>
        </div>
        {cid && (
          <Link
            href={`/customer/jobs/${jobId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-vm-cyan/40 bg-vm-cyan-tint px-3 py-2 font-body text-sm font-semibold text-vm-navy hover:bg-vm-cyan/20"
          >
            Open Customer View
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="rounded-xl border border-vm-border/70 bg-vm-surface/60 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-heading text-base font-semibold text-vm-navy">{preview.serviceType}</p>
          <span className="rounded-full bg-vm-navy/10 px-2.5 py-0.5 font-body text-xs font-medium capitalize text-vm-navy">
            {preview.status.replace(/_/g, ' ')}
          </span>
        </div>
        <p className="font-body text-sm text-vm-muted">{formatDate(preview.scheduledDate, preview.timeWindow)}</p>
        <p className="mt-1 font-body text-sm text-vm-text">{preview.address}</p>
        {preview.serviceTeamLine && (
          <p className="mt-2 font-body text-xs text-vm-muted">Team: {preview.serviceTeamLine}</p>
        )}
        <div className="mt-3 flex flex-wrap gap-4 font-body text-sm">
          <span>
            <span className="text-vm-muted">Price: </span>
            <strong>{formatUsd(preview.price)}</strong>
          </span>
          {(preview.balanceDue ?? 0) > 0 && (
            <span>
              <span className="text-vm-muted">Balance: </span>
              <strong className="text-orange-700">{formatUsd(preview.balanceDue)}</strong>
            </span>
          )}
        </div>
        {preview.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {preview.photos.map((photo) => (
              <img
                key={photo.url}
                src={photo.url}
                alt={photo.caption || 'Service photo'}
                className="h-20 w-full rounded-lg object-cover"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
