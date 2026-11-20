'use client';

import { useState } from 'react';
import type { CompensationMethod } from '@/lib/cleanerComp/pay';

export type HomeSizeExceptionValue = {
  minBedrooms: number;
  method: CompensationMethod;
  rate: number;
  label: string;
};

type HomeSizeExceptionFormProps = {
  cleanerId?: string;
  exception: HomeSizeExceptionValue | null;
  sample?: boolean;
  onSaved?: (label: string | null) => void;
};

export function HomeSizeExceptionForm({
  cleanerId,
  exception,
  sample = false,
  onSaved,
}: HomeSizeExceptionFormProps) {
  const [minBedrooms, setMinBedrooms] = useState(exception ? String(exception.minBedrooms) : '');
  const [method, setMethod] = useState<CompensationMethod>(exception?.method ?? 'FLAT');
  const [rate, setRate] = useState(exception ? String(exception.rate) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedLabel, setSavedLabel] = useState<string | null>(exception?.label ?? null);

  const save = async (next: HomeSizeExceptionValue | null) => {
    if (sample || !cleanerId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/cleaner-pay/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cleanerId,
          homeSizeException: next
            ? { minBedrooms: next.minBedrooms, method: next.method, rate: next.rate }
            : null,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: string; homeSizeException?: string | null };
      if (!res.ok || !json.success) throw new Error(json.error || 'Could not save the home-size exception');
      const label = json.homeSizeException ?? null;
      setSavedLabel(label);
      onSaved?.(label);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the home-size exception');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-[14px] border border-vm-line bg-white p-4">
      <h2 className="font-heading text-lg font-bold text-vm-navy">Home-size exception</h2>
      <p className="mt-1 font-body text-sm text-vm-text">
        {savedLabel
          ? `${savedLabel}. Smaller homes stay on the standard solo terms.`
          : 'No home-size exception is set. A 4+ bedroom solo clean stays on the standard solo terms.'}
      </p>
      <p className="mt-1 font-body text-sm text-vm-muted">
        No add-on pay rule is set. Add-on amounts stay out of the percentage base unless an agreement marks them included.
      </p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="font-body text-sm font-medium text-vm-text" htmlFor="home-size-bedrooms">
          Bedrooms, minimum
          <input
            id="home-size-bedrooms"
            inputMode="numeric"
            value={minBedrooms}
            disabled={sample || saving}
            placeholder=""
            onChange={(event) => setMinBedrooms(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-[10px] border border-vm-line px-3 font-body text-sm text-vm-text outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan"
          />
        </label>
        <label className="font-body text-sm font-medium text-vm-text" htmlFor="home-size-method">
          Solo method
          <select
            id="home-size-method"
            value={method}
            disabled={sample || saving}
            onChange={(event) => setMethod(event.target.value as CompensationMethod)}
            className="mt-1 min-h-11 w-full rounded-[10px] border border-vm-line bg-white px-3 font-body text-sm text-vm-text outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan"
          >
            <option value="FLAT">Flat</option>
            <option value="PERCENTAGE">Percentage</option>
            <option value="HOURLY">Hourly</option>
          </select>
        </label>
        <label className="font-body text-sm font-medium text-vm-text" htmlFor="home-size-rate">
          Amount
          <input
            id="home-size-rate"
            inputMode="decimal"
            value={rate}
            disabled={sample || saving}
            placeholder="Amount"
            onChange={(event) => setRate(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-[10px] border border-vm-line px-3 font-body text-sm text-vm-text outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan"
          />
        </label>
      </div>
      {sample ? null : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={saving || !cleanerId}
            onClick={() =>
              void save({
                minBedrooms: Number(minBedrooms),
                method,
                rate: Number(rate),
                label: '',
              })
            }
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] bg-vm-navy px-4 font-body text-sm font-semibold text-white outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan disabled:opacity-50"
          >
            Save exception
          </button>
          <button
            type="button"
            disabled={saving || !cleanerId || !savedLabel}
            onClick={() => {
              setMinBedrooms('');
              setMethod('FLAT');
              setRate('');
              void save(null);
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-[10px] border border-vm-navy px-4 font-body text-sm font-semibold text-vm-navy outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan disabled:opacity-50"
          >
            Remove exception
          </button>
        </div>
      )}
      {error ? <p className="mt-2 font-body text-sm text-vm-danger">{error}</p> : null}
    </section>
  );
}
