import { describe, expect, it } from "vitest";
import { validateNjQuotePayload } from "@/lib/markets/njQuoteValidation";

const valid = {
  name: "Pat Customer",
  phone: "9735551212",
  email: "pat@example.com",
  zip: "07042",
  city: "Montclair",
  bedrooms: 3,
  bathrooms: 2,
  homeType: "house",
  serviceType: "RECURRING",
  frequency: "biweekly",
  urgency: "this_week",
};

describe("NJ progressive quote validation", () => {
  it("accepts simplified recurring quote without address or preferred date", () => {
    const result = validateNjQuotePayload(valid);
    expect(result).toEqual({ ok: true });
  });

  it("accepts legacy payloads with address, referral, and date", () => {
    const result = validateNjQuotePayload({
      ...valid,
      addressLine: "12 Maple St",
      referralSource: "google",
      preferredDate: "2026-12-01",
    });
    expect(result).toEqual({ ok: true });
  });

  it("rejects out-of-area ZIP", () => {
    const result = validateNjQuotePayload({ ...valid, zip: "99999" });
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.error).toMatch(/service area/i);
  });

  it("rejects missing home details", () => {
    const result = validateNjQuotePayload({
      ...valid,
      bedrooms: null,
      homeType: "",
    });
    expect(result.ok).toBe(false);
  });

  it("requires preferred date for non-flexible one-time jobs", () => {
    const result = validateNjQuotePayload({
      ...valid,
      serviceType: "STANDARD",
      frequency: "one_time",
      urgency: "this_week",
      scheduleFlexible: false,
      preferredDate: "",
    });
    expect(result.ok).toBe(false);
  });

  it("allows flexible scheduling without preferred date", () => {
    const result = validateNjQuotePayload({
      ...valid,
      serviceType: "STANDARD",
      frequency: "one_time",
      urgency: "flexible",
      scheduleFlexible: true,
      preferredDate: "",
    });
    expect(result).toEqual({ ok: true });
  });
});
