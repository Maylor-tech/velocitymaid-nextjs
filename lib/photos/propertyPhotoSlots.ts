export type PhotoSlotSource = "default" | "property";

export interface PhotoSlotView {
  key: string;
  label: string;
  room: string;
  sortOrder: number;
  required: boolean;
  source: PhotoSlotSource;
}

export interface StoredPhotoSlot {
  key: string;
  label: string;
  room: string;
  sortOrder: number;
  required: boolean;
}

export interface PhotoForSlots {
  slotKey: string | null;
  category: string;
}

const MAX_ROOMS = 12;

function roomCount(value: number | null | undefined): number {
  if (value == null || !Number.isFinite(value) || value <= 0) return 1;
  return Math.min(MAX_ROOMS, Math.ceil(value));
}

function slot(
  key: string,
  label: string,
  room: string,
  sortOrder: number
): PhotoSlotView {
  return { key, label, room, sortOrder, required: true, source: "default" };
}

/** Runtime default when a property has no stored slot rows. */
export function defaultPropertyPhotoSlots(
  bedrooms: number | null | undefined,
  bathrooms: number | null | undefined
): PhotoSlotView[] {
  const bathroomCount = roomCount(bathrooms);
  const bedroomCount = roomCount(bedrooms);
  const slots: PhotoSlotView[] = [slot("kitchen", "Kitchen", "Kitchen", 10)];

  for (let i = 1; i <= bathroomCount; i += 1) {
    slots.push(
      slot(`bathroom-${i}`, `Bathroom ${i}`, "Bathroom", 20 + i)
    );
  }
  for (let i = 1; i <= bedroomCount; i += 1) {
    slots.push(slot(`bedroom-${i}`, `Bedroom ${i}`, "Bedroom", 40 + i));
  }

  slots.push(
    slot("living", "Living", "Living", 60),
    slot("laundry", "Laundry", "Laundry", 70),
    slot("entry-exterior", "Entry/Exterior", "Entry/Exterior", 80)
  );
  return slots;
}

/**
 * Stored rows override a default with the same key and any other key is an
 * extra (Sauna, Fire pit). No stored rows → defaults only.
 */
export function resolvePropertyPhotoSlots(
  stored: StoredPhotoSlot[],
  bedrooms: number | null | undefined,
  bathrooms: number | null | undefined
): PhotoSlotView[] {
  const defaults = defaultPropertyPhotoSlots(bedrooms, bathrooms);
  if (stored.length === 0) return defaults;

  const byKey = new Map(stored.map((row) => [row.key, row]));
  const merged = defaults.map((item) => {
    const override = byKey.get(item.key);
    if (!override) return item;
    return {
      key: override.key,
      label: override.label,
      room: override.room,
      sortOrder: override.sortOrder,
      required: override.required,
      source: "property" as const,
    };
  });

  const defaultKeys = new Set(defaults.map((item) => item.key));
  const extras = stored
    .filter((row) => !defaultKeys.has(row.key))
    .map((row) => ({
      key: row.key,
      label: row.label,
      room: row.room,
      sortOrder: row.sortOrder,
      required: row.required,
      source: "property" as const,
    }));

  return [...merged, ...extras].sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
}

export function missingRequiredAfterSlots(
  slots: PhotoSlotView[],
  photos: PhotoForSlots[]
): PhotoSlotView[] {
  return slots.filter((item) => {
    if (!item.required) return false;
    return !photos.some(
      (photo) => photo.slotKey === item.key && photo.category === "AFTER"
    );
  });
}

export function hasBeforePhoto(photos: PhotoForSlots[]): boolean {
  return photos.some((photo) => photo.category === "BEFORE");
}

export interface FinishPhotoBlock {
  ok: boolean;
  missingAfter: Array<{ key: string; label: string }>;
  needsArrival: boolean;
  issuesNeedBefore: boolean;
}

export function evaluateFinishPhotos(input: {
  arrivalCondition: "NORMAL" | "ISSUES" | null;
  slots: PhotoSlotView[];
  photos: PhotoForSlots[];
}): FinishPhotoBlock {
  // Legacy jobs started before this release have no arrival check. Do not block them.
  if (input.arrivalCondition == null) {
    return {
      ok: true,
      missingAfter: [],
      needsArrival: false,
      issuesNeedBefore: false,
    };
  }

  const missingAfter = missingRequiredAfterSlots(input.slots, input.photos).map(
    (item) => ({ key: item.key, label: item.label })
  );
  const issuesNeedBefore =
    input.arrivalCondition === "ISSUES" && !hasBeforePhoto(input.photos);
  return {
    ok: !issuesNeedBefore && missingAfter.length === 0,
    missingAfter,
    needsArrival: false,
    issuesNeedBefore,
  };
}

export function finishPhotoBlockMessage(block: FinishPhotoBlock): string {
  const parts: string[] = [];
  if (block.needsArrival) {
    parts.push("Choose arrival: Normal or Issues.");
  }
  if (block.issuesNeedBefore) {
    parts.push("Issues requires at least one Before photo.");
  }
  if (block.missingAfter.length > 0) {
    parts.push(
      `Missing required after photos: ${block.missingAfter.map((item) => item.label).join(", ")}.`
    );
  }
  return parts.join(" ");
}
