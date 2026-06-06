export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireCustomerJobOwnership } from "@/lib/auth/requireRole";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";
import { getJobChecklistState } from "@/lib/jobs/jobChecklist";

/**
 * GET /api/customer/jobs/[jobId]/checklist
 * Read-only hospitality checklist progress for the customer's job.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireCustomerJobOwnership(request, params.jobId);
    const state = await getJobChecklistState(params.jobId);
    return NextResponse.json({ success: true, ...state });
  } catch (error) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    console.error("[CUSTOMER_CHECKLIST_GET]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load checklist",
      },
      { status: 500 }
    );
  }
}
