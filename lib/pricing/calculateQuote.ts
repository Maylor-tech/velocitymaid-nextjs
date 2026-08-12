import { BookingQuoteInput, BookingQuoteResult, PricingLineItem } from './types';
import { getBranchServicePricingConfig } from './config';
import { protectOperationalPrice } from './processingPolicy';
import { roundMoney } from './money';

export function calculateBookingQuote(
  input: BookingQuoteInput,
): { quote: BookingQuoteResult | null; errors: { field: string; message: string }[] } {
  const errors: { field: string; message: string }[] = [];

  // Validation
  if (!input.serviceType) {
    errors.push({ field: 'serviceType', message: 'Service type is required' });
  }

  if (!input.branchSlug) {
    errors.push({ field: 'branchSlug', message: 'Location is required' });
  }

  if (!input.home.bedrooms || input.home.bedrooms < 1) {
    errors.push({ field: 'home.bedrooms', message: 'At least 1 bedroom is required' });
  }

  if (!input.home.bathrooms || input.home.bathrooms < 1) {
    errors.push({ field: 'home.bathrooms', message: 'At least 1 bathroom is required' });
  }

  if (!input.schedule.date) {
    errors.push({ field: 'schedule.date', message: 'Date is required' });
  }

  if (!input.schedule.timeSlot) {
    errors.push({ field: 'schedule.timeSlot', message: 'Time slot is required' });
  }

  if (errors.length > 0) {
    return { quote: null, errors };
  }

  // Get configuration (this is async, but we'll handle it in the API)
  // For now, we'll use a synchronous approach with defaults
  // The API will await the config fetch
  return { quote: null, errors: [{ field: 'global', message: 'Configuration fetch required - use API endpoint' }] };
}

/**
 * Async version that fetches config from database
 */
