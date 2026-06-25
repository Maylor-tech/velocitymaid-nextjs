'use client';

import Link from 'next/link';
import { Calendar, MapPin, Clock, DollarSign } from 'lucide-react';
import type { CustomerBooking } from '@/utils/customerBookings';
import RegionBadge from './RegionBadge';
import BookingStatusBadge from './BookingStatusBadge';

interface BookingCardProps {
  booking: CustomerBooking;
  showActions?: boolean;
  onReschedule?: (bookingId: string) => void;
  onCancel?: (bookingId: string) => void;
}

export default function BookingCard({
  booking,
  showActions = true,
  onReschedule,
  onCancel,
}: BookingCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    // Time is usually in format like "9:00 AM" or "morning"
    return timeStr || 'TBD';
  };

  const formatServiceType = (type: string) => {
    const types: Record<string, string> = {
      basic: 'Basic Clean',
      deep: 'Deep Clean',
      moveInOut: 'Move In/Out Clean',
    };
    return types[type] || type;
  };

  const canReschedule = booking.preferredDate && 
    new Date(booking.preferredDate).getTime() > Date.now() + 24 * 60 * 60 * 1000 &&
    booking.status !== 'completed' && 
    booking.status !== 'cancelled' && 
    booking.status !== 'cancelled_by_customer';

  const canCancel = (booking.preferredDate && 
    new Date(booking.preferredDate).getTime() > Date.now() + 24 * 60 * 60 * 1000) ||
    booking.status === 'pending';

  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-vm-text">
              {formatServiceType(booking.serviceType)}
            </h3>
            <RegionBadge location={booking.serviceLocation} size="sm" />
            <BookingStatusBadge status={booking.status} size="sm" />
          </div>
          <div className="space-y-1 text-sm text-vm-muted">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(booking.preferredDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatTime(booking.preferredTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{booking.address}</span>
            </div>
            {booking.totalPrice > 0 && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                <span className="font-semibold text-vm-text">
                  ${booking.totalPrice.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {showActions && (
        <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
          <Link
            href={`/customer/booking/${booking.id}`}
            className="px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy transition-colors text-sm font-medium"
          >
            View Details
          </Link>
          {canReschedule && onReschedule && (
            <button
              onClick={() => onReschedule(booking.id)}
              className="px-4 py-2 bg-gray-200 text-vm-text rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Reschedule
            </button>
          )}
          {canCancel && onCancel && (
            <button
              onClick={() => onCancel(booking.id)}
              className="px-4 py-2 bg-vm-danger-bg text-red-700 rounded-lg hover:bg-vm-danger-bg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}




