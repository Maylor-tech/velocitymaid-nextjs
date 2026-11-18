'use client';

import { useState } from 'react';
import { formatOfferLifecycleLabel } from '@/lib/dispatch/offerLifecycleLabel';

export type CleanerOfferCardProps = {
  title: string;
  respondByLabel: string;
  compensationDisplay: string;
  compensationBasisLabel: string;
  scheduleText: string;
  jobTypeText: string;
  lifecycleLabel: string;
  expired?: boolean;
  processing?: boolean;
  declineReason: string;
  onDeclineReasonChange: (value: string) => void;
  onAccept: () => void;
  onDecline: () => void;
  error?: string | null;
  feedback?: string | null;
  /** Dev fixtures only — never set on real cleaner routes. */
  sampleNote?: boolean;
};

export function CleanerOfferCard({
  title,
  respondByLabel,
  compensationDisplay,
  compensationBasisLabel,
  scheduleText,
  jobTypeText,
  lifecycleLabel,
  expired = false,
  processing = false,
  declineReason,
  onDeclineReasonChange,
  onAccept,
  onDecline,
  error,
  feedback,
  sampleNote = false,
}: CleanerOfferCardProps) {
  const [confirmingDecline, setConfirmingDecline] = useState(false);

  return (
    <>
      <h1 className="font-heading text-[26px] font-bold leading-[1.2] tracking-tight text-vm-navy">
        {expired ? 'Offer expired' : 'New offer'}
      </h1>

      {error ? (
        <div
          className="rounded-[10px] border border-vm-danger/30 bg-vm-danger-bg px-3.5 py-3 font-body text-[13px] text-vm-danger"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {feedback ? (
        <div className="rounded-[10px] border border-vm-success/30 bg-vm-success/10 px-3.5 py-3 font-body text-[13px] text-vm-success">
          {feedback}
        </div>
      ) : null}

      <section className="flex flex-col gap-3 rounded-[14px] border border-vm-line bg-white p-[18px]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-lg font-bold leading-[1.2] tracking-tight text-vm-navy">
            {title}
          </h2>
          <span className="rounded-full bg-vm-warning-bg px-2.5 py-1 font-body text-[11px] font-bold text-vm-warning">
            {respondByLabel}
          </span>
        </div>

        <div className="border-t border-vm-line pt-3">
          <p className="font-body text-xs font-bold uppercase tracking-wide text-vm-muted">
            Compensation
          </p>
          <p className="font-heading text-[26px] font-bold text-vm-navy">
            {compensationDisplay}{' '}
            <span className="text-[13px] font-normal text-vm-muted">
              {compensationBasisLabel.toLowerCase()}
            </span>
          </p>
        </div>

        <div className="border-t border-vm-line pt-3">
          <p className="font-body text-xs font-bold uppercase tracking-wide text-vm-muted">
            Schedule
          </p>
          <p className="font-body text-sm text-vm-text">{scheduleText}</p>
        </div>

        <div className="border-t border-vm-line pt-3">
          <p className="font-body text-xs font-bold uppercase tracking-wide text-vm-muted">
            Job
          </p>
          <p className="font-body text-sm text-vm-text">{jobTypeText}</p>
        </div>

        <div className="border-t border-vm-line pt-3">
          <p className="font-body text-xs font-bold uppercase tracking-wide text-vm-muted">
            Offer state
          </p>
          <p className="font-body text-sm text-vm-text">{lifecycleLabel}</p>
        </div>
      </section>

      {!expired && confirmingDecline ? (
        <>
          <label className="block font-body text-xs text-vm-muted">
            Optional decline reason
            <input
              type="text"
              value={declineReason}
              onChange={(e) => onDeclineReasonChange(e.target.value)}
              disabled={processing}
              className="mt-1 min-h-11 w-full rounded-[10px] border border-vm-field-border bg-white px-3 py-2 font-body text-sm text-vm-text outline-none focus-visible:ring-2 focus-visible:ring-vm-cyan disabled:opacity-60"
              placeholder="Optional"
            />
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setConfirmingDecline(false);
                onDeclineReasonChange('');
              }}
              disabled={processing}
              className="min-h-12 rounded-[10px] border border-vm-field-border bg-white font-body text-sm font-bold text-vm-navy outline-none focus-visible:ring-2 focus-visible:ring-vm-cyan disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onDecline}
              disabled={processing}
              className="min-h-12 rounded-[10px] bg-vm-navy font-body text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-vm-cyan focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? 'Working…' : 'Confirm decline'}
            </button>
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => setConfirmingDecline(true)}
            disabled={expired || processing}
            className="min-h-12 rounded-[10px] border border-vm-field-border bg-white font-body text-sm font-bold text-vm-navy outline-none focus-visible:ring-2 focus-visible:ring-vm-cyan disabled:cursor-not-allowed disabled:opacity-50"
          >
            Decline
          </button>
          <button
            type="button"
            onClick={onAccept}
            disabled={expired || processing}
            className="min-h-12 rounded-[10px] bg-vm-navy font-body text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-vm-cyan focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {processing ? 'Working…' : 'Accept offer'}
          </button>
        </div>
      )}

      <div className="rounded-[10px] border border-vm-cyan-border bg-vm-cyan-tint px-3.5 py-3 font-body text-[13px] text-vm-navy">
        You&apos;re assigned only after you accept.
        {sampleNote ? ' Sample offer, not live.' : ''}
      </div>
    </>
  );
}

/** Helpers for wiring production offer payloads into the card. */
export function formatRespondByLabel(
  expiresAt: string,
  expired: boolean,
  now = new Date()
): string {
  if (expired) return 'Expired';
  const end = new Date(expiresAt);
  if (Number.isNaN(end.getTime())) return 'Respond soon';
  const time = end.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: end.getMinutes() === 0 ? undefined : '2-digit',
    hour12: true,
  });
  const sameDay = end.toDateString() === now.toDateString();
  return sameDay
    ? `Respond by ${time}`
    : `Respond by ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${time}`;
}

export function formatOfferLifecycleForCleaner(args: {
  status: string;
  expiresAt: string;
  expired: boolean;
}): string {
  return formatOfferLifecycleLabel({
    offer: { status: args.status, expiresAt: args.expiresAt },
    notification: { status: 'NOT_RECORDED' },
    jobAssigned: false,
  });
}

export default CleanerOfferCard;
