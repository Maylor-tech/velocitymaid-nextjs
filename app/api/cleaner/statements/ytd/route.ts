/**
 * Phase 3G: Cleaner Year-to-Date Payout Summary
 * 
 * GET /api/cleaner/statements/ytd
 * 
 * Returns year-to-date payout summary for authenticated cleaner (read-only)
 * 
 * Query params:
 * - year?: number (defaults to current year)
 */

export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { PayoutTransferStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    // Authenticate cleaner and get cleanerId
    const auth = await requireRole(request, "CLEANER");
    const cleanerId = auth.userId;

    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get("year");
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();

    if (isNaN(year) || year < 2020 || year > 2100) {
      return NextResponse.json(
        { success: false, error: "Invalid year parameter" },
        { status: 400 }
      );
    }

    // Calculate date range for the year
    const yearStart = new Date(year, 0, 1); // January 1
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999); // December 31

    // Fetch all PAID transfers for this cleaner in the year
    const transfers = await prisma.payoutTransfer.findMany({
      where: {
        cleanerId, // CRITICAL: Only this cleaner's transfers
        status: PayoutTransferStatus.PAID,
        createdAt: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      include: {
        batch: {
          select: {
            id: true,
            periodStart: true,
            periodEnd: true,
          },
        },
        _count: {
          select: {
            ledgerEntries: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // Calculate aggregates
    const totalAmountCents = transfers.reduce(
      (sum, transfer) => sum + transfer.amountCents,
      0
    );

    const totalTransfers = transfers.length;

    // Group by month for monthly breakdown
    const monthlyBreakdown = transfers.reduce(
      (acc, transfer) => {
        const month = transfer.createdAt.getMonth(); // 0-11
        const monthKey = month.toString();
        
        if (!acc[monthKey]) {
          acc[monthKey] = {
            month,
            monthName: transfer.createdAt.toLocaleDateString("en-US", { month: "long" }),
            transferCount: 0,
            totalAmountCents: 0,
            transfers: [],
          };
        }

        acc[monthKey].transferCount++;
        acc[monthKey].totalAmountCents += transfer.amountCents;
        acc[monthKey].transfers.push({
          id: transfer.id,
          amountCents: transfer.amountCents,
          currency: transfer.currency,
          createdAt: transfer.createdAt.toISOString(),
          periodStart: transfer.batch.periodStart.toISOString(),
          periodEnd: transfer.batch.periodEnd.toISOString(),
        });

        return acc;
      },
      {} as Record<
        string,
        {
          month: number;
          monthName: string;
          transferCount: number;
          totalAmountCents: number;
          transfers: Array<{
            id: string;
            amountCents: number;
            currency: string;
            createdAt: string;
            periodStart: string;
            periodEnd: string;
          }>;
        }
      >
    );

    // Convert to array and sort by month
    const monthlyBreakdownArray = Object.values(monthlyBreakdown).sort(
      (a, b) => a.month - b.month
    );

    // Calculate average payout amount
    const averagePayoutCents =
      totalTransfers > 0 ? Math.round(totalAmountCents / totalTransfers) : 0;

    // Find largest and smallest payouts
    const sortedByAmount = [...transfers].sort(
      (a, b) => b.amountCents - a.amountCents
    );
    const largestPayout = sortedByAmount[0] || null;
    const smallestPayout = sortedByAmount[sortedByAmount.length - 1] || null;

    return NextResponse.json({
      success: true,
      year,
      summary: {
        totalAmountCents,
        totalAmount: (totalAmountCents / 100).toFixed(2),
        currency: transfers[0]?.currency || "USD",
        totalTransfers,
        averagePayoutCents,
        averagePayout: (averagePayoutCents / 100).toFixed(2),
      },
      largestPayout: largestPayout
        ? {
            id: largestPayout.id,
            amountCents: largestPayout.amountCents,
            amount: (largestPayout.amountCents / 100).toFixed(2),
            currency: largestPayout.currency,
            createdAt: largestPayout.createdAt.toISOString(),
            periodStart: largestPayout.batch.periodStart.toISOString(),
            periodEnd: largestPayout.batch.periodEnd.toISOString(),
          }
        : null,
      smallestPayout: smallestPayout
        ? {
            id: smallestPayout.id,
            amountCents: smallestPayout.amountCents,
            amount: (smallestPayout.amountCents / 100).toFixed(2),
            currency: smallestPayout.currency,
            createdAt: smallestPayout.createdAt.toISOString(),
            periodStart: smallestPayout.batch.periodStart.toISOString(),
            periodEnd: smallestPayout.batch.periodEnd.toISOString(),
          }
        : null,
      monthlyBreakdown: monthlyBreakdownArray.map((month) => ({
        month: month.month,
        monthName: month.monthName,
        transferCount: month.transferCount,
        totalAmountCents: month.totalAmountCents,
        totalAmount: (month.totalAmountCents / 100).toFixed(2),
        transfers: month.transfers.map((t) => ({
          ...t,
          amount: (t.amountCents / 100).toFixed(2),
        })),
      })),
    });
  } catch (error: any) {
    console.error("[CLEANER_YTD_SUMMARY] Error:", error);

    // Handle auth errors
    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to fetch YTD summary",
        details:
          process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}


