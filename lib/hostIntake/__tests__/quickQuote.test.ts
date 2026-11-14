import { describe, expect, it } from "vitest";
import {
  buildQuickQuoteServiceInterest,
  validateQuickQuoteStep,
  type QuickQuoteFormState,
} from "@/lib/hostIntake/quickQuote";

const base: QuickQuoteFormState = {
  city: "Ludlow",
  propertyType: "Vacation rental / STR",
  bedrooms: "3",
  bathrooms: "2",
  serviceInterest: "Home Watch",
  timing: "Planning ahead / flexible",
  frequency: "Seasonal / as needed",
  fullName: "Test Host",
  email: "host@example.com",
  phone: "8025551212",
  preferredContact: "Email",
};

describe("Vermont quick quote validation", () => {
  it("requires property fields on step 1", () => {
    const errors = validateQuickQuoteStep(1, {
      ...base,
      city: "",
      bedrooms: "",
    });
    expect(errors.city).toBeTruthy();
    expect(errors.bedrooms).toBeTruthy();
  });

  it("requires service fields on step 2", () => {
    const errors = validateQuickQuoteStep(2, {
      ...base,
      serviceInterest: "",
      timing: "",
    });
    expect(errors.serviceInterest).toBeTruthy();
    expect(errors.timing).toBeTruthy();
  });

  it("requires contact fields on step 3", () => {
    const errors = validateQuickQuoteStep(3, {
      ...base,
      email: "bad",
      preferredContact: "",
    });
    expect(errors.email).toBeTruthy();
    expect(errors.preferredContact).toBeTruthy();
  });

  it("builds SETUP_REQUEST-compatible serviceInterest", () => {
    const interest = buildQuickQuoteServiceInterest(base);
    expect(interest).toContain("Home Watch");
    expect(interest).toContain("Beds/baths: 3/2");
    expect(interest).toContain("Preferred contact: Email");
  });

  it("accepts a complete form across steps", () => {
    expect(Object.keys(validateQuickQuoteStep(1, base))).toHaveLength(0);
    expect(Object.keys(validateQuickQuoteStep(2, base))).toHaveLength(0);
    expect(Object.keys(validateQuickQuoteStep(3, base))).toHaveLength(0);
  });
});
