"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MessageCircle, Link as LinkIcon, Settings, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import AdminLayout from '../../../components/AdminLayout';
import Toast from '../../../components/Toast';

interface Branch {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  status: string;
}

export default function AutomationPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    branchId: '',
    bookingWebhookUrl: '',
    reminderWebhookUrl: '',
    reviewWebhookUrl: '',
    whatsappTemplateBooking: '',
    whatsappTemplateReminder: '',
    whatsappTemplateReview: '',
    createdAt: '',
    updatedAt: '',
  });

  useEffect(() => {
    if (slug) {
      fetchBranchAndAutomationConfig();
    }
  }, [slug]);

  const fetchBranchAndAutomationConfig = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch branch
      const branchResponse = await fetch(`/api/admin/branches/${slug}`);
      const branchData = await branchResponse.json();

      if (!branchData.success || !branchData.branch) {
        setError('Branch not found.');
        setLoading(false);
        return;
      }

      const fetchedBranch = branchData.branch;
      setBranch(fetchedBranch);

      // Fetch automation config for this branch
      const response = await fetch(`/api/admin/branches/${slug}/whatsapp-automation`);
      const data = await response.json();

      if (data.success && data.config) {
        setFormData({
          id: data.config.id,
          branchId: data.config.branchId,
          bookingWebhookUrl: data.config.bookingWebhookUrl || '',
          reminderWebhookUrl: data.config.reminderWebhookUrl || '',
          reviewWebhookUrl: data.config.reviewWebhookUrl || '',
          whatsappTemplateBooking: data.config.whatsappTemplateBooking || '',
          whatsappTemplateReminder: data.config.whatsappTemplateReminder || '',
          whatsappTemplateReview: data.config.whatsappTemplateReview || '',
          createdAt: data.config.createdAt,
          updatedAt: data.config.updatedAt,
        });
      } else if (!data.config) {
        // No existing config, initialize with branchId
        setFormData({
          id: '',
          branchId: fetchedBranch.id,
          bookingWebhookUrl: '',
          reminderWebhookUrl: '',
          reviewWebhookUrl: '',
          whatsappTemplateBooking: '',
          whatsappTemplateReminder: '',
          whatsappTemplateReview: '',
          createdAt: '',
          updatedAt: '',
        });
      } else {
        setError(data.error || 'Failed to fetch automation config.');
      }
    } catch (err: any) {
      console.error('Error fetching branch or automation config:', err);
      setError(err.message || 'Failed to load automation configuration.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(false);

    if (!branch) {
      setError('Branch not loaded.');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/admin/branches/${slug}/whatsapp-automation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setShowToast(true);
        // Update formData with actual ID and timestamps if it was a new creation
        if (data.config) {
          setFormData(data.config);
        }
      } else {
        setError(data.error || 'Failed to save automation configuration.');
        setShowToast(true);
      }
    } catch (err: any) {
      console.error('Error saving automation config:', err);
      setError(err.message || 'Failed to save automation configuration.');
      setShowToast(true);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading automation settings...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error && !branch) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-red-600">{error}</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            WhatsApp Automation for {branch?.name}
          </h1>
          <p className="text-gray-600">
            Configure automated WhatsApp messages and webhooks for this branch.
          </p>
        </div>

        <Toast
          message={success ? 'Automation settings saved successfully!' : (error || 'Failed to save settings.')}
          type={success ? 'success' : 'error'}
          visible={showToast}
          onClose={() => setShowToast(false)}
        />

        <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-blue-600" /> Webhook URLs
            </h2>
            <p className="text-sm text-gray-600">
              These webhooks will be triggered for various events to integrate with external systems (e.g., Zapier).
            </p>
            <div>
              <label htmlFor="bookingWebhookUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Booking Confirmation Webhook URL
              </label>
              <input
                type="url"
                id="bookingWebhookUrl"
                value={formData.bookingWebhookUrl || ''}
                onChange={(e) => setFormData({ ...formData, bookingWebhookUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://your-webhook-url.com/booking"
              />
            </div>
            <div>
              <label htmlFor="reminderWebhookUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Reminder Webhook URL
              </label>
              <input
                type="url"
                id="reminderWebhookUrl"
                value={formData.reminderWebhookUrl || ''}
                onChange={(e) => setFormData({ ...formData, reminderWebhookUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://your-webhook-url.com/reminder"
              />
            </div>
            <div>
              <label htmlFor="reviewWebhookUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Review Request Webhook URL
              </label>
              <input
                type="url"
                id="reviewWebhookUrl"
                value={formData.reviewWebhookUrl || ''}
                onChange={(e) => setFormData({ ...formData, reviewWebhookUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="https://your-webhook-url.com/review"
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 mt-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" /> WhatsApp Template IDs
            </h2>
            <p className="text-sm text-gray-600">
              Enter the template IDs for your pre-approved WhatsApp message templates.
            </p>
            <div>
              <label htmlFor="whatsappTemplateBooking" className="block text-sm font-medium text-gray-700 mb-1">
                Booking Confirmation Template ID
              </label>
              <input
                type="text"
                id="whatsappTemplateBooking"
                value={formData.whatsappTemplateBooking || ''}
                onChange={(e) => setFormData({ ...formData, whatsappTemplateBooking: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="booking_confirmation_template"
              />
            </div>
            <div>
              <label htmlFor="whatsappTemplateReminder" className="block text-sm font-medium text-gray-700 mb-1">
                Reminder Template ID
              </label>
              <input
                type="text"
                id="whatsappTemplateReminder"
                value={formData.whatsappTemplateReminder || ''}
                onChange={(e) => setFormData({ ...formData, whatsappTemplateReminder: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="24h_reminder_template"
              />
            </div>
            <div>
              <label htmlFor="whatsappTemplateReview" className="block text-sm font-medium text-gray-700 mb-1">
                Review Request Template ID
              </label>
              <input
                type="text"
                id="whatsappTemplateReview"
                value={formData.whatsappTemplateReview || ''}
                onChange={(e) => setFormData({ ...formData, whatsappTemplateReview: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                placeholder="post_service_review_template"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary inline-flex items-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Saving...
                </>
              ) : (
                'Save Automation Settings'
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}



