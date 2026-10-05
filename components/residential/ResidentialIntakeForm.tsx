"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  RESIDENTIAL_CONDITION_DISCLAIMER,
  RESIDENTIAL_CONDITION_FLAGS,
  RESIDENTIAL_CONTACT_METHODS,
  RESIDENTIAL_FREQUENCIES,
  RESIDENTIAL_SERVICE_TYPES,
  RESIDENTIAL_SUPPLIES,
} from "@/lib/residentialIntake/constants";
import {
  parseAttributionFromSearchParams,
  readStoredResidentialAttribution,
} from "@/lib/hostIntake/attribution";

const inputClass =
  "mt-1 w-full rounded-lg border border-vm-navy/15 bg-white px-3 py-2.5 font-body text-sm text-vm-navy focus:outline-none focus:ring-2 focus:ring-vm-cyan";
const labelClass = "block font-body text-sm font-semibold text-vm-navy";

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  serviceAddress: string;
  city: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  serviceType: string;
  frequency: string;
  preferredServiceDate: string;
  preferredContactMethod: string;
  pets: string;
  occupancyApprox: string;
  accessParking: string;
  suppliesProvidedBy: string;
  trashRequirements: string;
  laundryRequested: boolean;
  bedMakingRequested: boolean;
  lastProfessionalClean: string;
  specialInstructions: string;
  conditionFlags: string[];
  conditionOther: string;
};

const EMPTY: FormState = {
  fullName: "",
  email: "",
  phone: "",
  serviceAddress: "",
  city: "",
  bedrooms: "",
  bathrooms: "",
  squareFootage: "",
  serviceType: "",
  frequency: "",
  preferredServiceDate: "",
  preferredContactMethod: "",
  pets: "",
  occupancyApprox: "",
  accessParking: "",
  suppliesProvidedBy: "",
  trashRequirements: "",
  laundryRequested: false,
  bedMakingRequested: false,
  lastProfessionalClean: "",
  specialInstructions: "",
  conditionFlags: [],
  conditionOther: "",
};

