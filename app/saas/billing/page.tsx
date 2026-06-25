'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CreditCard, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Subscription {
  id: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
}

const PRICE_IDS: Record<string, string> = {
  starter: process.env.NEXT_PUBLIC_STRIPE_PRICE_STARTER || 'price_1SmRLtBKwFR9ueazwBbsJEL4',
  pro: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_1SmRVrBKwFR9ueazp8FvpKGm',
  business: process.env.NEXT_PUBLIC_STRIPE_PRICE_BUSINESS || 'price_1SmRfbBKwFR9ueazU3LOsTmh',
};

export default function BillingPage() {
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/saas/me');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/saas/login');
          return;
        }
        throw new Error('Failed to fetch subscription');
      }
      const data = await response.json();
      setSubscription(data.subscription);
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan: 'starter' | 'pro' | 'business') => {
    setProcessing(plan);
    try {
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: PRICE_IDS[plan],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      alert(err.message || 'Failed to start checkout');
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vm-navy mx-auto mb-4"></div>
          <p className="text-vm-muted">Loading...</p>
        </div>
      </div>
    );
  }

  const hasActiveSubscription = subscription?.stripeSubscriptionId !== null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/saas" className="flex items-center space-x-2">
              <Sparkles className="w-7 h-7 text-vm-cyan-dark" />
              <span className="text-xl font-bold text-vm-text">VelocityMaid</span>
            </Link>
            <Link
              href="/saas/dashboard"
              className="text-vm-muted hover:text-vm-text"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Billing Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-vm-text">Billing & Subscription</h1>
          <p className="text-vm-muted mt-2">Manage your subscription plan</p>
        </div>

        {hasActiveSubscription && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <p className="text-green-800">
                You have an active subscription. Your plan will renew automatically.
              </p>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { plan: 'starter' as const, name: 'Starter', price: '$99', contractors: 'Up to 25 contractors' },
            { plan: 'pro' as const, name: 'Pro', price: '$199', contractors: 'Up to 100 contractors', popular: true },
            { plan: 'business' as const, name: 'Business', price: '$399', contractors: 'Unlimited contractors' },
          ].map((tier) => (
            <div
              key={tier.plan}
              className={`bg-white rounded-lg shadow-sm border p-6 ${
                tier.popular ? 'ring-2 ring-vm-cyan relative' : 'border-gray-200'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-vm-navy text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold text-vm-text mb-2">{tier.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-vm-text">{tier.price}</span>
                <span className="text-vm-muted">/month</span>
              </div>
              <p className="text-vm-muted mb-6">{tier.contractors}</p>
              <button
                onClick={() => handleSubscribe(tier.plan)}
                disabled={processing !== null || hasActiveSubscription}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                  tier.popular
                    ? 'bg-vm-navy text-white hover:bg-vm-navy'
                    : 'bg-gray-100 text-vm-text hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {processing === tier.plan ? (
                  'Processing...'
                ) : hasActiveSubscription ? (
                  'Current Plan'
                ) : (
                  'Subscribe'
                )}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-vm-muted">
          <p>All plans include a 14-day free trial. No credit card required to start.</p>
        </div>
      </div>
    </div>
  );
}

