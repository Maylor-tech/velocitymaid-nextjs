import { roundMoney } from '@/lib/pricing/money';

export type ServiceCategory = 'RESIDENTIAL' | 'VACATION_RENTAL';
export type ManualCustomerMode = 'existing' | 'new';
export type ManualPriceMode = 'operational' | 'customer';

export const RESIDENTIAL_SERVICE_TYPES = [
  'Residential Maintenance Cleaning',
  'Residential Cleaning',
  'Standard Residential Cleaning',
  'Recurring Cleaning',
  'Deep Cleaning',
  'Deep Cleaning & Property Reset',
  'Move-In Cleaning',
  'Move-Out Cleaning',
  'Apartment Cleaning',
] as const;

export const VACATION_RENTAL_SERVICE_TYPES = [
  'Vacation Rental Turnover',
  'Same Day Vacation Rental Turnover',
  'Deep Cleaning & Property Reset',
  'Property Readiness',
  'Property Walkthrough',
  'Emergency Response Cleaning',
] as const;

export function isServiceCategory(value: unknown): value is ServiceCategory {
  return value === 'RESIDENTIAL' || value === 'VACATION_RENTAL';
}

export function serviceTypesFor(category: ServiceCategory): readonly string[] {
  return category === 'RESIDENTIAL'
    ? RESIDENTIAL_SERVICE_TYPES
    : VACATION_RENTAL_SERVICE_TYPES;
}

export function categoryForPropertyUse(useType: string | null | undefined): ServiceCategory {
  return useType === 'RESIDENTIAL' ? 'RESIDENTIAL' : 'VACATION_RENTAL';
}

/** Guest stay dates belong on vacation-rental visits. Residential jobs store none. */
export function guestDatesForCategory(
  category: ServiceCategory,
  checkIn: Date | null,
  checkOut: Date | null
): { guestCheckInDate: Date | null; guestCheckOutDate: Date | null } {
  if (category !== 'VACATION_RENTAL') {
    return { guestCheckInDate: null, guestCheckOutDate: null };
  }
  return { guestCheckInDate: checkIn, guestCheckOutDate: checkOut };
}

export type ProtectedManualPrice = {
  protected: boolean;
  customerPrice: number;
  operationalSubtotal: number;
  processingAllowanceEstimated: number;
  pricingPolicyVersion: string | null;
};

export type ResolvedManualPrice = {
  customerTotal: number;
  operationalTotal: number | null;
  processingAllowanceEstimated: number | null;
  pricingPolicyVersion: string | null;
};

/**
 * Customer-facing amounts are never grossed up.
 * Operational mode may apply processing protection and keeps the payout base separate.
 */
export function resolveManualJobPrice(input: {
  mode: ManualPriceMode;
  totalAmount: number;
  operationalAmount: number | null;
  protectedPrice: ProtectedManualPrice | null;
}): ResolvedManualPrice {
  if (input.mode === 'customer') {
    const customerTotal = roundMoney(input.totalAmount);
    const operationalTotal =
      input.operationalAmount != null
        ? roundMoney(input.operationalAmount)
        : customerTotal;
    return {
      customerTotal,
      operationalTotal,
      processingAllowanceEstimated: 0,
      pricingPolicyVersion: 'manual-customer-price',
    };
  }

  const protectedPrice = input.protectedPrice;
  if (!protectedPrice || !protectedPrice.protected) {
    return {
      customerTotal: roundMoney(input.totalAmount),
      operationalTotal: null,
      processingAllowanceEstimated: null,
      pricingPolicyVersion: null,
    };
  }

  return {
    customerTotal: protectedPrice.customerPrice,
    operationalTotal: protectedPrice.operationalSubtotal,
    processingAllowanceEstimated: protectedPrice.processingAllowanceEstimated,
    pricingPolicyVersion: protectedPrice.pricingPolicyVersion,
  };
}

export function stripTravelFeeNotes(notes: string): string {
  return notes
    .split("\n")
    .filter((line) => !line.includes("Travel Fee —"))
    .join("\n")
    .trim();
}

export type VisitDraft = {
  propertyId: string;
  propertyAddress: string;
  propertyCity: string;
  state: string;
  serviceCategory: ServiceCategory;
  serviceType: string;
  guestCheckInDate: string;
  guestCheckOutDate: string;
  priceMode: ManualPriceMode;
  customerPrice: string;
  operationalAmount: string;
  agreedPrice: number | null;
  travelFeeApplied: boolean;
  travelBannerDismissed: boolean;
  internalNotes: string;
};

