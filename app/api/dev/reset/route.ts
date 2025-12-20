export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  if (process.env.APP_ENV !== "development") {
    return NextResponse.json(
      { success: false, error: "Not allowed in production" },
      { status: 403 }
    );
  }

  try {
    await prisma.auditLog.deleteMany();
    await prisma.complianceIssue.deleteMany();
    // Complaint model not present in schema; skipping to avoid runtime error
    // await prisma.complaint.deleteMany();
    await prisma.cleanerRating.deleteMany();
    await prisma.assignmentLog.deleteMany();
    await prisma.job.deleteMany();
    await prisma.cleanerAvailability.deleteMany();
    await prisma.trainingStatus.deleteMany();
    await prisma.userBranch.deleteMany();
    await prisma.user.deleteMany({ where: { role: "CLEANER" } });
    await prisma.customer.deleteMany();

    return NextResponse.json({
      success: true,
      message: "Database reset complete",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Reset failed" },
      { status: 500 }
    );
  }
}








