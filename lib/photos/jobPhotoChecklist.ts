import { prisma } from "@/lib/prisma";
import {
  evaluateFinishPhotos,
  resolvePropertyPhotoSlots,
  type FinishPhotoBlock,
  type PhotoSlotView,
} from "@/lib/photos/propertyPhotoSlots";

export interface JobPhotoChecklist {
  jobId: string;
  arrivalCondition: "NORMAL" | "ISSUES" | null;
  slots: PhotoSlotView[];
  photos: Array<{
    id: string;
    url: string;
    caption: string | null;
    category: string;
    slotKey: string | null;
    uploadedAt: string;
  }>;
  finish: FinishPhotoBlock;
}

export async function loadJobPhotoChecklist(jobId: string): Promise<JobPhotoChecklist | null> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      arrivalCondition: true,
      propertyId: true,
      Property: {
        select: {
          bedrooms: true,
          bathrooms: true,
          PhotoSlots: {
            select: {
              key: true,
              label: true,
              room: true,
              sortOrder: true,
              required: true,
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
      photos: {
        select: {
          id: true,
          url: true,
          caption: true,
          category: true,
          slotKey: true,
          uploadedAt: true,
        },
        orderBy: { uploadedAt: "asc" },
      },
    },
  });

  if (!job) return null;

  const slots = resolvePropertyPhotoSlots(
    job.Property?.PhotoSlots ?? [],
    job.Property?.bedrooms,
    job.Property?.bathrooms == null ? null : Number(job.Property.bathrooms)
  );

  const photos = job.photos.map((photo) => ({
    id: photo.id,
    url: photo.url,
    caption: photo.caption,
    category: photo.category,
    slotKey: photo.slotKey,
    uploadedAt: photo.uploadedAt.toISOString(),
  }));

  return {
    jobId: job.id,
    arrivalCondition: job.arrivalCondition,
    slots,
    photos,
    finish: evaluateFinishPhotos({
      arrivalCondition: job.arrivalCondition,
      slots,
      photos,
    }),
  };
}

export async function assertSlotKeyForJob(jobId: string, slotKey: string): Promise<void> {
  const checklist = await loadJobPhotoChecklist(jobId);
  if (!checklist) throw new Error("Job not found");
  if (!checklist.slots.some((slot) => slot.key === slotKey)) {
    throw new Error("Unknown photo slot");
  }
}
