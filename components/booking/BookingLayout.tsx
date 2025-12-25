'use client';

import React from 'react';
import { useBooking } from './BookingContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BookingLayoutProps {
  children: React.ReactNode;
}

export default function BookingLayout({ children }: BookingLayoutProps) {
  const { step, nextStep, prevStep, error } = useBooking();

  const steps = [
    'Service',
    'Home Details',
    'Date & Time',
    'Extras',
    'Contact Info',
    'Confirm',
  ];

  const canGoNext = step < 5;
  const canGoPrev = step > 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((label, index) => (
              <div key={index} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      index <= step
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center ${
                      index <= step ? 'text-blue-600 font-medium' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      index < step ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg shadow-sm p-6 md:p-8 mb-6">
          {children}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={!canGoPrev}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              canGoPrev
                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Previous
          </button>

          {canGoNext && (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
