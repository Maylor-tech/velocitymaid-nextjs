'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';
import BookingCard from '../components/BookingCard';
import EmptyState from '../components/EmptyState';
import { AlertCircle } from 'lucide-react';
import type { CustomerBooking } from '@/utils/customerBookings';

export default function UpcomingBookingsPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUpcomingBookings();
  }, []);

  const fetchUpcomingBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/customer/bookings/list?type=upcoming');
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings);
      } else {
        throw new Error(data.error || 'Failed to fetch bookings');
      }
    } catch (err: any) {
      console.error('Error fetching upcoming bookings:', err);
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = (bookingId: string) => {
    router.push(`/customer/booking/${bookingId}?action=reschedule`);
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await fetch('/api/customer/bookings/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Booking cancelled successfully');
        fetchUpcomingBookings();
      } else {
        alert(data.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Failed to cancel booking');
    }
  };

  if (loading) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-vm-muted">Loading...</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-vm-text mb-2">Upcoming Bookings</h1>
        <p className="text-vm-muted">Manage your scheduled appointments</p>
      </div>

      {/* Rescheduling Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-800">
          <strong>Rescheduling Policy:</strong> Rescheduling is allowed up to 24 hours before your appointment. 
          For urgent changes, please contact support.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {bookings.length === 0 ? (
        <EmptyState
          type="upcoming"
          message="You don't have any upcoming bookings"
          actionLabel="Book a Service"
          onAction={() => router.push('/')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onReschedule={handleReschedule}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </CustomerLayout>
  );
}




