/**
 * Payout Evaluator Tests
 * 
 * Minimal test cases for payout evaluation engine.
 */

import { describe, expect, it } from "vitest";
import { evaluatePayout } from "../evaluatePayout";
import { PayoutRule } from "../ruleSchema";
import type { Job, Payee, PolicyVersion, PolicyRule } from "../evaluatePayout";

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-123",
    totalPrice: 100,
    subtotal: 100,
    serviceType: "deep_clean",
    branchId: "branch-1",
    ...overrides,
  };
}

function createMockPayee(overrides: Partial<Payee> = {}): Payee {
  return {
    id: "payee-456",
    branchId: "branch-1",
    ...overrides,
  };
}

function createMockPolicyVersion(overrides: Partial<PolicyVersion> = {}): PolicyVersion {
  return {
    id: "policy-v1",
    name: "Test Policy",
    status: "published",
    ...overrides,
  };
}

function createMockRule(
  rule: PayoutRule,
  priority: number = 1,
  isActive: boolean = true
): PolicyRule {
  return {
    id: `rule-${priority}`,
    priority,
    isActive,
    rule,
  };
}

// ============================================================================
// TEST CASES
// ============================================================================

describe("evaluatePayout", () => {
  describe("Base percent only", () => {
    it("should calculate base percent correctly", () => {
      const job = createMockJob({ totalPrice: 100 });
      const payee = createMockPayee();
      const policyVersion = createMockPolicyVersion();

      const rules: PolicyRule[] = [
        createMockRule({
          name: "Base 65%",
          apply: [
            {
              type: "base_percent",
              field: "job.totalPrice",
              value: 65,
            },
          ],
        }),
      ];

      const result = evaluatePayout({
        job,
        payee,
        policyVersion,
        rules,
      });

      expect(result.totalAmount).toBe(65);
      expect(result.breakdown.base).toBe(65);
      expect(result.breakdown.bonuses).toEqual([]);
      expect(result.breakdown.penalties).toEqual([]);
      expect(result.policyEvalHash).toBeTruthy();
    });
  });

  describe("Bonus condition hit", () => {
    it("should apply conditional bonus when condition is met", () => {
      const job = createMockJob({
        totalPrice: 100,
        jobQualityScore: 95,
      });
      const payee = createMockPayee();
      const policyVersion = createMockPolicyVersion();

      const rules: PolicyRule[] = [
        createMockRule({
          name: "Base 65%",
          apply: [
            {
              type: "base_percent",
              field: "job.totalPrice",
              value: 65,
            },
          ],
        }),
        createMockRule(
          {
            name: "Quality bonus",
            apply: [
              {
                type: "flat_bonus_if",
                if: {
                  field: "job.jobQualityScore",
                  op: ">=",
                  value: 90,
                },
                value: 10,
              },
            ],
          },
          2
        ),
      ];

      const result = evaluatePayout({
        job,
        payee,
        policyVersion,
        rules,
      });

      expect(result.totalAmount).toBe(75); // 65 + 10
      expect(result.breakdown.bonuses).toEqual([10]);
      expect(result.breakdown.reasons.join("\n")).toContain("Conditional bonus");
    });

    it("should not apply bonus when condition is not met", () => {
      const job = createMockJob({
        totalPrice: 100,
        jobQualityScore: 85, // Below threshold
      });
      const payee = createMockPayee();
      const policyVersion = createMockPolicyVersion();

      const rules: PolicyRule[] = [
        createMockRule({
          name: "Base 65%",
          apply: [
            {
              type: "base_percent",
              field: "job.totalPrice",
              value: 65,
            },
          ],
        }),
        createMockRule(
          {
            name: "Quality bonus",
            apply: [
              {
                type: "flat_bonus_if",
                if: {
                  field: "job.jobQualityScore",
                  op: ">=",
                  value: 90,
                },
                value: 10,
              },
            ],
          },
          2
        ),
      ];

      const result = evaluatePayout({
        job,
        payee,
        policyVersion,
        rules,
      });

      expect(result.totalAmount).toBe(65); // No bonus
      expect(result.breakdown.bonuses).toEqual([]);
    });
  });

  describe("Cap enforced", () => {
    it("should enforce cap_total when exceeded", () => {
      const job = createMockJob({ totalPrice: 200 });
      const payee = createMockPayee();
      const policyVersion = createMockPolicyVersion();

      const rules: PolicyRule[] = [
        createMockRule({
          name: "Base 65%",
          apply: [
            {
              type: "base_percent",
              field: "job.totalPrice",
              value: 65,
            },
          ],
        }),
        createMockRule(
          {
            name: "Large bonus",
            apply: [
              {
                type: "flat_bonus",
                value: 50,
              },
            ],
          },
          2
        ),
        createMockRule(
          {
            name: "Cap at 150",
            apply: [
              {
                type: "cap_total",
                value: 150,
              },
            ],
          },
          3
        ),
      ];

      const result = evaluatePayout({
        job,
        payee,
        policyVersion,
        rules,
      });

      // Base: 200 * 0.65 = 130
      // Bonus: 50
      // Total before cap: 180
      // Cap: 150
      // Final: 150
      expect(result.totalAmount).toBe(150);
      expect(result.breakdown.capsApplied).toBe(true);
      expect(result.breakdown.reasons.join("\n")).toContain("Cap enforced");
    });
  });

  describe("Min total enforced", () => {
    it("should enforce min_total when below threshold", () => {
      const job = createMockJob({ totalPrice: 50 });
      const payee = createMockPayee();
      const policyVersion = createMockPolicyVersion();

      const rules: PolicyRule[] = [
        createMockRule({
          name: "Base 65%",
          apply: [
            {
              type: "base_percent",
              field: "job.totalPrice",
              value: 65,
            },
          ],
        }),
        createMockRule(
          {
            name: "Minimum 40",
            apply: [
              {
                type: "min_total",
                value: 40,
              },
            ],
          },
          2
        ),
      ];

      const result = evaluatePayout({
        job,
        payee,
        policyVersion,
        rules,
      });

      // Base: 50 * 0.65 = 32.5
      // Min: 40
      // Final: 40
      expect(result.totalAmount).toBe(40);
      expect(result.breakdown.reasons.join("\n")).toContain("Minimum total enforced");
    });
  });

  describe("Deterministic hash equality", () => {
    it("should produce identical hash for identical inputs", () => {
      const job = createMockJob({ totalPrice: 100 });
      const payee = createMockPayee();
      const policyVersion = createMockPolicyVersion();

      const rules: PolicyRule[] = [
        createMockRule({
          name: "Base 65%",
          apply: [
            {
              type: "base_percent",
              field: "job.totalPrice",
              value: 65,
            },
          ],
        }),
      ];

      const result1 = evaluatePayout({
        job,
        payee,
        policyVersion,
        rules,
      });

      const result2 = evaluatePayout({
        job,
        payee,
        policyVersion,
        rules,
      });

      expect(result1.policyEvalHash).toBe(result2.policyEvalHash);
      expect(result1.totalAmount).toBe(result2.totalAmount);
    });

    it("should produce different hash for different inputs", () => {
      const job1 = createMockJob({ totalPrice: 100 });
      const job2 = createMockJob({ totalPrice: 200 });
      const payee = createMockPayee();
      const policyVersion = createMockPolicyVersion();

      const rules: PolicyRule[] = [
        createMockRule({
          name: "Base 65%",
          apply: [
            {
              type: "base_percent",
              field: "job.totalPrice",
              value: 65,
            },
          ],
        }),
      ];

      const result1 = evaluatePayout({
        job: job1,
        payee,
        policyVersion,
        rules,
      });

      const result2 = evaluatePayout({
        job: job2,
        payee,
        policyVersion,
        rules,
      });

      expect(result1.policyEvalHash).not.toBe(result2.policyEvalHash);
    });
  });

  describe("Rounding", () => {
    it("should round to nearest cent", () => {
      const job = createMockJob({ totalPrice: 100 });
      const payee = createMockPayee();
      const policyVersion = createMockPolicyVersion();

      const rules: PolicyRule[] = [
        createMockRule({
          name: "Base 65%",
          apply: [
            {
              type: "base_percent",
              field: "job.totalPrice",
              value: 65,
            },
          ],
        }),
        createMockRule(
          {
            name: "Small bonus",
            apply: [
              {
                type: "flat_bonus",
                value: 0.333, // Will round
              },
            ],
          },
          2
        ),
        createMockRule(
          {
            name: "Round",
            apply: [
              {
                type: "rounding",
                mode: "nearest_cent",
              },
            ],
          },
          3
        ),
      ];

      const result = evaluatePayout({
        job,
        payee,
        policyVersion,
        rules,
      });

      // 65 + 0.333 = 65.333 → rounds to 65.33
      expect(result.totalAmount).toBe(65.33);
    });
  });

  describe("Edge cases", () => {
    it("should handle zero total price", () => {
      const job = createMockJob({ totalPrice: 0 });
      const payee = createMockPayee();
      const policyVersion = createMockPolicyVersion();

      const rules: PolicyRule[] = [
        createMockRule({
          name: "Base 65%",
          apply: [
            {
              type: "base_percent",
              field: "job.totalPrice",
              value: 65,
            },
          ],
        }),
      ];

      const result = evaluatePayout({
        job,
        payee,
        policyVersion,
        rules,
      });

      expect(result.totalAmount).toBe(0);
    });

    it("should skip inactive rules", () => {
      const job = createMockJob({ totalPrice: 100 });
      const payee = createMockPayee();
      const policyVersion = createMockPolicyVersion();

      const rules: PolicyRule[] = [
        createMockRule(
          {
            name: "Inactive bonus",
            apply: [
              {
                type: "flat_bonus",
                value: 50,
              },
            ],
          },
          1,
          false // Inactive
        ),
        createMockRule(
          {
            name: "Base 65%",
            apply: [
              {
                type: "base_percent",
                field: "job.totalPrice",
                value: 65,
              },
            ],
          },
          2,
          true
        ),
      ];

      const result = evaluatePayout({
        job,
        payee,
        policyVersion,
        rules,
      });

      expect(result.totalAmount).toBe(65); // No bonus applied
      expect(result.breakdown.bonuses).toEqual([]);
    });
  });
});

















