/**
 * Cleaner Data Utilities
 * 
 * TODO: Replace with database queries when connecting to real DB
 */

export type ServiceRegion = 'new_jersey' | 'vermont';

export interface Cleaner {
  id: string;
  name: string;
  phone: string;
  email?: string;
  region: ServiceRegion;
  active: boolean;
}

export interface CleanerJob {
  id: string;
  sessionId: string;
  customerName: string;
  address: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  serviceLocation: ServiceRegion;
  status: 'pending' | 'assigned' | 'confirmed' | 'on_the_way' | 'completed' | 'cancelled';
  assignedCleanerId: string;
  specialInstructions?: string;
  phone?: string;
  email?: string;
  totalPrice?: number;
}

/**
 * Mock cleaners database
 * TODO: Replace with database query
 */
const MOCK_CLEANERS: Cleaner[] = [
  {
    id: 'cleaner_1',
    name: 'John Cleaner',
    phone: '+19735556677',
    email: 'john.cleaner@velocitymaid.com',
    region: 'new_jersey',
    active: true,
  },
  {
    id: 'cleaner_2',
    name: 'Jane Cleaner',
    phone: '+18025556677',
    email: 'jane.cleaner@velocitymaid.com',
    region: 'vermont',
    active: true,
  },
  {
    id: 'cleaner_3',
    name: 'Bob Cleaner',
    phone: '+19734445555',
    email: 'bob.cleaner@velocitymaid.com',
    region: 'new_jersey',
    active: true,
  },
];

/**
 * Find cleaner by phone or email
 * TODO: Replace with database query
 */
export function findCleanerByIdentifier(identifier: string): Cleaner | null {
  const normalized = identifier.trim().toLowerCase();
  
  return (
    MOCK_CLEANERS.find(
      (cleaner) =>
        cleaner.phone.toLowerCase() === normalized ||
        cleaner.email?.toLowerCase() === normalized
    ) || null
  );
}

/**
 * Find cleaner by ID
 * TODO: Replace with database query
 */
export function findCleanerById(id: string): Cleaner | null {
  return MOCK_CLEANERS.find((cleaner) => cleaner.id === id) || null;
}

/**
 * Get all active cleaners
 * TODO: Replace with database query
 */
export function getAllCleaners(): Cleaner[] {
  return MOCK_CLEANERS.filter((cleaner) => cleaner.active);
}

/**
 * Get cleaner's jobs from Stripe sessions
 * TODO: Replace with database query when moving to DB
 */
export async function getCleanerJobs(cleanerId: string): Promise<CleanerJob[]> {
  // This will be replaced with actual Stripe/database query
  // For now, return empty array - will be populated by API route
  return [];
}



