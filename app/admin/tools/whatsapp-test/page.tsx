"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, MessageSquare, Send } from 'lucide-react';
import AdminLayout from '@/app/admin/components/AdminLayout';
import { sendWhatsAppMessage } from '@/app/services/whatsappService';
import { sendWhatsAppBookingConfirmation, sendCleanerOnboardingMessage } from '@/app/services/whatsappTemplates';

export default function WhatsAppTestPage() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null);

  const handleSendTestMessage = async () => {
    if (!phoneNumber.trim()) {
      setResult({ success: false, error: 'Please enter a phone number' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await sendWhatsAppMessage(
        phoneNumber,
        '🧹 Test message from VelocityMaid WhatsApp system!\n\nThis is a test to verify WhatsApp integration is working correctly.'
      );

      if (response.success) {
        setResult({ success: true, message: `Message sent successfully! Message ID: ${response.messageId}` });
      } else {
        setResult({ success: false, error: response.error || 'Failed to send message' });
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message || 'Failed to send message' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendJamaicaConfirmation = async () => {
    if (!phoneNumber.trim()) {
      setResult({ success: false, error: 'Please enter a phone number' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await sendWhatsAppBookingConfirmation({
        phone: phoneNumber,
        branch: 'port-antonio',
        service: 'Standard Clean',
        date: new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        price: 8000,
        currency: 'JMD',
      });

      if (response.success) {
        setResult({ success: true, message: `Jamaica booking confirmation sent! Message ID: ${response.messageId}` });
      } else {
        setResult({ success: false, error: response.error || 'Failed to send confirmation' });
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message || 'Failed to send confirmation' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendCleanerOnboarding = async () => {
    if (!phoneNumber.trim()) {
      setResult({ success: false, error: 'Please enter a phone number' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await sendCleanerOnboardingMessage(phoneNumber, 'Port Antonio');

      if (response.success) {
        setResult({ success: true, message: `Cleaner onboarding message sent! Message ID: ${response.messageId}` });
      } else {
        setResult({ success: false, error: response.error || 'Failed to send onboarding message' });
      }
    } catch (error: any) {
      setResult({ success: false, error: error.message || 'Failed to send onboarding message' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-green-600" />
            WhatsApp Test Tools
          </h1>
          <p className="text-gray-600">
            Test WhatsApp messaging functionality for Jamaica operations
          </p>
        </div>

        {/* Phone Number Input */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number (with country code)
          </label>
          <input
            type="tel"
            id="phone"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+18765551985 or 18765551985"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            Format: Include country code (e.g., +1 for US, +1876 for Jamaica)
          </p>
        </div>

        {/* Test Buttons */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={handleSendTestMessage}
            disabled={loading}
            className="flex flex-col items-center justify-center gap-3 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <Send className="w-6 h-6" />
                <span>Send Test Message</span>
              </>
            )}
          </button>

          <button
            onClick={handleSendJamaicaConfirmation}
            disabled={loading}
            className="flex flex-col items-center justify-center gap-3 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <CheckCircle className="w-6 h-6" />
                <span>Send Jamaica Confirmation</span>
              </>
            )}
          </button>

          <button
            onClick={handleSendCleanerOnboarding}
            disabled={loading}
            className="flex flex-col items-center justify-center gap-3 px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <MessageSquare className="w-6 h-6" />
                <span>Send Cleaner Onboarding</span>
              </>
            )}
          </button>
        </div>

        {/* Result Display */}
        {result && (
          <div
            className={`rounded-xl p-6 ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-2 ${
                    result.success ? 'text-green-900' : 'text-red-900'
                  }`}
                >
                  {result.success ? 'Success!' : 'Error'}
                </h3>
                <p
                  className={`text-sm ${
                    result.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {result.message || result.error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mt-6">
          <h3 className="font-semibold text-blue-900 mb-3">Environment Variables Required</h3>
          <ul className="list-disc list-inside text-blue-800 space-y-1 text-sm">
            <li><code className="bg-blue-100 px-1 rounded">WHATSAPP_TOKEN</code> - Meta WhatsApp API access token</li>
            <li><code className="bg-blue-100 px-1 rounded">WHATSAPP_PHONE_ID</code> - WhatsApp Business Phone Number ID</li>
            <li><code className="bg-blue-100 px-1 rounded">WHATSAPP_VERIFY_TOKEN</code> - Webhook verification token (default: velocitymaid-webhook)</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
}

