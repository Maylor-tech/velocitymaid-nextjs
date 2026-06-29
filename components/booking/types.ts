export type ServiceType =
  | 'STANDARD'
  | 'DEEP_CLEAN'
  | 'MOVE_IN_OUT'
  | 'RECURRING'
  | 'VACATION_RENTAL_TURNOVER'
  | 'PROPERTY_WALKTHROUGH'
  | 'EMERGENCY_CLEAN';

export interface BookingContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface BookingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  apartment?: string;
  entryNotes?: string;
}

export interface BookingHomeDetails {
  bedrooms: number;
  bathrooms: number;
  sqft?: number | null;
  pets?: boolean;
}

export interface BookingExtras {
  insideFridge: boolean;
  insideOven: boolean;
  insideCabinets: boolean;
  windows: boolean;
  laundry: boolean;
  notes: string;
}

export interface BookingSchedule {
  date: string | null; // ISO date only
  timeSlot: string | null; // e.g. '09:00-12:00'
  flexibility: 'FLEXIBLE' | 'EXACT_TIME' | 'MORNING' | 'AFTERNOON';
}

export interface BookingDraft {
  market: string | null; // Market selection (required before branch; slug-aligned)
  serviceType: ServiceType | null;
  branchSlug: string | null;
  contact: BookingContactInfo;
  address: BookingAddress;
  home: BookingHomeDetails;
  schedule: BookingSchedule;
  extras: BookingExtras;
}

export type BookingStep = 0 | 1 | 2 | 3 | 4 | 5;

