import type { ServiceType } from '../../components/booking/types';

export interface BookingQuoteInput {
  serviceType: ServiceType | null;
  branchSlug: string | null;
  home: {
    bedrooms: number;
    bathrooms: number;
    sqft?: number | null;
    pets?: boolean;
  };
  schedule: {
    date: string | null;      // ISO date (yyyy-mm-dd)
    timeSlot: string | null;  // '09:00-12:00' etc.
  };
  extras: {
    insideFridge: boolean;
    insideOven: boolean;
    insideCabinets: boolean;
    windows: boolean;
    laundry: boolean;
    notes?: string;
  };
  promoCode?: string | null;
}

export interface PricingLineItem {
  key: string;           // e.g. 'base', 'bedrooms', 'fridge'
  label: string;         // human readable
  amount: number;        // positive for charges, negative for discounts
  type: 'BASE' | 'ADDON' | 'DISCOUNT' | 'FEE' | 'TAX';
}

export interface BookingQuoteResult {
  currency: string;      // e.g. 'USD'
  branchId: string | null;
  estimatedHours: number;
  recommendedCleaners: number;
  subtotal: number;
  discounts: number;
  fees: number;
  tax: number;
  total: number;
  lineItems: PricingLineItem[];
  warnings: string[];
}















