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
import {
  buildManualJobRequest,
  emptyVisitDraft,
  serviceTypesFor,
  visitDraftFromProperty,
  type ManualCustomerMode,
  type ManualPriceMode,
  type ServiceCategory,
  type VisitDraft,
} from "@/lib/admin/manualJobCreate";

type StateCode = "VT" | "NJ" | "";

const PAYMENT_OPTIONS: { label: string; value: string }[] = [
  { label: "Not Paid Yet", value: "PENDING" },
  { label: "Deposit Paid", value: "DEPOSIT_PAID" },
  { label: "Paid in Full", value: "PAID" },
];

const inputClass =
  "w-full rounded-lg border border-vm-border px-3 py-2 font-body text-vm-text outline-none focus:border-vm-cyan focus:ring-2 focus:ring-vm-cyan/30";
const labelClass = "mb-1 block font-heading text-sm font-medium text-vm-navy";
const sectionTitleClass = "mb-4 font-heading text-base font-semibold text-vm-navy";

type SearchHit = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
};

type PropertyOption = {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  useType: "HOST" | "RESIDENTIAL" | null;
  ResidentialProfile: {
    agreedPrice: string | number | null;
    serviceType: string | null;
  } | null;
};

type SelectedCustomer = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  travelZone: TravelZone | null;
  Property: PropertyOption[];
};

type SameDayJob = {
  id: string;
  jobReference: string | null;
  status: string;
  serviceType: string | null;
};

