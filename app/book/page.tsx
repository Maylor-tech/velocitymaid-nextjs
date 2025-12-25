/**
 * 🚨 SOURCE OF TRUTH: PRIMARY BOOKING FLOW 🚨
 *
 * This is the ONLY booking flow used in production.
 * All booking logic, pricing, validation, and Stripe
 * integration must live here or be called from here.
 *
 * DO NOT modify /booking or legacy flows.
 * 
 * Route: /book
 * Components: components/booking/*
 */

'use client';

import React, { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BookingProvider } from '@/components/booking/BookingContext';
import BookingLayout from '@/components/booking/BookingLayout';
import ServiceStep from '@/components/booking/steps/ServiceStep';
import HomeDetailsStep from '@/components/booking/steps/HomeDetailsStep';
import DateTimeStep from '@/components/booking/steps/DateTimeStep';
import ExtrasStep from '@/components/booking/steps/ExtrasStep';
import ContactInfoStep from '@/components/booking/steps/ContactInfoStep';
import ReviewStep from '@/components/booking/steps/ReviewStep';
import ConfirmationStep from '@/components/booking/steps/ConfirmationStep';
import { useBooking } from '@/components/booking/BookingContext';
import { Loader2 } from 'lucide-react';

function BookingWizard() {
  const { step } = useBooking();

  const renderStep = () => {
    switch (step) {
      case 0:
        return <ServiceStep />;
      case 1:
        return <HomeDetailsStep />;
      case 2:
        return <DateTimeStep />;
      case 3:
        return <ExtrasStep />;
      case 4:
        return <ContactInfoStep />;
      case 5:
        return <ConfirmationStep />;
      default:
        return <ServiceStep />;
    }
  };

  return <BookingLayout>{renderStep()}</BookingLayout>;
}

function BookingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const branchSlug = searchParams.get('branch');
  const sessionId = searchParams.get('session_id');

  // If session_id is present, redirect to confirmation page
  React.useEffect(() => {
    if (sessionId) {
      router.replace(`/book/confirmation?session_id=${sessionId}`);
    }
  }, [sessionId, router]);

  // Don't render booking form if we're redirecting
  if (sessionId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <BookingProvider initialBranchSlug={branchSlug}>
      <BookingWizard />
    </BookingProvider>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <BookingPageContent />
    </Suspense>
  );
}

