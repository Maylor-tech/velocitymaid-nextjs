export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';

export default function SeedPortAntonioPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branchData, setBranchData] = useState<any>(null);

  const handleSeed = async () => {
    setLoading(true);
    setSuccess(false);
    setError(null);
    setBranchData(null);

    try {
      const response = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Port Antonio',
          slug: 'port-antonio',
          city: 'Port Antonio',
          state: 'Portland',
          country: 'Jamaica',
          regionLabel: 'Jamaica',
          timezone: 'America/Jamaica',
          primaryPhone: '+1 (876) 555-1985',
          whatsappNumber: '+1 (876) 555-1985',
          status: 'COMING_SOON',
          zipCodes: ['00000'], // Jamaica uses no ZIP, placeholder
          cloneDefaultPackages: true,
          generateLandingPage: true,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update landing content with SEO data
        try {
          const contentResponse = await fetch('/api/admin/branches/port-antonio/update-content', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              headline: 'Professional House Cleaning Services in Port Antonio, Jamaica',
              subheadline: 'Reliable, friendly, and detail-focused cleaning services for homes, villas, short-term rentals, and guest houses across Portland.',
              seoTitle: 'Professional Cleaning Services in Port Antonio, Jamaica | VelocityMaid',
              seoDescription: 'VelocityMaid provides trusted, affordable, and professional house cleaning services in Port Antonio, Portland, Jamaica.',
              localCtaLabel: 'Apply to Join the Team',
              testimonials: [
                {
                  name: 'Sarah M.',
                  location: 'Port Antonio',
                  comment: 'VelocityMaid transformed our villa cleaning. Professional, thorough, and always on time. Highly recommend!',
                  rating: 5,
                },
                {
                  name: 'Michael T.',
                  location: 'Portland',
                  comment: 'Best cleaning service in Port Antonio. They handle our Airbnb turnover cleaning perfectly every time.',
                  rating: 5,
                },
                {
                  name: 'Patricia L.',
                  location: 'Port Antonio',
                  comment: 'Reliable and trustworthy team. Our guest house is always spotless after their visits.',
                  rating: 5,
                },
              ],
            }),
          });
          
          const contentData = await contentResponse.json();
          if (!contentData.success) {
            console.warn('Failed to update landing content:', contentData.error);
          }
        } catch (contentErr) {
          console.warn('Error updating landing content:', contentErr);
        }
        
        setSuccess(true);
        setBranchData(data.branch);
      } else {
        setError(data.error || 'Failed to create branch');
      }
    } catch (err: any) {
      console.error('Error seeding Port Antonio:', err);
      setError(err.message || 'Failed to seed Port Antonio branch');
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
            href="/admin/branches"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Branches
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Seed Port Antonio Branch</h1>
          <p className="text-gray-600">
            Click the button below to create the Port Antonio branch in the database.
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What this will create:</h3>
          <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
            <li>Port Antonio branch record</li>
            <li>Branch configuration</li>
            <li>Automation configuration</li>
            <li>Default service packages (Standard Clean, Deep Clean, Move In/Out)</li>
            <li>Landing page content</li>
            <li>Service area (placeholder ZIP: 00000)</li>
          </ul>
        </div>

        {/* Button */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <button
            onClick={handleSeed}
            disabled={loading || success}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Seeding Port Antonio...
              </>
            ) : success ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Branch Created Successfully!
              </>
            ) : (
              'Seed Port Antonio'
            )}
          </button>
        </div>

        {/* Success Message */}
        {success && branchData && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 mb-2">Branch Created Successfully!</h3>
                <div className="text-green-800 text-sm space-y-1">
                  <p>
                    <strong>ID:</strong> {branchData.id}
                  </p>
                  <p>
                    <strong>Name:</strong> {branchData.name}
                  </p>
                  <p>
                    <strong>Slug:</strong> {branchData.slug}
                  </p>
                  <p>
                    <strong>Status:</strong> {branchData.status}
                  </p>
                  <p>
                    <strong>Location:</strong> {branchData.city}, {branchData.state}, {branchData.country}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/admin/branches/${branchData.slug}`}
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
                {error.includes('already exists') && (
                  <div className="mt-4">
                    <Link
                      href="/admin/branches/port-antonio"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                    >
                      View Existing Branch
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

