'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Home, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { sendGAEvent } from '@next/third-parties/google';

interface FormData {
  firstName: string;
  lastInitial: string;
  phone: string;
  email: string;
  address: string;
  serviceType: string;
  preferredDate: string;
  preferredTime: string;
  addOns: {
    laundry: boolean;
    windows: boolean;
    oven: boolean;
    refrigerator: boolean;
  };
  specialInstructions: string;
}

const SERVICE_PRICES: Record<string, number> = {
  basic: 120,
  deep: 220,
  moveInOut: 320,
};

const ADDON_PRICES = {
  laundry: 15,
  windows: 20,
  oven: 30,
  refrigerator: 25,
};

export default function BookingPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastInitial: '',
    phone: '',
    email: '',
    address: '',
    serviceType: '',
    preferredDate: '',
    preferredTime: '',
    addOns: {
      laundry: false,
      windows: false,
      oven: false,
      refrigerator: false,
    },
    specialInstructions: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof FormData, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

  // Track booking_started event when page loads
  useEffect(() => {
    sendGAEvent('event', 'booking_started', {
      page_path: '/booking',
      page_title: 'Booking Page'
    });
  }, []);

  // Calculate total price
  useEffect(() => {
    let total = 0;
    
    if (formData.serviceType) {
      total += SERVICE_PRICES[formData.serviceType] || 0;
    }
    
    if (formData.addOns.laundry) total += ADDON_PRICES.laundry;
    if (formData.addOns.windows) total += ADDON_PRICES.windows;
    if (formData.addOns.oven) total += ADDON_PRICES.oven;
    if (formData.addOns.refrigerator) total += ADDON_PRICES.refrigerator;
    
    setTotalPrice(total);
  }, [formData.serviceType, formData.addOns]);

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (30 days from today)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  // Format phone number
  const formatPhoneNumber = (value: string) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length <= 3) return phoneNumber;
    if (phoneNumber.length <= 6) {
      return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3)}`;
    }
    return `(${phoneNumber.slice(0, 3)}) ${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    handleFieldChange('phone', formatted);
  };


  // Individual field validation functions
  const validateField = (field: keyof FormData, value: any): string => {
    switch (field) {
      case 'firstName':
        if (!value.trim()) return 'First name is required';
        if (value.trim().length < 2) return 'First name must be at least 2 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(value.trim())) return 'First name can only contain letters, spaces, hyphens, and apostrophes';
        return '';
      case 'lastInitial':
        if (!value.trim()) return 'Last initial is required';
        if (!/^[A-Z]$/.test(value)) return 'Please enter exactly one letter';
        return '';
      case 'phone':
        const phoneDigits = value.replace(/\D/g, '');
        if (!phoneDigits) return 'Phone number is required';
        if (phoneDigits.length !== 10) return 'Please enter a valid 10-digit phone number';
        return '';
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Please enter a valid email address (e.g., john@example.com)';
        return '';
      case 'address':
        if (!value.trim()) return 'Address is required';
        if (value.trim().length < 10) return 'Please enter a complete address (at least 10 characters)';
        return '';
      case 'serviceType':
        if (!value) return 'Please select a service type';
        return '';
      case 'preferredDate':
        if (!value) return 'Please select a preferred date';
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        if (selectedDate < today) return 'Date cannot be in the past';
        if (selectedDate > maxDate) return 'Date must be within the next 30 days';
        return '';
      case 'preferredTime':
        if (!value) return 'Please select a preferred time';
        return '';
      default:
        return '';
    }
  };

  // Handle blur event for real-time validation
  const handleBlur = (field: keyof FormData) => {
    setTouched({ ...touched, [field]: true });
    const error = validateField(field, formData[field]);
    setErrors({ ...errors, [field]: error });
  };

  // Clear error when user starts typing
  const handleFieldChange = (field: keyof FormData, value: any) => {
    setFormData({ ...formData, [field]: value });
    // Clear error if field was previously touched and is now valid
    if (touched[field]) {
      const error = validateField(field, value);
      if (!error) {
        const newErrors = { ...errors };
        delete newErrors[field];
        setErrors(newErrors);
      } else {
        setErrors({ ...errors, [field]: error });
      }
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    const fieldsToValidate: (keyof FormData)[] = [
      'firstName', 'lastInitial', 'phone', 'email', 'address',
      'serviceType', 'preferredDate', 'preferredTime'
    ];

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    setTouched({
      firstName: true,
      lastInitial: true,
      phone: true,
      email: true,
      address: true,
      serviceType: true,
      preferredDate: true,
      preferredTime: true,
    });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          totalPrice,
        }),
      });

      const data = await response.json();

      if (response.ok && data.url) {
        // Track booking_submitted event
        sendGAEvent('event', 'booking_submitted', {
          service_type: formData.serviceType,
          total_price: totalPrice,
          has_addons: Object.values(formData.addOns).some(v => v)
        });
        window.location.href = data.url;
      } else {
        alert(data.error || 'Something went wrong. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center space-x-2 text-primary-600 hover:text-primary-700">
            <Sparkles className="w-6 h-6" />
            <span className="text-xl font-bold">VelocityMaid</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <Calendar className="w-16 h-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Book Your Cleaning Service</h1>
          <p className="text-xl text-gray-600">Quick & easy booking in 60 seconds</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 space-y-6">
              {/* Contact Info Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Home className="w-6 h-6 mr-2 text-primary-600" />
                  Contact Info
                </h2>
                <div className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleFieldChange('firstName', e.target.value)}
                        onBlur={() => handleBlur('firstName')}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.firstName ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="John"
                        aria-invalid={errors.firstName ? 'true' : 'false'}
                        aria-describedby={errors.firstName ? 'firstName-error' : undefined}
                      />
                      {errors.firstName && <p id="firstName-error" className="text-red-500 text-sm mt-1" role="alert">{errors.firstName}</p>}
                    </div>
                    <div>
                      <label htmlFor="lastInitial" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Initial *
                      </label>
                      <input
                        type="text"
                        id="lastInitial"
                        value={formData.lastInitial}
                        onChange={(e) => {
                          const value = e.target.value.toUpperCase().slice(0, 1);
                          handleFieldChange('lastInitial', value);
                        }}
                        onBlur={() => handleBlur('lastInitial')}
                        maxLength={1}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-center text-2xl font-bold ${
                          errors.lastInitial ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="M"
                        aria-invalid={errors.lastInitial ? 'true' : 'false'}
                        aria-describedby={errors.lastInitial ? 'lastInitial-error' : undefined}
                      />
                      {errors.lastInitial && <p id="lastInitial-error" className="text-red-500 text-sm mt-1" role="alert">{errors.lastInitial}</p>}
                    </div>
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      onBlur={() => handleBlur('phone')}
                      maxLength={14}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.phone ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="(973) 555-1234"
                      aria-invalid={errors.phone ? 'true' : 'false'}
                      aria-describedby={errors.phone ? 'phone-error' : undefined}
                    />
                    {errors.phone && <p id="phone-error" className="text-red-500 text-sm mt-1" role="alert">{errors.phone}</p>}
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      onBlur={() => handleBlur('email')}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="john@example.com"
                      aria-invalid={errors.email ? 'true' : 'false'}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                    />
                    {errors.email && <p id="email-error" className="text-red-500 text-sm mt-1" role="alert">{errors.email}</p>}
                  </div>
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                      Address *
                    </label>
                    <input
                      type="text"
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      onBlur={() => handleBlur('address')}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                        errors.address ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="123 Main St, Newark, NJ 07102"
                      aria-invalid={errors.address ? 'true' : 'false'}
                      aria-describedby={errors.address ? 'address-error' : undefined}
                    />
                    {errors.address && <p id="address-error" className="text-red-500 text-sm mt-1" role="alert">{errors.address}</p>}
                  </div>
                </div>
              </div>

              {/* Service Selection Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <Sparkles className="w-6 h-6 mr-2 text-primary-600" />
                  Service Selection
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Service Type *
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 border border-gray-200">
                        <input
                          type="radio"
                          name="serviceType"
                          value="basic"
                          checked={formData.serviceType === 'basic'}
                          onChange={(e) => handleFieldChange('serviceType', e.target.value)}
                          onBlur={() => handleBlur('serviceType')}
                          className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                          aria-invalid={errors.serviceType ? 'true' : 'false'}
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">Basic Clean</span>
                          <span className="text-primary-600 font-bold ml-2">$120</span>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 border border-gray-200">
                        <input
                          type="radio"
                          name="serviceType"
                          value="deep"
                          checked={formData.serviceType === 'deep'}
                          onChange={(e) => handleFieldChange('serviceType', e.target.value)}
                          onBlur={() => handleBlur('serviceType')}
                          className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                          aria-invalid={errors.serviceType ? 'true' : 'false'}
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">Deep Clean</span>
                          <span className="text-primary-600 font-bold ml-2">$220</span>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg hover:bg-gray-50 border border-gray-200">
                        <input
                          type="radio"
                          name="serviceType"
                          value="moveInOut"
                          checked={formData.serviceType === 'moveInOut'}
                          onChange={(e) => handleFieldChange('serviceType', e.target.value)}
                          onBlur={() => handleBlur('serviceType')}
                          className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300"
                          aria-invalid={errors.serviceType ? 'true' : 'false'}
                        />
                        <div className="flex-1">
                          <span className="font-semibold text-gray-900">Move In/Out</span>
                          <span className="text-primary-600 font-bold ml-2">$320</span>
                        </div>
                      </label>
                    </div>
                    {errors.serviceType && <p className="text-red-500 text-sm mt-1" role="alert">{errors.serviceType}</p>}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="preferredDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Date *
                      </label>
                      <input
                        type="date"
                        id="preferredDate"
                        value={formData.preferredDate}
                        onChange={(e) => handleFieldChange('preferredDate', e.target.value)}
                        onBlur={() => handleBlur('preferredDate')}
                        min={getMinDate()}
                        max={getMaxDate()}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.preferredDate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        aria-invalid={errors.preferredDate ? 'true' : 'false'}
                        aria-describedby={errors.preferredDate ? 'preferredDate-error' : undefined}
                      />
                      {errors.preferredDate && <p id="preferredDate-error" className="text-red-500 text-sm mt-1" role="alert">{errors.preferredDate}</p>}
                    </div>
                    <div>
                      <label htmlFor="preferredTime" className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Time *
                      </label>
                      <select
                        id="preferredTime"
                        value={formData.preferredTime}
                        onChange={(e) => handleFieldChange('preferredTime', e.target.value)}
                        onBlur={() => handleBlur('preferredTime')}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                          errors.preferredTime ? 'border-red-500' : 'border-gray-300'
                        }`}
                        aria-invalid={errors.preferredTime ? 'true' : 'false'}
                        aria-describedby={errors.preferredTime ? 'preferredTime-error' : undefined}
                      >
                        <option value="">Select a time</option>
                        <option value="morning">Morning (9 AM - 12 PM)</option>
                        <option value="afternoon">Afternoon (12 PM - 3 PM)</option>
                        <option value="evening">Evening (3 PM - 6 PM)</option>
                      </select>
                      {errors.preferredTime && <p id="preferredTime-error" className="text-red-500 text-sm mt-1" role="alert">{errors.preferredTime}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Add-ons Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Add-ons (Optional)</h2>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.addOns.laundry}
                      onChange={(e) => setFormData({
                        ...formData,
                        addOns: { ...formData.addOns, laundry: e.target.checked }
                      })}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="flex-1 text-gray-700">Laundry ($15/load)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.addOns.windows}
                      onChange={(e) => setFormData({
                        ...formData,
                        addOns: { ...formData.addOns, windows: e.target.checked }
                      })}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="flex-1 text-gray-700">Interior Windows ($20/room)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.addOns.oven}
                      onChange={(e) => setFormData({
                        ...formData,
                        addOns: { ...formData.addOns, oven: e.target.checked }
                      })}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="flex-1 text-gray-700">Inside Oven ($30)</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
                    <input
                      type="checkbox"
                      checked={formData.addOns.refrigerator}
                      onChange={(e) => setFormData({
                        ...formData,
                        addOns: { ...formData.addOns, refrigerator: e.target.checked }
                      })}
                      className="w-5 h-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="flex-1 text-gray-700">Inside Refrigerator ($25)</span>
                  </label>
                </div>
              </div>

              {/* Special Instructions */}
              <div>
                <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                  Special Instructions (Optional)
                </label>
                <textarea
                  id="specialInstructions"
                  value={formData.specialInstructions}
                  onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value.slice(0, 200) })}
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Any special requests or notes..."
                />
                <p className="text-sm text-gray-500 mt-1">{formData.specialInstructions.length}/200 characters</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Secure Payment</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Price Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h3>
              <div className="space-y-3 mb-4">
                {formData.serviceType && (
                  <div className="flex justify-between text-gray-700">
                    <span>
                      {formData.serviceType === 'basic' && 'Basic Clean'}
                      {formData.serviceType === 'deep' && 'Deep Clean'}
                      {formData.serviceType === 'moveInOut' && 'Move In/Out'}
                    </span>
                    <span className="font-semibold">${SERVICE_PRICES[formData.serviceType]}</span>
                  </div>
                )}
                {formData.addOns.laundry && (
                  <div className="flex justify-between text-gray-700 text-sm">
                    <span>Laundry</span>
                    <span>${ADDON_PRICES.laundry}</span>
                  </div>
                )}
                {formData.addOns.windows && (
                  <div className="flex justify-between text-gray-700 text-sm">
                    <span>Interior Windows</span>
                    <span>${ADDON_PRICES.windows}</span>
                  </div>
                )}
                {formData.addOns.oven && (
                  <div className="flex justify-between text-gray-700 text-sm">
                    <span>Inside Oven</span>
                    <span>${ADDON_PRICES.oven}</span>
                  </div>
                )}
                {formData.addOns.refrigerator && (
                  <div className="flex justify-between text-gray-700 text-sm">
                    <span>Inside Refrigerator</span>
                    <span>${ADDON_PRICES.refrigerator}</span>
                  </div>
                )}
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-primary-600">
                    ${totalPrice || 0}
                  </span>
                </div>
              </div>
              {totalPrice === 0 && (
                <p className="text-sm text-gray-500 mt-2 text-center">Select a service to see total</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

