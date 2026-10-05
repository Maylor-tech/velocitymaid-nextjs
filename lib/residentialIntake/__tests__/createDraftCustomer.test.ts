import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ResidentialIntakePayload } from "../types";

const findUniqueBranch = vi.fn();
const findUniqueCustomer = vi.fn();
const createCustomer = vi.fn();
const updateCustomer = vi.fn();
const upsertPipelineLead = vi.fn();
const createOrUpdateProperty = vi.fn();
const geocodeCustomerInBackground = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    branch: { findUnique: (...a: unknown[]) => findUniqueBranch(...a) },
    customer: {
      findUnique: (...a: unknown[]) => findUniqueCustomer(...a),
      create: (...a: unknown[]) => createCustomer(...a),
      update: (...a: unknown[]) => updateCustomer(...a),
    },
    job: { create: vi.fn(), findMany: vi.fn() },
  },
}));

vi.mock("@/lib/leadCenter/syncFromCustomer", () => ({
  upsertPipelineLeadFromResidentialIntake: (...a: unknown[]) =>
    upsertPipelineLead(...a),
}));

vi.mock("@/lib/properties/residentialProfile", () => ({
  createOrUpdatePropertyFromResidentialIntake: (...a: unknown[]) =>
    createOrUpdateProperty(...a),
}));

vi.mock("@/lib/geocoding/geocodeCustomer", () => ({
  geocodeCustomerInBackground: (...a: unknown[]) =>
    geocodeCustomerInBackground(...a),
}));

import { createDraftResidentialCustomer } from "../createDraftCustomer";

function payload(
  overrides: Partial<ResidentialIntakePayload> = {}
): ResidentialIntakePayload {
  return {
    fullName: "Jordan Hale",
    email: "jordan@example.com",
    phone: "8025550100",
    serviceAddress: "12 Maple Street",
    city: "Middlebury",
    bedrooms: "1",
    bathrooms: "1",
    squareFootage: "700",
    serviceType: "Deep Clean",
    frequency: "One-time",
    preferredServiceDate: "2026-10-20",
    preferredContactMethod: "Email",
    pets: "",
    occupancyApprox: "2",
    accessParking: "",
    suppliesProvidedBy: "Customer supplies products",
    trashRequirements: "",
    laundryRequested: false,
    bedMakingRequested: false,
    lastProfessionalClean: "",
    specialInstructions: "",
    conditionFlags: ["heavy_grease"],
    conditionOther: "",
    ...overrides,
  };
}

describe("createDraftResidentialCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueBranch.mockResolvedValue({ id: "branch-vt" });
    createOrUpdateProperty.mockResolvedValue({ id: "prop-1" });
    upsertPipelineLead.mockResolvedValue({ id: "lead-1" });
  });

  it("creates a new PREPAY customer and never a Job", async () => {
    findUniqueCustomer.mockResolvedValue(null);
    createCustomer.mockResolvedValue({
      id: "cust-new",
      firstName: "Jordan",
      lastName: "Hale",
      billingPolicy: "PREPAY",
    });

    const result = await createDraftResidentialCustomer(payload());

    expect(createCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: "jordan@example.com",
          billingPolicy: "PREPAY",
          leadStatus: "INTAKE_RECEIVED",
          branchId: "branch-vt",
        }),
      })
    );
    expect(result.job).toBeNull();
    expect(result.property).toEqual({ id: "prop-1" });
    expect(upsertPipelineLead).toHaveBeenCalled();
  });

  it("updates an existing customer by email and preserves IAS billing", async () => {
    findUniqueCustomer.mockResolvedValue({
      id: "cust-host",
      lastName: "Existing",
      phone: "111",
      billingPolicy: "INVOICE_AFTER_SERVICE",
      leadStatus: "ACTIVE_CLIENT",
      branchId: "branch-vt",
    });
    updateCustomer.mockResolvedValue({
      id: "cust-host",
      firstName: "Jordan",
      lastName: "Existing",
      billingPolicy: "INVOICE_AFTER_SERVICE",
    });

    await createDraftResidentialCustomer(payload());

    expect(updateCustomer).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "cust-host" },
        data: expect.objectContaining({
          billingPolicy: "INVOICE_AFTER_SERVICE",
          leadStatus: "ACTIVE_CLIENT",
        }),
      })
    );
    expect(createCustomer).not.toHaveBeenCalled();
  });
});
