export const APPLY_STATE_OPTIONS = ['Vermont', 'New Jersey', 'Other'] as const;

export const HOURS_PER_WEEK_OPTIONS = [
  '5–10 hours',
  '10–20 hours',
  '20–30 hours',
  '30+ hours',
] as const;

export const YEARS_EXPERIENCE_OPTIONS = [
  'No experience yet',
  'Less than 1 year',
  '1–3 years',
  '3–5 years',
  '5+ years',
] as const;

export const PROPERTY_TYPE_OPTIONS = [
  'Residential homes',
  'Vacation rentals / Airbnb / VRBO',
  'Hotels or hospitality',
  'Apartments',
  'Commercial / office',
  'No prior experience',
] as const;

export const HOW_HEARD_OPTIONS = [
  'Facebook group',
  'Flyer',
  'Friend or referral',
  'Google search',
  'Community board',
  'Other',
] as const;

export const WEEKDAY_OPTIONS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export type CleanerApplyPayload = {
  portalVersion: 'apply-v2';
  personal: {
    fullName: string;
    email: string;
    phone: string;
    city: string;
    state: (typeof APPLY_STATE_OPTIONS)[number] | '';
    branchId: string;
    neighborhood: string;
  };
  eligibility: {
    age18OrOlder: 'Yes' | 'No' | '';
    authorizedToWork: 'Yes' | 'No' | '';
    hasDriversLicense: 'Yes' | 'No' | '';
    reliableTransportation: 'Yes' | 'No' | '';
    comfortableDriving30to60Miles: 'Yes' | 'No' | 'Sometimes' | '';
    backgroundCheckConsent: boolean;
  };
  availability: {
    daysAvailable: string[];
    hoursPerWeek: string;
    sameDayBookings: 'Yes' | 'Sometimes' | 'No' | '';
    skiSeasonAvailable: 'Yes' | 'No' | 'Unsure' | '';
    otherEmployment: 'Yes' | 'No' | '';
  };
  experience: {
    hasCleaningExperience: 'Yes' | 'No' | '';
    yearsExperience: string;
    propertyTypes: string[];
    vacationRentalTurnovers: 'Yes' | 'No' | '';
    comfortableWithLaundry: 'Yes' | 'No' | '';
    hotTubComfort: 'Yes' | 'No' | 'Willing to learn' | '';
    cleaningSupplies:
      | 'Yes, full kit'
      | 'Some basics'
      | 'No — I would need guidance'
      | '';
  };
  professionalFit: {
    independentCleaner: 'Yes' | 'No' | 'I was previously' | '';
    whyVelocityMaid: string;
    howHeardAboutUs: string;
    anythingElse: string;
  };
  agreements: {
    independentContractor: boolean;
    professionalConduct: boolean;
    hospitalityStandard: boolean;
  };
};

export const EMPTY_CLEANER_APPLY: CleanerApplyPayload = {
  portalVersion: 'apply-v2',
  personal: {
    fullName: '',
    email: '',
    phone: '',
    city: '',
    state: '',
    branchId: '',
    neighborhood: '',
  },
  eligibility: {
    age18OrOlder: '',
    authorizedToWork: '',
    hasDriversLicense: '',
    reliableTransportation: '',
    comfortableDriving30to60Miles: '',
    backgroundCheckConsent: false,
  },
  availability: {
    daysAvailable: [],
    hoursPerWeek: '',
    sameDayBookings: '',
    skiSeasonAvailable: '',
    otherEmployment: '',
  },
  experience: {
    hasCleaningExperience: '',
    yearsExperience: '',
    propertyTypes: [],
    vacationRentalTurnovers: '',
    comfortableWithLaundry: '',
    hotTubComfort: '',
    cleaningSupplies: '',
  },
  professionalFit: {
    independentCleaner: '',
    whyVelocityMaid: '',
    howHeardAboutUs: '',
    anythingElse: '',
  },
  agreements: {
    independentContractor: false,
    professionalConduct: false,
    hospitalityStandard: false,
  },
};

export function isCleanerApplyPayload(
  value: unknown
): value is CleanerApplyPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as CleanerApplyPayload).portalVersion === 'apply-v2'
  );
}