export async function calculateBookingQuoteAsync(
  input: BookingQuoteInput,
): Promise<{ quote: BookingQuoteResult | null; errors: { field: string; message: string }[] }> {
  const errors: { field: string; message: string }[] = [];

  // Validation
  if (!input.serviceType) {
    errors.push({ field: 'serviceType', message: 'Service type is required' });
  }

  if (!input.branchSlug) {
    errors.push({ field: 'branchSlug', message: 'Location is required' });
  }

  if (!input.home.bedrooms || input.home.bedrooms < 1) {
    errors.push({ field: 'home.bedrooms', message: 'At least 1 bedroom is required' });
  }

  if (!input.home.bathrooms || input.home.bathrooms < 1) {
    errors.push({ field: 'home.bathrooms', message: 'At least 1 bathroom is required' });
  }

  if (!input.schedule.date) {
    errors.push({ field: 'schedule.date', message: 'Date is required' });
  }

  if (!input.schedule.timeSlot) {
    errors.push({ field: 'schedule.timeSlot', message: 'Time slot is required' });
  }

  if (input.serviceType === 'RECURRING') {
    const validFrequencies = new Set(['WEEKLY', 'BIWEEKLY', 'MONTHLY']);
    if (!input.frequency || !validFrequencies.has(input.frequency)) {
      errors.push({
        field: 'frequency',
        message: 'Please select a cleaning frequency (weekly, bi-weekly, or monthly) to get an accurate price.',
      });
    }
  }

  if (errors.length > 0) {
    return { quote: null, errors };
  }

  // Get configuration
  const { config, currency, branchId, error: pricingError } = await getBranchServicePricingConfig(
    input.branchSlug,
    input.serviceType
  );

  if (pricingError || !config) {
    return {
      quote: null,
      errors: [{ field: 'serviceType', message: pricingError ?? 'Pricing is not available for this service.' }],
    };
  }

  const lineItems: PricingLineItem[] = [];
  const warnings: string[] = [];

  const serviceLabels: Partial<Record<string, string>> = {
    DEEP_CLEAN: 'Deep Clean',
    MOVE_IN_OUT: 'Move In/Out',
    RECURRING: 'Recurring Cleaning',
    VACATION_RENTAL_TURNOVER: 'Vacation Rental Turnover',
    PROPERTY_WALKTHROUGH: 'Property Walkthrough',
    EMERGENCY_CLEAN: 'Emergency Clean',
  };

  let baseAmount = config.baseRate;
  if (input.serviceType === 'PROPERTY_WALKTHROUGH') {
    baseAmount = 75;
  }

  lineItems.push({
    key: 'base',
    label: `${serviceLabels[input.serviceType ?? ''] ?? 'Standard Cleaning'} (Base)`,
    amount: baseAmount,
    type: 'BASE',
  });

  if (input.serviceType === 'EMERGENCY_CLEAN') {
    lineItems.push({
      key: 'emergency_fee',
      label: 'Emergency Response Fee',
      amount: 75,
      type: 'FEE',
    });
  }

  // Bedrooms (beyond the first)
  const extraBedrooms = Math.max(0, input.home.bedrooms - 1);
  if (extraBedrooms > 0) {
    const bedroomsAmount = extraBedrooms * config.perBedroom;
    lineItems.push({
      key: 'bedrooms',
      label: `Additional Bedrooms (${extraBedrooms})`,
      amount: bedroomsAmount,
      type: 'ADDON',
    });
  }

  // Bathrooms (beyond the first)
  const extraBathrooms = Math.max(0, input.home.bathrooms - 1);
  if (extraBathrooms > 0) {
    const bathroomsAmount = extraBathrooms * config.perBathroom;
    lineItems.push({
      key: 'bathrooms',
      label: `Additional Bathrooms (${extraBathrooms})`,
      amount: bathroomsAmount,
      type: 'ADDON',
    });
  }

  // Square footage adjustment
  if (input.home.sqft && input.home.sqft > 0 && config.sqftThresholds) {
    let sqftMultiplier = 1.0;
    for (const threshold of config.sqftThresholds) {
      if (input.home.sqft <= threshold.upto) {
        sqftMultiplier = threshold.multiplier;
        break;
      }
    }
    // If sqft exceeds all thresholds, use the highest multiplier
    if (sqftMultiplier === 1.0 && config.sqftThresholds.length > 0) {
      sqftMultiplier = config.sqftThresholds[config.sqftThresholds.length - 1].multiplier;
    }

    if (sqftMultiplier > 1.0) {
      const currentSubtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
      const sqftAdjustment = currentSubtotal * (sqftMultiplier - 1.0);
      lineItems.push({
        key: 'sqft',
        label: `Square Footage Adjustment (${input.home.sqft.toLocaleString()} sq ft)`,
        amount: sqftAdjustment,
        type: 'ADDON',
      });
    }
  } else if (!input.home.sqft) {
    warnings.push('Approximate time – square footage not provided');
  }

  // Pets
  if (input.home.pets) {
    lineItems.push({
      key: 'pets',
      label: 'Pet Fee',
      amount: config.petFee,
      type: 'ADDON',
    });
  }

  // Extras
  if (input.extras.insideFridge) {
    lineItems.push({
      key: 'fridge',
      label: 'Inside Fridge',
      amount: config.extras.insideFridge,
      type: 'ADDON',
    });
  }

  if (input.extras.insideOven) {
    lineItems.push({
      key: 'oven',
      label: 'Inside Oven',
      amount: config.extras.insideOven,
      type: 'ADDON',
    });
  }

  if (input.extras.insideCabinets) {
    lineItems.push({
      key: 'cabinets',
      label: 'Inside Cabinets',
      amount: config.extras.insideCabinets,
      type: 'ADDON',
    });
  }

  if (input.extras.windows) {
    lineItems.push({
      key: 'windows',
      label: 'Windows',
      amount: config.extras.windows,
      type: 'ADDON',
    });
  }

  if (input.extras.laundry) {
    lineItems.push({
      key: 'laundry',
      label: 'Laundry',
      amount: config.extras.laundry,
      type: 'ADDON',
    });
  }

  // Travel fee
  if (config.travelFeeFlat > 0) {
    lineItems.push({
      key: 'travel',
      label: 'Travel Fee',
      amount: config.travelFeeFlat,
      type: 'FEE',
    });
  }

  // Calculate subtotal (before discounts and tax)
  const subtotal = lineItems.reduce((sum, item) => {
    if (item.type !== 'DISCOUNT' && item.type !== 'TAX') {
      return sum + item.amount;
    }
    return sum;
  }, 0);

  let discounts = 0;

  // Recurring plan discount — applied against the calculated standard clean
  // total (the same lineItems every other service type builds up above),
  // not a separate recurring price table. Monthly gets no discount, matching
  // the standard clean total exactly.
  if (input.serviceType === 'RECURRING' && input.frequency) {
    const RECURRING_DISCOUNT_RATES: Record<string, number> = {
      WEEKLY: 0.15,
      BIWEEKLY: 0.10,
      MONTHLY: 0,
    };
    const RECURRING_FREQUENCY_LABELS: Record<string, string> = {
      WEEKLY: 'Weekly',
      BIWEEKLY: 'Bi-Weekly',
      MONTHLY: 'Monthly',
    };
    const rate = RECURRING_DISCOUNT_RATES[input.frequency] ?? 0;
    if (rate > 0) {
      const discountAmount = subtotal * rate;
      discounts += discountAmount;
      lineItems.push({
        key: 'recurring_discount',
        label: `Recurring Plan Discount (${RECURRING_FREQUENCY_LABELS[input.frequency]})`,
        amount: -discountAmount,
        type: 'DISCOUNT',
      });
    }
  }

  // Promo code discount (placeholder logic)
  if (input.promoCode) {
    // Placeholder: $15 off for demo
    const discountAmount = 15;
    discounts += discountAmount;
    lineItems.push({
      key: 'promo',
      label: `Promo Code: ${input.promoCode}`,
      amount: -discountAmount,
      type: 'DISCOUNT',
    });
    warnings.push('Promo code discount is demo logic - will be validated in production');
  }

  // Tax
  const tax = (subtotal - discounts) * config.taxRate;
  if (tax > 0) {
    lineItems.push({
      key: 'tax',
      label: 'Tax',
      amount: tax,
      type: 'TAX',
    });
  }

  // Operational total (before processing protection)
  const operationalTotal = roundMoney(subtotal - discounts + tax);

  // Processing protection AFTER all billable components — never as a
  // customer-facing "card fee" line item.
  const protectedPrice = await protectOperationalPrice(operationalTotal);
  // Do NOT push pass-through/disabled warnings into customer-facing quote.warnings
  // (ReviewStep renders them). Admin observability is via Settings + job economics.

  const total = protectedPrice.customerPrice;

  // Time estimate
  let estimatedHours = config.minHours;
  estimatedHours += extraBedrooms * 0.5;
  estimatedHours += extraBathrooms * 0.5;

  if (input.extras.insideFridge) estimatedHours += 0.5;
  if (input.extras.insideOven) estimatedHours += 0.5;
  if (input.extras.insideCabinets) estimatedHours += 0.5;
  if (input.extras.windows) estimatedHours += 1.0;
  if (input.extras.laundry) estimatedHours += 0.5;

  // Apply service type multiplier to hours
  if (input.serviceType === 'DEEP_CLEAN') {
    estimatedHours *= 1.5;
  } else if (input.serviceType === 'MOVE_IN_OUT') {
    estimatedHours *= 1.3;
  } else if (input.serviceType === 'PROPERTY_WALKTHROUGH') {
    estimatedHours = 1;
  } else if (input.serviceType === 'VACATION_RENTAL_TURNOVER') {
    estimatedHours *= 1.1;
  }

  // Recommended cleaners
  let recommendedCleaners = 1;
  if (estimatedHours <= 3) {
    recommendedCleaners = 1;
  } else if (estimatedHours <= 6) {
    recommendedCleaners = 2;
  } else {
    recommendedCleaners = 3;
  }

  const quote: BookingQuoteResult = {
    currency,
    branchId,
    estimatedHours: Math.round(estimatedHours * 10) / 10, // Round to 1 decimal
    recommendedCleaners,
    subtotal: Math.round(subtotal * 100) / 100,
    discounts: Math.round(discounts * 100) / 100,
    fees: Math.round(config.travelFeeFlat * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total,
    operationalTotal: protectedPrice.operationalSubtotal,
    processingAllowanceEstimated: protectedPrice.processingAllowanceEstimated,
    pricingPolicyVersion: protectedPrice.pricingPolicyVersion,
    estimatedNetAfterProcessing: protectedPrice.protected
      ? protectedPrice.estimatedNetAfterProcessing
      : null,
    lineItems,
    warnings,
  };

  return { quote, errors: [] };
}

