function moneyNumber(value: string | number | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function stateCode(value: string | null | undefined): StateCode {
  if (value === "VT" || value === "Vermont") return "VT";
  if (value === "NJ" || value === "New Jersey") return "NJ";
  return "";
}

export function ManualJobForm({ fetcher = fetch }: { fetcher?: typeof fetch }) {
  const { isBranchScoped } = useAdminShell();
  const [customerMode, setCustomerMode] = useState<ManualCustomerMode>("existing");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchHits, setSearchHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<SelectedCustomer | null>(null);
  const [propertyId, setPropertyId] = useState("");
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>("VACATION_RENTAL");
  const [priceMode, setPriceMode] = useState<ManualPriceMode>("operational");
  const [customerPrice, setCustomerPrice] = useState("");
  const [operationalAmount, setOperationalAmount] = useState("");
  const [agreedPrice, setAgreedPrice] = useState<number | null>(null);
  const [sameDayJobs, setSameDayJobs] = useState<SameDayJob[]>([]);
  const [packagePrice, setPackagePrice] = useState<{
    customerPrice: number;
    operationalPrice: number | null;
    rateLabel: string;
  } | null>(null);
  const [allowanceDisplay, setAllowanceDisplay] = useState<{
    preferredMethod: string | null;
    estimatedAllowance: number | null;
    availability: "zero" | "estimated" | "unavailable";
  } | null>(null);
  const [form, setForm] = useState({
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
    guestCheckInDate: "",
    guestCheckOutDate: "",
    paymentStatus: "PENDING",
    internalNotes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedJobId, setSavedJobId] = useState<string | null>(null);
  const [travelFeeApplied, setTravelFeeApplied] = useState(false);
  const [travelBannerDismissed, setTravelBannerDismissed] = useState(false);
  const [customerPricePreview, setCustomerPricePreview] = useState<number | null>(null);
  const [allowancePreview, setAllowancePreview] = useState<number | null>(null);
  const [previewWarning, setPreviewWarning] = useState<string | null>(null);

  const update = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    if (isBranchScoped) {
      setForm((prev) => (prev.state === "VT" ? prev : { ...prev, state: "VT", serviceType: "" }));
    }
  }, [isBranchScoped]);

  useEffect(() => {
    if (customerMode !== "existing") return;
    const q = searchQuery.trim();
    if (q.length < 2 || selectedCustomer) {
      setSearchHits([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setSearching(true);
      fetcher(`/api/admin/customers?q=${encodeURIComponent(q)}&limit=8`, {
        credentials: "include",
      })
        .then((r) => r.json())
        .then((data) => {
          if (cancelled) return;
          setSearchHits(Array.isArray(data.customers) ? data.customers : []);
        })
        .catch(() => {
          if (!cancelled) setSearchHits([]);
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, customerMode, selectedCustomer, fetcher]);

  useEffect(() => {
    if (priceMode !== "operational") {
      setCustomerPricePreview(null);
      setAllowancePreview(null);
      setPreviewWarning(null);
      return;
    }
    const amount = Number(operationalAmount);
    if (!operationalAmount || !Number.isFinite(amount) || amount < 0) {
      setCustomerPricePreview(null);
      setAllowancePreview(null);
      setPreviewWarning(null);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      fetcher("/api/admin/pricing/protect-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ operationalSubtotal: amount }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (cancelled || !d.success) return;
          setCustomerPricePreview(Number(d.customerPrice));
          setAllowancePreview(Number(d.processingAllowanceEstimated ?? 0));
          setPreviewWarning(d.warning ?? null);
        })
        .catch(() => {
          if (!cancelled) {
            setCustomerPricePreview(amount);
            setAllowancePreview(0);
            setPreviewWarning("Could not preview processing protection.");
          }
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [operationalAmount, priceMode, fetcher]);

  useEffect(() => {
    if (!propertyId || !form.scheduledDate || customerMode !== "existing") {
      setSameDayJobs([]);
      setPackagePrice(null);
      setAllowanceDisplay(null);
      return;
    }
    let cancelled = false;
    const params = new URLSearchParams({
      propertyId,
      scheduledDate: form.scheduledDate,
      ...(selectedCustomer ? { customerId: selectedCustomer.id } : {}),
      ...(form.serviceType
        ? { serviceCategory, serviceType: form.serviceType }
        : {}),
    });
    fetcher(`/api/admin/jobs/create-manual?${params.toString()}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setSameDayJobs(Array.isArray(data.sameDayJobs) ? data.sameDayJobs : []);
        setPackagePrice(
          data.packagePrice && Number.isFinite(Number(data.packagePrice.customerPrice))
            ? {
                customerPrice: Number(data.packagePrice.customerPrice),
                operationalPrice:
                  data.packagePrice.operationalPrice == null
                    ? null
                    : Number(data.packagePrice.operationalPrice),
                rateLabel: String(data.packagePrice.rateLabel || "Standing rate"),
              }
            : null
        );
        const display = data.processingAllowanceDisplay;
        setAllowanceDisplay(
          display && (display.availability === "zero" || display.availability === "estimated" || display.availability === "unavailable")
            ? {
                preferredMethod: display.preferredMethod ?? null,
                estimatedAllowance:
                  display.estimatedAllowance == null ? null : Number(display.estimatedAllowance),
                availability: display.availability,
              }
            : null
        );
      })
      .catch(() => {
        if (!cancelled) {
          setSameDayJobs([]);
          setPackagePrice(null);
          setAllowanceDisplay(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId, form.scheduledDate, form.serviceType, serviceCategory, customerMode, selectedCustomer, fetcher]);

  const serviceOptions = useMemo(
    () => serviceTypesFor(serviceCategory),
    [serviceCategory]
  );

  const selectedProperty = selectedCustomer?.Property.find((property) => property.id === propertyId) ?? null;

  const suggestedTravelFee = useMemo(() => {
    if (
      !shouldSuggestTravelFee(form.state, form.serviceType, selectedCustomer?.travelZone)
    ) {
      return null;
    }
    const zone = selectedCustomer!.travelZone!;
    const fee = TRAVEL_ZONE_FEE[zone];
    if (fee == null || fee <= 0) return null;
    return { zone, fee };
  }, [form.state, form.serviceType, selectedCustomer]);

  const showTravelBanner = suggestedTravelFee && !travelFeeApplied && !travelBannerDismissed;

  useEffect(() => {
    setTravelFeeApplied(false);
    setTravelBannerDismissed(false);
  }, [form.serviceType, selectedCustomer?.id]);

  const [visitPriceOverride, setVisitPriceOverride] = useState("");
  const [visitOperationalOverride, setVisitOperationalOverride] = useState("");
  const [priceOverrideReason, setPriceOverrideReason] = useState("");

  const applyVisitDraft = (draft: VisitDraft, keepState = false) => {
    setVisitPriceOverride("");
    setVisitOperationalOverride("");
    setPriceOverrideReason("");
    setPackagePrice(null);
    setPropertyId(draft.propertyId);
    setServiceCategory(draft.serviceCategory);
    setAgreedPrice(draft.agreedPrice);
    setCustomerPrice(draft.customerPrice);
    setOperationalAmount(draft.operationalAmount);
    setPriceMode(draft.priceMode);
    setTravelFeeApplied(draft.travelFeeApplied);
    setTravelBannerDismissed(draft.travelBannerDismissed);
    setSameDayJobs([]);
    setForm((prev) => ({
      ...prev,
      propertyAddress: draft.propertyAddress,
      propertyCity: draft.propertyCity,
      state: (draft.state as StateCode) || (keepState ? prev.state : ""),
      serviceType: draft.serviceType,
      guestCheckInDate: draft.guestCheckInDate,
      guestCheckOutDate: draft.guestCheckOutDate,
      internalNotes: draft.internalNotes,
    }));
  };

  const applyProperty = (property: PropertyOption) => {
    applyVisitDraft(
      visitDraftFromProperty(
        {
          id: property.id,
          address: property.address,
          city: property.city,
          state: stateCode(property.state) || undefined,
          useType: property.useType,
          residentialServiceType: property.ResidentialProfile?.serviceType,
          agreedPrice: moneyNumber(property.ResidentialProfile?.agreedPrice),
        },
        form.internalNotes,
        form.state
      ),
      true
    );
  };

  const selectCustomer = async (id: string) => {
    setError(null);
    const res = await fetcher(`/api/admin/customers/${id}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok || !data.success || !data.customer) {
      setError(data.error || "Could not load that customer");
      return;
    }
    const customer = data.customer as SelectedCustomer;
    setSelectedCustomer(customer);
    setSearchHits([]);
    setSearchQuery(`${customer.firstName} ${customer.lastName}`.trim());
    setForm((prev) => ({
      ...prev,
      clientFirstName: customer.firstName,
      clientLastName: customer.lastName,
      clientEmail: customer.email,
      clientPhone: customer.phone || "",
    }));
    if (customer.Property.length === 1) {
      applyProperty(customer.Property[0]);
    } else {
      applyVisitDraft(emptyVisitDraft(form.internalNotes));
    }
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setSearchQuery("");
    setSearchHits([]);
    applyVisitDraft(emptyVisitDraft(form.internalNotes));
    setForm((prev) => ({
      ...prev,
      clientFirstName: "",
      clientLastName: "",
      clientEmail: "",
      clientPhone: "",
    }));
  };

  const handleAddTravelFee = () => {
    if (!suggestedTravelFee) return;
    const propertyLabel =
      form.propertyAddress.trim() ||
      [form.clientFirstName, form.clientLastName].filter(Boolean).join(" ") ||
      "Property";
    const line = travelFeeLineDescription(suggestedTravelFee.zone, propertyLabel);
    const noteLine = `${line}: $${suggestedTravelFee.fee}`;
    if (priceMode === "customer") {
      const current = Number(customerPrice) || 0;
      setCustomerPrice(String(current + suggestedTravelFee.fee));
    } else {
      const current = Number(operationalAmount) || 0;
      setOperationalAmount(String(current + suggestedTravelFee.fee));
    }
    setForm((prev) => ({
      ...prev,
      internalNotes: prev.internalNotes.trim()
        ? `${prev.internalNotes.trim()}\n${noteLine}`
        : noteLine,
    }));
    setTravelFeeApplied(true);
  };

  const handleCategoryChange = (category: ServiceCategory) => {
    setServiceCategory(category);
    setForm((prev) => ({
      ...prev,
      serviceType: "",
      guestCheckInDate: category === "VACATION_RENTAL" ? prev.guestCheckInDate : "",
      guestCheckOutDate: category === "VACATION_RENTAL" ? prev.guestCheckOutDate : "",
    }));
  };

  const resetForm = () => {
    setForm({
      clientFirstName: "",
      clientLastName: "",
      clientEmail: "",
      clientPhone: "",
      propertyAddress: "",
      propertyCity: "",
      state: isBranchScoped ? "VT" : "",
      serviceType: "",
      scheduledDate: "",
      scheduledStartTime: "",
      scheduledEndTime: "",
      guestCheckInDate: "",
      guestCheckOutDate: "",
      paymentStatus: "PENDING",
      internalNotes: "",
    });
    setSavedJobId(null);
    setError(null);
    setSelectedCustomer(null);
    setSearchQuery("");
    setSearchHits([]);
    setCustomerMode("existing");
    setServiceCategory("VACATION_RENTAL");
    applyVisitDraft(emptyVisitDraft(""));
    if (isBranchScoped) {
      setForm((prev) => ({ ...prev, state: "VT" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (customerMode === "existing" && !selectedCustomer) {
      return setError("Select an existing customer.");
    }
    if (customerMode === "existing" && !propertyId) {
      return setError("Select that customer's property.");
    }
    if (!form.clientFirstName.trim()) return setError("First name is required.");
    if (!form.clientEmail.trim()) return setError("Email is required.");
    if (!form.propertyAddress.trim()) return setError("Property address is required.");
    if (!form.propertyCity.trim()) return setError("City is required.");
    if (!form.state) return setError("State is required.");
    if (!form.serviceType) return setError("Service type is required.");
    if (!form.scheduledDate) return setError("Date is required.");
    if (!form.scheduledStartTime) return setError("Start time is required.");

    const packageMatched = packagePrice != null;
    const activeAmount = packageMatched
      ? packagePrice.customerPrice
      : priceMode === "customer"
        ? Number(customerPrice)
        : Number(operationalAmount);
    if (!packageMatched && (!Number.isFinite(activeAmount) || activeAmount < 0 || (priceMode === "customer" ? customerPrice === "" : operationalAmount === ""))) {
      return setError(priceMode === "customer" ? "Customer price is required." : "Operational subtotal is required.");
    }
    const overrideAmount = visitPriceOverride.trim() === "" ? null : Number(visitPriceOverride);
    if (visitPriceOverride.trim() !== "" && (!Number.isFinite(overrideAmount) || (overrideAmount as number) < 0)) {
      return setError("A one-off price must be zero or greater.");
    }
    const operationalOverride =
      visitOperationalOverride.trim() === "" ? null : Number(visitOperationalOverride);
    if (
      visitOperationalOverride.trim() !== "" &&
      (!Number.isFinite(operationalOverride) || (operationalOverride as number) < 0)
    ) {
      return setError("A one-off operational price must be zero or greater.");
    }
    if ((overrideAmount != null || operationalOverride != null) && !priceOverrideReason.trim()) {
      return setError("A one-off price needs a reason. The standing package is not changed.");
    }

    const branch = form.state === "VT" ? "vermont" : "new-jersey";
    const payload = buildManualJobRequest({
      customerMode,
      customerId: selectedCustomer?.id,
      propertyId: propertyId || null,
      clientFirstName: form.clientFirstName.trim(),
      clientLastName: form.clientLastName.trim(),
      clientEmail: form.clientEmail.trim(),
      clientPhone: form.clientPhone.trim(),
      propertyAddress: form.propertyAddress.trim(),
      propertyCity: form.propertyCity.trim(),
      propertyState: form.state,
      branch,
      serviceCategory,
      serviceType: form.serviceType,
      scheduledDate: form.scheduledDate,
      scheduledStartTime: form.scheduledStartTime,
      scheduledEndTime: form.scheduledEndTime || undefined,
      guestCheckInDate: form.guestCheckInDate,
      guestCheckOutDate: form.guestCheckOutDate,
      priceMode,
      totalAmount: activeAmount,
      operationalAmount:
        priceMode === "customer" && operationalAmount !== ""
          ? Number(operationalAmount)
          : null,
      paymentStatus: form.paymentStatus,
      visitPriceOverride: overrideAmount,
      visitOperationalOverride: operationalOverride,
      priceOverrideReason: priceOverrideReason.trim(),
      internalNotes: form.internalNotes.trim(),
      marketLabel: branch,
    });

    setSubmitting(true);
    try {
      const res = await fetcher("/api/admin/jobs/create-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
              <div>
                <h2 className="font-heading text-lg font-semibold text-vm-navy">
                  Job saved as Received.
                </h2>
                <p className="mt-1 font-body text-sm text-vm-muted">
                  Assign a cleaner from the job page. This did not change the customer or property profile.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <Link
              href={`/admin/jobs/${savedJobId}`}
              className="inline-flex w-full items-center justify-center rounded-lg bg-vm-cyan px-4 py-3 font-heading font-semibold text-vm-navy transition-opacity hover:opacity-90"
            >
              Open job
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
          Choose an existing customer and property, or add a new customer. The job is saved as Received.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-xl border border-vm-border bg-vm-white p-6">
            <h2 className={sectionTitleClass}>Customer</h2>
            <div className="mb-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCustomerMode("existing");
                }}
                className={`rounded-lg px-4 py-2 font-heading text-sm font-semibold ${
                  customerMode === "existing"
                    ? "bg-vm-navy text-white"
                    : "border border-vm-border text-vm-navy"
                }`}
              >
                Existing customer
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomerMode("new");
                  clearCustomer();
                }}
                className={`rounded-lg px-4 py-2 font-heading text-sm font-semibold ${
                  customerMode === "new"
                    ? "bg-vm-navy text-white"
                    : "border border-vm-border text-vm-navy"
                }`}
              >
                New customer
              </button>
            </div>

            {customerMode === "existing" ? (
              <div className="space-y-3">
                {!selectedCustomer && (
                  <div>
                    <label className={labelClass} htmlFor="customerSearch">
                      Search name or email
                    </label>
                    <input
                      id="customerSearch"
                      className={inputClass}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tina Martin"
                    />
                    {searching && (
                      <p className="mt-2 font-body text-sm text-vm-muted">Searching…</p>
                    )}
                    {searchHits.length > 0 && (
                      <ul className="mt-2 divide-y divide-vm-border rounded-lg border border-vm-border">
                        {searchHits.map((hit) => (
                          <li key={hit.id}>
                            <button
                              type="button"
                              onClick={() => void selectCustomer(hit.id)}
                              className="w-full px-3 py-2 text-left hover:bg-vm-surface"
                            >
                              <span className="block font-heading text-sm font-semibold text-vm-navy">
                                {hit.firstName} {hit.lastName}
                              </span>
                              <span className="block font-body text-xs text-vm-muted">{hit.email}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
                {selectedCustomer && (
                  <div className="rounded-lg border border-vm-border bg-vm-surface p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-heading text-sm font-semibold text-vm-navy">
                          {selectedCustomer.firstName} {selectedCustomer.lastName}
                        </p>
                        <p className="font-body text-xs text-vm-muted">{selectedCustomer.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={clearCustomer}
                        className="font-body text-xs font-semibold text-vm-navy underline"
                      >
                        Change
                      </button>
                    </div>
                    <label className={`${labelClass} mt-3`} htmlFor="propertyId">
                      Property
                    </label>
                    <select
                      id="propertyId"
                      className={inputClass}
                      value={propertyId}
                      onChange={(e) => {
                        const next = selectedCustomer.Property.find((property) => property.id === e.target.value);
                        if (next) applyProperty(next);
                        else applyVisitDraft(emptyVisitDraft(form.internalNotes));
                      }}
                    >
                      <option value="">Select a property…</option>
                      {selectedCustomer.Property.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name} — {property.address}
                        </option>
                      ))}
                    </select>
                    {selectedCustomer.Property.length === 0 && (
                      <p className="mt-2 font-body text-sm text-vm-muted">
                        This customer has no saved property. Use New customer only for someone who is not already on file. This form will not create a second property.
                      </p>
                    )}
                    {selectedProperty && (selectedProperty.bedrooms != null || selectedProperty.bathrooms != null) && (
                      <p className="mt-2 font-body text-xs text-vm-muted">
                        On file: {selectedProperty.bedrooms ?? "—"} bed / {selectedProperty.bathrooms ?? "—"} bath.
                        This visit does not change those numbers.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
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
            )}
          </section>

          <section className="rounded-xl border border-vm-border bg-vm-white p-6">
            <h2 className={sectionTitleClass}>This visit</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="address">
                  Property address *
                </label>
                <input
                  id="address"
                  className={inputClass}
                  value={form.propertyAddress}
                  onChange={(e) => update("propertyAddress", e.target.value)}
                />
                <p className="mt-1 font-body text-xs text-vm-muted">
                  Saved on this job only. The customer and property records stay as they are.
                </p>
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
                  onChange={(e) => update("state", e.target.value as StateCode)}
                  disabled={isBranchScoped}
                >
                  <option value="">Select state…</option>
                  <option value="VT">Vermont</option>
                  {!isBranchScoped && <option value="NJ">New Jersey</option>}
                </select>
              </div>
              <div className="sm:col-span-2">
                <p className={labelClass}>Service category</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("RESIDENTIAL")}
                    className={`rounded-lg px-3 py-2 font-heading text-sm font-semibold ${
                      serviceCategory === "RESIDENTIAL"
                        ? "bg-vm-navy text-white"
                        : "border border-vm-border text-vm-navy"
                    }`}
                  >
                    Residential maintenance
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCategoryChange("VACATION_RENTAL")}
                    className={`rounded-lg px-3 py-2 font-heading text-sm font-semibold ${
                      serviceCategory === "VACATION_RENTAL"
                        ? "bg-vm-navy text-white"
                        : "border border-vm-border text-vm-navy"
                    }`}
                  >
                    Vacation-rental turnover
                  </button>
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="serviceType">
                  Service type *
                </label>
                <select
                  id="serviceType"
                  className={inputClass}
                  value={form.serviceType}
                  onChange={(e) => update("serviceType", e.target.value)}
                >
                  <option value="">Select service…</option>
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
                    This customer is in{" "}
                    <strong>{TRAVEL_ZONE_SHORT_LABEL[suggestedTravelFee.zone]}</strong>.
                    Standalone visits typically include a{" "}
                    <strong>${suggestedTravelFee.fee}</strong> travel fee. Add to this visit?
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleAddTravelFee}
                      className="rounded-lg bg-vm-navy px-4 py-2 font-heading text-xs font-semibold text-white hover:opacity-90"
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
                  Service date *
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

              {serviceCategory === "VACATION_RENTAL" && (
                <>
                  <div>
                    <label className={labelClass} htmlFor="guestCheckIn">
                      Guest check-in
                    </label>
                    <input
                      id="guestCheckIn"
                      type="date"
                      className={inputClass}
                      value={form.guestCheckInDate}
                      onChange={(e) => update("guestCheckInDate", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="guestCheckOut">
                      Guest checkout
                    </label>
                    <input
                      id="guestCheckOut"
                      type="date"
                      className={inputClass}
                      value={form.guestCheckOutDate}
                      onChange={(e) => update("guestCheckOutDate", e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>
            {sameDayJobs.length > 0 && (
              <div className="mt-4 rounded-lg border border-vm-warning/40 bg-vm-warning-bg p-4">
                <p className="font-body text-sm text-vm-navy">
                  This property already has a job on this date. A second visit can still be saved.
                </p>
                <ul className="mt-2 space-y-1 font-body text-xs text-vm-muted">
                  {sameDayJobs.map((job) => (
                    <li key={job.id}>
                      {job.jobReference || job.id} · {job.serviceType || "Service"} · {job.status}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-vm-border bg-vm-white p-6">
            <h2 className={sectionTitleClass}>Price for this visit</h2>
            {packagePrice != null && (
              <div className="mb-3 rounded-lg border border-vm-border bg-vm-surface p-3">
                <p className="font-body text-sm font-semibold text-vm-navy">
                  Package price: ${packagePrice.customerPrice.toFixed(2)} ({packagePrice.rateLabel})
                </p>
                <p className="mt-1 text-xs text-vm-muted">Use one-off price to change this visit.</p>
                {allowanceDisplay && (
                  <p className="mt-2 font-body text-xs text-vm-muted">
                    {allowanceDisplay.availability === "unavailable"
                      ? `Card processing allowance is unavailable because the processing policy could not be loaded. The customer price stays $${packagePrice.customerPrice.toFixed(2)}.`
                      : allowanceDisplay.availability === "estimated"
                        ? `Estimated card processing allowance: $${Number(allowanceDisplay.estimatedAllowance).toFixed(2)}. The customer price stays $${packagePrice.customerPrice.toFixed(2)}.`
                        : allowanceDisplay.preferredMethod === "CARD"
                          ? `Card processing protection is off, so the allowance is $0.00. The customer price stays $${packagePrice.customerPrice.toFixed(2)}.`
                          : "Processing allowance: $0.00. Cash, check, and Zelle are not added to the customer price."}
                  </p>
                )}
              </div>
            )}
            {agreedPrice != null && packagePrice == null && (
              <p className="mb-3 font-body text-sm text-vm-navy">
                Saved agreed price ${agreedPrice.toFixed(2)} is the customer price. Changing it applies to this visit only and is not grossed up.
              </p>
            )}
            <div className="mb-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={packagePrice != null}
                onClick={() => setPriceMode("customer")}
                className={`rounded-lg px-3 py-2 font-heading text-sm font-semibold ${
                  priceMode === "customer" ? "bg-vm-navy text-white" : "border border-vm-border text-vm-navy"
                }`}
              >
                Customer price
              </button>
              <button
                type="button"
                disabled={packagePrice != null}
                onClick={() => setPriceMode("operational")}
                className={`rounded-lg px-3 py-2 font-heading text-sm font-semibold ${
                  priceMode === "operational" ? "bg-vm-navy text-white" : "border border-vm-border text-vm-navy"
                }`}
              >
                Operational subtotal
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {priceMode === "customer" ? (
                <>
                  <div>
                    <label className={labelClass} htmlFor="customerPrice">
                      Customer price ($) *
                    </label>
                    <input
                      id="customerPrice"
                      type="number"
                      min={0}
                      step="0.01"
                      className={inputClass}
                      value={packagePrice ? packagePrice.customerPrice.toFixed(2) : customerPrice}
                      readOnly={packagePrice != null}
                      disabled={packagePrice != null}
                      onChange={(e) => setCustomerPrice(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-vm-muted">
                      {packagePrice
                        ? "Use one-off price to change this visit."
                        : "Processing protection is not applied to this amount."}
                    </p>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="operationalAmount">
                      Operational subtotal ($)
                    </label>
                    <input
                      id="operationalAmount"
                      type="number"
                      min={0}
                      step="0.01"
                      className={inputClass}
                      value={
                        packagePrice
                          ? (packagePrice.operationalPrice ?? packagePrice.customerPrice).toFixed(2)
                          : operationalAmount
                      }
                      readOnly={packagePrice != null}
                      disabled={packagePrice != null}
                      onChange={(e) => setOperationalAmount(e.target.value)}
                    />
                    <p className="mt-1 text-xs text-vm-muted">
                      {packagePrice
                        ? "Use one-off price to change this visit."
                        : "Payout base. Leave blank to use the customer price."}
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <label className={labelClass} htmlFor="operationalAmount">
                    Operational subtotal ($) *
                  </label>
                  <input
                    id="operationalAmount"
                    type="number"
                    min={0}
                    step="0.01"
                    className={inputClass}
                    value={
                      packagePrice
                        ? (packagePrice.operationalPrice ?? packagePrice.customerPrice).toFixed(2)
                        : operationalAmount
                    }
                    readOnly={packagePrice != null}
                    disabled={packagePrice != null}
                    onChange={(e) => setOperationalAmount(e.target.value)}
                  />
                  <p className="mt-1 text-xs text-vm-muted">
                    {packagePrice
                      ? "Use one-off price to change this visit."
                      : "Processing protection, when enabled, calculates the customer price from this amount."}
                  </p>
                  {packagePrice == null && customerPricePreview != null && (
                    <div className="mt-3 rounded-lg border border-vm-border bg-vm-surface p-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <span className="text-vm-muted">Customer price</span>
                        <span className="font-semibold text-vm-navy">
                          ${customerPricePreview.toFixed(2)}
                        </span>
                      </div>
                      {allowancePreview != null && allowancePreview > 0 && (
                        <div className="mt-1 flex justify-between gap-2 text-xs">
                          <span className="text-vm-muted">Processing protection (est.)</span>
                          <span>${allowancePreview.toFixed(2)}</span>
                        </div>
                      )}
                      {previewWarning && (
                        <p className="mt-2 text-xs text-amber-800">{previewWarning}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className={labelClass} htmlFor="visitPriceOverride">
                  One-off price ($)
                </label>
                <input
                  id="visitPriceOverride"
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  value={visitPriceOverride}
                  onChange={(e) => setVisitPriceOverride(e.target.value)}
                />
                <p className="mt-1 text-xs text-vm-muted">
                  Charges this visit only. A saved package or rate is not changed.
                </p>
              </div>
              <div>
                <label className={labelClass} htmlFor="visitOperationalOverride">
                  One-off operational price ($)
                </label>
                <input
                  id="visitOperationalOverride"
                  type="number"
                  min={0}
                  step="0.01"
                  className={inputClass}
                  value={visitOperationalOverride}
                  onChange={(e) => setVisitOperationalOverride(e.target.value)}
                />
                <p className="mt-1 text-xs text-vm-muted">
                  Cleaner amount for this visit. Leave blank to keep the agreed operational price.
                </p>
              </div>
              <div>
                <label className={labelClass} htmlFor="priceOverrideReason">
                  Reason for one-off price
                </label>
                <input
                  id="priceOverrideReason"
                  type="text"
                  className={inputClass}
                  value={priceOverrideReason}
                  onChange={(e) => setPriceOverrideReason(e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass} htmlFor="paymentStatus">
                  Payment status
                </label>
                <select
                  id="paymentStatus"
                  className={inputClass}
                  value={form.paymentStatus}
                  onChange={(e) => update("paymentStatus", e.target.value)}
                >
                  {PAYMENT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-4 font-body text-sm text-vm-muted">
              The job stays Received. Choose a cleaner later with the offer flow. No cleaner is assigned here.
            </p>
          </section>

          <section className="rounded-xl border border-vm-border bg-vm-white p-6">
            <h2 className={sectionTitleClass}>Notes</h2>
            <label className={labelClass} htmlFor="internalNotes">
              Internal notes
            </label>
            <textarea
              id="internalNotes"
              rows={4}
              className={inputClass}
              placeholder="Notes visible to admin only — not sent to client"
              value={form.internalNotes}
              onChange={(e) => update("internalNotes", e.target.value)}
            />
          </section>

          {error && <p className="font-body text-sm text-red-600">{error}</p>}

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
