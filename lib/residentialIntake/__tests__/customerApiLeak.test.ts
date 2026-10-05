import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { toHostPropertyView } from "@/lib/properties/propertyService";
import type { Property } from "@prisma/client";
import { RESIDENTIAL_CONDITION_DISCLAIMER } from "../constants";

const repoRoot = path.resolve(__dirname, "../../..");

function readRepoFile(relativePath: string): string {
  return fs.readFileSync(path.join(repoRoot, relativePath), "utf8");
}

const CUSTOMER_API_FILES = [
  "app/api/customer/jobs/route.ts",
  "app/api/customer/jobs/[jobId]/route.ts",
  "app/api/customer/me/route.ts",
  "app/api/customer/properties/[propertyId]/route.ts",
  "lib/properties/propertyService.ts",
];

const ADMIN_ONLY_KEYS = [
  "estimatedLaborHours",
  "actualLaborHours",
  "pricingBasis",
  "agreedPrice",
  "operationalTotal",
  "includedScope",
  "exclusions",
  "preExistingConditionNotes",
  "approvedAddOns",
  "cleanerPayable",
];

describe("residential pricing data ownership and customer leak surface", () => {
  it("keeps labor hours, basis, and agreed price on admin/profile/job — not customer APIs", () => {
    for (const file of CUSTOMER_API_FILES) {
      const source = readRepoFile(file);
      for (const key of ADMIN_ONLY_KEYS) {
        expect(source, `${file} must not mention ${key}`).not.toContain(key);
      }
    }
  });

  it("toHostPropertyView omits residential pricing and accessNotes", () => {
    const view = toHostPropertyView({
      id: "p1",
      customerId: "c1",
      name: "Middlebury Home",
      address: "12 Maple Street",
      city: "Middlebury",
      state: "VT",
      postalCode: null,
      bedrooms: 1,
      bathrooms: 1,
      approximateSquareFeet: 700,
      bedConfiguration: null,
      amenities: [],
      restrictedAreas: null,
      accessType: "Driveway",
      accessNotes: "CODE-SECRET",
      supplyStorageLocation: null,
      trashInstructions: null,
      linenInstructions: null,
      standardCheckoutTime: null,
      standardCheckinTime: null,
      turnoverFrequency: null,
      sameDayTurnovers: null,
      standingInstructions: "Wipe baseboards",
      useType: "RESIDENTIAL",
      billingPolicy: "INVOICE_AFTER_SERVICE",
      guestAccessToken: null,
      guestAccessTokenCreatedAt: null,
      guestAccessRevokedAt: null,
      guestDisplayName: null,
      createdAt: new Date("2026-10-05"),
      updatedAt: new Date("2026-10-05"),
    } as Property);
    expect(view.useType).toBe("RESIDENTIAL");
    expect(view).not.toHaveProperty("estimatedLaborHours");
    expect(view).not.toHaveProperty("agreedPrice");
    expect(view).not.toHaveProperty("pricingBasis");
    expect(view).not.toHaveProperty("accessNotes");
    expect(JSON.stringify(view)).not.toContain("CODE-SECRET");
  });

  it("acknowledgement copy does not promise a fixed price", () => {
    const email = readRepoFile("lib/email/sendResidentialIntakeEmails.ts");
    const form = readRepoFile("components/residential/ResidentialIntakeForm.tsx");
    for (const source of [email, form, RESIDENTIAL_CONDITION_DISCLAIMER]) {
      expect(source.toLowerCase()).not.toMatch(/\$\d|fixed price|your price is/);
      expect(source.toLowerCase()).not.toContain("mold remediation");
    }
    expect(email).toContain("confirm scope and pricing");
    expect(email).toContain("No payment is due from this form");
  });
});
