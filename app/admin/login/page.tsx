'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandLogo } from '@/components/brand';
import { brandClasses } from '@/lib/brand/tokens';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 403) {
          setError('You don\'t have admin access yet.');
        } else if (res.status === 401) {
          setError('Email not found.');
        } else {
          console.error('Admin login error:', data.error ?? res.status);
          setError(null);
        }
        return;
      }

      router.push('/admin/jobs');
    } catch (err: unknown) {
      console.error('Admin login issue:', err);
      setError(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-brand-ivory px-4 pt-10 pb-8 sm:pt-14 sm:pb-12">
      <div className="w-full max-w-sm mx-auto">
        <div className="bg-white rounded-xl shadow-lg border border-brand-forest/10 p-6 sm:p-7">
          <div className="text-center mb-6 flex flex-col items-center gap-2">
            <BrandLogo size="auth" showTagline={false} />
            <p className="text-[10px] font-sans font-bold uppercase tracking-wider text-brand-slate/60">
              Admin Portal
            </p>
            <p className="text-xs font-sans text-brand-slate/60">
              Enter your email to access operations.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className={brandClasses.label}>Email Address</label>
              <input
                type="email"
                className={brandClasses.input}
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
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
              {isSubmitting ? 'Logging in…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
