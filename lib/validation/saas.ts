/**
 * Validation utilities for SaaS endpoints
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const normalized = email.trim().toLowerCase();
  
  if (normalized.length === 0) {
    return { valid: false, error: 'Email cannot be empty' };
  }

  if (normalized.length > 255) {
    return { valid: false, error: 'Email is too long (max 255 characters)' };
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Validate name (person or company)
 */
export function validateName(name: string, fieldName: string = 'Name'): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: `${fieldName} is required` };
  }

  const trimmed = name.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: `${fieldName} cannot be empty` };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldName} must be at least 2 characters` };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: `${fieldName} is too long (max 100 characters)` };
  }

  // Allow letters, numbers, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-Z0-9\s\-']+$/;
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: `${fieldName} contains invalid characters` };
  }

  return { valid: true };
}

/**
 * Validate phone number (optional, but if provided must be valid)
 */
export function validatePhone(phone: string | undefined | null): ValidationResult {
  if (!phone) {
    return { valid: true }; // Phone is optional
  }

  if (typeof phone !== 'string') {
    return { valid: false, error: 'Phone must be a string' };
  }

  const trimmed = phone.trim();
  
  if (trimmed.length === 0) {
    return { valid: true }; // Empty string is allowed
  }

  // Allow common phone formats: (555) 123-4567, 555-123-4567, +1 555 123 4567, etc.
  const phoneRegex = /^[\d\s\(\)\-\+\.]+$/;
  if (!phoneRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid phone number format' };
  }

  // Remove all non-digits and check length
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 15) {
    return { valid: false, error: 'Phone number must have 10-15 digits' };
  }

  return { valid: true };
}

/**
 * Validate Stripe Price ID format
 */
export function validatePriceId(priceId: string): ValidationResult {
  if (!priceId || typeof priceId !== 'string') {
    return { valid: false, error: 'Price ID is required' };
  }

  const trimmed = priceId.trim();
  
  // Stripe price IDs start with price_
  if (!trimmed.startsWith('price_')) {
    return { valid: false, error: 'Invalid Stripe Price ID format' };
  }

  if (trimmed.length < 10 || trimmed.length > 100) {
    return { valid: false, error: 'Invalid Stripe Price ID length' };
  }

  return { valid: true };
}

/**
 * Validate tenant ID format
 */
export function validateTenantId(tenantId: string): ValidationResult {
  if (!tenantId || typeof tenantId !== 'string') {
    return { valid: false, error: 'Tenant ID is required' };
  }

  const trimmed = tenantId.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Tenant ID cannot be empty' };
  }

  // CUID format validation (basic check)
  if (trimmed.length < 10 || trimmed.length > 50) {
    return { valid: false, error: 'Invalid Tenant ID format' };
  }

  return { valid: true };
}

