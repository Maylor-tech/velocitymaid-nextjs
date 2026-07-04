import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { CLEAN_PHOTOS_BUCKET } from "@/lib/photos/cleanPhotoStorage";
import { preparePhotoFile } from "@/lib/photos/preparePhotoFile";

export interface UploadedJobPhoto {
  id: string;
  url: string;
  uploadedAt: string;
}

export interface UploadSingleJobPhotoOptions {
  jobId: string;
  file: File;
  uploadedBy?: string;
}

async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text();
  try {
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    if (res.status === 413) {
      throw new Error(
        "Upload exceeded server size limit — photos should upload directly to storage. Tap Retry or contact support."
      );
    }
    throw new Error(
      res.ok
        ? "Invalid server response while uploading."
        : `Server error (${res.status}). Check your connection and tap Retry.`
    );
  }
}

function mapStorageUploadError(message: string, fileName: string): string {
  const lower = message.toLowerCase();
  if (/expired|invalid jwt|signature/i.test(lower)) {
    return `Upload link expired for "${fileName}" — tap Retry for a new link.`;
  }
  if (/network|fetch|failed to fetch/i.test(lower)) {
    return `Network error uploading "${fileName}" — tap Retry.`;
  }
  if (/payload too large|413|too large/i.test(lower)) {
    return `"${fileName}" is too large. Try a smaller file or shorter video.`;
  }
  return `"${fileName}": ${message}`;
}

/**
 * Upload one job photo: compress → signed URL → Supabase Storage → register row.
 * Bypasses Vercel's ~4.5 MB API body limit.
 */
export async function uploadSingleJobPhoto(
  options: UploadSingleJobPhotoOptions
): Promise<UploadedJobPhoto> {
  const { jobId, file, uploadedBy } = options;
  const rawName = file.name;

  let prepared: File;
  try {
    prepared = await preparePhotoFile(file);
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : `Could not prepare "${rawName}" for upload.`;
    throw new Error(message);
  }

  const signRes = await fetch(`/api/jobs/${jobId}/photos/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: prepared.name,
      contentType: prepared.type || "image/jpeg",
      fileSize: prepared.size,
    }),
  });

  let signData: Record<string, unknown>;
  try {
    signData = await parseJsonResponse(signRes);
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? mapStorageUploadError(err.message, rawName)
        : `Could not start upload for "${rawName}". Tap Retry.`
    );
  }

  if (!signRes.ok || signData.error) {
    const errMsg = String(signData.error || "Could not start upload");
    if (/too large/i.test(errMsg)) {
      throw new Error(`"${rawName}" is too large after compression. ${errMsg}`);
    }
    if (/unsupported/i.test(errMsg)) {
      throw new Error(`"${rawName}" — unsupported format. ${errMsg}`);
    }
    throw new Error(mapStorageUploadError(errMsg, rawName));
  }

  const path = String(signData.path);
  const token = String(signData.token);

  let supabase;
  try {
    supabase = getSupabaseBrowser();
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? err.message
        : "Photo upload is not configured on this site."
    );
  }

  const { error: uploadError } = await supabase.storage
    .from(CLEAN_PHOTOS_BUCKET)
    .uploadToSignedUrl(path, token, prepared, {
      contentType: prepared.type || "image/jpeg",
    });

  if (uploadError) {
    throw new Error(mapStorageUploadError(uploadError.message, rawName));
  }

  const registerRes = await fetch(`/api/jobs/${jobId}/photos/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path,
      uploadedBy: uploadedBy || undefined,
    }),
  });

  let registerData: Record<string, unknown>;
  try {
    registerData = await parseJsonResponse(registerRes);
  } catch (err) {
    throw new Error(
      err instanceof Error
        ? mapStorageUploadError(err.message, rawName)
        : `Uploaded "${rawName}" but could not save the record. Tap Retry.`
    );
  }

  if (!registerRes.ok || registerData.error) {
    throw new Error(
      mapStorageUploadError(
        String(registerData.error || "Failed to save photo record"),
        rawName
      )
    );
  }

  return {
    id: String(registerData.id),
    url: String(registerData.url),
    uploadedAt: String(registerData.uploadedAt),
  };
}

export interface UploadJobPhotosOptions {
  jobId: string;
  files: File[];
  uploadedBy?: string;
  onProgress?: (completed: number, total: number, label: string) => void;
  onFileComplete?: (index: number, photo: UploadedJobPhoto) => void;
  onFileError?: (index: number, error: string) => void;
}

/** Upload multiple files sequentially with per-file callbacks. */
export async function uploadJobPhotos(
  options: UploadJobPhotosOptions
): Promise<UploadedJobPhoto[]> {
  const { jobId, files, uploadedBy, onProgress, onFileComplete, onFileError } =
    options;
  const results: UploadedJobPhoto[] = [];
  const total = files.length;

  for (let i = 0; i < files.length; i++) {
    const raw = files[i];
    onProgress?.(i, total, raw.name);

    try {
      const photo = await uploadSingleJobPhoto({
        jobId,
        file: raw,
        uploadedBy,
      });
      results.push(photo);
      onFileComplete?.(i, photo);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : `Could not upload "${raw.name}".`;
      onFileError?.(i, message);
      throw new Error(message);
    }
  }

  onProgress?.(total, total, "Done");
  return results;
}
