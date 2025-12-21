export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { prisma } from "@/lib/prisma";
import { logAuditEntry } from "@/lib/audit";
import { autoAssignCleaner } from "@/lib/dispatch/autoAssignCleaner";
import { JobStatus } from "@prisma/client";

/**
 * POST /api/admin/dispatcher/run
 * 
 * Dispatcher endpoint that finds ASSIGNED jobs where
 * (now - assignedAt) > 15 minutes and triggers auto-reassignment
 * 
 * This should be called periodically (e.g., via cron or scheduled task)
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    // Optional: Add admin authentication check here
    // For now, we'll allow it (can be secured later)

    // 1. Find ASSIGNED jobs where assignedAt > 15 minutes ago
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const staleJobs = await prisma.job.findMany({
      where: {
        status: JobStatus.ASSIGNED,
        assignedAt: {
          not: null,
          lte: fifteenMinutesAgo,
        },
      },
      select: {
        id: true,
        assignedAt: true,
        customerName: true,
        assignedCleanerId: true,
      },
      orderBy: {
        assignedAt: "asc",
      },
    });

    if (staleJobs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No stale assignments found",
        processed: 0,
      });
    }

    console.log(`[DISPATCHER] Found ${staleJobs.length} stale assignments`);

    // 2. Process each stale job
    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const job of staleJobs) {
      try {
        // Log that we're reassigning
        await logAuditEntry({
          action: "AUTO_REASSIGN_TRIGGERED",
          entityType: "Job",
          entityId: job.id,
          description: `Auto-reassigning job (assigned ${Math.round(
            (Date.now() - (job.assignedAt?.getTime() || 0)) / 60000
          )} minutes ago)`,
          changes: {
            previousCleanerId: job.assignedCleanerId,
            assignedAt: job.assignedAt?.toISOString(),
            reason: "SLA timeout (15 minutes)",
          },
        });

        // First, set job back to CONFIRMED and clear assignment
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: JobStatus.CONFIRMED,
            assignedCleanerId: null,
            assignedAt: null,
          },
        });

        // Then trigger auto-assignment
        const assignResult = await autoAssignCleaner(job.id);

        if (assignResult.success) {
          results.successful++;
          console.log(
            `[DISPATCHER] Job ${job.id} reassigned to ${assignResult.cleanerName}`
          );
        } else {
          results.failed++;
          results.errors.push(`Job ${job.id}: ${assignResult.error}`);
          console.error(
            `[DISPATCHER] Failed to reassign job ${job.id}: ${assignResult.error}`
          );
        }

        results.processed++;
      } catch (err: any) {
        results.failed++;
        results.errors.push(`Job ${job.id}: ${err.message}`);
        console.error(`[DISPATCHER] Error processing job ${job.id}:`, err);
      }
    }

    // 3. Log summary
    await logAuditEntry({
      action: "DISPATCHER_RUN_COMPLETE",
      entityType: "System",
      entityId: "dispatcher",
      description: `Dispatcher processed ${results.processed} stale assignments`,
      changes: {
        processed: results.processed,
        successful: results.successful,
        failed: results.failed,
        errors: results.errors,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} stale assignments`,
      results,
    });
  } catch (err: any) {
    console.error("[DISPATCHER] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "Failed to run dispatcher",
      },
      { status: 500 }
    );
  }
}

