import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  AREA_CHECK_LABEL,
  FAST_ESTIMATE_PATH,
  HEADER_QUOTE_LABEL,
  NJ_FREE_QUOTE_LABEL,
  VERMONT_HOST_INTAKE_PATH,
  VERMONT_TURNOVER_QUOTE_LABEL,
} from "@/lib/marketing/publicCtas";
import { NJ_LEAD_PATH } from "@/lib/markets/newJersey";

const repoRoot = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

const VERMONT_SURFACES = [
  "components/marketing/HomepageMarketing.tsx",
  "app/vermont/page.tsx",
  "components/vermont/VermontClusterLanding.tsx",
  "components/hosts/HostsLandingPage.tsx",
  "components/PricingTiers.tsx",
  "components/PricingCTA.tsx",
] as const;

describe("Public quote paths", () => {
  it("keeps /estimate as the area check and names the two quote paths", () => {
    expect(FAST_ESTIMATE_PATH).toBe("/estimate");
    expect(AREA_CHECK_LABEL).toBe("Check your area");
    expect(VERMONT_HOST_INTAKE_PATH).toBe("/vermont/host-intake");
    expect(VERMONT_TURNOVER_QUOTE_LABEL).toBe("Get a Turnover Quote");
    expect(NJ_FREE_QUOTE_LABEL).toBe("Get a Free Quote");
    expect(HEADER_QUOTE_LABEL).toBe("Get a Quote");
  });

  it("sends new Vermont hosts to host intake, not Fast Estimate", () => {
    for (const file of VERMONT_SURFACES) {
      const source = readRepoFile(file);
      expect(source, file).toMatch(
        /VERMONT_TURNOVER_QUOTE_LABEL|Get a Turnover Quote/
      );
      expect(source, file).not.toContain("Get a Fast Estimate");
      expect(source, file).not.toContain("Request Property Setup");
    }
  });

  it("uses one header quote chooser on every page", () => {
    const header = readRepoFile("components/layout/SiteHeader.tsx");
    expect(header).toContain("HEADER_QUOTE_LABEL");
    expect(header).toContain("VERMONT_HOST_INTAKE_PATH");
    expect(header).toContain("NJ_LEAD_PATH");
    expect(header).toContain('href: "/hosts"');
    expect(header).not.toContain("Get a Fast Estimate");
    expect(header).not.toContain("Work with us");
    expect(header).not.toContain("Investor");
  });

  it("keeps New Jersey on its own quote path", () => {
    const home = readRepoFile("components/marketing/HomepageMarketing.tsx");
    expect(home).toContain("NJ_LEAD_PATH");
    expect(home).toMatch(/NJ_FREE_QUOTE_LABEL|Get a Free Quote/);
    expect(home).toContain("New Jersey Homes");

    const njLanding = readRepoFile("components/marketing/MarketingPageSections.tsx");
    expect(njLanding).toContain("NJ_LEAD_PATH");
    expect(njLanding).toMatch(/NJ_FREE_QUOTE_LABEL|Get a Free Quote/);

    const pricing = readRepoFile("components/PricingTiers.tsx");
    expect(pricing).toContain(NJ_LEAD_PATH);
    expect(pricing).toMatch(/NJ_FREE_QUOTE_LABEL|Get a Free Quote/);
  });

  it("routes the area check and keeps Book Now off public quote pages", () => {
    const estimate = readRepoFile("app/estimate/page.tsx");
    expect(estimate).not.toContain('href="/book"');
    expect(estimate).not.toContain("Book now");
    expect(estimate).not.toContain("FastEstimate");
    expect(estimate).toContain("VERMONT_HOST_INTAKE_PATH");
    expect(estimate).toContain("NJ_LEAD_PATH");
    expect(estimate).toContain("AREA_CHECK_LABEL");

    const pricingCta = readRepoFile("components/PricingCTA.tsx");
    expect(pricingCta).not.toContain("/book?branch=new-jersey");
    expect(pricingCta).toContain("VERMONT_HOST_INTAKE_PATH");
    expect(pricingCta).toContain("NJ_LEAD_PATH");

    const gallery = readRepoFile("app/gallery/page.tsx");
    expect(gallery).not.toContain("/book?branch=new-jersey");
    expect(gallery).toContain("/vermont/host-intake");
    expect(gallery).toContain(NJ_LEAD_PATH);

    const notFound = readRepoFile("app/not-found.tsx");
    expect(notFound).not.toContain('href="/book"');
    expect(notFound).toContain("/estimate");
    expect(notFound).toContain("Check your area");
  });

  it("does not change estimate API or booking checkout wiring", () => {
    const estimateApi = readRepoFile("app/api/estimate/quick/route.ts");
    expect(estimateApi).toContain("POST");
    expect(estimateApi).toContain("FastEstimateParams");

    const checkout = readRepoFile("app/api/checkout/route.ts");
    expect(checkout).toContain("/book/confirmation");

    const setup = readRepoFile("app/api/host-intake/route.ts");
    expect(setup).toContain("SETUP_REQUEST");
  });
});
