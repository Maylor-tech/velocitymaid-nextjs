"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Loader2, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';

export default function CleanerPaymentMethodPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountType: '',
    whatsappNumber: '',
  });

  useEffect(() => {
    loadPaymentMethod();
  }, []);

  const loadPaymentMethod = async () => {
    try {
      setLoading(true);
      setError(null);

      const meRes = await fetch('/api/cleaners/me');
      const meData = await meRes.json();

      if (!meRes.ok || !meData.success) {
        setError(meData.error || 'Please log in to manage your payment method.');
        return;
      }

      const response = await fetch('/api/cleaners/payment-method/get');
      const data = await response.json();

      if (response.status === 401) {
        setError('Please log in to manage your payment method.');
        return;
      }

      if (data.success && data.paymentMethod) {
        setFormData({
          bankName: data.paymentMethod.bankName || '',
          accountNumber: data.paymentMethod.accountNumber || '',
          accountType: data.paymentMethod.accountType || '',
          whatsappNumber: data.paymentMethod.whatsappNumber || '',
        });
      }
    } catch (err: unknown) {
      console.error('Error fetching payment method:', err);
      setError('Unable to load payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const response = await fetch('/api/cleaners/payment-method/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(data.error || 'Failed to update payment method');
      }
    } catch (err: any) {
      console.error('Error updating payment method:', err);
      setError(err.message || 'Failed to update payment method');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#0A3D2F]" />
      </div>
    );
  }

  if (error && !formData.bankName && !formData.accountNumber) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-vm-text mb-4">{error}</p>
          <Link
            href="/cleaners/login?redirect=/cleaners/payment-method"
            className="text-[#0A3D2F] font-semibold hover:underline"
          >
            Log in to continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link
            href="/cleaners/dashboard"
            className="inline-flex items-center gap-2 text-vm-muted hover:text-vm-text mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-vm-text flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-[#0A3D2F]" />
            Payment Method
          </h1>
          <p className="text-vm-muted mt-1">
            Update your banking details for payouts
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-green-800 font-medium">Payment method updated successfully!</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Bank Name */}
            <div>
              <label htmlFor="bankName" className="block text-sm font-medium text-vm-text mb-2">
                Bank Name
              </label>
              <input
                type="text"
                id="bankName"
                value={formData.bankName}
                onChange={(e) => handleFieldChange('bankName', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="e.g., National Commercial Bank"
              />
            </div>

            {/* Account Number */}
            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-vm-text mb-2">
                Account Number
              </label>
              <input
                type="text"
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="Enter your account number"
              />
            </div>

            {/* Account Type */}
            <div>
              <label htmlFor="accountType" className="block text-sm font-medium text-vm-text mb-2">
                Account Type
              </label>
              <select
                id="accountType"
                value={formData.accountType}
                onChange={(e) => handleFieldChange('accountType', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="">Select account type</option>
                <option value="SAVINGS">Savings</option>
                <option value="CHECKING">Checking</option>
              </select>
            </div>

            {/* WhatsApp Number */}
            <div>
              <label htmlFor="whatsappNumber" className="block text-sm font-medium text-vm-text mb-2">
                WhatsApp Number
              </label>
              <input
                type="tel"
                id="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="+18765551985"
              />
              <p className="text-xs text-vm-muted mt-1">
                Include country code (e.g., +1876 for Jamaica)
              </p>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={saving}
                className="w-full px-6 py-3 bg-[#0A3D2F] text-white rounded-lg hover:bg-[#083025] transition-colors font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Payment Method
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Why do we need this?</h3>
          <p className="text-blue-800 text-sm">
            We use your banking details to process payouts for completed jobs. Your WhatsApp number
            helps us send you notifications about your payouts. All information is kept secure and
            confidential.
          </p>
        </div>
      </div>
    </div>
  );
}

