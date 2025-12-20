/**
 * Demo Data Helper Functions
 * 
 * Utility functions for generating realistic demo data
 */

/**
 * Generate a random date within the last N days
 */
export function randomDateWithin(days: number): Date {
  const now = new Date();
  const daysAgo = now.getTime() - days * 24 * 60 * 60 * 1000;
  const randomTime = daysAgo + Math.random() * (now.getTime() - daysAgo);
  return new Date(randomTime);
}

/**
 * Pick a random element from an array
 */
export function pick<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a random New Jersey address
 */
export function generateNJAddress(): string {
  const streets = [
    'Main St',
    'Park Ave',
    'Oak Blvd',
    'Maple Dr',
    'Cedar Ln',
    'Elm St',
    'Washington Ave',
    'Lincoln Way',
    'Broadway',
    'First St',
  ];

  const cities = [
    'Newark',
    'Jersey City',
    'Paterson',
    'Elizabeth',
    'Edison',
    'Woodbridge',
    'Lakewood',
    'Toms River',
    'Hamilton',
    'Trenton',
  ];

  const streetNumber = Math.floor(Math.random() * 9999) + 1;
  const street = pick(streets);
  const city = pick(cities);
  const zip = Math.floor(Math.random() * 90000) + 7000; // NJ ZIP codes typically 07000-08999

  return `${streetNumber} ${street}, ${city}, NJ ${zip}`;
}

/**
 * Generate a random name
 */
export function generateName(): { firstName: string; lastName: string } {
  const firstNames = [
    'John',
    'Jane',
    'Michael',
    'Sarah',
    'David',
    'Emily',
    'James',
    'Jessica',
    'Robert',
    'Amanda',
    'Maria',
    'Carlos',
    'Lisa',
    'Thomas',
    'Jennifer',
  ];

  const lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Wilson',
    'Anderson',
    'Thomas',
  ];

  return {
    firstName: pick(firstNames),
    lastName: pick(lastNames),
  };
}

/**
 * Generate a random phone number
 */
export function generatePhone(): string {
  const areaCode = pick(['201', '551', '609', '732', '848', '856', '862', '908', '973']);
  const exchange = Math.floor(Math.random() * 800) + 200;
  const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${areaCode}-${exchange}-${number}`;
}

/**
 * Generate an email from a name
 */
export function generateEmail(name: { firstName: string; lastName: string }): string {
  const domains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  const format = pick([
    `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}`,
    `${name.firstName.toLowerCase()}${name.lastName.toLowerCase()}`,
    `${name.firstName.toLowerCase()}${Math.floor(Math.random() * 100)}`,
  ]);
  return `${format}@${pick(domains)}`;
}

/**
 * Job statuses
 */
export const jobStatuses = [
  'pending',
  'assigned',
  'in_progress',
  'completed',
  'cancelled',
] as const;

/**
 * Training statuses
 */
export const trainingStatuses = ['PENDING', 'IN_REVIEW', 'PASSED', 'ACTIVE', 'NOT_STARTED'] as const;

/**
 * Availability templates
 */
export const availabilityTemplates = [
  {
    workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    timeRanges: [{ start: '09:00', end: '17:00' }],
    maxDailyJobs: 3,
  },
  {
    workingDays: ['tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    timeRanges: [{ start: '10:00', end: '18:00' }],
    maxDailyJobs: 4,
  },
  {
    workingDays: ['saturday', 'sunday'],
    timeRanges: [{ start: '08:00', end: '16:00' }],
    maxDailyJobs: 2,
  },
] as const;

/**
 * Generate performance stats
 */
export function performanceStats() {
  return {
    productivityScore: Math.floor(Math.random() * 40) + 60, // 60-100
    completionRate: Math.floor(Math.random() * 20) + 80, // 80-100
    averageRating: Math.random() * 1.5 + 3.5, // 3.5-5.0
  };
}

/**
 * Complaint severity levels
 */
export const complaintSeverities = [1, 2, 3, 4, 5] as const;

/**
 * Compliance issue severities
 */
export const complianceSeverities = [1, 2, 3, 4, 5] as const;
