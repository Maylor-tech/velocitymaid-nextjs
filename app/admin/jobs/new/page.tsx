"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import type { TravelZone } from "@prisma/client";
import { useAdminShell } from "@/components/admin/shell/AdminShell";
import {
  shouldSuggestTravelFee,
  TRAVEL_ZONE_FEE,
  TRAVEL_ZONE_SHORT_LABEL,
  travelFeeLineDescription,
} from "@/lib/vermont/travelZone";

type StateCode = "VT" | "NJ" | "";

const VERMONT_SERVICES = [
  "Vacation Rental Turnover",
  "Deep Cleaning & Property Reset",
  "Move-In Cleaning",
  "Move-Out Cleaning",
  "Property Readiness",
  "Emergency Response Cleaning",
  "Property Walkthrough",
  "Office Prep",
  "Garage Cleanup",
  "Grill Deep Clean",
];

const NEW_JERSEY_SERVICES = [
  "Standard Residential Cleaning",
  "Deep Cleaning",
  "Recurring Cleaning",
  "Move-In Cleaning",
  "Move-Out Cleaning",
  "Apartment Cleaning",
];

// Readable label -> existing PaymentStatus enum value.
const PAYMENT_OPTIONS: { label: string; value: string; waived?: boolean }[] = [
  { label: "Not Paid Yet", value: "PENDING" },
  { label: "Deposit Paid", value: "DEPOSIT_PAID" },
  { label: "Paid in Full", value: "PAID" },
  { label: "Waived", value: "PAID", waived: true },
];

// Readable label -> existing JobStatus enum value.
const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "Completed", value: "COMPLETED" },
  { label: "Confirmed", value: "CONFIRMED" },
  { label: "Scheduled", value: "ASSIGNED" },
  { label: "Pending Review", value: "RECEIVED" },
];

const inputClass =
  "w-full rounded-lg border border-vm-border px-3 py-2 font-body text-vm-text outline-none focus:border-vm-cyan focus:ring-2 focus:ring-vm-cyan/30";
const labelClass = "mb-1 block font-heading text-sm font-medium text-vm-navy";
const sectionTitleClass =
  "mb-4 font-heading text-base font-semibold text-vm-navy";

const EMPTY_FORM = {
  clientFirstName: "",
  clientLastName: "",
  clientEmail: "",
  clientPhone: "",
  propertyAddress: "",
  propertyCity: "",
  state: "" as StateCode,
  serviceType: "",
  scheduledDate: "",
  scheduledStartTime: "",
  scheduledEndTime: "",
  totalAmount: "",
  paymentOptionIndex: "0",
  cleanerName: "",
  jobStatus: "ASSIGNED",
  completedBy: "",
  completedAt: "",
  cleanDurationMins: "",
  internalNotes: "",
};

