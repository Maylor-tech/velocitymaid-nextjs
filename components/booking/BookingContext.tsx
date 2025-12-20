'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  BookingDraft,
  BookingStep,
  BookingContactInfo,
  BookingAddress,
  BookingHomeDetails,
  BookingSchedule,
  BookingExtras,
} from './types';

interface BookingContextValue {
  step: BookingStep;
  setStep: (step: BookingStep) => void;
  data: BookingDraft;
  update: (partial: Partial<BookingDraft>) => void;
  next: () => void;
  prev: () => void;
  canGoNext: boolean;
  submitBooking: () => Promise<void>;
  loading: boolean;
  error: string;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

const defaultContact: BookingContactInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  streetAddress: '',
  city: '',
  state: '',
  zip: '',
};

const defaultAddress: BookingAddress = {
  street: '',
  city: '',
  state: '',
  zip: '',
  apartment: '',
  entryNotes: '',
};

const defaultHome: BookingHomeDetails = {
  bedrooms: 1,
  bathrooms: 1,
  sqft: null,
  pets: false,
};

const defaultSchedule: BookingSchedule = {
  date: null,
  timeSlot: null,
  flexibility: 'FLEXIBLE',
};

const defaultExtras: BookingExtras = {
  insideFridge: false,
  insideOven: false,
  insideCabinets: false,
  windows: false,
  laundry: false,
  notes: '',
};

const defaultData: BookingDraft = {
  serviceType: null,
  branchSlug: null,
  contact: defaultContact,
  address: defaultAddress,
  home: defaultHome,
  schedule: defaultSchedule,
  extras: defaultExtras,
};

export function BookingProvider({ children, initialBranchSlug }: { children: ReactNode; initialBranchSlug?: string | null }) {
  const [step, setStep] = useState<BookingStep>(0);
  const [data, setData] = useState<BookingDraft>({
    ...defaultData,
    branchSlug: initialBranchSlug || null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = useCallback((partial: Partial<BookingDraft>) => {
    setData((prev) => ({ ...prev, ...partial }));
  }, []);

  const canGoNext = useCallback((): boolean => {
    switch (step) {
      case 0:
        return !!(data.serviceType && data.branchSlug);
      case 1:
        return data.home.bedrooms > 0 && data.home.bathrooms > 0;
      case 2:
        return !!(data.schedule.date && data.schedule.timeSlot);
      case 3:
        return true; // Extras step has no hard requirements
      case 4:
        // Contact step: require firstName and valid email
        const emailValid = /\S+@\S+\.\S+/.test(data.contact.email.trim());
        const firstNameOk = data.contact.firstName.trim().length > 0;
        return emailValid && firstNameOk;
      case 5:
        return true; // Review step is always valid
      default:
        return false;
    }
  }, [step, data]);

  const next = useCallback(() => {
    if (canGoNext() && step < 5) {
      setStep((s) => (s + 1) as BookingStep);
    }
  }, [step, canGoNext]);

  const prev = useCallback(() => {
    if (step > 0) {
      setStep((s) => (s - 1) as BookingStep);
    }
  }, [step]);

  const submitBooking = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // First, get the quote/estimate
      const quoteResponse = await fetch("/api/booking/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceType: data.serviceType,
          branchSlug: data.branchSlug,
          home: data.home,
          schedule: data.schedule,
          extras: data.extras,
        }),
      });

      const quoteResult = await quoteResponse.json();
      
      if (!quoteResponse.ok || !quoteResult.success || !quoteResult.quote) {
        setError(quoteResult.errors?.[0]?.message || "Failed to calculate estimate. Please try again.");
        setLoading(false);
        return;
      }

      const quote = quoteResult.quote;
      const estimate = {
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        lineItems: quote.lineItems.map((item: any) => ({
          label: item.label,
          amount: item.amount,
        })),
        estimatedHours: quote.estimatedHours,
        recommendedCleaners: quote.recommendedCleaners,
      };

      // 🚨 PAYMENT-FIRST FLOW: Start Stripe checkout instead of creating job directly
      const serviceLabel = data.serviceType ? (data.serviceType === 'STANDARD' ? 'Standard Cleaning' : data.serviceType === 'DEEP_CLEAN' ? 'Deep Clean' : 'Move In / Out') : 'Standard Cleaning';
      
      console.log("[BOOKING] Starting Stripe checkout with booking data:", {
        branchSlug: data.branchSlug,
        service: serviceLabel,
        estimateTotal: estimate.total,
      });

      // Prepare booking data to pass through Stripe metadata
      const bookingData = {
        service: {
          label: serviceLabel,
          type: data.serviceType,
        },
        home: {
          bedrooms: data.home.bedrooms,
          bathrooms: data.home.bathrooms,
          squareFeet: data.home.sqft,
        },
        extras: Object.entries(data.extras)
          .filter(([key, value]) => key !== 'notes' && value === true)
          .map(([key]) => ({
            id: key,
            label: key === 'insideFridge' ? 'Inside Fridge' : 
                   key === 'insideOven' ? 'Inside Oven' :
                   key === 'insideCabinets' ? 'Inside Cabinets' :
                   key === 'windows' ? 'Windows' :
                   key === 'laundry' ? 'Laundry' : key,
          })),
        when: {
          date: data.schedule.date,
          time: data.schedule.timeSlot,
        },
        contact: {
          firstName: data.contact.firstName,
          lastName: data.contact.lastName,
          email: data.contact.email,
          phone: data.contact.phone,
          streetAddress: data.contact.streetAddress || data.address.street,
          city: data.contact.city || data.address.city,
          state: data.contact.state || data.address.state,
          zip: data.contact.zip || data.address.zip,
        },
        estimate,
        branchSlug: data.branchSlug,
      };

      // Start Stripe checkout - job will be created AFTER payment succeeds
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchSlug: data.branchSlug,
          bookingData,
        }),
      });

      const checkoutResult = await checkoutRes.json();
      
      console.log("[BOOKING] Checkout API Response:", {
        ok: checkoutRes.ok,
        status: checkoutRes.status,
        hasUrl: !!checkoutResult.url,
      });

      if (!checkoutRes.ok || !checkoutResult.url) {
        console.error("[BOOKING] Checkout failed:", checkoutResult.error);
        setError(checkoutResult.error || "Failed to start checkout. Please try again.");
        setLoading(false);
        return;
      }

      console.log("[BOOKING] ✅ Redirecting to Stripe checkout...");
      
      // Redirect to Stripe checkout
      window.location.href = checkoutResult.url;
    } catch (err: any) {
      console.error("Booking submission error:", err);
      setError(err.message || "Unexpected server error.");
      setLoading(false);
    }
  }, [data]);

  const value: BookingContextValue = {
    step,
    setStep,
    data,
    update,
    next,
    prev,
    canGoNext: canGoNext(),
    submitBooking,
    loading,
    error,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextValue {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return context;
}

