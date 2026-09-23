import type { HostAttribution } from "./attribution";

export type HostIntakeMode = "FULL" | "SETUP_REQUEST";

export type HostIntakePayload = {
  propertyAddress: string;
  city: string;
  bedrooms: string;
  bathrooms: string;
  squareFootage: string;
  bedConfiguration: string;
  propertyAmenities: string[];
  restrictedAreas: string;
  bookingPlatforms: string[];
  accessType: string;
  accessTypeOther: string;
  willSendAccessDetails: boolean;
  guestCheckoutTime: string;
  guestCheckoutTimeOther: string;
  guestCheckinTime: string;
  guestCheckinTimeOther: string;
  supplyStorageLocation: string;
  trashBinLocation: string;
  serviceTypes: string[];
  turnoverFrequency: string;
  hasCleaner: string;
  linenProvider: string;
  sameDayTurnovers: string;
  bookingAdvanceNotice: string;
  propertyActiveSeasons: string[];
  preferredPaymentMethod: string;
  specialInstructions: string;
  fullName: string;
  email: string;
  phone: string;
  preferredContact: string;
  bestTimeToReach: string;
  /** Optional first-touch campaign dims from /hosts. */
  attribution?: HostAttribution | null;
  mode?: HostIntakeMode;
  /** Lightweight setup-request interest (SETUP_REQUEST mode). */
  serviceInterest?: string;
};

/** Minimal fields for /hosts setup-request mode. */
export type HostSetupRequestPayload = {
  mode: "SETUP_REQUEST";
  fullName: string;
  email: string;
  phone: string;
  city: string;
  serviceInterest: string;
  attribution?: HostAttribution | null;
};
