'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CustomerLayout from '../components/CustomerLayout';
import { getCustomerPreferences } from '@/utils/customerData';
import type { CustomerPreferences } from '@/utils/customerData';

export default function CustomerPreferencesPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<CustomerPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form state
  const [preferredTimeWindow, setPreferredTimeWindow] = useState<'morning' | 'afternoon' | 'evening' | ''>('');
  const [preferredDayOfWeek, setPreferredDayOfWeek] = useState<number | ''>('');
  const [notesForCleaner, setNotesForCleaner] = useState('');
  const [allowWhatsApp, setAllowWhatsApp] = useState(true);
  const [allowEmail, setAllowEmail] = useState(true);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const customerResponse = await fetch('/api/customer/me');
      if (!customerResponse.ok) {
        if (customerResponse.status === 401) {
          router.push('/customer/login');
          return;
        }
        throw new Error('Failed to fetch customer info');
      }

      const customerData = await customerResponse.json();
      if (customerData.success) {
        const customerId = customerData.customer.id;
        const prefs = getCustomerPreferences(customerId);
        
        if (prefs) {
          setPreferences(prefs);
          setPreferredTimeWindow(prefs.preferredTimeWindow || '');
          setPreferredDayOfWeek(prefs.preferredDayOfWeek ?? '');
          setNotesForCleaner(prefs.notesForCleaner || '');
          setAllowWhatsApp(prefs.allowWhatsApp);
          setAllowEmail(prefs.allowEmail);
        }
      }
    } catch (err: any) {
      console.error('Error fetching preferences:', err);
      setError(err.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/customer/preferences/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferredTimeWindow: preferredTimeWindow || null,
          preferredDayOfWeek: preferredDayOfWeek !== '' ? preferredDayOfWeek : null,
          notesForCleaner: notesForCleaner.trim() || null,
          allowWhatsApp,
          allowEmail,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setPreferences(data.preferences);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(data.error || 'Failed to update preferences');
      }
    } catch (err: any) {
      console.error('Error updating preferences:', err);
      setError(err.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const dayOptions = [
    { value: '', label: 'Any Day' },
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ];

  if (loading) {
    return (
      <CustomerLayout>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-vm-muted">Loading...</p>
        </div>
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-vm-text mb-2">Preferences</h1>
        <p className="text-vm-muted">Manage your cleaning preferences and communication settings</p>
      </div>

      {success && (
        <div className="bg-vm-success-bg border border-vm-success/30 rounded-xl p-4 mb-6">
          <p className="text-vm-success">Preferences updated successfully!</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Preferred Time Window */}
        <div>
          <label className="block text-sm font-medium text-vm-text mb-3">
            Preferred Time Window
          </label>
          <div className="flex gap-3">
            {(['morning', 'afternoon', 'evening'] as const).map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => setPreferredTimeWindow(
                  preferredTimeWindow === time ? '' : time
                )}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  preferredTimeWindow === time
                    ? 'bg-vm-navy text-white shadow-md'
                    : 'bg-gray-200 text-vm-text hover:bg-gray-300'
                }`}
              >
                {time.charAt(0).toUpperCase() + time.slice(1)}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-vm-muted">
            Morning: 8 AM - 12 PM | Afternoon: 12 PM - 4 PM | Evening: 4 PM - 8 PM
          </p>
        </div>

        {/* Preferred Day of Week */}
        <div>
          <label className="block text-sm font-medium text-vm-text mb-2">
            Preferred Day of Week
          </label>
          <select
            value={preferredDayOfWeek}
            onChange={(e) => setPreferredDayOfWeek(e.target.value === '' ? '' : parseInt(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            {dayOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notes for Cleaner */}
        <div>
          <label className="block text-sm font-medium text-vm-text mb-2">
            General Notes for Cleaner
          </label>
          <p className="text-xs text-vm-muted mb-2">
            Anything you want us to remember for every clean
          </p>
          <textarea
            value={notesForCleaner}
            onChange={(e) => setNotesForCleaner(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="e.g., Please pay extra attention to the kitchen, or Please use eco-friendly products..."
          />
        </div>

        {/* Communication Preferences */}
        <div>
          <label className="block text-sm font-medium text-vm-text mb-3">
            Communication Preferences
          </label>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowEmail}
                onChange={(e) => setAllowEmail(e.target.checked)}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-vm-text">Email updates</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={allowWhatsApp}
                onChange={(e) => setAllowWhatsApp(e.target.checked)}
                className="w-5 h-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-vm-text">WhatsApp updates</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-vm-navy text-white py-3 rounded-lg font-semibold hover:bg-vm-navy transition-colors disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </CustomerLayout>
  );
}




