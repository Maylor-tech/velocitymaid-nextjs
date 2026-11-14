/**
 * NJ progressive quote validation — shared client/server rules.
 * Softens address, referral, and preferred date while keeping quote-first ops.
 */

import {
  NJ_FREQUENCY_OPTIONS,
  NJ_SERVICE_CITIES,
  NJ_SERVICE_TYPE_OPTIONS,
  NJ_TERRITORY_ZIPS,
} from "@/lib/markets/newJersey";

const FREQUENCY_VALUES = new Set(
  NJ_FREQUENCY_OPTIONS.map((o) => o.value)
);
const SERVICE_TYPE_VALUES = new Set(
  NJ_SERVICE_TYPE_OPTIONS.map((o) => o.value)
);
const CITY_VALUES = new Set<string>(NJ_SERVICE_CITIES);
const TERRITORY_ZIP_SET = new Set(NJ_TERRITORY_ZIPS.map((z) => z.zip));

export type NjQuotePayload = {
  name?: string;
  phone?: string;
  email?: string;
  zip?: string;
  city?: string;
  addressLine?: string | null;
  bedrooms?: number | string | null;
  bathrooms?: number | string | null;
  homeType?: string;
  serviceType?: string;
  frequency?: string;
  preferredDate?: string | null;
  urgency?: string;
  referralSource?: string | null;
  scheduleFlexible?: boolean;
};

export function isNjTerritoryZip(zip: string): boolean {
  return TERRITORY_ZIP_SET.has(String(zip || "").trim());
}

export function isNjServiceCity(city: string): boolean {
  return CITY_VALUES.has(String(city || "").trim());
}

export function validateNjQuotePayload(
  body: NjQuotePayload
): { ok: true } | { ok: false; error: string } {
  const name = String(body.name || "").trim();
  const phone = String(body.phone || "").trim();
  const email = String(body.email || "").trim();
  const zip = String(body.zip || "").trim();
  const city = String(body.city || "").trim();
  const urgency = String(body.urgency || "").trim();
  const serviceType = String(body.serviceType || "").trim();
  const frequency = String(body.frequency || "").trim();
  const homeType = String(body.homeType || "").trim();
  const bedrooms = body.bedrooms;
  const bathrooms = body.bathrooms;
  const preferredDate = body.preferredDate
    ? String(body.preferredDate).trim()
    : "";
  const scheduleFlexible =
    Boolean(body.scheduleFlexible) || urgency === "flexible";

  if (!name || !phone || !zip || !urgency) {
    return {
      ok: false,
      error: "Name, phone, ZIP, and urgency are required",
    };
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "A valid email is required for NJ quotes" };
  }

  if (!city || !isNjServiceCity(city)) {
    return {
      ok: false,
      error: "Select a city in our New Jersey service area",
    };
  }

  if (!isNjTerritoryZip(zip)) {
    return {
      ok: false,
      error:
        "That ZIP is outside our current New Jersey service area. Choose a served city ZIP or contact us.",
    };
  }

  if (!serviceType || !SERVICE_TYPE_VALUES.has(serviceType as never)) {
    return { ok: false, error: "Select a valid service type" };
  }

  if (!frequency || !FREQUENCY_VALUES.has(frequency as never)) {
    return { ok: false, error: "Select a cleaning frequency" };
  }

  if (bedrooms == null || bathrooms == null || !homeType) {
    return {
      ok: false,
      error: "Home details (bedrooms, bathrooms, and home type) are required",
    };
  }

  const needsDate =
    !scheduleFlexible &&
    frequency !== "unsure" &&
    serviceType !== "RECURRING";

  // Recurring + flexible urgency: preferred date optional.
  // One-time / deep / move: prefer a date unless explicitly flexible.
  if (needsDate && !preferredDate) {
    return {
      ok: false,
      error:
        "Preferred date is required unless you choose flexible scheduling",
    };
  }

  if (preferredDate) {
    const parsed = new Date(preferredDate);
    if (Number.isNaN(parsed.getTime())) {
      return { ok: false, error: "Preferred date is invalid" };
    }
  }

  return { ok: true };
}
