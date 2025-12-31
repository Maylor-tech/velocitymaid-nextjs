/**
 * W-9 Tax Onboarding: TIN Encryption
 * 
 * Field-level encryption for Tax Identification Numbers (TIN)
 * Uses AES-256-GCM (same as payment encryption)
 * 
 * ⚠️ SECURITY: Never log or expose full TIN values
 */

import crypto from "crypto";
import { encryptPaymentData, decryptPaymentData } from "../paymentEncryption";

/**
 * Encrypt TIN value
 * 
 * @param tin - Plaintext TIN (SSN or EIN)
 * @returns Encrypted TIN payload
 */
export function encryptTIN(tin: string): string {
  if (!tin) return "";
  
  // Remove any formatting (dashes, spaces)
  const cleaned = tin.replace(/[-\s]/g, "");
  
  // Validate format (SSN: 9 digits, EIN: 9 digits)
  if (!/^\d{9}$/.test(cleaned)) {
    throw new Error("Invalid TIN format. Must be 9 digits.");
  }
  
  return encryptPaymentData(cleaned);
}

/**
 * Decrypt TIN value
 * ⚠️ SECURITY: Only call in secure admin contexts for verification
 * 
 * @param encryptedTIN - Encrypted TIN payload
 * @returns Decrypted TIN (plaintext)
 */
export function decryptTIN(encryptedTIN: string): string {
  if (!encryptedTIN) return "";
  return decryptPaymentData(encryptedTIN);
}

/**
 * Extract last 4 digits from TIN (for display)
 * 
 * @param tin - Plaintext TIN (before encryption)
 * @returns Last 4 digits (e.g., "1234")
 */
export function getTINLast4(tin: string): string {
  if (!tin) return "";
  const cleaned = tin.replace(/[-\s]/g, "");
  if (cleaned.length < 4) return "";
  return cleaned.slice(-4);
}

/**
 * Mask TIN for display (e.g., "***-**-1234")
 * 
 * @param last4 - Last 4 digits
 * @param isSSN - Whether it's an SSN (format with dashes) or EIN
 * @returns Masked TIN string
 */
export function maskTIN(last4: string, isSSN: boolean = true): string {
  if (!last4 || last4.length !== 4) return "***-**-****";
  
  if (isSSN) {
    return `***-**-${last4}`;
  } else {
    return `**-****${last4}`;
  }
}

/**
 * Validate TIN format
 * 
 * @param tin - TIN to validate
 * @param tinType - SSN or EIN
 * @returns true if valid
 */
export function validateTIN(tin: string, tinType: "SSN" | "EIN"): boolean {
  if (!tin) return false;
  
  const cleaned = tin.replace(/[-\s]/g, "");
  
  // Both SSN and EIN are 9 digits
  if (!/^\d{9}$/.test(cleaned)) {
    return false;
  }
  
  // Additional SSN validation (cannot start with 000, 666, or 900-999)
  if (tinType === "SSN") {
    const firstThree = cleaned.substring(0, 3);
    if (firstThree === "000" || firstThree === "666" || parseInt(firstThree) >= 900) {
      return false;
    }
    
    // Cannot be 00 in positions 4-5
    const middleTwo = cleaned.substring(3, 5);
    if (middleTwo === "00") {
      return false;
    }
    
    // Cannot be 0000 in positions 6-9
    const lastFour = cleaned.substring(5);
    if (lastFour === "0000") {
      return false;
    }
  }
  
  return true;
}


