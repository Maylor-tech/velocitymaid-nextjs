"use client";

import { useState, FormEvent, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics/trackEvent";
import { cn } from "@/lib/utils";
import { vmFocusRing } from "@/components/vm/focus";
import {
  ACCESS_TYPE_OPTIONS,
  BOOKING_ADVANCE_OPTIONS,
  GUEST_CHECKIN_OPTIONS,
  GUEST_CHECKOUT_OPTIONS,
  LINEN_PROVIDER_OPTIONS,
  PROPERTY_ACTIVE_SEASON_OPTIONS,
  PROPERTY_AMENITY_OPTIONS,
  SAME_DAY_TURNOVER_OPTIONS,
  SQUARE_FOOTAGE_OPTIONS,
} from "@/lib/hostIntake/constants";
import {
  HOME_WATCH_INTAKE_BANNER,
  isHomeWatchIntake,
  mergeHomeWatchDefaults,
} from "@/lib/hostIntake/homeWatchIntake";
import type { HostIntakePayload } from "@/lib/hostIntake/types";
import { validateFullHostIntake } from "@/lib/hostIntake/validateFullIntake";
import {
  SERVICE_TYPE_CHIPS,
  STEP1_REQUIRED_FIELDS,
  STEP2_REQUIRED_FIELDS,
  firstErrorField,
  validateHostIntakeStep1,
} from "@/lib/hostIntake/stepValidation";
import {
  attributionAnalyticsParams,
  hasAttribution,
  mergeAttributionFirstTouch,
  parseAttributionFromSearchParams,
  readStoredAttribution,
  writeStoredAttribution,
  type HostAttribution,
} from "@/lib/hostIntake/attribution";

const BOOKING_PLATFORMS = [
  "Airbnb",
  "VRBO",
  "Booking.com",
  "Direct bookings",
  "Other",
] as const;

const BEDROOM_OPTIONS = ["Studio", "1", "2", "3", "4", "5+"] as const;
const BATHROOM_OPTIONS = ["1", "1.5", "2", "2.5", "3", "3+"] as const;
const TURNOVER_OPTIONS = [
  "Multiple times per week",
  "Once a week",
  "Every 2 weeks",
  "Monthly or less",
  "Irregular / varies",
] as const;
const CONTACT_METHODS = ["Email", "Text", "WhatsApp", "Phone call"] as const;
const BEST_TIME_OPTIONS = [
  "Morning (8am–12pm)",
  "Afternoon (12pm–5pm)",
  "Evening (5pm–8pm)",
  "Anytime",
] as const;

type ArrayFieldKey =
  | "bookingPlatforms"
  | "serviceTypes"
  | "propertyAmenities"
  | "propertyActiveSeasons";

type FormFields = HostIntakePayload;
type FormErrors = Partial<Record<keyof FormFields, string>>;
type Step = 1 | 2;

const initialForm: FormFields = {
  propertyAddress: "",
  city: "",
  bedrooms: "",
  bathrooms: "",
  squareFootage: "",
  bedConfiguration: "",
  propertyAmenities: [],
  restrictedAreas: "",
  bookingPlatforms: [],
  accessType: "",
  accessTypeOther: "",
  willSendAccessDetails: false,
  guestCheckoutTime: "",
  guestCheckoutTimeOther: "",
  guestCheckinTime: "",
  guestCheckinTimeOther: "",
  supplyStorageLocation: "",
  trashBinLocation: "",
  serviceTypes: [],
  turnoverFrequency: "",
  hasCleaner: "",
  linenProvider: "",
  sameDayTurnovers: "",
  bookingAdvanceNotice: "",
  propertyActiveSeasons: [],
  preferredPaymentMethod: "",
  specialInstructions: "",
  fullName: "",
  email: "",
  phone: "",
  preferredContact: "",
  bestTimeToReach: "",
};

const inputClassName = cn(
  "mt-1.5 min-h-touch w-full rounded-vm-md border border-vm-field-border bg-vm-white px-3 py-2.5 font-body text-base text-vm-text",
  "focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-vm-cyan"
);

const labelClassName = "font-body text-[13px] font-bold text-vm-text";

const optionRowClassName = cn(
  "flex min-h-touch cursor-pointer items-center gap-3 rounded-vm-md px-1 font-body text-sm text-vm-text",
  "focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-[3px] focus-within:outline-vm-cyan"
);

const nativeControlClassName =
  "h-5 w-5 shrink-0 accent-vm-navy outline-none";

const primaryButtonClassName = cn(
  "inline-flex min-h-[48px] w-full items-center justify-center rounded-vm-md bg-vm-navy px-5 py-3 font-heading text-base font-bold tracking-tight text-vm-white hover:bg-vm-navy/90 disabled:cursor-not-allowed disabled:opacity-60",
  vmFocusRing
);

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1.5 font-body text-[13px] text-vm-danger">
      {message}
    </p>
  );
}

