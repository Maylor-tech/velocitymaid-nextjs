/** Shared clean-photo upload constants (safe for client + server). */

export const CLEAN_PHOTOS_BUCKET = "clean-photos";
export const MAX_PHOTOS_PER_BATCH = 20;
export const MAX_IMAGE_UPLOAD_BYTES = 1024 * 1024; // ~1 MB after compression
export const MAX_VIDEO_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

export const ALLOWED_UPLOAD_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "video/mp4",
  "video/quicktime",
]);

export function sanitizePhotoFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() || "file";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "file";
}

export function photoStoragePath(jobId: string, filename: string): string {
  return `${jobId}/${Date.now()}-${sanitizePhotoFilename(filename)}`;
}

export const CLEAN_PHOTO_CATEGORIES = [
  "BEFORE",
  "AFTER",
  "ISSUE",
  "DAMAGE",
  "SUPPLY",
  "OTHER",
] as const;

export type CleanPhotoCategoryValue = (typeof CLEAN_PHOTO_CATEGORIES)[number];

export function parseCleanPhotoCategory(
  raw: unknown
): CleanPhotoCategoryValue {
  const value = typeof raw === "string" ? raw.trim().toUpperCase() : "";
  if ((CLEAN_PHOTO_CATEGORIES as readonly string[]).includes(value)) {
    return value as CleanPhotoCategoryValue;
  }
  return "OTHER";
}

export function isAllowedUploadContentType(contentType: string): boolean {
  return ALLOWED_UPLOAD_TYPES.has(contentType);
}
