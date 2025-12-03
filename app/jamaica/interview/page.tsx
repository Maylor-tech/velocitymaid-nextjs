'use client';

import { Calendar, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

declare global {
  interface Window {
    Calendly: any;
  }
}

export default function InterviewPage() {
  useEffect(() => {
    // Load Calendly script
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    // Also load the CSS
    const link = document.createElement('link');
    link.href = 'https://assets.calendly.com/assets/external/widget.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, []);

  // Calendly username/event - replace with actual Calendly details
  const CALENDLY_USERNAME = process.env.NEXT_PUBLIC_CALENDLY_USERNAME || 'velocitymaid';
  const CALENDLY_EVENT = process.env.NEXT_PUBLIC_CALENDLY_EVENT || 'jamaica-cleaner-interview';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/jamaica/work-with-us"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Work With Us
          </Link>
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Schedule Your Interview</h1>
              <p className="text-gray-600 mt-1">
                Book a time to speak with our team about joining VelocityMaid Jamaica
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendly Widget */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div
            className="calendly-inline-widget"
            data-url={`https://calendly.com/${CALENDLY_USERNAME}/${CALENDLY_EVENT}`}
            style={{ minWidth: '320px', height: '700px' }}
          />
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Interview Details</h3>
          <ul className="space-y-2 text-gray-700">
            <li>• Interview will be conducted via video call (Zoom/Google Meet)</li>
            <li>• Please have your ID and any relevant documents ready</li>
            <li>• The interview typically takes 15-20 minutes</li>
            <li>• We'll discuss your experience, availability, and answer any questions</li>
            <li>• After the interview, we'll review and get back to you within 2-3 business days</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

