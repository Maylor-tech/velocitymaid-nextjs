'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Users, Shield, Inbox, CreditCard, LogOut } from 'lucide-react';
import Link from 'next/link';

interface Subscription {
  id: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: string | null;
}

interface Tenant {
  id: string;
  name: string;
  subscription: Subscription | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
    try {
      const response = await fetch('/api/saas/me');
      if (!response.ok) {
        if (response.status === 401) {
          router.push('/saas/login');
          return;
        }
        throw new Error('Failed to fetch tenant data');
      }
      const data = await response.json();
      setTenant(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/saas/logout', { method: 'POST' });
    router.push('/saas/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Failed to load dashboard'}</p>
          <Link href="/saas/login" className="text-primary-600 hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  const hasActiveSubscription = tenant.subscription?.stripeSubscriptionId !== null;
  const periodEnd = tenant.subscription?.stripeCurrentPeriodEnd
    ? new Date(tenant.subscription.stripeCurrentPeriodEnd)
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/saas" className="flex items-center space-x-2">
              <Sparkles className="w-7 h-7 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">VelocityMaid</span>
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back, {tenant.name}</p>
        </div>

        {/* Subscription Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Subscription Status</h2>
              {hasActiveSubscription ? (
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                  {periodEnd && (
                    <p className="text-sm text-gray-600 mt-2">
                      Current period ends: {periodEnd.toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Trial Period
                  </span>
                  <p className="text-sm text-gray-600 mt-2">
                    You're on a 14-day free trial. Subscribe to continue.
                  </p>
                </div>
              )}
            </div>
            <Link
              href="/saas/billing"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              <CreditCard className="w-5 h-5 mr-2" />
              Manage Billing
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Contractor Management</h3>
            <p className="text-gray-600 text-sm mb-4">
              Manage all your independent contractors in one place.
            </p>
            <Link
              href="/saas/contractors"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View Contractors →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance Tracking</h3>
            <p className="text-gray-600 text-sm mb-4">
              Stay audit-ready with automatic compliance document tracking.
            </p>
            <Link
              href="/saas/compliance"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View Compliance →
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Inbox className="w-6 h-6 text-primary-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unified Inbox</h3>
            <p className="text-gray-600 text-sm mb-4">
              All communication logged in a single, auditable inbox.
            </p>
            <Link
              href="/saas/inbox"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View Inbox →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

