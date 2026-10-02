import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FAST_ESTIMATE_CTA_LABEL,
  FAST_ESTIMATE_PATH,
} from "@/lib/marketing/publicCtas";
import { NJ_LEAD_PATH } from "@/lib/markets/newJersey";

const repoRoot = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

const CONVERSION_SURFACES = [
  "components/layout/SiteHeader.tsx",
  "components/Footer.tsx",
  "components/marketing/HomepageMarketing.tsx",
  "app/vermont/page.tsx",
  "components/vermont/VermontClusterLanding.tsx",
  "components/hosts/HostsLandingPage.tsx",
  "components/PricingTiers.tsx",
  "components/PricingCTA.tsx",
] as const;

describe("Fast Estimate distribution — PR1 CTA wiring", () => {
  it("exports the public estimate path and label", () => {
    expect(FAST_ESTIMATE_PATH).toBe("/estimate");
    expect(FAST_ESTIMATE_CTA_LABEL).toBe("Get a Fast Estimate");
  });

  it("wires Get a Fast Estimate through global, Vermont, hosts, and pricing surfaces", () => {
    for (const file of CONVERSION_SURFACES) {
      const source = readRepoFile(file);
      expect(source, file).toMatch(
        /FAST_ESTIMATE_PATH|href=["']\/estimate["']|href:\s*["']\/estimate["']/
      );
      expect(source, file).toMatch(/FAST_ESTIMATE_CTA_LABEL|Get a Fast Estimate/);
    }
  });

  it("defaults the global header to Fast Estimate, not NJ Book Now", () => {
    const header = readRepoFile("components/layout/SiteHeader.tsx");
    expect(header).toContain("FAST_ESTIMATE_PATH");
    expect(header).toContain("FAST_ESTIMATE_CTA_LABEL");
    expect(header).not.toContain('bookingHref = "/lead/new-jersey"');
    expect(header).not.toContain('bookingLabel = "Book Now"');
  });

  it("keeps New Jersey on its own quote path", () => {
    const home = readRepoFile("components/marketing/HomepageMarketing.tsx");
    expect(home).toContain("NJ_LEAD_PATH");
    expect(home).toContain("New Jersey quote");

    const njLanding = readRepoFile("components/marketing/MarketingPageSections.tsx");
    expect(njLanding).toContain("NJ_LEAD_PATH");
    expect(njLanding).toContain('bookingLabel="Request a Quote"');

    const pricing = readRepoFile("components/PricingTiers.tsx");
    expect(pricing).toContain(NJ_LEAD_PATH);
    expect(pricing).toContain("New Jersey");
  });

  it("removes prepaid Book Now from estimate, pricing, gallery, and 404", () => {
    const estimate = readRepoFile("app/estimate/page.tsx");
    expect(estimate).not.toContain('href="/book"');
    expect(estimate).not.toContain("Book now");
    expect(estimate).toContain('href="/vermont"');

    const pricingCta = readRepoFile("components/PricingCTA.tsx");
    expect(pricingCta).not.toContain("/book?branch=new-jersey");
    expect(pricingCta).toContain("/estimate");
    expect(pricingCta).toContain("/lead/new-jersey");

    const gallery = readRepoFile("app/gallery/page.tsx");
    expect(gallery).not.toContain("/book?branch=new-jersey");
    expect(gallery).toContain("/estimate");
    expect(gallery).toContain("/lead/new-jersey");

    const notFound = readRepoFile("app/not-found.tsx");
    expect(notFound).not.toContain('href="/book"');
    expect(notFound).toContain("/estimate");
  });

  it("does not change estimate API or booking checkout wiring", () => {
    const estimateApi = readRepoFile("app/api/estimate/quick/route.ts");
    expect(estimateApi).toContain("POST");
    expect(estimateApi).toContain("FastEstimateParams");

    const checkout = readRepoFile("app/api/checkout/route.ts");
    expect(checkout).toContain("/book/confirmation");
  });
});
