'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <Sparkles className="w-24 h-24 text-primary-600 mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h2>
          <p className="text-xl text-gray-600 mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-primary-600 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-700 transition"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center bg-white text-primary-600 border-2 border-primary-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-primary-50 transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link href="/" className="text-gray-600 hover:text-primary-600 transition">
            Home
          </Link>
          <Link href="/booking" className="text-gray-600 hover:text-primary-600 transition">
            Book Now
          </Link>
          <Link href="/gallery" className="text-gray-600 hover:text-primary-600 transition">
            Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}