function Field({
  id,
  label,
  error,
  optional,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  optional?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className={labelClassName}>
        {label}
        {optional ? (
          <span className="ml-1 font-normal text-vm-muted">(optional)</span>
        ) : null}
      </label>
      {children}
      {hint ? <p className="mt-1 font-body text-xs text-vm-muted">{hint}</p> : null}
      <ErrorText id={`${id}-error`} message={error} />
    </div>
  );
}

function describedBy(id: string, error?: string) {
  return error ? `${id}-error` : undefined;
}

function RadioGroup({
  name,
  legend,
  options,
  value,
  onChange,
  error,
  required,
  inline,
}: {
  name: string;
  legend: string;
  options: readonly string[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  inline?: boolean;
}) {
  return (
    <fieldset
      className="m-0 border-0 p-0"
      aria-describedby={describedBy(name, error)}
    >
      <legend className={cn(labelClassName, "mb-1")}>
        {legend}
        {required ? null : (
          <span className="ml-1 font-normal text-vm-muted">(optional)</span>
        )}
      </legend>
      <div className={cn(inline ? "flex flex-wrap gap-x-5" : "flex flex-col")}>
        {options.map((option, i) => (
          <label key={option} className={optionRowClassName}>
            <input
              id={i === 0 ? name : `${name}-${i}`}
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
              aria-invalid={error ? true : undefined}
              className={nativeControlClassName}
            />
            {option}
          </label>
        ))}
      </div>
      <ErrorText id={`${name}-error`} message={error} />
    </fieldset>
  );
}

function CheckboxGroup({
  name,
  legend,
  options,
  values,
  onToggle,
  error,
  required,
}: {
  name: string;
  legend: string;
  options: readonly string[];
  values: string[];
  onToggle: (value: string) => void;
  error?: string;
  required?: boolean;
}) {
  return (
    <fieldset
      className="m-0 border-0 p-0"
      aria-describedby={describedBy(name, error)}
    >
      <legend className={cn(labelClassName, "mb-1")}>
        {legend}
        {required ? null : (
          <span className="ml-1 font-normal text-vm-muted">(optional)</span>
        )}
      </legend>
      <div className="flex flex-col">
        {options.map((option, i) => (
          <label key={option} className={optionRowClassName}>
            <input
              id={i === 0 ? name : `${name}-${i}`}
              type="checkbox"
              checked={values.includes(option)}
              onChange={() => onToggle(option)}
              aria-invalid={error ? true : undefined}
              className={nativeControlClassName}
            />
            {option}
          </label>
        ))}
      </div>
      <ErrorText id={`${name}-error`} message={error} />
    </fieldset>
  );
}

function StepPill({
  n,
  label,
  active,
}: {
  n: number;
  label: string;
  active: boolean;
}) {
  return (
    <span
      aria-current={active ? "step" : undefined}
      className={cn(
        "rounded-full px-3 py-1 font-body text-[13px] font-bold",
        active ? "bg-vm-navy text-vm-white" : "bg-vm-canvas text-vm-text"
      )}
    >
      {n} · {label}
    </span>
  );
}

export default function HostIntakeForm() {
  const searchParams = useSearchParams();
  const homeWatchRequest = isHomeWatchIntake(searchParams.get("service"));
  const homeWatchDefaultsApplied = useRef(homeWatchRequest);
  const [form, setForm] = useState<FormFields>(() =>
    homeWatchRequest ? mergeHomeWatchDefaults(initialForm, "home-watch") : initialForm
  );
  const [step, setStep] = useState<Step>(1);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [attribution, setAttribution] = useState<HostAttribution | null>(null);
  const stepHeadingRef = useRef<HTMLHeadingElement>(null);
  const pendingFocus = useRef<string | null>(null);
  const stepChanged = useRef(false);

  useEffect(() => {
    const email = searchParams.get("email")?.trim().toLowerCase() || "";
    const name = searchParams.get("name")?.trim() || "";
    const phone = searchParams.get("phone")?.trim() || "";
    const city = searchParams.get("city")?.trim() || "";
    const applyHomeWatch =
      isHomeWatchIntake(searchParams.get("service")) && !homeWatchDefaultsApplied.current;
    if (applyHomeWatch) homeWatchDefaultsApplied.current = true;

    if (email || name || phone || city || applyHomeWatch) {
      setForm((prev) => {
        const next = {
          ...prev,
          email: email || prev.email,
          fullName: name || prev.fullName,
          phone: phone || prev.phone,
          city: city || prev.city,
        };
        return applyHomeWatch
          ? mergeHomeWatchDefaults(next, searchParams.get("service"))
          : next;
      });
    }

    const fromUrl = parseAttributionFromSearchParams(searchParams);
    const stored = readStoredAttribution();
    const merged = mergeAttributionFirstTouch(stored, fromUrl);
    if (hasAttribution(merged)) {
      writeStoredAttribution(merged);
      setAttribution(merged);
    }
  }, [searchParams]);

  // After a step change or a failed validation, move focus once the DOM has updated.
  useEffect(() => {
    if (pendingFocus.current) {
      document.getElementById(pendingFocus.current)?.focus();
      pendingFocus.current = null;
    } else if (stepChanged.current) {
      stepHeadingRef.current?.focus();
    }
    stepChanged.current = false;
  });

  function updateField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError(null);
  }

  function toggleArrayField(key: ArrayFieldKey, value: string) {
    setForm((prev) => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function goToStep(next: Step) {
    stepChanged.current = true;
    setStep(next);
  }

  function handleContinue() {
    const stepErrors = validateHostIntakeStep1(form);
    const first = firstErrorField(stepErrors, STEP1_REQUIRED_FIELDS);
    if (first) {
      setErrors(stepErrors);
      pendingFocus.current = first;
      // Force a re-render so the focus effect runs even if errors are unchanged.
      setSubmitError(null);
      return;
    }
    setErrors({});
    goToStep(2);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step === 1) {
      handleContinue();
      return;
    }

    const validationErrors = validateFullHostIntake(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const step1First = firstErrorField(validationErrors, STEP1_REQUIRED_FIELDS);
      if (step1First) {
        pendingFocus.current = step1First;
        goToStep(1);
        return;
      }
      pendingFocus.current =
        firstErrorField(validationErrors, STEP2_REQUIRED_FIELDS) ?? null;
      setSubmitError(null);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/host-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          mode: "FULL",
          attribution: attribution && hasAttribution(attribution) ? attribution : undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setSubmitError(
          typeof data.error === "string" && data.error
            ? data.error
            : "Something went wrong — please email us at hello@velocitymaid.com"
        );
        return;
      }

      const name = form.fullName.trim().split(/\s+/)[0] || "there";
      trackEvent(
        "host_intake_submitted",
        attributionAnalyticsParams(attribution)
      );
      setFirstName(name);
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
      <div
        id="get-quote-form"
        className="rounded-vm-xl border border-vm-line bg-vm-white p-7 font-body"
      >
        <h3 className="font-heading text-2xl font-bold tracking-tight text-vm-navy">
          Thanks, {firstName}. We have your details.
        </h3>
        <p className="mt-3 text-base leading-relaxed text-vm-text">
          We&apos;ll review your property and come back with your turnover quote.
          No card needed.
        </p>
        <p className="mt-4 text-sm text-vm-text">
          Prefer to talk it through now? Call or message us.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <a
            href="tel:+18027335348"
            className={cn(
              "inline-flex min-h-touch items-center justify-center rounded-vm-md border border-vm-field-border px-5 font-heading text-sm font-bold text-vm-navy hover:bg-vm-canvas",
              vmFocusRing
            )}
          >
            Call (802) 733-5348
          </a>
          <a
            href="https://wa.me/18027335348"
            target="_blank"
            rel="noreferrer"
            className={cn(
              "inline-flex min-h-touch items-center justify-center rounded-vm-md border border-vm-field-border px-5 font-heading text-sm font-bold text-vm-navy hover:bg-vm-canvas",
              vmFocusRing
            )}
          >
            WhatsApp
          </a>
        </div>
        <Link
          href="/vermont"
          className={cn(
            "mt-5 inline-flex min-h-touch items-center font-body text-sm font-bold text-vm-cyan-dark hover:text-vm-navy",
            vmFocusRing
          )}
        >
          Back to Vermont →
        </Link>
      </div>
    );
  }

  return (
    <form
      id="get-quote-form"
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4 rounded-vm-xl border border-vm-line bg-vm-white p-5 font-body sm:p-7"
    >
      <div className="flex flex-wrap gap-2">
        <StepPill n={1} label="Your property" active={step === 1} />
        <StepPill n={2} label="Turnover details" active={step === 2} />
      </div>

      {homeWatchRequest ? (
        <p className="rounded-vm-md border border-vm-line bg-vm-canvas px-4 py-3 text-sm leading-relaxed text-vm-text">
          {HOME_WATCH_INTAKE_BANNER}
        </p>
      ) : null}

      {step === 1 ? (
        <>
          <h3
            ref={stepHeadingRef}
            tabIndex={-1}
            className="font-heading text-xl font-bold tracking-tight text-vm-navy outline-none"
          >
            Your property
          </h3>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field id="fullName" label="Full name" error={errors.fullName}>
              <input
                id="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                autoComplete="name"
                aria-invalid={errors.fullName ? true : undefined}
                aria-describedby={describedBy("fullName", errors.fullName)}
                className={inputClassName}
              />
            </Field>
            <Field id="phone" label="Mobile number" error={errors.phone}>
              <input
                id="phone"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                autoComplete="tel"
                aria-invalid={errors.phone ? true : undefined}
                aria-describedby={describedBy("phone", errors.phone)}
                className={inputClassName}
              />
            </Field>
            <Field
              id="email"
              label="Email"
              error={errors.email}
              className="sm:col-span-2"
            >
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                autoComplete="email"
                aria-invalid={errors.email ? true : undefined}
                aria-describedby={describedBy("email", errors.email)}
                className={inputClassName}
              />
            </Field>
            <Field
              id="propertyAddress"
              label="Property address"
              error={errors.propertyAddress}
              className="sm:col-span-2"
            >
              <input
                id="propertyAddress"
                type="text"
                required
                value={form.propertyAddress}
                onChange={(e) => updateField("propertyAddress", e.target.value)}
                autoComplete="street-address"
                aria-invalid={errors.propertyAddress ? true : undefined}
                aria-describedby={describedBy("propertyAddress", errors.propertyAddress)}
                className={inputClassName}
              />
            </Field>
            <Field
              id="city"
              label="Town"
              error={errors.city}
              className="sm:col-span-2"
            >
              <input
                id="city"
                type="text"
                required
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                autoComplete="address-level2"
                aria-invalid={errors.city ? true : undefined}
                aria-describedby={describedBy("city", errors.city)}
                className={inputClassName}
              />
            </Field>
            <Field id="bedrooms" label="Bedrooms" error={errors.bedrooms}>
              <select
                id="bedrooms"
                required
                value={form.bedrooms}
                onChange={(e) => updateField("bedrooms", e.target.value)}
                aria-invalid={errors.bedrooms ? true : undefined}
                aria-describedby={describedBy("bedrooms", errors.bedrooms)}
                className={inputClassName}
              >
                <option value="">Select…</option>
                {BEDROOM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="bathrooms" label="Bathrooms" error={errors.bathrooms}>
              <select
                id="bathrooms"
                required
                value={form.bathrooms}
                onChange={(e) => updateField("bathrooms", e.target.value)}
                aria-invalid={errors.bathrooms ? true : undefined}
                aria-describedby={describedBy("bathrooms", errors.bathrooms)}
                className={inputClassName}
              >
                <option value="">Select…</option>
                {BATHROOM_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <fieldset className="m-0 border-0 p-0">
            <legend className={cn(labelClassName, "mb-2")}>What do you need?</legend>
            <div className="flex flex-wrap gap-2 text-sm">
              {SERVICE_TYPE_CHIPS.map((chip) => {
                const checked = form.serviceTypes.includes(chip.value);
                return (
                  <label
                    key={chip.value}
                    className={cn(
                      "inline-flex min-h-touch cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 font-body",
                      "focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-[3px] focus-within:outline-vm-cyan",
                      checked
                        ? "border-[1.5px] border-vm-cyan bg-vm-cyan-tint font-bold text-vm-cyan-ink"
                        : "border border-vm-field-border text-vm-text"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleArrayField("serviceTypes", chip.value)}
                      className={nativeControlClassName}
                    />
                    {chip.label}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <button
            type="button"
            onClick={handleContinue}
            className={primaryButtonClassName}
          >
            Continue to turnover details →
          </button>
          <p className="m-0 text-[13px] text-vm-muted">
            Step 2 asks about access, linens, same-day turnovers and your busy
            season. No card needed. We reply within one business day.
          </p>
        </>
      ) : (
        <>
          <h3
            ref={stepHeadingRef}
            tabIndex={-1}
            className="font-heading text-xl font-bold tracking-tight text-vm-navy outline-none"
          >
            Turnover details
          </h3>

          <RadioGroup
            name="accessType"
            legend="How do we get in?"
            required
            options={ACCESS_TYPE_OPTIONS}
            value={form.accessType}
            onChange={(v) => updateField("accessType", v)}
            error={errors.accessType}
          />

          {form.accessType === "Other (please describe)" ? (
            <Field
              id="accessTypeOther"
              label="Access details"
              error={errors.accessTypeOther}
            >
              <input
                id="accessTypeOther"
                type="text"
                value={form.accessTypeOther}
                onChange={(e) => updateField("accessTypeOther", e.target.value)}
                aria-invalid={errors.accessTypeOther ? true : undefined}
                aria-describedby={describedBy("accessTypeOther", errors.accessTypeOther)}
                className={inputClassName}
              />
            </Field>
          ) : null}

          <RadioGroup
            name="linenProvider"
            legend="Who provides linens and towels?"
            required
            options={LINEN_PROVIDER_OPTIONS}
            value={form.linenProvider}
            onChange={(v) => updateField("linenProvider", v)}
            error={errors.linenProvider}
          />

          <RadioGroup
            name="sameDayTurnovers"
            legend="Same-day turnovers needed?"
            required
            options={SAME_DAY_TURNOVER_OPTIONS}
            value={form.sameDayTurnovers}
            onChange={(v) => updateField("sameDayTurnovers", v)}
            error={errors.sameDayTurnovers}
          />

          <CheckboxGroup
            name="propertyActiveSeasons"
            legend="When is your property most active?"
            required
            options={PROPERTY_ACTIVE_SEASON_OPTIONS}
            values={form.propertyActiveSeasons}
            onToggle={(v) => toggleArrayField("propertyActiveSeasons", v)}
            error={errors.propertyActiveSeasons}
          />

          <details className="group rounded-vm-md border border-vm-line">
            <summary
              className={cn(
                "flex min-h-touch cursor-pointer list-none items-center justify-between gap-3 rounded-vm-md px-4 font-body text-sm font-bold text-vm-navy [&::-webkit-details-marker]:hidden",
                vmFocusRing
              )}
            >
              Add more details (optional)
              <span aria-hidden="true" className="transition group-open:rotate-180">
                ▾
              </span>
            </summary>
            <div className="flex flex-col gap-5 border-t border-vm-line px-4 py-5">
              <RadioGroup
                name="preferredContact"
                legend="Preferred contact method"
                inline
                options={CONTACT_METHODS}
                value={form.preferredContact}
                onChange={(v) => updateField("preferredContact", v)}
              />

              <Field id="bestTimeToReach" label="Best time to reach you" optional>
                <select
                  id="bestTimeToReach"
                  value={form.bestTimeToReach}
                  onChange={(e) => updateField("bestTimeToReach", e.target.value)}
                  className={inputClassName}
                >
                  <option value="">Select…</option>
                  {BEST_TIME_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="squareFootage" label="Approximate square footage" optional>
                <select
                  id="squareFootage"
                  value={form.squareFootage}
                  onChange={(e) => updateField("squareFootage", e.target.value)}
                  className={inputClassName}
                >
                  <option value="">Select…</option>
                  {SQUARE_FOOTAGE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                id="bedConfiguration"
                label="Bed configuration"
                optional
                hint="Helps us prepare the right number of linens for each visit."
              >
                <input
                  id="bedConfiguration"
                  type="text"
                  value={form.bedConfiguration}
                  onChange={(e) => updateField("bedConfiguration", e.target.value)}
                  placeholder="e.g. 2 Kings, 3 Queens, 1 Twin"
                  className={inputClassName}
                />
              </Field>

              <CheckboxGroup
                name="propertyAmenities"
                legend="Property amenities"
                options={PROPERTY_AMENITY_OPTIONS}
                values={form.propertyAmenities}
                onToggle={(v) => toggleArrayField("propertyAmenities", v)}
              />

              <CheckboxGroup
                name="bookingPlatforms"
                legend="Booking platform(s)"
                options={BOOKING_PLATFORMS}
                values={form.bookingPlatforms}
                onToggle={(v) => toggleArrayField("bookingPlatforms", v)}
              />

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <Field id="guestCheckoutTime" label="Guest check-out time" optional>
                  <select
                    id="guestCheckoutTime"
                    value={form.guestCheckoutTime}
                    onChange={(e) => updateField("guestCheckoutTime", e.target.value)}
                    className={inputClassName}
                  >
                    <option value="">Select…</option>
                    {GUEST_CHECKOUT_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field id="guestCheckinTime" label="Guest check-in time" optional>
                  <select
                    id="guestCheckinTime"
                    value={form.guestCheckinTime}
                    onChange={(e) => updateField("guestCheckinTime", e.target.value)}
                    className={inputClassName}
                  >
                    <option value="">Select…</option>
                    {GUEST_CHECKIN_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </Field>
                {form.guestCheckoutTime === "Other" ? (
                  <Field id="guestCheckoutTimeOther" label="Check-out time details">
                    <input
                      id="guestCheckoutTimeOther"
                      type="text"
                      value={form.guestCheckoutTimeOther}
                      onChange={(e) =>
                        updateField("guestCheckoutTimeOther", e.target.value)
                      }
                      className={inputClassName}
                    />
                  </Field>
                ) : null}
                {form.guestCheckinTime === "Other" ? (
                  <Field id="guestCheckinTimeOther" label="Check-in time details">
                    <input
                      id="guestCheckinTimeOther"
                      type="text"
                      value={form.guestCheckinTimeOther}
                      onChange={(e) =>
                        updateField("guestCheckinTimeOther", e.target.value)
                      }
                      className={inputClassName}
                    />
                  </Field>
                ) : null}
              </div>

              <Field id="turnoverFrequency" label="How often do guests turn over?" optional>
                <select
                  id="turnoverFrequency"
                  value={form.turnoverFrequency}
                  onChange={(e) => updateField("turnoverFrequency", e.target.value)}
                  className={inputClassName}
                >
                  <option value="">Select…</option>
                  {TURNOVER_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>

              <RadioGroup
                name="hasCleaner"
                legend="Do you currently have a cleaner?"
                inline
                options={["Yes", "No", "Sometimes"]}
                value={form.hasCleaner}
                onChange={(v) => updateField("hasCleaner", v)}
              />

              <Field
                id="bookingAdvanceNotice"
                label="How far in advance do you know about bookings?"
                optional
              >
                <select
                  id="bookingAdvanceNotice"
                  value={form.bookingAdvanceNotice}
                  onChange={(e) => updateField("bookingAdvanceNotice", e.target.value)}
                  className={inputClassName}
                >
                  <option value="">Select…</option>
                  {BOOKING_ADVANCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </Field>

              <Field id="specialInstructions" label="Notes for us" optional>
                <textarea
                  id="specialInstructions"
                  rows={4}
                  value={form.specialInstructions}
                  onChange={(e) => updateField("specialInstructions", e.target.value)}
                  placeholder="Pets on property, keypad entry, specific products to use, areas to focus on…"
                  className={cn(inputClassName, "min-h-[100px] resize-y")}
                />
              </Field>
            </div>
          </details>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className={primaryButtonClassName}
            >
              {submitting ? "Sending…" : "Request my turnover quote"}
            </button>
            <p className="mt-3 text-center text-[13px] text-vm-muted">
              No card needed. We reply within one business day.
            </p>
            {submitError ? (
              <p role="alert" className="mt-3 text-center text-[13px] text-vm-danger">
                {submitError}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => goToStep(1)}
            className={cn(
              "inline-flex min-h-touch items-center self-start font-body text-sm font-bold text-vm-cyan-dark hover:text-vm-navy",
              vmFocusRing
            )}
          >
            ← Back to your property
          </button>
        </>
      )}
    </form>
  );
}
