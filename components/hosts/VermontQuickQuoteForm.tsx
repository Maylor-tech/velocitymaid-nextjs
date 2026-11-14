"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics/trackEvent";
import {
  attributionAnalyticsParams,
  hasAttribution,
  mergeAttributionFirstTouch,
  parseAttributionFromSearchParams,
  readStoredAttribution,
  writeStoredAttribution,
  type HostAttribution,
} from "@/lib/hostIntake/attribution";
import { phoneValidationMessage } from "@/lib/hostIntake/validateFullIntake";
import {
  buildQuickQuoteServiceInterest,
  QUICK_QUOTE_CONTACT_METHODS,
  QUICK_QUOTE_FREQUENCY,
  QUICK_QUOTE_PROPERTY_TYPES,
  QUICK_QUOTE_SERVICES,
  QUICK_QUOTE_TIMING,
  quickQuoteAnalyticsDims,
  validateQuickQuoteStep,
  type QuickQuoteFieldErrors,
  type QuickQuoteFormState,
} from "@/lib/hostIntake/quickQuote";
import {
  VERMONT_HOME_WATCH_PATH,
  VERMONT_HOST_INTAKE_PATH,
} from "@/lib/marketing/publicCtas";

const inputClassName =
  "w-full border border-vm-border rounded-lg px-4 py-3 font-body text-sm text-vm-text focus:outline-none focus:border-vm-cyan min-h-[48px]";
const labelClassName = "font-body text-sm font-medium text-vm-text";

const initialForm: QuickQuoteFormState = {
  city: "",
  propertyType: "",
  bedrooms: "",
  bathrooms: "",
  serviceInterest: "",
  timing: "",
  frequency: "",
  fullName: "",
  email: "",
  phone: "",
  preferredContact: "",
};

