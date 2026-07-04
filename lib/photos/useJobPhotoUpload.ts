"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_PHOTOS_PER_BATCH } from "@/lib/photos/cleanPhotoStorage";
import {
  getMediaFileRejectionReason,
  getVideoSizeWarning,
  isVideoMediaFile,
} from "@/lib/photos/mediaFileValidation";
import {
  uploadSingleJobPhoto,
  type UploadedJobPhoto,
} from "@/lib/photos/uploadJobPhotos";

export type PhotoQueueStatus =
  | "ready"
  | "preparing"
  | "uploading"
  | "done"
  | "failed";

export interface PhotoQueueItem {
  key: string;
  file: File;
  preview: string;
  status: PhotoQueueStatus;
  error?: string;
  warning?: string;
  photo?: UploadedJobPhoto;
}

function previewForFile(file: File): string {
  if (isVideoMediaFile(file)) return "";
  return URL.createObjectURL(file);
}

export function useJobPhotoUpload(jobId: string) {
  const [items, setItems] = useState<PhotoQueueItem[]>([]);
  const [fileMessages, setFileMessages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    return () => {
      items.forEach((item) => item.preview && URL.revokeObjectURL(item.preview));
    };
  }, [items]);

  const updateItem = useCallback(
    (key: string, patch: Partial<PhotoQueueItem>) => {
      setItems((prev) =>
        prev.map((item) => (item.key === key ? { ...item, ...patch } : item))
      );
    },
    []
  );

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const rejections: string[] = [];
    const warnings: string[] = [];
    const accepted: PhotoQueueItem[] = [];

    for (const file of Array.from(incoming)) {
      const rejection = getMediaFileRejectionReason(file);
      if (rejection) {
        rejections.push(rejection);
        continue;
      }
      const warning = getVideoSizeWarning(file);
      if (warning) warnings.push(warning);
      accepted.push({
        key: `${file.name}-${file.size}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        preview: previewForFile(file),
        status: "ready",
        warning: warning ?? undefined,
      });
    }

    if (rejections.length > 0) {
      setFileMessages(rejections);
    } else if (warnings.length > 0) {
      setFileMessages(warnings);
    } else {
      setFileMessages([]);
    }

    if (accepted.length === 0) return;

    setItems((prev) => [...prev, ...accepted].slice(0, MAX_PHOTOS_PER_BATCH));
  }, []);

  const removeAt = useCallback((key: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.key === key);
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.key !== key);
    });
  }, []);

  const uploadOne = useCallback(
    async (key: string, uploadedBy?: string): Promise<UploadedJobPhoto | null> => {
      const item = itemsRef.current.find((i) => i.key === key);
      if (!item || item.status === "done") return item?.photo ?? null;

      updateItem(key, { status: "preparing", error: undefined });

      try {
        updateItem(key, { status: "uploading" });
        const photo = await uploadSingleJobPhoto({
          jobId,
          file: item.file,
          uploadedBy,
        });
        if (item.preview) URL.revokeObjectURL(item.preview);
        updateItem(key, {
          status: "done",
          photo,
          preview: "",
          error: undefined,
        });
        return photo;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : `Could not upload "${item.file.name}". Tap Retry.`;
        updateItem(key, { status: "failed", error: message });
        return null;
      }
    },
    [jobId, updateItem]
  );

  const uploadAll = useCallback(
    async (
      uploadedBy?: string
    ): Promise<{ uploaded: UploadedJobPhoto[]; hasFailures: boolean }> => {
      const pending = itemsRef.current.filter(
        (i) => i.status === "ready" || i.status === "failed"
      );
      if (pending.length === 0) {
        return { uploaded: [], hasFailures: false };
      }

      setUploading(true);
      setFileMessages([]);
      const uploaded: UploadedJobPhoto[] = [];

      for (const item of pending) {
        const photo = await uploadOne(item.key, uploadedBy);
        if (photo) uploaded.push(photo);
      }

      setUploading(false);
      const hasFailures = itemsRef.current.some((i) => i.status === "failed");
      return { uploaded, hasFailures };
    },
    [uploadOne]
  );

  const retryOne = useCallback(
    (key: string, uploadedBy?: string) => uploadOne(key, uploadedBy),
    [uploadOne]
  );

  const readyCount = items.filter(
    (i) => i.status === "ready" || i.status === "failed"
  ).length;
  const doneCount = items.filter((i) => i.status === "done").length;
  const uploadedPhotos = items
    .filter((i) => i.photo)
    .map((i) => i.photo!) as UploadedJobPhoto[];

  return {
    items,
    fileMessages,
    uploading,
    readyCount,
    doneCount,
    uploadedPhotos,
    addFiles,
    removeAt,
    uploadAll,
    retryOne,
    setFileMessages,
  };
}
