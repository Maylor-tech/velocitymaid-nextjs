/**
 * Deterministic Payout Evaluator
 * 
 * Pure function that evaluates payout based on policy rules.
 * NO side effects, NO database writes, NO mutations.
 * Deterministic: same inputs → same output (including hash).
 */

import { createHash } from "crypto";
import { PayoutRule, validateRule } from "./ruleSchema";
import { EvaluationContext, evaluateWhen, resolveField } from "./conditions";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface Job {
  id: string;
  totalPrice?: number | string | null;
  subtotal?: number | string | null;
  serviceType?: string | null;
  branchId?: string | null;
  jobQualityScore?: number | null;
  [key: string]: any;
}

export interface Payee {
  id: string;
  branchId?: string | null;
  [key: string]: any;
}

export interface PolicyVersion {
  id: string;
  name: string;
  status: string;
}

export interface PolicyRule {
  id: string;
  priority: number;
  isActive: boolean;
  rule: PayoutRule; // JSON from database
}

export interface PayoutBreakdown {
  base: number;
  bonuses: number[];
  penalties: number[];
  capsApplied: boolean;
  reasons: string[];
}

export interface PayoutEvaluationResult {
  totalAmount: number;
  breakdown: PayoutBreakdown;
  policyEvalHash: string;
}

// ============================================================================
// MAIN EVALUATOR
// ============================================================================

/**
 * Evaluate payout based on policy rules
 * 
 * @param params - Evaluation parameters
 * @returns Payout evaluation result
 */
export function evaluatePayout({
  job,
  payee,
  policyVersion,
  rules,
}: {
  job: Job;
  payee: Payee;
  policyVersion: PolicyVersion;
  rules: PolicyRule[];
}): PayoutEvaluationResult {
  // Validate inputs
  if (!job || !payee || !policyVersion) {
    throw new Error("Missing required evaluation parameters");
  }

  if (policyVersion.status !== "published") {
    throw new Error(
      `Policy version ${policyVersion.id} is not published (status: ${policyVersion.status})`
    );
  }

  // Build evaluation context
  const context: EvaluationContext = {
    job: {
      id: job.id,
      totalPrice: job.totalPrice,
      subtotal: job.subtotal || job.totalPrice,
      serviceType: job.serviceType,
      branchId: job.branchId,
      ...job,
    },
    payee: {
      id: payee.id,
      branchId: payee.branchId,
      ...payee,
    },
  };

  // Start with base amount (gross job price)
  const grossAmount = job.totalPrice ? Number(job.totalPrice) : 0;
  let baseAmount = grossAmount;
  const bonuses: number[] = [];
  const penalties: number[] = [];
  const reasons: string[] = [];
  let capsApplied = false;

  // Sort rules by priority (ascending: lower number = higher priority)
  // Filter inactive and invalid rules
  const sortedRules = [...rules]
    .filter((r) => r.isActive && validateRule(r.rule))
    .sort((a, b) => a.priority - b.priority);

  // Track min/cap values (applied at the end)
  let minTotal: number | null = null;
  let capTotal: number | null = null;

  // Evaluate each rule in priority order
  for (const ruleRecord of sortedRules) {
    const rule = ruleRecord.rule;

    // Evaluate "when" clause (if present)
    if (rule.when) {
      const whenMatches = evaluateWhen(rule.when, context);
      if (!whenMatches) {
        continue; // Skip this rule
      }
    }

    // Apply actions sequentially
    for (const action of rule.apply) {
      try {
        const actionResult = applyAction(action, {
          context,
          baseAmount,
          bonuses,
          penalties,
          reasons,
          minTotal,
          capTotal,
        });

        // Update baseAmount if modified by base_percent
        if (actionResult?.newBaseAmount !== undefined) {
          baseAmount = actionResult.newBaseAmount;
        }

        // Update min/cap if set
        if (action.type === "min_total") {
          minTotal = action.value;
        } else if (action.type === "cap_total") {
          capTotal = action.value;
        }
      } catch (error: any) {
        console.warn(
          `[PAYOUT_EVAL] Rule ${ruleRecord.id} action ${action.type} failed:`,
          error.message
        );
        // Continue with next action
      }
    }
  }

  // Calculate intermediate total (before min/cap)
  const bonusTotal = bonuses.reduce((sum, b) => sum + b, 0);
  const penaltyTotal = penalties.reduce((sum, p) => sum + p, 0);
  let totalAmount = baseAmount + bonusTotal - penaltyTotal;

  // Apply min_total (if set)
  if (minTotal !== null && totalAmount < minTotal) {
    const adjustment = minTotal - totalAmount;
    bonuses.push(adjustment);
    reasons.push(`Minimum total enforced: $${minTotal.toFixed(2)}`);
    totalAmount = minTotal;
  }

  // Apply cap_total (if set)
  if (capTotal !== null && totalAmount > capTotal) {
    const excess = totalAmount - capTotal;
    penalties.push(excess);
    reasons.push(`Cap enforced: $${capTotal.toFixed(2)}`);
    totalAmount = capTotal;
    capsApplied = true;
  }

  // Apply rounding LAST (nearest cent)
  const roundingRule = sortedRules.find(
    (r) => r.rule.apply.some((a) => a.type === "rounding")
  );
  if (roundingRule) {
    totalAmount = Math.round(totalAmount * 100) / 100;
  } else {
    // Default: round to 2 decimal places
    totalAmount = Math.round(totalAmount * 100) / 100;
  }

  // Ensure non-negative
  totalAmount = Math.max(0, totalAmount);

  const breakdown: PayoutBreakdown = {
    base: baseAmount,
    bonuses: [...bonuses],
    penalties: [...penalties],
    capsApplied,
    reasons: [...reasons],
  };

  // Generate deterministic hash
  const policyEvalHash = generateHash({
    jobId: job.id,
    payeeId: payee.id,
    policyVersionId: policyVersion.id,
    totalAmount,
    breakdown,
  });

  return {
    totalAmount,
    breakdown,
    policyEvalHash,
  };
}

