import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { HostIntakePayload } from "@/lib/hostIntake/types";
import {
  PHONE_INVALID_MESSAGE,
  PHONE_REQUIRED_MESSAGE,
  validateFullHostIntake,
} from "@/lib/hostIntake/validateFullIntake";

function validForm(overrides: Partial<HostIntakePayload> = {}): HostIntakePayload {
  return {
    propertyAddress: "1 Example Lane",
    city: "Ludlow",
    bedrooms: "3",
    bathrooms: "2",
    squareFootage: "",
    bedConfiguration: "",
    propertyAmenities: [],
    restrictedAreas: "",
    bookingPlatforms: ["Airbnb"],
    accessType: "Lockbox",
    accessTypeOther: "",
    willSendAccessDetails: false,
    guestCheckoutTime: "",
    guestCheckoutTimeOther: "",
    guestCheckinTime: "",
    guestCheckinTimeOther: "",
    supplyStorageLocation: "",
    trashBinLocation: "",
    serviceTypes: ["Turnover cleaning between guests"],
    turnoverFrequency: "Once a week",
    hasCleaner: "No",
    linenProvider: "Host provides",
    sameDayTurnovers: "No",
    bookingAdvanceNotice: "",
    propertyActiveSeasons: ["Summer"],
    preferredPaymentMethod: "",
    specialInstructions: "",
    fullName: "Sample Host",
    email: "host@example.test",
    phone: "8025550100",
    preferredContact: "Text",
    bestTimeToReach: "",
    ...overrides,
  };
}

describe("validateFullHostIntake", () => {
  it("accepts the shortened first-visit form without later onboarding fields", () => {
    expect(validateFullHostIntake(validForm())).toEqual({});
  });

  it("requires a phone number with a clear message", () => {
    const errors = validateFullHostIntake(validForm({ phone: "   " }));
    expect(errors.phone).toBe(PHONE_REQUIRED_MESSAGE);
    expect(errors.preferredPaymentMethod).toBeUndefined();
    expect(errors.willSendAccessDetails).toBeUndefined();
  });

  it("rejects junk phone numbers and accepts normal US formats", () => {
    expect(validateFullHostIntake(validForm({ phone: "abc" })).phone).toBe(
      PHONE_INVALID_MESSAGE
    );
    expect(validateFullHostIntake(validForm({ phone: "123" })).phone).toBe(
      PHONE_INVALID_MESSAGE
    );
    expect(validateFullHostIntake(validForm({ phone: "(802) 555-0199" })).phone).toBeUndefined();
    expect(validateFullHostIntake(validForm({ phone: "802-555-0199" })).phone).toBeUndefined();
    expect(validateFullHostIntake(validForm({ phone: "+1 (802) 555-0199" })).phone).toBeUndefined();
  });

  it("does not require payment method, access confirmation, or later property notes", () => {
    const errors = validateFullHostIntake(
      validForm({
        preferredPaymentMethod: "",
        willSendAccessDetails: false,
        restrictedAreas: "",
        supplyStorageLocation: "",
        trashBinLocation: "",
      })
    );
    expect(errors).toEqual({});
  });
});

describe("Vermont host intake form copy", () => {
  const source = readFileSync(
    path.join(process.cwd(), "app/vermont/host-intake/HostIntakeForm.tsx"),
    "utf8"
  );

  it("asks for contact info before the property and uses the quote button", () => {
    const contactAt = source.indexOf("Your contact info");
    const propertyAt = source.indexOf("Your property");
    expect(contactAt).toBeGreaterThan(-1);
    expect(propertyAt).toBeGreaterThan(contactAt);
    expect(source).toContain("Request My Turnover Quote");
    expect(source).toContain("No card needed. We&apos;ll reply within one business day.");
    expect(source).not.toContain("HOST INTAKE");
  });

  it("stops asking for fields collected later and still shows phone and WhatsApp after submit", () => {
    expect(source).not.toContain("Preferred payment method");
    expect(source).not.toContain("I will send the access code");
    expect(source).not.toContain("Supply storage location");
    expect(source).not.toContain("Trash bin location");
    expect(source).not.toContain("Restricted areas");
    expect(source).toContain('href="tel:+18027335348"');
    expect(source).toContain('href="https://wa.me/18027335348"');
    expect(source).toContain("within one business day");
  });
});
