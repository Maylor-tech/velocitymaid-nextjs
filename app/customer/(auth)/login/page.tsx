'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { brandClasses } from '@/lib/brand/tokens';

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
    <div className="min-h-[100dvh] bg-brand-ivory px-4 pt-10 pb-8 sm:pt-14 sm:pb-12">
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-brand-forest/10 p-6 sm:p-7 modal-enter">
          <div className="text-center mb-6 flex flex-col items-center gap-2">
            <BrandLogo size="auth" showTagline={false} />
            <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-slate/60">
              Customer Portal
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className={brandClasses.label}>Email Address</label>
              <input
                type="email"
                className={brandClasses.input}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <p className="text-xs font-sans text-brand-slate/60">
                Enter the email address you used when booking.
              </p>
            </div>

            {error && (
              <div className="text-[11px] font-sans font-semibold text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
                {error}
              </div>
            )}

            {devCode && (
              <div className="calm-alert text-xs">
                <strong className="text-brand-forest">Dev mode code:</strong> {devCode}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full ${brandClasses.btnPrimary} disabled:opacity-50`}
            >
              {isSubmitting ? 'Sending code…' : 'Send Login Code'}
            </button>
          </form>

          <div className="mt-5 text-center text-xs font-sans text-brand-slate/60">
            Don&apos;t have an account?{' '}
            <a href="/book" className={brandClasses.link}>
              Configure your care program
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
