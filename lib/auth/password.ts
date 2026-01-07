/**
 * Password hashing and verification utilities
 * Uses bcryptjs for secure password hashing
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hash a password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Validate password strength
 */
export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  if (!password) {
    return {
      valid: false,
      error: 'Password is required',
    };
  }

  if (password.length < 8) {
    return {
      valid: false,
      error: 'Password must be at least 8 characters long',
    };
  }

  if (password.length > 128) {
    return {
      valid: false,
      error: 'Password must be less than 128 characters',
    };
  }

  // Check for at least one letter and one number
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      valid: false,
      error: 'Password must contain at least one letter and one number',
    };
  }

  return {
    valid: true,
  };
}

