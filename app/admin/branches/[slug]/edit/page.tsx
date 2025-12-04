"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import AdminLayout from '../../../components/AdminLayout';
import Toast from '../../../components/Toast';

interface FieldErrors {
  [key: string]: string;
}

export default function EditBranchPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const [formData, setFormData] = useState({
    name: '',
    regionLabel: '',
    primaryPhone: '',
    whatsappNumber: '',
    bookingEmail: '',
    supportEmail: '',
    maxDailyJobs: '',
    status: 'COMING_SOON' as 'ACTIVE' | 'COMING_SOON' | 'PAUSED',
    currency: 'USD' as 'USD' | 'JMD',
    zipCodes: '',
    headline: '',
    subheadline: '',
    seoTitle: '',
    seoDescription: '',
  });

  useEffect(() => {
    if (slug) {
      fetchBranch();
    }
  }, [slug]);

  const fetchBranch = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/branches/${slug}`);
      const data = await response.json();

      if (data.success && data.branch) {
        const branch = data.branch;
        setFormData({
          name: branch.name || '',
          regionLabel: branch.regionLabel || '',
          primaryPhone: branch.primaryPhone || '',
          whatsappNumber: branch.whatsappNumber || '',
          bookingEmail: branch.config?.bookingEmail || '',
          supportEmail: branch.config?.supportEmail || '',
          maxDailyJobs: branch.config?.maxDailyJobs?.toString() || '',
          status: branch.status,
          currency: (branch.currency as 'USD' | 'JMD') || (branch.slug === 'port-antonio' ? 'JMD' : 'USD'),
          zipCodes: branch.serviceAreas?.map((sa: any) => sa.zipCode).join('\n') || '',
          headline: branch.landingContent?.headline || '',
          subheadline: branch.landingContent?.subheadline || '',
          seoTitle: branch.landingContent?.seoTitle || '',
          seoDescription: branch.landingContent?.seoDescription || '',
        });
      } else {
        setError(data.error || 'Branch not found');
      }
    } catch (err: any) {
      console.error('Error fetching branch:', err);
      setError(err.message || 'Failed to load branch');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Branch name is required';
    }

    if (!formData.primaryPhone.trim()) {
      errors.primaryPhone = 'Primary phone is required';
    }

    if (!formData.whatsappNumber.trim()) {
      errors.whatsappNumber = 'WhatsApp number is required';
    }

    const zipCodes = formData.zipCodes
      .split('\n')
      .map(z => z.trim())
      .filter(z => z.length > 0);

    if (zipCodes.length === 0) {
      errors.zipCodes = 'At least one ZIP code is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const zipCodes = formData.zipCodes
        .split('\n')
        .map(z => z.trim())
        .filter(z => z.length > 0);

      const response = await fetch(`/api/admin/branches/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          zipCodes,
          maxDailyJobs: formData.maxDailyJobs ? parseInt(formData.maxDailyJobs) : null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setShowToast(true);
        setTimeout(() => {
          router.push(`/admin/branches/${slug}`);
        }, 1500);
      } else {
        setError(data.error || 'Failed to update branch');
        setShowToast(true);
      }
    } catch (err: any) {
      console.error('Error updating branch:', err);
      setError(err.message || 'Failed to update branch');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading branch...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={`/admin/branches/${slug}`}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Branch</h1>
            <p className="text-gray-600">Update branch information and settings</p>
          </div>
        </div>

        <Toast
          message={success ? 'Branch updated successfully!' : (error || 'Failed to update branch')}
          type={success ? 'success' : 'error'}
          visible={showToast}
          onClose={() => setShowToast(false)}
        />

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    fieldErrors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.name && <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <label htmlFor="regionLabel" className="block text-sm font-medium text-gray-700 mb-1">
                  Region Label
                </label>
                <input
                  type="text"
                  id="regionLabel"
                  value={formData.regionLabel}
                  onChange={(e) => handleFieldChange('regionLabel', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="e.g., Northern New Jersey"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="COMING_SOON">Coming Soon</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Billing Currency
                </label>
                <select
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => handleFieldChange('currency', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="USD">USD</option>
                  <option value="JMD">JMD</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Default currency for this branch's billing and pricing
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="primaryPhone" className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Phone *
                </label>
                <input
                  type="tel"
                  id="primaryPhone"
                  value={formData.primaryPhone}
                  onChange={(e) => handleFieldChange('primaryPhone', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    fieldErrors.primaryPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.primaryPhone && <p className="text-red-500 text-sm mt-1">{fieldErrors.primaryPhone}</p>}
              </div>

              <div>
                <label htmlFor="whatsappNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  id="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    fieldErrors.whatsappNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {fieldErrors.whatsappNumber && <p className="text-red-500 text-sm mt-1">{fieldErrors.whatsappNumber}</p>}
              </div>

              <div>
                <label htmlFor="bookingEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Email
                </label>
                <input
                  type="email"
                  id="bookingEmail"
                  value={formData.bookingEmail}
                  onChange={(e) => handleFieldChange('bookingEmail', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Support Email
                </label>
                <input
                  type="email"
                  id="supportEmail"
                  value={formData.supportEmail}
                  onChange={(e) => handleFieldChange('supportEmail', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label htmlFor="maxDailyJobs" className="block text-sm font-medium text-gray-700 mb-1">
                  Max Daily Jobs
                </label>
                <input
                  type="number"
                  id="maxDailyJobs"
                  value={formData.maxDailyJobs}
                  onChange={(e) => handleFieldChange('maxDailyJobs', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Service Areas */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Service Areas (ZIP Codes)</h2>
            <div>
              <label htmlFor="zipCodes" className="block text-sm font-medium text-gray-700 mb-1">
                ZIP Codes (one per line) *
              </label>
              <textarea
                id="zipCodes"
                rows={8}
                value={formData.zipCodes}
                onChange={(e) => handleFieldChange('zipCodes', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm ${
                  fieldErrors.zipCodes ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="10001&#10;10002&#10;10003"
              />
              {fieldErrors.zipCodes && <p className="text-red-500 text-sm mt-1">{fieldErrors.zipCodes}</p>}
            </div>
          </div>

          {/* Landing Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Landing Page Content</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="headline" className="block text-sm font-medium text-gray-700 mb-1">
                  Headline
                </label>
                <input
                  type="text"
                  id="headline"
                  value={formData.headline}
                  onChange={(e) => handleFieldChange('headline', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label htmlFor="subheadline" className="block text-sm font-medium text-gray-700 mb-1">
                  Subheadline
                </label>
                <input
                  type="text"
                  id="subheadline"
                  value={formData.subheadline}
                  onChange={(e) => handleFieldChange('subheadline', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label htmlFor="seoTitle" className="block text-sm font-medium text-gray-700 mb-1">
                  SEO Title
                </label>
                <input
                  type="text"
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => handleFieldChange('seoTitle', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label htmlFor="seoDescription" className="block text-sm font-medium text-gray-700 mb-1">
                  SEO Description
                </label>
                <textarea
                  id="seoDescription"
                  rows={3}
                  value={formData.seoDescription}
                  onChange={(e) => handleFieldChange('seoDescription', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              href={`/admin/branches/${slug}`}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}



