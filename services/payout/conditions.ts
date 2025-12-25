/**
 * Condition Evaluation Helpers
 * 
 * Pure functions for evaluating rule conditions against job/payee context.
 * No side effects, no errors thrown.
 */

import { Condition, WhenClause } from "./ruleSchema";

// ============================================================================
// CONTEXT TYPE
// ============================================================================

export interface EvaluationContext {
  job: {
    id: string;
    totalPrice?: number | string | null;
    subtotal?: number | string | null;
    serviceType?: string | null;
    branchId?: string | null;
    [key: string]: any;
  };
  payee: {
    id: string;
    [key: string]: any;
  };
  branch?: {
    id: string;
    [key: string]: any;
  };
  [key: string]: any;
}

// ============================================================================
// FIELD RESOLUTION
// ============================================================================

/**
 * Resolves a dot-path field reference (e.g., "job.subtotal", "payee.id")
 * Returns undefined if field doesn't exist.
 */
export function resolveField(path: string, context: EvaluationContext): any {
  if (!path || typeof path !== "string") {
    return undefined;
  }

  const parts = path.split(".");
  if (parts.length === 0) {
    return undefined;
  }

  let current: any = context;

  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== "object") {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

// ============================================================================
// CONDITION EVALUATION
// ============================================================================

/**
 * Evaluates a single condition against the context.
 * Returns false if field is missing (safe failure).
 */
export function evaluateCondition(
  condition: Condition,
  context: EvaluationContext
): boolean {
  const fieldValue = resolveField(condition.field, context);

  // If field doesn't exist and operator is not "exists", condition fails
  if (fieldValue === undefined && condition.op !== "exists") {
    return false;
  }

  switch (condition.op) {
    case "exists":
      return fieldValue !== undefined && fieldValue !== null;

    case "=":
      // Loose equality for type flexibility
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

/**
 * Evaluates a when clause (all/any conditions).
 * Returns true if clause is empty (no conditions = always true).
 */
export function evaluateWhen(
  when: WhenClause | undefined,
  context: EvaluationContext
): boolean {
  // No when clause means always apply
  if (!when) {
    return true;
  }

  // Evaluate "all" conditions (AND)
  if (when.all && when.all.length > 0) {
    const allMatch = when.all.every((condition) =>
      evaluateCondition(condition, context)
    );
    if (!allMatch) {
      return false;
    }
  }

  // Evaluate "any" conditions (OR)
  if (when.any && when.any.length > 0) {
    const anyMatch = when.any.some((condition) =>
      evaluateCondition(condition, context)
    );
    if (!anyMatch) {
      return false;
    }
  }

  // If we have both "all" and "any", both must pass
  // If we only have one, that one must pass (already checked above)
  return true;
}















