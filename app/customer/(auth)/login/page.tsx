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

  const redirectUrl = searchParams.get('redirect') || '/customer/jobs';

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
        setDevCode(data.code);
      } else if (data.emailSent) {
        setError(null);
      }

      const params = new URLSearchParams();
      params.set('email', email.trim());
      if (redirectUrl) params.set('redirect', redirectUrl);

      router.push(`/customer/verify?${params.toString()}`);
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-vm-navy flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <a href="/" className="flex items-center gap-3">
          <svg
            width="120"
            height="32"
            viewBox="0 0 200 40"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="VelocityMaid"
            role="img"
          >
            <polygon points="0,2 12,38 24,2 18,2 12,25 6,2" fill="#00C2CB" />
            <line
              x1="0"
              y1="39"
              x2="24"
              y2="39"
              stroke="#00C2CB"
              strokeWidth="1.5"
              opacity="0.35"
            />
            <text
              x="33"
              y="26"
              fontFamily="Space Grotesk,Arial,sans-serif"
              fontWeight="700"
              fontSize="19"
              fill="#ffffff"
              letterSpacing="-0.4"
            >
              VelocityMaid
            </text>
          </svg>
        </a>
        <a
          href="/vermont/host-intake"
          className="text-white/60 font-body text-sm hover:text-white transition-colors"
        >
          Not a customer yet? Get a quote →
        </a>
      </nav>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl overflow-hidden">
            <div className="h-1 bg-vm-cyan w-full" />

            <div className="px-8 py-10">
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 bg-vm-cyan/10 border border-vm-cyan/20 rounded-full px-3 py-1 mb-6">
                  <div className="w-1.5 h-1.5 rounded-full bg-vm-cyan" />
                  <span className="text-vm-cyan text-xs font-semibold font-body uppercase tracking-wider">
                    Customer portal
                  </span>
                </div>
                <h1 className="font-heading font-bold text-vm-navy text-2xl mb-2">
                  Welcome back
                </h1>
                <p className="font-body text-vm-muted text-sm leading-relaxed">
                  Enter the email address you used when booking. We&apos;ll send you a
                  secure sign-in link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="font-body text-sm font-medium text-vm-text block mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    className="w-full border border-vm-border rounded-lg px-4 py-3 font-body text-sm text-vm-text placeholder:text-vm-muted/50 focus:outline-none focus:border-vm-cyan focus:ring-1 focus:ring-vm-cyan/30 transition-colors"
                  />
                  <p className="font-body text-xs text-vm-muted mt-1.5">
                    Use the email you booked with
                  </p>
                </div>

                {error && (
                  <div className="text-xs font-body font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                {devCode && (
                  <div className="text-xs font-body text-vm-navy bg-vm-cyan/10 border border-vm-cyan/20 rounded-lg px-3 py-2">
                    <strong className="font-semibold">Dev mode code:</strong> {devCode}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-vm-navy text-white font-heading font-semibold py-3 rounded-lg hover:bg-vm-cyan hover:text-vm-navy disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 text-sm mt-2"
                >
                  {isSubmitting ? 'Sending...' : 'Send login code'}
                </button>
              </form>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px bg-vm-border" />
                <span className="font-body text-xs text-vm-muted">or</span>
                <div className="flex-1 h-px bg-vm-border" />
              </div>

              <p className="text-center font-body text-sm text-vm-muted">
                Don&apos;t have an account?{' '}
                <a
                  href="/vermont/host-intake"
                  className="text-vm-cyan hover:underline font-medium"
                >
                  Get started with VelocityMaid
                </a>
              </p>
            </div>
          </div>

          <p className="text-center font-body text-xs text-white/35 mt-6">
            Secure sign-in · No password needed · Link expires in 10 minutes
          </p>
        </div>
      </div>

      <footer className="px-8 py-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="font-body text-xs text-white/35">
          © 2026 VelocityMaid. All rights reserved.
        </span>
        <div className="flex gap-4">
          <a
            href="/vermont"
            className="font-body text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            Vermont
          </a>
          <a
            href="/locations/new-jersey"
            className="font-body text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            New Jersey
          </a>
          <a
            href="mailto:hello@velocitymaid.com"
            className="font-body text-xs text-white/35 hover:text-white/60 transition-colors"
          >
            Support
          </a>
        </div>
      </footer>
    </div>
  );
}
