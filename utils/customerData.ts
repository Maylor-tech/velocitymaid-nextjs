/**
 * Customer Data Model and Utilities
 * 
 * Customer Self-Service Portal
 * TODO: Replace with database queries when connecting to real DB
 */

export type ServiceRegion = 'new_jersey' | 'vermont';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email: string; // Unique
  phone: string;
  defaultAddress: string | null;
  region: ServiceRegion | null;
  stripeCustomerId: string | null;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerHome {
  id: string;
  customerId: string;
  label: string; // e.g., "Home", "Airbnb #1", "Mom's Apartment"
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  region: ServiceRegion;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerPreferences {
  id: string;
  customerId: string;
  preferredTimeWindow: 'morning' | 'afternoon' | 'evening' | null;
  preferredDayOfWeek: number | null; // 0-6 (0 = Sunday)
  notesForCleaner: string | null;
  allowWhatsApp: boolean;
  allowEmail: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Mock customers storage (in-memory)
 * TODO: Replace with database table
 */
const MOCK_CUSTOMERS: Customer[] = [];

/**
 * Mock customer homes storage
 * TODO: Replace with database table
 */
const MOCK_CUSTOMER_HOMES: CustomerHome[] = [];

/**
 * Mock customer preferences storage
 * TODO: Replace with database table
 */
const MOCK_CUSTOMER_PREFERENCES: CustomerPreferences[] = [];

/**
 * Find customer by email
 * TODO: Replace with database SELECT WHERE email = ?
 */
export function findCustomerByEmail(email: string): Customer | null {
  return MOCK_CUSTOMERS.find(c => c.email.toLowerCase() === email.toLowerCase()) || null;
}

/**
 * Find customer by ID
 * TODO: Replace with database SELECT WHERE id = ?
 */
export function findCustomerById(id: string): Customer | null {
  return MOCK_CUSTOMERS.find(c => c.id === id) || null;
}

/**
 * Create a new customer
 * TODO: Replace with database INSERT
 */
export function createCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'stripeCustomerId' | 'loyaltyPoints'> & Partial<Pick<Customer, 'stripeCustomerId' | 'loyaltyPoints'>>): Customer {
  const newCustomer: Customer = {
    id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...customer,
    stripeCustomerId: customer.stripeCustomerId ?? null,
    loyaltyPoints: customer.loyaltyPoints ?? 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_CUSTOMERS.push(newCustomer);
  return newCustomer;
}

/**
 * Update customer
 * TODO: Replace with database UPDATE
 */
export function updateCustomer(id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt'>>): Customer | null {
  const customer = findCustomerById(id);
  if (!customer) {
    return null;
  }
  
  const updatedCustomer: Customer = {
    ...customer,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  const index = MOCK_CUSTOMERS.findIndex(c => c.id === id);
  if (index !== -1) {
    MOCK_CUSTOMERS[index] = updatedCustomer;
  }
  
  return updatedCustomer;
}

/**
 * Get customer homes
 * TODO: Replace with database SELECT WHERE customerId = ?
 */
export function getCustomerHomes(customerId: string): CustomerHome[] {
  return MOCK_CUSTOMER_HOMES
    .filter(h => h.customerId === customerId)
    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
}

/**
 * Create customer home
 * TODO: Replace with database INSERT
 */
export function createCustomerHome(home: Omit<CustomerHome, 'id' | 'createdAt' | 'updatedAt'>): CustomerHome {
  const newHome: CustomerHome = {
    id: `home_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...home,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  MOCK_CUSTOMER_HOMES.push(newHome);
  return newHome;
}

/**
 * Get customer preferences
 * TODO: Replace with database SELECT WHERE customerId = ?
 */
export function getCustomerPreferences(customerId: string): CustomerPreferences | null {
  return MOCK_CUSTOMER_PREFERENCES.find(p => p.customerId === customerId) || null;
}

/**
 * Create or update customer preferences
 * TODO: Replace with database UPSERT
 */
export function upsertCustomerPreferences(
  customerId: string,
  preferences: Partial<Omit<CustomerPreferences, 'id' | 'customerId' | 'createdAt' | 'updatedAt'>>
): CustomerPreferences {
  const existing = getCustomerPreferences(customerId);
  
  if (existing) {
    const updated: CustomerPreferences = {
      ...existing,
      ...preferences,
      updatedAt: new Date().toISOString(),
    };
    
    const index = MOCK_CUSTOMER_PREFERENCES.findIndex(p => p.id === existing.id);
    if (index !== -1) {
      MOCK_CUSTOMER_PREFERENCES[index] = updated;
    }
    
    return updated;
  } else {
    const newPreferences: CustomerPreferences = {
      id: `pref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      customerId,
      preferredTimeWindow: preferences.preferredTimeWindow || null,
      preferredDayOfWeek: preferences.preferredDayOfWeek ?? null,
      notesForCleaner: preferences.notesForCleaner || null,
      allowWhatsApp: preferences.allowWhatsApp ?? true,
      allowEmail: preferences.allowEmail ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    MOCK_CUSTOMER_PREFERENCES.push(newPreferences);
    return newPreferences;
  }
}

/**
 * Find or create customer from booking email
 * This is used during login if customer doesn't exist yet
 */
export async function findOrCreateCustomerFromEmail(email: string): Promise<Customer | null> {
  // First, try to find existing customer
  let customer = findCustomerByEmail(email);
  
  if (customer) {
    return customer;
  }
  
  // If not found, check if there are any bookings with this email
  // TODO: Query bookings table to check if email exists
  // For now, we'll create a basic customer record
  // In production, you'd check Stripe sessions or bookings table first
  
  // Extract name from email (basic fallback)
  const emailParts = email.split('@')[0];
  const firstName = emailParts.split('.')[0] || emailParts;
  const lastName = emailParts.split('.')[1] || '';
  
  customer = createCustomer({
    firstName: firstName.charAt(0).toUpperCase() + firstName.slice(1),
    lastName: lastName.charAt(0).toUpperCase() + lastName.slice(1),
    email: email.toLowerCase(),
    phone: '', // Will be updated from booking
    defaultAddress: null,
    region: null,
    stripeCustomerId: null,
    loyaltyPoints: 0,
  });
  
  return customer;
}

/**
 * Update customer's Stripe customer ID
 * TODO: Replace with database UPDATE
 */
export function updateCustomerStripeId(customerId: string, stripeCustomerId: string): Customer | null {
  return updateCustomer(customerId, { stripeCustomerId });
}

/**
 * Add loyalty points to customer
 * TODO: Replace with database UPDATE
 */
export function addLoyaltyPoints(customerId: string, points: number): Customer | null {
  const customer = findCustomerById(customerId);
  if (!customer) {
    return null;
  }
  return updateCustomer(customerId, { loyaltyPoints: customer.loyaltyPoints + points });
}

/**
 * Database Schema (for future migration)
 * 
 * CREATE TABLE customers (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   first_name VARCHAR(255) NOT NULL,
 *   last_name VARCHAR(255) NOT NULL,
 *   email VARCHAR(255) UNIQUE NOT NULL,
 *   phone VARCHAR(20),
 *   default_address TEXT,
 *   region VARCHAR(20) CHECK (region IN ('new_jersey', 'vermont')),
 *   stripe_customer_id VARCHAR(255) UNIQUE,
 *   loyalty_points INTEGER DEFAULT 0,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW()
 * );
 * 
 * CREATE TABLE customer_homes (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   customer_id UUID NOT NULL,
 *   label VARCHAR(255) NOT NULL,
 *   address_line1 VARCHAR(255) NOT NULL,
 *   address_line2 VARCHAR(255),
 *   city VARCHAR(100) NOT NULL,
 *   state VARCHAR(50) NOT NULL,
 *   zip VARCHAR(20) NOT NULL,
 *   region VARCHAR(20) NOT NULL CHECK (region IN ('new_jersey', 'vermont')),
 *   is_primary BOOLEAN DEFAULT false,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW(),
 *   CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
 * );
 * 
 * CREATE TABLE customer_preferences (
 *   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 *   customer_id UUID UNIQUE NOT NULL,
 *   preferred_time_window VARCHAR(20) CHECK (preferred_time_window IN ('morning', 'afternoon', 'evening')),
 *   preferred_day_of_week INTEGER CHECK (preferred_day_of_week >= 0 AND preferred_day_of_week <= 6),
 *   notes_for_cleaner TEXT,
 *   allow_whatsapp BOOLEAN DEFAULT true,
 *   allow_email BOOLEAN DEFAULT true,
 *   created_at TIMESTAMP DEFAULT NOW(),
 *   updated_at TIMESTAMP DEFAULT NOW(),
 *   CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
 * );
 * 
 * CREATE INDEX idx_customers_email ON customers(email);
 * CREATE INDEX idx_customer_homes_customer ON customer_homes(customer_id);
 * CREATE INDEX idx_customer_preferences_customer ON customer_preferences(customer_id);
 */

