/**
 * Payout Decryption Utilities
 * 
 * ⚠️ SECURITY WARNING: Only use these functions in secure server contexts
 * when actually executing payouts. Never expose decrypted data to UI or logs.
 * 
 * This should only be called by:
 * - Payout execution services
 * - Bank transfer processors
 * - Payment gateway integrations
 */

import { decryptPaymentData } from "./paymentEncryption";

/**
 * Get decrypted payment details for payout execution
 * 
 * ⚠️ SECURITY: This decrypts sensitive data. Only call in secure server contexts.
 * Never log the returned values. Never expose to API responses.
 * 
 * @param paymentMethod - Payment method from database
 * @returns Decrypted payment details
 */
export function getDecryptedPaymentDetails(paymentMethod: {
  methodType: string;
  details: any;
}): any {
  const decrypted: any = { ...paymentMethod.details };

  if (paymentMethod.methodType === "BANK") {
    // Decrypt account and routing numbers for bank transfer
    if (paymentMethod.details.accountNumber) {
      try {
        decrypted.accountNumber = decryptPaymentData(paymentMethod.details.accountNumber);
      } catch (error) {
        console.error("[GET_DECRYPTED_PAYMENT_DETAILS] Failed to decrypt account number");
        throw new Error("Failed to decrypt payment method account number");
      }
    }
    if (paymentMethod.details.routingNumber) {
      try {
        decrypted.routingNumber = decryptPaymentData(paymentMethod.details.routingNumber);
      } catch (error) {
        console.error("[GET_DECRYPTED_PAYMENT_DETAILS] Failed to decrypt routing number");
        throw new Error("Failed to decrypt payment method routing number");
      }
    }
  } else {
    // Decrypt handle/email/phone for other payment methods
    if (paymentMethod.details.handle) {
      try {
        decrypted.handle = decryptPaymentData(paymentMethod.details.handle);
      } catch (error) {
        console.error("[GET_DECRYPTED_PAYMENT_DETAILS] Failed to decrypt handle");
        throw new Error("Failed to decrypt payment method handle");
      }
    }
    if (paymentMethod.details.email) {
      try {
        decrypted.email = decryptPaymentData(paymentMethod.details.email);
      } catch (error) {
        // Email might not be encrypted if it was added before encryption
        decrypted.email = paymentMethod.details.email;
      }
    }
    if (paymentMethod.details.phone) {
      try {
        decrypted.phone = decryptPaymentData(paymentMethod.details.phone);
      } catch (error) {
        // Phone might not be encrypted if it was added before encryption
        decrypted.phone = paymentMethod.details.phone;
      }
    }
  }

  return decrypted;
}

/**
 * Safe logging for payment methods
 * Never logs sensitive data
 */
export function logPaymentMethodAction(
  action: string,
  metadata: {
    cleanerId: string;
    methodId: string;
    methodType: string;
    adminId?: string;
  }
) {
  console.log(`[PAYMENT_METHOD_${action.toUpperCase()}]`, {
    cleanerId: metadata.cleanerId,
    methodId: metadata.methodId,
    methodType: metadata.methodType,
    adminId: metadata.adminId,
    timestamp: new Date().toISOString(),
  });
}













