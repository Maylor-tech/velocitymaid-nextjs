export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Clean Photo registration API
 * POST /api/jobs/[jobId]/photos
 *
 * Registers CleanPhoto row(s) for file(s) already uploaded to Supabase Storage
 * via the signed-upload flow (/photos/sign → direct Storage → /photos/register).
 *
 * Prefer /photos/register for single-file uploads from the client.
 */

import { NextRequest, NextResponse } from "next/server";
import { MAX_PHOTOS_PER_BATCH } from "@/lib/photos/cleanPhotoStorage";
import { assertJobExists, registerCleanPhoto } from "@/lib/photos/cleanPhotoStorage.server";
import { requirePhotoUploadAccess } from "@/lib/dispatch/photoAuth";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";

export async function POST(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    const { jobId } = params;
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: "jobId is required" },
        { status: 400 }
      );
    }

    const actor = await requirePhotoUploadAccess(request, jobId);
    await assertJobExists(jobId);

    const body = await request.json();
    const uploadedBy =
      typeof body.uploadedBy === "string" ? body.uploadedBy.trim() : actor.userId;

    const paths: string[] = Array.isArray(body.paths)
      ? body.paths.map(String).filter(Boolean)
      : body.path
        ? [String(body.path)]
        : [];

    if (paths.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No storage paths provided. Upload to Supabase first, then pass path or paths.",
        },
        { status: 400 }
      );
    }

    if (paths.length > MAX_PHOTOS_PER_BATCH) {
      return NextResponse.json(
        {
          success: false,
          error: `Maximum ${MAX_PHOTOS_PER_BATCH} photos per request`,
        },
        { status: 400 }
      );
    }

    const created: { id: string; url: string; uploadedAt: string }[] = [];

    for (const path of paths) {
      const record = await registerCleanPhoto({
        jobId,
        storagePath: path,
        uploadedBy,
        category: body.category,
      });
      created.push(record);
    }

    return NextResponse.json({ photos: created });
  } catch (error: unknown) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message =
      error instanceof Error ? error.message : "Failed to register photos";
    const status =
      message === "Job not found"
        ? 404
        : message.startsWith("Invalid storage")
          ? 400
          : 500;
    console.error("[clean-photos register batch]", error);
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
