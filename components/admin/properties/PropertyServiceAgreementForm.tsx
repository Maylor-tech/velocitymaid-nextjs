"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import {
  RESIDENTIAL_SERVICE_TYPES,
  VACATION_RENTAL_SERVICE_TYPES,
  type ServiceCategory,
} from "@/lib/admin/manualJobCreate";

type RateDraft = {
  id: string | null;
  label: string;
  customerPrice: string;
  operationalPrice: string;
  startsOn: string;
  endsOn: string;
  active: boolean;
};

type StoredPackage = {
  id: string;
  updatedAt: string;
  serviceCategory: ServiceCategory;
  serviceType: string;
  customerPrice: string | number;
  operationalPrice: string | number | null;
  includedScope: string | null;
  exclusions: string | null;
  active: boolean;
  Rates: Array<{
    id: string;
    label: string;
    customerPrice: string | number;
    operationalPrice: string | number | null;
    startsOn: string;
    endsOn: string | null;
    active: boolean;
  }>;
};

type AgreementResponse = {
  success: boolean;
  error?: string;
  property?: {
    id: string;
    name: string;
    address: string;
    customerId: string;
    ServicePackages: StoredPackage[];
    PaymentPreference: {
      allowedMethods: Array<"CASH" | "CHECK" | "ZELLE" | "CARD">;
      preferredMethod: "CASH" | "CHECK" | "ZELLE" | "CARD";
    } | null;
  };
};

const METHODS = ["CASH", "CHECK", "ZELLE", "CARD"] as const;
const inputClass =
  "w-full rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-text outline-none focus:border-vm-cyan focus:ring-2 focus:ring-vm-cyan/30";
const labelClass = "mb-1 block font-heading text-xs font-semibold uppercase tracking-wide text-vm-muted";

function moneyText(value: string | number | null | undefined): string {
  if (value == null || value === "") return "";
  return String(value);
}

