'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';
import { Calendar, Check, X, AlertCircle, CreditCard } from 'lucide-react';
import RegionBadge from '../components/RegionBadge';

interface Subscription {
  id: string;
  planType: 'weekly' | 'biweekly' | 'monthly';
  serviceLocation: 'new_jersey' | 'vermont';
  defaultServiceType: string;
  defaultAddOns: string[];
  status: string;
  nextBillingDate: string | null;
  currentPeriodEnd?: string | null;
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams?.get('status');

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [canceling, setCanceling] = useState(false);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/customer/subscriptions');
      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartPlan = async (planType: 'weekly' | 'biweekly' | 'monthly') => {
    try {
      setCreating(true);
      
      // Get customer preferences for defaults
      const customerResponse = await fetch('/api/customer/me');
      const customerData = await customerResponse.json();
      
      const response = await fetch('/api/customer/subscriptions/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          serviceLocation: customerData.customer?.region || 'new_jersey',
          defaultServiceType: 'basic',
          defaultAddOns: [],
        }),
      });

      const data = await response.json();

      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      alert('Failed to create subscription');
    } finally {
      setCreating(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')) {
      return;
    }

    try {
      setCanceling(true);
      const response = await fetch('/api/customer/subscriptions/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'cancel',
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Subscription cancelled. You will continue to have access until the end of your billing period.');
        fetchSubscription();
      } else {
        alert(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error canceling subscription:', error);
      alert('Failed to cancel subscription');
    } finally {
      setCanceling(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatPlanType = (planType: string) => {
    const types: Record<string, string> = {
      weekly: 'Weekly Clean Plan',
      biweekly: 'Bi-weekly Refresh',
      monthly: 'Monthly Deep Care',
    };
    return types[planType] || planType;
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
        <h1 className="text-3xl font-bold text-vm-text mb-2">Subscriptions</h1>
        <p className="text-vm-muted">Manage your recurring cleaning plans</p>
      </div>

      {status === 'success' && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
          <p className="text-green-600 font-medium">Subscription created successfully!</p>
        </div>
      )}

      {status === 'cancel' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-600">Subscription creation was cancelled.</p>
        </div>
      )}

      {subscription ? (
        <div className="space-y-6">
          {/* Active Subscription */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-vm-text mb-2">
                  {formatPlanType(subscription.planType)}
                </h2>
                <div className="flex items-center gap-3">
                  <RegionBadge location={subscription.serviceLocation} size="sm" />
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    subscription.status === 'active' 
                      ? 'bg-vm-success-bg text-green-800'
                      : subscription.status === 'canceled'
                      ? 'bg-gray-100 text-vm-text'
                      : 'bg-vm-warning-bg text-yellow-800'
                  }`}>
                    {subscription.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-vm-muted" />
                <div>
                  <p className="text-sm text-vm-muted">Next Billing Date</p>
                  <p className="font-medium text-vm-text">
                    {formatDate(subscription.nextBillingDate || subscription.currentPeriodEnd || null)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-vm-muted mb-1">Default Service</p>
                <p className="font-medium text-vm-text capitalize">{subscription.defaultServiceType}</p>
              </div>

              {subscription.defaultAddOns.length > 0 && (
                <div>
                  <p className="text-sm text-vm-muted mb-1">Default Add-ons</p>
                  <div className="flex flex-wrap gap-2">
                    {subscription.defaultAddOns.map((addon, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-vm-cyan-tint text-blue-800 rounded text-sm"
                      >
                        {addon}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {subscription.status === 'canceled' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-900">Subscription Cancelled</p>
                    <p className="text-xs text-yellow-800 mt-1">
                      Your subscription will remain active until {formatDate(subscription.nextBillingDate || subscription.currentPeriodEnd || null)}.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={() => router.push('/customer/billing')}
                className="px-4 py-2 bg-gray-200 text-vm-text rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Manage Billing
              </button>
              {subscription.status === 'active' && (
                <button
                  onClick={handleCancel}
                  disabled={canceling}
                  className="px-4 py-2 bg-vm-danger-bg text-red-700 rounded-lg hover:bg-vm-danger-bg transition-colors font-medium disabled:bg-gray-200"
                >
                  {canceling ? 'Cancelling...' : 'Cancel Subscription'}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-vm-muted mb-6">Choose a recurring cleaning plan that works for you:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Weekly Plan */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-vm-text mb-2">Weekly Clean Plan</h3>
              <p className="text-vm-muted text-sm mb-4">
                Get your space cleaned every week. Perfect for busy households.
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold text-vm-text">$80</span>
                <span className="text-vm-muted">/week</span>
              </div>
              <button
                onClick={() => handleStartPlan('weekly')}
                disabled={creating}
                className="w-full px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy transition-colors font-semibold disabled:bg-gray-400"
              >
                {creating ? 'Starting...' : 'Start Plan'}
              </button>
            </div>

            {/* Bi-weekly Plan */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-vm-text">Bi-weekly Refresh</h3>
                <span className="px-2 py-1 bg-vm-cyan-tint text-blue-800 rounded text-xs font-medium">Popular</span>
              </div>
              <p className="text-vm-muted text-sm mb-4">
                Cleanings every two weeks. Great balance of freshness and value.
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold text-vm-text">$120</span>
                <span className="text-vm-muted">/2 weeks</span>
              </div>
              <button
                onClick={() => handleStartPlan('biweekly')}
                disabled={creating}
                className="w-full px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy transition-colors font-semibold disabled:bg-gray-400"
              >
                {creating ? 'Starting...' : 'Start Plan'}
              </button>
            </div>

            {/* Monthly Plan */}
            <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <h3 className="text-xl font-bold text-vm-text mb-2">Monthly Deep Care</h3>
              <p className="text-vm-muted text-sm mb-4">
                Monthly deep clean to keep everything spotless.
              </p>
              <div className="mb-4">
                <span className="text-3xl font-bold text-vm-text">$200</span>
                <span className="text-vm-muted">/month</span>
              </div>
              <button
                onClick={() => handleStartPlan('monthly')}
                disabled={creating}
                className="w-full px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy transition-colors font-semibold disabled:bg-gray-400"
              >
                {creating ? 'Starting...' : 'Start Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </CustomerLayout>
  );
}

