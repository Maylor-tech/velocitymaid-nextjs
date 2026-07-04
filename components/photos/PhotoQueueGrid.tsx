"use client";

import { Film, Loader2, CheckCircle, AlertCircle, RotateCcw, X } from "lucide-react";
import type { PhotoQueueItem } from "@/lib/photos/useJobPhotoUpload";

interface PhotoQueueGridProps {
  items: PhotoQueueItem[];
  onRemove: (key: string) => void;
  onRetry?: (key: string) => void;
  retryingKey?: string | null;
}

const statusLabel: Record<PhotoQueueItem["status"], string> = {
  ready: "Ready",
  preparing: "Preparing…",
  uploading: "Uploading…",
  done: "Uploaded",
  failed: "Failed",
};

export function PhotoQueueGrid({
  items,
  onRemove,
  onRetry,
  retryingKey,
}: PhotoQueueGridProps) {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.key}
          className="relative overflow-hidden rounded-xl border border-vm-border bg-vm-white"
        >
          {item.preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.preview}
              alt={item.file.name}
              className="h-28 w-full object-cover sm:h-24"
            />
          ) : (
            <div className="flex h-28 w-full items-center justify-center bg-vm-surface sm:h-24">
              <Film className="h-7 w-7 text-vm-muted" />
            </div>
          )}

          {item.status !== "ready" && (
            <div className="absolute inset-x-0 bottom-0 bg-vm-navy/85 px-2 py-1.5">
              <p className="flex items-center gap-1 font-body text-[10px] text-vm-white">
                {(item.status === "preparing" || item.status === "uploading") && (
                  <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
                )}
                {item.status === "done" && (
                  <CheckCircle className="h-3 w-3 text-vm-success flex-shrink-0" />
                )}
                {item.status === "failed" && (
                  <AlertCircle className="h-3 w-3 text-vm-danger flex-shrink-0" />
                )}
                <span className="truncate">{statusLabel[item.status]}</span>
              </p>
            </div>
          )}

          {item.status === "ready" && (
            <button
              type="button"
              onClick={() => onRemove(item.key)}
              className="absolute right-1.5 top-1.5 rounded-full bg-vm-navy/80 p-1.5 text-vm-white"
              aria-label={`Remove ${item.file.name}`}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {item.status === "failed" && onRetry && (
            <button
              type="button"
              onClick={() => onRetry(item.key)}
              disabled={retryingKey === item.key}
              className="absolute right-1.5 top-1.5 rounded-full bg-vm-cyan px-2 py-1 font-body text-[10px] font-semibold text-vm-navy disabled:opacity-60"
            >
              {retryingKey === item.key ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <span className="inline-flex items-center gap-0.5">
                  <RotateCcw className="h-3 w-3" />
                  Retry
                </span>
              )}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

export function PhotoQueueMessages({ messages }: { messages: string[] }) {
  if (messages.length === 0) return null;

  return (
    <div className="mt-3 space-y-1">
      {messages.map((msg) => (
        <p
          key={msg}
          className="rounded-lg bg-vm-danger-bg px-3 py-2 font-body text-xs text-vm-danger"
        >
          {msg}
        </p>
      ))}
    </div>
  );
}

export function PhotoQueueItemErrors({ items }: { items: PhotoQueueItem[] }) {
  const failed = items.filter((i) => i.status === "failed" && i.error);
  if (failed.length === 0) return null;

  return (
    <div className="mt-3 space-y-1">
      {failed.map((item) => (
        <p
          key={item.key}
          className="rounded-lg bg-vm-danger-bg px-3 py-2 font-body text-xs text-vm-danger"
        >
          {item.error}
        </p>
      ))}
    </div>
  );
}

export function PhotoQueueWarnings({ items }: { items: PhotoQueueItem[] }) {
  const warnings = items.filter((i) => i.warning);
  if (warnings.length === 0) return null;

  return (
    <div className="mt-3 space-y-1">
      {warnings.map((item) => (
        <p
          key={`warn-${item.key}`}
          className="rounded-lg border border-vm-border bg-vm-surface px-3 py-2 font-body text-xs text-vm-muted"
        >
          {item.warning}
        </p>
      ))}
    </div>
  );
}
