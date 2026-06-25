'use client';

import { useSearchParams } from 'next/navigation';
import { Sparkles, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SignUpSuccessPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-vm-surface via-white to-vm-surface">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/saas" className="flex items-center space-x-2">
            <Sparkles className="w-7 h-7 text-vm-cyan-dark" />
            <span className="text-xl font-bold text-vm-text">VelocityMaid</span>
          </Link>
        </div>
      </nav>

      {/* Success Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-vm-success-bg rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-vm-text mb-4">
            Welcome to VelocityMaid!
          </h1>
          
          <p className="text-lg text-vm-muted mb-2">
            Your account has been created successfully.
          </p>
          
          {email && (
            <p className="text-sm text-vm-muted mb-8">
              We've sent a confirmation email to <strong>{email}</strong>
            </p>
          )}

          <div className="bg-vm-surface border border-vm-border rounded-lg p-6 mb-8 text-left">
            <h2 className="font-semibold text-vm-text mb-3">What's Next?</h2>
            <ul className="space-y-2 text-sm text-vm-text">
              <li className="flex items-start">
                <span className="text-vm-cyan-dark mr-2">✓</span>
                <span>Check your email for login instructions</span>
              </li>
              <li className="flex items-start">
                <span className="text-vm-cyan-dark mr-2">✓</span>
                <span>Start your 14-day free trial (no credit card required)</span>
              </li>
              <li className="flex items-start">
                <span className="text-vm-cyan-dark mr-2">✓</span>
                <span>Add your first contractors and start managing your team</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/saas/login"
              className="inline-flex items-center justify-center bg-vm-navy text-white px-6 py-3 rounded-lg font-semibold hover:bg-vm-navy transition"
            >
              Sign In to Your Account
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              href="/saas"
              className="inline-flex items-center justify-center bg-gray-100 text-vm-text px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

