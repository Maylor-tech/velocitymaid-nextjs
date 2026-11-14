"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import Footer from "@/components/Footer";
import { trackEvent } from "@/lib/analytics/trackEvent";
import {
  NJ_FREQUENCY_OPTIONS,
  NJ_LEAD_SOURCES,
  NJ_SERVICE_CITIES,
  NJ_SERVICE_TYPE_OPTIONS,
  njCitiesShortList,
} from "@/lib/markets/newJersey";
import { validateNjQuotePayload } from "@/lib/markets/njQuoteValidation";

type FormData = {
  name: string;
  phone: string;
  email: string;
  city: string;
  zip: string;
  addressLine: string;
  bedrooms: string;
  bathrooms: string;
  homeType: string;
  serviceType: string;
  frequency: string;
  preferredDate: string;
  urgency: string;
  referralSource: string;
  previousService: boolean;
  pets: boolean;
  scheduleFlexible: boolean;
};

const initialForm: FormData = {
  name: "",
  phone: "",
  email: "",
  city: "",
  zip: "",
  addressLine: "",
  bedrooms: "",
  bathrooms: "",
  homeType: "",
  serviceType: "RECURRING",
  frequency: "biweekly",
  preferredDate: "",
  urgency: "this_week",
  referralSource: "",
  previousService: false,
  pets: false,
  scheduleFlexible: false,
};

const inputClass =
  "w-full min-h-[48px] px-4 py-3 border border-vm-border rounded-lg focus:ring-2 focus:ring-vm-cyan outline-none";
const labelClass = "block text-sm font-semibold text-vm-navy mb-2";

