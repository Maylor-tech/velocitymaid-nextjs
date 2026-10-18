import { describe, expect, it } from "vitest";
import {
  defaultPropertyPhotoSlots,
  evaluateFinishPhotos,
  resolvePropertyPhotoSlots,
} from "@/lib/photos/propertyPhotoSlots";

/**
 * One job, in memory: Start is already IN_PROGRESS. Then arrival, slots,
 * finish gate, approve snapshot, and a manual send. No email client and no
 * database.
 */
describe("photo checklist walkthrough", () => {
  it("walks Start → Arrival → Slots → Finish → Approve → Send report", () => {
    const slots = resolvePropertyPhotoSlots(
      [
        {
          key: "sauna",
          label: "Sauna",
          room: "Sauna",
          sortOrder: 90,
          required: true,
        },
      ],
      2,
      1
    );

    expect(slots.map((slot) => slot.key)).toEqual([
      "kitchen",
      "bathroom-1",
      "bedroom-1",
      "bedroom-2",
      "living",
      "laundry",
      "entry-exterior",
      "sauna",
    ]);
    expect(defaultPropertyPhotoSlots(null, null).some((slot) => slot.key === "sauna")).toBe(
      false
    );

    const photos: Array<{ slotKey: string | null; category: string }> = [];
    let arrival: "NORMAL" | "ISSUES" | null = null;

    const legacy = evaluateFinishPhotos({ arrivalCondition: arrival, slots, photos });
    expect(legacy.ok).toBe(true);
    expect(legacy.needsArrival).toBe(false);

    arrival = "ISSUES";
    expect(
      evaluateFinishPhotos({ arrivalCondition: arrival, slots, photos }).issuesNeedBefore
    ).toBe(true);

    photos.push({ slotKey: null, category: "BEFORE" });
    const afterIssues = evaluateFinishPhotos({
      arrivalCondition: arrival,
      slots,
      photos,
    });
    expect(afterIssues.issuesNeedBefore).toBe(false);
    expect(afterIssues.missingAfter.map((item) => item.label)).toContain("Sauna");
    expect(afterIssues.ok).toBe(false);

    for (const slot of slots.filter((item) => item.required)) {
      photos.push({ slotKey: slot.key, category: "AFTER" });
    }

    const ready = evaluateFinishPhotos({ arrivalCondition: arrival, slots, photos });
    expect(ready.ok).toBe(true);

    const report = {
      status: "GENERATED" as const,
      publicToken: "report-token-1",
      arrivalCondition: arrival,
      invoicePublicToken: "inv-token-1",
      afterPhotos: photos
        .filter((photo) => photo.category === "AFTER")
        .map((photo) => ({
          url: `https://example.test/${photo.slotKey}.jpg`,
          slotLabel: slots.find((slot) => slot.key === photo.slotKey)?.label ?? null,
        })),
    };
    expect(report.status).toBe("GENERATED");
    expect(report.afterPhotos.find((photo) => photo.slotLabel === "Sauna")).toBeTruthy();
    expect(`/invoice/${report.invoicePublicToken}`).toBe("/invoice/inv-token-1");
    expect(`/report/${report.publicToken}`).toBe("/report/report-token-1");

    const sent = {
      ...report,
      status: "SENT" as const,
      autoSent: false,
    };
    expect(sent.status).toBe("SENT");
    expect(sent.autoSent).toBe(false);
  });
});
