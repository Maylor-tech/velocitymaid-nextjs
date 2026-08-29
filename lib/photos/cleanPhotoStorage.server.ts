import { prisma } from "@/lib/prisma";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  CLEAN_PHOTOS_BUCKET,
  isAllowedUploadContentType,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_VIDEO_UPLOAD_BYTES,
  parseCleanPhotoCategory,
  photoStoragePath,
  type CleanPhotoCategoryValue,
} from "./cleanPhotoStorage";

let bucketReady = false;

export async function ensureCleanPhotosBucket(): Promise<void> {
  if (bucketReady) return;
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase.storage.getBucket(CLEAN_PHOTOS_BUCKET);
  if (!existing) {
    const { error } = await supabase.storage.createBucket(CLEAN_PHOTOS_BUCKET, {
      public: true,
    });
    if (error && !/already exists/i.test(error.message)) {
      throw new Error(`Failed to create storage bucket: ${error.message}`);
    }
  }
  bucketReady = true;
}

export async function assertJobExists(jobId: string): Promise<void> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: { id: true },
  });
  if (!job) {
    throw new Error("Job not found");
  }
}

export function validateUploadSize(contentType: string, fileSize: number): void {
  const isVideo =
    contentType.startsWith("video/") ||
    contentType === "video/quicktime";
  const max = isVideo ? MAX_VIDEO_UPLOAD_BYTES : MAX_IMAGE_UPLOAD_BYTES;
  if (fileSize <= 0) {
    throw new Error("File is empty");
  }
  if (fileSize > max) {
    const mb = Math.round(max / (1024 * 1024));
    throw new Error(
      isVideo
        ? `Video is too large (max ${mb} MB). Try a shorter clip.`
        : `Photo is too large after compression (max ${mb} MB).`
    );
  }
}

export async function createCleanPhotoSignedUpload(params: {
  jobId: string;
  filename: string;
  contentType: string;
  fileSize: number;
}) {
  if (!isAllowedUploadContentType(params.contentType)) {
    throw new Error(
      `Unsupported file type: ${params.contentType}. Use JPEG, PNG, WebP, HEIC, MP4, or MOV.`
    );
  }

  validateUploadSize(params.contentType, params.fileSize);
  await ensureCleanPhotosBucket();

  const path = photoStoragePath(params.jobId, params.filename);
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.storage
    .from(CLEAN_PHOTOS_BUCKET)
    .createSignedUploadUrl(path, { upsert: false });

  if (error || !data) {
    throw new Error(error?.message || "Failed to create upload URL");
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(CLEAN_PHOTOS_BUCKET).getPublicUrl(path);

  return {
    path: data.path,
    token: data.token,
    publicUrl,
  };
}

export async function registerCleanPhoto(params: {
  jobId: string;
  storagePath: string;
  uploadedBy?: string | null;
  category?: unknown;
}) {
  if (!params.storagePath.startsWith(`${params.jobId}/`)) {
    throw new Error("Invalid storage path for this job");
  }

  await assertJobExists(params.jobId);
  await ensureCleanPhotosBucket();

  const supabase = getSupabaseAdmin();
  const {
    data: { publicUrl },
  } = supabase.storage.from(CLEAN_PHOTOS_BUCKET).getPublicUrl(params.storagePath);

  const category: CleanPhotoCategoryValue = parseCleanPhotoCategory(params.category);

  const record = await prisma.cleanPhoto.create({
    data: {
      jobId: params.jobId,
      url: publicUrl,
      uploadedBy: params.uploadedBy?.trim() || null,
      category,
      customerVisible: false,
    },
    select: { id: true, url: true, uploadedAt: true, category: true, customerVisible: true },
  });

  return {
    id: record.id,
    url: record.url,
    uploadedAt: record.uploadedAt.toISOString(),
    category: record.category,
    customerVisible: record.customerVisible,
  };
}
