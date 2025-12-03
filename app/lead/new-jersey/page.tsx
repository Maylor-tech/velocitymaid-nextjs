'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function LeadCapturePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    zip: '',
    bedrooms: '',
    bathrooms: '',
    urgency: '',
    homeType: '',
    previousService: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/leads/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          branch: 'new-jersey',
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : undefined,
          bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : undefined,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Failed to submit lead');
      }
    } catch (err) {
      console.error('Submit lead error:', err);
      setError('Failed to submit lead. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A3D2F] to-[#083025] text-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white text-[#0A3D2F] rounded-2xl shadow-2xl p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Thank You!
          </h2>
          <p className="text-gray-700 mb-6">
            We've received your information and will contact you shortly via WhatsApp.
          </p>
          <Link
            href="/locations/new-jersey"
            className="inline-block bg-[#0A3D2F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#083025] transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A3D2F] to-[#083025]">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-[#F8C548]" />
            <span className="text-2xl font-bold text-white" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
              VelocityMaid
            </span>
          </Link>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-[#0A3D2F] mb-2 text-center" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
            Get Your Free Quote
          </h1>
          <p className="text-gray-600 text-center mb-8">
            Tell us about your cleaning needs and we'll get back to you right away!
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <p className="text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
                  placeholder="John Smith"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
                  placeholder="(555) 123-4567"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="zip" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  id="zip"
                  required
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
                  placeholder="07030"
                  maxLength={5}
                />
              </div>

              <div>
                <label htmlFor="bedrooms" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Bedrooms
                </label>
                <select
                  id="bedrooms"
                  value={formData.bedrooms}
                  onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
                >
                  <option value="">Select</option>
                  <option value="1">1 Bedroom</option>
                  <option value="2">2 Bedrooms</option>
                  <option value="3">3 Bedrooms</option>
                  <option value="4">4 Bedrooms</option>
                  <option value="5">5+ Bedrooms</option>
                </select>
              </div>

              <div>
                <label htmlFor="bathrooms" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Bathrooms
                </label>
                <select
                  id="bathrooms"
                  value={formData.bathrooms}
                  onChange={(e) => setFormData({ ...formData, bathrooms: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
                >
                  <option value="">Select</option>
                  <option value="1">1 Bathroom</option>
                  <option value="2">2 Bathrooms</option>
                  <option value="3">3 Bathrooms</option>
                  <option value="4">4+ Bathrooms</option>
                </select>
              </div>

              <div>
                <label htmlFor="urgency" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  When do you need cleaning? *
                </label>
                <select
                  id="urgency"
                  required
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
                >
                  <option value="">Select</option>
                  <option value="asap">ASAP</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="exploring">Just Exploring</option>
                </select>
              </div>

              <div>
                <label htmlFor="homeType" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Home Type
                </label>
                <select
                  id="homeType"
                  value={formData.homeType}
                  onChange={(e) => setFormData({ ...formData, homeType: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
                >
                  <option value="">Select</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.previousService}
                  onChange={(e) => setFormData({ ...formData, previousService: e.target.checked })}
                  className="w-4 h-4 text-[#0A3D2F] border-gray-300 rounded focus:ring-[#F8C548]"
                />
                <span className="text-sm text-gray-700">I've used a cleaning service before</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0A3D2F] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#083025] transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Get My Free Quote'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

