"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, DollarSign } from 'lucide-react';
import AdminLayout from '../../../components/AdminLayout';

const PORT_ANTONIO_PRICING = {
  currency: 'JMD',
  basePrices: {
    standard: 7500,
    standard_large: 9500,
    deep_clean: 15000,
    move_out: 22000,
    airbnb_small: 12000,
    airbnb_large: 20000,
  },
  addons: {
    laundry: 1500,
    fridge: 1500,
    oven: 2000,
    windows_per_room: 1200,
  },
  usdEquivalents: {
    standard: 50,
    standard_large: 65,
    deep_clean: 100,
    move_out: 150,
    airbnb_small: 80,
    airbnb_large: 150,
  },
  quoteRequiredForLargeVillas: true,
};

const SERVICE_PACKAGES = [
  { code: 'STANDARD_CLEAN', name: 'Standard Clean', jmdPrice: 8000, usdPrice: 53, hours: 2 },
  { code: 'STANDARD_CLEAN_LARGE', name: 'Standard Clean (Large)', jmdPrice: 9500, usdPrice: 63, hours: 3 },
  { code: 'DEEP_CLEAN', name: 'Deep Clean', jmdPrice: 15000, usdPrice: 100, hours: 4 },
  { code: 'MOVE_IN_OUT', name: 'Move In/Out', jmdPrice: 25000, usdPrice: 167, hours: 6 },
  { code: 'AIRBNB_SMALL', name: 'Airbnb/Villa (Small)', jmdPrice: 12000, usdPrice: 80, hours: 3 },
  { code: 'AIRBNB_LARGE', name: 'Airbnb/Villa (Large)', jmdPrice: 20000, usdPrice: 133, hours: 5 },
];

export default function SetPortAntonioPricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedPackages, setUpdatedPackages] = useState<string[]>([]);

  const handleSetPricing = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setUpdatedPackages([]);

    try {
      const response = await fetch('/api/admin/branches/port-antonio/set-pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pricing: PORT_ANTONIO_PRICING,
          packages: SERVICE_PACKAGES,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setUpdatedPackages(data.updatedPackages || SERVICE_PACKAGES.map(p => p.code));
      } else {
        setError(data.error || 'Failed to set pricing');
      }
    } catch (err: any) {
      console.error('Error setting pricing:', err);
      setError(err.message || 'Failed to set pricing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/branches/port-antonio"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Port Antonio Branch
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Set Port Antonio Pricing</h1>
          <p className="text-gray-600">
            Configure multi-currency pricing (JMD/USD) for Port Antonio service packages.
          </p>
        </div>

        {/* Pricing Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Pricing Structure
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">JMD Prices (Local)</h4>
              <ul className="space-y-1 text-blue-700">
                <li>Standard: J$8,000</li>
                <li>Standard Large: J$9,500</li>
                <li>Deep Clean: J$15,000</li>
                <li>Move In/Out: J$25,000</li>
                <li>Airbnb Small: J$12,000</li>
                <li>Airbnb Large: J$20,000</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-800 mb-2">USD Prices (Visitors)</h4>
              <ul className="space-y-1 text-blue-700">
                <li>Standard: $53</li>
                <li>Standard Large: $63</li>
                <li>Deep Clean: $100</li>
                <li>Move In/Out: $167</li>
                <li>Airbnb Small: $80</li>
                <li>Airbnb Large: $133</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-blue-300">
            <h4 className="font-semibold text-blue-800 mb-2">Add-ons (JMD)</h4>
            <p className="text-blue-700 text-sm">Laundry: J$1,500 | Fridge: J$1,500 | Oven: J$2,000 | Windows: J$1,200/room</p>
          </div>
        </div>

        {/* Button */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <button
            onClick={handleSetPricing}
            disabled={loading || success}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Setting Pricing...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Pricing Set Successfully!
              </>
            ) : (
              'Set Port Antonio Pricing'
            )}
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">Pricing Set Successfully!</h3>
                <p className="text-green-800 text-sm mb-4">
                  {updatedPackages.length} service packages have been updated with multi-currency pricing.
                </p>
                <div className="mt-4">
                  <Link
                    href="/admin/branches/port-antonio"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                  >
                    View Branch Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">Error</h3>
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}


