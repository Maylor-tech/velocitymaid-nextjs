'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Sparkles } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-vm-surface to-white flex items-center justify-center px-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <Sparkles className="w-24 h-24 text-vm-cyan-dark mx-auto mb-4" />
          <h1 className="text-6xl font-bold text-vm-text mb-4">404</h1>
          <h2 className="text-3xl font-bold text-vm-text mb-4">Page Not Found</h2>
          <p className="text-xl text-vm-muted mb-8">
            Oops! The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center bg-vm-navy text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-vm-navy transition"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Homepage
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center bg-white text-vm-cyan-dark border-2 border-vm-navy px-8 py-4 rounded-full font-semibold text-lg hover:bg-vm-surface transition"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Link href="/" className="text-vm-muted hover:text-vm-cyan-dark transition">
            Home
          </Link>
          <Link href="/book" className="text-vm-muted hover:text-vm-cyan-dark transition">
            Book Now
          </Link>
          <Link href="/gallery" className="text-vm-muted hover:text-vm-cyan-dark transition">
            Gallery
          </Link>
        </div>
      </div>
    </div>
  );
}


