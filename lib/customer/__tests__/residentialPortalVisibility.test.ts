import { describe, expect, it } from "vitest";
import { isJobAssignable } from "@/lib/billing/billingPolicy";
import { customerJobListWhere } from "../customerJobList";
import { resolveAuthenticatedBookingCta } from "../requestCleaningCta";

describe("residential portal + billing policy", () => {
  it("lists PENDING residential Jobs by service lifecycle only", () => {
    const where = customerJobListWhere("cust-home", "upcoming");
    expect(where).not.toHaveProperty("paymentStatus");
    expect(where).toMatchObject({
      customerId: "cust-home",
      status: { notIn: ["COMPLETED", "CANCELLED", "CANCELLED_EMERGENCY"] },
    });
  });

  it("keeps residential Request Cleaning off /book and host-only when only homes exist", () => {
    expect(
      resolveAuthenticatedBookingCta({
        propertyCount: 1,
        firstPropertyId: "prop-home",
        hostPropertyCount: 0,
        residentialPropertyCount: 1,
      })
    ).toEqual({
      href: "/customer/properties/prop-home/add-cleaning",
      label: "Request Cleaning",
      isHostCta: false,
    });
  });

  it("preserves host CTA when counts are omitted (existing host behavior)", () => {
    expect(
      resolveAuthenticatedBookingCta({
        propertyCount: 1,
        firstPropertyId: "prop-chipman",
      })
    ).toMatchObject({
      href: "/customer/properties/prop-chipman/add-cleaning",
      isHostCta: true,
    });
  });

  it("allows assignment for IAS residential Jobs while payment is PENDING", () => {
    expect(
      isJobAssignable({
        paymentStatus: "PENDING",
        billingPolicy: "INVOICE_AFTER_SERVICE",
      })
    ).toBe(true);
  });

  it("still requires payment before assignment for PREPAY residential Jobs", () => {
    expect(
      isJobAssignable({
        paymentStatus: "PENDING",
        billingPolicy: "PREPAY",
      })
    ).toBe(false);
  });
});
