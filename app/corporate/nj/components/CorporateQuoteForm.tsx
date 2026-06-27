"use client";

import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function CorporateQuoteForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    businessType: '',
    squareFootage: '',
    cleaningFrequency: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/corporate/request-quote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          branch: 'new-jersey',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitted(true);
      } else {
        alert(data.error || 'Failed to submit quote request');
      }
    } catch (error) {
      console.error('Submit quote error:', error);
      alert('Failed to submit quote request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[#F8C548] text-[#0A3D2F] p-8 rounded-xl text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
          Thank You!
        </h3>
        <p className="text-lg mb-4">
          We've received your quote request. Our team will contact you within 24 hours.
        </p>
        <p className="text-sm">
          In the meantime, feel free to download our corporate service documents above.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
            Your Name *
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
          <label htmlFor="email" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
            placeholder="john@business.com"
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
          <label htmlFor="businessName" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
            Business Name *
          </label>
          <input
            type="text"
            id="businessName"
            required
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
            placeholder="ABC Company"
          />
        </div>

        <div>
          <label htmlFor="businessType" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
            Business Type *
          </label>
          <select
            id="businessType"
            required
            value={formData.businessType}
            onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
          >
            <option value="">Select business type</option>
            <option value="office">Office</option>
            <option value="salon">Salon/Barbershop</option>
            <option value="restaurant">Restaurant</option>
            <option value="retail">Retail Store</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="squareFootage" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
            Square Footage *
          </label>
          <input
            type="text"
            id="squareFootage"
            required
            value={formData.squareFootage}
            onChange={(e) => setFormData({ ...formData, squareFootage: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
            placeholder="2,500"
          />
        </div>

        <div className="md:col-span-2">
          <label htmlFor="cleaningFrequency" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
            Cleaning Frequency *
          </label>
          <select
            id="cleaningFrequency"
            required
            value={formData.cleaningFrequency}
            onChange={(e) => setFormData({ ...formData, cleaningFrequency: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
          >
            <option value="">Select frequency</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="bi-weekly">Bi-Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom Schedule</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-[#0A3D2F] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#083025] transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
      >
        {isSubmitting ? 'Submitting...' : (
          <>
            Request a Quote
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="text-sm text-vm-muted text-center mt-4">
        By submitting this form, you agree to be contacted by VelocityMaid regarding corporate cleaning services.
      </p>
    </form>
  );
}

