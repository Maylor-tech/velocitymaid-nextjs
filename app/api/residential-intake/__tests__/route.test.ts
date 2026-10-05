import { beforeEach, describe, expect, it, vi } from "vitest";

const createDraft = vi.fn();
const sendConfirm = vi.fn();
const sendInternal = vi.fn();
const notifyOps = vi.fn();

vi.mock("@/lib/residentialIntake/createDraftCustomer", () => ({
  createDraftResidentialCustomer: (...a: unknown[]) => createDraft(...a),
}));
vi.mock("@/lib/email/sendResidentialIntakeEmails", () => ({
  sendResidentialIntakeConfirmationEmail: (...a: unknown[]) => sendConfirm(...a),
  sendResidentialIntakeInternalNotification: (...a: unknown[]) =>
    sendInternal(...a),
}));
vi.mock("@/lib/notifications/residentialIntakeNotify", () => ({
  notifyResidentialIntakeReceived: (...a: unknown[]) => notifyOps(...a),
}));

import { POST } from "../route";

function payload(overrides: Record<string, unknown> = {}) {
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
    suppliesProvidedBy: "Customer supplies products",
    laundryRequested: false,
    bedMakingRequested: false,
    conditionFlags: ["visible_mold_mildew"],
    ...overrides,
  };
}

describe("POST /api/residential-intake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createDraft.mockResolvedValue({
      customer: { id: "cust-1", firstName: "Jordan", lastName: "Hale" },
      property: { id: "prop-1" },
      job: null,
    });
    sendConfirm.mockResolvedValue({ sent: true });
    sendInternal.mockResolvedValue({ sent: true });
    notifyOps.mockResolvedValue({
      type: "RESIDENTIAL_INTAKE",
      ok: true,
      created: true,
      id: "n1",
    });
  });

  it("rejects incomplete payloads", async () => {
    const res = await POST(
      new Request("http://localhost/api/residential-intake", {
        method: "POST",
        body: JSON.stringify(payload({ email: "" })),
      }) as never
    );
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
    expect(createDraft).not.toHaveBeenCalled();
  });

  it("creates records, never a Job, and still succeeds if email fails", async () => {
    sendConfirm.mockResolvedValue({ sent: false, skippedReason: "no key" });
    sendInternal.mockResolvedValue({ sent: false, skippedReason: "no key" });

    const res = await POST(
      new Request("http://localhost/api/residential-intake", {
        method: "POST",
        body: JSON.stringify(payload()),
      }) as never
    );
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.jobCreated).toBe(false);
    expect(json.paymentStatus).toBeNull();
    expect(json.opsAlert.type).toBe("RESIDENTIAL_INTAKE");
    expect(createDraft).toHaveBeenCalled();
  });
});
