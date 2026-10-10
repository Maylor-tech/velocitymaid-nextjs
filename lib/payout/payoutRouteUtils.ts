import { Prisma } from '@prisma/client';

export function asPolicyDetails(value: unknown): Prisma.JsonObject {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return { ...(value as Prisma.JsonObject) };
  }
  return {};
}

export function payoutErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function payoutAmountNumber(amount: Prisma.Decimal | number | string): number {
  return Number(amount);
}

/** Persist operator notes on policyEvalDetails — JobPayout has no executionNote column. */
export function mergeExecutionNote(
  existing: unknown,
  note: string | null | undefined,
  demoMode: boolean
): { policyEvalDetails: Prisma.JsonObject; executionNote: string | null } {
  const policyEvalDetails = asPolicyDetails(existing);
  const executionNote = demoMode ? `${note || ''} [DEMO MODE]` : note || null;
  if (executionNote) {
    policyEvalDetails.executionNote = executionNote;
  }
  return { policyEvalDetails, executionNote };
}
