'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { BookingDraft, BookingStep } from './types';

interface BookingContextType {
  data: BookingDraft;
  step: BookingStep;
  update: (updates: Partial<BookingDraft>) => void;
  nextStep: () => void;
  prevStep: () => void;
  setStep: (step: BookingStep) => void;
  submitBooking: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

const initialData: BookingDraft = {
  country: null, // Country must be selected first
  serviceType: null,
  branchSlug: null,
  contact: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  },
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
  },
  home: {
    bedrooms: 1,
    bathrooms: 1,
    sqft: null,
    pets: false,
  },
  schedule: {
    date: null,
    timeSlot: null,
    flexibility: 'FLEXIBLE',
  },
  extras: {
    insideFridge: false,
    insideOven: false,
    insideCabinets: false,
    windows: false,
    laundry: false,
    notes: '',
  },
};

interface BookingProviderProps {
  children: React.ReactNode;
  initialBranchSlug?: string | null;
}

export function BookingProvider({ children, initialBranchSlug }: BookingProviderProps) {
  const [data, setData] = useState<BookingDraft>({
    ...initialData,
    branchSlug: initialBranchSlug || null,
  });
  const [step, setStep] = useState<BookingStep>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = useCallback((updates: Partial<BookingDraft>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const nextStep = useCallback(() => {
    // Validate before moving to next step
    if (step === 0) {
      // Step 0: Context Selection - require country, branchSlug, and serviceType
      if (!data.country) {
        setError('Please select a country to continue.');
        return;
      }
      if (!data.branchSlug) {
        setError('Please select a location to continue.');
        return;
      }
      if (!data.serviceType) {
        setError('Please select a service type to continue.');
        return;
      }
    }
    
    // Clear any previous errors
    setError(null);
    setStep((prev) => Math.min(prev + 1, 5) as BookingStep);
  }, [step, data.country, data.branchSlug, data.serviceType]);

  const prevStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 0) as BookingStep);
  }, []);

  const submitBooking = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Form validation check with detailed logging
      console.log("Form validation check:");
      
      // Map data structure to user-friendly names
      const bookingData = {
        service: {
          serviceType: data.serviceType,
          branchSlug: data.branchSlug,
        },
        home: data.home,
        extras: data.extras,
        when: data.schedule,
        contact: data.contact,
      };
      
      console.log("Service:", bookingData.service);
      console.log("Home:", bookingData.home);
      console.log("Extras:", bookingData.extras);
      console.log("When:", bookingData.when);
      console.log("Contact:", bookingData.contact);
      
      // Check for missing required fields
      const missingFields: string[] = [];
      
      // Context validation (country and branch required)
      if (!data.country) {
        missingFields.push('Country');
      }
      if (!data.branchSlug) {
        missingFields.push('Location/Branch');
      }
      // Service validation
      if (!data.serviceType) {
        missingFields.push('Service Type');
      }
      
      // Home validation
      if (!data.home.bedrooms || data.home.bedrooms < 1) {
        missingFields.push('Bedrooms');
      }
      if (!data.home.bathrooms || data.home.bathrooms < 1) {
        missingFields.push('Bathrooms');
      }
      
      // Schedule validation
      if (!data.schedule.date) {
        missingFields.push('Date');
      }
      // TimeSlot is only required if flexibility is EXACT_TIME (not FLEXIBLE, MORNING, or AFTERNOON)
      if (data.schedule.flexibility === 'EXACT_TIME' && !data.schedule.timeSlot) {
        missingFields.push('Time Slot');
      }
      
      // Contact validation
      if (!data.contact.firstName || data.contact.firstName.trim() === '') {
        missingFields.push('First Name');
      }
      if (!data.contact.email || data.contact.email.trim() === '') {
        missingFields.push('Email');
      }
      if (!data.contact.phone || data.contact.phone.trim() === '') {
        missingFields.push('Phone');
      }
      
      console.log("Missing fields:", missingFields.length > 0 ? missingFields : 'None');
      
      // Throw error if critical fields are missing
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}. Please complete all steps.`);
      }
      
      // Additional check for critical required fields (backup validation)
      if (!data.country || !data.contact.firstName || !data.contact.email || !data.serviceType || !data.branchSlug) {
        throw new Error('Missing required fields. Please complete all steps.');
      }

      // First, get a quote to calculate the total price
      const quoteResponse = await fetch('/api/booking/quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceType: data.serviceType,
          branchSlug: data.branchSlug,
          home: data.home,
          schedule: data.schedule,
          extras: data.extras,
        }),
      });

      if (!quoteResponse.ok) {
        const errorData = await quoteResponse.json().catch(() => ({ errors: [] }));
        const errorMessage = errorData.errors?.[0]?.message || 'Failed to calculate price';
        throw new Error(errorMessage);
      }

      const { quote } = await quoteResponse.json();
      if (!quote || !quote.total) {
        throw new Error('Failed to calculate price');
      }

      // Map service type to checkout API format
      const serviceTypeMap: Record<string, string> = {
        'STANDARD': 'basic',
        'DEEP_CLEAN': 'deep',
        'MOVE_IN_OUT': 'moveInOut',
      };
      const mappedServiceType = serviceTypeMap[data.serviceType] || data.serviceType.toLowerCase();

      // Build address string
      const addressParts = [
        data.contact.streetAddress || data.address.street,
        data.contact.city || data.address.city,
        data.contact.state || data.address.state,
        data.contact.zip || data.address.zip,
      ].filter(Boolean);
      const addressString = addressParts.join(', ');

      // Map branch slug to service location
      const branchLocationMap: Record<string, string> = {
        'new-jersey': 'new_jersey',
        'vermont': 'vermont',
        'miami': 'miami',
        'port-antonio': 'port_antonio',
      };
      const serviceLocation = branchLocationMap[data.branchSlug] || data.branchSlug;

      // Prepare checkout payload in the format the API expects
      const checkoutPayload = {
        firstName: data.contact.firstName,
        lastInitial: data.contact.lastName?.[0] || '',
        phone: data.contact.phone || '',
        email: data.contact.email,
        address: addressString,
        serviceType: mappedServiceType,
        preferredDate: data.schedule.date,
        preferredTime: data.schedule.timeSlot,
        serviceLocation,
        addOns: {
          laundry: data.extras.laundry || false,
          windows: data.extras.windows || false,
          oven: data.extras.insideOven || false,
          refrigerator: data.extras.insideFridge || false,
        },
        specialInstructions: data.extras.notes || '',
        totalPrice: quote.total,
        zipCode: data.contact.zip || data.address.zip || null,
        branchSlug: data.branchSlug,
        currency: quote.currency || 'USD',
      };

      // Call checkout API to create Stripe session
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(checkoutPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to create checkout session' }));
        throw new Error(errorData.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (!url) {
        throw new Error('No checkout URL returned');
      }

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (err: any) {
      setError(err.message || 'Failed to submit booking. Please try again.');
      setLoading(false);
    }
  }, [data]);

  const value: BookingContextType = {
    data,
    step,
    update,
    nextStep,
    prevStep,
    setStep,
    submitBooking,
    loading,
    error,
  };

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking(): BookingContextType {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}
