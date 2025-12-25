"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Phone, Mail, Settings, Calendar, Globe, CheckCircle, AlertCircle, HelpCircle, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import Toast from '../../components/Toast';

interface FieldErrors {
  [key: string]: string;
}

export default function NewBranchPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [showPreview, setShowPreview] = useState(false);
  const [managers, setManagers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [pricingModels, setPricingModels] = useState<Array<{ id: string; name: string }>>([]);

  // Form state
  const [formData, setFormData] = useState({
    // Branch Identity
    name: '',
    slug: '',
    regionLabel: '',
    timezone: 'America/New_York',
    
    // Location
    country: 'United States',
    state: '',
    city: '',
    zipCodes: '10001\n10002\n10003\n10004\n10005',
    
    // Contact
    primaryPhone: '',
    whatsappNumber: '',
    bookingEmail: '',
    supportEmail: '',
    
    // Management
    managerId: '',
    maxDailyJobs: '',
    
    // Pricing
    pricingModelId: '',
    cloneDefaultPackages: true,
    templateBranchId: '',
    
    // Automations
    bookingWebhookUrl: '',
    reminderWebhookUrl: '',
    reviewWebhookUrl: '',
    whatsappTemplateBooking: '',
    whatsappTemplateReminder: '',
    whatsappTemplateReview: '',
    
    // Launch
    status: 'COMING_SOON' as 'ACTIVE' | 'COMING_SOON' | 'PAUSED',
    generateLandingPage: true,
    enableBookings: false,
  });

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Branch name is required';
    }

    if (!formData.slug.trim()) {
      errors.slug = 'Slug is required';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (!formData.state.trim()) {
      errors.state = 'State is required';
    }

    if (!formData.city.trim()) {
      errors.city = 'City is required';
    }

    const zipCodes = formData.zipCodes
      .split('\n')
      .map(z => z.trim())
      .filter(z => z.length > 0);

    if (zipCodes.length === 0) {
      errors.zipCodes = 'At least one ZIP code is required';
    } else {
      const invalidZips = zipCodes.filter(z => !/^\d{5}(-\d{4})?$/.test(z));
      if (invalidZips.length > 0) {
        errors.zipCodes = `Invalid ZIP codes: ${invalidZips.join(', ')}`;
      }
    }

    if (!formData.primaryPhone.trim()) {
      errors.primaryPhone = 'Primary phone is required';
    }

    if (!formData.whatsappNumber.trim()) {
      errors.whatsappNumber = 'WhatsApp number is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setFieldErrors({});

    try {
      // Parse ZIP codes
      const zipCodes = formData.zipCodes
        .split('\n')
        .map(z => z.trim())
        .filter(z => z.length > 0);

      const response = await fetch('/api/admin/branches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
          router.push(`/admin/branches`);
        }, 2000);
      } else {
        setError(data.error || 'Failed to create branch');
        setShowToast(true);
      }
    } catch (err: any) {
      console.error('Error creating branch:', err);
      setError(err.message || 'Failed to create branch');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
  };

  const generateSlug = () => {
    if (!formData.slug) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData({ ...formData, slug });
    }
  };

  // Load managers and pricing models
  useEffect(() => {
    // Load managers
    fetch('/api/admin/users?role=MANAGER')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.users) {
          setManagers(data.users.map((u: any) => ({ id: u.id, name: u.name || u.email, email: u.email })));
        }
      })
      .catch(() => {
        // Mock data if API not available
        setManagers([
          { id: 'manager_1', name: 'John Manager', email: 'john@velocitymaid.com' },
          { id: 'manager_2', name: 'Jane Manager', email: 'jane@velocitymaid.com' },
        ]);
      });

    // Load pricing models
    fetch('/api/admin/pricing-models')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.models) {
          setPricingModels(data.models.map((m: any) => ({ id: m.id, name: m.name })));
        }
      })
      .catch(() => {
        // Mock data if API not available
        setPricingModels([
          { id: 'pricing_1', name: 'Standard Pricing' },
          { id: 'pricing_2', name: 'Premium Pricing' },
        ]);
      });
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Branch</h1>
          <p className="text-gray-600">Set up a new VelocityMaid location with service areas, pricing, and automations</p>
        </div>

        <Toast
          message={success ? 'Branch created successfully! Redirecting...' : (error || 'Failed to create branch')}
          type={success ? 'success' : 'error'}
          visible={showToast}
          onClose={() => setShowToast(false)}
        />

        {success && !showToast && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-600 font-medium">Branch created successfully! Redirecting...</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Branch Identity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Branch Identity</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Branch Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  onBlur={generateSlug}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                    fieldErrors.name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="VelocityMaid New York"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => handleFieldChange('slug', e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors font-mono ${
                    fieldErrors.slug ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="new-york"
                />
                {fieldErrors.slug ? (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldErrors.slug}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Used in URLs: /locations/{formData.slug || 'slug'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Region Label
                </label>
                <input
                  type="text"
                  value={formData.regionLabel}
                  onChange={(e) => handleFieldChange('regionLabel', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                  placeholder="NYC Metro"
                />
                <p className="text-xs text-gray-500 mt-1">Optional: Display name for the region</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone *
                </label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location & Service Area */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Location & Service Area</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                    fieldErrors.state ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="New York"
                />
                {fieldErrors.state && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldErrors.state}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                    fieldErrors.city ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="New York"
                />
                {fieldErrors.city && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldErrors.city}
                  </p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ZIP Codes (one per line) *
              </label>
              <textarea
                value={formData.zipCodes}
                onChange={(e) => handleFieldChange('zipCodes', e.target.value)}
                required
                rows={8}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none font-mono text-sm transition-colors ${
                  fieldErrors.zipCodes ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="10001&#10;10002&#10;10003"
              />
              {fieldErrors.zipCodes ? (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {fieldErrors.zipCodes}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">Enter one ZIP code per line. Example ZIPs are prefilled.</p>
              )}
            </div>
          </div>

          {/* Contact & Communications */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Phone className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Contact & Communications</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Phone *
                </label>
                <input
                  type="tel"
                  value={formData.primaryPhone}
                  onChange={(e) => handleFieldChange('primaryPhone', e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                    fieldErrors.primaryPhone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="+19731234567"
                />
                {fieldErrors.primaryPhone && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldErrors.primaryPhone}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  WhatsApp Number *
                </label>
                <input
                  type="tel"
                  value={formData.whatsappNumber}
                  onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-colors ${
                    fieldErrors.whatsappNumber ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="+19731234567"
                />
                {fieldErrors.whatsappNumber && (
                  <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {fieldErrors.whatsappNumber}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Email
                </label>
                <input
                  type="email"
                  value={formData.bookingEmail}
                  onChange={(e) => setFormData({ ...formData, bookingEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="bookings@velocitymaid.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  value={formData.supportEmail}
                  onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="support@velocitymaid.com"
                />
              </div>
            </div>
          </div>

          {/* Management */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Management</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager
                </label>
                <select
                  value={formData.managerId}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Select Manager (Optional)</option>
                  {managers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.name} ({manager.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Assign a manager to oversee this branch</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Daily Jobs
                </label>
                <input
                  type="number"
                  value={formData.maxDailyJobs}
                  onChange={(e) => setFormData({ ...formData, maxDailyJobs: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="50"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Packages */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Pricing & Packages</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Model
                </label>
                <select
                  value={formData.pricingModelId}
                  onChange={(e) => setFormData({ ...formData, pricingModelId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="">Select Pricing Model (Optional)</option>
                  {pricingModels.map(model => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Leave empty to use default pricing. Can be set later.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="cloneDefaultPackages"
                  checked={formData.cloneDefaultPackages}
                  onChange={(e) => setFormData({ ...formData, cloneDefaultPackages: e.target.checked })}
                  className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="cloneDefaultPackages" className="text-sm font-medium text-gray-700">
                  Clone default VelocityMaid service packages for this branch
                </label>
              </div>
            </div>
          </div>

          {/* Automations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Automations</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Webhook URL
                </label>
                <input
                  type="url"
                  value={formData.bookingWebhookUrl}
                  onChange={(e) => setFormData({ ...formData, bookingWebhookUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="https://zapier.com/webhook/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminder Webhook URL
                </label>
                <input
                  type="url"
                  value={formData.reminderWebhookUrl}
                  onChange={(e) => setFormData({ ...formData, reminderWebhookUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="https://zapier.com/webhook/..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Review Webhook URL
                </label>
                <input
                  type="url"
                  value={formData.reviewWebhookUrl}
                  onChange={(e) => setFormData({ ...formData, reviewWebhookUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="https://zapier.com/webhook/..."
                />
              </div>
            </div>
          </div>

          {/* Status & Launch */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Status & Launch</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status *
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  <option value="COMING_SOON">Coming Soon</option>
                  <option value="ACTIVE">Active</option>
                  <option value="PAUSED">Paused</option>
                </select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="generateLandingPage"
                    checked={formData.generateLandingPage}
                    onChange={(e) => setFormData({ ...formData, generateLandingPage: e.target.checked })}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="generateLandingPage" className="text-sm font-medium text-gray-700">
                    Generate landing page content stub
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="enableBookings"
                    checked={formData.enableBookings}
                    onChange={(e) => setFormData({ ...formData, enableBookings: e.target.checked })}
                    className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="enableBookings" className="text-sm font-medium text-gray-700">
                    Enable bookings immediately
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600" />
                Branch Preview
              </h3>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {formData.name || 'Not set'}</p>
                <p><strong>Slug:</strong> {formData.slug || 'Not set'}</p>
                <p><strong>Location:</strong> {formData.city}, {formData.state}, {formData.country}</p>
                <p><strong>ZIP Codes:</strong> {formData.zipCodes.split('\n').filter(z => z.trim()).length} codes</p>
                <p><strong>Status:</strong> {formData.status}</p>
                <p><strong>Phone:</strong> {formData.primaryPhone || 'Not set'}</p>
                <p><strong>WhatsApp:</strong> {formData.whatsappNumber || 'Not set'}</p>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium flex items-center gap-2"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Hide Preview' : 'Preview'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating Branch...
                </>
              ) : (
                'Create Branch'
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

