/**
 * Phase 3H.3: W-9 Reminder Email Cron Job
 * 
 * POST /api/cron/w9-reminders
 * 
 * Weekly cron job to send reminder emails to cleaners who:
 * - Meet 1099 threshold (earnings >= $600.01 for 2025, >= $2,000.01 for 2026+)
 * - W-9 status ≠ VERIFIED
 * 
 * Rate limits:
 * - Max 3 reminders per cleaner
 * - ≥7 days apart
 * 
 * Stops immediately once VERIFIED
 * 
 * Security: Protected by CRON_SECRET header
 * Schedule: Configured in vercel.json (weekly)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PayoutTransferStatus, TaxProfileStatus } from "@prisma/client";
import {
  getW9ReminderEmailSubject,
  getW9ReminderEmailHTML,
  getW9ReminderEmailText,
} from "@/lib/tax/w9ReminderEmail";

/**
 * Get 1099 threshold for current year
 */
function get1099Threshold(year: number): number {
  // 2025: $600.01 threshold (600100 cents)
  // 2026+: $2000.01 threshold (2000100 cents)
  return year === 2025 ? 600100 : 2000100; // Amounts in cents
}

/**
 * Check if enough time has passed since last reminder (≥7 days)
 */
function canSendReminder(lastReminderSentAt: Date | null): boolean {
  if (!lastReminderSentAt) {
    return true; // Never sent, can send
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return lastReminderSentAt <= sevenDaysAgo;
}

export async function POST(req: NextRequest) {
  try {
    // Security: Verify cron secret
    const secret = req.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[CRON_W9_REMINDERS] CRON_SECRET not configured");
      return NextResponse.json(
        { error: "Cron secret not configured" },
        { status: 500 }
      );
    }

    if (secret !== cronSecret) {
      console.warn("[CRON_W9_REMINDERS] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Optional: Dry-run mode
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry") === "true";

    if (dryRun) {
      console.log("[CRON_W9_REMINDERS] DRY RUN MODE - No emails will be sent");
    }

    const now = new Date();
    const currentYear = now.getFullYear();

    // Phase 3H.11: Skip reminders for archived years
    const previousYear = currentYear - 1;
    const previousYearArchived = await prisma.taxYearArchive.findUnique({
      where: { year: previousYear },
    });

    if (previousYearArchived) {
      console.log(
        `[CRON_W9_REMINDERS] Skipping - previous year ${previousYear} is archived`
      );
      return NextResponse.json({
        success: true,
        message: "Previous year archived, skipping reminders",
        skipped: true,
      });
    }
    const thresholdCents = get1099Threshold(currentYear);

    // Calculate date range for current year
    const yearStart = new Date(currentYear, 0, 1); // January 1
    const yearEnd = new Date(currentYear, 11, 31, 23, 59, 59, 999); // December 31

    console.log(
      `[CRON_W9_REMINDERS] Processing reminders for ${currentYear} (threshold: $${thresholdCents / 100})`
    );

    // 1️⃣ Get all PAID transfers for current year
    const transfers = await prisma.payoutTransfer.findMany({
      where: {
        status: PayoutTransferStatus.PAID,
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      include: {
        cleaner: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
          },
        },
      },
    });

    // 2️⃣ Group by cleaner and sum amounts
    const cleanerTotals = new Map<
      string,
      {
        cleanerId: string;
        cleanerName: string | null;
        cleanerEmail: string;
        totalAmountCents: number;
      }
    >();

    for (const transfer of transfers) {
      // Only process active cleaners
      if (!transfer.cleaner.isActive) {
        continue;
      }

      const existing = cleanerTotals.get(transfer.cleanerId);
      if (existing) {
        existing.totalAmountCents += transfer.amountCents;
      } else {
        cleanerTotals.set(transfer.cleanerId, {
          cleanerId: transfer.cleanerId,
          cleanerName: transfer.cleaner.name,
          cleanerEmail: transfer.cleaner.email,
          totalAmountCents: transfer.amountCents,
        });
      }
    }

    // 3️⃣ Filter cleaners who meet threshold
    const eligibleCleanerIds = Array.from(cleanerTotals.values())
      .filter((cleaner) => cleaner.totalAmountCents >= thresholdCents)
      .map((cleaner) => cleaner.cleanerId);

    if (eligibleCleanerIds.length === 0) {
      console.log("[CRON_W9_REMINDERS] No cleaners meet the threshold");
      return NextResponse.json({
        success: true,
        message: "No cleaners meet the threshold",
        remindersSent: 0,
      });
    }

    // 4️⃣ Fetch tax profiles for eligible cleaners
    const taxProfiles = await prisma.cleanerTaxProfile.findMany({
      where: {
        cleanerId: { in: eligibleCleanerIds },
        status: {
          not: TaxProfileStatus.VERIFIED, // Only non-verified profiles
        },
      },
      select: {
        id: true, // Need id for update
        cleanerId: true,
        status: true,
        lastReminderSentAt: true,
        reminderCount: true,
      },
    });

    // 5️⃣ Identify cleaners who need reminders
    const cleanersNeedingReminders = taxProfiles.filter((profile) => {
      // Rate limit: max 3 reminders
      if (profile.reminderCount >= 3) {
        return false;
      }

      // Rate limit: ≥7 days apart
      if (!canSendReminder(profile.lastReminderSentAt)) {
        return false;
      }

      return true;
    });

    if (cleanersNeedingReminders.length === 0) {
      console.log(
        "[CRON_W9_REMINDERS] No cleaners need reminders (all rate-limited or verified)"
      );
      return NextResponse.json({
        success: true,
        message: "No cleaners need reminders",
        remindersSent: 0,
      });
    }

    // 6️⃣ Send reminder emails
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const taxFormUrl = `${baseUrl}/cleaner/tax-form`;

    let remindersSent = 0;
    let remindersFailed = 0;

    // Check if Resend is configured
    if (!process.env.RESEND_API_KEY && !dryRun) {
      console.error("[CRON_W9_REMINDERS] RESEND_API_KEY not configured");
      return NextResponse.json(
        {
          success: false,
          error: "Email service not configured",
        },
        { status: 500 }
      );
    }

    for (const profile of cleanersNeedingReminders) {
      const cleaner = cleanerTotals.get(profile.cleanerId);
      if (!cleaner || !cleaner.cleanerEmail) {
        console.warn(
          `[CRON_W9_REMINDERS] Skipping cleaner ${profile.cleanerId} - no email`
        );
        continue;
      }

      const reminderNumber = profile.reminderCount + 1;

      if (dryRun) {
        console.log(
          `[CRON_W9_REMINDERS] DRY RUN: Would send reminder #${reminderNumber} to ${cleaner.cleanerEmail}`
        );
        remindersSent++;
        continue;
      }

      try {
        // Send email
        const { Resend } = await import("resend");
        const { getResendFromEmail } = await import("@/lib/email/resendClient");
        const resend = new Resend(process.env.RESEND_API_KEY!);

        const subject = getW9ReminderEmailSubject(reminderNumber);
        const html = getW9ReminderEmailHTML({
          cleanerName: cleaner.cleanerName || "Cleaner",
          reminderNumber,
          taxFormUrl,
        });
        const text = getW9ReminderEmailText({
          cleanerName: cleaner.cleanerName || "Cleaner",
          reminderNumber,
          taxFormUrl,
        });

        await resend.emails.send({
          from: getResendFromEmail(),
          to: cleaner.cleanerEmail,
          subject,
          html,
          text,
        });

        // Update tax profile with reminder tracking
        await prisma.cleanerTaxProfile.update({
          where: { id: profile.id },
          data: {
            lastReminderSentAt: new Date(),
            reminderCount: reminderNumber,
          },
        });

        console.log(
          `[CRON_W9_REMINDERS] Sent reminder #${reminderNumber} to ${cleaner.cleanerEmail} (cleaner ${profile.cleanerId})`
        );
        remindersSent++;
      } catch (error: any) {
        console.error(
          `[CRON_W9_REMINDERS] Failed to send reminder to ${cleaner.cleanerEmail}:`,
          error
        );
        remindersFailed++;
      }
    }

    // 7️⃣ Return summary
    return NextResponse.json({
      success: true,
      message: "W-9 reminders processed",
      year: currentYear,
      threshold: thresholdCents / 100,
      eligibleCleaners: eligibleCleanerIds.length,
      needingReminders: cleanersNeedingReminders.length,
      remindersSent,
      remindersFailed,
      dryRun,
    });
  } catch (error: any) {
    console.error("[CRON_W9_REMINDERS] Error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process W-9 reminders",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for health checks
 */
export async function GET() {
  return NextResponse.json({
    service: "w9-reminders-cron",
    status: "ok",
    message: "W-9 reminder cron endpoint is active",
  });
}

