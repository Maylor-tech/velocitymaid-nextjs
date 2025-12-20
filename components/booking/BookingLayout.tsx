'use client';

import React from 'react';
import { useBooking } from './BookingContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface BookingLayoutProps {
  children: React.ReactNode;
}

const stepLabels = ['Service', 'Home Details', 'Date & Time', 'Extras', 'Contact', 'Confirmation'];

export default function BookingLayout({ children }: BookingLayoutProps) {
  const { step, next, prev, canGoNext } = useBooking();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-sky-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Cleaning</h1>
          <p className="text-gray-600">Complete the form below to schedule your service</p>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            {stepLabels.map((label, index) => {
              const isActive = index === step;
              const isCompleted = index < step;
              const stepNum = index + 1;

              return (
                <React.Fragment key={index}>
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-colors ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? '✓' : stepNum}
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {index < stepLabels.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
          {children}
        </div>

        {/* Footer Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={prev}
              disabled={step === 0}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                step === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            <button
              onClick={next}
              disabled={!canGoNext}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                canGoNext
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {step === 5 ? 'Confirm & Continue' : 'Next'}
              {step < 5 && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

