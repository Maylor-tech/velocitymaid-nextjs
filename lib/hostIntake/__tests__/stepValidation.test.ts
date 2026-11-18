import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  SERVICE_TYPE_CHIPS,
  STEP1_REQUIRED_FIELDS,
  STEP2_REQUIRED_FIELDS,
  firstErrorField,
  validateHostIntakeStep1,
} from "@/lib/hostIntake/stepValidation";
import { validateFullHostIntake } from "@/lib/hostIntake/validateFullIntake";
import { HOME_WATCH_INSPECTION_SERVICE } from "@/lib/hostIntake/homeWatchIntake";
import type { HostIntakePayload } from "@/lib/hostIntake/types";

function emptyForm(overrides: Partial<HostIntakePayload> = {}): HostIntakePayload {
  return {
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
    ...overrides,
  };
}

const step1Filled: Partial<HostIntakePayload> = {
  fullName: "Sample Host",
  phone: "(802) 555-0199",
  email: "host@example.com",
  propertyAddress: "1 Example Lane",
  city: "Ludlow",
  bedrooms: "3",
  bathrooms: "2",
};

describe("validateHostIntakeStep1", () => {
  it("reports only step-1 fields, never step-2 requirements", () => {
    const errors = validateHostIntakeStep1(emptyForm());
    expect(Object.keys(errors).sort()).toEqual([...STEP1_REQUIRED_FIELDS].sort());
    expect(errors.accessType).toBeUndefined();
    expect(errors.linenProvider).toBeUndefined();
    expect(errors.sameDayTurnovers).toBeUndefined();
    expect(errors.propertyActiveSeasons).toBeUndefined();
  });

  it("passes with step-1 fields filled even though step 2 is empty", () => {
    const form = emptyForm(step1Filled);
    expect(validateHostIntakeStep1(form)).toEqual({});
    // Full submit validation still blocks until step 2 is complete.
    const full = validateFullHostIntake(form);
    expect(Object.keys(full).sort()).toEqual(
      ["accessType", "linenProvider", "propertyActiveSeasons", "sameDayTurnovers"].sort()
    );
  });

  it("uses the same messages as validateFullHostIntake", () => {
    const form = emptyForm({ ...step1Filled, phone: "123", email: "nope" });
    const step = validateHostIntakeStep1(form);
    const full = validateFullHostIntake(form);
    expect(step.phone).toBe(full.phone);
    expect(step.email).toBe(full.email);
  });
});

describe("firstErrorField", () => {
  it("follows the on-page order, not object key order", () => {
    const errors = validateHostIntakeStep1(emptyForm());
    expect(firstErrorField(errors, STEP1_REQUIRED_FIELDS)).toBe("fullName");
    expect(
      firstErrorField(
        validateHostIntakeStep1(emptyForm({ ...step1Filled, fullName: "", bedrooms: "" })),
        STEP1_REQUIRED_FIELDS
      )
    ).toBe("fullName");
    expect(
      firstErrorField(
        validateHostIntakeStep1(emptyForm({ ...step1Filled, bathrooms: "" })),
        STEP1_REQUIRED_FIELDS
      )
    ).toBe("bathrooms");
  });

  it("returns null when there are no errors for the given fields", () => {
    expect(firstErrorField({}, STEP2_REQUIRED_FIELDS)).toBeNull();
  });
});

describe("SERVICE_TYPE_CHIPS", () => {
  it("maps four public labels to existing values and hides the inspection service", () => {
    expect(SERVICE_TYPE_CHIPS.map((c) => c.label)).toEqual([
      "Turnovers",
      "Deep · seasonal",
      "Post-construction",
      "Welcome setup",
    ]);
    expect(SERVICE_TYPE_CHIPS.map((c) => c.value)).toEqual([
      "Turnover cleaning between guests",
      "Deep / seasonal clean",
      "Post-construction / special project prep",
      "Guest welcome setup / restocking",
    ]);
    const values: readonly string[] = SERVICE_TYPE_CHIPS.map((c) => c.value);
    expect(values).not.toContain(HOME_WATCH_INSPECTION_SERVICE);
  });
});

describe("Vermont host page copy (Section 5B)", () => {
  const read = (p: string) =>
    readFileSync(path.join(process.cwd(), p), "utf8");
  const page = read("components/marketing/VermontHostMarketing.tsx");
  const reviews = read("lib/marketing/reviews.ts");

  it("uses shared vm chrome, with only the approved turnover prices", () => {
    expect(page).toContain("@/components/vm/TrustStrip");
    expect(page).toContain("@/components/vm/SiteHeader");
    expect(page).toContain("@/components/vm/SiteFooter");
    expect(page).toContain('activeNav="Vacation rentals"');
    expect(page).toContain("VermontTurnoverPrices");
    expect(page).not.toContain("components/layout/SiteHeader");
    expect(page).not.toMatch(/\$\d/);
    expect(page).not.toMatch(/starting/i);
    expect(page).not.toMatch(/inspection/i);
    expect(page).not.toContain("Turnover pricing");
    const prices = read("components/marketing/VermontTurnoverPrices.tsx");
    expect([...prices.matchAll(/\$(\d+)/g)].map((match) => match[1])).toEqual([
      "195",
      "325",
      "390",
      "455",
    ]);
    expect(prices).toContain("Book a turnover");
    expect(prices).toContain("We reply within one business day.");
    expect(prices.replace(/\s+/g, " ")).toContain(
      "Flat price per turnover. Includes a photo report according to your booked service package. Deep cleans and first-time cleans are quoted separately."
    );
    expect(prices).not.toMatch(/starting|inspection|surcharge|discount|hourly/i);
    expect(read("app/pricing/page.tsx")).toContain("VermontTurnoverPrices");
  });

  it("uses the final payment FAQ with no fee or TODO copy", () => {
    expect(page).toContain(
      "After your photo report, you get one payment request. Zelle is our preferred way to pay. Card (by secure link) and PayPal are also accepted."
    );
    expect(page).not.toContain("[TODO");
    expect(page).not.toContain("[Payment methods");
    expect(page).not.toMatch(/surcharge|processing fee|discount/i);
  });

  it("adds Tiffany P. as a Vermont-market review", () => {
    expect(reviews).toContain('market: "vermont"');
    expect(reviews).toContain("Thorough and a great job — the photos looked awesome!");
    expect(reviews).toContain("Ludlow, VT");
  });
});
