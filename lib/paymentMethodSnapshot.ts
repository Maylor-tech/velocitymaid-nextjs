/**
 * Payment Method Snapshot Utilities
 * 
 * Creates masked snapshots of payment methods for payout records.
 * These snapshots are stored in JobPayout for audit purposes.
 * 
 * ⚠️ SECURITY: Never decrypt here. Only use masked values.
 */

import { maskAccount, maskRouting, maskHandle } from "./paymentMasking";

/**
 * Build a masked payment method snapshot for payout records
 * This is stored in JobPayout.paymentMethodSnapshot for audit trail
 * 
 * @param paymentMethod - Payment method from database (details may be encrypted)
 * @returns Masked snapshot object safe to store
 */
export function buildPaymentMethodSnapshot(paymentMethod: {
  id: string;
  methodType: string;
  details: any;
}): any {
  const snapshot: any = {
    methodId: paymentMethod.id,
    methodType: paymentMethod.methodType,
    capturedAt: new Date().toISOString(),
  };

  const details = paymentMethod.details || {};

  if (paymentMethod.methodType === "BANK") {
    // Bank transfer snapshot
    snapshot.bankName = details.bankName || "";
    snapshot.accountNumber = maskAccount(details.accountNumber);
    snapshot.routingNumber = maskRouting(details.routingNumber);
  } else {
    // Other payment methods
    snapshot.handle = maskHandle(details.handle);
    snapshot.email = maskHandle(details.email);
    snapshot.phone = maskHandle(details.phone);
  }

  return snapshot;
}






