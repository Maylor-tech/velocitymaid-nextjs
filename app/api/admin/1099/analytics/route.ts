/**
 * Phase 3H.12: Year-over-Year Compliance Analytics
 * 
 * GET /api/admin/1099/analytics
 * 
 * Aggregates data from TaxYearArchive to show trends across tax years
 * Provides strategic insights for governance and stewardship
 * 
 * Read-only, admin-only, no sensitive data
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { TaxProfileStatus } from "@prisma/client";

/**
 * Generate leadership insights based on year data
 */
function generateInsights(yearData: {
  finalScore: number;
  status: string;
  summary: any;
  blockers?: Array<{ type: string; count: number }>;
}): string[] {
  const insights: string[] = [];

  if (yearData.finalScore >= 90) {
    insights.push("Reached filing readiness with minimal escalation.");
  }

  if (yearData.finalScore >= 80 && yearData.finalScore < 90) {
    insights.push("Approached readiness threshold but required late intervention.");
  }

  if (yearData.finalScore < 70) {
    insights.push("Significant compliance gaps required extensive outreach.");
  }

  const w9NotVerified = yearData.blockers?.find(
    (b) => b.type === "W9_NOT_VERIFIED"
  );
  if (w9NotVerified && w9NotVerified.count > 0) {
    insights.push(
      `Late W-9 submissions (${w9NotVerified.count}) remained the primary blocker.`
    );
  }

  const addressIncomplete = yearData.blockers?.find(
    (b) => b.type === "ADDRESS_INCOMPLETE"
  );
  if (addressIncomplete && addressIncomplete.count > 0) {
    insights.push(
      `Address completeness issues (${addressIncomplete.count}) slowed verification.`
    );
  }

  const verifiedPct =
    yearData.summary?.verifiedW9 && yearData.summary?.eligibleCleaners
      ? Math.round(
          (yearData.summary.verifiedW9 / yearData.summary.eligibleCleaners) *
            100
        )
      : 0;

  if (verifiedPct >= 95) {
    insights.push("Early outreach significantly improved compliance velocity.");
  }

  if (insights.length === 0) {
    insights.push("Compliance metrics within acceptable range.");
  }

  return insights.slice(0, 3); // Max 3 insights per year
}

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, "ADMIN");

    // Get all archived tax years, ordered by year descending
    const archives = await prisma.taxYearArchive.findMany({
      orderBy: { year: "desc" },
    });

    if (archives.length === 0) {
      return NextResponse.json({
        success: true,
        years: [],
        trends: {
          readinessImproving: null,
          avgScoreIncrease: null,
          blockerReduction: {},
        },
        message: "No archived tax years found",
      });
    }

    // Build year data array
    const years = archives.map((archive) => {
      const summary = archive.summaryJson as any;
      const eligibleCleaners = summary?.eligibleCleaners || 0;
      const verifiedW9 = summary?.verifiedW9 || 0;
      const verifiedW9Pct =
        eligibleCleaners > 0
          ? Math.round((verifiedW9 / eligibleCleaners) * 100)
          : 0;

      const blockers = summary?.topBlockers || [];

      return {
        year: archive.year,
        finalScore: archive.readinessScore,
        status: archive.status,
        eligibleCleaners,
        verifiedW9Pct,
        addressCompletePct:
          eligibleCleaners > 0
            ? Math.round(
                ((summary?.addressComplete || 0) / eligibleCleaners) * 100
              )
            : 0,
        archiveDate: archive.archivedAt.toISOString().split("T")[0],
        archivedBy: archive.archivedBy,
        blockers: blockers.map((b: any) => ({
          type: b.type,
          count: b.count,
        })),
        summary,
      };
    });

    // Calculate trends
    const sortedYears = [...years].sort((a, b) => a.year - b.year); // Oldest first

    let readinessImproving: boolean | null = null;
    let avgScoreIncrease: number | null = null;
    const blockerReduction: Record<string, number> = {};

    if (sortedYears.length >= 2) {
      // Compare first and last year
      const firstYear = sortedYears[0];
      const lastYear = sortedYears[sortedYears.length - 1];

      readinessImproving = lastYear.finalScore > firstYear.finalScore;

      // Calculate average score increase per year
      const scoreDiffs: number[] = [];
      for (let i = 1; i < sortedYears.length; i++) {
        scoreDiffs.push(
          sortedYears[i].finalScore - sortedYears[i - 1].finalScore
        );
      }
      avgScoreIncrease =
        scoreDiffs.length > 0
          ? Math.round(
              (scoreDiffs.reduce((sum, diff) => sum + diff, 0) /
                scoreDiffs.length) *
                100
            ) / 100
          : null;

      // Calculate blocker reduction
      const firstYearBlockers = new Map(
        firstYear.blockers.map((b) => [b.type, b.count])
      );
      const lastYearBlockers = new Map(
        lastYear.blockers.map((b) => [b.type, b.count])
      );

      const allBlockerTypes = new Set([
        ...firstYearBlockers.keys(),
        ...lastYearBlockers.keys(),
      ]);

      for (const blockerType of allBlockerTypes) {
        const firstCount = firstYearBlockers.get(blockerType) || 0;
        const lastCount = lastYearBlockers.get(blockerType) || 0;
        blockerReduction[blockerType] = lastCount - firstCount; // Negative = reduction
      }
    }

    // Calculate efficiency metrics (if we have tax profile data)
    // For now, we'll use placeholder logic - can be enhanced with actual timestamps
    const efficiencyMetrics = {
      medianDaysToSubmit: null as number | null,
      medianDaysToVerify: null as number | null,
      avgRemindersPerCleaner: null as number | null,
    };

    // Try to calculate from most recent year's tax profiles
    if (years.length > 0) {
      const mostRecentYear = years[0].year;
      const yearStart = new Date(mostRecentYear, 0, 1);
      const yearEnd = new Date(mostRecentYear, 11, 31, 23, 59, 59, 999);

      // Get tax profiles for cleaners who were eligible
      const taxProfiles = await prisma.cleanerTaxProfile.findMany({
        where: {
          submittedAt: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
        select: {
          submittedAt: true,
          verifiedAt: true,
          reminderCount: true,
        },
      });

      if (taxProfiles.length > 0) {
        // Calculate median days to submit (from first payout to submission)
        // For now, we'll use submittedAt as proxy
        const submittedProfiles = taxProfiles.filter((p) => p.submittedAt);
        if (submittedProfiles.length > 0) {
          const daysToSubmit = submittedProfiles.map((p) => {
            const days = Math.floor(
              (p.submittedAt!.getTime() - yearStart.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return days;
          });
          daysToSubmit.sort((a, b) => a - b);
          const mid = Math.floor(daysToSubmit.length / 2);
          efficiencyMetrics.medianDaysToSubmit =
            daysToSubmit.length % 2 === 0
              ? (daysToSubmit[mid - 1] + daysToSubmit[mid]) / 2
              : daysToSubmit[mid];
        }

        // Calculate median days to verify (from submission to verification)
        const verifiedProfiles = taxProfiles.filter(
          (p) => p.submittedAt && p.verifiedAt
        );
        if (verifiedProfiles.length > 0) {
          const daysToVerify = verifiedProfiles.map((p) => {
            const days = Math.floor(
              (p.verifiedAt!.getTime() - p.submittedAt!.getTime()) /
                (1000 * 60 * 60 * 24)
            );
            return days;
          });
          daysToVerify.sort((a, b) => a - b);
          const mid = Math.floor(daysToVerify.length / 2);
          efficiencyMetrics.medianDaysToVerify =
            daysToVerify.length % 2 === 0
              ? (daysToVerify[mid - 1] + daysToVerify[mid]) / 2
              : daysToVerify[mid];
        }

        // Calculate average reminders per cleaner
        const totalReminders = taxProfiles.reduce(
          (sum, p) => sum + (p.reminderCount || 0),
          0
        );
        efficiencyMetrics.avgRemindersPerCleaner =
          taxProfiles.length > 0
            ? Math.round((totalReminders / taxProfiles.length) * 100) / 100
            : null;
      }
    }

    // Generate insights for each year
    const yearsWithInsights = years.map((year) => ({
      ...year,
      insights: generateInsights({
        finalScore: year.finalScore,
        status: year.status,
        summary: year.summary,
        blockers: year.blockers,
      }),
    }));

    return NextResponse.json({
      success: true,
      years: yearsWithInsights,
      trends: {
        readinessImproving,
        avgScoreIncrease,
        blockerReduction,
      },
      efficiency: efficiencyMetrics,
    });
  } catch (error: any) {
    console.error("[ADMIN_1099_ANALYTICS] Error:", error);

    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch analytics",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


