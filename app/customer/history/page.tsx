'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';
import BookingCard from '../components/BookingCard';
import EmptyState from '../components/EmptyState';
import Link from 'next/link';
import { Star, CheckCircle } from 'lucide-react';
import type { CustomerBooking } from '@/utils/customerBookings';
import { getReviewsByJobId, type Review } from '@/utils/reviewData';
import { getComplaintByReviewId } from '@/utils/complaintData';
// Note: Review and complaint checking will be done via API in production

export default function BookingHistoryPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<CustomerBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBookingHistory();
  }, []);

  const fetchBookingHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/customer/bookings/list?type=history');
      const data = await response.json();

      if (data.success) {
        setBookings(data.bookings);
      } else {
        throw new Error(data.error || 'Failed to fetch bookings');
      }
    } catch (err: any) {
      console.error('Error fetching booking history:', err);
      setError(err.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  // TODO: Check reviews via API
  const hasReview = (bookingId: string) => {
    // This will be checked via API call in production
    return false;
  };

  const getReview = (bookingId: string): Review | null => {
    // TODO: Fetch review via API
    const reviews = getReviewsByJobId(bookingId);
    return reviews.length > 0 ? reviews[0] : null;
  };

  const hasComplaint = (bookingId: string) => {
    // TODO: Check complaint via API
    return false;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
    );
  };

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

  return (
    <CustomerLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking History</h1>
        <p className="text-gray-600">View your past cleanings and reviews</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {bookings.length === 0 ? (
        <EmptyState
          type="history"
          message="You don't have any booking history yet"
        />
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => {
            const review = getReview(booking.id);
            const complaint = review ? getComplaintByReviewId(review.id) : null;

            return (
              <div key={booking.id} className="bg-white rounded-xl shadow-md p-6">
                <BookingCard booking={booking} showActions={false} />
                
                {/* Review Section */}
                {booking.status === 'completed' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {review ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Your Review</p>
                            {renderStars(review.rating)}
                          </div>
                          {review.comment && (
                            <p className="text-sm text-gray-700 italic">"{review.comment}"</p>
                          )}
                        </div>
                        <Link
                          href={`/review/${booking.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View Review
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">No review yet</p>
                        <Link
                          href={`/review/${booking.id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm font-medium"
                        >
                          <Star className="w-4 h-4" />
                          Leave a Review
                        </Link>
                      </div>
                    )}
                    
                    {/* Complaint Badge */}
                    {complaint && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-sm">
                          {complaint.status === 'resolved' || complaint.status === 'closed' ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3 inline mr-1" />
                              Complaint Resolved
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                              We're reviewing your feedback
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </CustomerLayout>
  );
}

