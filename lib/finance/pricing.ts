/**
 * Job pricing input parameters
 */
export type JobPricingInput = {
  baseRate: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number | null;
  isDeepClean?: boolean;
  isMoveOut?: boolean;
  travelDistanceKm?: number | null;
};

/**
 * Job pricing configuration
 */
export type JobPricingConfig = {
  bedroomRate?: number;
  bathroomRate?: number;
  sqFtRate?: number;
  deepCleanMultiplier?: number;
  moveOutMultiplier?: number;
  travelRatePerKm?: number;
  maxTravelFee?: number;
  defaultDiscountRate?: number;
};

/**
 * Job pricing breakdown
 */
export type JobPricingBreakdown = {
  base: number;
  sizeAdjustment: number;
  typeAdjustment: number;
  travelFee: number;
  subtotal: number;
  discount: number;
  total: number;
};

/**
 * Default pricing configuration
 */
const DEFAULT_CONFIG: Required<JobPricingConfig> = {
  bedroomRate: 15,              // $15 per bedroom
  bathroomRate: 10,             // $10 per bathroom
  sqFtRate: 0.05,               // $0.05 per sq ft (if available)
  deepCleanMultiplier: 1.5,     // 50% increase for deep clean
  moveOutMultiplier: 1.3,       // 30% increase for move-out
  travelRatePerKm: 0.5,         // $0.50 per km
  maxTravelFee: 25,             // Max $25 travel fee
  defaultDiscountRate: 0,       // No default discount (can be set per customer)
};

/**
 * Calculate job price based on input parameters
 */
export function calculateJobPrice(
  input: JobPricingInput,
  config?: Partial<JobPricingConfig>
): JobPricingBreakdown {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Base price
  const base = input.baseRate;

  // Size adjustment
  let sizeAdjustment = 0;

  if (input.squareFeet && input.squareFeet > 0) {
    // Use square footage if available
    sizeAdjustment = input.squareFeet * cfg.sqFtRate;
  } else {
    // Fall back to bedroom/bathroom rates
    const bedrooms = input.bedrooms ?? 0;
    const bathrooms = input.bathrooms ?? 0;
    sizeAdjustment = bedrooms * cfg.bedroomRate + bathrooms * cfg.bathroomRate;
  }

  // Subtotal before type adjustments
  let subtotal = base + sizeAdjustment;

  // Type adjustments (multipliers)
  let typeAdjustment = 0;
  if (input.isDeepClean) {
    typeAdjustment = subtotal * (cfg.deepCleanMultiplier - 1);
    subtotal = subtotal * cfg.deepCleanMultiplier;
  } else if (input.isMoveOut) {
    typeAdjustment = subtotal * (cfg.moveOutMultiplier - 1);
    subtotal = subtotal * cfg.moveOutMultiplier;
  }

  // Travel fee
  let travelFee = 0;
  if (input.travelDistanceKm && input.travelDistanceKm > 0) {
    travelFee = Math.min(
      input.travelDistanceKm * cfg.travelRatePerKm,
      cfg.maxTravelFee
    );
  }

  // Final subtotal
  subtotal = subtotal + travelFee;

  // Discount (for recurring customers, etc.)
  const discount = subtotal * cfg.defaultDiscountRate;

  // Total
  const total = subtotal - discount;

  return {
    base: Math.round(base * 100) / 100,
    sizeAdjustment: Math.round(sizeAdjustment * 100) / 100,
    typeAdjustment: Math.round(typeAdjustment * 100) / 100,
    travelFee: Math.round(travelFee * 100) / 100,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
}

/**
 * Get recommended base rate for a service type
 */
export function getRecommendedBaseRate(serviceType?: string | null): number {
  // Default base rates by service type
  const rates: Record<string, number> = {
    'basic': 80,
    'deep': 120,
    'move-in': 150,
    'move-out': 150,
    'post-construction': 200,
    'recurring': 80,
  };

  if (!serviceType) {
    return rates['basic'] ?? 80;
  }

  const normalized = serviceType.toLowerCase().replace(/\s+/g, '-');
  return rates[normalized] ?? rates['basic'] ?? 80;
}
