export function emptyVisitDraft(notes = ""): VisitDraft {
  return {
    propertyId: "",
    propertyAddress: "",
    propertyCity: "",
    state: "",
    serviceCategory: "VACATION_RENTAL",
    serviceType: "",
    guestCheckInDate: "",
    guestCheckOutDate: "",
    priceMode: "operational",
    customerPrice: "",
    operationalAmount: "",
    agreedPrice: null,
    travelFeeApplied: false,
    travelBannerDismissed: false,
    internalNotes: stripTravelFeeNotes(notes),
  };
}

export function visitDraftFromProperty(
  property: {
    id: string;
    address: string;
    city?: string | null;
    state?: string | null;
    useType?: string | null;
    residentialServiceType?: string | null;
    agreedPrice?: number | null;
  },
  notes: string,
  fallbackState = ""
): VisitDraft {
  const draft = emptyVisitDraft(notes);
  const serviceCategory = categoryForPropertyUse(property.useType);
  const types = serviceTypesFor(serviceCategory);
  const profileService = property.residentialServiceType?.trim() || "";
  const agreed =
    property.agreedPrice != null && property.agreedPrice > 0 ? property.agreedPrice : null;
  const state = property.state === "VT" || property.state === "NJ" ? property.state : fallbackState;
  return {
    ...draft,
    propertyId: property.id,
    propertyAddress: property.address,
    propertyCity: property.city?.trim() || "",
    state,
    serviceCategory,
    serviceType: profileService && types.includes(profileService) ? profileService : "",
    priceMode: agreed != null ? "customer" : "operational",
    customerPrice: agreed != null ? String(agreed) : "",
    agreedPrice: agreed,
  };
}

export function priceWasOverridden(
  agreedPrice: number | null,
  customerTotal: number,
  mode: ManualPriceMode
): boolean {
  if (mode !== 'customer' || agreedPrice == null) return false;
  return roundMoney(agreedPrice) !== roundMoney(customerTotal);
}

export type ManualJobRequestInput = {
  customerMode: ManualCustomerMode;
  customerId?: string | null;
  propertyId?: string | null;
  clientFirstName: string;
  clientLastName?: string;
  clientEmail: string;
  clientPhone?: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  branch: string;
  serviceCategory: ServiceCategory;
  serviceType: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime?: string;
  guestCheckInDate?: string;
  guestCheckOutDate?: string;
  priceMode: ManualPriceMode;
  totalAmount: number;
  operationalAmount?: number | null;
  visitPriceOverride?: number | null;
  visitOperationalOverride?: number | null;
  priceOverrideReason?: string | null;
  paymentStatus: string;
  internalNotes?: string;
  marketLabel?: string;
};

/** Payload the manual form submits. Existing customers keep their real ids. */
export function buildManualJobRequest(input: ManualJobRequestInput) {
  const existing = input.customerMode === 'existing';
  return {
    customerMode: input.customerMode,
    customerId: existing ? input.customerId : undefined,
    propertyId: existing ? input.propertyId : undefined,
    clientFirstName: input.clientFirstName,
    clientLastName: input.clientLastName,
    clientEmail: input.clientEmail,
    clientPhone: input.clientPhone,
    propertyAddress: input.propertyAddress,
    propertyCity: input.propertyCity,
    propertyState: input.propertyState,
    branch: input.branch,
    serviceCategory: input.serviceCategory,
    serviceType: input.serviceType,
    scheduledDate: input.scheduledDate,
    scheduledStartTime: input.scheduledStartTime,
    scheduledEndTime: input.scheduledEndTime,
    guestCheckInDate:
      input.serviceCategory === 'VACATION_RENTAL' ? input.guestCheckInDate || undefined : undefined,
    guestCheckOutDate:
      input.serviceCategory === 'VACATION_RENTAL' ? input.guestCheckOutDate || undefined : undefined,
    priceInputMode: input.priceMode,
    totalAmount: input.totalAmount,
    operationalAmount:
      input.priceMode === 'customer' ? input.operationalAmount ?? undefined : undefined,
    paymentStatus: input.paymentStatus,
    ...(input.visitPriceOverride != null || input.visitOperationalOverride != null
      ? {
          ...(input.visitPriceOverride != null
            ? { visitPriceOverride: input.visitPriceOverride }
            : {}),
          ...(input.visitOperationalOverride != null
            ? { visitOperationalOverride: input.visitOperationalOverride }
            : {}),
          priceOverrideReason: input.priceOverrideReason?.trim() || undefined,
        }
      : {}),
    jobStatus: 'RECEIVED' as const,
    internalNotes: input.internalNotes,
    marketLabel: input.marketLabel,
  };
}
