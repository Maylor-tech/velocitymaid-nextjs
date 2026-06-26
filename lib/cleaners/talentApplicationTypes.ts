export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const SERVICE_AREAS = [
  'Ludlow',
  'Okemo',
  'Killington',
  'Woodstock',
  'Rutland',
  'Springfield',
  'New Jersey',
  'Other',
] as const;

export const EXPERIENCE_TYPES = [
  'Residential cleaning',
  'Vacation rental / Airbnb turnovers',
  'Hotel housekeeping',
  'Commercial cleaning',
  'Move-out cleaning',
  'Luxury homes',
  'Laundry',
  'Bed making',
] as const;

export const SKILL_RATING_KEYS = [
  'bathroomCleaning',
  'kitchenCleaning',
  'laundry',
  'bedMaking',
  'attentionToDetail',
  'communication',
  'organization',
  'timeManagement',
] as const;

export const SKILL_RATING_LABELS: Record<(typeof SKILL_RATING_KEYS)[number], string> = {
  bathroomCleaning: 'Bathroom cleaning',
  kitchenCleaning: 'Kitchen cleaning',
  laundry: 'Laundry',
  bedMaking: 'Bed making',
  attentionToDetail: 'Attention to detail',
  communication: 'Communication',
  organization: 'Organization',
  timeManagement: 'Time management',
};

export const EQUIPMENT_ITEMS = [
  'Smartphone',
  'Reliable internet',
  'Google Maps',
  'Text messaging',
  'Email',
  'Photo uploads',
  'Vacuum',
  'Mop',
  'Microfiber cloths',
  'Cleaning supplies',
] as const;

export interface TalentReference {
  name: string;
  phone: string;
  relationship: string;
}

export interface TalentApplicationPayload {
  personal: {
    firstName: string;
    lastName: string;
    preferredName: string;
    phone: string;
    email: string;
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
  };
  eligibility: {
    authorizedToWork: boolean;
    reliableTransportation: boolean;
    ownsVehicle: boolean;
    hasAutoInsurance: boolean;
    hasDriversLicense: boolean;
  };
  availability: {
    daysAvailable: string[];
    preferredTime: 'Morning' | 'Afternoon' | 'Evening' | '';
    maxHoursPerWeek: string;
    weekendTurnovers: boolean;
  };
  serviceAreas: {
    areas: string[];
    otherArea: string;
    maxTravelDistance: string;
  };
  experience: {
    workedProfessionally: boolean;
    yearsExperience: string;
    experienceTypes: string[];
  };
  skills: Record<(typeof SKILL_RATING_KEYS)[number], number>;
  equipment: string[];
  hospitality: {
    meaningOfClean: string;
    exceededExpectations: string;
    foundWeddingRing: string;
    noticedDamage: string;
    finishedEarly: string;
    meaningOfExcellence: string;
  };
  references: TalentReference[];
  consents: {
    backgroundCheck: boolean;
    certificationTraining: boolean;
    informationAccurate: boolean;
  };
  portalVersion: 'talent-v1';
}

export const EMPTY_TALENT_APPLICATION: TalentApplicationPayload = {
  personal: {
    firstName: '',
    lastName: '',
    preferredName: '',
    phone: '',
    email: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
  },
  eligibility: {
    authorizedToWork: false,
    reliableTransportation: false,
    ownsVehicle: false,
    hasAutoInsurance: false,
    hasDriversLicense: false,
  },
  availability: {
    daysAvailable: [],
    preferredTime: '',
    maxHoursPerWeek: '',
    weekendTurnovers: false,
  },
  serviceAreas: {
    areas: [],
    otherArea: '',
    maxTravelDistance: '',
  },
  experience: {
    workedProfessionally: false,
    yearsExperience: '',
    experienceTypes: [],
  },
  skills: {
    bathroomCleaning: 3,
    kitchenCleaning: 3,
    laundry: 3,
    bedMaking: 3,
    attentionToDetail: 3,
    communication: 3,
    organization: 3,
    timeManagement: 3,
  },
  equipment: [],
  hospitality: {
    meaningOfClean: '',
    exceededExpectations: '',
    foundWeddingRing: '',
    noticedDamage: '',
    finishedEarly: '',
    meaningOfExcellence: '',
  },
  references: [
    { name: '', phone: '', relationship: '' },
    { name: '', phone: '', relationship: '' },
    { name: '', phone: '', relationship: '' },
  ],
  consents: {
    backgroundCheck: false,
    certificationTraining: false,
    informationAccurate: false,
  },
  portalVersion: 'talent-v1',
};
