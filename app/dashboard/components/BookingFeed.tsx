'use client';

import { Job } from './JobCard';
import LocationBadge from './LocationBadge';

interface BookingFeedProps {
  bookings: Job[];
}

export default function BookingFeed({ bookings }: BookingFeedProps) {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (bookings.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">New Bookings (Last 24h)</h2>
        <p className="text-gray-500 text-center py-4">No new bookings in the last 24 hours</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4">New Bookings (Last 24h)</h2>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {bookings.map((booking) => (
          <div
            key={booking.sessionId}
            className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-900">{booking.customerName}</span>
                  <LocationBadge location={booking.serviceLocation} />
                </div>
                <p className="text-sm text-gray-600">{booking.serviceType}</p>
              </div>
              <span className="text-xs text-gray-500">{formatTime(booking.createdAt)}</span>
            </div>
            <div className="text-sm text-gray-600">
              <span>{booking.preferredDate}</span>
              <span className="mx-2">•</span>
              <span>${booking.totalPrice.toFixed(2)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



