export const WORK_WITH_US_VERSION = 'work-with-us-v1' as const;

export const WORK_AREAS = ['OKEMO', 'MIDDLEBURY', 'BOTH'] as const;
export type WorkArea = (typeof WORK_AREAS)[number];

export const WORK_AREA_LABELS: Record<WorkArea, string> = {
  OKEMO: 'Okemo Valley',
  MIDDLEBURY: 'Middlebury',
  BOTH: 'Both',
};

export const WEEKDAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

export const EXPERIENCE_YEARS = [
  'Less than 1 year',
  '1–3 years',
  '3–5 years',
  '5 or more years',
] as const;

export const HIRING_STATUSES = [
  'NEW',
  'CONTACTED',
  'INTERVIEW',
  'TRIAL',
  'HIRED',
  'NOT_A_FIT',
] as const;
export type HiringStatus = (typeof HIRING_STATUSES)[number];

export const HIRING_STATUS_LABELS: Record<HiringStatus, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  INTERVIEW: 'Interview',
  TRIAL: 'Trial',
  HIRED: 'Hired',
  NOT_A_FIT: 'Not a fit',
};

/** Pipeline label only. Hired does not create a cleaner account. */
export function prismaStatusForHiring(status: HiringStatus): 'NEW' | 'REVIEWING' | 'REJECTED' {
  if (status === 'NEW') return 'NEW';
  if (status === 'NOT_A_FIT') return 'REJECTED';
  return 'REVIEWING';
}

export type YesNo = 'yes' | 'no';

export type VermontWorkApplication = {
  portalVersion: typeof WORK_WITH_US_VERSION;
  name: string;
  phone: string;
  email: string;
  town: string;
  area: WorkArea;
  daysAvailable: string[];
  ownTransport: YesNo;
  yearsExperience: (typeof EXPERIENCE_YEARS)[number];
  shortTermRentalExperience: YesNo;
  problemStory: string;
  hiringStatus: HiringStatus;
};

export function isWorkArea(value: unknown): value is WorkArea {
  return typeof value === 'string' && (WORK_AREAS as readonly string[]).includes(value);
}

export function isHiringStatus(value: unknown): value is HiringStatus {
  return typeof value === 'string' && (HIRING_STATUSES as readonly string[]).includes(value);
}

export function phoneDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function validateVermontWorkApplication(input: unknown): string | null {
  if (!input || typeof input !== 'object') return 'Enter your application.';
  const body = input as Record<string, unknown>;
  const name = String(body.name || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const town = String(body.town || '').trim();
  const story = String(body.problemStory || '').trim();
  const days = Array.isArray(body.daysAvailable) ? body.daysAvailable.map(String) : [];
  if (name.length < 2) return 'Enter your name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a real email address.';
  const digits = phoneDigits(phone);
  if (digits.length < 10 || digits.length > 15) return 'Enter a phone number we can call.';
  if (town.length < 2) return 'Enter your town.';
  if (!isWorkArea(body.area)) return 'Choose Okemo Valley, Middlebury, or both.';
  if (days.length === 0 || days.some((day) => !(WEEKDAYS as readonly string[]).includes(day))) {
    return 'Choose the days you are available.';
  }
  if (body.ownTransport !== 'yes' && body.ownTransport !== 'no') {
    return 'Tell us whether you have your own transport.';
  }
  if (!(EXPERIENCE_YEARS as readonly string[]).includes(String(body.yearsExperience || ''))) {
    return 'Choose your years of cleaning experience.';
  }
  if (body.shortTermRentalExperience !== 'yes' && body.shortTermRentalExperience !== 'no') {
    return 'Tell us whether you have short-term rental experience.';
  }
  if (story.length < 20) return 'Tell us about a time you had to communicate a problem to a client.';
  if (story.length > 2000) return 'Keep that story under 2,000 characters.';
  return null;
}

export function vermontWorkApplicationFromBody(input: Record<string, unknown>): VermontWorkApplication {
  const days = (Array.isArray(input.daysAvailable) ? input.daysAvailable.map(String) : []).filter((day) =>
    (WEEKDAYS as readonly string[]).includes(day)
  );
  return {
    portalVersion: WORK_WITH_US_VERSION,
    name: String(input.name || '').trim(),
    phone: String(input.phone || '').trim(),
    email: String(input.email || '').trim().toLowerCase(),
    town: String(input.town || '').trim(),
    area: input.area as WorkArea,
    daysAvailable: days,
    ownTransport: input.ownTransport as YesNo,
    yearsExperience: String(input.yearsExperience || '') as VermontWorkApplication['yearsExperience'],
    shortTermRentalExperience: input.shortTermRentalExperience as YesNo,
    problemStory: String(input.problemStory || '').trim(),
    hiringStatus: 'NEW',
  };
}

export function parseVermontWorkApplication(data: unknown): VermontWorkApplication | null {
  if (!data || typeof data !== 'object') return null;
  const row = data as Partial<VermontWorkApplication>;
  if (row.portalVersion !== WORK_WITH_US_VERSION) return null;
  if (!isWorkArea(row.area) || !isHiringStatus(row.hiringStatus || 'NEW')) return null;
  return {
    portalVersion: WORK_WITH_US_VERSION,
    name: String(row.name || ''),
    phone: String(row.phone || ''),
    email: String(row.email || ''),
    town: String(row.town || ''),
    area: row.area,
    daysAvailable: Array.isArray(row.daysAvailable) ? row.daysAvailable.map(String) : [],
    ownTransport: row.ownTransport === 'no' ? 'no' : 'yes',
    yearsExperience: (EXPERIENCE_YEARS as readonly string[]).includes(String(row.yearsExperience))
      ? (row.yearsExperience as VermontWorkApplication['yearsExperience'])
      : 'Less than 1 year',
    shortTermRentalExperience: row.shortTermRentalExperience === 'no' ? 'no' : 'yes',
    problemStory: String(row.problemStory || ''),
    hiringStatus: isHiringStatus(row.hiringStatus) ? row.hiringStatus : 'NEW',
  };
}
