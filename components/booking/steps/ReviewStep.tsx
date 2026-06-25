'use client';

import React, { useState } from 'react';
import { useBooking } from '../BookingContext';
import { Check, Loader2, AlertCircle, Calculator, Mail, CheckCircle } from 'lucide-react';
import type { BookingQuoteResult } from '@/lib/pricing/types';

const serviceTypeLabels: Record<string, string> = {
  STANDARD: 'Standard Cleaning',
  DEEP_CLEAN: 'Deep Clean',
  MOVE_IN_OUT: 'Move In / Out',
};

const branchLabels: Record<string, string> = {
  'new-jersey': 'New Jersey – Newark',
  vermont: 'Vermont – Ludlow',
  miami: 'Miami',
};

const flexibilityLabels: Record<string, string> = {
  FLEXIBLE: 'Flexible',
  EXACT_TIME: 'Exact time preferred',
  MORNING: 'Morning preferred',
  AFTERNOON: 'Afternoon preferred',
};

export default function ReviewStep() {
  const { data, paymentConfig } = useBooking();
  const depositMode = paymentConfig.depositMode;
  const depositAmount = String(paymentConfig.depositDollars);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<BookingQuoteResult | null>(null);
  const [sendLoading, setSendLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentOnce, setSentOnce] = useState(false);

  const handleGetQuote = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/booking/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: data.serviceType,
          branchSlug: data.branchSlug,
          home: data.home,
          schedule: data.schedule,
          extras: data.extras,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success && result.quote) {
        setQuote(result.quote);
        setError(null);
      } else {
        const errorMessage =
          result.errors && result.errors.length > 0
            ? result.errors[0].message
            : 'Failed to calculate quote. Please check your booking details.';
        setError(errorMessage);
        setQuote(null);
      }
    } catch (err: any) {
      console.error('Error fetching quote:', err);
      setError('Failed to calculate quote. Please try again.');
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDateLabel = (dateStr: string | null, timeSlot: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const dateLabel = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
    if (timeSlot) {
      const [start] = timeSlot.split('-');
      const [h, m] = start.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${dateLabel} at ${displayHour}:${m} ${ampm}`;
    }
    return dateLabel;
  };

  async function handleSendEstimate() {
    if (!quote) {
      setSendError('Please get a price estimate first.');
      return;
    }

    // Validate email from contact info
    const customerEmail = data.contact?.email?.trim() || null;
    const emailValid = customerEmail && /\S+@\S+\.\S+/.test(customerEmail);
    
    if (!emailValid) {
      setSendError('Email address is required to send the estimate. Please complete the Contact Information step first.');
      return;
    }

    setSendLoading(true);
    setSendError(null);

    try {
      const estimate = {
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        lineItems: quote.lineItems.map((item) => ({
          label: item.label,
          amount: item.amount,
        })),
        estimatedHours: quote.estimatedHours,
        recommendedCleaners: quote.recommendedCleaners,
      };

      const bookingMeta = {
        serviceDateLabel: formatDateLabel(data.schedule.date, data.schedule.timeSlot),
        serviceAddress: data.contact.streetAddress 
          ? `${data.contact.streetAddress}${data.contact.city ? `, ${data.contact.city}` : ''}${data.contact.state ? `, ${data.contact.state}` : ''} ${data.contact.zip || ''}`.trim()
          : data.address.street 
          ? `${data.address.street}${data.address.apartment ? `, ${data.address.apartment}` : ''}, ${data.address.city}, ${data.address.state} ${data.address.zip}`.trim()
          : null,
        branchName: data.branchSlug ? branchLabels[data.branchSlug] || null : null,
        customerId: null, // Will be set by backend after customer upsert
        tempQuoteId: null,
      };

      const res = await fetch('/api/booking/send-estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: {
            firstName: data.contact.firstName,
            lastName: data.contact.lastName,
            email: customerEmail,
            phone: data.contact.phone,
            streetAddress: data.contact.streetAddress,
            city: data.contact.city,
            state: data.contact.state,
            zip: data.contact.zip,
          },
          estimate,
          bookingMeta,
          currency: quote.currency || 'USD',
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || 'Failed to send estimate');
      }

      setSentOnce(true);
      setSendError(null);
    } catch (err: any) {
      console.error('Send estimate error:', err);
      setSendError(err.message || 'Failed to send estimate. Please try again.');
    } finally {
      setSendLoading(false);
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Not selected';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeSlot = (timeSlot: string | null) => {
    if (!timeSlot) return 'Not selected';
    const [start, end] = timeSlot.split('-');
    const formatTime = (t: string) => {
      const [h, m] = t.split(':');
      const hour = parseInt(h);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${m} ${ampm}`;
    };
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const selectedExtras = Object.entries(data.extras)
    .filter(([key, value]) => key !== 'notes' && value === true)
    .map(([key]) => {
      const labels: Record<string, string> = {
        insideFridge: 'Inside Fridge',
        insideOven: 'Inside Oven',
        insideCabinets: 'Inside Cabinets',
        windows: 'Windows',
        laundry: 'Laundry',
      };
      return labels[key] || key;
    });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-vm-text mb-2">Review Your Booking</h2>
        <p className="text-vm-muted">Please review all details before confirming</p>
      </div>

      <div className="space-y-4">
        {/* Service & Location */}
        <div className="border border-vm-border rounded-lg p-4">
          <h3 className="font-semibold text-vm-text mb-2">Service & Location</h3>
          <div className="space-y-1 text-sm text-vm-muted">
            <p>
              <span className="font-medium">Service:</span>{' '}
              {data.serviceType ? serviceTypeLabels[data.serviceType] : 'Not selected'}
            </p>
            <p>
              <span className="font-medium">Location:</span>{' '}
              {data.branchSlug ? branchLabels[data.branchSlug] || data.branchSlug : 'Not selected'}
            </p>
          </div>
        </div>

        {/* Home Details */}
        <div className="border border-vm-border rounded-lg p-4">
          <h3 className="font-semibold text-vm-text mb-2">Home Details</h3>
          <div className="space-y-1 text-sm text-vm-muted">
            <p>
              <span className="font-medium">Bedrooms:</span> {data.home.bedrooms}
            </p>
            <p>
              <span className="font-medium">Bathrooms:</span> {data.home.bathrooms}
            </p>
            {data.home.sqft && (
              <p>
                <span className="font-medium">Square Footage:</span> {data.home.sqft.toLocaleString()} sq ft
              </p>
            )}
            <p>
              <span className="font-medium">Pets:</span> {data.home.pets ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        {/* Schedule */}
        <div className="border border-vm-border rounded-lg p-4">
          <h3 className="font-semibold text-vm-text mb-2">Schedule</h3>
          <div className="space-y-1 text-sm text-vm-muted">
            <p>
              <span className="font-medium">Date:</span> {formatDate(data.schedule.date)}
            </p>
            <p>
              <span className="font-medium">Time:</span> {formatTimeSlot(data.schedule.timeSlot)}
            </p>
            <p>
              <span className="font-medium">Flexibility:</span>{' '}
              {flexibilityLabels[data.schedule.flexibility] || data.schedule.flexibility}
            </p>
          </div>
        </div>

        {/* Extras */}
        {selectedExtras.length > 0 && (
          <div className="border border-vm-border rounded-lg p-4">
            <h3 className="font-semibold text-vm-text mb-2">Additional Services</h3>
            <ul className="space-y-1">
              {selectedExtras.map((extra, index) => (
                <li key={index} className="flex items-center gap-2 text-sm text-vm-muted">
                  <Check className="w-4 h-4 text-green-600" />
                  {extra}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Special Instructions */}
        {data.extras.notes && (
          <div className="border border-vm-border rounded-lg p-4">
            <h3 className="font-semibold text-vm-text mb-2">Special Instructions</h3>
            <p className="text-sm text-vm-muted whitespace-pre-wrap">{data.extras.notes}</p>
          </div>
        )}
      </div>

      {/* What Happens Next */}
      <div className="mt-6 border-2 border-blue-100 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-vm-text mb-3">What happens next</h3>
        <ul className="space-y-2 text-sm text-vm-text">
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>You'll complete secure payment</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>We'll confirm your booking</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>A vetted cleaner will be assigned</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>You'll receive updates by email or SMS</span>
          </li>
        </ul>
      </div>

      {/* Pricing Section */}
      <div className="mt-6">
        {!quote && (
          <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-vm-text mb-1">Get Price Estimate</h3>
                <p className="text-sm text-vm-muted">Click below to see your estimated total</p>
              </div>
            </div>
            <button
              onClick={handleGetQuote}
              disabled={loading}
              className="w-full md:w-auto px-6 py-3 bg-vm-navy text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  Get Price Estimate
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Unable to calculate quote</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {quote && (
          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6 mt-4">
            <h3 className="text-lg font-semibold text-vm-text mb-4">Price Estimate</h3>

            {/* Line Items Summary */}
            {quote.lineItems.length > 0 && (
              <div className="mb-4 space-y-2">
                {quote.lineItems
                  .filter((item) => item.type !== 'TAX' && item.type !== 'DISCOUNT')
                  .slice(0, 5)
                  .map((item) => (
                    <div key={item.key} className="flex justify-between text-sm">
                      <span className="text-vm-muted">{item.label}</span>
                      <span className="text-vm-text font-medium">
                        {formatCurrency(item.amount, quote.currency)}
                      </span>
                    </div>
                  ))}
                {quote.lineItems.length > 5 && (
                  <p className="text-xs text-vm-muted pt-2">
                    + {quote.lineItems.length - 5} more items
                  </p>
                )}
              </div>
            )}

            {/* Discounts */}
            {quote.discounts > 0 && (
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-vm-muted">Discounts</span>
                <span className="text-green-600 font-medium">
                  -{formatCurrency(quote.discounts, quote.currency)}
                </span>
              </div>
            )}

            {/* Subtotal */}
            <div className="mb-2 pt-3 border-t border-gray-300 flex justify-between text-sm">
              <span className="text-vm-muted">Subtotal</span>
              <span className="text-vm-text font-medium">
                {formatCurrency(quote.subtotal, quote.currency)}
              </span>
            </div>

            {/* Tax */}
            {quote.tax > 0 && (
              <div className="mb-2 flex justify-between text-sm">
                <span className="text-vm-muted">Tax</span>
                <span className="text-vm-text font-medium">
                  {formatCurrency(quote.tax, quote.currency)}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="mt-4 pt-4 border-t-2 border-gray-400 flex justify-between items-center">
              <span className="text-lg font-semibold text-vm-text">Estimated Total</span>
              <span className="text-2xl font-bold text-vm-text">
                {formatCurrency(quote.total, quote.currency)}
              </span>
            </div>

            {depositMode && (
              <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                <p className="font-medium">Booking deposit today: ${depositAmount}</p>
                <p className="mt-1 text-blue-800">
                  Pay a ${depositAmount} deposit now to reserve your cleaning. The remaining balance
                  ({formatCurrency(Math.max(0, quote.total - Number(depositAmount)), quote.currency)})
                  is due after service.
                </p>
              </div>
            )}

            {/* Time & Cleaners */}
            <div className="mt-4 pt-4 border-t border-vm-border grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-vm-muted">Estimated Time:</span>
                <span className="ml-2 font-medium text-vm-text">
                  {quote.estimatedHours} {quote.estimatedHours === 1 ? 'hour' : 'hours'}
                </span>
              </div>
              <div>
                <span className="text-vm-muted">Recommended Cleaners:</span>
                <span className="ml-2 font-medium text-vm-text">{quote.recommendedCleaners}</span>
              </div>
            </div>

            {/* Warnings */}
            {quote.warnings.length > 0 && (
              <div className="mt-4 pt-4 border-t border-vm-border">
                <p className="text-xs font-medium text-vm-text mb-2">Note:</p>
                <ul className="space-y-1">
                  {quote.warnings.map((warning, index) => (
                    <li key={index} className="text-xs text-vm-muted flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 text-yellow-600 flex-shrink-0 mt-0.5" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 pt-4 border-t border-vm-border flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={handleSendEstimate}
                  disabled={sendLoading || !quote}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-vm-text shadow-sm hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {sendLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending…
                    </>
                  ) : sentOnce ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Estimate Sent ✓
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      Email Me This Estimate
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleGetQuote}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
                >
                  Refresh Estimate
                </button>
              </div>
            </div>

            {sendError && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{sendError}</p>
              </div>
            )}

            {sentOnce && !sendError && (
              <div className="mt-3 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-800 font-medium">
                  Estimate emailed successfully. Please check your inbox.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

