'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { brandClasses } from '@/lib/brand/tokens';

export default function CustomerVerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const emailFromQuery = searchParams.get('email') || '';
  const redirectUrl = searchParams.get('redirect') || '/customer/jobs';

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

      router.push(redirectUrl || '/customer/jobs');
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
            <h1 className="text-lg font-serif font-bold tracking-tight text-brand-forest">
              Enter Your Code
            </h1>
            <p className="text-xs font-sans text-brand-slate/70">
              We sent a 6-digit login code to{' '}
              <span className="font-semibold text-brand-forest">{email || 'your email'}</span>
            </p>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!emailFromQuery && (
            <div className="space-y-1">
              <label className={brandClasses.label}>Email Address</label>
              <input
                type="email"
                className={brandClasses.input}
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label className={brandClasses.label}>6-digit Code</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              className={`${brandClasses.input} text-center tracking-[0.5em] text-lg font-mono`}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            />
            <p className="text-xs font-sans text-brand-slate/60">
              The code expires after 10 minutes.
            </p>
          </div>

          {error && (
            <div className="text-[11px] font-sans font-semibold text-destructive bg-destructive/5 border border-destructive/20 rounded px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full ${brandClasses.btnPrimary} disabled:opacity-50`}
          >
            {isSubmitting ? 'Verifying…' : 'Verify & Continue'}
          </button>
        </form>

        <div className="mt-4 text-center text-xs font-sans text-brand-slate/60">
          Entered the wrong email?{' '}
          <a href="/customer/login" className={brandClasses.link}>
            Go back
          </a>
        </div>
        </div>
      </div>
    </div>
  );
}
