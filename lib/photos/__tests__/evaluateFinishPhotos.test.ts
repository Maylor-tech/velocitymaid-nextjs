import { describe, expect, it } from "vitest";
import {
  evaluateFinishPhotos,
  finishPhotoBlockMessage,
  resolvePropertyPhotoSlots,
} from "@/lib/photos/propertyPhotoSlots";

const slots = resolvePropertyPhotoSlots([], 1, 1);
const requiredKeys = slots.filter((s) => s.required).map((s) => s.key);

function afterPhotosForAllRequired() {
  return requiredKeys.map((slotKey) => ({
    slotKey,
    category: "AFTER",
  }));
}

describe("evaluateFinishPhotos", () => {
  it("blocks finish when arrival is missing and still reports missing AFTER slots", () => {
    const block = evaluateFinishPhotos({
      arrivalCondition: null,
      slots,
      photos: [],
    });
    expect(block.ok).toBe(false);
    expect(block.needsArrival).toBe(true);
    expect(block.missingAfter.map((item) => item.key)).toEqual(
      expect.arrayContaining(["kitchen", "bathroom-1", "bedroom-1"])
    );
    expect(finishPhotoBlockMessage(block)).toMatch(/Choose arrival/i);
    expect(finishPhotoBlockMessage(block)).toMatch(/Missing required after photos/i);
  });

  it("blocks NORMAL arrival with missing required AFTER photos", () => {
    const block = evaluateFinishPhotos({
      arrivalCondition: "NORMAL",
      slots,
      photos: [],
    });
    expect(block.ok).toBe(false);
    expect(block.needsArrival).toBe(false);
    expect(block.missingAfter.length).toBeGreaterThan(0);
  });

  it("allows NORMAL arrival when all required AFTER photos are present", () => {
    const block = evaluateFinishPhotos({
      arrivalCondition: "NORMAL",
      slots,
      photos: afterPhotosForAllRequired(),
    });
    expect(block).toEqual({
      ok: true,
      missingAfter: [],
      needsArrival: false,
      issuesNeedBefore: false,
    });
  });

  it("requires a BEFORE photo when arrival is ISSUES", () => {
    const withoutBefore = evaluateFinishPhotos({
      arrivalCondition: "ISSUES",
      slots,
      photos: afterPhotosForAllRequired(),
    });
    expect(withoutBefore.ok).toBe(false);
    expect(withoutBefore.issuesNeedBefore).toBe(true);

    const withBefore = evaluateFinishPhotos({
      arrivalCondition: "ISSUES",
      slots,
      photos: [
        { slotKey: null, category: "BEFORE" },
        ...afterPhotosForAllRequired(),
      ],
    });
    expect(withBefore.ok).toBe(true);
    expect(withBefore.issuesNeedBefore).toBe(false);
  });
});
