'use client';

import { XCircle, Home, RefreshCw, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function BookingFailedPage() {
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

      {/* Failed Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 text-center">
          <div className="mb-6">
            <XCircle className="w-20 h-20 text-red-500 mx-auto" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment didn't go through</h1>
          <p className="text-xl text-gray-600 mb-6">
            We couldn't process your payment. This could be due to several reasons:
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-gray-900 mb-3">Common reasons:</h2>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Insufficient funds or card declined</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Incorrect card information entered</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Card expired or security code incorrect</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-600 mr-2">•</span>
                <span>Network or connection issue</span>
              </li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/booking"
              className="inline-flex items-center justify-center bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-8 rounded-lg transition"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Try Again
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold py-3 px-8 rounded-lg transition"
            >
              <Home className="w-5 h-5 mr-2" />
              Return to Home
            </Link>
          </div>
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-2">Need help?</p>
            <p className="text-sm text-gray-700">
              Call us at <a href="tel:9732809190" className="text-primary-600 hover:text-primary-700 font-semibold">(973) 280-9190</a> or{' '}
              <a href="mailto:hello@velocitymaid.com" className="text-primary-600 hover:text-primary-700 font-semibold">email us</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

