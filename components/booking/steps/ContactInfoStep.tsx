'use client';

import React, { useState, useEffect } from 'react';
import { useBooking } from '../BookingContext';
import { User, Mail, Phone, MapPin, Loader2 } from 'lucide-react';

export default function ContactInfoStep() {
  const { data, update } = useBooking();
  const [loadingCustomer, setLoadingCustomer] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Auto-fill for logged-in customers
  useEffect(() => {
    // Only auto-fill if email is still empty (don't overwrite user input)
    if (data.contact.email.trim() !== '') {
      return;
    }

    setLoadingCustomer(true);
    fetch('/api/customer/me')
      .then((res) => res.json())
      .then((result) => {
        if (result.authenticated && result.customer) {
          const customer = result.customer;
          // Only pre-fill if fields are empty (don't overwrite user input)
          update({
            contact: {
              firstName: data.contact.firstName || customer.firstName || '',
              lastName: data.contact.lastName || customer.lastName || '',
              email: data.contact.email || customer.email || '',
              phone: data.contact.phone || customer.phone || '',
              streetAddress: data.contact.streetAddress || customer.streetAddress || '',
              city: data.contact.city || customer.city || '',
              state: data.contact.state || customer.state || '',
              zip: data.contact.zip || customer.zip || '',
            },
          });
        }
      })
      .catch((err) => {
        console.warn('Failed to load customer info:', err);
        // Not authenticated or error - that's fine, user is anonymous
      })
      .finally(() => {
        setLoadingCustomer(false);
      });
  }, []); // Only run once on mount

  const validateField = (field: string, value: string) => {
    const errors: Record<string, string> = { ...validationErrors };

    if (field === 'email') {
      if (!value.trim()) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(value.trim())) {
        errors.email = 'Please enter a valid email address';
      } else {
        delete errors.email;
      }
    } else if (field === 'firstName') {
      if (!value.trim()) {
        errors.firstName = 'First name is required';
      } else {
        delete errors.firstName;
      }
    } else {
      delete errors[field];
    }

    setValidationErrors(errors);
  };

  const handleFieldChange = (field: keyof typeof data.contact, value: string) => {
    update({
      contact: {
        ...data.contact,
        [field]: value,
      },
    });
    validateField(field, value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Contact Information</h2>
        <p className="text-gray-600">We'll use this to send your estimate and confirm your booking</p>
      </div>

      {loadingCustomer && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2 text-sm text-blue-700">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading your information...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="firstName"
              type="text"
              value={data.contact.firstName}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              onBlur={(e) => validateField('firstName', e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="John"
            />
          </div>
          {validationErrors.firstName && (
            <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="lastName"
              type="text"
              value={data.contact.lastName}
              onChange={(e) => handleFieldChange('lastName', e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Doe"
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address *
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="email"
            type="email"
            value={data.contact.email}
            onChange={(e) => handleFieldChange('email', e.target.value)}
            onBlur={(e) => validateField('email', e.target.value)}
            required
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="john@example.com"
          />
        </div>
        {validationErrors.email && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            id="phone"
            type="tel"
            value={data.contact.phone}
            onChange={(e) => handleFieldChange('phone', e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="(973) 555-1234"
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">Optional, but recommended for booking confirmations</p>
      </div>

      {/* Address Fields (Optional) */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">Service Address (Optional)</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-2">
              Street Address
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="streetAddress"
                type="text"
                value={data.contact.streetAddress || ''}
                onChange={(e) => handleFieldChange('streetAddress', e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="123 Main St"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                id="city"
                type="text"
                value={data.contact.city || ''}
                onChange={(e) => handleFieldChange('city', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Newark"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                id="state"
                type="text"
                value={data.contact.state || ''}
                onChange={(e) => handleFieldChange('state', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="NJ"
                maxLength={2}
              />
            </div>

            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Code
              </label>
              <input
                id="zip"
                type="text"
                value={data.contact.zip || ''}
                onChange={(e) => handleFieldChange('zip', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="07102"
                maxLength={10}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

