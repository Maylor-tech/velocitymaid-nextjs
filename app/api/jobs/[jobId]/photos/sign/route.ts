export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  assertJobExists,
  createCleanPhotoSignedUpload,
} from "@/lib/photos/cleanPhotoStorage.server";
import { requirePhotoUploadAccess } from "@/lib/dispatch/photoAuth";
import { rethrowIfAuthResponse } from "@/lib/api/routeAuth";

/**
 * POST /api/jobs/[jobId]/photos/sign
 * Mint a one-time signed upload URL (small JSON body — avoids Vercel 4.5 MB limit).
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

    await requirePhotoUploadAccess(request, jobId);
    await assertJobExists(jobId);

    const body = await request.json();
    const filename = String(body.filename || "photo.jpg");
    const contentType = String(body.contentType || "image/jpeg");
    const fileSize = Number(body.fileSize);

    const signed = await createCleanPhotoSignedUpload({
      jobId,
      filename,
      contentType,
      fileSize,
    });

    return NextResponse.json(signed);
  } catch (error: unknown) {
    const auth = rethrowIfAuthResponse(error);
    if (auth) return auth;
    const message = error instanceof Error ? error.message : "Failed to sign upload";
    const status = message === "Job not found" ? 404 : 400;
    console.error("[clean-photos sign]", error);
    return NextResponse.json({ error: message }, { status });
  }
}
