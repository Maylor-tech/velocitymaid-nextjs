import type { HostIntakePayload } from "./types";
import {
  validateFullHostIntake,
  type FullIntakeFieldErrors,
} from "./validateFullIntake";

/**
 * Two-step presentation of the Vermont host intake form.
 * Step 1 validates only these fields (same rules as validateFullHostIntake);
 * the full submit still runs validateFullHostIntake over everything.
 */
export const STEP1_REQUIRED_FIELDS = [ // on-page order
  "fullName",
  "phone",
  "email",
  "propertyAddress",
  "city",
  "bedrooms",
  "bathrooms",
] as const satisfies readonly (keyof HostIntakePayload)[];

/** Step 2 required fields, in on-page order (used for focus-first-error). */
export const STEP2_REQUIRED_FIELDS = [
  "accessType",
  "accessTypeOther",
  "linenProvider",
  "sameDayTurnovers",
  "propertyActiveSeasons",
] as const satisfies readonly (keyof HostIntakePayload)[];

type Step1Field = (typeof STEP1_REQUIRED_FIELDS)[number];

/** Step 1 only: reuses validateFullHostIntake and keeps just the step-1 errors. */
export function validateHostIntakeStep1(
  form: HostIntakePayload
): FullIntakeFieldErrors {
  const all = validateFullHostIntake(form);
  const errors: FullIntakeFieldErrors = {};
  for (const key of STEP1_REQUIRED_FIELDS) {
    const message = all[key as Step1Field];
    if (message) errors[key] = message;
  }
  return errors;
}

/** First field with an error, following the given on-page order. */
export function firstErrorField(
  errors: FullIntakeFieldErrors,
  order: readonly (keyof HostIntakePayload)[]
): keyof HostIntakePayload | null {
  for (const key of order) {
    if (errors[key]) return key;
  }
  return null;
}

/**
 * Public chip label -> existing SERVICE_TYPES value sent to the API.
 * "Property inspection & photo report" is intentionally not a chip
 * (it is only set by the ?service=home-watch default).
 */
export const SERVICE_TYPE_CHIPS = [
  { label: "Turnovers", value: "Turnover cleaning between guests" },
  { label: "Deep · seasonal", value: "Deep / seasonal clean" },
  {
    label: "Post-construction",
    value: "Post-construction / special project prep",
  },
  { label: "Welcome setup", value: "Guest welcome setup / restocking" },
] as const;
