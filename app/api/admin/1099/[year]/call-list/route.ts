/**
 * Phase 3H.8: "Who should I call today?" Auto-List API
 * 
 * GET /api/admin/1099/[year]/call-list
 * 
 * Returns prioritized list of cleaners who:
 * - Meet 1099 threshold
 * - Have blocking issues
 * 
 * Priority score based on:
 * - W-9 not VERIFIED (high weight)
 * - Address incomplete
 * - Days remaining to Jan 31
 * - W-9 NOT_STARTED escalation
 * - De-prioritize if recently reminded
 * 
 * Returns top N (5-10 based on date)
 * No sensitive data exposure
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { PayoutTransferStatus, TaxProfileStatus } from "@prisma/client";

/**
 * Get 1099 threshold for a given year
 */
function get1099Threshold(year: number): number {
  // 2025: $600.01 threshold (600100 cents)
  // 2026+: $2000.01 threshold (2000100 cents)
  return year === 2025 ? 600100 : 2000100; // Amounts in cents
}

/**
 * Calculate days remaining until Jan 31 end-of-day
 */
function getDaysRemainingToJan31(year: number): number {
  const now = new Date();
  const jan31End = new Date(year, 0, 31, 23, 59, 59, 999);
  return Math.max(0, Math.ceil((jan31End.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Calculate priority score for a cleaner
 * Higher score = higher priority
 */
function calculatePriorityScore(data: {
  w9Status: TaxProfileStatus | null;
  addressComplete: boolean;
  daysRemaining: number;
  lastReminderSentAt: Date | null;
  reminderCount: number;
}): number {
  let score = 0;

  // W-9 not VERIFIED (high weight)
  if (!data.w9Status || data.w9Status === TaxProfileStatus.DRAFT) {
    // NOT_STARTED or DRAFT = highest priority
    score += 100;
  } else if (data.w9Status === TaxProfileStatus.SUBMITTED) {
    // SUBMITTED but not VERIFIED = high priority
    score += 80;
  } else if (data.w9Status === TaxProfileStatus.REJECTED) {
    // REJECTED = very high priority
    score += 90;
  }
  // VERIFIED = 0 (no priority boost)

  // Address incomplete
  if (!data.addressComplete) {
    score += 30;
  }

  // Days remaining urgency (more urgent = higher score)
  // Inverse: fewer days = higher score
  if (data.daysRemaining <= 7) {
    score += 50; // Critical phase
  } else if (data.daysRemaining <= 14) {
    score += 30; // Warning phase
  } else if (data.daysRemaining <= 21) {
    score += 15; // Approaching deadline
  }
  // >21 days = 0 (no urgency boost)

  // De-prioritize if recently reminded (within last 3 days)
  if (data.lastReminderSentAt) {
    const daysSinceReminder = Math.floor(
      (new Date().getTime() - data.lastReminderSentAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceReminder < 3) {
      score -= 20; // Recently reminded, lower priority
    }
  }

  // De-prioritize if many reminders sent (may be unresponsive)
  if (data.reminderCount >= 3) {
    score -= 10; // Multiple reminders, may need different approach
  }

  return Math.max(0, score); // Ensure non-negative
}

export interface CallListResponse {
  success: true;
  year: number;
  daysRemaining: number;
  archived?: boolean;
  cleaners: Array<{
    cleanerId: string;
    cleanerName: string | null;
    cleanerEmail: string;
    cleanerPhone: string | null;
    priorityScore: number;
    issues: string[];
    w9Status: TaxProfileStatus | null;
    addressComplete: boolean;
    lastReminderSentAt: Date | null;
    reminderCount: number;
  }>;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { year: string } }
) {
  try {
    // Require admin role and get admin context
    const authContext = await requireRole(request, "ADMIN");
    const adminName = authContext.email?.split("@")[0] || "Admin";

    const year = parseInt(params.year, 10);
    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json(
        { success: false, error: "Invalid year" },
        { status: 400 }
      );
    }

    // Phase 3H.11: Check if year is archived - return empty list
    const archive = await prisma.taxYearArchive.findUnique({
      where: { year },
    });

    if (archive) {
      return NextResponse.json({
        success: true,
        year,
        daysRemaining: 0,
        cleaners: [],
        archived: true,
      } as CallListResponse);
    }

    const thresholdCents = get1099Threshold(year);
    const daysRemaining = getDaysRemainingToJan31(year);

    // Calculate date range for current year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    // Get all PAID transfers for the year
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
            phone: true,
          },
        },
      },
    });

    // Group by cleaner and sum amounts
    const cleanerTotals = new Map<
      string,
      {
        cleanerId: string;
        cleanerName: string | null;
        cleanerEmail: string;
        cleanerPhone: string | null;
        totalAmountCents: number;
      }
    >();

    for (const transfer of transfers) {
      const existing = cleanerTotals.get(transfer.cleanerId);
      if (existing) {
        existing.totalAmountCents += transfer.amountCents;
      } else {
        cleanerTotals.set(transfer.cleanerId, {
          cleanerId: transfer.cleanerId,
          cleanerName: transfer.cleaner.name,
          cleanerEmail: transfer.cleaner.email,
          cleanerPhone: transfer.cleaner.phone,
          totalAmountCents: transfer.amountCents,
        });
      }
    }

    // Filter cleaners who meet threshold
    const eligibleCleanerIds = Array.from(cleanerTotals.values())
      .filter((cleaner) => cleaner.totalAmountCents >= thresholdCents)
      .map((cleaner) => cleaner.cleanerId);

    if (eligibleCleanerIds.length === 0) {
      return NextResponse.json({
        success: true,
        year,
        daysRemaining,
        cleaners: [],
      } as CallListResponse);
    }

    // Fetch tax profiles for eligible cleaners
    const taxProfiles = await prisma.cleanerTaxProfile.findMany({
      where: {
        cleanerId: { in: eligibleCleanerIds },
      },
      select: {
        cleanerId: true,
        status: true,
        addressLine1: true,
        city: true,
        state: true,
        zipCode: true,
        lastReminderSentAt: true,
        reminderCount: true,
      },
    });

    const taxProfileMap = new Map(
      taxProfiles.map((profile) => [profile.cleanerId, profile])
    );

    // Build call list with priority scores
    const callList = Array.from(cleanerTotals.values())
      .filter((cleaner) => cleaner.totalAmountCents >= thresholdCents)
      .map((cleaner) => {
        const taxProfile = taxProfileMap.get(cleaner.cleanerId);

        const w9Status = taxProfile?.status || null;
        const addressComplete =
          !!taxProfile?.addressLine1 &&
          !!taxProfile?.city &&
          !!taxProfile?.state &&
          !!taxProfile?.zipCode;

        // Only include cleaners with blocking issues
        const hasBlockingIssues =
          !w9Status ||
          w9Status === TaxProfileStatus.DRAFT ||
          w9Status === TaxProfileStatus.SUBMITTED ||
          w9Status === TaxProfileStatus.REJECTED ||
          !addressComplete;

        if (!hasBlockingIssues) {
          return null; // Skip cleaners without blocking issues
        }

        // Build issues list
        const issues: string[] = [];
        if (!w9Status || w9Status === TaxProfileStatus.DRAFT) {
          issues.push("W-9 Not Started");
        } else if (w9Status === TaxProfileStatus.SUBMITTED) {
          issues.push("W-9 Pending Verification");
        } else if (w9Status === TaxProfileStatus.REJECTED) {
          issues.push("W-9 Rejected");
        }
        if (!addressComplete) {
          issues.push("Address Incomplete");
        }

        const priorityScore = calculatePriorityScore({
          w9Status,
          addressComplete,
          daysRemaining,
          lastReminderSentAt: taxProfile?.lastReminderSentAt || null,
          reminderCount: taxProfile?.reminderCount || 0,
        });

        // Phase 3H.9: Auto-select call script
        const callScript = selectCallScript({
          cleanerName: cleaner.cleanerName,
          adminName,
          w9Status,
          addressComplete,
          issues,
        });

        const voicemailScript = getVoicemailScriptForCleaner(
          cleaner.cleanerName,
          adminName
        );

        return {
          cleanerId: cleaner.cleanerId,
          cleanerName: cleaner.cleanerName,
          cleanerEmail: cleaner.cleanerEmail,
          cleanerPhone: cleaner.cleanerPhone,
          priorityScore,
          issues,
          w9Status,
          addressComplete,
          lastReminderSentAt: taxProfile?.lastReminderSentAt || null,
          reminderCount: taxProfile?.reminderCount || 0,
          callScript: {
            type: callScript.type,
            title: callScript.title,
            script: callScript.script,
            followUps: callScript.followUps,
          },
          voicemailScript: {
            type: voicemailScript.type,
            title: voicemailScript.title,
            script: voicemailScript.script,
          },
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .sort((a, b) => b.priorityScore - a.priorityScore); // Sort by priority descending

    // Determine top N based on date (5-10 cleaners)
    // More urgent = more cleaners to call
    let topN: number;
    if (daysRemaining <= 7) {
      topN = 10; // Critical phase: call more cleaners
    } else if (daysRemaining <= 14) {
      topN = 8; // Warning phase: call moderate number
    } else {
      topN = 5; // Normal phase: call fewer cleaners
    }

    const topCleaners = callList.slice(0, topN);

    return NextResponse.json({
      success: true,
      year,
      daysRemaining,
      cleaners: topCleaners,
    } as CallListResponse);
  } catch (error: any) {
    if (error instanceof NextResponse) return error;
    console.error("[ADMIN_1099_CALL_LIST] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch call list",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

