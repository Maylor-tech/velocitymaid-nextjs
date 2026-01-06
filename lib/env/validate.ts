/**
 * Environment variable validation for production readiness
 */

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate required environment variables for SaaS
 */
export function validateSaaSEnv(): EnvValidationResult {
  const required = [
    'DATABASE_URL',
    'STRIPE_SECRET_KEY',
  ];

  const optional = [
    'STRIPE_WEBHOOK_SECRET',
    'NEXTAUTH_URL',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_STRIPE_PRICE_STARTER',
    'NEXT_PUBLIC_STRIPE_PRICE_PRO',
    'NEXT_PUBLIC_STRIPE_PRICE_BUSINESS',
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  // Check required variables
  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // Check optional but recommended variables
  for (const key of optional) {
    if (!process.env[key]) {
      warnings.push(key);
    }
  }

  // Validate Stripe key format if present
  if (process.env.STRIPE_SECRET_KEY) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key.startsWith('sk_')) {
      warnings.push('STRIPE_SECRET_KEY appears to be invalid (should start with sk_)');
    }
  }

  // Validate URLs if present
  if (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
    try {
      new URL(url!);
    } catch {
      warnings.push('NEXTAUTH_URL or NEXT_PUBLIC_APP_URL appears to be invalid');
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Get environment variable with validation
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }

  return value || defaultValue!;
}

