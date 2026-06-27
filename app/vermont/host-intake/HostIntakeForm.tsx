"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

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

type FormFields = {
  propertyAddress: string;
  city: string;
  bedrooms: string;
  bathrooms: string;
  bookingPlatforms: string[];
  serviceTypes: string[];
  turnoverFrequency: string;
  hasCleaner: string;
  specialInstructions: string;
  fullName: string;
  email: string;
  phone: string;
  preferredContact: string;
  bestTimeToReach: string;
};

type FormErrors = Partial<Record<keyof FormFields, string>>;

const initialForm: FormFields = {
  propertyAddress: "",
  city: "",
  bedrooms: "",
  bathrooms: "",
  bookingPlatforms: [],
  serviceTypes: [],
  turnoverFrequency: "",
  hasCleaner: "",
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-red-500 text-xs mt-1">{message}</p>;
}

export default function HostIntakeForm() {
  const [form, setForm] = useState<FormFields>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [firstName, setFirstName] = useState("");

  function updateField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError(null);
  }

  function toggleArrayField(
    key: "bookingPlatforms" | "serviceTypes",
    value: string
  ) {
    setForm((prev) => {
      const current = prev[key];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [key]: next };
    });
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (!form.propertyAddress.trim()) {
      next.propertyAddress = "Property address is required.";
    }
    if (!form.city.trim()) {
      next.city = "City / town is required.";
    }
    if (!form.bedrooms) {
      next.bedrooms = "Please select the number of bedrooms.";
    }
    if (!form.bathrooms) {
      next.bathrooms = "Please select the number of bathrooms.";
    }
    if (!form.fullName.trim()) {
      next.fullName = "Full name is required.";
    }
    if (!form.email.trim()) {
      next.email = "Email address is required.";
    } else if (!isValidEmail(form.email.trim())) {
      next.email = "Please enter a valid email address.";
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

    try {
      const res = await fetch("/api/host-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Submission failed");
      }

      const name = form.fullName.trim().split(/\s+/)[0] || "there";
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
      <div className="min-h-screen bg-vm-surface font-body">
        <header className="bg-vm-navy border-b border-white/10">
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
        </header>

        <main className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-[560px] mx-auto bg-white border border-vm-border rounded-xl p-8 sm:p-8 text-center">
            <h1 className="font-heading font-semibold text-vm-navy text-2xl mb-4">
              You&apos;re all set, {firstName}!
            </h1>
            <p className="font-body text-vm-muted text-sm leading-relaxed mb-8">
              We&apos;ll be in touch within 24 hours to confirm your quote and
              next steps. Check your email — we&apos;ll send a summary shortly.
            </p>
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
    <div className="min-h-screen bg-vm-surface font-body">
      <header className="bg-vm-navy border-b border-white/10">
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
      </header>

      <main className="px-4 sm:px-6 py-8 sm:py-16">
        <div className="max-w-[560px] mx-auto mb-8 text-center">
          <h1 className="font-heading font-bold text-vm-navy text-2xl sm:text-3xl mb-2">
            Host intake form
          </h1>
          <p className="font-body text-vm-muted text-sm">
            Tell us about your Vermont rental and we&apos;ll send a custom quote
            within 24 hours.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="max-w-[560px] mx-auto bg-white border border-vm-border rounded-xl p-6 sm:p-8 space-y-10"
        >
          {/* Section 1 */}
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

          {/* Section 3 */}
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
                Phone number{" "}
                <span className="text-vm-muted font-normal">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                className={`${inputClassName} mt-1`}
                autoComplete="tel"
              />
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

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-vm-cyan text-vm-navy font-heading font-semibold w-full py-3 rounded-lg hover:bg-vm-cyan-dark transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Sending…" : "Submit inquiry"}
            </button>
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
