"use client";

import { useState, useEffect } from 'react';
import { Calendar, DollarSign, MessageSquare, Eye, Send, CheckCircle2, XCircle } from 'lucide-react';

interface Promo {
  id: string;
  month: number;
  year: number;
  title: string;
  description: string;
  discountType: string;
  discountValue: number;
  active: boolean;
  startDate: string;
  endDate: string;
}

interface PromoManagementClientProps {
  branchId: string;
  branchSlug: string;
  currentPromo: Promo | null;
  allPromos: Promo[];
  currentMonth: number;
  currentYear: number;
}

export default function PromoManagementClient({
  branchId,
  branchSlug,
  currentPromo,
  allPromos,
  currentMonth,
  currentYear,
}: PromoManagementClientProps) {
  const [formData, setFormData] = useState({
    month: currentMonth,
    year: currentYear,
    title: currentPromo?.title || '',
    description: currentPromo?.description || '',
    discountType: currentPromo?.discountType || 'percent',
    discountValue: currentPromo?.discountValue || 15,
    startDate: currentPromo?.startDate ? new Date(currentPromo.startDate).toISOString().split('T')[0] : '',
    endDate: currentPromo?.endDate ? new Date(currentPromo.endDate).toISOString().split('T')[0] : '',
    active: currentPromo?.active ?? true,
  });

  const [whatsappPreview, setWhatsappPreview] = useState('');
  const [smsPreview, setSmsPreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Generate date range for selected month
  useEffect(() => {
    const year = formData.year;
    const month = formData.month;
    const firstDay = new Date(year, month - 1, 1);
    const lastDay = new Date(year, month, 0);
    
    if (!formData.startDate) {
      setFormData(prev => ({
        ...prev,
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
      }));
    }
  }, [formData.month, formData.year]);

  // Generate message previews
  useEffect(() => {
    const discountText = formData.discountType === 'percent'
      ? `${formData.discountValue}% OFF`
      : `$${formData.discountValue} OFF`;
    
    const whatsappMsg = `🎉 ${formData.title || 'Monthly Special'}!

${formData.description || 'Special promotion this month'}

Get ${discountText} on your next cleaning!

Book now: https://velocitymaid.com/booking?branch=${branchSlug}&promo=${formData.month}-${formData.year}

Valid until ${formData.endDate ? new Date(formData.endDate).toLocaleDateString() : 'end of month'}`;

    const smsMsg = `${formData.title || 'Monthly Special'}: ${discountText} on cleaning! Book: https://velocitymaid.com/booking?branch=${branchSlug}&promo=${formData.month}-${formData.year}`;

    setWhatsappPreview(whatsappMsg);
    setSmsPreview(smsMsg);
  }, [formData, branchSlug]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const response = await fetch(`/api/admin/branches/${branchSlug}/promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSaveStatus('success');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Save promo error:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSend = async (channel: 'whatsapp' | 'sms') => {
    try {
      const response = await fetch(`/api/automations/promo/test-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          channel,
          message: channel === 'whatsapp' ? whatsappPreview : smsPreview,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(`Test ${channel.toUpperCase()} sent successfully!`);
      } else {
        alert(`Failed to send test ${channel.toUpperCase()}: ${data.error}`);
      }
    } catch (error) {
      console.error('Test send error:', error);
      alert(`Error sending test ${channel.toUpperCase()}`);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  return (
    <div className="space-y-6">
      {/* Current Promo Status */}
      {currentPromo && (
        <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${currentPromo.active ? 'border-green-500' : 'border-gray-300'}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Current Promo: {monthNames[currentPromo.month - 1]} {currentPromo.year}
              </h2>
              <p className="text-gray-600">{currentPromo.title}</p>
            </div>
            <div className={`px-4 py-2 rounded-full ${currentPromo.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
              {currentPromo.active ? (
                <span className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Active
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <XCircle className="w-4 h-4" />
                  Inactive
                </span>
              )}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Discount:</span>
              <span className="ml-2 font-semibold">
                {currentPromo.discountType === 'percent' 
                  ? `${currentPromo.discountValue}%`
                  : `$${currentPromo.discountValue}`}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Valid:</span>
              <span className="ml-2 font-semibold">
                {new Date(currentPromo.startDate).toLocaleDateString()} - {new Date(currentPromo.endDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Status:</span>
              <span className="ml-2 font-semibold">
                {currentPromo.active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Promo Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {currentPromo ? 'Edit Promo' : 'Create New Promo'}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Month *
            </label>
            <select
              value={formData.month}
              onChange={(e) => setFormData({ ...formData, month: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {monthNames.map((name, index) => (
                <option key={index} value={index + 1}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Year *
            </label>
            <input
              type="number"
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={new Date().getFullYear()}
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Spring Cleaning Special"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the promotion..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Discount Type *
            </label>
            <select
              value={formData.discountType}
              onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Discount Value *
            </label>
            <input
              type="number"
              value={formData.discountValue}
              onChange={(e) => setFormData({ ...formData, discountValue: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              min={1}
              max={formData.discountType === 'percent' ? 100 : 1000}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Start Date *
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              End Date *
            </label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-semibold text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Promo'}
          </button>
          {saveStatus === 'success' && (
            <span className="text-green-600 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" />
              Saved successfully!
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600 font-semibold">Error saving promo</span>
          )}
        </div>
      </div>

      {/* Message Previews */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              WhatsApp Preview
            </h3>
            <button
              onClick={() => handleTestSend('whatsapp')}
              className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Test Send
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <pre className="text-sm whitespace-pre-wrap font-sans">
              {whatsappPreview || 'Preview will appear here...'}
            </pre>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              SMS Preview
            </h3>
            <button
              onClick={() => handleTestSend('sms')}
              className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Test Send
            </button>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <pre className="text-sm whitespace-pre-wrap font-sans">
              {smsPreview || 'Preview will appear here...'}
            </pre>
          </div>
        </div>
      </div>

      {/* Past Promos */}
      {allPromos.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Past Promos</h3>
          <div className="space-y-2">
            {allPromos.map((promo) => (
              <div key={promo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-semibold">
                    {monthNames[promo.month - 1]} {promo.year}
                  </span>
                  <span className="ml-4 text-gray-600">{promo.title}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    {promo.discountType === 'percent' 
                      ? `${promo.discountValue}%`
                      : `$${promo.discountValue}`}
                  </span>
                  {promo.active ? (
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">Inactive</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

