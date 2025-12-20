/**
 * Notification Helper
 * 
 * Creates and manages notifications for cleaners
 * Used for payout receipts and other important events
 */

import { prisma } from "@/lib/prisma";

export type NotificationType =
  | "PAYOUT_SENT"
  | "PAYOUT_PAID"
  | "PAYOUT_FAILED"
  | "PAYOUT_APPROVED"
  | "PAYOUT_REJECTED";

export interface NotificationMetadata {
  payoutId?: string;
  jobId?: string;
  amount?: number;
  currency?: string;
  reason?: string;
  [key: string]: any;
}

/**
 * Create a notification for a cleaner
 */
export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  metadata?: NotificationMetadata
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        metadata: metadata || {},
        read: false,
      },
    });

    return {
      success: true,
      notificationId: notification.id,
    };
  } catch (error: any) {
    console.error("[CREATE_NOTIFICATION] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to create notification",
    };
  }
}

/**
 * Create payout sent notification
 */
export async function notifyPayoutSent(
  cleanerId: string,
  payoutId: string,
  amount: number,
  currency: string,
  executionMethod?: string
): Promise<void> {
  await createNotification(
    cleanerId,
    "PAYOUT_SENT",
    "Payout Sent",
    `Your payout of ${currency} ${amount.toFixed(2)} has been sent via ${executionMethod || "payment method"}.`,
    {
      payoutId,
      amount,
      currency,
      executionMethod,
    }
  );
}

/**
 * Create payout paid notification (with receipt link)
 */
export async function notifyPayoutPaid(
  cleanerId: string,
  payoutId: string,
  amount: number,
  currency: string
): Promise<void> {
  await createNotification(
    cleanerId,
    "PAYOUT_PAID",
    "Payout Confirmed Paid",
    `Your payout of ${currency} ${amount.toFixed(2)} has been confirmed as paid. View receipt for details.`,
    {
      payoutId,
      amount,
      currency,
    }
  );
}

/**
 * Create payout failed notification
 */
export async function notifyPayoutFailed(
  cleanerId: string,
  payoutId: string,
  amount: number,
  currency: string,
  reason?: string
): Promise<void> {
  await createNotification(
    cleanerId,
    "PAYOUT_FAILED",
    "Payout Failed",
    `Your payout of ${currency} ${amount.toFixed(2)} failed. ${reason ? `Reason: ${reason}` : "Please contact support."}`,
    {
      payoutId,
      amount,
      currency,
      reason,
    }
  );
}

/**
 * Mark notification as read
 */
export async function markNotificationRead(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure user owns the notification
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  } catch (error: any) {
    console.error("[MARK_NOTIFICATION_READ] Error:", error);
    return {
      success: false,
      error: error.message || "Failed to mark notification as read",
    };
  }
}

/**
 * Get unread notifications for a user
 */
export async function getUnreadNotifications(
  userId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        read: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return notifications;
  } catch (error: any) {
    console.error("[GET_UNREAD_NOTIFICATIONS] Error:", error);
    return [];
  }
}






