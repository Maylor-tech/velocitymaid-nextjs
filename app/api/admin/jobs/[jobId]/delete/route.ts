export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Soft-archive / unarchive a job — admin protected.
 *
 * DELETE  -> sets archivedAt = now()  (soft delete; record kept for accounting)
 * POST    -> sets archivedAt = null   (unarchive)
 *
 * Never hard-deletes. Looks up by job ID only (an admin with the ID may manage
 * it regardless of branch session scope).
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/requireRole";

async function setArchived(jobId: string, archivedAt: Date | null) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true },
  });
  if (!job) {
    return NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    );
  }

  await prisma.job.update({
    where: { id: jobId },
    data: { archivedAt },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, "ADMIN");
    const { jobId } = params;
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }
    return await setArchived(jobId, new Date());
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error ? error.message : "Failed to archive job";
    console.error("[job archive]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await requireRole(request, "ADMIN");
    const { jobId } = params;
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }
    return await setArchived(jobId, null);
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error ? error.message : "Failed to unarchive job";
    console.error("[job unarchive]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
