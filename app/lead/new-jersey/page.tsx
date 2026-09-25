"use client";

import { useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import {
  NJ_FREQUENCY_OPTIONS,
  NJ_LEAD_SOURCES,
  NJ_SERVICE_CITIES,
  NJ_SERVICE_TYPE_OPTIONS,
  njCitiesShortList,
} from '@/lib/markets/newJersey';

export default function LeadCapturePage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    zip: '',
    addressLine: '',
    bedrooms: '',
    bathrooms: '',
    homeType: '',
    serviceType: 'RECURRING',
    frequency: 'biweekly',
    preferredDate: '',
    urgency: 'this_week',
    referralSource: '',
    previousService: false,
    pets: false,
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
          source: 'lead-new-jersey-page',
          bedrooms: formData.bedrooms ? parseInt(formData.bedrooms, 10) : undefined,
          bathrooms: formData.bathrooms
            ? parseInt(formData.bathrooms, 10)
            : undefined,
          preferredDate: formData.preferredDate || undefined,
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
          <CheckCircle2 className="w-16 h-16 text-vm-success mx-auto mb-4" />
          <h2
            className="text-2xl font-bold mb-4"
            style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}
          >
            Thank You!
          </h2>
          <p className="text-vm-text mb-6">
            We&apos;ve received your request. Our New Jersey team will follow up
            shortly. Quoting and scheduling stay with VelocityMaid.
          </p>
          <Link
            href="/new-jersey"
            className="inline-block bg-[#0A3D2F] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#083025] transition"
          >
            Back to New Jersey
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A3D2F] to-[#083025]">
      <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <Sparkles className="w-8 h-8 text-[#F8C548]" />
            <span
              className="text-2xl font-bold text-white"
              style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}
            >
              VelocityMaid
            </span>
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <h1
            className="text-4xl font-bold text-[#0A3D2F] mb-2 text-center"
            style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}
          >
            Get Your Free Quote
          </h1>
          <p className="text-vm-muted text-center mb-2">
            Recurring residential cleaning first — then deep cleans and
            move-in/move-out.
          </p>
          <p className="text-vm-muted text-center text-sm mb-8">
            Serving {njCitiesShortList()}.
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
                />
              </div>
              <div>
                <label htmlFor="referralSource" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  How did you hear about us? *
                </label>
                <select
                  id="referralSource"
                  required
                  value={formData.referralSource}
                  onChange={(e) =>
                    setFormData({ ...formData, referralSource: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
                >
                  <option value="">Select</option>
                  {NJ_LEAD_SOURCES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  City / town *
                </label>
                <select
                  id="city"
                  required
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
                >
                  <option value="">Select</option>
                  {NJ_SERVICE_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
                  maxLength={5}
                />
              </div>
            </div>

            <div>
              <label htmlFor="addressLine" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                Property address *
              </label>
              <input
                type="text"
                id="addressLine"
                required
                value={formData.addressLine}
                onChange={(e) =>
                  setFormData({ ...formData, addressLine: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
                placeholder="Street address, unit if applicable"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="serviceType" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Service type *
                </label>
                <select
                  id="serviceType"
                  required
                  value={formData.serviceType}
                  onChange={(e) =>
                    setFormData({ ...formData, serviceType: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
                >
                  {NJ_SERVICE_TYPE_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="frequency" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Frequency *
                </label>
                <select
                  id="frequency"
                  required
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
                >
                  {NJ_FREQUENCY_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="preferredDate" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Preferred date *
                </label>
                <input
                  type="date"
                  id="preferredDate"
                  required
                  value={formData.preferredDate}
                  onChange={(e) =>
                    setFormData({ ...formData, preferredDate: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
                />
              </div>
              <div>
                <label htmlFor="urgency" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Timing preference *
                </label>
                <select
                  id="urgency"
                  required
                  value={formData.urgency}
                  onChange={(e) =>
                    setFormData({ ...formData, urgency: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
                >
                  <option value="asap">As soon as possible</option>
                  <option value="this_week">This week</option>
                  <option value="next_week">Next week</option>
                  <option value="flexible">Flexible</option>
                </select>
              </div>
              <div>
                <label htmlFor="bedrooms" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Bedrooms *
                </label>
                <select
                  id="bedrooms"
                  required
                  value={formData.bedrooms}
                  onChange={(e) =>
                    setFormData({ ...formData, bedrooms: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5+</option>
                </select>
              </div>
              <div>
                <label htmlFor="bathrooms" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Bathrooms *
                </label>
                <select
                  id="bathrooms"
                  required
                  value={formData.bathrooms}
                  onChange={(e) =>
                    setFormData({ ...formData, bathrooms: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>
              </div>
              <div>
                <label htmlFor="homeType" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
                  Home type *
                </label>
                <select
                  id="homeType"
                  required
                  value={formData.homeType}
                  onChange={(e) =>
                    setFormData({ ...formData, homeType: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] outline-none"
                >
                  <option value="">Select</option>
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                  <option value="house">House</option>
                  <option value="townhome">Townhome</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-[#0A3D2F]">
              <input
                type="checkbox"
                checked={formData.pets}
                onChange={(e) =>
                  setFormData({ ...formData, pets: e.target.checked })
                }
              />
              Pets in the home
            </label>
            <label className="flex items-center gap-2 text-sm text-[#0A3D2F]">
              <input
                type="checkbox"
                checked={formData.previousService}
                onChange={(e) =>
                  setFormData({ ...formData, previousService: e.target.checked })
                }
              />
              I&apos;ve used VelocityMaid before
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0A3D2F] text-white py-4 rounded-lg font-semibold hover:bg-[#083025] transition disabled:opacity-60"
            >
              {isSubmitting ? 'Submitting…' : 'Request my quote'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
