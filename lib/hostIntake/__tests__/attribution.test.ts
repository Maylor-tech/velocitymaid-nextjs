import { describe, expect, it } from "vitest";
import {
  attributionAnalyticsParams,
  formatAttributionBlock,
  mergeAttributionFirstTouch,
  mergeLeadNotes,
  parseAttributionFromNotes,
  parseAttributionFromSearchParams,
  stripStructuredBlocks,
  VM_ATTRIBUTION_END,
  VM_ATTRIBUTION_START,
} from "@/lib/hostIntake/attribution";

describe("host intake attribution", () => {
  it("parses physical-card UTM params with /hosts landing", () => {
    const params = new URLSearchParams(
      "utm_source=property_card&utm_medium=qr&utm_campaign=host_referral"
    );
    const attr = parseAttributionFromSearchParams(params, { landing: "/hosts" });
    expect(attr.landing).toBe("/hosts");
    expect(attr.utm_source).toBe("property_card");
    expect(attr.utm_medium).toBe("qr");
    expect(attr.utm_campaign).toBe("host_referral");
    expect(attr.first_touch_at).toBeTruthy();
  });

  it("preserves first-touch when merging later attribution", () => {
    const first = parseAttributionFromSearchParams(
      new URLSearchParams(
        "utm_source=property_card&utm_medium=qr&utm_campaign=host_referral"
      ),
      { landing: "/hosts" }
    );
    const later = parseAttributionFromSearchParams(
      new URLSearchParams(
        "utm_source=google&utm_medium=cpc&utm_campaign=other"
      ),
      { landing: "/vermont/host-intake" }
    );
    const merged = mergeAttributionFirstTouch(first, later);
    expect(merged.utm_source).toBe("property_card");
    expect(merged.utm_medium).toBe("qr");
    expect(merged.utm_campaign).toBe("host_referral");
    expect(merged.landing).toBe("/hosts");
  });

  it("round-trips attribution through lead notes", () => {
    const attr = {
      landing: "/hosts",
      utm_source: "property_card",
      utm_medium: "qr",
      utm_campaign: "host_referral",
      utm_content: "",
      first_touch_at: "2026-09-23T22:00:00.000Z",
    };
    const notes = mergeLeadNotes({
      attribution: attr,
      setupRequest: {
        town: "Ludlow",
        interest: "Vacation rental turnovers",
        submitted_at: "2026-09-23T22:00:00.000Z",
      },
      freeText: "Standing notes",
    });
    expect(notes).toContain(VM_ATTRIBUTION_START);
    expect(notes).toContain("utm_source=property_card");
    expect(notes).toContain("town=Ludlow");
    expect(parseAttributionFromNotes(notes)).toEqual(attr);

    const enriched = mergeLeadNotes({
      existingNotes: notes,
      freeText: "Full intake special instructions",
      attribution: {
        landing: "/vermont/host-intake",
        utm_source: "other",
        utm_medium: "x",
        utm_campaign: "y",
        utm_content: "",
        first_touch_at: "2026-09-24T00:00:00.000Z",
      },
    });
    const preserved = parseAttributionFromNotes(enriched);
    expect(preserved?.utm_source).toBe("property_card");
    expect(preserved?.landing).toBe("/hosts");
    expect(enriched).toContain("Full intake special instructions");
    expect(stripStructuredBlocks(enriched)).toContain(
      "Full intake special instructions"
    );
    expect(formatAttributionBlock(attr)).toContain(VM_ATTRIBUTION_END);
  });

  it("exposes campaign dims without PII keys", () => {
    const params = attributionAnalyticsParams({
      landing: "/hosts",
      utm_source: "property_card",
      utm_medium: "qr",
      utm_campaign: "host_referral",
      utm_content: "card_v1",
      first_touch_at: "2026-09-23T22:00:00.000Z",
    });
    expect(params).toEqual({
      market: "vermont",
      landing: "/hosts",
      utm_source: "property_card",
      utm_medium: "qr",
      utm_campaign: "host_referral",
      utm_content: "card_v1",
    });
    expect(Object.keys(params).some((k) => /email|phone|name|address/i.test(k))).toBe(
      false
    );
  });
});
