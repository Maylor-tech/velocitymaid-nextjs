import { describe, expect, it } from "vitest";
import { RESIDENTIAL_CONDITION_DISCLAIMER } from "../constants";
import {
  parseResidentialIntakeBody,
  residentialConditionDisclaimer,
  validateResidentialIntake,
} from "../validate";
import type { ResidentialIntakePayload } from "../types";

function validPayload(
  overrides: Partial<ResidentialIntakePayload> = {}
): ResidentialIntakePayload {
  return {
    fullName: "Jordan Hale",
    email: "jordan@example.com",
    phone: "8025550100",
    serviceAddress: "12 Maple Street",
    city: "Middlebury",
    bedrooms: "1",
    bathrooms: "1",
    squareFootage: "700",
    serviceType: "Deep Clean",
    frequency: "One-time",
    preferredServiceDate: "2026-10-20",
    preferredContactMethod: "Email",
    pets: "Dog",
    occupancyApprox: "2",
    accessParking: "Driveway",
    suppliesProvidedBy: "Customer supplies products",
    trashRequirements: "Curb Tuesday",
    laundryRequested: false,
    bedMakingRequested: true,
    lastProfessionalClean: "Spring 2025",
    specialInstructions: "Please wipe baseboards",
    conditionFlags: [],
    conditionOther: "",
    ...overrides,
  };
}

describe("residential intake validation", () => {
  it("accepts a complete residential payload", () => {
    expect(validateResidentialIntake(validPayload())).toBeNull();
  });

  it("requires identity and home fields", () => {
    expect(validateResidentialIntake(validPayload({ email: "not-an-email" }))).toBe(
      "Invalid email address"
    );
    expect(validateResidentialIntake(validPayload({ serviceAddress: "" }))).toBe(
      "Service address is required"
    );
    expect(validateResidentialIntake(validPayload({ serviceType: "" }))).toBe(
      "Service type is required"
    );
  });

  it("shows the assessment disclaimer only when a condition flag is set", () => {
    expect(residentialConditionDisclaimer([])).toBeNull();
    expect(residentialConditionDisclaimer(["visible_mold_mildew"])).toBe(
      RESIDENTIAL_CONDITION_DISCLAIMER
    );
  });

  it("does not use mold remediation terminology", () => {
    const source = [
      RESIDENTIAL_CONDITION_DISCLAIMER,
      JSON.stringify(validPayload({ conditionFlags: ["visible_mold_mildew"] })),
    ].join("\n");
    expect(source.toLowerCase()).not.toContain("mold remediation");
  });

  it("lowercases email when parsing", () => {
    const parsed = parseResidentialIntakeBody({
      ...validPayload(),
      email: "Jordan@Example.COM",
    });
    expect(parsed.email).toBe("jordan@example.com");
  });
});
