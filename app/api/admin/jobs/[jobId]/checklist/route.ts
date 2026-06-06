export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/requireRole";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";
import { getJobChecklistState } from "@/lib/jobs/jobChecklist";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/jobs/[jobId]/checklist
 * Audit view — all items with completion timestamps and specialist info.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, "ADMIN");

    const job = await prisma.job.findUnique({
      where: { id: params.jobId },
      select: { id: true },
    });
    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    const state = await getJobChecklistState(params.jobId);
    return NextResponse.json({ success: true, ...state });
  } catch (error) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    console.error("[ADMIN_CHECKLIST_GET]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load checklist",
      },
      { status: 500 }
    );
  }
}
