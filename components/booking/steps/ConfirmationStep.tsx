"use client";

import { useBooking } from "../BookingContext";
import { Loader2 } from "lucide-react";

const serviceTypeLabels: Record<string, string> = {
  STANDARD: 'Standard Cleaning',
  DEEP_CLEAN: 'Deep Clean',
  MOVE_IN_OUT: 'Move In / Out',
};

export default function ConfirmationStep() {
  const { data, submitBooking, loading, error, paymentConfig } = useBooking();
  const depositMode = paymentConfig.depositMode;
  const depositLabel = String(paymentConfig.depositDollars);

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
    .filter(([key, value]) => {
      if (key === 'notes') return false;
      return value === true;
    })
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
      <h2 className="text-xl font-semibold">Review & Confirm</h2>

      <div className="border rounded-md p-4 space-y-4">
        <div>
          <h3 className="font-medium text-lg mb-2">Service Details</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Service:</span> {data.serviceType ? serviceTypeLabels[data.serviceType] || data.serviceType : 'Not selected'}</p>
            <p><span className="font-medium">Bedrooms:</span> {data.home.bedrooms}</p>
            <p><span className="font-medium">Bathrooms:</span> {data.home.bathrooms}</p>
            {data.home.sqft && (
              <p><span className="font-medium">Square Feet:</span> {data.home.sqft.toLocaleString()}</p>
            )}
          </div>
        </div>

        {selectedExtras.length > 0 && (
          <div>
            <h3 className="font-medium text-lg mb-2">Extras</h3>
            <ul className="list-disc ml-5 space-y-1 text-sm">
              {selectedExtras.map((extra, idx) => (
                <li key={idx}>{extra}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h3 className="font-medium text-lg mb-2">Schedule</h3>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Date:</span> {formatDate(data.schedule.date)}</p>
            <p><span className="font-medium">Time:</span> {formatTimeSlot(data.schedule.timeSlot)}</p>
          </div>
        </div>

        <div>
          <h3 className="font-medium text-lg mb-2">Contact Information</h3>
          <div className="space-y-1 text-sm">
            <p>
              {data.contact.firstName} {data.contact.lastName}
            </p>
            <p>{data.contact.email}</p>
            {data.contact.phone && <p>{data.contact.phone}</p>}
            {(data.contact.streetAddress || data.address.street) && (
              <p>
                {data.contact.streetAddress || data.address.street}
                {data.contact.city || data.address.city ? `, ${data.contact.city || data.address.city}` : ''}
                {data.contact.state || data.address.state ? `, ${data.contact.state || data.address.state}` : ''}
                {data.contact.zip || data.address.zip ? ` ${data.contact.zip || data.address.zip}` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-600 border border-red-400 bg-red-50 p-3 rounded">
          {error}
        </div>
      )}

      <button
        disabled={loading}
        onClick={submitBooking}
        className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors flex items-center justify-center ${
          loading
            ? "bg-vm-navy cursor-not-allowed"
            : "bg-vm-navy hover:bg-vm-navy"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : depositMode ? (
          `Pay $${depositLabel} Deposit & Book`
        ) : (
          "Confirm Booking"
        )}
      </button>
    </div>
  );
}

