"use client";

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle, Clock, Loader2, Mail, UserMinus, XCircle } from 'lucide-react';
import { isEffectivelyOpen, effectiveOfferStatus } from '@/lib/dispatch/offerExpiry';
import {
  offerNotificationLabel,
  type OfferNotificationView,
} from '@/lib/dispatch/offerNotification';
import {
  RELEASE_REASON_CODES,
  RELEASE_REASON_LABELS,
  type ReleaseReasonCode,
} from '@/lib/dispatch/releaseReasons';
import {
  offerChoicesForCleaner,
  soloPercentageAllowed,
  type CleanerTerms,
  type CompensationMethod,
  type TaxPaperwork,
} from '@/lib/cleanerComp/pay';

type OfferRow = {
  id: string;
  status: string;
  effectiveStatus?: string;
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
  compensationOverrideReason?: string | null;
};

type DispatchPayload = {
  success: boolean;
  dispatchOffersEnabled: boolean;
  dispatchUrgency: 'STANDARD' | 'SAME_DAY' | 'URGENT';
  estimatedDurationMins: number | null;
  compensationPreview: number | null;
  durationPreviewMins?: number | null;
  assignedCleanerId?: string | null;
  assignedCleanerName?: string | null;
  ui: { state: string; label: string };
  latestRelease?: {
    cleanerId: string | null;
    cleanerName: string | null;
    reason: string | null;
    reasonCode: string | null;
    notes: string | null;
    offerId: string | null;
    createdAt: string;
  } | null;
  offerNotification?: OfferNotificationView;
  ttl?: {
    defaultMinutes: number;
    defaultLabel: string;
    source: string;
    overrideUsed: boolean;
    expiresAt: string | null;
  };
  offers: OfferRow[];
};

