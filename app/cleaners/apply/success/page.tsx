'use client';

import { CheckCircle, Home, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CleanerApplySuccess() {
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

      {/* Success Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-8">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
          <div className="mb-6">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto" />
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Application Submitted!
          </h1>

          <p className="text-lg text-gray-700 mb-6 max-w-xl mx-auto">
            Thank you for applying to join VelocityMaid. Our team will review your application and contact you soon.
          </p>

          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-primary-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-primary-800 space-y-1">
              <li>• We'll review your application within 2-3 business days</li>
              <li>• If selected, we'll contact you to schedule an interview</li>
              <li>• You'll receive comprehensive training before starting</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              <Home className="w-5 h-5" />
              Return to Homepage
            </Link>
            <Link
              href="/locations/port-antonio"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Learn More
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


