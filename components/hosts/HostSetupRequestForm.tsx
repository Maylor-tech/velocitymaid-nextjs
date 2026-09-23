"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics/trackEvent";
import {
  attributionAnalyticsParams,
  buildHostIntakeDeepLink,
  hasAttribution,
  mergeAttributionFirstTouch,
  parseAttributionFromSearchParams,
  readStoredAttribution,
  writeStoredAttribution,
  type HostAttribution,
} from "@/lib/hostIntake/attribution";

const SERVICE_INTEREST_OPTIONS = [
  "Vacation rental turnovers",
  "Deep cleaning and property resets",
  "Guest-ready inspections",
  "Property manager support",
  "Not sure yet — help me figure it out",
] as const;

const inputClassName =
  "w-full border border-vm-border rounded-lg px-4 py-3 font-body text-sm text-vm-text focus:outline-none focus:border-vm-cyan";
const labelClassName = "font-body text-sm font-medium text-vm-text";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  city: string;
  serviceInterest: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  serviceInterest: "",
};

export function HostSetupRequestForm() {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [nextUrl, setNextUrl] = useState("/vermont/host-intake?from=hosts");
  const [attribution, setAttribution] = useState<HostAttribution | null>(null);

  useEffect(() => {
    const fromUrl = parseAttributionFromSearchParams(searchParams, {
      landing: "/hosts",
    });
    // Always stamp landing=/hosts for this surface.
    const withLanding: HostAttribution = {
      ...fromUrl,
      landing: "/hosts",
      first_touch_at: fromUrl.first_touch_at || new Date().toISOString(),
    };
    const stored = readStoredAttribution();
    const merged = mergeAttributionFirstTouch(stored, withLanding);
    writeStoredAttribution(merged);
    setAttribution(merged);
  }, [searchParams]);

  const analyticsDims = useMemo(
    () => attributionAnalyticsParams(attribution),
    [attribution]
  );

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError(null);
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!form.fullName.trim()) next.fullName = "Name is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!isValidEmail(form.email.trim())) {
      next.email = "Please enter a valid email address.";
    }
    if (!form.phone.trim()) next.phone = "Phone is required.";
    if (!form.city.trim()) next.city = "Vermont property town is required.";
    if (!form.serviceInterest) {
      next.serviceInterest = "Please select what you need help with.";
    }
    return next;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const attr =
      attribution && hasAttribution(attribution)
        ? attribution
        : {
            landing: "/hosts",
            utm_source: "",
            utm_medium: "",
            utm_campaign: "",
            utm_content: "",
            first_touch_at: new Date().toISOString(),
          };

    try {
      const res = await fetch("/api/host-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "SETUP_REQUEST",
          fullName: form.fullName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          city: form.city.trim(),
          serviceInterest: form.serviceInterest,
          attribution: attr,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed");
      }

      trackEvent("host_setup_request_submitted", analyticsDims);

      const deepLink =
        typeof data.nextUrl === "string"
          ? data.nextUrl
          : buildHostIntakeDeepLink({
              email: form.email.trim().toLowerCase(),
              fullName: form.fullName.trim(),
              phone: form.phone.trim(),
              city: form.city.trim(),
              attribution: attr,
            });

      setNextUrl(deepLink);
      setSubmitted(true);
    } catch {
      setSubmitError(
        "Something went wrong — please email us at hello@velocitymaid.com"
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-vm-border bg-white p-6 sm:p-8 text-center">
        <p className="font-body text-[11px] font-bold uppercase tracking-[0.2em] text-vm-cyan-dark">
          Request received
        </p>
        <h3 className="mt-3 font-heading text-2xl font-bold text-vm-navy">
          Thanks — your property setup request is in.
        </h3>
        <p className="mx-auto mt-3 max-w-md font-body text-sm leading-relaxed text-vm-muted">
          We&apos;ll follow up about your Vermont property. When you&apos;re ready,
          you can optionally complete full property details so we can prepare your
          service profile.
        </p>
        <Link
          href={nextUrl}
          className="mt-7 inline-flex items-center justify-center rounded-md bg-vm-cyan px-6 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark"
          onClick={() =>
            trackEvent("hosts_cta_click", {
              ...analyticsDims,
              cta: "complete_property_details",
            })
          }
        >
          Complete Your Property Details →
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-vm-border bg-white p-5 sm:p-7"
      noValidate
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="setup-fullName" className={labelClassName}>
            Name
          </label>
          <input
            id="setup-fullName"
            name="fullName"
            autoComplete="name"
            className={`${inputClassName} mt-1.5`}
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "setup-fullName-error" : undefined}
          />
          {errors.fullName ? (
            <p id="setup-fullName-error" className="mt-1 text-xs text-red-500">
              {errors.fullName}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="setup-email" className={labelClassName}>
            Email
          </label>
          <input
            id="setup-email"
            name="email"
            type="email"
            autoComplete="email"
            className={`${inputClassName} mt-1.5`}
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "setup-email-error" : undefined}
          />
          {errors.email ? (
            <p id="setup-email-error" className="mt-1 text-xs text-red-500">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="setup-phone" className={labelClassName}>
            Phone
          </label>
          <input
            id="setup-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={`${inputClassName} mt-1.5`}
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "setup-phone-error" : undefined}
          />
          {errors.phone ? (
            <p id="setup-phone-error" className="mt-1 text-xs text-red-500">
              {errors.phone}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="setup-city" className={labelClassName}>
            Vermont property town
          </label>
          <input
            id="setup-city"
            name="city"
            autoComplete="address-level2"
            placeholder="e.g. Ludlow"
            className={`${inputClassName} mt-1.5`}
            value={form.city}
            onChange={(e) => updateField("city", e.target.value)}
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? "setup-city-error" : undefined}
          />
          {errors.city ? (
            <p id="setup-city-error" className="mt-1 text-xs text-red-500">
              {errors.city}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="setup-interest" className={labelClassName}>
            What do you need help with?
          </label>
          <select
            id="setup-interest"
            name="serviceInterest"
            className={`${inputClassName} mt-1.5`}
            value={form.serviceInterest}
            onChange={(e) => updateField("serviceInterest", e.target.value)}
            aria-invalid={Boolean(errors.serviceInterest)}
            aria-describedby={
              errors.serviceInterest ? "setup-interest-error" : undefined
            }
          >
            <option value="">Select one</option>
            {SERVICE_INTEREST_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.serviceInterest ? (
            <p id="setup-interest-error" className="mt-1 text-xs text-red-500">
              {errors.serviceInterest}
            </p>
          ) : null}
        </div>
      </div>

      {submitError ? (
        <p className="mt-4 font-body text-sm text-red-600" role="alert">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-md bg-vm-cyan px-6 py-3.5 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy transition hover:bg-vm-cyan-dark disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Request Property Setup"}
      </button>
      <p className="mt-3 text-center font-body text-xs text-vm-muted">
        Vermont hosts &amp; property managers · No detailed ops form required yet
      </p>
    </form>
  );
}
