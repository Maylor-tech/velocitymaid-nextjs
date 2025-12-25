/**
 * Phase M: 24-Hour Job Reminder Worker
 * 
 * Sends reminders 24 hours before job scheduled time.
 * Runs as a cron job or can be triggered manually.
 * 
 * Uses existing 24h reminder infrastructure but enhanced for Phase M.
 */

import { prisma } from "@/lib/prisma";
import { send24HourReminder } from "@/lib/whatsapp";

export interface ReminderJob {
  jobId: string;
  customerName: string;
  phone: string;
  serviceType: string;
  preferredDate: Date;
  preferredTime: string;
  address: string;
}

/**
 * Find jobs that need 24-hour reminders
 * Jobs scheduled 23-25 hours from now
 */
export async function findJobsNeedingReminders(): Promise<ReminderJob[]> {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  // Find jobs scheduled for tomorrow (within 24h window)
  const jobs = await prisma.job.findMany({
    where: {
      preferredDate: {
        gte: tomorrow,
        lt: dayAfter,
      },
      status: {
        in: ["RECEIVED", "CONFIRMED", "ASSIGNED"],
      },
      // TODO: Add reminderSent field to Job model or check metadata
    },
    select: {
      id: true,
      customerName: true,
      serviceType: true,
      preferredDate: true,
      preferredTime: true,
      address: true,
      Customer: {
        select: {
          phone: true,
        },
      },
    },
  });

  const reminderJobs: ReminderJob[] = [];

  for (const job of jobs) {
    if (!job.Customer?.phone) {
      continue; // Skip jobs without phone
    }

    // Check if reminder should be sent (23-25 hours before)
    const jobDateTime = new Date(job.preferredDate);
    if (job.preferredTime) {
      // Parse time and set on date
      const timeMatch = job.preferredTime.match(/(\d+):?(\d*)\s*(AM|PM)/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3].toUpperCase();

        if (period === "PM" && hours !== 12) {
          hours += 12;
        } else if (period === "AM" && hours === 12) {
          hours = 0;
        }

        jobDateTime.setHours(hours, minutes, 0, 0);
      }
    }

    const hoursUntilJob = (jobDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Send reminder if job is 23-25 hours away
    if (hoursUntilJob >= 23 && hoursUntilJob <= 25) {
      reminderJobs.push({
        jobId: job.id,
        customerName: job.customerName || "Customer",
        phone: job.Customer.phone,
        serviceType: job.serviceType || "Standard Cleaning",
        preferredDate: job.preferredDate,
        preferredTime: job.preferredTime || "Morning",
        address: job.address || "",
      });
    }
  }

  return reminderJobs;
}

/**
 * Send 24-hour reminder for a job
 */
export async function sendJobReminder(job: ReminderJob): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const whatsappToken = process.env.WHATSAPP_TOKEN;
  const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!whatsappToken || !whatsappPhoneNumberId) {
    return {
      success: false,
      error: "WhatsApp not configured",
    };
  }

  try {
    const result = await send24HourReminder(
      whatsappPhoneNumberId,
      whatsappToken,
      job.phone,
      job.customerName,
      job.serviceType,
      job.preferredDate.toISOString().split("T")[0],
      job.preferredTime,
      job.address
    );

    if (result.success) {
      // TODO: Mark reminder as sent in job metadata or database
      console.log(`[PHASE_M] 24h reminder sent for job ${job.jobId}`);
      return {
        success: true,
        messageId: result.messageId,
      };
    } else {
      return {
        success: false,
        error: result.error,
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "Failed to send reminder",
    };
  }
}

/**
 * Process all jobs needing reminders
 */
export async function processJobReminders(): Promise<{
  processed: number;
  sent: number;
  failed: number;
  errors: Array<{ jobId: string; error: string }>;
}> {
  const jobs = await findJobsNeedingReminders();
  let sent = 0;
  let failed = 0;
  const errors: Array<{ jobId: string; error: string }> = [];

  for (const job of jobs) {
    const result = await sendJobReminder(job);
    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push({
        jobId: job.jobId,
        error: result.error || "Unknown error",
      });
    }

    // Rate limiting: wait 1 second between messages
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return {
    processed: jobs.length,
    sent,
    failed,
    errors,
  };
}










