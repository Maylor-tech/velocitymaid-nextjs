'use client';

import { useMemo, useState, FormEvent } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from '@stripe/react-stripe-js';
import TipSuccess from './TipSuccess';

const PRESET_AMOUNTS = [10, 20, 25] as const;

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

type Step = 'amount' | 'pay' | 'zelle' | 'done';
type PayMethod = 'ZELLE' | 'STRIPE';

function TipPaymentForm({
  amountDollars,
  guestName,
  onBack,
  onSuccess,
}: {
  amountDollars: number;
  guestName: string;
  onBack: () => void;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formattedAmount = amountDollars.toFixed(
    amountDollars % 1 === 0 ? 0 : 2
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/tip/success?amount=${amountDollars}${
          guestName ? `&guestName=${encodeURIComponent(guestName)}` : ''
        }`,
        payment_method_data: {
          billing_details: {
            name: guestName || undefined,
          },
        },
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed. Please try again.');
      setSubmitting(false);
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto w-full">
      <button
        type="button"
        onClick={onBack}
        className="text-white/40 hover:text-white text-sm font-body mb-6"
      >
        ← Back
      </button>
      <p className="text-5xl font-heading font-bold text-vm-cyan text-center mb-8">
        ${formattedAmount}
      </p>
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe || submitting}
        className={`mt-8 w-full rounded-lg py-4 text-base font-heading font-semibold transition ${
          !stripe || submitting
            ? 'bg-vm-cyan/40 text-vm-navy/60 cursor-not-allowed'
            : 'bg-vm-cyan text-vm-navy hover:bg-vm-cyan-dark'
        }`}
      >
        {submitting ? 'Processing…' : `Leave a $${formattedAmount} tip`}
      </button>
      {error ? (
        <p className="mt-3 text-center text-sm text-red-400 font-body">{error}</p>
      ) : null}
    </form>
  );
}

export default function TipFlow({ jobId }: { jobId?: string | null }) {
  const resolvedJobId = useMemo(() => {
    if (jobId) return jobId;
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('jobId');
  }, [jobId]);

  const [step, setStep] = useState<Step>('amount');
  const [selectedPreset, setSelectedPreset] = useState<
    (typeof PRESET_AMOUNTS)[number] | 'custom' | null
  >(null);
  const [customAmount, setCustomAmount] = useState('');
  const [payMethod, setPayMethod] = useState<PayMethod>('ZELLE');
  const [guestName, setGuestName] = useState('');
  const [guestMessage, setGuestMessage] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [zelleInfo, setZelleInfo] = useState<{
    handle: string;
    label: string;
    instructions: string;
    internalReference: string;
    amountCents: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountDollars =
    selectedPreset === 'custom'
      ? parseFloat(customAmount) || 0
      : selectedPreset ?? 0;

  const canContinue =
    Boolean(resolvedJobId) &&
    amountDollars >= 1 &&
    amountDollars <= 200 &&
    !Number.isNaN(amountDollars);

  const handleContinue = async () => {
    if (!canContinue || !resolvedJobId) return;

    setLoading(true);
    setError(null);

    try {
      if (payMethod === 'ZELLE') {
        const response = await fetch('/api/tip/create-zelle-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountDollars,
            jobId: resolvedJobId,
            guestName: guestName || undefined,
            guestMessage: guestMessage || undefined,
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? 'Could not start Zelle tip.');
        }
        setZelleInfo({
          handle: data.zelle.handle,
          label: data.zelle.label,
          instructions: data.zelle.instructions,
          internalReference: data.internalReference,
          amountCents: data.amountCents,
        });
        setStep('zelle');
        return;
      }

      const response = await fetch('/api/tip/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountDollars,
          jobId: resolvedJobId,
          guestName: guestName || undefined,
          guestMessage: guestMessage || undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.clientSecret) {
        throw new Error(data.error ?? 'Could not start payment.');
      }
      setClientSecret(data.clientSecret);
      setStep('pay');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not start tip. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === 'done') {
    return (
      <TipSuccess amountDollars={amountDollars} guestName={guestName || undefined} />
    );
  }

  if (step === 'zelle' && zelleInfo) {
    return (
      <div className="max-w-md mx-auto w-full text-white">
        <h2 className="font-heading text-2xl font-bold">Send your tip via Zelle</h2>
        <p className="mt-2 font-body text-white/60 text-sm">
          Optional thank-you — tipping is never required.
        </p>
        <p className="mt-8 text-5xl font-heading font-bold text-vm-cyan text-center">
          ${(zelleInfo.amountCents / 100).toFixed(2)}
        </p>
        <div className="mt-8 space-y-3 rounded-lg border border-white/15 bg-white/5 p-4 font-body text-sm">
          <p>
            <span className="text-white/50">Send to:</span>{' '}
            <span className="font-semibold">{zelleInfo.label}</span>
          </p>
          <p>
            <span className="text-white/50">Zelle:</span>{' '}
            <span className="font-semibold">{zelleInfo.handle}</span>
          </p>
          <p>
            <span className="text-white/50">Memo / reference:</span>{' '}
            <span className="font-semibold text-vm-cyan">
              {zelleInfo.internalReference}
            </span>
          </p>
          <p className="text-white/55 pt-2">{zelleInfo.instructions}</p>
        </div>
        <p className="mt-6 text-center text-xs text-white/40 font-body">
          You cannot mark this tip as received yourself. VelocityMaid will confirm
          after the transfer appears.
        </p>
        <button
          type="button"
          onClick={() => setStep('done')}
          className="mt-8 w-full rounded-lg py-4 bg-vm-cyan text-vm-navy font-heading font-semibold"
        >
          Done
        </button>
      </div>
    );
  }

  if (step === 'pay' && clientSecret) {
    return (
      <div className="max-w-md mx-auto w-full">
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#00C2CB',
                colorBackground: '#162236',
                colorText: '#FFFFFF',
                colorDanger: '#f87171',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '8px',
              },
            },
          }}
        >
          <TipPaymentForm
            amountDollars={amountDollars}
            guestName={guestName}
            onBack={() => {
              setClientSecret(null);
              setStep('amount');
            }}
            onSuccess={() => setStep('done')}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Would you like to thank your cleaning team?
        </h1>
        <p className="font-body text-sm text-white/55 mt-1">
          Tipping is completely optional and never required.
        </p>
      </div>

      {!resolvedJobId ? (
        <p className="mt-6 text-sm text-amber-300 font-body">
          A completed job link is required to leave a tip. Please use the tip link
          from your confirmation message.
        </p>
      ) : null}

      <div className="mt-8 grid grid-cols-3 gap-3">
        {PRESET_AMOUNTS.map((amount) => {
          const isSelected = selectedPreset === amount;
          return (
            <button
              key={amount}
              type="button"
              onClick={() => {
                setSelectedPreset(amount);
                setError(null);
              }}
              className={
                isSelected
                  ? 'bg-vm-cyan border border-vm-cyan text-vm-navy font-heading font-bold scale-[1.02] rounded-lg py-3 ring-2 ring-vm-cyan ring-offset-2 ring-offset-vm-navy transition-all cursor-pointer'
                  : 'bg-white/8 border border-white/15 text-white hover:bg-white/15 rounded-lg py-3 font-heading transition-all cursor-pointer'
              }
            >
              ${amount}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setSelectedPreset('custom');
            setError(null);
          }}
          className={
            selectedPreset === 'custom'
              ? 'bg-vm-cyan border border-vm-cyan text-vm-navy font-heading font-bold scale-[1.02] rounded-lg py-3 ring-2 ring-vm-cyan ring-offset-2 ring-offset-vm-navy transition-all cursor-pointer'
              : 'bg-white/8 border border-white/15 text-white hover:bg-white/15 rounded-lg py-3 font-heading transition-all cursor-pointer'
          }
        >
          Custom
        </button>
      </div>

      {selectedPreset === 'custom' ? (
        <input
          type="number"
          min={1}
          max={200}
          step={1}
          value={customAmount}
          onChange={(event) => setCustomAmount(event.target.value)}
          placeholder="Enter amount in $"
          className="w-full mt-3 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white font-body placeholder:text-white/35 focus:outline-none focus:border-vm-cyan text-center text-xl"
        />
      ) : null}

      <div className="mt-6 space-y-2">
        <p className="text-xs uppercase tracking-wide text-white/40 font-body">
          Payment method
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPayMethod('ZELLE')}
            className={
              payMethod === 'ZELLE'
                ? 'rounded-lg border border-vm-cyan bg-vm-cyan/20 py-3 font-heading text-vm-cyan'
                : 'rounded-lg border border-white/15 bg-white/5 py-3 font-heading text-white/70'
            }
          >
            Zelle (preferred)
          </button>
          <button
            type="button"
            onClick={() => setPayMethod('STRIPE')}
            className={
              payMethod === 'STRIPE'
                ? 'rounded-lg border border-vm-cyan bg-vm-cyan/20 py-3 font-heading text-vm-cyan'
                : 'rounded-lg border border-white/15 bg-white/5 py-3 font-heading text-white/70'
            }
          >
            Card
          </button>
        </div>
      </div>

      <input
        type="text"
        value={guestName}
        onChange={(e) => setGuestName(e.target.value)}
        placeholder="Your name (optional)"
        className="w-full mt-4 bg-white/8 border border-white/15 rounded-lg px-4 py-3 text-white font-body placeholder:text-white/35 focus:outline-none focus:border-vm-cyan"
      />
      <textarea
        rows={3}
        value={guestMessage}
        onChange={(e) => setGuestMessage(e.target.value)}
        placeholder="Message for your cleaner (optional)"
        className="w-full mt-3 bg-white/8 border border-white/15 rounded-lg px-4 py-3 text-white font-body placeholder:text-white/35 focus:outline-none focus:border-vm-cyan resize-none"
      />

      <button
        type="button"
        onClick={handleContinue}
        disabled={!canContinue || loading}
        className={`mt-8 w-full rounded-lg py-4 text-base transition-colors ${
          canContinue && !loading
            ? 'bg-vm-cyan text-vm-navy font-heading font-semibold hover:bg-vm-cyan-dark cursor-pointer'
            : 'bg-vm-cyan/30 text-vm-navy/50 cursor-not-allowed'
        }`}
      >
        {loading ? 'Loading…' : 'Continue'}
      </button>

      {error ? (
        <p className="mt-3 text-center text-sm text-red-400 font-body">{error}</p>
      ) : null}
    </div>
  );
}
