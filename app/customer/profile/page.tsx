'use client';

import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface CustomerProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  defaultAddress: string | null;
  createdAt: string;
}

export default function CustomerProfilePage() {
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [defaultAddress, setDefaultAddress] = useState('');

  // Validation errors
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/customer/me');
      const data = await response.json();

      if (data.success) {
        setProfile(data.customer);
        setFirstName(data.customer.firstName || '');
        setLastName(data.customer.lastName || '');
        setPhone(data.customer.phone || '');
        setDefaultAddress(data.customer.defaultAddress || '');
      } else {
        throw new Error(data.error || 'Failed to fetch profile');
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate firstName (required, min 2 characters)
    if (!firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    // Validate lastName (optional, but if provided must be at least 2 characters)
    if (lastName.trim().length > 0 && lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters if provided';
    }

    // Validate phone (optional, should match regex)
    if (phone.trim().length > 0) {
      const phoneRegex = /^[0-9()+\-\s]{7,20}$/;
      if (!phoneRegex.test(phone.trim())) {
        errors.phone = 'Phone must be 7-20 digits, spaces, dashes, parentheses, or plus sign';
      }
    }

    // Validate defaultAddress (optional, min 5 characters)
    if (defaultAddress.trim().length > 0 && defaultAddress.trim().length < 5) {
      errors.defaultAddress = 'Address must be at least 5 characters if provided';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setValidationErrors({});

    // Client-side validation
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch('/api/customer/profile/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim() || null,
          phone: phone.trim() || null,
          defaultAddress: defaultAddress.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to update profile');
      }

      // Success
      setSuccess(true);
      setProfile(data.customer);
      // Update local state with saved values
      setFirstName(data.customer.firstName || '');
      setLastName(data.customer.lastName || '');
      setPhone(data.customer.phone || '');
      setDefaultAddress(data.customer.defaultAddress || '');
      
      // Hide success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error updating profile:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading profile...</span>
      </div>
    );
  }

  return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
          <p className="text-gray-600">Manage your account information</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <p className="text-green-800">Profile updated successfully.</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Profile Form */}
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (validationErrors.firstName) {
                        setValidationErrors(prev => {
                          const next = { ...prev };
                          delete next.firstName;
                          return next;
                        });
                      }
                    }}
                    required
                    minLength={2}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      validationErrors.firstName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {validationErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (validationErrors.lastName) {
                        setValidationErrors(prev => {
                          const next = { ...prev };
                          delete next.lastName;
                          return next;
                        });
                      }
                    }}
                    minLength={2}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                      validationErrors.lastName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                </div>
                {validationErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email (Read-only) */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
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
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (validationErrors.phone) {
                      setValidationErrors(prev => {
                        const next = { ...prev };
                        delete next.phone;
                        return next;
                      });
                    }
                  }}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    validationErrors.phone ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="(973) 555-1234"
                />
              </div>
              {validationErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">Format: 7-20 digits, spaces, dashes, parentheses, or plus sign</p>
            </div>

            {/* Default Address */}
            <div>
              <label htmlFor="defaultAddress" className="block text-sm font-medium text-gray-700 mb-2">
                Default Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  id="defaultAddress"
                  value={defaultAddress}
                  onChange={(e) => {
                    setDefaultAddress(e.target.value);
                    if (validationErrors.defaultAddress) {
                      setValidationErrors(prev => {
                        const next = { ...prev };
                        delete next.defaultAddress;
                        return next;
                      });
                    }
                  }}
                  rows={3}
                  minLength={5}
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none ${
                    validationErrors.defaultAddress ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="123 Main St, City, State ZIP"
                />
              </div>
              {validationErrors.defaultAddress && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.defaultAddress}</p>
              )}
            </div>

            {/* Account Info (Read-only) */}
            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Account Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Member Since</span>
                  <span className="text-gray-900">
                    {profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
  );
}
