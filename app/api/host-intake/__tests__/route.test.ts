/**
 * POST /api/host-intake — setup-request validation + full intake regression.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const createDraftHostCustomer = vi.fn();
const createSetupRequestHostCustomer = vi.fn();
const sendHostIntakeConfirmationEmail = vi.fn();
const sendHostIntakeInternalNotification = vi.fn();
const sendHostSetupRequestConfirmationEmail = vi.fn();
const sendHostSetupRequestInternalNotification = vi.fn();

vi.mock("@/lib/hostIntake/createDraftCustomer", () => ({
  createDraftHostCustomer: (...a: unknown[]) => createDraftHostCustomer(...a),
  createSetupRequestHostCustomer: (...a: unknown[]) =>
    createSetupRequestHostCustomer(...a),
}));

vi.mock("@/lib/email/sendHostIntakeEmails", () => ({
  sendHostIntakeConfirmationEmail: (...a: unknown[]) =>
    sendHostIntakeConfirmationEmail(...a),
  sendHostIntakeInternalNotification: (...a: unknown[]) =>
    sendHostIntakeInternalNotification(...a),
  sendHostSetupRequestConfirmationEmail: (...a: unknown[]) =>
    sendHostSetupRequestConfirmationEmail(...a),
  sendHostSetupRequestInternalNotification: (...a: unknown[]) =>
    sendHostSetupRequestInternalNotification(...a),
}));

import { POST } from "@/app/api/host-intake/route";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/host-intake", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const fullBody = {
  mode: "FULL",
  propertyAddress: "111 Thomson Drive",
  city: "Ludlow",
  bedrooms: "2",
  bathrooms: "2",
  accessType: "Lockbox",
  accessTypeOther: "",
  willSendAccessDetails: true,
  linenProvider: "Host provides",
  sameDayTurnovers: "No",
  propertyActiveSeasons: ["Summer"],
  preferredPaymentMethod: "Card",
  fullName: "Tiffany Mayo",
  email: "host@example.com",
  phone: "2039549764",
  bookingPlatforms: [],
  propertyAmenities: [],
  serviceTypes: [],
};

describe("POST /api/host-intake", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createDraftHostCustomer.mockResolvedValue({ customer: { id: "c1" } });
    createSetupRequestHostCustomer.mockResolvedValue({
      customer: { id: "c1" },
      property: null,
    });
    sendHostIntakeConfirmationEmail.mockResolvedValue({ sent: true });
    sendHostIntakeInternalNotification.mockResolvedValue({ sent: true });
    sendHostSetupRequestConfirmationEmail.mockResolvedValue({ sent: true });
    sendHostSetupRequestInternalNotification.mockResolvedValue({ sent: true });
  });

  it("rejects incomplete setup requests", async () => {
    const res = await POST(
      req({
        mode: "SETUP_REQUEST",
        fullName: "Tiffany",
        email: "not-an-email",
        phone: "",
        city: "",
        serviceInterest: "",
      })
    );
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(createSetupRequestHostCustomer).not.toHaveBeenCalled();
  });

  it("accepts a valid setup request and returns nextUrl with attribution", async () => {
    const res = await POST(
      req({
        mode: "SETUP_REQUEST",
        fullName: "Tiffany Mayo",
        email: "host@example.com",
        phone: "2039549764",
        city: "Ludlow",
        serviceInterest: "Vacation rental turnovers",
        attribution: {
          landing: "/hosts",
          utm_source: "property_card",
          utm_medium: "qr",
          utm_campaign: "host_referral",
          utm_content: "",
          first_touch_at: "2026-09-23T22:00:00.000Z",
        },
      })
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.mode).toBe("SETUP_REQUEST");
    expect(data.nextUrl).toContain("/vermont/host-intake");
    expect(data.nextUrl).toContain("utm_source=property_card");
    expect(data.nextUrl).toContain("email=host%40example.com");
    expect(createSetupRequestHostCustomer).toHaveBeenCalledOnce();
    expect(createDraftHostCustomer).not.toHaveBeenCalled();
  });

  it("still accepts a valid full intake", async () => {
    const res = await POST(req(fullBody));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.mode).toBe("FULL");
    expect(createDraftHostCustomer).toHaveBeenCalledOnce();
    expect(createSetupRequestHostCustomer).not.toHaveBeenCalled();
  });
});
