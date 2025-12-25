/**
 * Phase M: Customer Experience Guardrails
 * 
 * Automated confirmations, reminders, and cancellation rules.
 * "Clear cancellation window (locked rules)"
 */

import { prisma } from "../prisma";
import { sendCustomerConfirmation } from "../sendCustomerConfirmation";
import { send24HourReminder } from "../whatsapp";

export interface ConfirmationStatus {
  sent: boolean;
  sentAt: Date | null;
  method: "whatsapp" | "email" | null;
  error?: string;
}

export interface ReminderStatus {
  sent: boolean;
  sentAt: Date | null;
  scheduledFor: Date | null;
  method: "whatsapp" | "email" | null;
  error?: string;
}

/**
 * Send immediate confirmation when job is created
 * Phase M: Confirmation sent immediately
 */
export async function sendJobConfirmation(jobId: string): Promise<ConfirmationStatus> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        customerName: true,
        serviceType: true,
        preferredDate: true,
        preferredTime: true,
        address: true,
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        Branch: {
          select: {
            slug: true,
            currency: true,
          },
        },
      },
    });

    if (!job) {
      return {
        sent: false,
        sentAt: null,
        method: null,
        error: "Job not found",
      };
    }

    // Get customer phone (required for WhatsApp)
    const phone = job.Customer?.phone || null;
    if (!phone) {
      return {
        sent: false,
        sentAt: null,
        method: null,
        error: "Customer phone number not available",
      };
    }

    // Get WhatsApp credentials
    const whatsappToken = process.env.WHATSAPP_TOKEN;
    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!whatsappToken || !whatsappPhoneNumberId) {
      // Fallback to email if WhatsApp not configured
      return {
        sent: false,
        sentAt: null,
        method: null,
        error: "WhatsApp not configured",
      };
    }

    // Format customer name
    const firstName = job.Customer?.firstName || job.customerName?.split(" ")[0] || "Customer";
    const lastName = job.Customer?.lastName || job.customerName?.split(" ").slice(1).join(" ") || "";
    const lastInitial = lastName ? lastName[0] : undefined;

    // Send WhatsApp confirmation
    const result = await sendCustomerConfirmation(
      whatsappPhoneNumberId,
      whatsappToken,
      {
        firstName,
        lastInitial,
        phone,
        serviceType: job.serviceType || "Standard Cleaning",
        preferredDate: job.preferredDate?.toISOString().split("T")[0] || "",
        preferredTime: job.preferredTime || "Morning",
        address: job.address || "",
        currency: job.Branch?.currency || "USD",
        branchSlug: job.Branch?.slug,
      }
    );

    if (result.success) {
      // Mark confirmation as sent in job (could add a field for this)
      console.log(`[PHASE_M] Confirmation sent for job ${jobId}`);
      return {
        sent: true,
        sentAt: new Date(),
        method: "whatsapp",
      };
    } else {
      return {
        sent: false,
        sentAt: null,
        method: null,
        error: result.error || "Failed to send confirmation",
      };
    }
  } catch (error: any) {
    console.error(`[PHASE_M] Error sending confirmation for job ${jobId}:`, error);
    return {
      sent: false,
      sentAt: null,
      method: null,
      error: error.message || "Failed to send confirmation",
    };
  }
}

/**
 * Schedule 24-hour reminder
 * Phase M: Reminder at T-24h
 */
export async function schedule24HourReminder(jobId: string): Promise<ReminderStatus> {
  try {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        customerName: true,
        serviceType: true,
        preferredDate: true,
        preferredTime: true,
        address: true,
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!job || !job.preferredDate) {
      return {
        sent: false,
        sentAt: null,
        scheduledFor: null,
        method: null,
        error: "Job not found or no preferred date",
      };
    }

    // Calculate 24 hours before job
    const jobDate = new Date(job.preferredDate);
    const reminderTime = new Date(jobDate);
    reminderTime.setHours(reminderTime.getHours() - 24);

    // Check if reminder time has passed
    const now = new Date();
    if (reminderTime < now) {
      return {
        sent: false,
        sentAt: null,
        scheduledFor: reminderTime,
        method: null,
        error: "Reminder time has passed",
      };
    }

    // The reminder will be sent by the cron job
    // This function just validates and schedules
    return {
      sent: false,
      sentAt: null,
      scheduledFor: reminderTime,
      method: "whatsapp",
    };
  } catch (error: any) {
    return {
      sent: false,
      sentAt: null,
      scheduledFor: null,
      method: null,
      error: error.message || "Failed to schedule reminder",
    };
  }
}

/**
 * Get cancellation window information
 * Phase M: Clear cancellation window (locked rules)
 * Uses Phase L refund rules
 */
export async function getCancellationWindow(jobId: string): Promise<{
  jobDate: Date | null;
  hoursUntilJob: number | null;
  cancellationWindow: "24h" | "48h" | "none";
  feePercentage: number;
  feeAmount: number | null;
  message: string;
}> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      preferredDate: true,
      totalPrice: true,
      basePrice: true,
    },
  });

  if (!job || !job.preferredDate) {
    return {
      jobDate: null,
      hoursUntilJob: null,
      cancellationWindow: "none",
      feePercentage: 0,
      feeAmount: null,
      message: "Job date not set",
    };
  }

  const { calculateCancellationFee } = await import("@/lib/pricing/refund");
  const feeCalc = calculateCancellationFee(job.preferredDate);

  const basePrice = Number(job.basePrice || job.totalPrice || 0);
  const feeAmount = (basePrice * feeCalc.feePercentage) / 100;

  let message = "";
  if (feeCalc.window === "24h") {
    message = "Cancelling less than 24 hours before service: 50% fee applies";
  } else if (feeCalc.window === "48h") {
    message = "Cancelling 24-48 hours before service: 25% fee applies";
  } else {
    message = "Cancelling more than 48 hours before service: No fee";
  }

  return {
    jobDate: job.preferredDate,
    hoursUntilJob: feeCalc.hoursUntilJob,
    cancellationWindow: feeCalc.window,
    feePercentage: feeCalc.feePercentage,
    feeAmount: feeAmount > 0 ? feeAmount : null,
    message,
  };
}

/**
 * Verify Branch Owner permissions for customer experience actions
 * Phase M: Branch Owner can reassign, cancel, flag - but NOT discount, refund, or change price
 */
export function canBranchOwnerPerformAction(
  action: "reassign" | "cancel" | "flag" | "discount" | "refund" | "changePrice"
): boolean {
  const allowedActions = ["reassign", "cancel", "flag"];
  return allowedActions.includes(action);
}











