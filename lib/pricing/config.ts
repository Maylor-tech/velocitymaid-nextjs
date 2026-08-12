import { prisma } from '../prisma';
import type { ServiceType } from '../../components/booking/types';

export interface BranchServicePricingConfig {
  baseRate: number;          // base price for a standard 1br/1ba job
  hourlyRate: number;        // if needed
  minHours: number;
  perBedroom: number;
  perBathroom: number;
  sqftThresholds?: { upto: number; multiplier: number }[];
  petFee: number;
  extras: {
    insideFridge: number;
    insideOven: number;
    insideCabinets: number;
    windows: number;
    laundry: number;
  };
  travelFeeFlat: number;
  taxRate: number;           // 0.00 – 0.15 etc
}

/**
 * Some BranchServicePackage rows predate the ServiceType enum and use a
 * legacy code that doesn't match it literally (e.g. New Jersey's "Basic
 * Clean" row is still coded BASIC_CLEAN, not STANDARD). Only add an alias
 * here when the underlying data genuinely uses a different code — never as
 * a substitute for a missing price.
 */
const SERVICE_TYPE_PACKAGE_CODE_ALIASES: Partial<Record<ServiceType, string>> = {
  STANDARD: 'BASIC_CLEAN',
  // Recurring is priced off the standard clean total, not a separate table —
  // see calculateQuote.ts, which applies the frequency discount downstream.
  RECURRING: 'BASIC_CLEAN',
};

/**
 * PROPERTY_WALKTHROUGH has always been priced independently of
 * config.baseRate — calculateBookingQuoteAsync() overrides baseAmount to a
 * flat $75 for it regardless of what this function returns. It's exempted
 * from the "no matching package" failure below so that behavior, which
 * already works today, isn't disturbed by this change.
 */
const SERVICE_TYPES_PRICED_ELSEWHERE = new Set<ServiceType>(['PROPERTY_WALKTHROUGH']);

/**
 * Get pricing configuration for a branch and service type
 * Falls back to sensible defaults if branch/config not found
 */
