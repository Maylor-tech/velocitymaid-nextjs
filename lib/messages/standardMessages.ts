/**
 * Standard Message Scripts for Miami Pilot
 * 
 * These messages are locked - use exact wording only.
 * No variations. No personalization. Consistency = trust.
 */

export const CLEANER_MESSAGES = {
  /**
   * Sent immediately after cleaner marks job as complete
   */
  JOB_COMPLETED: "Thanks for completing your job. Payouts are processed weekly. Check your dashboard for status.",

  /**
   * Sent after live payout is processed
   */
  PAYOUT_PROCESSING: "Payouts for last week are being processed today. Status will update in-app once complete. Thank you for your professionalism.",

  /**
   * Sent when payout is held due to missing payment method
   */
  PAYOUT_HELD_MISSING_PAYMENT: "Your payout is ready. Please add and verify your payment method to release it.",
} as const;

export const CUSTOMER_MESSAGES = {
  /**
   * Sent immediately after booking is confirmed
   */
  BOOKING_CONFIRMED: (date: string, time: string) => 
    `Your cleaning service is confirmed for ${date} at ${time}. We'll send a reminder 24 hours before. Thank you for choosing VelocityMaid.`,

  /**
   * Sent 24 hours before scheduled service
   */
  REMINDER_24H: (time: string) => 
    `Reminder: Your cleaning service is tomorrow at ${time}. If you need to reschedule or cancel, please contact us at least 24 hours in advance.`,
} as const;

/**
 * Get message by key (type-safe)
 */
export function getCleanerMessage(key: keyof typeof CLEANER_MESSAGES): string {
  return CLEANER_MESSAGES[key];
}

/**
 * Get customer message by key (type-safe)
 */
export function getCustomerMessage(
  key: keyof typeof CUSTOMER_MESSAGES,
  ...args: any[]
): string {
  const message = CUSTOMER_MESSAGES[key];
  if (typeof message === 'function') {
    return message(...args);
  }
  return message;
}









