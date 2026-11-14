/**
 * Vermont quick-quote helpers — SETUP_REQUEST compatible, no schema change.
 * Property/service details fold into serviceInterest for ops follow-up.
 */

export const QUICK_QUOTE_PROPERTY_TYPES = [
  "Vacation rental / STR",
  "Second home",
  "Primary residence",
  "Other",
] as const;

export const QUICK_QUOTE_SERVICES = [
  "Turnover / guest-ready clean",
  "Deep clean / property reset",
  "Home Watch",
  "Other / not sure yet",
] as const;

export const QUICK_QUOTE_TIMING = [
  "This week",
  "Within 2 weeks",
  "This month",
  "Planning ahead / flexible",
] as const;

export const QUICK_QUOTE_FREQUENCY = [
  "One-time",
  "Every turnover",
  "Weekly",
  "Seasonal / as needed",
] as const;

export const QUICK_QUOTE_CONTACT_METHODS = [
  "Phone",
  "Email",
  "Text",
] as const;

export type QuickQuotePropertyType = (typeof QUICK_QUOTE_PROPERTY_TYPES)[number];
export type QuickQuoteService = (typeof QUICK_QUOTE_SERVICES)[number];
export type QuickQuoteTiming = (typeof QUICK_QUOTE_TIMING)[number];
export type QuickQuoteFrequency = (typeof QUICK_QUOTE_FREQUENCY)[number];
export type QuickQuoteContactMethod =
  (typeof QUICK_QUOTE_CONTACT_METHODS)[number];

export type QuickQuoteFormState = {
  city: string;
  propertyType: string;
  bedrooms: string;
  bathrooms: string;
  serviceInterest: string;
  timing: string;
  frequency: string;
  fullName: string;
  email: string;
  phone: string;
  preferredContact: string;
};

export type QuickQuoteFieldErrors = Partial<
  Record<keyof QuickQuoteFormState, string>
>;

export function isValidQuickQuoteEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function buildQuickQuoteServiceInterest(form: QuickQuoteFormState): string {
  return [
    form.serviceInterest,
    `Property: ${form.propertyType}`,
    `Beds/baths: ${form.bedrooms}/${form.bathrooms}`,
    `Timing: ${form.timing}`,
    `Frequency: ${form.frequency}`,
    `Preferred contact: ${form.preferredContact}`,
  ].join(" | ");
}

export function validateQuickQuoteStep(
  step: 1 | 2 | 3,
  form: QuickQuoteFormState
): QuickQuoteFieldErrors {
  const errors: QuickQuoteFieldErrors = {};

  if (step === 1) {
    if (!form.city.trim()) errors.city = "Vermont property town is required.";
    if (!form.propertyType) errors.propertyType = "Select a property type.";
    if (!form.bedrooms.trim()) errors.bedrooms = "Bedrooms are required.";
    if (!form.bathrooms.trim()) errors.bathrooms = "Bathrooms are required.";
  }

  if (step === 2) {
    if (!form.serviceInterest) errors.serviceInterest = "Select a service.";
    if (!form.timing) errors.timing = "Select timing.";
    if (!form.frequency) errors.frequency = "Select frequency.";
  }

  if (step === 3) {
    if (!form.fullName.trim()) errors.fullName = "Name is required.";
    if (!form.email.trim()) errors.email = "Email is required.";
    else if (!isValidQuickQuoteEmail(form.email.trim())) {
      errors.email = "Please enter a valid email address.";
    }
    if (!form.phone.trim()) errors.phone = "Phone is required.";
    if (!form.preferredContact) {
      errors.preferredContact = "Select a preferred contact method.";
    }
  }

  return errors;
}

/** Analytics-safe dims only — no PII. */
export function quickQuoteAnalyticsDims(form: Partial<QuickQuoteFormState>) {
  return {
    market: "vermont",
    quote_flow: "quick_quote",
    service: form.serviceInterest || undefined,
    property_type: form.propertyType || undefined,
    timing: form.timing || undefined,
    frequency: form.frequency || undefined,
  };
}
