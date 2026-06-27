"use client";

import { useEffect, useState, Suspense } from 'react';
import { CheckCircle, Home, Sparkles, Star } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // You can verify the session here if needed
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vm-surface to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vm-navy mx-auto"></div>
          <p className="mt-4 text-vm-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vm-surface to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center space-x-2 text-vm-cyan-dark hover:text-vm-cyan-dark">
            <Sparkles className="w-6 h-6" />
            <span className="text-xl font-bold">VelocityMaid</span>
          </Link>
        </div>
      </header>

      {/* Success Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-vm-success mx-auto" />
          </div>
          <h1 className="text-4xl font-bold text-vm-text mb-4">Booking Confirmed! ✅</h1>
          <p className="text-xl text-vm-muted mb-6">
            Thank you for booking with VelocityMaid. Your payment has been processed successfully.
          </p>
          <p className="text-lg font-semibold text-vm-cyan-dark mb-6">
            We'll contact you within 24 hours to confirm your appointment.
          </p>
          {sessionId && (
            <p className="text-sm text-vm-muted mb-8">
              Order ID: {sessionId}
            </p>
          )}
          <div className="bg-vm-surface border border-vm-border rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-vm-text mb-3">What's Next?</h2>
            <ul className="space-y-2 text-vm-text">
              <li className="flex items-start">
                <span className="text-vm-cyan-dark mr-2">✓</span>
                <span>You'll receive a confirmation email shortly with all the details</span>
              </li>
              <li className="flex items-start">
                <span className="text-vm-cyan-dark mr-2">✓</span>
                <span>Our team will contact you within 24 hours to confirm your appointment</span>
              </li>
              <li className="flex items-start">
                <span className="text-vm-cyan-dark mr-2">✓</span>
                <span>If you have any questions, call us at (802) 733-5348</span>
              </li>
            </ul>
          </div>

          {/* Review Card */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-6 mb-8">
            <div className="flex items-center justify-center mb-4">
              <Star className="w-12 h-12 text-yellow-500" />
            </div>
            <h3 className="text-xl font-bold text-vm-text mb-2 text-center">
              Love Your Cleaning?
            </h3>
            <p className="text-vm-text mb-4 text-center">
              After your service, we'd love to hear about your experience!
            </p>
            <div className="text-center">
              <Link
                href="/review-us/new-jersey"
                className="inline-flex items-center gap-2 bg-vm-warning hover:bg-vm-warning text-white font-semibold px-6 py-3 rounded-lg transition"
              >
                <Star className="w-5 h-5" />
                Leave a Review
              </Link>
            </div>
          </div>

          <Link
            href="/"
            className="inline-flex items-center justify-center bg-vm-navy hover:bg-vm-navy text-white font-semibold py-3 px-8 rounded-lg transition"
          >
            <Home className="w-5 h-5 mr-2" />
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-vm-surface to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vm-navy mx-auto"></div>
          <p className="mt-4 text-vm-muted">Loading...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

