"use client";

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Clock, Loader2, XCircle } from 'lucide-react';

type OfferRow = {
  id: string;
  status: string;
  cleanerId: string;
  cleanerName: string | null;
  cleanerEmail: string | null;
  offeredAt: string;
  expiresAt: string;
  respondedAt: string | null;
  declineReason: string | null;
  compensationAmount: number;
  compensationCurrency: string;
  compensationBasis?: 'FLAT' | 'HOURLY' | 'OTHER';
};

type DispatchPayload = {
  success: boolean;
  dispatchOffersEnabled: boolean;
  dispatchUrgency: 'STANDARD' | 'SAME_DAY' | 'URGENT';
  estimatedDurationMins: number | null;
  compensationPreview: number | null;
  ui: { state: string; label: string };
  offers: OfferRow[];
};

interface CleanerOption {
  id: string;
  name: string | null;
  email: string;
}

interface DispatchPanelProps {
  jobId: string;
  enabled: boolean;
  canSend: boolean;
  cleaners: CleanerOption[];
  selectedCleanerId: string;
  onSelectCleaner: (id: string) => void;
  onChanged: () => void;
}

function formatMoney(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function Countdown({ expiresAt }: { expiresAt: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = new Date(expiresAt).getTime() - now;
  if (remaining <= 0) return <span className="text-red-700 font-medium">Expired</span>;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return (
    <span className="font-medium text-vm-navy">
      {mins}m {String(secs).padStart(2, '0')}s remaining
    </span>
  );
}

export function DispatchPanel({
  jobId,
  enabled,
  canSend,
  cleaners,
  selectedCleanerId,
  onSelectCleaner,
  onChanged,
}: DispatchPanelProps) {
  const [data, setData] = useState<DispatchPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compensation, setCompensation] = useState('');
  const [compensationBasis, setCompensationBasis] = useState<'FLAT' | 'HOURLY' | 'OTHER'>('FLAT');
  const [ttlMinutes, setTtlMinutes] = useState('');
  const [urgency, setUrgency] = useState<'STANDARD' | 'SAME_DAY' | 'URGENT'>('STANDARD');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/offers`);
      const json = (await res.json()) as DispatchPayload;
      if (!res.ok || !json.success) {
        throw new Error((json as { error?: string }).error || 'Failed to load dispatch');
      }
      setData(json);
      setUrgency(json.dispatchUrgency);
      setCompensation((current) =>
        current || json.compensationPreview == null
          ? current
          : String(json.compensationPreview)
      );
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dispatch');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    if (enabled) void load();
  }, [enabled, load]);

  if (!enabled) return null;

  const openOffer = data?.offers.find((o) => o.status === 'OFFERED') ?? null;
  const history = data?.offers.filter((o) => o.status !== 'OFFERED') ?? [];

  const saveUrgency = async (next: 'STANDARD' | 'SAME_DAY' | 'URGENT') => {
    setUrgency(next);
    await fetch(`/api/admin/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dispatchUrgency: next }),
    });
    onChanged();
  };

  const handleSend = async () => {
    if (!selectedCleanerId) {
      setError('Select a cleaner');
      return;
    }
    if (!compensation.trim()) {
      setError('Enter the approved cleaner compensation before sending.');
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/offers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cleanerId: selectedCleanerId,
          compensationAmount: Number(compensation),
          compensationBasis,
          ttlMinutes: ttlMinutes ? Number(ttlMinutes) : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to send offer');
      }
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send offer');
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async () => {
    if (!openOffer) return;
    if (!confirm('Cancel this outstanding offer? The job will return to Cleaner needed.')) {
      return;
    }
    setCancelling(true);
    try {
      const res = await fetch(
        `/api/admin/jobs/${jobId}/offers/${openOffer.id}/cancel`,
        { method: 'POST' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to cancel offer');
      }
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel offer');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-semibold text-vm-text">Dispatch</h2>
          <p className="text-sm text-vm-muted mt-1">
            Send an offer. Assignment and Calendar sync happen only after the cleaner accepts.
            Cleaner finish is QC — you still invoice.
          </p>
        </div>
        {data && (
          <span className="rounded-full bg-vm-navy/10 px-3 py-1 text-xs font-semibold text-vm-navy">
            {data.ui.label}
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-vm-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading dispatch…
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 mb-4">
            <div>
              <label className="block text-sm font-medium text-vm-text mb-1">Urgency</label>
              <select
                value={urgency}
                onChange={(e) =>
                  void saveUrgency(e.target.value as 'STANDARD' | 'SAME_DAY' | 'URGENT')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="STANDARD">Standard</option>
                <option value="SAME_DAY">Same day</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-vm-text mb-1">
                Cleaner compensation (required)
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={compensation}
                onChange={(e) => setCompensation(e.target.value)}
                placeholder={
                  data?.compensationPreview != null
                    ? `Preview ${formatMoney(data.compensationPreview)}`
                    : 'Enter approved cleaner pay'
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-vm-muted mt-1">
                Ops-approved snapshot. Never auto-filled from a customer invoice total.
                {data?.compensationPreview != null
                  ? ` Operational preview: ${formatMoney(data.compensationPreview)}.`
                  : ' No operational total — enter the amount manually.'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-vm-text mb-1">
                Payment basis
              </label>
              <select
                value={compensationBasis}
                onChange={(e) =>
                  setCompensationBasis(e.target.value as 'FLAT' | 'HOURLY' | 'OTHER')
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="FLAT">Flat rate</option>
                <option value="HOURLY">Hourly</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-vm-text mb-1">
              Offer TTL override (minutes, optional)
            </label>
            <input
              type="number"
              min="1"
              value={ttlMinutes}
              onChange={(e) => setTtlMinutes(e.target.value)}
              placeholder="Uses env default for this urgency"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          {openOffer && (
            <div className="mb-4 rounded-lg border border-vm-navy/20 bg-vm-navy/5 p-4">
              <p className="font-medium text-vm-text">
                Offer sent to {openOffer.cleanerName || openOffer.cleanerEmail}
              </p>
              <p className="text-sm text-vm-muted mt-1">
                Pay {formatMoney(openOffer.compensationAmount)}
                {openOffer.compensationBasis
                  ? ` (${openOffer.compensationBasis === 'HOURLY' ? 'hourly' : openOffer.compensationBasis === 'OTHER' ? 'other' : 'flat'})`
                  : ''}{' '}
                · <Countdown expiresAt={openOffer.expiresAt} />
              </p>
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={cancelling}
                className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
              >
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Cancel offer
              </button>
            </div>
          )}

          {canSend && !openOffer && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-vm-text">Select cleaner</label>
              <select
                value={selectedCleanerId}
                onChange={(e) => onSelectCleaner(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                disabled={sending}
              >
                <option value="">-- Select a cleaner --</option>
                {cleaners.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.email}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void handleSend()}
                disabled={sending || !selectedCleanerId}
                className="w-full px-4 py-2 bg-vm-navy text-white rounded-lg disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending offer…
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Send offer
                  </>
                )}
              </button>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

          {history.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-vm-muted uppercase tracking-wide mb-2">
                Offer history
              </h3>
              <ul className="space-y-2 text-sm">
                {history.map((o) => (
                  <li key={o.id} className="flex items-center justify-between gap-2">
                    <span>
                      {o.cleanerName || o.cleanerEmail} · {o.status}
                      {o.declineReason ? ` — ${o.declineReason}` : ''}
                    </span>
                    <span className="text-vm-muted">{formatMoney(o.compensationAmount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="mt-4 text-xs text-vm-muted flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Customer invoice totals are not shown to the cleaner.
          </p>
        </>
      )}
    </div>
  );
}
