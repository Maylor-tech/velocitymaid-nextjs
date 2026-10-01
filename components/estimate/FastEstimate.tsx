'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, MapPin, Sparkles } from 'lucide-react';
import type { ServiceType } from '@/components/booking/types';
import {
  serviceOptionsForMarket,
  type BookingMarketCode,
} from '@/lib/booking/markets';
import { NJ_LEAD_PATH } from '@/lib/markets/newJersey';
import type { EstimateRange } from '@/lib/estimate/fastEstimate';

type Phase = 'where' | 'details' | 'done';

type EstimateResult = {
  pricingVisible: boolean;
  range: EstimateRange | null;
  label: string | null;
};

const URGENCY_OPTIONS = [
  { value: 'ASAP', label: 'As soon as possible' },
  { value: 'THIS_WEEK', label: 'This week' },
  { value: 'THIS_MONTH', label: 'This month' },
  { value: 'FLEXIBLE', label: "I'm flexible" },
];

function marketFromBranchSlug(slug: string): BookingMarketCode | null {
  if (slug === 'new-jersey') return 'new-jersey';
  if (slug.startsWith('vermont')) return 'vermont';
  return 'vermont';
}

function formatUsd(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function FastEstimate() {
  const [phase, setPhase] = useState<Phase>('where');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [zip, setZip] = useState('');
  const [branchSlug, setBranchSlug] = useState<string | null>(null);
  const [market, setMarket] = useState<BookingMarketCode | null>(null);

  const [serviceType, setServiceType] = useState<ServiceType | ''>('');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [pets, setPets] = useState(false);
  const [frequency, setFrequency] = useState<
    'WEEKLY' | 'BIWEEKLY' | 'MONTHLY'
  >('BIWEEKLY');

  const [estimate, setEstimate] = useState<EstimateResult | null>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [urgency, setUrgency] = useState('THIS_WEEK');

  const serviceOptions = serviceOptionsForMarket(market);
  const publicPricing = branchSlug !== 'new-jersey';

  async function resolveArea() {
    setError(null);
    const trimmed = zip.trim();
    if (trimmed.length < 5) {
      setError('Please enter a valid ZIP code.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/resolve-zip?zip=${encodeURIComponent(trimmed)}`
      );
      const data = await res.json();
      if (!data.success || !data.branchSlug) {
        setError(
          "We don't serve that ZIP yet — but we're expanding. Try another nearby ZIP."
        );
        return;
      }
      const slug = data.branchSlug as string;
      setBranchSlug(slug);
      setMarket(marketFromBranchSlug(slug));
      setServiceType('');
      setEstimate(null);
      setPhase('details');
    } catch {
      setError('Something went wrong resolving your area. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function computeEstimate() {
    setError(null);
    if (!serviceType) {
      setError('Please choose a service.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/estimate/quick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchSlug,
          serviceType,
          bedrooms,
          bathrooms,
          pets,
          frequency: serviceType === 'RECURRING' ? frequency : null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError('We could not calculate an estimate for those details.');
        return;
      }
      if (data.pricingVisible) {
        setEstimate({ pricingVisible: true, range: data.range, label: null });
      } else {
        setEstimate({
          pricingVisible: false,
          range: null,
          label: data.label ?? 'Custom quote',
        });
      }
    } catch {
      setError('Something went wrong calculating your estimate.');
    } finally {
      setLoading(false);
    }
  }

  async function submitLead() {
    setError(null);
    if (!name.trim() || !phone.trim()) {
      setError('Please share your name and phone so we can follow up.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/leads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          zip: zip.trim(),
          urgency,
          bedrooms,
          bathrooms,
          pets,
          serviceType: serviceType || undefined,
          branch: branchSlug,
          source: 'fast-estimate',
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'We could not submit your request. Please try again.');
        return;
      }
      setPhase('done');
    } catch {
      setError('Something went wrong submitting your request.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-vm-border bg-vm-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-vm-cyan" />
        <h2 className="font-heading text-xl font-bold text-vm-navy">
          Get a fast estimate
        </h2>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-vm-danger/30 bg-vm-danger-bg px-4 py-3 font-body text-sm text-vm-danger">
          {error}
        </div>
      )}

      {phase === 'where' && (
        <div className="space-y-4">
          <p className="font-body text-sm text-vm-muted">
            Enter your ZIP code and we&apos;ll check if we serve your area.
          </p>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 font-body text-sm font-medium text-vm-navy">
              <MapPin className="h-4 w-4" /> ZIP code
            </span>
            <input
              inputMode="numeric"
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && resolveArea()}
              placeholder="e.g. 05753"
              className="w-full rounded-lg border border-vm-border px-3 py-2.5 font-body text-vm-text outline-none focus:border-vm-cyan"
            />
          </label>
          <button
            type="button"
            onClick={resolveArea}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-vm-navy px-4 py-3 font-heading text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Check my area
          </button>
        </div>
      )}

      {phase === 'details' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-vm-cyan-tint px-3 py-1 font-body text-xs font-medium text-vm-navy">
              Serving {zip.trim()}
            </span>
            <button
              type="button"
              onClick={() => {
                setPhase('where');
                setEstimate(null);
              }}
              className="font-body text-xs font-semibold text-vm-cyan-dark hover:underline"
            >
              Change ZIP
            </button>
          </div>

          <label className="block">
            <span className="mb-1 block font-body text-sm font-medium text-vm-navy">
              Service
            </span>
            <select
              value={serviceType}
              onChange={(e) => {
                setServiceType(e.target.value as ServiceType);
                setEstimate(null);
              }}
              className="w-full rounded-lg border border-vm-border bg-vm-white px-3 py-2.5 font-body text-vm-text outline-none focus:border-vm-cyan"
            >
              <option value="">Select a service…</option>
              {serviceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          {serviceType === 'RECURRING' && (
            <label className="block">
              <span className="mb-1 block font-body text-sm font-medium text-vm-navy">
                How often?
              </span>
              <select
                value={frequency}
                onChange={(e) => {
                  setFrequency(e.target.value as typeof frequency);
                  setEstimate(null);
                }}
                className="w-full rounded-lg border border-vm-border bg-vm-white px-3 py-2.5 font-body text-vm-text outline-none focus:border-vm-cyan"
              >
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Every 2 weeks</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </label>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block font-body text-sm font-medium text-vm-navy">
                Bedrooms
              </span>
              <input
                type="number"
                min={1}
                max={12}
                value={bedrooms}
                onChange={(e) => {
                  setBedrooms(Number(e.target.value));
                  setEstimate(null);
                }}
                className="w-full rounded-lg border border-vm-border px-3 py-2.5 font-body text-vm-text outline-none focus:border-vm-cyan"
              />
            </label>
            <label className="block">
              <span className="mb-1 block font-body text-sm font-medium text-vm-navy">
                Bathrooms
              </span>
              <input
                type="number"
                min={1}
                max={12}
                value={bathrooms}
                onChange={(e) => {
                  setBathrooms(Number(e.target.value));
                  setEstimate(null);
                }}
                className="w-full rounded-lg border border-vm-border px-3 py-2.5 font-body text-vm-text outline-none focus:border-vm-cyan"
              />
            </label>
          </div>

          <label className="flex cursor-pointer items-center gap-2 font-body text-sm text-vm-navy">
            <input
              type="checkbox"
              checked={pets}
              onChange={(e) => {
                setPets(e.target.checked);
                setEstimate(null);
              }}
              className="h-4 w-4 rounded border-vm-border"
            />
            Pets in the home
          </label>

          {!estimate && (
            <button
              type="button"
              onClick={computeEstimate}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-vm-navy px-4 py-3 font-heading text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              See my estimate
            </button>
          )}

          {estimate &&
            (estimate.pricingVisible && estimate.range ? (
              <div className="rounded-xl border border-vm-cyan/40 bg-vm-cyan-tint/40 p-5 text-center">
                <p className="font-body text-xs font-semibold uppercase tracking-wide text-vm-muted">
                  Estimated range
                </p>
                <p className="mt-1 font-heading text-2xl font-bold text-vm-navy">
                  {formatUsd(estimate.range.low, estimate.range.currency)} –{' '}
                  {formatUsd(estimate.range.high, estimate.range.currency)}
                </p>
                <p className="mt-1 font-body text-xs text-vm-muted">
                  Ballpark only — final price is confirmed after a quick review.
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-vm-border bg-vm-surface p-5 text-center">
                <p className="font-heading text-lg font-bold text-vm-navy">
                  {estimate.label}
                </p>
                <p className="mt-1 font-body text-sm text-vm-muted">
                  We tailor pricing for your area. Share a few details and our
                  team will send your personalized quote.
                </p>
                <Link
                  href={NJ_LEAD_PATH}
                  className="mt-4 inline-flex items-center justify-center rounded-lg bg-vm-navy px-5 py-2.5 font-heading text-sm font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Request my quote
                </Link>
              </div>
            ))}

          {estimate && publicPricing && (
            <div className="space-y-4 border-t border-vm-border pt-5">
              <p className="font-body text-sm font-medium text-vm-navy">
                Want us to lock it in? Tell us where to reach you.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block font-body text-sm font-medium text-vm-navy">
                    Name
                  </span>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg border border-vm-border px-3 py-2.5 font-body text-vm-text outline-none focus:border-vm-cyan"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block font-body text-sm font-medium text-vm-navy">
                    Phone
                  </span>
                  <input
                    inputMode="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border border-vm-border px-3 py-2.5 font-body text-vm-text outline-none focus:border-vm-cyan"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block font-body text-sm font-medium text-vm-navy">
                  Email <span className="text-vm-muted">(optional)</span>
                </span>
                <input
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-vm-border px-3 py-2.5 font-body text-vm-text outline-none focus:border-vm-cyan"
                />
              </label>
              <label className="block">
                <span className="mb-1 block font-body text-sm font-medium text-vm-navy">
                  When do you need it?
                </span>
                <select
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                  className="w-full rounded-lg border border-vm-border bg-vm-white px-3 py-2.5 font-body text-vm-text outline-none focus:border-vm-cyan"
                >
                  {URGENCY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={submitLead}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-vm-cyan px-4 py-3 font-heading text-sm font-semibold text-vm-navy transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send my request
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="py-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-vm-success-bg">
            <Sparkles className="h-6 w-6 text-vm-success" />
          </div>
          <h3 className="font-heading text-xl font-bold text-vm-navy">
            Request received
          </h3>
          <p className="mt-2 font-body text-sm text-vm-muted">
            Thanks, {name.split(' ')[0] || 'there'}! Our team will reach out
            shortly to confirm your details and lock in your clean.
          </p>
        </div>
      )}
    </div>
  );
}
