export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireCleanerJobAssignment } from "@/lib/auth/requireRole";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";
import {
  bulkUpdateJobChecklist,
  getJobChecklistState,
  updateJobChecklistItem,
} from "@/lib/jobs/jobChecklist";

/**
 * GET /api/cleaner/jobs/[jobId]/checklist
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireCleanerJobAssignment(request, params.jobId);
    const state = await getJobChecklistState(params.jobId);
    return NextResponse.json({ success: true, ...state });
  } catch (error) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    console.error("[CLEANER_CHECKLIST_GET]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load checklist",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/cleaner/jobs/[jobId]/checklist
 * Body: { checklistItemId, completed, notes? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireCleanerJobAssignment(request, params.jobId);
    const body = await request.json();
    const { checklistItemId, completed, notes } = body;

    if (!checklistItemId || typeof completed !== "boolean") {
      return NextResponse.json(
        { success: false, error: "checklistItemId and completed are required" },
        { status: 400 }
      );
    }

    const item = await updateJobChecklistItem(
      params.jobId,
      checklistItemId,
      completed,
      auth.userId,
      notes ?? null
    );
    const state = await getJobChecklistState(params.jobId);

    return NextResponse.json({
      success: true,
      item,
      completedIds: state.completedIds,
      progress: state.progress,
    });
  } catch (error) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    console.error("[CLEANER_CHECKLIST_PATCH]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update checklist",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cleaner/jobs/[jobId]/checklist
 * Body: { items: [{ checklistItemId, completed, notes? }] }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const auth = await requireCleanerJobAssignment(request, params.jobId);
    const body = await request.json();
    const items = body?.items;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "items array is required" },
        { status: 400 }
      );
    }

    for (const row of items) {
      if (!row.checklistItemId || typeof row.completed !== "boolean") {
        return NextResponse.json(
          { success: false, error: "Each item needs checklistItemId and completed" },
          { status: 400 }
        );
      }
    }

    const state = await bulkUpdateJobChecklist(
      params.jobId,
      items,
      auth.userId
    );

    return NextResponse.json({ success: true, ...state });
  } catch (error) {
    const authResp = rethrowIfAuthResponse(error);
    if (authResp) return authResp;
    console.error("[CLEANER_CHECKLIST_PUT]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save checklist",
      },
      { status: 500 }
    );
  }
}