function formatNotificationTime(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

interface CleanerOption {
  id: string;
  name: string | null;
  email: string;
}

interface DispatchPanelProps {
  jobId: string;
  enabled: boolean;
  canSend: boolean;
  /** When false, preserve offer history but hide Send/Cancel/Resend/Release CTAs. */
  mutationsAllowed?: boolean;
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
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const remaining = new Date(expiresAt).getTime() - nowMs;
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
  mutationsAllowed = true,
  cleaners,
  selectedCleanerId,
  onSelectCleaner,
  onChanged,
}: DispatchPanelProps) {
  const [data, setData] = useState<DispatchPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resending, setResending] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [releaseReason, setReleaseReason] = useState<ReleaseReasonCode>('CLEANER_UNAVAILABLE');
  const [releaseNotes, setReleaseNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [payChoice, setPayChoice] = useState<'solo' | 'assisted' | 'custom'>('custom');
  const [customMethod, setCustomMethod] = useState<CompensationMethod>('PERCENTAGE');
  const [customRate, setCustomRate] = useState('');
  const [customAssisted, setCustomAssisted] = useState(false);
  const [payReason, setPayReason] = useState('');
  const [manualBase, setManualBase] = useState('');
  const [storedTerms, setStoredTerms] = useState<CleanerTerms | null>(null);
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [paperwork, setPaperwork] = useState<TaxPaperwork | null>(null);
  const [durationMins, setDurationMins] = useState('');
  const [ttlMinutes, setTtlMinutes] = useState('');
  const [urgency, setUrgency] = useState<'STANDARD' | 'SAME_DAY' | 'URGENT'>('STANDARD');
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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
      setDurationMins((current) =>
        current || json.durationPreviewMins == null
          ? current
          : String(json.durationPreviewMins)
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

  useEffect(() => {
    if (!selectedCleanerId) {
      setStoredTerms(null);
      setBedrooms(null);
      setPaperwork(null);
      return;
    }
    let cancelled = false;
    void fetch(
      `/api/admin/cleaner-pay/terms?cleanerId=${encodeURIComponent(selectedCleanerId)}&jobId=${encodeURIComponent(jobId)}`
    )
      .then((res) => res.json())
      .then((json: { success?: boolean; terms?: CleanerTerms | null; paperwork?: TaxPaperwork; bedrooms?: number | null }) => {
        if (cancelled || !json.success) return;
        setStoredTerms(json.terms ?? null);
        setBedrooms(json.bedrooms ?? null);
        setPaperwork(json.paperwork ?? { type: 'W9', status: 'MISSING' });
      })
      .catch(() => {
        if (!cancelled) {
          setStoredTerms(null);
          setBedrooms(null);
          setPaperwork(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCleanerId, jobId]);

  if (!enabled) return null;

  const clock = new Date(nowMs);
  const openOffer =
    data?.offers.find((o) => isEffectivelyOpen(o, clock)) ?? null;
  const history =
    data?.offers.filter((o) => !isEffectivelyOpen(o, clock)) ?? [];

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
    const choices = offerChoicesForCleaner(storedTerms, paperwork, bedrooms);
    const choice = choices.some((row) => row.id === payChoice)
      ? payChoice
      : choices.length === 0
        ? 'custom'
        : choices[0].id;
    if (choice === 'custom' && (!customRate.trim() || Number(customRate) <= 0)) {
      setError('Enter this cleaner’s rate. No default is assumed.');
      return;
    }
    if ((choice === 'solo' || (choice === 'custom' && customMethod === 'PERCENTAGE')) && !soloPercentageAllowed(paperwork)) {
      setError('Solo percentage offers need tax paperwork on file. Assisted hourly is still allowed.');
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
          compensationAmount: choice === 'custom' ? Number(customRate) : undefined,
          agreement:
            choice === 'custom'
              ? {
                  choice,
                  method: customMethod,
                  rate: Number(customRate),
                  assisted: customAssisted,
                  note: payReason.trim() || null,
                  manualBase: manualBase.trim() ? Number(manualBase) : null,
                }
              : { choice, note: payReason.trim() || null, manualBase: manualBase.trim() ? Number(manualBase) : null },
          compensationOverrideReason: payReason.trim() || undefined,
          estimatedDurationMins: durationMins.trim() ? Number(durationMins) : undefined,
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

  const handleRelease = async () => {
    if (!data?.assignedCleanerId) return;
    if (
      !confirm(
        'This removes the cleaner from the job but preserves the accepted offer and assignment history. The job will return to Cleaner Needed.'
      )
    ) {
      return;
    }
    setReleasing(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/release-cleaner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedCleanerId: data.assignedCleanerId,
          reason: releaseReason,
          notes: releaseNotes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to release cleaner');
      }
      setReleaseNotes('');
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to release cleaner');
    } finally {
      setReleasing(false);
    }
  };

  const handleResend = async () => {
    if (!openOffer) return;
    setResending(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/jobs/${jobId}/offers/${openOffer.id}/resend`,
        { method: 'POST' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to resend notification');
      }
      await load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend notification');
    } finally {
      setResending(false);
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

      {data?.offerNotification && (
        <div
          className={`mb-4 rounded-lg border px-3 py-2 text-sm ${
            data.offerNotification.status === 'FAILED'
              ? 'border-red-200 bg-red-50 text-red-800'
              : data.offerNotification.status === 'SENT'
                ? 'border-vm-success/30 bg-vm-success-bg text-vm-success'
                : 'border-gray-200 bg-gray-50 text-vm-muted'
          }`}
        >
          <span className="font-medium">Offer email: </span>
          {offerNotificationLabel(data.offerNotification.status)}
          {formatNotificationTime(data.offerNotification.recordedAt)
            ? ` · ${formatNotificationTime(data.offerNotification.recordedAt)}`
            : ''}
          {data.offerNotification.attemptCount > 0
            ? ` · ${data.offerNotification.attemptCount} attempt${
                data.offerNotification.attemptCount === 1 ? '' : 's'
              }`
            : ''}
        </div>
      )}

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
              <p className="block text-sm font-medium text-vm-text mb-1">Cleaner compensation</p>
              {offerChoicesForCleaner(storedTerms, paperwork, bedrooms).length > 0 ? (
                <div className="flex flex-col gap-2">
                  {offerChoicesForCleaner(storedTerms, paperwork, bedrooms).map((choice) => (
                    <button
                      key={choice.id}
                      type="button"
                      aria-pressed={(payChoice === 'custom' ? 'solo' : payChoice) === choice.id}
                      onClick={() => setPayChoice(choice.id)}
                      className={`min-h-11 rounded-[10px] border px-3 text-left font-body text-sm font-semibold ${
                        payChoice === choice.id
                          ? 'border-vm-navy bg-vm-navy text-white'
                          : 'border-gray-300 bg-white text-vm-navy'
                      }`}
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <p className="font-body text-sm text-vm-muted">
                    No default for this cleaner. Set the method and rate for this assignment.
                  </p>
                  <label className="font-body text-sm font-medium text-vm-text" htmlFor="custom-method">
                    Method
                  </label>
                  <select
                    id="custom-method"
                    value={customMethod}
                    onChange={(e) => setCustomMethod(e.target.value as CompensationMethod)}
                    className="min-h-11 w-full rounded-[10px] border border-gray-300 px-3 font-body text-sm"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="HOURLY">Hourly</option>
                    <option value="FLAT">Flat</option>
                  </select>
                  <label className="font-body text-sm font-medium text-vm-text" htmlFor="custom-rate">
                    Rate
                  </label>
                  <input
                    id="custom-rate"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    placeholder={customMethod === 'PERCENTAGE' ? 'Percent' : 'Dollars'}
                    className="min-h-11 w-full rounded-[10px] border border-gray-300 px-3 font-body text-sm"
                  />
                  <label className="inline-flex min-h-11 items-center gap-2 font-body text-sm text-vm-text">
                    <input
                      type="checkbox"
                      checked={customAssisted}
                      onChange={(e) => setCustomAssisted(e.target.checked)}
                    />
                    Assisted — owner works alongside
                  </label>
                </div>
              )}
              <p className="mt-2 font-body text-sm text-vm-muted">
                {storedTerms?.homeSizeException
                  ? `${storedTerms.homeSizeException.minBedrooms}+ bedroom solo uses the saved exception. Smaller homes stay on the standard solo terms.`
                  : storedTerms
                    ? 'No home-size exception is set. A 4+ bedroom solo clean stays on the standard solo terms.'
                    : 'Set terms for this cleaner before sending an offer. No default is assumed.'}
                {' '}
                No add-on pay rule is set. Add-on amounts stay out of the percentage base unless this agreement marks them included.
              </p>
              {!soloPercentageAllowed(paperwork) ? (
                <p className="mt-1 font-body text-sm text-vm-muted">
                  Tax paperwork is missing. Solo percentage offers stay blocked. Assisted hourly is allowed.
                </p>
              ) : null}
              <label className="mt-3 block font-body text-sm font-medium text-vm-text" htmlFor="manual-base">
                Percentage base
              </label>
              <input
                id="manual-base"
                inputMode="decimal"
                value={manualBase}
                onChange={(e) => setManualBase(e.target.value)}
                placeholder="Job price, or a typed share"
                className="mt-1 min-h-11 w-full rounded-[10px] border border-gray-300 px-3 font-body text-sm"
              />
              <label className="mt-3 block font-body text-sm font-medium text-vm-text" htmlFor="pay-override-reason">
                Note
              </label>
              <input
                id="pay-override-reason"
                type="text"
                value={payReason}
                onChange={(e) => setPayReason(e.target.value)}
                placeholder="Optional"
                className="mt-1 min-h-11 w-full rounded-[10px] border border-gray-300 px-3 font-body text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-vm-text mb-1" htmlFor="offer-duration">
                Est. duration (minutes)
              </label>
              <input
                id="offer-duration"
                type="number"
                min="1"
                step="1"
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                placeholder={
                  data?.durationPreviewMins != null
                    ? `Default ${data.durationPreviewMins} min`
                    : 'Enter minutes'
                }
                className="min-h-11 w-full rounded-[10px] border border-gray-300 px-3 font-body text-sm"
              />
              <p className="mt-1 font-body text-sm text-vm-muted">
                Default from bedrooms: 2 bed 3h, 3 bed 5h, 4 bed 6h, large 4 bed 7h.
                Split across the crew when more than one cleaner is assigned. Change it here to override.
              </p>
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
              placeholder={
                data?.ttl
                  ? `Default ${data.ttl.defaultMinutes} min`
                  : 'Uses service-aware default'
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            {data?.ttl && (
              <p className="text-xs text-vm-muted mt-1">
                Service-aware default: {data.ttl.defaultLabel}
                {ttlMinutes.trim() ? ' · Custom override will be used (still clamped before service).' : ''}
              </p>
            )}
          </div>

          {data?.assignedCleanerId && mutationsAllowed && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="font-medium text-vm-text">
                Assigned to {data.assignedCleanerName || 'cleaner'}
              </p>
              <p className="text-sm text-vm-muted mt-1">
                Release cleaner is a recovery action. It does not rewrite the accepted offer, compensation, or customer price.
              </p>
              <label className="block text-sm font-medium text-vm-text mt-3 mb-1">
                Release reason
              </label>
              <select
                value={releaseReason}
                onChange={(e) => setReleaseReason(e.target.value as ReleaseReasonCode)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
                disabled={releasing}
              >
                {RELEASE_REASON_CODES.map((code) => (
                  <option key={code} value={code}>
                    {RELEASE_REASON_LABELS[code]}
                  </option>
                ))}
              </select>
              <label className="block text-sm font-medium text-vm-text mt-3 mb-1">
                Notes {releaseReason === 'OTHER' ? '(required)' : '(optional)'}
              </label>
              <textarea
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                rows={2}
                disabled={releasing}
              />
              <button
                type="button"
                onClick={() => void handleRelease()}
                disabled={releasing}
                className="mt-3 inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-amber-300 text-amber-900 hover:bg-amber-100 disabled:opacity-50"
              >
                {releasing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserMinus className="h-4 w-4" />}
                Release cleaner
              </button>
            </div>
          )}

          {data?.assignedCleanerId && !mutationsAllowed && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="font-medium text-vm-text">
                Assigned to {data.assignedCleanerName || 'cleaner'}
              </p>
              <p className="text-sm text-vm-muted mt-1">
                Dispatch mutations are closed for this job. Accepted offer compensation is preserved.
              </p>
            </div>
          )}

          {!data?.assignedCleanerId && data?.latestRelease && mutationsAllowed && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="font-medium text-vm-text">Cleaner needed</p>
              <p className="text-sm text-vm-muted mt-1">
                Previous assignment:{' '}
                {data.latestRelease.cleanerName || 'Cleaner'} — Accepted → Released
              </p>
              <p className="text-sm text-vm-text mt-1">
                Reason: {data.latestRelease.reason || data.latestRelease.reasonCode}
              </p>
              {formatNotificationTime(data.latestRelease.createdAt) && (
                <p className="text-sm text-vm-muted mt-1">
                  {formatNotificationTime(data.latestRelease.createdAt)}
                </p>
              )}
              {data.latestRelease.notes && (
                <p className="text-sm text-vm-muted mt-1">{data.latestRelease.notes}</p>
              )}
            </div>
          )}

          {!mutationsAllowed && (
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-sm text-vm-muted">
                Dispatch is closed for this job. Offer history below is preserved; no new offers or assignment changes.
              </p>
            </div>
          )}

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
              <p className="text-sm text-vm-text mt-2">
                Expires {formatNotificationTime(openOffer.expiresAt) || openOffer.expiresAt}
              </p>
              {data?.ttl && (
                <p className="text-xs text-vm-muted mt-1">
                  {data.ttl.overrideUsed
                    ? 'Custom TTL override is in effect.'
                    : data.ttl.defaultLabel}
                </p>
              )}
              {mutationsAllowed && (
                <>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleResend()}
                      disabled={resending || cancelling}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-vm-navy/30 text-vm-navy hover:bg-vm-navy/10 disabled:opacity-50"
                    >
                      {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      Resend notification
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCancel()}
                      disabled={cancelling || resending}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                      Cancel offer
                    </button>
                  </div>
                  <p className="text-xs text-vm-muted mt-2">
                    Resend notification only when this offer is still live. It does not create a new offer or change pay or expiry.
                  </p>
                </>
              )}
            </div>
          )}

          {canSend && mutationsAllowed && !openOffer && (
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
                      {o.cleanerName || o.cleanerEmail} · {effectiveOfferStatus(o, clock)}
                      {o.declineReason ? ` — ${o.declineReason}` : ''}
                      {o.compensationOverrideReason ? ` — ${o.compensationOverrideReason}` : ''}
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
