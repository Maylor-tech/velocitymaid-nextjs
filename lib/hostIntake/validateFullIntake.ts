import type { HostIntakePayload } from "./types";

export const PHONE_REQUIRED_MESSAGE = "Phone number is required.";
export const PHONE_INVALID_MESSAGE =
  "Enter a valid phone number, such as (802) 555-0199.";

const PHONE_CHARACTERS = /^[\d\s()+.-]+$/;

/** Empty, junk, or a non-US number. Null means the phone is acceptable. */
export function phoneValidationMessage(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return PHONE_REQUIRED_MESSAGE;
  const digits = trimmed.replace(/\D/g, "");
  const national =
    digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (!PHONE_CHARACTERS.test(trimmed) || national.length !== 10) {
    return PHONE_INVALID_MESSAGE;
  }
  return null;
}

export type FullIntakeFieldErrors = Partial<Record<keyof HostIntakePayload, string>>;

/** Client validation for the first-visit Vermont host intake form. */
export function validateFullHostIntake(form: HostIntakePayload): FullIntakeFieldErrors {
  const next: FullIntakeFieldErrors = {};

  if (!form.fullName.trim()) {
    next.fullName = "Full name is required.";
  }
  if (!form.email.trim()) {
    next.email = "Email address is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    next.email = "Please enter a valid email address.";
  }
  const phoneError = phoneValidationMessage(form.phone);
  if (phoneError) {
    next.phone = phoneError;
  }
  if (!form.propertyAddress.trim()) {
    next.propertyAddress = "Property address is required.";
  }
  if (!form.city.trim()) {
    next.city = "City / town is required.";
  }
  if (!form.bedrooms) {
    next.bedrooms = "Please select the number of bedrooms.";
  }
  if (!form.bathrooms) {
    next.bathrooms = "Please select the number of bathrooms.";
  }
  if (!form.accessType) {
    next.accessType = "Please select an access type.";
  } else if (
    form.accessType === "Other (please describe)" &&
    !form.accessTypeOther.trim()
  ) {
    next.accessTypeOther = "Please describe your access type.";
  }
  if (!form.linenProvider) {
    next.linenProvider = "Please select who provides linens and towels.";
  }
  if (!form.sameDayTurnovers) {
    next.sameDayTurnovers = "Please select a same-day turnover preference.";
  }
  if (form.propertyActiveSeasons.length === 0) {
    next.propertyActiveSeasons = "Please select when your property is most active.";
  }

  return next;
}
