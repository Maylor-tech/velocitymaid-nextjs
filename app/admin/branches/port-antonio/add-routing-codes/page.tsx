"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, MapPin } from 'lucide-react';
import AdminLayout from '../../../components/AdminLayout';

const ROUTING_CODES = [
  { code: 'PA-100', name: 'Port Antonio' },
  { code: 'PA-101', name: 'Boundbrook' },
  { code: 'PA-102', name: 'Bryan\'s Bay' },
  { code: 'PA-103', name: 'Drapers' },
  { code: 'PA-104', name: 'Fairy Hill' },
  { code: 'PA-105', name: 'San San' },
  { code: 'PA-106', name: 'Anchovy' },
  { code: 'PA-107', name: 'Norwich' },
  { code: 'PA-108', name: 'Boston' },
  { code: 'PA-109', name: 'Long Bay' },
];

export default function AddRoutingCodesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedCodes, setAddedCodes] = useState<string[]>([]);

  const handleAddCodes = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setAddedCodes([]);

    try {
      const response = await fetch('/api/admin/branches/port-antonio/add-service-areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          zipCodes: ROUTING_CODES.map(rc => rc.code),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setAddedCodes(data.addedCodes || ROUTING_CODES.map(rc => rc.code));
      } else {
        setError(data.error || 'Failed to add routing codes');
      }
    } catch (err: any) {
      console.error('Error adding routing codes:', err);
      setError(err.message || 'Failed to add routing codes');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Jamaica Routing Codes</h1>
          <p className="text-gray-600">
            Add routing codes for Port Antonio service areas in Portland, Jamaica.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Routing Codes to Add:</h3>
          <div className="grid md:grid-cols-2 gap-2 text-blue-800 text-sm">
            {ROUTING_CODES.map((rc) => (
              <div key={rc.code} className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span className="font-mono">{rc.code}</span>
                <span className="text-blue-700">- {rc.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Button */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <button
            onClick={handleAddCodes}
            disabled={loading || success}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Adding Routing Codes...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Routing Codes Added!
              </>
            ) : (
              'Add All Routing Codes'
            )}
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">Routing Codes Added Successfully!</h3>
                <p className="text-green-800 text-sm mb-4">
                  {addedCodes.length} routing codes have been added to Port Antonio's service areas.
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


