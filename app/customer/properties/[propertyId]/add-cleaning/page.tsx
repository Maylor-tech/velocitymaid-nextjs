'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { PropertyReadinessBanner } from '@/components/customer/PropertyReadiness';
import type { HostReadinessInput } from '@/lib/properties/propertyReadiness';

const SERVICE_TYPES = [
  'Vacation Rental Turnover',
  'Deep Cleaning & Property Reset',
  'Move-In Cleaning',
  'Move-Out Cleaning',
  'Property Readiness',
  'Emergency Response Cleaning',
  'Property Walkthrough',
] as const;

const inputClass =
  'mt-1 w-full rounded-lg border border-vm-navy/15 px-3 py-2 font-body text-sm text-vm-navy focus:outline-none focus:ring-2 focus:ring-vm-cyan';

export default function AddCleaningPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.propertyId as string;

  const [propertyName, setPropertyName] = useState<string>('');
  const [propertyBrief, setPropertyBrief] = useState<HostReadinessInput | null>(
    null
  );
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [guestCheckInDate, setGuestCheckInDate] = useState('');
  const [guestCheckOutDate, setGuestCheckOutDate] = useState('');
  const [serviceType, setServiceType] = useState<string>(SERVICE_TYPES[0]);
  const [sameDayTurnover, setSameDayTurnover] = useState(false);
  const [checkInDeadline, setCheckInDeadline] = useState('');
  const [jobSpecificNotes, setJobSpecificNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/customer/properties/${propertyId}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Property not found');
        }
        if (!cancelled) {
          setPropertyName(data.property.name);
          setPropertyBrief({
            accessType: data.property.accessType ?? null,
            standingInstructions: data.property.standingInstructions ?? null,
            linenInstructions: data.property.linenInstructions ?? null,
            supplyStorageLocation: data.property.supplyStorageLocation ?? null,
            trashInstructions: data.property.trashInstructions ?? null,
          });
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load property');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (sameDayTurnover && !checkInDeadline.trim()) {
      setError(
        'Check-in deadline is required for same-day turnovers (property-ready deadline).'
      );
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/customer/properties/${propertyId}/cleanings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredDate,
          preferredTime: preferredTime || null,
          guestCheckInDate: guestCheckInDate || null,
          guestCheckOutDate: guestCheckOutDate || null,
          serviceType,
          sameDayTurnover,
          checkInDeadline: sameDayTurnover ? checkInDeadline.trim() : null,
          jobSpecificNotes: jobSpecificNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create cleaning');
      }
      router.push(`/customer/jobs?created=${data.job.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create cleaning');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-vm-cyan" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <Link
          href={`/customer/properties/${propertyId}`}
          className="inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark"
        >
          <ArrowLeft className="h-4 w-4" /> Back to property
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold text-vm-navy">
          Add Cleaning
        </h1>
        <p className="mt-1 font-body text-sm text-vm-muted">
          {propertyName
            ? `For ${propertyName}. Standing property instructions are applied automatically.`
            : 'Standing property instructions are applied automatically.'}
        </p>
      </div>

      <div className="rounded-xl border border-vm-cyan/30 bg-vm-cyan/5 px-4 py-3 font-body text-sm text-vm-navy">
        Cleaning/service date is when VelocityMaid turns the property. Guest
        check-in and checkout are optional stay dates for the Stay Card — they
        are not the same as the cleaning day.
      </div>

      {propertyBrief && (
        <PropertyReadinessBanner property={propertyBrief} propertyId={propertyId} />
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-vm-danger/20 bg-vm-danger-bg px-4 py-3 text-sm text-vm-danger">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-vm-navy/10 bg-vm-white p-6 shadow-sm"
      >
        <label className="block font-body text-sm text-vm-muted">
          Cleaning / service date
          <input
            type="date"
            required
            className={inputClass}
            value={preferredDate}
            onChange={(e) => setPreferredDate(e.target.value)}
          />
          <span className="mt-1 block text-xs text-vm-muted">
            Day our team should clean — often the guest checkout/turnover day,
            but enter the actual service date even if it differs.
          </span>
        </label>

        <label className="block font-body text-sm text-vm-muted">
          Preferred / start time
          <input
            className={inputClass}
            placeholder="e.g. 12:00 - 16:00"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
          />
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block font-body text-sm text-vm-muted">
            Guest check-in date
            <input
              type="date"
              className={inputClass}
              value={guestCheckInDate}
              onChange={(e) => setGuestCheckInDate(e.target.value)}
            />
            <span className="mt-1 block text-xs text-vm-muted">Optional</span>
          </label>
          <label className="block font-body text-sm text-vm-muted">
            Guest checkout date
            <input
              type="date"
              className={inputClass}
              value={guestCheckOutDate}
              onChange={(e) => setGuestCheckOutDate(e.target.value)}
            />
            <span className="mt-1 block text-xs text-vm-muted">
              Optional — Stay Card uses this when set
            </span>
          </label>
        </div>

        <label className="block font-body text-sm text-vm-muted">
          Service type
          <select
            className={inputClass}
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            required
          >
            {SERVICE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <fieldset className="space-y-2">
          <legend className="font-body text-sm text-vm-muted">
            Are new guests checking in the same day?
          </legend>
          <label className="flex items-center gap-2 font-body text-sm text-vm-navy">
            <input
              type="radio"
              name="sameDay"
              checked={!sameDayTurnover}
              onChange={() => {
                setSameDayTurnover(false);
                setCheckInDeadline('');
              }}
            />
            No
          </label>
          <label className="flex items-center gap-2 font-body text-sm text-vm-navy">
            <input
              type="radio"
              name="sameDay"
              checked={sameDayTurnover}
              onChange={() => setSameDayTurnover(true)}
            />
            Yes
          </label>
        </fieldset>

        {sameDayTurnover && (
          <label className="block font-body text-sm text-vm-muted">
            Check-in deadline / time
            <input
              className={inputClass}
              placeholder="e.g. Guest arrives 4:00 PM"
              value={checkInDeadline}
              onChange={(e) => setCheckInDeadline(e.target.value)}
              required
            />
            <span className="mt-1 block text-xs text-vm-muted">
              We&apos;ll use this time as the property-ready deadline.
            </span>
          </label>
        )}

        <p className="rounded-lg bg-vm-surface px-3 py-2 font-body text-xs text-vm-muted">
          Example: Guests stay Oct 9–11, clean Oct 11 → checkout Oct 11, cleaning
          Oct 11. If clean is Oct 12 after a late checkout, set checkout Oct 11
          and cleaning Oct 12 separately.
        </p>

        <label className="block font-body text-sm text-vm-muted">
          Notes for this cleaning (optional)
          <textarea
            className={inputClass}
            rows={3}
            placeholder="Only exceptions for this cleaning — not standing property instructions"
            value={jobSpecificNotes}
            onChange={(e) => setJobSpecificNotes(e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={submitting || !preferredDate}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-vm-cyan px-4 py-3 font-heading text-sm font-semibold text-vm-navy disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scheduling…
            </>
          ) : (
            'Schedule Cleaning'
          )}
        </button>
      </form>
    </div>
  );
}
