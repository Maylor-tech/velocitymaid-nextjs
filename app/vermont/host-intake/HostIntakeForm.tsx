"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics/trackEvent";
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
import type { HostIntakePayload } from "@/lib/hostIntake/types";
import { validateFullHostIntake } from "@/lib/hostIntake/validateFullIntake";
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

const SERVICE_TYPES = [
  "Turnover cleaning between guests",
  "Deep / seasonal clean",
  "Post-construction / special project prep",
  "Property inspection & photo report",
  "Guest welcome setup / restocking",
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

const inputClassName =
  "w-full border border-vm-border rounded-lg px-4 py-3 font-body text-sm text-vm-text focus:outline-none focus:border-vm-cyan";

const labelClassName = "font-body text-sm font-medium text-vm-text";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-500 text-xs mt-1">{message}</p>;
}

function FieldHelper({ children }: { children: React.ReactNode }) {
  return <p className="text-vm-muted text-xs mt-1">{children}</p>;
}

export default function HostIntakeForm({ embedded = false }: { embedded?: boolean }) {
  const searchParams = useSearchParams();
  const [form, setForm] = useState<FormFields>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [attribution, setAttribution] = useState<HostAttribution | null>(null);

  useEffect(() => {
    const email = searchParams.get("email")?.trim().toLowerCase() || "";
    const name = searchParams.get("name")?.trim() || "";
    const phone = searchParams.get("phone")?.trim() || "";
    const city = searchParams.get("city")?.trim() || "";

    if (email || name || phone || city) {
      setForm((prev) => ({
        ...prev,
        email: email || prev.email,
        fullName: name || prev.fullName,
        phone: phone || prev.phone,
        city: city || prev.city,
      }));
    }

    const fromUrl = parseAttributionFromSearchParams(searchParams);
    const stored = readStoredAttribution();
    const merged = mergeAttributionFirstTouch(stored, fromUrl);
    if (hasAttribution(merged)) {
      writeStoredAttribution(merged);
      setAttribution(merged);
    }
  }, [searchParams]);

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

  function validate(): FormErrors {
    return validateFullHostIntake(form);
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
      <div className={embedded ? "font-body" : "min-h-screen bg-vm-surface font-body"}>
        {!embedded && <header className="bg-vm-navy border-b border-white/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
            <Link
              href="/vermont"
              className="font-body text-sm text-white/65 hover:text-white transition"
            >
              ← Back to Vermont
            </Link>
            <Link
              href="/"
              className="font-heading font-bold text-white text-lg"
            >
              VelocityMaid
            </Link>
          </div>
        </header>}

        <main className={embedded ? "" : "px-4 sm:px-6 py-12 sm:py-16"}>
          <div className="max-w-[560px] mx-auto bg-white border border-vm-border rounded-xl p-8 sm:p-8 text-center">
            <h1 className="font-heading font-semibold text-vm-navy text-2xl mb-4">
              You&apos;re all set, {firstName}!
            </h1>
            <p className="font-body text-vm-muted text-sm leading-relaxed mb-4">
              We&apos;ve received your property details. Next, we&apos;ll review them
              and reply with your turnover quote within one business day. No card needed.
            </p>
            <p className="font-body text-sm text-vm-text mb-4">
              Prefer to talk it through now? Call or message us.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 mb-8">
              <a
                href="tel:+18027335348"
                className="inline-flex items-center justify-center border border-vm-border text-vm-navy font-heading font-semibold rounded-lg px-6 py-3 text-sm hover:bg-vm-surface transition w-full sm:w-auto"
              >
                Call (802) 733-5348
              </a>
              <a
                href="https://wa.me/18027335348"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center border border-vm-border text-vm-navy font-heading font-semibold rounded-lg px-6 py-3 text-sm hover:bg-vm-surface transition w-full sm:w-auto"
              >
                WhatsApp
              </a>
            </div>
            <Link
              href="/vermont"
              className="inline-flex items-center justify-center bg-vm-cyan text-vm-navy font-heading font-semibold rounded-lg px-6 py-3 text-sm hover:bg-vm-cyan-dark transition"
            >
              Back to Vermont page
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={embedded ? "font-body" : "min-h-screen bg-vm-surface font-body"}>
      {!embedded && <header className="bg-vm-navy border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <Link
            href="/vermont"
            className="font-body text-sm text-white/65 hover:text-white transition"
          >
            ← Back to Vermont
          </Link>
          <Link href="/" className="font-heading font-bold text-white text-lg">
            VelocityMaid
          </Link>
        </div>
      </header>}

      <main className={embedded ? "" : "px-4 sm:px-6 py-8 sm:py-16"}>
        <div className="max-w-[560px] mx-auto mb-8 text-center">
          <h1 className="font-heading font-bold text-vm-navy text-2xl sm:text-3xl mb-2">
            Host intake form
          </h1>
          <p className="font-body text-vm-muted text-sm">
            Tell us about your Vermont rental and we&apos;ll prepare a custom quote
            after reviewing your property details.
          </p>
        </div>

        {!embedded && <div className="max-w-[560px] mx-auto mb-8 rounded-xl border border-vm-border bg-white p-6 text-left">
          <h2 className="font-heading font-semibold text-vm-navy text-sm uppercase tracking-wide mb-3">
            Reference pricing
          </h2>
          <ul className="font-body text-sm text-vm-text space-y-1.5 mb-4">
            <li>Standard turnover — starting at $225</li>
            <li>Large property turnover — starting at $275</li>
            <li>Deep cleaning — starting at $325</li>
          </ul>
          <p className="font-body text-sm text-vm-muted leading-relaxed mb-2">
            <strong className="text-vm-navy">Project cleaning and custom quotes:</strong>{" "}
            properties needing more than one cleaner, excessive debris,
            post-construction cleanup, neglected conditions, estate cleanouts,
            or labor beyond standard service levels are quoted individually —
            this is common for larger or first-visit Vermont properties.
          </p>
          <p className="font-body text-xs text-vm-muted leading-relaxed">
            Your final quote is based on the property size, condition,
            occupancy, labor requirements, and service scope described below.
            Conditions found to differ once we&apos;re on site may result in an
            adjusted quote before work begins.
          </p>
        </div>}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="max-w-[560px] mx-auto bg-white border border-vm-border rounded-xl p-6 sm:p-8 space-y-10"
        >
          <fieldset className="space-y-4">
            <legend className="font-heading font-semibold text-vm-navy text-lg mb-2">
              Your contact info
            </legend>

            <div>
              <label htmlFor="fullName" className={labelClassName}>
                Full name <span className="text-red-500">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                required
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                className={`${inputClassName} mt-1`}
                autoComplete="name"
              />
              <FieldError message={errors.fullName} />
            </div>

            <div>
              <label htmlFor="email" className={labelClassName}>
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className={`${inputClassName} mt-1`}
                autoComplete="email"
              />
              <FieldError message={errors.email} />
            </div>

            <div>
              <label htmlFor="phone" className={labelClassName}>
                Phone number <span className="text-red-500">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className={`${inputClassName} mt-1`}
                autoComplete="tel"
              />
              <FieldError message={errors.phone} />
            </div>

            <div>
              <p className={labelClassName}>Preferred contact method</p>
              <div className="mt-2 flex flex-wrap gap-4">
                {CONTACT_METHODS.map((method) => (
                  <label
                    key={method}
                    className="flex items-center gap-2 font-body text-sm text-vm-text cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="preferredContact"
                      value={method}
                      checked={form.preferredContact === method}
                      onChange={(e) =>
                        updateField("preferredContact", e.target.value)
                      }
                      className="border-vm-border text-vm-cyan focus:ring-vm-cyan"
                    />
                    {method}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="bestTimeToReach" className={labelClassName}>
                Best time to reach you
              </label>
              <select
                id="bestTimeToReach"
                value={form.bestTimeToReach}
                onChange={(e) =>
                  updateField("bestTimeToReach", e.target.value)
                }
                className={`${inputClassName} mt-1`}
              >
                <option value="">Select…</option>
                {BEST_TIME_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </fieldset>

          <fieldset className="space-y-4">
            <legend className="font-heading font-semibold text-vm-navy text-lg mb-2">
              Your property
            </legend>

            <div>
              <label htmlFor="propertyAddress" className={labelClassName}>
                Property address <span className="text-red-500">*</span>
              </label>
              <input
                id="propertyAddress"
                type="text"
                required
                value={form.propertyAddress}
                onChange={(e) => updateField("propertyAddress", e.target.value)}
                className={`${inputClassName} mt-1`}
                autoComplete="street-address"
              />
              <FieldError message={errors.propertyAddress} />
            </div>

            <div>
              <label htmlFor="city" className={labelClassName}>
                City / Town <span className="text-red-500">*</span>
              </label>
              <input
                id="city"
                type="text"
                required
                value={form.city}
                onChange={(e) => updateField("city", e.target.value)}
                className={`${inputClassName} mt-1`}
                autoComplete="address-level2"
              />
              <FieldError message={errors.city} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="bedrooms" className={labelClassName}>
                  Number of bedrooms <span className="text-red-500">*</span>
                </label>
                <select
                  id="bedrooms"
                  required
                  value={form.bedrooms}
                  onChange={(e) => updateField("bedrooms", e.target.value)}
                  className={`${inputClassName} mt-1`}
                >
                  <option value="">Select…</option>
                  {BEDROOM_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.bedrooms} />
              </div>

              <div>
                <label htmlFor="bathrooms" className={labelClassName}>
                  Number of bathrooms <span className="text-red-500">*</span>
                </label>
                <select
                  id="bathrooms"
                  required
                  value={form.bathrooms}
                  onChange={(e) => updateField("bathrooms", e.target.value)}
                  className={`${inputClassName} mt-1`}
                >
                  <option value="">Select…</option>
                  {BATHROOM_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                <FieldError message={errors.bathrooms} />
              </div>
            </div>

            <div>
              <label htmlFor="squareFootage" className={labelClassName}>
                Approximate square footage{" "}
                <span className="text-vm-muted font-normal">(optional)</span>
              </label>
              <select
                id="squareFootage"
                value={form.squareFootage}
                onChange={(e) => updateField("squareFootage", e.target.value)}
                className={`${inputClassName} mt-1`}
              >
                <option value="">Select…</option>
                {SQUARE_FOOTAGE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="bedConfiguration" className={labelClassName}>
                Bed configuration{" "}
                <span className="text-vm-muted font-normal">(optional)</span>
              </label>
              <input
                id="bedConfiguration"
                type="text"
                value={form.bedConfiguration}
                onChange={(e) => updateField("bedConfiguration", e.target.value)}
                placeholder="e.g. 2 Kings, 3 Queens, 1 Twin"
                className={`${inputClassName} mt-1`}
              />
              <FieldHelper>
                Helps us prepare the right number of linens for each visit
              </FieldHelper>
            </div>

            <div>
              <p className={labelClassName}>
                Property amenities{" "}
                <span className="text-vm-muted font-normal">(optional)</span>
              </p>
              <div className="mt-2 space-y-2">
                {PROPERTY_AMENITY_OPTIONS.map((amenity) => (
                  <label
                    key={amenity}
                    className="flex items-start gap-2 font-body text-sm text-vm-text cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.propertyAmenities.includes(amenity)}
                      onChange={() =>
                        toggleArrayField("propertyAmenities", amenity)
                      }
                      className="mt-0.5 rounded border-vm-border text-vm-cyan focus:ring-vm-cyan"
                    />
                    {amenity}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className={labelClassName}>Booking platform(s)</p>
              <div className="mt-2 space-y-2">
                {BOOKING_PLATFORMS.map((platform) => (
                  <label
                    key={platform}
                    className="flex items-center gap-2 font-body text-sm text-vm-text cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.bookingPlatforms.includes(platform)}
                      onChange={() =>
                        toggleArrayField("bookingPlatforms", platform)
                      }
                      className="rounded border-vm-border text-vm-cyan focus:ring-vm-cyan"
                    />
                    {platform}
                  </label>
                ))}
              </div>
            </div>
          </fieldset>

          {/* Access & Operations */}
          <fieldset className="space-y-4">
            <legend className="font-heading font-semibold text-vm-navy text-lg mb-2">
              Access and Operations
            </legend>

            <div>
              <p className={labelClassName}>
                Access type <span className="text-red-500">*</span>
              </p>
              <div className="mt-2 space-y-2">
                {ACCESS_TYPE_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className="flex items-start gap-2 font-body text-sm text-vm-text cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="accessType"
                      value={option}
                      checked={form.accessType === option}
                      onChange={(e) => updateField("accessType", e.target.value)}
                      className="mt-0.5 border-vm-border text-vm-cyan focus:ring-vm-cyan"
                    />
                    {option}
                  </label>
                ))}
              </div>
              <FieldError message={errors.accessType} />
            </div>

            {form.accessType === "Other (please describe)" && (
              <div>
                <label htmlFor="accessTypeOther" className={labelClassName}>
                  Access details <span className="text-red-500">*</span>
                </label>
                <input
                  id="accessTypeOther"
                  type="text"
                  value={form.accessTypeOther}
                  onChange={(e) =>
                    updateField("accessTypeOther", e.target.value)
                  }
                  className={`${inputClassName} mt-1`}
                />
                <FieldError message={errors.accessTypeOther} />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="guestCheckoutTime" className={labelClassName}>
                  Guest check-out time{" "}
                  <span className="text-vm-muted font-normal">(optional)</span>
                </label>
                <select
                  id="guestCheckoutTime"
                  value={form.guestCheckoutTime}
                  onChange={(e) =>
                    updateField("guestCheckoutTime", e.target.value)
                  }
                  className={`${inputClassName} mt-1`}
                >
                  <option value="">Select…</option>
                  {GUEST_CHECKOUT_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="guestCheckinTime" className={labelClassName}>
                  Guest check-in time{" "}
                  <span className="text-vm-muted font-normal">(optional)</span>
                </label>
                <select
                  id="guestCheckinTime"
                  value={form.guestCheckinTime}
                  onChange={(e) =>
                    updateField("guestCheckinTime", e.target.value)
                  }
                  className={`${inputClassName} mt-1`}
                >
                  <option value="">Select…</option>
                  {GUEST_CHECKIN_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {form.guestCheckoutTime === "Other" && (
              <div>
                <label
                  htmlFor="guestCheckoutTimeOther"
                  className={labelClassName}
                >
                  Check-out time details
                </label>
                <input
                  id="guestCheckoutTimeOther"
                  type="text"
                  value={form.guestCheckoutTimeOther}
                  onChange={(e) =>
                    updateField("guestCheckoutTimeOther", e.target.value)
                  }
                  className={`${inputClassName} mt-1`}
                />
              </div>
            )}

            {form.guestCheckinTime === "Other" && (
              <div>
                <label htmlFor="guestCheckinTimeOther" className={labelClassName}>
                  Check-in time details
                </label>
                <input
                  id="guestCheckinTimeOther"
                  type="text"
                  value={form.guestCheckinTimeOther}
                  onChange={(e) =>
                    updateField("guestCheckinTimeOther", e.target.value)
                  }
                  className={`${inputClassName} mt-1`}
                />
              </div>
            )}
          </fieldset>

          {/* Section 2 */}
          <fieldset className="space-y-4">
            <legend className="font-heading font-semibold text-vm-navy text-lg mb-2">
              Cleaning needs
            </legend>

            <div>
              <p className={labelClassName}>Type of service needed</p>
              <div className="mt-2 space-y-2">
                {SERVICE_TYPES.map((service) => (
                  <label
                    key={service}
                    className="flex items-start gap-2 font-body text-sm text-vm-text cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={form.serviceTypes.includes(service)}
                      onChange={() =>
                        toggleArrayField("serviceTypes", service)
                      }
                      className="mt-0.5 rounded border-vm-border text-vm-cyan focus:ring-vm-cyan"
                    />
                    {service}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="turnoverFrequency" className={labelClassName}>
                How often do guests turn over?
              </label>
              <select
                id="turnoverFrequency"
                value={form.turnoverFrequency}
                onChange={(e) =>
                  updateField("turnoverFrequency", e.target.value)
                }
                className={`${inputClassName} mt-1`}
              >
                <option value="">Select…</option>
                {TURNOVER_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className={labelClassName}>
                Do you currently have a cleaner?
              </p>
              <div className="mt-2 flex flex-wrap gap-4">
                {(["Yes", "No", "Sometimes"] as const).map((option) => (
                  <label
                    key={option}
                    className="flex items-center gap-2 font-body text-sm text-vm-text cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="hasCleaner"
                      value={option}
                      checked={form.hasCleaner === option}
                      onChange={(e) =>
                        updateField("hasCleaner", e.target.value)
                      }
                      className="border-vm-border text-vm-cyan focus:ring-vm-cyan"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <fieldset className="space-y-4 border-t border-vm-border pt-4">
              <legend className="font-heading font-semibold text-vm-navy text-base mb-2">
                Service preferences
              </legend>

              <div>
                <p className={labelClassName}>
                  Who provides linens and towels?{" "}
                  <span className="text-red-500">*</span>
                </p>
                <div className="mt-2 space-y-2">
                  {LINEN_PROVIDER_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex items-start gap-2 font-body text-sm text-vm-text cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="linenProvider"
                        value={option}
                        checked={form.linenProvider === option}
                        onChange={(e) =>
                          updateField("linenProvider", e.target.value)
                        }
                        className="mt-0.5 border-vm-border text-vm-cyan focus:ring-vm-cyan"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                <FieldError message={errors.linenProvider} />
              </div>

              <div>
                <p className={labelClassName}>
                  Same-day turnovers needed?{" "}
                  <span className="text-red-500">*</span>
                </p>
                <div className="mt-2 space-y-2">
                  {SAME_DAY_TURNOVER_OPTIONS.map((option) => (
                    <label
                      key={option}
                      className="flex items-start gap-2 font-body text-sm text-vm-text cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="sameDayTurnovers"
                        value={option}
                        checked={form.sameDayTurnovers === option}
                        onChange={(e) =>
                          updateField("sameDayTurnovers", e.target.value)
                        }
                        className="mt-0.5 border-vm-border text-vm-cyan focus:ring-vm-cyan"
                      />
                      {option}
                    </label>
                  ))}
                </div>
                <FieldError message={errors.sameDayTurnovers} />
              </div>

              <div>
                <label htmlFor="bookingAdvanceNotice" className={labelClassName}>
                  How far in advance do you know about bookings?{" "}
                  <span className="text-vm-muted font-normal">(optional)</span>
                </label>
                <select
                  id="bookingAdvanceNotice"
                  value={form.bookingAdvanceNotice}
                  onChange={(e) =>
                    updateField("bookingAdvanceNotice", e.target.value)
                  }
                  className={`${inputClassName} mt-1`}
                >
                  <option value="">Select…</option>
                  {BOOKING_ADVANCE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className={labelClassName}>
                  When is your property most active?{" "}
                  <span className="text-red-500">*</span>
                </p>
                <div className="mt-2 space-y-2">
                  {PROPERTY_ACTIVE_SEASON_OPTIONS.map((season) => (
                    <label
                      key={season}
                      className="flex items-start gap-2 font-body text-sm text-vm-text cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={form.propertyActiveSeasons.includes(season)}
                        onChange={() =>
                          toggleArrayField("propertyActiveSeasons", season)
                        }
                        className="mt-0.5 rounded border-vm-border text-vm-cyan focus:ring-vm-cyan"
                      />
                      {season}
                    </label>
                  ))}
                </div>
                <FieldError message={errors.propertyActiveSeasons} />
              </div>
            </fieldset>

            <div>
              <label htmlFor="specialInstructions" className={labelClassName}>
                Any special instructions or notes?{" "}
                <span className="text-vm-muted font-normal">(optional)</span>
              </label>
              <textarea
                id="specialInstructions"
                rows={4}
                value={form.specialInstructions}
                onChange={(e) =>
                  updateField("specialInstructions", e.target.value)
                }
                placeholder="Pets on property, keypad entry, specific products to use, areas to focus on…"
                className={`${inputClassName} mt-1 resize-y min-h-[100px]`}
              />
            </div>
          </fieldset>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-vm-cyan text-vm-navy font-heading font-semibold w-full py-3 rounded-lg hover:bg-vm-cyan-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Sending…" : "Request My Turnover Quote"}
            </button>
            <p className="font-body text-xs text-vm-muted text-center mt-3">
              No card needed. We&apos;ll reply within one business day.
            </p>
            {submitError && (
              <p className="text-red-500 text-xs mt-3 text-center">
                {submitError}
              </p>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}
