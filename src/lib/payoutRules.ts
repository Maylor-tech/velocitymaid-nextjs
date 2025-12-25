export const PAYOUT_RULES = {
  cleanerPct: 0.65,
  platformPct: 0.35,
} as const;

export function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export function calcPayout(gross: number) {
  const cleanerAmount = round2(gross * PAYOUT_RULES.cleanerPct);
  const platformFee = round2(gross * PAYOUT_RULES.platformPct);
  // Optional: ensure totals tie out with rounding
  const total = round2(cleanerAmount + platformFee);
  const diff = round2(gross - total);
  // apply diff to platformFee to keep gross exact
  return {
    grossAmount: round2(gross),
    cleanerAmount,
    platformFee: round2(platformFee + diff),
    rulesVersion: "v1-65-35",
  };
}














