"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';
import BookingCard from '../components/BookingCard';
import EmptyState from '../components/EmptyState';
import Link from 'next/link';
import { Calendar, History, Settings, Star, ArrowRight, Gift } from 'lucide-react';
import type { CustomerBooking } from '@/utils/customerBookings';
import { getLoyaltyPoints } from '@/utils/loyaltyEngine';
// Note: Review checking will be done via API in production

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [customer, setCustomer] = useState<any>(null);
  const [nextBooking, setNextBooking] = useState<CustomerBooking | null>(null);
  const [recentCompleted, setRecentCompleted] = useState<CustomerBooking | null>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch customer info
      const customerResponse = await fetch('/api/customer/me');
      if (!customerResponse.ok) {
        if (customerResponse.status === 401) {
          router.push('/customer/login');
          return;
        }
        throw new Error('Failed to fetch customer info');
      }
      const customerData = await customerResponse.json();
      if (customerData.success) {
        setCustomer(customerData.customer);
      }

      // Fetch upcoming bookings
      const upcomingResponse = await fetch('/api/customer/bookings/list?type=upcoming');
      const upcomingData = await upcomingResponse.json();
      if (upcomingData.success && upcomingData.bookings.length > 0) {
        setNextBooking(upcomingData.bookings[0]);
      }

      // Fetch recent completed booking
      const historyResponse = await fetch('/api/customer/bookings/list?type=history');
      const historyData = await historyResponse.json();
      if (historyData.success && historyData.bookings.length > 0) {
        setRecentCompleted(historyData.bookings[0]);
      }

      // Fetch loyalty points
      if (customerData.success && customerData.customer) {
        const points = getLoyaltyPoints(customerData.customer.id);
        setLoyaltyPoints(points);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Failed to load dashboard');
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
        fetchDashboardData();
      } else {
        alert(data.error || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      alert('Failed to cancel booking');
    }
  };

  // TODO: Check reviews via API
  const hasReview = (bookingId: string) => {
    // This will be checked via API call in production
    return false;
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
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Hi, {customer?.firstName || 'there'}!
        </h1>
        <p className="text-gray-600">Welcome to your customer portal</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Next Upcoming Booking */}
      {nextBooking ? (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Next Upcoming Booking</h2>
            <Link
              href="/customer/upcoming"
              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <BookingCard
            booking={nextBooking}
            onReschedule={handleReschedule}
            onCancel={handleCancel}
          />
        </div>
      ) : (
        <div className="mb-8">
          <EmptyState
            type="upcoming"
            message="You don't have any upcoming bookings"
            actionLabel="Book a Service"
            onAction={() => router.push('/')}
          />
        </div>
      )}

      {/* Loyalty Points Card */}
      {loyaltyPoints > 0 && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-md p-6 mb-6 border-2 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Loyalty Points</p>
              <p className="text-3xl font-bold text-gray-900">{loyaltyPoints}</p>
            </div>
            <Gift className="w-12 h-12 text-yellow-600" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Redeem on future cleans (coming soon)
          </p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link
          href="/customer/upcoming"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <Calendar className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">View All Upcoming</h3>
          <p className="text-sm text-gray-600">See all your scheduled bookings</p>
        </Link>

        <Link
          href="/customer/history"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <History className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">View Past Cleanings</h3>
          <p className="text-sm text-gray-600">Check your booking history</p>
        </Link>

        <Link
          href="/customer/preferences"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <Settings className="w-8 h-8 text-blue-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Update Preferences</h3>
          <p className="text-sm text-gray-600">Manage your preferences</p>
        </Link>

        <Link
          href="/review-us/new-jersey"
          className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-yellow-200"
        >
          <Star className="w-8 h-8 text-yellow-600 mb-3" />
          <h3 className="font-semibold text-gray-900 mb-1">Leave a Review</h3>
          <p className="text-sm text-gray-600">Share your experience</p>
        </Link>
      </div>

      {/* Recent Completed Booking */}
      {recentCompleted && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Service</h2>
          <BookingCard booking={recentCompleted} showActions={false} />
          <div className="mt-4 text-center">
            <Link
              href="/review-us/new-jersey"
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-semibold"
            >
              <Star className="w-5 h-5" />
              Leave a Review
            </Link>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