export default function NewManualJobPage() {
  const { isBranchScoped } = useAdminShell();
  const [form, setForm] = useState({ ...EMPTY_FORM, state: "" as StateCode });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedJobId, setSavedJobId] = useState<string | null>(null);
  const [matchedCustomer, setMatchedCustomer] = useState<{
    id: string;
    travelZone: TravelZone | null;
    firstName: string;
    lastName: string;
  } | null>(null);
  const [travelFeeApplied, setTravelFeeApplied] = useState(false);
  const [travelBannerDismissed, setTravelBannerDismissed] = useState(false);

  const update = (key: keyof typeof EMPTY_FORM, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (isBranchScoped) {
      setForm((prev) => (prev.state === "VT" ? prev : { ...prev, state: "VT", serviceType: "" }));
    }
  }, [isBranchScoped]);

  const branch = form.state === "VT" ? "vermont" : form.state === "NJ" ? "new-jersey" : "";
  const serviceOptions = useMemo(() => {
    if (form.state === "VT") return VERMONT_SERVICES;
    if (form.state === "NJ") return NEW_JERSEY_SERVICES;
    return [];
  }, [form.state]);

  const isCompleted = form.jobStatus === "COMPLETED";

  const suggestedTravelFee = useMemo(() => {
    if (
      !shouldSuggestTravelFee(form.state, form.serviceType, matchedCustomer?.travelZone)
    ) {
      return null;
    }
    const zone = matchedCustomer!.travelZone!;
    const fee = TRAVEL_ZONE_FEE[zone];
    if (fee == null || fee <= 0) return null;
    return { zone, fee };
  }, [form.state, form.serviceType, matchedCustomer]);

  const showTravelBanner =
    suggestedTravelFee &&
    !travelFeeApplied &&
    !travelBannerDismissed;

  useEffect(() => {
    setTravelFeeApplied(false);
    setTravelBannerDismissed(false);
  }, [form.serviceType, matchedCustomer?.id]);

  const lookupCustomer = async (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      setMatchedCustomer(null);
      return;
    }
    try {
      const res = await fetch(
        `/api/admin/customers/lookup?email=${encodeURIComponent(trimmed)}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.success && data.customer) {
        setMatchedCustomer(data.customer);
      } else {
        setMatchedCustomer(null);
      }
    } catch {
      setMatchedCustomer(null);
    }
  };

  const handleAddTravelFee = () => {
    if (!suggestedTravelFee) return;
    const propertyLabel =
      form.propertyAddress.trim() ||
      [form.clientFirstName, form.clientLastName].filter(Boolean).join(" ") ||
      "Property";
    const line = travelFeeLineDescription(suggestedTravelFee.zone, propertyLabel);
    const currentTotal = Number(form.totalAmount) || 0;
    const newTotal = currentTotal + suggestedTravelFee.fee;
    const noteLine = `${line}: $${suggestedTravelFee.fee}`;
    setForm((prev) => ({
      ...prev,
      totalAmount: String(newTotal),
      internalNotes: prev.internalNotes.trim()
        ? `${prev.internalNotes.trim()}\n${noteLine}`
        : noteLine,
    }));
    setTravelFeeApplied(true);
  };

  const handleStateChange = (state: StateCode) => {
    setForm((prev) => ({
      ...prev,
      state,
      // Reset service type when market changes so a stale option isn't kept.
      serviceType: "",
    }));
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setSavedJobId(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.clientFirstName.trim()) return setError("First name is required.");
    if (!form.clientEmail.trim()) return setError("Email is required.");
    if (!form.propertyAddress.trim())
      return setError("Property address is required.");
    if (!form.propertyCity.trim()) return setError("City is required.");
    if (!form.state) return setError("State is required.");
    if (!form.serviceType) return setError("Service type is required.");
    if (!form.scheduledDate) return setError("Date is required.");
    if (!form.scheduledStartTime) return setError("Start time is required.");
    if (!form.totalAmount) return setError("Total amount is required.");

    const paymentOption =
      PAYMENT_OPTIONS[Number(form.paymentOptionIndex)] || PAYMENT_OPTIONS[0];

    // Surface a "waived" note since there is no WAIVED PaymentStatus enum.
    const notes = paymentOption.waived
      ? [form.internalNotes.trim(), "Payment waived."].filter(Boolean).join("\n")
      : form.internalNotes.trim();

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/jobs/create-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientFirstName: form.clientFirstName.trim(),
          clientLastName: form.clientLastName.trim() || undefined,
          clientEmail: form.clientEmail.trim(),
          clientPhone: form.clientPhone.trim() || undefined,
          propertyAddress: form.propertyAddress.trim(),
          propertyCity: form.propertyCity.trim(),
          propertyState: form.state,
          serviceType: form.serviceType,
          scheduledDate: form.scheduledDate,
          scheduledStartTime: form.scheduledStartTime,
          scheduledEndTime: form.scheduledEndTime || undefined,
          branch,
          totalAmount: Number(form.totalAmount),
          paymentStatus: paymentOption.value,
          cleanerName: form.cleanerName.trim() || undefined,
          jobStatus: form.jobStatus,
          completedBy: isCompleted
            ? form.completedBy.trim() || form.cleanerName.trim() || undefined
            : undefined,
          completedAt: isCompleted && form.completedAt ? form.completedAt : undefined,
          cleanDurationMins:
            isCompleted && form.cleanDurationMins
              ? Number(form.cleanDurationMins)
              : undefined,
          internalNotes: notes || undefined,
          marketLabel: branch,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save job");
      }
      setSavedJobId(data.jobId as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save job");
    } finally {
      setSubmitting(false);
    }
  };

  if (savedJobId) {
    return (
      <div className="min-h-screen bg-vm-surface p-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-vm-success/30 bg-vm-success-bg p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-vm-success" />
              <h2 className="font-heading text-lg font-semibold text-vm-navy">
                Job saved successfully.
              </h2>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/admin/jobs/${savedJobId}/complete`}
              className="inline-flex w-full items-center justify-center rounded-lg bg-vm-cyan px-4 py-3 font-heading font-semibold text-vm-navy transition-opacity hover:opacity-90"
            >
              Upload Photos &amp; Notify Client
            </Link>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex w-full items-center justify-center rounded-lg border border-vm-border bg-vm-white px-4 py-3 font-heading font-semibold text-vm-navy transition-colors hover:bg-vm-surface"
            >
              Add Another Job
            </button>
            <Link
              href="/admin/jobs"
              className="inline-flex w-full items-center justify-center px-4 py-2 font-body text-sm text-vm-muted hover:underline"
            >
              Back to Jobs
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vm-surface p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/admin/jobs"
          className="mb-4 inline-flex items-center font-body text-vm-cyan-dark hover:underline"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Link>

        <h1 className="mb-1 font-heading text-2xl font-semibold text-vm-navy">
          Add Job Manually
        </h1>
        <p className="mb-6 font-body text-sm text-vm-muted">
          Record a job booked offline (phone, text, or in person).
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* SECTION 1: CLIENT INFORMATION */}
          <section className="rounded-xl border border-vm-border bg-vm-white p-6">
            <h2 className={sectionTitleClass}>Client Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="firstName">
                  First Name *
                </label>
                <input
                  id="firstName"
                  className={inputClass}
                  value={form.clientFirstName}
                  onChange={(e) => update("clientFirstName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  className={inputClass}
                  value={form.clientLastName}
                  onChange={(e) => update("clientLastName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="email">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  className={inputClass}
                  value={form.clientEmail}
                  onChange={(e) => update("clientEmail", e.target.value)}
                  onBlur={(e) => lookupCustomer(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  className={inputClass}
                  value={form.clientPhone}
                  onChange={(e) => update("clientPhone", e.target.value)}
                />
              </div>
            </div>
            <p className="mt-3 font-body text-sm text-vm-muted">
              Already in the system? We&apos;ll match by email automatically.
              {matchedCustomer?.id && (
                <>
                  {" "}
                  <Link
                    href={`/admin/customers/${matchedCustomer.id}`}
                    className="font-semibold text-vm-cyan-dark hover:underline"
                  >
                    Edit property travel zone →
                  </Link>
                </>
              )}
            </p>
          </section>

          {/* SECTION 2: PROPERTY & SCHEDULING */}
          <section className="rounded-xl border border-vm-border bg-vm-white p-6">
            <h2 className={sectionTitleClass}>Property &amp; Scheduling</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="address">
                  Property Address (full street address) *
                </label>
                <input
                  id="address"
                  className={inputClass}
                  value={form.propertyAddress}
                  onChange={(e) => update("propertyAddress", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="city">
                  City *
                </label>
                <input
                  id="city"
                  className={inputClass}
                  value={form.propertyCity}
                  onChange={(e) => update("propertyCity", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="state">
                  State *
                </label>
                <select
                  id="state"
                  className={inputClass}
                  value={form.state}
                  onChange={(e) => handleStateChange(e.target.value as StateCode)}
                  disabled={isBranchScoped}
                >
                  <option value="">Select state…</option>
                  <option value="VT">Vermont</option>
                  {!isBranchScoped && <option value="NJ">New Jersey</option>}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="serviceType">
                  Service Type *
                </label>
                <select
                  id="serviceType"
                  className={inputClass}
                  value={form.serviceType}
                  onChange={(e) => update("serviceType", e.target.value)}
                  disabled={!form.state}
                >
                  <option value="">
                    {form.state ? "Select service…" : "Select a state first"}
                  </option>
                  {serviceOptions.map((svc) => (
                    <option key={svc} value={svc}>
                      {svc}
                    </option>
                  ))}
                </select>
              </div>

              {showTravelBanner && suggestedTravelFee && (
                <div className="sm:col-span-2 rounded-lg border border-vm-warning/40 bg-vm-warning-bg p-4">
                  <p className="font-body text-sm text-vm-navy">
                    This property is in{" "}
                    <strong>{TRAVEL_ZONE_SHORT_LABEL[suggestedTravelFee.zone]}</strong>.
                    Standalone visits typically include a{" "}
                    <strong>${suggestedTravelFee.fee}</strong> travel fee. Add to this job?
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleAddTravelFee}
                      className="rounded-lg bg-vm-navy px-4 py-2 font-heading text-xs font-semibold text-vm-white hover:opacity-90"
                    >
                      Add Travel Fee
                    </button>
                    <button
                      type="button"
                      onClick={() => setTravelBannerDismissed(true)}
                      className="rounded-lg border border-vm-border bg-vm-white px-4 py-2 font-heading text-xs font-semibold text-vm-navy hover:bg-vm-surface"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass} htmlFor="date">
                  Date *
                </label>
                <input
                  id="date"
                  type="date"
                  className={inputClass}
                  value={form.scheduledDate}
                  onChange={(e) => update("scheduledDate", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="startTime">
                    Start Time *
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    className={inputClass}
                    value={form.scheduledStartTime}
                    onChange={(e) => update("scheduledStartTime", e.target.value)}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor="endTime">
                    End Time
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    className={inputClass}
                    value={form.scheduledEndTime}
                    onChange={(e) => update("scheduledEndTime", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: PAYMENT & ASSIGNMENT */}
          <section className="rounded-xl border border-vm-border bg-vm-white p-6">
            <h2 className={sectionTitleClass}>Payment &amp; Assignment</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor="totalAmount">
                  Total Amount ($) *
                </label>
                <input
                  id="totalAmount"
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  value={form.totalAmount}
                  onChange={(e) => update("totalAmount", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="paymentStatus">
                  Payment Status *
                </label>
                <select
                  id="paymentStatus"
                  className={inputClass}
                  value={form.paymentOptionIndex}
                  onChange={(e) => update("paymentOptionIndex", e.target.value)}
                >
                  {PAYMENT_OPTIONS.map((opt, i) => (
                    <option key={opt.label} value={String(i)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="cleanerName">
                  Cleaner Name
                </label>
                <input
                  id="cleanerName"
                  className={inputClass}
                  placeholder="e.g. Caryll"
                  value={form.cleanerName}
                  onChange={(e) => update("cleanerName", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* SECTION 4: JOB STATUS & NOTES */}
          <section className="rounded-xl border border-vm-border bg-vm-white p-6">
            <h2 className={sectionTitleClass}>Job Status &amp; Notes</h2>
            <div className="space-y-4">
              <div>
                <label className={labelClass} htmlFor="jobStatus">
                  Job Status *
                </label>
                <select
                  id="jobStatus"
                  className={inputClass}
                  value={form.jobStatus}
                  onChange={(e) => update("jobStatus", e.target.value)}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.label} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {isCompleted && (
                <div className="grid grid-cols-1 gap-4 rounded-lg bg-vm-surface p-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="completedBy">
                      Completed By
                    </label>
                    <input
                      id="completedBy"
                      className={inputClass}
                      value={form.completedBy || form.cleanerName}
                      onChange={(e) => update("completedBy", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="completedAt">
                      Date &amp; Time Completed
                    </label>
                    <input
                      id="completedAt"
                      type="datetime-local"
                      className={inputClass}
                      value={form.completedAt}
                      onChange={(e) => update("completedAt", e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="duration">
                      Duration in Minutes
                    </label>
                    <input
                      id="duration"
                      type="number"
                      min={0}
                      className={inputClass}
                      value={form.cleanDurationMins}
                      onChange={(e) => update("cleanDurationMins", e.target.value)}
                    />
                    <p className="mt-1 font-body text-sm text-vm-muted">
                      2.5 hours = 150 minutes
                    </p>
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass} htmlFor="internalNotes">
                  Internal Notes
                </label>
                <textarea
                  id="internalNotes"
                  rows={4}
                  className={inputClass}
                  placeholder="Notes visible to admin only — not sent to client"
                  value={form.internalNotes}
                  onChange={(e) => update("internalNotes", e.target.value)}
                />
              </div>
            </div>
          </section>

          {error && (
            <p className="font-body text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-vm-cyan px-4 py-3 font-heading font-semibold text-vm-navy transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save Job"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
