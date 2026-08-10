'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';

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
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
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
        if (!cancelled) setPropertyName(data.property.name);
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
    try {
      const res = await fetch(`/api/customer/properties/${propertyId}/cleanings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferredDate,
          preferredTime: preferredTime || null,
          serviceType,
          sameDayTurnover,
          checkInDeadline: checkInDeadline || null,
          jobSpecificNotes: jobSpecificNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create cleaning');
      }
      router.push(`/customer/properties/${propertyId}?created=${data.job.id}`);
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
            Same-day turnover?
          </legend>
          <label className="flex items-center gap-2 font-body text-sm text-vm-navy">
            <input
              type="radio"
              name="sameDay"
              checked={!sameDayTurnover}
              onChange={() => setSameDayTurnover(false)}
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

        <label className="block font-body text-sm text-vm-muted">
          Check-in deadline / time (optional)
          <input
            className={inputClass}
            placeholder="e.g. Guest arrives 4:00 PM"
            value={checkInDeadline}
            onChange={(e) => setCheckInDeadline(e.target.value)}
          />
        </label>

        <label className="block font-body text-sm text-vm-muted">
          Reservation-specific notes (optional)
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
            'Submit cleaning request'
          )}
        </button>
      </form>
    </div>
  );
}