export function VermontQuickQuoteForm() {
  const searchParams = useSearchParams();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<QuickQuoteFormState>(initialForm);
  const [errors, setErrors] = useState<QuickQuoteFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [nextUrl, setNextUrl] = useState(VERMONT_HOST_INTAKE_PATH);
  const [attribution, setAttribution] = useState<HostAttribution | null>(null);
  const startedRef = useRef(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    const serviceParam = searchParams.get("service");
    const fromUrl = parseAttributionFromSearchParams(searchParams, {
      landing: "/vermont/quick-quote",
    });
    const withLanding: HostAttribution = {
      ...fromUrl,
      landing: "/vermont/quick-quote",
      first_touch_at: fromUrl.first_touch_at || new Date().toISOString(),
    };
    const stored = readStoredAttribution();
    const merged = mergeAttributionFirstTouch(stored, withLanding);
    writeStoredAttribution(merged);
    setAttribution(merged);

    if (serviceParam === "home-watch") {
      setForm((prev) => ({
        ...prev,
        serviceInterest: "Home Watch",
        frequency: prev.frequency || "Seasonal / as needed",
      }));
    }

    if (!startedRef.current) {
      startedRef.current = true;
      trackEvent("quote_start", {
        market: "vermont",
        quote_flow: "quick_quote",
        service: serviceParam === "home-watch" ? "Home Watch" : undefined,
        ...attributionAnalyticsParams(merged),
      });
    }
  }, [searchParams]);

  const analyticsDims = useMemo(
    () => ({
      ...quickQuoteAnalyticsDims(form),
      ...attributionAnalyticsParams(attribution),
    }),
    [form, attribution]
  );

  function updateField<K extends keyof QuickQuoteFormState>(
    key: K,
    value: QuickQuoteFormState[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError(null);
  }

  function goNext() {
    const stepErrors = validateQuickQuoteStep(step, form);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }
    trackEvent("quote_step_complete", {
      ...analyticsDims,
      step,
    });
    setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  }

  function goBack() {
    setErrors({});
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitLockRef.current || submitting) return;

    const stepErrors = validateQuickQuoteStep(3, form);
    const phoneError = phoneValidationMessage(form.phone);
    if (phoneError) stepErrors.phone = phoneError;
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const serviceInterest = buildQuickQuoteServiceInterest(form);
      const response = await fetch("/api/host-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "SETUP_REQUEST",
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          serviceInterest,
          attribution,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Could not submit quote request.");
      }
      trackEvent("quote_submit", analyticsDims);
      if (form.serviceInterest === "Home Watch") {
        trackEvent("service_select", {
          market: "vermont",
          service: "home_watch",
        });
      }
      setNextUrl(data.nextUrl || VERMONT_HOST_INTAKE_PATH);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Could not submit quote request."
      );
      submitLockRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-2xl border border-vm-border bg-white p-6 sm:p-8 text-center">
        <h2 className="font-heading text-2xl font-bold text-vm-navy">
          Request received
        </h2>
        <p className="mt-3 font-body text-sm text-vm-muted leading-relaxed">
          Thanks — our Vermont team will follow up with pricing and next steps.
          This is a quote inquiry only. Availability is not guaranteed until we
          confirm.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={nextUrl}
            className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy"
          >
            Continue property setup (optional)
          </Link>
          <Link
            href="/hosts"
            className="inline-flex min-h-[48px] items-center justify-center rounded-md border border-vm-border px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy"
          >
            Back to Vermont hosts
          </Link>
        </div>
        {hasAttribution(attribution) ? (
          <p className="mt-4 font-body text-xs text-vm-muted">
            Referral context saved for follow-up.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-vm-border bg-white p-5 sm:p-8 space-y-6"
      noValidate
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-body text-xs font-bold uppercase tracking-wider text-vm-cyan-dark">
          Step {step} of 3
        </p>
        <div className="flex gap-1" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 w-8 rounded-full ${
                n <= step ? "bg-vm-cyan" : "bg-vm-border"
              }`}
            />
          ))}
        </div>
      </div>

      {step === 1 ? (
        <fieldset className="space-y-4">
          <legend className="font-heading text-xl font-bold text-vm-navy">
            Property
          </legend>
          <p className="font-body text-sm text-vm-muted">
            Town and size only — no access codes or full address yet.
          </p>
          <div>
            <label htmlFor="qq-city" className={labelClassName}>
              Vermont town *
            </label>
            <input
              id="qq-city"
              className={inputClassName}
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              autoComplete="address-level2"
            />
            {errors.city ? (
              <p className="mt-1 text-sm text-vm-danger">{errors.city}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="qq-type" className={labelClassName}>
              Property type *
            </label>
            <select
              id="qq-type"
              className={inputClassName}
              value={form.propertyType}
              onChange={(e) => {
                updateField("propertyType", e.target.value);
                trackEvent("market_select", {
                  market: "vermont",
                  property_type: e.target.value,
                });
              }}
            >
              <option value="">Select…</option>
              {QUICK_QUOTE_PROPERTY_TYPES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.propertyType ? (
              <p className="mt-1 text-sm text-vm-danger">{errors.propertyType}</p>
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="qq-beds" className={labelClassName}>
                Bedrooms *
              </label>
              <input
                id="qq-beds"
                inputMode="numeric"
                className={inputClassName}
                value={form.bedrooms}
                onChange={(e) => updateField("bedrooms", e.target.value)}
              />
              {errors.bedrooms ? (
                <p className="mt-1 text-sm text-vm-danger">{errors.bedrooms}</p>
              ) : null}
            </div>
            <div>
              <label htmlFor="qq-baths" className={labelClassName}>
                Bathrooms *
              </label>
              <input
                id="qq-baths"
                inputMode="decimal"
                className={inputClassName}
                value={form.bathrooms}
                onChange={(e) => updateField("bathrooms", e.target.value)}
              />
              {errors.bathrooms ? (
                <p className="mt-1 text-sm text-vm-danger">{errors.bathrooms}</p>
              ) : null}
            </div>
          </div>
        </fieldset>
      ) : null}

      {step === 2 ? (
        <fieldset className="space-y-4">
          <legend className="font-heading text-xl font-bold text-vm-navy">
            Service
          </legend>
          <div>
            <label htmlFor="qq-service" className={labelClassName}>
              What do you need? *
            </label>
            <select
              id="qq-service"
              className={inputClassName}
              value={form.serviceInterest}
              onChange={(e) => {
                updateField("serviceInterest", e.target.value);
                trackEvent("service_select", {
                  market: "vermont",
                  service: e.target.value,
                });
              }}
            >
              <option value="">Select…</option>
              {QUICK_QUOTE_SERVICES.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.serviceInterest ? (
              <p className="mt-1 text-sm text-vm-danger">
                {errors.serviceInterest}
              </p>
            ) : null}
            <p className="mt-2 font-body text-xs text-vm-muted">
              Winter away?{" "}
              <Link
                href={`${VERMONT_HOME_WATCH_PATH}?from=quick-quote`}
                className="font-semibold text-vm-navy underline-offset-2 hover:underline"
              >
                Learn about Home Watch
              </Link>
            </p>
          </div>
          <div>
            <label htmlFor="qq-timing" className={labelClassName}>
              Timing *
            </label>
            <select
              id="qq-timing"
              className={inputClassName}
              value={form.timing}
              onChange={(e) => updateField("timing", e.target.value)}
            >
              <option value="">Select…</option>
              {QUICK_QUOTE_TIMING.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.timing ? (
              <p className="mt-1 text-sm text-vm-danger">{errors.timing}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="qq-freq" className={labelClassName}>
              Frequency *
            </label>
            <select
              id="qq-freq"
              className={inputClassName}
              value={form.frequency}
              onChange={(e) => updateField("frequency", e.target.value)}
            >
              <option value="">Select…</option>
              {QUICK_QUOTE_FREQUENCY.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.frequency ? (
              <p className="mt-1 text-sm text-vm-danger">{errors.frequency}</p>
            ) : null}
          </div>
        </fieldset>
      ) : null}

      {step === 3 ? (
        <fieldset className="space-y-4">
          <legend className="font-heading text-xl font-bold text-vm-navy">
            Contact
          </legend>
          <p className="font-body text-sm text-vm-muted">
            No payment required. We confirm pricing before any booking.
          </p>
          <div>
            <label htmlFor="qq-name" className={labelClassName}>
              Full name *
            </label>
            <input
              id="qq-name"
              className={inputClassName}
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              autoComplete="name"
            />
            {errors.fullName ? (
              <p className="mt-1 text-sm text-vm-danger">{errors.fullName}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="qq-email" className={labelClassName}>
              Email *
            </label>
            <input
              id="qq-email"
              type="email"
              className={inputClassName}
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              autoComplete="email"
            />
            {errors.email ? (
              <p className="mt-1 text-sm text-vm-danger">{errors.email}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="qq-phone" className={labelClassName}>
              Phone *
            </label>
            <input
              id="qq-phone"
              type="tel"
              className={inputClassName}
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              autoComplete="tel"
            />
            {errors.phone ? (
              <p className="mt-1 text-sm text-vm-danger">{errors.phone}</p>
            ) : null}
          </div>
          <div>
            <label htmlFor="qq-pref" className={labelClassName}>
              Preferred contact *
            </label>
            <select
              id="qq-pref"
              className={inputClassName}
              value={form.preferredContact}
              onChange={(e) => updateField("preferredContact", e.target.value)}
            >
              <option value="">Select…</option>
              {QUICK_QUOTE_CONTACT_METHODS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {errors.preferredContact ? (
              <p className="mt-1 text-sm text-vm-danger">
                {errors.preferredContact}
              </p>
            ) : null}
          </div>
        </fieldset>
      ) : null}

      {submitError ? (
        <p className="rounded-lg border border-vm-danger bg-vm-danger-bg px-4 py-3 text-sm text-vm-danger">
          {submitError}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {step > 1 ? (
          <button
            type="button"
            onClick={goBack}
            className="min-h-[48px] rounded-md border border-vm-border px-5 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        {step < 3 ? (
          <button
            type="button"
            onClick={goNext}
            className="min-h-[48px] rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy"
          >
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="min-h-[48px] rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy disabled:opacity-60"
          >
            {submitting ? "Sending…" : "Request quote"}
          </button>
        )}
      </div>
    </form>
  );
}
