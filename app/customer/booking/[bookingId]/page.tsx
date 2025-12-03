'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import CustomerLayout from '../../components/CustomerLayout';
import RegionBadge from '../../components/RegionBadge';
import BookingStatusBadge from '../../components/BookingStatusBadge';
import Link from 'next/link';
import { Calendar, Clock, MapPin, DollarSign, User, MessageSquare, Star, X } from 'lucide-react';
import type { CustomerBooking } from '@/utils/customerBookings';
import { getReviewsByJobId, type Review } from '@/utils/reviewData';
import { getComplaintByReviewId } from '@/utils/complaintData';
// Note: Review checking will be done via API in production

export default function BookingDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const bookingId = params?.bookingId as string;
  const action = searchParams?.get('action');

  const [booking, setBooking] = useState<CustomerBooking | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState(action === 'reschedule');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/customer/bookings/list?type=all`);
      const data = await response.json();

      if (data.success) {
        const foundBooking = data.bookings.find((b: CustomerBooking) => b.id === bookingId);
        if (foundBooking) {
          setBooking(foundBooking);
          // Fetch review for this booking
          const reviews = getReviewsByJobId(bookingId);
          setReview(reviews.length > 0 ? reviews[0] : null);
        } else {
          setError('Booking not found');
        }
      } else {
        throw new Error(data.error || 'Failed to fetch booking');
      }
    } catch (err: any) {
      console.error('Error fetching booking details:', err);
      setError(err.message || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      alert('Please select both date and time');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/customer/bookings/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          newDate,
          newTimeWindow: newTime,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Booking rescheduled successfully');
        setShowRescheduleModal(false);
        fetchBookingDetails();
      } else {
        alert(data.error || 'Failed to reschedule booking');
      }
    } catch (error) {
      console.error('Reschedule error:', error);
      alert('Failed to reschedule booking');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('/api/customer/bookings/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          reason: cancelReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Booking cancelled successfully');
        setShowCancelModal(false);
        router.push('/customer/dashboard');
      } else {
        alert(data.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Failed to cancel booking');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatServiceType = (type: string) => {
    const types: Record<string, string> = {
      basic: 'Basic Clean',
      deep: 'Deep Clean',
      moveInOut: 'Move In/Out Clean',
    };
    return types[type] || type;
  };

  const canReschedule = booking && 
    booking.preferredDate && 
    new Date(booking.preferredDate).getTime() > Date.now() + 24 * 60 * 60 * 1000 &&
    booking.status !== 'completed' && 
    booking.status !== 'cancelled' && 
    booking.status !== 'cancelled_by_customer';

  const canCancel = booking && (
    (booking.preferredDate && 
     new Date(booking.preferredDate).getTime() > Date.now() + 24 * 60 * 60 * 1000) ||
    booking.status === 'pending'
  );

  // Review is already fetched in fetchBookingDetails via setReview

  if (loading) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </CustomerLayout>
    );
  }

  if (error || !booking) {
    return (
      <CustomerLayout>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600 font-medium mb-4">Error</p>
          <p className="text-red-500 text-sm mb-4">{error || 'Booking not found'}</p>
          <button
            onClick={() => router.push('/customer/dashboard')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Details</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {formatServiceType(booking.serviceType)}
            </h2>
            <div className="flex items-center gap-3">
              <RegionBadge location={booking.serviceLocation} />
              <BookingStatusBadge status={booking.status} />
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600 mb-1">Date</p>
              <p className="font-medium text-gray-900">{formatDate(booking.preferredDate)}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600 mb-1">Time</p>
              <p className="font-medium text-gray-900">{booking.preferredTime || 'TBD'}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-600 mb-1">Address</p>
              <p className="font-medium text-gray-900">{booking.address}</p>
            </div>
          </div>

          {booking.totalPrice > 0 && (
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Price</p>
                <p className="font-medium text-gray-900">
                  {/* Check if booking has currency field (Jamaica bookings) */}
                  {(booking as any).currency === 'JMD' 
                    ? `JMD $${booking.totalPrice.toLocaleString()}`
                    : `$${booking.totalPrice.toFixed(2)}`
                  }
                </p>
              </div>
            </div>
          )}

          {booking.assignedCleanerName && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-600 mb-1">Assigned Cleaner</p>
                <p className="font-medium text-gray-900">{booking.assignedCleanerName}</p>
              </div>
            </div>
          )}
        </div>

        {/* Add-ons */}
        {booking.addOns && booking.addOns.length > 0 && (
          <div className="mb-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Add-ons</p>
            <div className="flex flex-wrap gap-2">
              {booking.addOns.map((addon, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {addon}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {booking.specialInstructions && (
          <div className="mb-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Special Instructions</p>
            <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{booking.specialInstructions}</p>
          </div>
        )}

        {/* Review Section */}
        {booking.status === 'completed' && (
          <div className="mb-6 pt-6 border-t border-gray-200">
            {review ? (
              <div>
                <p className="text-sm text-gray-600 mb-2">Your Review</p>
                <div className="flex items-center gap-2 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={i < review.rating ? 'text-yellow-400 text-xl' : 'text-gray-300 text-xl'}>
                      ★
                    </span>
                  ))}
                  <span className="text-gray-600">({review.rating}/5)</span>
                </div>
                {review.comment && (
                  <p className="text-gray-700 italic mb-2">"{review.comment}"</p>
                )}
                <Link
                  href={`/review/${booking.id}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Full Review →
                </Link>
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-600 mb-3">No review yet</p>
                <Link
                  href={`/review/${booking.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                >
                  <Star className="w-4 h-4" />
                  Leave a Review
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="pt-6 border-t border-gray-200 flex flex-wrap gap-3">
          {canReschedule && (
            <button
              onClick={() => setShowRescheduleModal(true)}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Reschedule
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-6 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
            >
              Cancel Booking
            </button>
          )}
          <a
            href={`https://wa.me/${process.env.NEXT_PUBLIC_ADMIN_WHATSAPP || '19731234567'}?text=Hi, I need help with booking ${booking.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <MessageSquare className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Reschedule Booking</h2>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Date</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Time</label>
                <select
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  required
                >
                  <option value="">Select time</option>
                  <option value="morning">Morning (8 AM - 12 PM)</option>
                  <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                  <option value="evening">Evening (4 PM - 8 PM)</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleReschedule}
                disabled={updating || !newDate || !newTime}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              >
                {updating ? 'Rescheduling...' : 'Confirm Reschedule'}
              </button>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Cancel Booking</h2>
              <button
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel this booking? This action cannot be undone.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for cancellation (optional)
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                placeholder="Let us know why you're cancelling..."
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={handleCancel}
                disabled={updating}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:bg-gray-400"
              >
                {updating ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Keep Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

