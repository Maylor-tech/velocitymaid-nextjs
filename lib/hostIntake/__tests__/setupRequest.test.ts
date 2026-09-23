/**
 * Setup-request → full intake enrichment (mocked Prisma).
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HostIntakePayload } from "@/lib/hostIntake/types";

const findUniqueBranch = vi.fn();
const findUniqueCustomer = vi.fn();
const createCustomer = vi.fn();
const updateCustomer = vi.fn();
const upsertPipelineLeadFromIntake = vi.fn();
const upsertPipelineLeadFromSetupRequest = vi.fn();
const createOrUpdatePropertyFromHostIntake = vi.fn();
const geocodeCustomerInBackground = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    branch: { findUnique: (...a: unknown[]) => findUniqueBranch(...a) },
    customer: {
      findUnique: (...a: unknown[]) => findUniqueCustomer(...a),
      create: (...a: unknown[]) => createCustomer(...a),
      update: (...a: unknown[]) => updateCustomer(...a),
    },
  },
}));

vi.mock("@/lib/leadCenter/syncFromCustomer", () => ({
  upsertPipelineLeadFromIntake: (...a: unknown[]) =>
    upsertPipelineLeadFromIntake(...a),
  upsertPipelineLeadFromSetupRequest: (...a: unknown[]) =>
    upsertPipelineLeadFromSetupRequest(...a),
}));

vi.mock("@/lib/properties/propertyService", () => ({
  createOrUpdatePropertyFromHostIntake: (...a: unknown[]) =>
    createOrUpdatePropertyFromHostIntake(...a),
}));

vi.mock("@/lib/geocoding/geocodeCustomer", () => ({
  geocodeCustomerInBackground: (...a: unknown[]) =>
    geocodeCustomerInBackground(...a),
}));

import {
  createDraftHostCustomer,
  createSetupRequestHostCustomer,
} from "@/lib/hostIntake/createDraftCustomer";

const attribution = {
  landing: "/hosts",
  utm_source: "property_card",
  utm_medium: "qr",
  utm_campaign: "host_referral",
  utm_content: "",
  first_touch_at: "2026-09-23T22:00:00.000Z",
};

function fullPayload(overrides: Partial<HostIntakePayload> = {}): HostIntakePayload {
  return {
    propertyAddress: "111 Thomson Drive",
    city: "Ludlow",
    bedrooms: "2",
    bathrooms: "2",
    squareFootage: "",
    bedConfiguration: "",
    propertyAmenities: [],
    restrictedAreas: "",
    bookingPlatforms: ["Airbnb"],
    accessType: "Lockbox",
    accessTypeOther: "",
    willSendAccessDetails: true,
    guestCheckoutTime: "10:00 AM",
    guestCheckoutTimeOther: "",
    guestCheckinTime: "4:00 PM",
    guestCheckinTimeOther: "",
    supplyStorageLocation: "",
    trashBinLocation: "",
    serviceTypes: ["Vacation rental turnover"],
    turnoverFrequency: "",
    hasCleaner: "",
    linenProvider: "Host provides",
    sameDayTurnovers: "No",
    bookingAdvanceNotice: "",
    propertyActiveSeasons: ["Summer"],
    preferredPaymentMethod: "Card",
    specialInstructions: "Standing notes",
    fullName: "Tiffany Mayo",
    email: "host@example.com",
    phone: "2039549764",
    preferredContact: "",
    bestTimeToReach: "",
    attribution,
    mode: "FULL",
    ...overrides,
  };
}

describe("createSetupRequestHostCustomer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUniqueBranch.mockResolvedValue({ id: "branch-vt" });
    createOrUpdatePropertyFromHostIntake.mockResolvedValue({ id: "prop-1" });
    upsertPipelineLeadFromSetupRequest.mockResolvedValue({ id: "lead-1" });
    upsertPipelineLeadFromIntake.mockResolvedValue({ id: "lead-1" });
  });

  it("creates customer + pipeline lead without a Property", async () => {
    findUniqueCustomer.mockResolvedValue(null);
    createCustomer.mockResolvedValue({
      id: "cust-1",
      email: "host@example.com",
      firstName: "Tiffany",
      lastName: "Mayo",
      phone: "2039549764",
      leadStatus: "NEW",
    });

    const result = await createSetupRequestHostCustomer({
      mode: "SETUP_REQUEST",
      fullName: "Tiffany Mayo",
      email: "host@example.com",
      phone: "2039549764",
      city: "Ludlow",
      serviceInterest: "Vacation rental turnovers",
      attribution,
    });

    expect(createCustomer).toHaveBeenCalledOnce();
    expect(upsertPipelineLeadFromSetupRequest).toHaveBeenCalledOnce();
    expect(createOrUpdatePropertyFromHostIntake).not.toHaveBeenCalled();
    expect(result.property).toBeNull();
  });

  it("updates existing customer by email and does not create a second customer", async () => {
    findUniqueCustomer.mockResolvedValue({
      id: "cust-1",
      email: "host@example.com",
      firstName: "T",
      lastName: "M",
      phone: null,
      leadStatus: "NEW",
      branchId: "branch-vt",
      addressLine1: null,
      defaultAddress: null,
      city: null,
    });
    updateCustomer.mockResolvedValue({
      id: "cust-1",
      email: "host@example.com",
      firstName: "Tiffany",
      lastName: "Mayo",
      phone: "2039549764",
      leadStatus: "NEW",
    });

    await createSetupRequestHostCustomer({
      mode: "SETUP_REQUEST",
      fullName: "Tiffany Mayo",
      email: "host@example.com",
      phone: "2039549764",
      city: "Ludlow",
      serviceInterest: "Vacation rental turnovers",
      attribution,
    });

    expect(createCustomer).not.toHaveBeenCalled();
    expect(updateCustomer).toHaveBeenCalledOnce();
    expect(upsertPipelineLeadFromSetupRequest).toHaveBeenCalledOnce();
  });

  it("enriches the same customer on full intake and creates Property once", async () => {
    findUniqueCustomer.mockResolvedValue({
      id: "cust-1",
      email: "host@example.com",
      firstName: "Tiffany",
      lastName: "Mayo",
      phone: "2039549764",
      leadStatus: "NEW",
      branchId: "branch-vt",
    });
    updateCustomer.mockResolvedValue({
      id: "cust-1",
      email: "host@example.com",
      firstName: "Tiffany",
      lastName: "Mayo",
      phone: "2039549764",
      leadStatus: "INTAKE_RECEIVED",
    });

    await createDraftHostCustomer(fullPayload());

    expect(createCustomer).not.toHaveBeenCalled();
    expect(updateCustomer).toHaveBeenCalledOnce();
    expect(upsertPipelineLeadFromIntake).toHaveBeenCalledOnce();
    expect(createOrUpdatePropertyFromHostIntake).toHaveBeenCalledOnce();
    const intakeCall = upsertPipelineLeadFromIntake.mock.calls[0];
    expect(intakeCall[2].attribution?.utm_source).toBe("property_card");
  });
});
