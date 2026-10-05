import type { HostAttribution } from "@/lib/hostIntake/attribution";
import type {
  RESIDENTIAL_CONDITION_FLAGS,
  RESIDENTIAL_CONTACT_METHODS,
  RESIDENTIAL_FREQUENCIES,
  RESIDENTIAL_SERVICE_TYPES,
  RESIDENTIAL_SUPPLIES,
} from "./constants";

export type ResidentialServiceType =
  (typeof RESIDENTIAL_SERVICE_TYPES)[number];
export type ResidentialFrequency = (typeof RESIDENTIAL_FREQUENCIES)[number];
export type ResidentialContactMethod =
  (typeof RESIDENTIAL_CONTACT_METHODS)[number];
export type ResidentialSupplies = (typeof RESIDENTIAL_SUPPLIES)[number];
export type ResidentialConditionFlagId =
  (typeof RESIDENTIAL_CONDITION_FLAGS)[number]["id"];

export type ResidentialIntakePayload = {
  fullName: string;
  email: string;
  phone: string;
  serviceAddress: string;
  city: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  serviceType: ResidentialServiceType | "";
  frequency: ResidentialFrequency | "";
  preferredServiceDate: string;
  preferredContactMethod: ResidentialContactMethod | "";
  pets: string;
  occupancyApprox: string;
  accessParking: string;
  suppliesProvidedBy: ResidentialSupplies | "";
  trashRequirements: string;
  laundryRequested: boolean;
  bedMakingRequested: boolean;
  lastProfessionalClean: string;
  specialInstructions: string;
  conditionFlags: ResidentialConditionFlagId[];
  conditionOther: string;
  attribution?: HostAttribution | null;
};