export async function getBranchServicePricingConfig(
  branchSlug: string | null,
  serviceType: ServiceType | null
): Promise<{
  config: BranchServicePricingConfig | null;
  currency: string;
  branchId: string | null;
  error?: string;
}> {
  let branchId: string | null = null;
  let currency = 'USD';

  // Try to fetch branch from database
  if (branchSlug) {
    try {
      const branch = await prisma.branch.findUnique({
        where: { slug: branchSlug },
        include: {
          PricingModel: true,
        },
      });

      if (branch) {
        branchId = branch.id;
        currency = branch.currency || 'USD';

        // If branch has a pricing model, use it
        if (branch.PricingModel) {
          let baseRate: number;

          if (serviceType && SERVICE_TYPES_PRICED_ELSEWHERE.has(serviceType)) {
            // Priced downstream in calculateQuote.ts; this value is never used.
            baseRate = 0;
          } else {
            const candidateCodes = [
              serviceType,
              serviceType ? SERVICE_TYPE_PACKAGE_CODE_ALIASES[serviceType] : undefined,
            ].filter((c): c is string => Boolean(c));

            const pkg = candidateCodes.length
              ? await prisma.branchServicePackage.findFirst({
                  where: {
                    branchId: branch.id,
                    code: { in: candidateCodes },
                    isActive: true,
                  },
                })
              : null;

            if (!pkg) {
              return {
                branchId,
                currency,
                config: null,
                error:
                  'No configured price for this service at this location. A manual quote is required — please contact support.',
              };
            }

            baseRate = Number(pkg.basePrice);
          }

          const minHours = branch.PricingModel.minHours || 2;
          const hourlyRate = Number(branch.PricingModel.extraHourRate || baseRate / minHours);

          return {
            branchId,
            currency,
            config: {
              baseRate,
              hourlyRate,
              minHours,
              perBedroom: 15,
              perBathroom: 10,
              sqftThresholds: [
                { upto: 1000, multiplier: 1.0 },
                { upto: 1500, multiplier: 1.1 },
                { upto: 2000, multiplier: 1.2 },
                { upto: 3000, multiplier: 1.3 },
              ],
              petFee: 10,
              extras: {
                insideFridge: 25,
                insideOven: 30,
                insideCabinets: 20,
                windows: 20,
                laundry: 15,
              },
              travelFeeFlat: 15,
              taxRate: 0.0, // Tax varies by location, default to 0
            },
          };
        }
      }
    } catch (error) {
      console.warn('Error fetching branch pricing config:', error);
    }
  }

  // Default configurations by branch slug
  const defaultConfigs: Record<string, BranchServicePricingConfig> = {
    'new-jersey': {
      baseRate: 120,
      hourlyRate: 40,
      minHours: 2,
      perBedroom: 15,
      perBathroom: 10,
      sqftThresholds: [
        { upto: 1000, multiplier: 1.0 },
        { upto: 1500, multiplier: 1.1 },
        { upto: 2000, multiplier: 1.2 },
        { upto: 3000, multiplier: 1.3 },
      ],
      petFee: 10,
      extras: {
        insideFridge: 25,
        insideOven: 30,
        insideCabinets: 20,
        windows: 20,
        laundry: 15,
      },
      travelFeeFlat: 15,
      taxRate: 0.06625, // NJ sales tax
    },
    vermont: {
      baseRate: 110,
      hourlyRate: 35,
      minHours: 2,
      perBedroom: 12,
      perBathroom: 8,
      sqftThresholds: [
        { upto: 1000, multiplier: 1.0 },
        { upto: 1500, multiplier: 1.1 },
        { upto: 2000, multiplier: 1.2 },
        { upto: 3000, multiplier: 1.3 },
      ],
      petFee: 8,
      extras: {
        insideFridge: 20,
        insideOven: 25,
        insideCabinets: 18,
        windows: 18,
        laundry: 12,
      },
      travelFeeFlat: 12,
      taxRate: 0.06,
    },
    'vermont-middlebury': {
      baseRate: 110,
      hourlyRate: 35,
      minHours: 2,
      perBedroom: 12,
      perBathroom: 8,
      sqftThresholds: [
        { upto: 1000, multiplier: 1.0 },
        { upto: 1500, multiplier: 1.1 },
        { upto: 2000, multiplier: 1.2 },
        { upto: 3000, multiplier: 1.3 },
      ],
      petFee: 8,
      extras: {
        insideFridge: 20,
        insideOven: 25,
        insideCabinets: 18,
        windows: 18,
        laundry: 12,
      },
      travelFeeFlat: 12,
      taxRate: 0.06,
    },
  };

  // Service type multipliers
  const serviceMultipliers: Partial<Record<ServiceType, number>> = {
    STANDARD: 1.0,
    DEEP_CLEAN: 1.5,
    MOVE_IN_OUT: 1.3,
    RECURRING: 1.0,
    VACATION_RENTAL_TURNOVER: 1.1,
    PROPERTY_WALKTHROUGH: 1.0,
    EMERGENCY_CLEAN: 1.2,
  };

  const pricingSlug =
    branchSlug?.startsWith('vermont') ? 'vermont' : branchSlug || 'new-jersey';

  const baseConfig =
    defaultConfigs[pricingSlug] || defaultConfigs['new-jersey'];
  const serviceMultiplier =
    serviceType && serviceMultipliers[serviceType]
      ? serviceMultipliers[serviceType]!
      : 1.0;

  // Apply service type multiplier to base rate
  const adjustedConfig: BranchServicePricingConfig = {
    ...baseConfig,
    baseRate: baseConfig.baseRate * serviceMultiplier,
  };

  return {
    branchId,
    currency,
    config: adjustedConfig,
  };
}















