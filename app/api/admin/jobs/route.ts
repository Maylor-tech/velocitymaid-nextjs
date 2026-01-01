import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/requireRole";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, "ADMIN");
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const branchId = searchParams.get("branchId");

    // Build where clause carefully to handle enum values
    const whereClause: any = {};
    if (status) {
      // Validate status is a known value before using it
      const validStatuses = ["RECEIVED", "CONFIRMED", "ASSIGNED", "ON_THE_WAY", "IN_PROGRESS", "COMPLETED", "CANCELLED", "REASSIGN_PENDING"];
      if (validStatuses.includes(status)) {
        whereClause.status = status;
      }
    }
    if (branchId) {
      whereClause.branchId = branchId;
    }

    let jobs;
    try {
      jobs = await prisma.job.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          customerName: true,
          serviceType: true,
          preferredDate: true,
          preferredTime: true,
          totalPrice: true,
          currency: true,
          createdAt: true,
          branchId: true,
          assignedCleanerId: true,
          payoutStatus: true,
          ratingStatus: true,
          branch: {
            select: { name: true, id: true },
          },
          assignedCleaner: {
            select: { id: true, name: true, email: true },
          },
          JobPayout: {
            select: {
              id: true,
              cleanerAmount: true,
              status: true,
            },
          },
        },
      });
    } catch (dbError: any) {
      // Handle errors gracefully - might be missing fields or enum issues
      console.warn("[ADMIN JOBS] Database query error, retrying with minimal fields:", dbError?.message);
      
      // Remove problematic fields and retry
      if (whereClause.status === "REASSIGN_PENDING") {
        delete whereClause.status;
      }
      
      // Retry with minimal fields (excluding JobPayout and new fields that might not exist)
      jobs = await prisma.job.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          customerName: true,
          serviceType: true,
          preferredDate: true,
          preferredTime: true,
          totalPrice: true,
          currency: true,
          createdAt: true,
          branchId: true,
          assignedCleanerId: true,
          branch: {
            select: { name: true, id: true },
          },
          assignedCleaner: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      
      // Add empty JobPayout array to maintain interface consistency
      jobs = jobs.map((job: any) => ({
        ...job,
        payoutStatus: null,
        ratingStatus: null,
        JobPayout: [],
      }));
    }

    // Convert Decimal to number for JSON serialization
    const formattedJobs = jobs.map((job: any) => ({
      ...job,
      totalPrice: job.totalPrice ? Number(job.totalPrice) : null,
      preferredDate: job.preferredDate?.toISOString() || null,
      createdAt: job.createdAt.toISOString(),
      assignedCleanerName: job.assignedCleaner?.name || null,
      JobPayout: job.JobPayout || [],
    }));

    return NextResponse.json({ jobs: formattedJobs });
  } catch (err: any) {
    console.error("[ADMIN JOBS] Error:", err);
    console.error("[ADMIN JOBS] Error details:", {
      message: err?.message,
      code: err?.code,
      meta: err?.meta,
      stack: err?.stack,
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch jobs",
        details: process.env.NODE_ENV === "development" ? err?.message : undefined,
      },
      { status: 500 }
    );
  }
}