// ============================================================================
// ACTION APPLICATION
// ============================================================================

interface ActionContext {
  context: EvaluationContext;
  baseAmount: number;
  bonuses: number[];
  penalties: number[];
  reasons: string[];
  minTotal: number | null;
  capTotal: number | null;
}

interface ActionResult {
  newBaseAmount?: number;
}

function applyAction(
  action: PayoutRule["apply"][number],
  ctx: ActionContext
): ActionResult | void {
  switch (action.type) {
    case "base_percent": {
      const fieldValue = resolveField(action.field, ctx.context);
      const baseValue = fieldValue ? Number(fieldValue) : 0;
      const percentValue = action.value / 100;
      const newBase = baseValue * percentValue;
      ctx.reasons.push(
        `Base ${action.field} set to ${percentValue * 100}% = $${newBase.toFixed(2)}`
      );
      return { newBaseAmount: newBase };
    }

    case "flat_bonus": {
      ctx.bonuses.push(action.value);
      ctx.reasons.push(`Flat bonus: $${action.value.toFixed(2)}`);
      break;
    }

    case "flat_bonus_if": {
      const conditionMet = evaluateCondition(action.if, ctx.context);
      if (conditionMet) {
        ctx.bonuses.push(action.value);
        ctx.reasons.push(
          `Conditional bonus (${action.if.field} ${action.if.op} ${action.if.value}): $${action.value.toFixed(2)}`
        );
      }
      break;
    }

    case "penalty_if": {
      const conditionMet = evaluateCondition(action.if, ctx.context);
      if (conditionMet) {
        ctx.penalties.push(action.value);
        ctx.reasons.push(
          `Penalty (${action.if.field} ${action.if.op} ${action.if.value}): $${action.value.toFixed(2)}`
        );
      }
      break;
    }

    case "min_total":
    case "cap_total":
    case "rounding":
      // These are handled at the end
      break;

    default:
      console.warn(`[PAYOUT_EVAL] Unknown action type: ${(action as any).type}`);
  }
}

// ============================================================================
// CONDITION EVALUATION (delegates to conditions.ts)
// ============================================================================

function evaluateCondition(
  condition: { field: string; op: string; value?: any },
  context: EvaluationContext
): boolean {
  const fieldValue = resolveField(condition.field, context);

  if (fieldValue === undefined && condition.op !== "exists") {
    return false;
  }

  switch (condition.op) {
    case "exists":
      return fieldValue !== undefined && fieldValue !== null;

    case "=":
      return fieldValue == condition.value;

    case "!=":
      return fieldValue != condition.value;

    case ">":
      if (typeof fieldValue !== "number" || typeof condition.value !== "number") {
        return false;
      }
      return fieldValue > condition.value;

    case ">=":
      if (typeof fieldValue !== "number" || typeof condition.value !== "number") {
        return false;
      }
      return fieldValue >= condition.value;

    case "<":
      if (typeof fieldValue !== "number" || typeof condition.value !== "number") {
        return false;
      }
      return fieldValue < condition.value;

    case "<=":
      if (typeof fieldValue !== "number" || typeof condition.value !== "number") {
        return false;
      }
      return fieldValue <= condition.value;

    default:
      return false;
  }
}

// ============================================================================
// HASH GENERATION
// ============================================================================

/**
 * Generate deterministic SHA-256 hash of evaluation inputs and results
 */
function generateHash(inputs: {
  jobId: string;
  payeeId: string;
  policyVersionId: string;
  totalAmount: number;
  breakdown: PayoutBreakdown;
}): string {
  // Create a stable string representation
  const hashInput = JSON.stringify({
    jobId: inputs.jobId,
    payeeId: inputs.payeeId,
    policyVersionId: inputs.policyVersionId,
    totalAmount: inputs.totalAmount,
    breakdown: {
      base: inputs.breakdown.base,
      bonuses: inputs.breakdown.bonuses,
      penalties: inputs.breakdown.penalties,
      capsApplied: inputs.breakdown.capsApplied,
    },
  });

  return createHash("sha256").update(hashInput).digest("hex").substring(0, 16);
}
