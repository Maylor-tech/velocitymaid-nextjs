/** Client-side media file acceptance (extension fallback for empty iOS MIME). */

const ACCEPTED_EXTENSIONS = new Set([
  "heic",
  "heif",
  "jpg",
  "jpeg",
  "png",
  "webp",
  "mp4",
  "mov",
]);

export function fileExtension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function isVideoMediaFile(file: File): boolean {
  if (file.type.startsWith("video/")) return true;
  const ext = fileExtension(file.name);
  return ext === "mp4" || ext === "mov";
}

/** Accept images/videos including iOS HEIC with empty or octet-stream MIME. */
export function isAcceptedMediaFile(file: File): boolean {
  if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
    return true;
  }
  if (file.type === "application/octet-stream" || !file.type.trim()) {
    return ACCEPTED_EXTENSIONS.has(fileExtension(file.name));
  }
  return ACCEPTED_EXTENSIONS.has(fileExtension(file.name));
}

/** Human-readable skip reason — never silently drop files without messaging. */
export function getMediaFileRejectionReason(file: File): string | null {
  if (isAcceptedMediaFile(file)) return null;

  const ext = fileExtension(file.name);
  const typeHint = file.type?.trim() || "unknown type";

  if (!ext) {
    return `"${file.name}" was skipped (${typeHint}). Use JPG, HEIC, PNG, WebP, MP4, or MOV.`;
  }

  return `"${file.name}" was skipped — .${ext} is not supported. Use JPG, HEIC, PNG, WebP, MP4, or MOV.`;
}

const VIDEO_SIZE_WARN_BYTES = 50 * 1024 * 1024;

/** Warn when a video exceeds 50 MB (still uploaded if under server max). */
export function getVideoSizeWarning(file: File): string | null {
  if (!isVideoMediaFile(file)) return null;
  if (file.size <= VIDEO_SIZE_WARN_BYTES) return null;

  const mb = (file.size / (1024 * 1024)).toFixed(1);
  return `"${file.name}" is ${mb} MB — large videos may fail on slow connections. Consider a shorter clip.`;
}
