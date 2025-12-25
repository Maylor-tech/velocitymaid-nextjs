/**
 * Payment Method Validation & Constants
 */

import { prisma } from "./prisma";

export const PAYMENT_METHODS = ["BANK", "ZELLE", "VENMO", "CASH", "CASH_APP", "PAYPAL"] as const;

export type PaymentMethodType = typeof PAYMENT_METHODS[number];

/**
 * Validate payment method type
 */
export function isValidPaymentMethod(method: string): method is PaymentMethodType {
  return PAYMENT_METHODS.includes(method as PaymentMethodType);
}

/**
 * Validate payment method data structure
 */
export function validatePaymentMethodData(
  methodType: string,
  details: any
): { valid: boolean; error?: string } {
  if (!isValidPaymentMethod(methodType)) {
    return {
      valid: false,
      error: `Invalid methodType. Must be one of: ${PAYMENT_METHODS.join(", ")}`,
    };
  }

  if (!details || typeof details !== "object") {
    return {
      valid: false,
      error: "details must be a valid object",
    };
  }

  // Basic validation for each method type
  switch (methodType) {
    case "ZELLE":
      if (!details.email && !details.phone && !details.handle) {
        return {
          valid: false,
          error: "ZELLE requires email, phone, or handle in details",
        };
      }
      break;
    case "VENMO":
      if (!details.username && !details.phone && !details.handle) {
        return {
          valid: false,
          error: "VENMO requires username, phone, or handle in details",
        };
      }
      break;
    case "BANK":
      if (!details.accountNumber || !details.routingNumber) {
        return {
          valid: false,
          error: "BANK requires accountNumber and routingNumber in details",
        };
      }
      break;
    case "CASH":
      // Cash doesn't require specific details
      break;
    case "CASH_APP":
      if (!details.handle) {
        return {
          valid: false,
          error: "CASH_APP requires handle in details",
        };
      }
      break;
    case "PAYPAL":
      if (!details.email && !details.handle) {
        return {
          valid: false,
          error: "PAYPAL requires email or handle in details",
        };
      }
      break;
  }

  return { valid: true };
}

/**
 * Check if a cleaner has a verified payment method
 * This should be used by the payout engine to gate payouts
 */
export async function hasVerifiedPaymentMethod(cleanerId: string): Promise<boolean> {
  const method = await prisma.cleanerPaymentMethod.findFirst({
    where: {
      cleanerId,
      isActive: true,
      verifiedAt: { not: null },
    },
  });

  return !!method;
}

/**
 * Get verified payment method for a cleaner
 * Returns null if no verified method exists
 */
export async function getVerifiedPaymentMethod(cleanerId: string) {
  return await prisma.cleanerPaymentMethod.findFirst({
    where: {
      cleanerId,
      isActive: true,
      verifiedAt: { not: null },
    },
    orderBy: {
      verifiedAt: "desc",
    },
  });
}
