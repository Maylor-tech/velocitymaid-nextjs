'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CustomerVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailFromQuery = searchParams.get('email') || '';
  const redirectUrl = searchParams.get('redirect') || '/customer/dashboard';

  const [code, setCode] = useState('');
  const [email, setEmail] = useState(emailFromQuery);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailFromQuery && !email) {
      setEmail(emailFromQuery);
    }
  }, [emailFromQuery, email]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !code.trim()) {
      setError('Please enter your email and the code.');
      return;
    }

    if (!/^\d{6}$/.test(code.trim())) {
      setError('Please enter a valid 6-digit code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/customer/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Invalid or expired code.');
      }

      router.push(redirectUrl || '/customer/dashboard');
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
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Enter Your Code
          </h1>
          <p className="text-sm text-gray-500">
            We sent a 6-digit login code to{' '}
            <span className="font-medium">{email || 'your email'}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!emailFromQuery && (
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
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              6-digit Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-center tracking-[0.5em] text-lg font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            />
            <p className="text-xs text-gray-500">
              The code expires after 10 minutes.
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-sky-600 text-white py-2.5 text-sm font-semibold hover:bg-sky-700 disabled:opacity-50"
          >
            {isSubmitting ? 'Verifying…' : 'Verify & Continue'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-gray-500">
          Entered the wrong email?{' '}
          <a href="/customer/login" className="text-sky-600 hover:underline">
            Go back
          </a>
        </div>
      </div>
    </div>
  );
}















