/**
 * PHASE LOCK CONFIG
 * -----------------
 * Locked phases MUST NOT be modified without explicit unlock.
 */

export const PHASE_LOCK = {
  PHASE_1_MANUAL_ASSIGNMENT: true,
  PHASE_2A_PAYMENT_GATE: true,
  PHASE_2B_AUDIT_LOG: true,
  PHASE_2C_CLEANER_EARNINGS: true,

  // 🔓 Phase 3 unlocked
  PHASE_3_PAYOUT_ENGINE: false,
} as const;

/**
 * Guard utility for future phases
 */
export function assertPhaseUnlocked(
  phase: keyof typeof PHASE_LOCK,
  context?: string
) {
  if (PHASE_LOCK[phase]) {
    throw new Error(
      `🚫 ${phase} is LOCKED${context ? ` (${context})` : ""}`
    );
  }
}

