import {
  RESIDENTIAL_CONDITION_DISCLAIMER,
  RESIDENTIAL_CONDITION_FLAGS,
  RESIDENTIAL_CONTACT_METHODS,
  RESIDENTIAL_FREQUENCIES,
  RESIDENTIAL_SERVICE_TYPES,
  RESIDENTIAL_SUPPLIES,
} from "./constants";
import type {
  ResidentialConditionFlagId,
  ResidentialIntakePayload,
} from "./types";

const FLAG_IDS = new Set(
  RESIDENTIAL_CONDITION_FLAGS.map((flag) => flag.id)
);

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function hasUnusualConditions(
  flags: readonly string[] | null | undefined
): boolean {
  return Array.isArray(flags) && flags.length > 0;
}

export function residentialConditionDisclaimer(
  flags: readonly string[] | null | undefined
): string | null {
  return hasUnusualConditions(flags) ? RESIDENTIAL_CONDITION_DISCLAIMER : null;
}

export function parseResidentialIntakeBody(
  body: unknown
): ResidentialIntakePayload {
  const raw = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const str = (key: string): string =>
    typeof raw[key] === "string" ? raw[key].trim() : "";
  const bool = (key: string): boolean => raw[key] === true || raw[key] === "true";

  const flagsRaw = raw.conditionFlags;
  const conditionFlags: ResidentialConditionFlagId[] = [];
  if (Array.isArray(flagsRaw)) {
    for (const item of flagsRaw) {
      if (typeof item === "string" && FLAG_IDS.has(item as ResidentialConditionFlagId)) {
        conditionFlags.push(item as ResidentialConditionFlagId);
      }
    }
  }

  return {
    fullName: str("fullName"),
    email: str("email").toLowerCase(),
    phone: str("phone"),
    serviceAddress: str("serviceAddress"),
    city: str("city"),
    bedrooms: str("bedrooms"),
    bathrooms: str("bathrooms"),
    squareFootage: str("squareFootage"),
    serviceType: str("serviceType") as ResidentialIntakePayload["serviceType"],
    frequency: str("frequency") as ResidentialIntakePayload["frequency"],
    preferredServiceDate: str("preferredServiceDate"),
    preferredContactMethod:
      str("preferredContactMethod") as ResidentialIntakePayload["preferredContactMethod"],
    pets: str("pets"),
    occupancyApprox: str("occupancyApprox"),
    accessParking: str("accessParking"),
    suppliesProvidedBy:
      str("suppliesProvidedBy") as ResidentialIntakePayload["suppliesProvidedBy"],
    trashRequirements: str("trashRequirements"),
    laundryRequested: bool("laundryRequested"),
    bedMakingRequested: bool("bedMakingRequested"),
    lastProfessionalClean: str("lastProfessionalClean"),
    specialInstructions: str("specialInstructions"),
    conditionFlags,
    conditionOther: str("conditionOther"),
    attribution: null,
  };
}

export function validateResidentialIntake(
  payload: ResidentialIntakePayload
): string | null {
  if (!payload.fullName) return "Name is required";
  if (!payload.email) return "Email is required";
  if (!isValidEmail(payload.email)) return "Invalid email address";
  if (!payload.phone) return "Phone is required";
  if (!payload.serviceAddress) return "Service address is required";
  if (!payload.city) return "City/town is required";
  if (!payload.bedrooms) return "Bedrooms are required";
  if (!payload.bathrooms) return "Bathrooms are required";
  if (!payload.squareFootage) return "Approximate square footage is required";
  if (
    !payload.serviceType ||
    !(RESIDENTIAL_SERVICE_TYPES as readonly string[]).includes(payload.serviceType)
  ) {
    return "Service type is required";
  }
  if (
    !payload.frequency ||
    !(RESIDENTIAL_FREQUENCIES as readonly string[]).includes(payload.frequency)
  ) {
    return "Frequency is required";
  }
  if (!payload.preferredServiceDate) return "Preferred service date is required";
  if (
    !payload.preferredContactMethod ||
    !(RESIDENTIAL_CONTACT_METHODS as readonly string[]).includes(
      payload.preferredContactMethod
    )
  ) {
    return "Preferred contact method is required";
  }
  if (
    !payload.suppliesProvidedBy ||
    !(RESIDENTIAL_SUPPLIES as readonly string[]).includes(payload.suppliesProvidedBy)
  ) {
    return "Please choose who supplies cleaning products";
  }
  if (payload.conditionFlags.includes("other") && !payload.conditionOther) {
    return "Please describe the other unusual condition";
  }
  return null;
}