function dayText(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function PropertyServiceAgreementForm({ propertyId }: { propertyId: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState("");
  const [address, setAddress] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [packages, setPackages] = useState<StoredPackage[]>([]);
  const [selection, setSelection] = useState("");
  const [packageUpdatedAt, setPackageUpdatedAt] = useState<string | null>(null);
  const [category, setCategory] = useState<ServiceCategory>("VACATION_RENTAL");
  const [serviceType, setServiceType] = useState<string>(VACATION_RENTAL_SERVICE_TYPES[0]);
  const [customerPrice, setCustomerPrice] = useState("");
  const [operationalPrice, setOperationalPrice] = useState("");
  const [includedScope, setIncludedScope] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [active, setActive] = useState(true);
  const [rates, setRates] = useState<RateDraft[]>([]);
  const [allowed, setAllowed] = useState<string[]>([]);
  const [preferred, setPreferred] = useState("");

  const applyPackage = (pkg: StoredPackage | null) => {
    if (!pkg) {
      setSelection("new");
      setPackageUpdatedAt(null);
      setCategory("VACATION_RENTAL");
      setServiceType(VACATION_RENTAL_SERVICE_TYPES[0]);
      setCustomerPrice("");
      setOperationalPrice("");
      setIncludedScope("");
      setExclusions("");
      setActive(true);
      setRates([]);
      return;
    }
    setSelection(pkg.id);
    setPackageUpdatedAt(pkg.updatedAt);
    setCategory(pkg.serviceCategory);
    setServiceType(pkg.serviceType);
    setCustomerPrice(moneyText(pkg.customerPrice));
    setOperationalPrice(moneyText(pkg.operationalPrice));
    setIncludedScope(pkg.includedScope || "");
    setExclusions(pkg.exclusions || "");
    setActive(pkg.active);
    setRates(
      pkg.Rates.map((rate) => ({
        id: rate.id,
        label: rate.label,
        customerPrice: moneyText(rate.customerPrice),
        operationalPrice: moneyText(rate.operationalPrice),
        startsOn: dayText(rate.startsOn),
        endsOn: dayText(rate.endsOn),
        active: rate.active,
      }))
    );
  };

  const load = useCallback(() => {
    setLoading(true);
    return fetch(`/api/admin/properties/${propertyId}/service-agreement`, { credentials: "include" })
      .then((response) => response.json())
      .then((data: AgreementResponse) => {
        if (!data.success || !data.property) {
          setError(data.error || "Could not load this property.");
          return;
        }
        setPropertyName(data.property.name);
        setAddress(data.property.address);
        setCustomerId(data.property.customerId);
        setPackages(data.property.ServicePackages);
        const preference = data.property.PaymentPreference;
        setAllowed(preference?.allowedMethods ?? []);
        setPreferred(preference?.preferredMethod ?? "");
        setSelection("");
        setPackageUpdatedAt(null);
      })
      .catch(() => setError("Could not load this property."))
      .finally(() => setLoading(false));
  }, [propertyId]);

  useEffect(() => {
    void load();
  }, [load]);

  const types = category === "RESIDENTIAL" ? RESIDENTIAL_SERVICE_TYPES : VACATION_RENTAL_SERVICE_TYPES;

  const save = async () => {
    if (selection !== "new" && !packages.some((pkg) => pkg.id === selection)) {
      setError("Choose the package to edit, or start a new one.");
      return;
    }
    if (customerPrice.trim() === "") {
      setError("Customer price is required.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/properties/${propertyId}/service-agreement`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package: {
            ...(selection !== "new" ? { id: selection, updatedAt: packageUpdatedAt } : {}),
            serviceCategory: category,
            serviceType,
            customerPrice: Number(customerPrice),
            operationalPrice: operationalPrice === "" ? null : Number(operationalPrice),
            includedScope,
            exclusions,
            active,
            rates: rates.map((rate) => ({
              ...(rate.id ? { id: rate.id } : {}),
              label: rate.label,
              customerPrice: Number(rate.customerPrice),
              operationalPrice: rate.operationalPrice === "" ? null : Number(rate.operationalPrice),
              startsOn: rate.startsOn,
              endsOn: rate.endsOn || null,
              active: rate.active,
            })),
          },
          ...(allowed.length > 0 && preferred
            ? { paymentPreference: { allowedMethods: allowed, preferredMethod: preferred } }
            : {}),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setError(data.error || "Could not save the service agreement.");
        return;
      }
      setMessage("Service agreement saved. Existing jobs were not changed.");
      await load();
    } catch {
      setError("Could not save the service agreement.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-vm-muted">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <Link
        href={customerId ? `/admin/customers/${customerId}` : "/admin/customers"}
        className="mb-6 inline-flex items-center gap-2 font-heading text-sm font-semibold text-vm-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to customer
      </Link>
      <h1 className="font-heading text-2xl font-bold text-vm-navy">Service agreement</h1>
      <p className="mt-1 font-body text-sm text-vm-muted">
        {propertyName} · {address}
      </p>
      <p className="mt-2 font-body text-sm text-vm-text">
        Saving updates this property only. Jobs already booked keep the price they were given.
      </p>

      <div className="mt-6 space-y-6 rounded-xl border border-vm-border bg-vm-white p-6">
        <label className="block">
          <span className={labelClass}>Package</span>
          <select
            className={inputClass}
            value={selection}
            onChange={(event) => {
              const next = event.target.value;
              if (next === "new") {
                applyPackage(null);
                return;
              }
              if (!next) {
                setSelection("");
                return;
              }
              const chosen = packages.find((pkg) => pkg.id === next);
              if (chosen) applyPackage(chosen);
            }}
          >
            <option value="">Choose a package…</option>
            <option value="new">New package</option>
            {packages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.serviceCategory === "RESIDENTIAL" ? "Residential" : "Vacation rental"} · {pkg.serviceType}
              </option>
            ))}
          </select>
        </label>
        {selection === "" ? (
          <p className="font-body text-sm text-vm-muted">Choose a saved package or start a new one before editing prices.</p>
        ) : (
        <>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Category</span>
            <select
              className={inputClass}
              value={category}
              onChange={(event) => {
                const next = event.target.value as ServiceCategory;
                setCategory(next);
                const nextTypes = next === "RESIDENTIAL" ? RESIDENTIAL_SERVICE_TYPES : VACATION_RENTAL_SERVICE_TYPES;
                setServiceType(nextTypes[0]);
              }}
            >
              <option value="VACATION_RENTAL">Vacation-rental turnover</option>
              <option value="RESIDENTIAL">Residential maintenance</option>
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Service type</span>
            <select className={inputClass} value={serviceType} onChange={(event) => setServiceType(event.target.value)}>
              {types.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className={labelClass}>Customer price</span>
            <input className={inputClass} inputMode="decimal" value={customerPrice} onChange={(event) => setCustomerPrice(event.target.value)} />
          </label>
          <label className="block">
            <span className={labelClass}>Operational price</span>
            <input className={inputClass} inputMode="decimal" value={operationalPrice} onChange={(event) => setOperationalPrice(event.target.value)} />
          </label>
        </div>
        <label className="block">
          <span className={labelClass}>Included scope</span>
          <textarea className={inputClass} rows={2} value={includedScope} onChange={(event) => setIncludedScope(event.target.value)} />
        </label>
        <label className="block">
          <span className={labelClass}>Exclusions</span>
          <textarea className={inputClass} rows={2} value={exclusions} onChange={(event) => setExclusions(event.target.value)} />
        </label>
        <label className="flex items-center gap-2 font-body text-sm text-vm-text">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} />
          Active package
        </label>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className={labelClass}>Seasonal rates</p>
            <button
              type="button"
              className="font-heading text-xs font-semibold uppercase tracking-wide text-vm-navy"
              onClick={() =>
                setRates((current) => [
                  ...current,
                  { id: null, label: "", customerPrice: "", operationalPrice: "", startsOn: "", endsOn: "", active: true },
                ])
              }
            >
              Add rate
            </button>
          </div>
          <div className="space-y-3">
            {rates.map((rate, index) => (
              <div key={index} className="grid gap-2 rounded-lg border border-vm-border p-3 sm:grid-cols-2">
                <input className={inputClass} placeholder="Label" value={rate.label} onChange={(event) => setRates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item))} />
                <input className={inputClass} placeholder="Customer price" inputMode="decimal" value={rate.customerPrice} onChange={(event) => setRates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, customerPrice: event.target.value } : item))} />
                <input className={inputClass} placeholder="Operational price" inputMode="decimal" value={rate.operationalPrice} onChange={(event) => setRates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, operationalPrice: event.target.value } : item))} />
                <input className={inputClass} type="date" value={rate.startsOn} onChange={(event) => setRates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, startsOn: event.target.value } : item))} />
                <input className={inputClass} type="date" value={rate.endsOn} onChange={(event) => setRates((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, endsOn: event.target.value } : item))} />
                <button type="button" className="text-left font-body text-sm text-vm-muted" onClick={() => setRates((current) => current.filter((_, itemIndex) => itemIndex !== index))}>
                  Remove rate
                </button>
              </div>
            ))}
          </div>
        </div>
        </>
        )}

        <fieldset>
          <legend className={labelClass}>Allowed payment methods</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {METHODS.map((method) => (
              <label key={method} className="flex items-center gap-2 font-body text-sm text-vm-text">
                <input
                  type="checkbox"
                  checked={allowed.includes(method)}
                  onChange={(event) => {
                    setAllowed((current) =>
                      event.target.checked ? [...current, method] : current.filter((item) => item !== method)
                    );
                    if (!event.target.checked && preferred === method) setPreferred("");
                  }}
                />
                {method}
              </label>
            ))}
          </div>
          <label className="mt-3 block">
            <span className={labelClass}>Preferred method</span>
            <select className={inputClass} value={preferred} onChange={(event) => setPreferred(event.target.value)}>
              <option value="">Select…</option>
              {allowed.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </select>
          </label>
        </fieldset>

        {error && <p className="font-body text-sm text-red-700">{error}</p>}
        {message && <p className="font-body text-sm text-vm-navy">{message}</p>}
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-lg bg-vm-navy px-4 py-2 font-heading text-sm font-semibold text-white disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save agreement"}
        </button>
      </div>
    </div>
  );
}
