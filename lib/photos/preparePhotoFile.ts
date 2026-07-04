/**
 * Client-side photo normalization before upload:
 * HEIC → JPEG, resize/compress images, extension-based type detection for iOS.
 */

import { isVideoMediaFile } from "./mediaFileValidation";
import { MAX_IMAGE_UPLOAD_BYTES, MAX_VIDEO_UPLOAD_BYTES } from "./cleanPhotoStorage";

const MAX_IMAGE_DIMENSION = 1920;
const JPEG_QUALITY = 0.8;

function extension(name: string): string {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function isHeicLike(file: File): boolean {
  const ext = extension(file.name);
  return (
    ext === "heic" ||
    ext === "heif" ||
    file.type === "image/heic" ||
    file.type === "image/heif"
  );
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: JPEG_QUALITY,
  });
  const blob = Array.isArray(result) ? result[0] : result;
  const baseName = file.name.replace(/\.(heic|heif)$/i, "") || "photo";
  return new File([blob as Blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(
        new Error(
          `Could not read "${file.name}". Try taking a new photo or use JPG/PNG.`
        )
      );
    };
    img.src = url;
  });
}

async function renderJpeg(
  file: File,
  maxDimension: number,
  quality: number
): Promise<File> {
  const img = await loadImageFromFile(file);
  let { width, height } = img;
  const scale = Math.min(1, maxDimension / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error(`Could not process "${file.name}".`);
  }

  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) =>
        b
          ? resolve(b)
          : reject(new Error(`Could not compress "${file.name}".`)),
      "image/jpeg",
      quality
    );
  });

  const baseName = file.name.replace(/\.[^.]+$/, "") || "photo";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

async function compressImage(file: File): Promise<File> {
  let quality = JPEG_QUALITY;
  let dimension = MAX_IMAGE_DIMENSION;
  let result = await renderJpeg(file, dimension, quality);

  while (result.size > MAX_IMAGE_UPLOAD_BYTES && quality > 0.45) {
    quality -= 0.1;
    result = await renderJpeg(result, dimension, quality);
  }

  while (result.size > MAX_IMAGE_UPLOAD_BYTES && dimension > 800) {
    dimension = Math.round(dimension * 0.85);
    result = await renderJpeg(result, dimension, quality);
  }

  if (result.size > MAX_IMAGE_UPLOAD_BYTES) {
    const mb = (result.size / (1024 * 1024)).toFixed(1);
    throw new Error(
      `"${file.name}" is still ${mb} MB after compression. Try a smaller photo.`
    );
  }

  return result;
}

/** Normalize a single file for upload (compress images, pass through video). */
export async function preparePhotoFile(file: File): Promise<File> {
  if (isVideoMediaFile(file)) {
    if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
      const mb = Math.round(MAX_VIDEO_UPLOAD_BYTES / (1024 * 1024));
      throw new Error(
        `"${file.name}" is too large (max ${mb} MB). Try a shorter clip.`
      );
    }
    return file;
  }

  let working = file;
  if (isHeicLike(working)) {
    working = await convertHeicToJpeg(working);
  } else if (!working.type.startsWith("image/")) {
    working = new File([working], working.name, { type: "image/jpeg" });
  }

  return compressImage(working);
}

export { isAcceptedMediaFile } from "./mediaFileValidation";