export default function LeadCapturePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState<FormData>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);
  const submitLockRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackEvent("quote_start", {
      market: "new_jersey",
      quote_flow: "progressive",
    });
  }, []);

  const isRecurring = formData.serviceType === "RECURRING";
  const showFrequency =
    isRecurring || formData.serviceType === "STANDARD";
  const dateRequired =
    !formData.scheduleFlexible &&
    formData.urgency !== "flexible" &&
    formData.frequency !== "unsure" &&
    !isRecurring;

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  }

  function validateStep(current: 1 | 2 | 3): string | null {
    if (current === 1) {
      if (!formData.name.trim()) return "Full name is required.";
      if (!formData.phone.trim()) return "Phone is required.";
      if (!formData.email.trim()) return "Email is required.";
      if (!formData.city) return "Select your city.";
      if (!formData.zip.trim()) return "ZIP is required.";
      return null;
    }
    if (current === 2) {
      if (!formData.serviceType) return "Select a service type.";
      if (!formData.frequency) return "Select frequency.";
      if (!formData.bedrooms || !formData.bathrooms || !formData.homeType) {
        return "Home details are required.";
      }
      if (dateRequired && !formData.preferredDate) {
        return "Preferred date is required, or choose flexible scheduling.";
      }
      return null;
    }
    return null;
  }

  function goNext() {
    const message = validateStep(step);
    if (message) {
      setError(message);
      return;
    }
    trackEvent("quote_step_complete", {
      market: "new_jersey",
      step,
      service: formData.serviceType,
    });
    setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitLockRef.current || isSubmitting) return;

    const stepError = validateStep(3) || validateStep(1) || validateStep(2);
    if (stepError) {
      setError(stepError);
      return;
    }

    const serverShape = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      zip: formData.zip.trim(),
      city: formData.city,
      addressLine: formData.addressLine.trim() || undefined,
      bedrooms: formData.bedrooms
        ? parseInt(formData.bedrooms, 10)
        : undefined,
      bathrooms: formData.bathrooms
        ? parseInt(formData.bathrooms, 10)
        : undefined,
      homeType: formData.homeType,
      serviceType: formData.serviceType,
      frequency: formData.frequency,
      preferredDate: formData.preferredDate || undefined,
      urgency: formData.urgency,
      referralSource: formData.referralSource || undefined,
      scheduleFlexible:
        formData.scheduleFlexible || formData.urgency === "flexible",
    };

    const check = validateNjQuotePayload(serverShape);
    if (check.ok === false) {
      setError(check.error);
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...serverShape,
          previousService: formData.previousService,
          pets: formData.pets,
          branch: "new-jersey",
          source: "lead-new-jersey-page",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to submit lead");
      }
      trackEvent("quote_submit", {
        market: "new_jersey",
        service: formData.serviceType,
        frequency: formData.frequency,
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Submit lead error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit lead. Please try again."
      );
      submitLockRef.current = false;
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-vm-surface text-vm-navy">
        <SiteHeader />
        <div className="flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-white text-vm-navy rounded-2xl shadow-2xl p-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-vm-success mx-auto mb-4" />
            <h2 className="font-heading text-2xl font-bold mb-4">Thank You!</h2>
            <p className="text-vm-text mb-6">
              We&apos;ve received your request. Our New Jersey team will follow
              up shortly. Quoting and scheduling stay with VelocityMaid — no
              deposit and no automatic booking.
            </p>
            <Link
              href="/new-jersey"
              className="inline-flex min-h-[48px] items-center justify-center bg-vm-navy text-white px-6 py-3 rounded-lg font-semibold"
            >
              Back to New Jersey
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vm-surface">
      <SiteHeader />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-vm-navy mb-2 text-center">
            Get a Free Quote
          </h1>
          <p className="text-vm-muted text-center mb-2">
            Recurring residential cleaning first — then deep cleans and
            move-in/move-out.
          </p>
          <p className="text-vm-muted text-center text-sm mb-6">
            Serving {njCitiesShortList()}.
          </p>

          <div className="mb-6 flex items-center justify-between">
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

          {error && (
            <div className="bg-vm-surface border border-vm-danger rounded-lg p-4 mb-6 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-vm-danger mt-0.5 shrink-0" />
              <p className="text-vm-danger">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {step === 1 ? (
              <>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className={labelClass}>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={formData.name}
                      onChange={(e) => update("name", e.target.value)}
                      className={inputClass}
                      autoComplete="name"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className={labelClass}>
                      Phone *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => update("phone", e.target.value)}
                      className={inputClass}
                      autoComplete="tel"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className={labelClass}>
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => update("email", e.target.value)}
                      className={inputClass}
                      autoComplete="email"
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className={labelClass}>
                      City / town *
                    </label>
                    <select
                      id="city"
                      value={formData.city}
                      onChange={(e) => {
                        update("city", e.target.value);
                        trackEvent("market_select", {
                          market: "new_jersey",
                          city: e.target.value,
                        });
                      }}
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      {NJ_SERVICE_CITIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="zip" className={labelClass}>
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => update("zip", e.target.value)}
                      className={inputClass}
                      maxLength={5}
                      inputMode="numeric"
                    />
                  </div>
                  <div>
                    <label htmlFor="addressLine" className={labelClass}>
                      Street address (optional)
                    </label>
                    <input
                      type="text"
                      id="addressLine"
                      value={formData.addressLine}
                      onChange={(e) => update("addressLine", e.target.value)}
                      className={inputClass}
                      placeholder="We can confirm on the follow-up call"
                    />
                  </div>
                </div>
              </>
            ) : null}

            {step === 2 ? (
              <>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="serviceType" className={labelClass}>
                      Service type *
                    </label>
                    <select
                      id="serviceType"
                      value={formData.serviceType}
                      onChange={(e) => {
                        const next = e.target.value;
                        update("serviceType", next);
                        trackEvent("service_select", {
                          market: "new_jersey",
                          service: next,
                        });
                        if (next === "RECURRING" && !formData.frequency) {
                          update("frequency", "biweekly");
                        }
                        if (next !== "RECURRING" && formData.frequency === "biweekly") {
                          update("frequency", "one_time");
                        }
                      }}
                      className={inputClass}
                    >
                      {NJ_SERVICE_TYPE_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  {showFrequency ? (
                    <div>
                      <label htmlFor="frequency" className={labelClass}>
                        Frequency *
                      </label>
                      <select
                        id="frequency"
                        value={formData.frequency}
                        onChange={(e) => update("frequency", e.target.value)}
                        className={inputClass}
                      >
                        {NJ_FREQUENCY_OPTIONS.filter((opt) =>
                          isRecurring
                            ? opt.value !== "one_time"
                            : true
                        ).map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="frequency" className={labelClass}>
                        Cadence *
                      </label>
                      <select
                        id="frequency"
                        value={formData.frequency}
                        onChange={(e) => update("frequency", e.target.value)}
                        className={inputClass}
                      >
                        {NJ_FREQUENCY_OPTIONS.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label htmlFor="urgency" className={labelClass}>
                      Timing preference *
                    </label>
                    <select
                      id="urgency"
                      value={formData.urgency}
                      onChange={(e) => {
                        update("urgency", e.target.value);
                        if (e.target.value === "flexible") {
                          update("scheduleFlexible", true);
                        }
                      }}
                      className={inputClass}
                    >
                      <option value="asap">As soon as possible</option>
                      <option value="this_week">This week</option>
                      <option value="next_week">Next week</option>
                      <option value="flexible">Flexible</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="preferredDate" className={labelClass}>
                      Preferred date
                      {dateRequired ? " *" : " (optional)"}
                    </label>
                    <input
                      type="date"
                      id="preferredDate"
                      value={formData.preferredDate}
                      onChange={(e) => update("preferredDate", e.target.value)}
                      className={inputClass}
                      disabled={formData.scheduleFlexible}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2 text-sm text-vm-navy min-h-[48px]">
                      <input
                        type="checkbox"
                        checked={formData.scheduleFlexible}
                        onChange={(e) =>
                          update("scheduleFlexible", e.target.checked)
                        }
                      />
                      Scheduling is flexible — ops can propose times
                    </label>
                  </div>
                  <div>
                    <label htmlFor="bedrooms" className={labelClass}>
                      Bedrooms *
                    </label>
                    <select
                      id="bedrooms"
                      value={formData.bedrooms}
                      onChange={(e) => update("bedrooms", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5+</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="bathrooms" className={labelClass}>
                      Bathrooms *
                    </label>
                    <select
                      id="bathrooms"
                      value={formData.bathrooms}
                      onChange={(e) => update("bathrooms", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4+</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="homeType" className={labelClass}>
                      Home type *
                    </label>
                    <select
                      id="homeType"
                      value={formData.homeType}
                      onChange={(e) => update("homeType", e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select</option>
                      <option value="apartment">Apartment</option>
                      <option value="condo">Condo</option>
                      <option value="house">House</option>
                      <option value="townhome">Townhome</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </>
            ) : null}

            {step === 3 ? (
              <>
                <div>
                  <label htmlFor="referralSource" className={labelClass}>
                    How did you hear about us? (optional)
                  </label>
                  <select
                    id="referralSource"
                    value={formData.referralSource}
                    onChange={(e) => update("referralSource", e.target.value)}
                    className={inputClass}
                  >
                    <option value="">Prefer not to say</option>
                    {NJ_LEAD_SOURCES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm text-vm-navy min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={formData.pets}
                    onChange={(e) => update("pets", e.target.checked)}
                  />
                  Pets in the home
                </label>
                <label className="flex items-center gap-2 text-sm text-vm-navy min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={formData.previousService}
                    onChange={(e) =>
                      update("previousService", e.target.checked)
                    }
                  />
                  I&apos;ve used VelocityMaid before
                </label>
                <p className="font-body text-xs text-vm-muted">
                  No deposit and no automatic booking. We confirm scope and
                  pricing before scheduling.
                </p>
              </>
            ) : null}

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between pt-2">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
                  }}
                  className="min-h-[48px] rounded-lg border border-vm-border px-5 py-3 font-semibold text-vm-navy"
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
                  className="min-h-[48px] rounded-lg bg-vm-navy text-white px-6 py-3 font-semibold"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="min-h-[48px] w-full sm:w-auto bg-vm-navy text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting…" : "Get a Free Quote"}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
}
