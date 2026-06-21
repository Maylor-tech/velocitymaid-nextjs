'use client';

import { useState } from 'react';
import { CreditCard, Loader2, AlertCircle, ShieldCheck, ClipboardCheck } from 'lucide-react';

interface PayBalanceSectionProps {
  jobId: string;
  balanceDue: number;
  currency?: string;
}

export default function PayBalanceSection({
  jobId,
  balanceDue,
  currency = 'USD',
}: PayBalanceSectionProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

  const handlePayBalance = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/customer/jobs/${jobId}/pay-balance`, {
        method: 'POST',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Unable to start secure checkout');
      }

      if (data.paid) {
        window.location.reload();
        return;
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error('Secure checkout could not be opened. Please try again.');
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setError(message);
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-orange-200 bg-vm-surface p-6 shadow-sm">
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-full bg-vm-navy/10 p-2">
          <ClipboardCheck className="w-5 h-5 text-vm-navy" aria-hidden />
        </div>
        <div>
          <h2 className="text-lg font-heading font-semibold text-vm-navy">Your service is complete.</h2>
          <p className="mt-1 text-sm text-vm-text font-body">
            Review your checklist and service details above. When you&apos;re ready, pay the
            remaining balance securely through Stripe.
          </p>
        </div>
      </div>

      <ul className="mb-5 space-y-2 text-sm text-vm-text font-body">
        <li className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-vm-cyan shrink-0" aria-hidden />
          Card payments are processed securely — we never store your full card number.
        </li>
        <li className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-vm-cyan shrink-0" aria-hidden />
          Remaining balance:{' '}
          <span className="font-semibold text-orange-700">{formatCurrency(balanceDue)}</span>
        </li>
      </ul>

      {error && (
        <div
          className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden />
          <span>{error}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handlePayBalance}
        disabled={loading}
        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-lg bg-vm-navy px-6 py-3 text-sm font-heading font-semibold text-vm-white transition-colors hover:bg-vm-navy/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
            Redirecting to secure checkout…
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" aria-hidden />
            Pay Remaining Balance ({formatCurrency(balanceDue)})
          </>
        )}
      </button>
    </div>
  );
}
