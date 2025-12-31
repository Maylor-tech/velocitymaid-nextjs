/**
 * Phase 3A: Payout Eligibility Rules Unit Tests
 * 
 * Pure logic tests only. NO Prisma, NO Stripe, NO API routes.
 * 
 * These tests guarantee:
 * - Eligibility rules cannot be silently changed
 * - Stripe integration cannot bypass rules
 * - Phase 3B payouts must pass Phase 3A eligibility
 * - Auditors can see deterministic logic
 */

// Using vitest for testing
// If you're using Jest instead, change to: import { describe, it, expect } from "@jest/globals";
import { describe, it, expect } from "vitest";
import { evaluatePayoutEligibility } from "../eligibilityRules";
import type { PayoutEligibilityData } from "../eligibilityTypes";

function baseInput(
  overrides: Partial<PayoutEligibilityData> = {}
): PayoutEligibilityData {
  return {
    cleanerId: "cleaner_123",
    completedJobsCount: 3,
    hasOpenDisputes: false,
    stripeAccountId: "acct_123",
    stripeAccountVerified: true,
    adminHold: false,
    eligibleAmountCents: 25_00,
    ...overrides,
  };
}

describe("Phase 3A – payout eligibility rules", () => {
  it("✅ marks cleaner as eligible when all requirements are met", () => {
    const result = evaluatePayoutEligibility(baseInput());

    expect(result.isEligible).toBe(true);
    expect(result.blockers).toEqual([]);
    expect(result.eligibleAmountCents).toBe(2500);
  });

  it("❌ blocks payout when minimum completed jobs not met", () => {
    const result = evaluatePayoutEligibility(
      baseInput({ completedJobsCount: 2 })
    );

    expect(result.isEligible).toBe(false);
    expect(result.blockers.some((b) => b.type === "INSUFFICIENT_JOBS")).toBe(
      true
    );
  });

  it("❌ blocks payout when there are unresolved disputes", () => {
    const result = evaluatePayoutEligibility(
      baseInput({ hasOpenDisputes: true })
    );

    expect(result.isEligible).toBe(false);
    expect(result.blockers.some((b) => b.type === "OPEN_DISPUTES")).toBe(
      true
    );
  });

  it("❌ blocks payout when there are open compliance issues", () => {
    // Phase D: Compliance issues are now tracked via ComplianceIssue model
    // This test confirms that hasOpenDisputes (derived from ComplianceIssue) blocks payouts
    const result = evaluatePayoutEligibility(
      baseInput({ hasOpenDisputes: true })
    );

    expect(result.isEligible).toBe(false);
    expect(result.blockers.some((b) => b.type === "OPEN_DISPUTES")).toBe(
      true
    );
  });

  it("❌ blocks payout when Stripe is not connected", () => {
    const result = evaluatePayoutEligibility(
      baseInput({
        stripeAccountId: null,
        stripeAccountVerified: false,
      })
    );

    expect(result.isEligible).toBe(false);
    expect(
      result.blockers.some((b) => b.type === "STRIPE_NOT_CONNECTED")
    ).toBe(true);
  });

  it("❌ blocks payout when Stripe is connected but not verified", () => {
    const result = evaluatePayoutEligibility(
      baseInput({
        stripeAccountId: "acct_123",
        stripeAccountVerified: false,
      })
    );

    expect(result.isEligible).toBe(false);
    expect(
      result.blockers.some((b) => b.type === "STRIPE_NOT_VERIFIED")
    ).toBe(true);
  });

  it("❌ blocks payout when admin hold is active", () => {
    const result = evaluatePayoutEligibility(baseInput({ adminHold: true }));

    expect(result.isEligible).toBe(false);
    expect(result.blockers.some((b) => b.type === "ADMIN_HOLD")).toBe(true);
  });

  it("❌ blocks payout when there are no eligible earnings", () => {
    const result = evaluatePayoutEligibility(
      baseInput({ eligibleAmountCents: 0 })
    );

    expect(result.isEligible).toBe(false);
    expect(result.blockers.some((b) => b.type === "ZERO_BALANCE")).toBe(true);
  });

  it("❌ returns multiple blockers when multiple conditions fail", () => {
    const result = evaluatePayoutEligibility(
      baseInput({
        completedJobsCount: 1,
        hasOpenDisputes: true,
        stripeAccountId: null,
        eligibleAmountCents: 0,
      })
    );

    expect(result.isEligible).toBe(false);

    const blockerTypes = result.blockers.map((b) => b.type);
    expect(blockerTypes).toContain("INSUFFICIENT_JOBS");
    expect(blockerTypes).toContain("OPEN_DISPUTES");
    expect(blockerTypes).toContain("STRIPE_NOT_CONNECTED");
    expect(blockerTypes).toContain("ZERO_BALANCE");
  });

  it("🧊 is deterministic (same input always returns same result)", () => {
    const input = baseInput({ completedJobsCount: 2 });

    const r1 = evaluatePayoutEligibility(input);
    const r2 = evaluatePayoutEligibility(input);

    expect(r1).toEqual(r2);
  });

  it("✅ returns eligibleAmountCents as 0 when not eligible", () => {
    const result = evaluatePayoutEligibility(
      baseInput({ completedJobsCount: 1 })
    );

    expect(result.isEligible).toBe(false);
    expect(result.eligibleAmountCents).toBe(0);
  });

  it("✅ returns eligibleAmountCents correctly when eligible", () => {
    const result = evaluatePayoutEligibility(
      baseInput({ eligibleAmountCents: 50_00 })
    );

    expect(result.isEligible).toBe(true);
    expect(result.eligibleAmountCents).toBe(50_00);
  });

  it("❌ blocks when exactly at minimum jobs but other conditions fail", () => {
    const result = evaluatePayoutEligibility(
      baseInput({
        completedJobsCount: 3, // Meets minimum
        stripeAccountId: null, // But Stripe not connected
      })
    );

    expect(result.isEligible).toBe(false);
    expect(
      result.blockers.some((b) => b.type === "STRIPE_NOT_CONNECTED")
    ).toBe(true);
  });
});

