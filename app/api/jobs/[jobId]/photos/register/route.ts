export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { registerCleanPhoto } from "@/lib/photos/cleanPhotoStorage.server";

/**
 * POST /api/jobs/[jobId]/photos/register
 * Persist CleanPhoto row after client uploads to Supabase Storage.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    if (!jobId) {
      return NextResponse.json({ error: "jobId is required" }, { status: 400 });
    }

    const body = await request.json();
    const path = String(body.path || "");
    const uploadedBy =
      typeof body.uploadedBy === "string" ? body.uploadedBy.trim() : null;

    if (!path) {
      return NextResponse.json({ error: "path is required" }, { status: 400 });
    }

    const photo = await registerCleanPhoto({
      jobId,
      storagePath: path,
      uploadedBy,
    });

    return NextResponse.json(photo);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to register photo";
    const status =
      message === "Job not found"
        ? 404
        : message.startsWith("Invalid storage")
          ? 400
          : 500;
    console.error("[clean-photos register]", error);
    return NextResponse.json({ error: message }, { status });
  }
}
