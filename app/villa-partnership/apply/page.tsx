'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, User, MessageCircle, Bed, Bath, Calendar, Package, FileText, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function VillaPartnershipApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    propertyName: '',
    managerName: '',
    whatsapp: '',
    bedrooms: '',
    bathrooms: '',
    turnoverFrequency: '',
    needsInventory: false,
    needsLinenService: false,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.propertyName || !formData.managerName || !formData.whatsapp || !formData.bedrooms || !formData.bathrooms || !formData.turnoverFrequency) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/villa/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          bedrooms: parseInt(formData.bedrooms),
          bathrooms: parseInt(formData.bathrooms),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/villa-partnership/apply/success');
        }, 2000);
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setError(err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link
            href="/villa-partnership"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            ← Back to Villa Partnership
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Apply for Villa Partnership
          </h1>
          <p className="text-lg text-gray-600">
            Join our partnership program and get professional turnover cleaning for your villa
          </p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-semibold text-green-900">Application submitted successfully!</p>
              <p className="text-sm text-green-700">Redirecting to confirmation page...</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div>
            <label htmlFor="propertyName" className="block text-sm font-medium text-gray-700 mb-1">
              <Home className="w-4 h-4 inline mr-1" />
              Property Name *
            </label>
            <input
              type="text"
              id="propertyName"
              value={formData.propertyName}
              onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="e.g., Oceanview Villa"
              required
            />
          </div>

          <div>
            <label htmlFor="managerName" className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              Manager/Owner Name *
            </label>
            <input
              type="text"
              id="managerName"
              value={formData.managerName}
              onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700 mb-1">
              <MessageCircle className="w-4 h-4 inline mr-1" />
              WhatsApp Number (876-xxx-xxxx) *
            </label>
            <input
              type="tel"
              id="whatsapp"
              value={formData.whatsapp}
              onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="876-123-4567"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Include country code (876) for Jamaica</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="bedrooms" className="block text-sm font-medium text-gray-700 mb-1">
                <Bed className="w-4 h-4 inline mr-1" />
                Number of Bedrooms *
              </label>
              <input
                type="number"
                id="bedrooms"
                min="1"
                value={formData.bedrooms}
                onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>

            <div>
              <label htmlFor="bathrooms" className="block text-sm font-medium text-gray-700 mb-1">
                <Bath className="w-4 h-4 inline mr-1" />
                Number of Bathrooms *
              </label>
              <input
                type="number"
                id="bathrooms"
                min="1"
                value={formData.bathrooms}
                onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="turnoverFrequency" className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Turnover Frequency *
            </label>
            <select
              id="turnoverFrequency"
              value={formData.turnoverFrequency}
              onChange={(e) => setFormData({ ...formData, turnoverFrequency: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              required
            >
              <option value="">Select frequency</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Seasonal">Seasonal</option>
            </select>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Services
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.needsInventory}
                onChange={(e) => setFormData({ ...formData, needsInventory: e.target.checked })}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Package className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700">I need inventory check and reporting</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.needsLinenService}
                onChange={(e) => setFormData({ ...formData, needsLinenService: e.target.checked })}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <Bed className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700">I need linen reset service</span>
            </label>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              Additional Notes
            </label>
            <textarea
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Tell us about your villa, special requirements, or any questions..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Application
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

