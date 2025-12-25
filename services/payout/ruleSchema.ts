/**
 * Payout Rule Schema (v1 - LOCKED)
 * 
 * Defines the structure and validation for payout policy rules.
 * This schema is immutable - changes require a new version.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ConditionOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "exists";

export interface Condition {
  field: string;
  op: ConditionOperator;
  value?: any;
}

export interface WhenClause {
  all?: Condition[];
  any?: Condition[];
}

export type ApplyAction =
  | { type: "base_percent"; field: string; value: number }
  | { type: "flat_bonus"; value: number }
  | { type: "flat_bonus_if"; if: Condition; value: number }
  | { type: "penalty_if"; if: Condition; value: number }
  | { type: "min_total"; value: number }
  | { type: "cap_total"; value: number }
  | { type: "rounding"; mode: "nearest_cent" };

export interface PayoutRule {
  name: string;
  when?: WhenClause;
  apply: ApplyAction[];
  tags?: string[];
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates a single condition
 */
function validateCondition(condition: any): condition is Condition {
  if (!condition || typeof condition !== "object") {
    return false;
  }

  if (typeof condition.field !== "string" || condition.field.length === 0) {
    return false;
  }

  const validOps: ConditionOperator[] = ["=", "!=", ">", ">=", "<", "<=", "exists"];
  if (!validOps.includes(condition.op)) {
    return false;
  }

  // "exists" doesn't need a value
  if (condition.op !== "exists" && !("value" in condition)) {
    return false;
  }

  return true;
}

/**
 * Validates a when clause
 */
function validateWhenClause(when: any): when is WhenClause {
  if (!when || typeof when !== "object") {
    return false;
  }

  if ("all" in when) {
    if (!Array.isArray(when.all) || when.all.length === 0) {
      return false;
    }
    if (!when.all.every(validateCondition)) {
      return false;
    }
  }

  if ("any" in when) {
    if (!Array.isArray(when.any) || when.any.length === 0) {
      return false;
    }
    if (!when.any.every(validateCondition)) {
      return false;
    }
  }

  // Must have at least one of "all" or "any"
  if (!("all" in when) && !("any" in when)) {
    return false;
  }

  return true;
}

/**
 * Validates an apply action
 */
function validateApplyAction(action: any): action is ApplyAction {
  if (!action || typeof action !== "object" || typeof action.type !== "string") {
    return false;
  }

  switch (action.type) {
    case "base_percent":
      return (
        typeof action.field === "string" &&
        typeof action.value === "number" &&
        action.value >= 0 &&
        action.value <= 100
      );

    case "flat_bonus":
      return typeof action.value === "number";

    case "flat_bonus_if":
      return (
        validateCondition(action.if) &&
        typeof action.value === "number"
      );

    case "penalty_if":
      return (
        validateCondition(action.if) &&
        typeof action.value === "number"
      );

    case "min_total":
      return typeof action.value === "number" && action.value >= 0;

    case "cap_total":
      return typeof action.value === "number" && action.value >= 0;

    case "rounding":
      return action.mode === "nearest_cent";

    default:
      return false;
  }
}

/**
 * Validates a complete payout rule
 */
export function validateRule(rule: any): rule is PayoutRule {
  if (!rule || typeof rule !== "object") {
    return false;
  }

  // Name is required
  if (typeof rule.name !== "string" || rule.name.length === 0) {
    return false;
  }

  // When clause is optional but must be valid if present
  if (rule.when !== undefined && !validateWhenClause(rule.when)) {
    return false;
  }

  // Apply actions are required and must be non-empty
  if (!Array.isArray(rule.apply) || rule.apply.length === 0) {
    return false;
  }

  if (!rule.apply.every(validateApplyAction)) {
    return false;
  }

  // Tags are optional but must be string array if present
  if (rule.tags !== undefined) {
    if (!Array.isArray(rule.tags) || !rule.tags.every((t: any) => typeof t === "string")) {
      return false;
    }
  }

  return true;
}

/**
 * Validates an array of rules
 */
export function validateRules(rules: any[]): PayoutRule[] {
  const valid: PayoutRule[] = [];
  
  for (const rule of rules) {
    if (validateRule(rule)) {
      valid.push(rule);
    } else {
      console.warn("[PAYOUT_RULE] Invalid rule skipped:", {
        name: rule?.name || "unknown",
        reason: "Failed validation",
        rule,
      });
    }
  }

  return valid;
}















