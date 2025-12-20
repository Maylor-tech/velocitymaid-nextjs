'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const redirectUrl = searchParams.get('redirect') || '/customer/dashboard';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDevCode(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/customer/auth/request-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to send login code');
      }

      if (data.code) {
        // Dev mode: show code so you can test quickly
        setDevCode(data.code);
      }

      // Pass email + redirect forward
      const params = new URLSearchParams();
      params.set('email', email.trim());
      if (redirectUrl) params.set('redirect', redirectUrl);

      router.push(`/customer/verify?${params.toString()}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-sky-50">
      <div className="w-full max-w-md bg-white shadow-xl rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">VelocityMaid</h1>
          <p className="text-sm text-gray-500">Customer Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500">
              Enter the email address you used when booking.
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {devCode && (
            <div className="text-xs text-gray-700 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2">
              <strong>Dev mode code:</strong> {devCode}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-sky-600 text-white py-2.5 text-sm font-semibold hover:bg-sky-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Sending code…' : 'Send Login Code'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          Don&apos;t have an account?{' '}
          <a href="/book" className="text-sky-600 hover:underline">
            Book a service
          </a>
        </div>
      </div>
    </div>
  );
}