export function ResidentialIntakeForm() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const showConditionNote = form.conditionFlags.length > 0;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleFlag = (id: string) => {
    setForm((prev) => ({
      ...prev,
      conditionFlags: prev.conditionFlags.includes(id)
        ? prev.conditionFlags.filter((flag) => flag !== id)
        : [...prev.conditionFlags, id],
    }));
  };

  const yesNo = useMemo(
    () =>
      [
        { value: true, label: "Yes" },
        { value: false, label: "No" },
      ] as const,
    []
  );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const stored = readStoredResidentialAttribution();
      const fromUrl =
        typeof window !== "undefined"
          ? parseAttributionFromSearchParams(new URLSearchParams(window.location.search), {
              landing: "/residential",
            })
          : null;
      const res = await fetch("/api/residential-intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          attribution: stored || fromUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Unable to submit request");
      }
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-xl border border-vm-cyan/30 bg-white p-6 text-center">
        <h3 className="font-heading text-xl font-bold text-vm-navy">Request received</h3>
        <p className="mt-3 font-body text-sm leading-relaxed text-vm-muted">
          Thank you. VelocityMaid will review your home details, confirm scope
          and pricing, and follow up before any work is scheduled. No payment is
          due from this form.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-vm-navy/10 bg-white p-5 shadow-sm sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Full name
          <input className={inputClass} required value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
        </label>
        <label className={labelClass}>
          Email
          <input type="email" className={inputClass} required value={form.email} onChange={(e) => set("email", e.target.value)} />
        </label>
        <label className={labelClass}>
          Phone
          <input className={inputClass} required value={form.phone} onChange={(e) => set("phone", e.target.value)} />
        </label>
        <label className={labelClass}>
          Preferred contact method
          <select className={inputClass} required value={form.preferredContactMethod} onChange={(e) => set("preferredContactMethod", e.target.value)}>
            <option value="">Select</option>
            {RESIDENTIAL_CONTACT_METHODS.map((method) => (
              <option key={method} value={method}>{method}</option>
            ))}
          </select>
        </label>
      </div>

      <label className={labelClass}>
        Service address
        <input className={inputClass} required value={form.serviceAddress} onChange={(e) => set("serviceAddress", e.target.value)} />
      </label>
      <label className={labelClass}>
        City / town
        <input className={inputClass} required value={form.city} onChange={(e) => set("city", e.target.value)} />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelClass}>
          Bedrooms
          <input className={inputClass} required value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
        </label>
        <label className={labelClass}>
          Bathrooms
          <input className={inputClass} required value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
        </label>
        <label className={labelClass}>
          Approx. square footage
          <input className={inputClass} required value={form.squareFootage} onChange={(e) => set("squareFootage", e.target.value)} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Service type
          <select className={inputClass} required value={form.serviceType} onChange={(e) => set("serviceType", e.target.value)}>
            <option value="">Select</option>
            {RESIDENTIAL_SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Frequency
          <select className={inputClass} required value={form.frequency} onChange={(e) => set("frequency", e.target.value)}>
            <option value="">Select</option>
            {RESIDENTIAL_FREQUENCIES.map((freq) => (
              <option key={freq} value={freq}>{freq}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="font-body text-xs text-vm-muted">
        Recurring preference is noted for planning. Each visit is scheduled as
        its own service — we do not auto-create a repeating series.
      </p>

      <label className={labelClass}>
        Preferred service date
        <input type="date" className={inputClass} required value={form.preferredServiceDate} onChange={(e) => set("preferredServiceDate", e.target.value)} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Pets
          <input className={inputClass} placeholder="None, or describe" value={form.pets} onChange={(e) => set("pets", e.target.value)} />
        </label>
        <label className={labelClass}>
          Approximate number of occupants
          <input className={inputClass} value={form.occupancyApprox} onChange={(e) => set("occupancyApprox", e.target.value)} />
        </label>
      </div>

      <label className={labelClass}>
        Access / parking information
        <textarea className={inputClass} rows={3} value={form.accessParking} onChange={(e) => set("accessParking", e.target.value)} />
      </label>

      <label className={labelClass}>
        Who supplies cleaning products?
        <select className={inputClass} required value={form.suppliesProvidedBy} onChange={(e) => set("suppliesProvidedBy", e.target.value)}>
          <option value="">Select</option>
          {RESIDENTIAL_SUPPLIES.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Trash requirements
        <textarea className={inputClass} rows={2} value={form.trashRequirements} onChange={(e) => set("trashRequirements", e.target.value)} />
      </label>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="sr-only">Laundry and bed-making</legend>
        <div>
          <p className={labelClass}>Laundry requested</p>
          <div className="mt-2 flex gap-4">
            {yesNo.map((option) => (
              <label key={`laundry-${option.label}`} className="font-body text-sm text-vm-navy">
                <input
                  type="radio"
                  className="mr-2"
                  checked={form.laundryRequested === option.value}
                  onChange={() => set("laundryRequested", option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
        <div>
          <p className={labelClass}>Bed-making or linen reset</p>
          <div className="mt-2 flex gap-4">
            {yesNo.map((option) => (
              <label key={`bed-${option.label}`} className="font-body text-sm text-vm-navy">
                <input
                  type="radio"
                  className="mr-2"
                  checked={form.bedMakingRequested === option.value}
                  onChange={() => set("bedMakingRequested", option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </div>
      </fieldset>

      <label className={labelClass}>
        Rough date of last professional cleaning
        <input className={inputClass} value={form.lastProfessionalClean} onChange={(e) => set("lastProfessionalClean", e.target.value)} />
      </label>

      <fieldset>
        <legend className={labelClass}>Condition assessment</legend>
        <p className="mt-1 font-body text-xs text-vm-muted">
          Bedroom count and square footage do not set the price by themselves.
          Unusual conditions are assessed before any extra work is approved.
        </p>
        <div className="mt-3 grid gap-2">
          {RESIDENTIAL_CONDITION_FLAGS.map((flag) => (
            <label key={flag.id} className="flex items-start gap-2 font-body text-sm text-vm-navy">
              <input
                type="checkbox"
                className="mt-1"
                checked={form.conditionFlags.includes(flag.id)}
                onChange={() => toggleFlag(flag.id)}
              />
              {flag.label}
            </label>
          ))}
        </div>
        {form.conditionFlags.includes("other") ? (
          <label className={`${labelClass} mt-3`}>
            Describe other unusual conditions
            <textarea className={inputClass} rows={2} required value={form.conditionOther} onChange={(e) => set("conditionOther", e.target.value)} />
          </label>
        ) : null}
        {showConditionNote ? (
          <p className="mt-3 rounded-lg bg-vm-cyan/10 px-3 py-2 font-body text-xs leading-relaxed text-vm-navy">
            {RESIDENTIAL_CONDITION_DISCLAIMER}
          </p>
        ) : null}
      </fieldset>

      <label className={labelClass}>
        Special instructions
        <textarea className={inputClass} rows={3} value={form.specialInstructions} onChange={(e) => set("specialInstructions", e.target.value)} />
      </label>

      {error ? (
        <p className="font-body text-sm text-vm-danger">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex w-full items-center justify-center rounded-md bg-vm-cyan px-5 py-3 font-heading text-xs font-bold uppercase tracking-wider text-vm-navy hover:bg-vm-cyan-dark disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Request a Residential Estimate"}
      </button>
    </form>
  );
}
