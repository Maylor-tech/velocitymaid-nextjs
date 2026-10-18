import { NextRequest, NextResponse } from "next/server";
import { requireCleanerJobAssignment } from "@/lib/auth/requireRole";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";
import { loadJobPhotoChecklist } from "@/lib/photos/jobPhotoChecklist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/cleaner/jobs/[jobId]/photo-checklist */
export async function GET(
  req: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireCleanerJobAssignment(req, params.jobId);
    const checklist = await loadJobPhotoChecklist(params.jobId);
    if (!checklist) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, checklist });
  } catch (err: unknown) {
    const authResp = rethrowIfAuthResponse(err);
    if (authResp) return authResp;
    const message = err instanceof Error ? err.message : "Failed to load photo checklist";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
