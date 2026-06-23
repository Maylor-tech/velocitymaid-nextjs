export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Clean Photo Upload API
 * POST /api/jobs/[jobId]/photos
 *
 * Accepts multipart/form-data with one or more `files` entries and an optional
 * `uploadedBy` field, uploads each file to the public Supabase Storage bucket
 * "clean-photos", and persists a CleanPhoto row per upload.
 *
 * Access model: the unguessable job ID (a cuid) is the access key, so cleaners
 * can upload from a no-login mobile link (/cleaner/upload/[jobId]) and admins
 * can upload from the complete page. The job must exist or the request 404s.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const BUCKET = "clean-photos";
const MAX_FILES = 20;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
]);

let bucketReady = false;

async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.storage.getBucket(BUCKET);
  if (!existing) {
    const { error } = await supabase.storage.createBucket(BUCKET, {
      public: true,
    });
    // Ignore "already exists" races; surface anything else.
    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`Failed to create storage bucket: ${error.message}`);
    }
  }
  bucketReady = true;
}

function sanitizeFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() || "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

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

    const formData = await request.formData();
    const uploadedBy = (formData.get("uploadedBy") as string | null)?.trim() || null;

    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_FILES} photos per request` },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
          {
            success: false,
            error: `Unsupported file type: ${file.type || "unknown"}. Allowed: JPEG, PNG, WebP, HEIC, MP4, MOV.`,
          },
          { status: 400 }
        );
      }
    }

    await ensureBucket();
    const supabase = getSupabaseAdmin();

    const created: { id: string; url: string; uploadedAt: Date }[] = [];

    for (const file of files) {
      const timestamp = Date.now();
      const safeName = sanitizeFilename(file.name);
      const path = `${jobId}/${timestamp}-${safeName}`;
      const buffer = Buffer.from(await file.arrayBuffer());

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        return NextResponse.json(
          { success: false, error: `Upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(path);

      const record = await prisma.cleanPhoto.create({
        data: {
          jobId,
          url: publicUrl,
          uploadedBy,
        },
        select: { id: true, url: true, uploadedAt: true },
      });

      created.push(record);
    }

    return NextResponse.json({
      photos: created.map((p) => ({
        id: p.id,
        url: p.url,
        uploadedAt: p.uploadedAt.toISOString(),
      })),
    });
  } catch (error: unknown) {
    if (error instanceof NextResponse) return error;
    const message =
      error instanceof Error ? error.message : "Failed to upload photos";
    console.error("[clean-photos upload]", error);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
