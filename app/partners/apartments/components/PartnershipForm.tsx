'use client';

import { useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function PartnershipForm() {
  const [formData, setFormData] = useState({
    name: '',
    property: '',
    email: '',
    phone: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // In production, this would send to an API endpoint
    console.log('Form submitted:', formData);
    
    setSubmitted(true);
    setIsSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="bg-[#F8C548] text-[#0A3D2F] p-8 rounded-xl text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto mb-4" />
        <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Montserrat, Poppins, sans-serif' }}>
          Thank You!
        </h3>
        <p className="text-lg mb-4">
          We've received your partnership inquiry. Our team will contact you within 24 hours.
        </p>
        <p className="text-sm">
          In the meantime, feel free to download our partnership documents above.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-xl shadow-lg">
      <div className="space-y-6">
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
          <label htmlFor="property" className="block text-sm font-semibold text-[#0A3D2F] mb-2">
            Property Name *
          </label>
          <input
            type="text"
            id="property"
            required
            value={formData.property}
            onChange={(e) => setFormData({ ...formData, property: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F8C548] focus:border-[#F8C548] outline-none"
            placeholder="Oakwood Apartments"
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
            placeholder="john@property.com"
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#0A3D2F] text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-[#083025] transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? 'Submitting...' : (
            <>
              Submit Partnership Request
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>

        <p className="text-sm text-gray-600 text-center">
          By submitting this form, you agree to be contacted by VelocityMaid regarding partnership opportunities.
        </p>
      </div>
    </form>
  );
}

