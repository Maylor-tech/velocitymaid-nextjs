import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { RESIDENTIAL_CONDITION_DISCLAIMER } from "../constants";

const repoRoot = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("residential v1 invariants", () => {
  it("keeps /hosts exclusive of residential intake", () => {
    const hosts = readRepoFile("components/hosts/HostsLandingPage.tsx");
    expect(hosts).not.toContain("/residential");
    expect(hosts).toContain("/hosts");
    expect(hosts.toLowerCase()).toMatch(/vacation rental|guest-ready|host/);
  });

  it("public residential intake never creates a Job", () => {
    const api = readRepoFile("app/api/residential-intake/route.ts");
    const draft = readRepoFile("lib/residentialIntake/createDraftCustomer.ts");
    expect(api).not.toMatch(/prisma\.job\.create/);
    expect(draft).not.toMatch(/prisma\.job\.create/);
    expect(draft).toContain("Never creates a Job");
    expect(draft).toContain('PREPAY');
  });

  it("manual admin Job create snapshots billingPolicy", () => {
    const manual = readRepoFile("app/api/admin/jobs/create-manual/route.ts");
    expect(manual).toContain("resolveBillingPolicy");
    expect(manual).toContain("billingPolicy,");
  });

  it("completion still uses existing DRAFT invoice workflow", () => {
    const workflow = readRepoFile("lib/billing/jobCompletionWorkflow.ts");
    expect(workflow).toMatch(/DRAFT|generateInvoiceFromJob|runJobCompletionBillingWorkflow/);
    expect(workflow).not.toMatch(/sendLinkedInvoiceForJob\(/);
  });

  it("does not describe ordinary visible mold as mold remediation", () => {
    const files = [
      "lib/residentialIntake/constants.ts",
      "components/residential/ResidentialIntakeForm.tsx",
      "components/residential/ResidentialLandingPage.tsx",
    ];
    for (const file of files) {
      expect(readRepoFile(file).toLowerCase(), file).not.toContain(
        "mold remediation"
      );
    }
    expect(RESIDENTIAL_CONDITION_DISCLAIMER.toLowerCase()).not.toContain(
      "mold remediation"
    );
  });

  it("wires /residential in header and footer without replacing Fast Estimate", () => {
    const header = readRepoFile("components/layout/SiteHeader.tsx");
    const footer = readRepoFile("components/Footer.tsx");
    expect(header).toContain('href: "/residential"');
    expect(header).toContain("FAST_ESTIMATE_PATH");
    expect(footer).toContain('href="/residential"');
    expect(footer).toContain('href="/estimate"');
  });
});
