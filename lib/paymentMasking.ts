/**
 * Payment Data Masking Utilities
 * 
 * These functions mask sensitive payment information for display.
 * Full values should NEVER be exposed in UI or API responses.
 */

/**
 * Mask account number - show last 4 digits only
 * Handles both encrypted and plaintext values
 */
export function maskAccount(account?: string): string {
  if (!account) return "";
  const clean = String(account).trim();
  
  // If encrypted (has format iv.tag.encrypted), show generic mask
  if (clean.includes(".") && clean.split(".").length === 3) {
    return "********";
  }
  
  if (clean.length <= 4) return "*".repeat(clean.length);
  return "*".repeat(clean.length - 4) + clean.slice(-4);
}

/**
 * Mask routing number - show last 3 digits only
 * Handles both encrypted and plaintext values
 */
export function maskRouting(routing?: string): string {
  if (!routing) return "";
  const clean = String(routing).trim();
  
  // If encrypted (has format iv.tag.encrypted), show generic mask
  if (clean.includes(".") && clean.split(".").length === 3) {
    return "******";
  }
  
  if (clean.length <= 3) return "*".repeat(clean.length);
  return "*".repeat(clean.length - 3) + clean.slice(-3);
}

/**
 * Mask email/phone/handle - show last 4 characters
 */
export function maskHandle(handle?: string): string {
  if (!handle) return "";
  const clean = String(handle).trim();
  if (clean.length <= 4) return "*".repeat(clean.length);
  return "*".repeat(clean.length - 4) + clean.slice(-4);
}

/**
 * Mask payment method details for safe API response
 * Returns a sanitized version with encrypted/masked sensitive fields
 */
export function maskPaymentDetails(details: any, methodType: string): any {
  if (!details || typeof details !== "object") {
    return details;
  }

  const masked: any = { ...details };

  // Always safe to show
  if (details.bankName) {
    masked.bankName = details.bankName;
  }

  // Mask sensitive fields based on method type
  if (methodType === "BANK") {
    // Account and routing numbers should be encrypted, but mask for display
    if (details.accountNumber) {
      masked.accountNumber = maskAccount(details.accountNumber);
    }
    if (details.routingNumber) {
      masked.routingNumber = maskRouting(details.routingNumber);
    }
  } else {
    // For other methods, mask handle/email/phone
    if (details.handle) {
      masked.handle = maskHandle(details.handle);
    }
    if (details.email) {
      masked.email = maskHandle(details.email);
    }
    if (details.phone) {
      masked.phone = maskHandle(details.phone);
    }
  }

  return masked;
}

