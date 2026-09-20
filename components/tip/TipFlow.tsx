'use client';

import { useEffect, useMemo, useState, FormEvent } from 'react';
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
  guestMode,
  onBack,
  onSuccess,
}: {
  amountDollars: number;
  guestName: string;
  guestMode: boolean;
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
        }${guestMode ? '&mode=guest' : ''}`,
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

type TipContextView = {
  propertyLabel: string;
  serviceType: string | null;
  serviceDate: string | null;
  jobReference: string | null;
  serviceAcknowledgement?: string | null;
};

function formatTipServiceDate(isoOrLabel: string | null): string | null {
  if (!isoOrLabel) return null;
  // Guest context may already return a formatted calendar label
  if (!/^\d{4}-\d{2}-\d{2}/.test(isoOrLabel) && !isoOrLabel.includes('T')) {
    return isoOrLabel;
  }
  const d = new Date(isoOrLabel);
  if (Number.isNaN(d.getTime())) return isoOrLabel;
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function TipFlow({
  jobId,
  grantToken,
}: {
  jobId?: string | null;
  grantToken?: string | null;
}) {
  const resolvedJobId = useMemo(() => {
    if (jobId) return jobId;
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('jobId');
  }, [jobId]);

  const resolvedGrant = useMemo(() => {
    if (grantToken) return grantToken;
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('grant');
  }, [grantToken]);

  const authMode: 'CUSTOMER' | 'GUEST_GRANT' | null = resolvedGrant
    ? 'GUEST_GRANT'
    : resolvedJobId
      ? 'CUSTOMER'
      : null;

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
  const [jobContext, setJobContext] = useState<TipContextView | null>(null);
  const [contextLoading, setContextLoading] = useState(
    Boolean(resolvedJobId || resolvedGrant)
  );
  const [contextError, setContextError] = useState<string | null>(null);

  useEffect(() => {
    if (!resolvedJobId && !resolvedGrant) {
      setJobContext(null);
      setContextError(null);
      setContextLoading(false);
      return;
    }

    let cancelled = false;
    setContextLoading(true);
    setContextError(null);

    (async () => {
      try {
        const qs = resolvedGrant
          ? `grant=${encodeURIComponent(resolvedGrant)}`
          : `jobId=${encodeURIComponent(resolvedJobId!)}`;
        const res = await fetch(`/api/tip/context?${qs}`, {
          credentials: 'same-origin',
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;

        if (res.status === 401 && !resolvedGrant) {
          setJobContext(null);
          setContextError(
            'Please sign in and open the completed cleaning from My Jobs to leave a tip.'
          );
          return;
        }

        if (!res.ok || !data.success || !data.context) {
          setJobContext(null);
          setContextError(
            data.error ||
              (resolvedGrant
                ? 'This tip link is invalid or expired. Scan the property card again.'
                : 'This job is not available for tipping. Open a completed job from your portal.')
          );
          return;
        }

        setJobContext({
          propertyLabel: data.context.propertyLabel,
          serviceType: data.context.serviceType,
          serviceDate: data.context.serviceDate,
          jobReference: data.context.jobReference,
          serviceAcknowledgement: data.context.serviceAcknowledgement,
        });
        setContextError(null);
      } catch {
        if (!cancelled) {
          setJobContext(null);
          setContextError(
            'Could not load tip context. Please try again.'
          );
        }
      } finally {
        if (!cancelled) setContextLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resolvedJobId, resolvedGrant]);

  const amountDollars =
    selectedPreset === 'custom'
      ? parseFloat(customAmount) || 0
      : selectedPreset ?? 0;

  const canContinue =
    Boolean(authMode) &&
    !contextLoading &&
    !contextError &&
    Boolean(jobContext) &&
    amountDollars >= 1 &&
    amountDollars <= 200 &&
    !Number.isNaN(amountDollars);

  const handleContinue = async () => {
    if (!canContinue || !authMode) return;

    setLoading(true);
    setError(null);

    const authBody =
      authMode === 'GUEST_GRANT'
        ? { grantToken: resolvedGrant }
        : { jobId: resolvedJobId };

    try {
      if (payMethod === 'ZELLE') {
        const response = await fetch('/api/tip/create-zelle-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountDollars,
            ...authBody,
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
          ...authBody,
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
            guestMode={authMode === 'GUEST_GRANT'}
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

      {!authMode ? (
        <div className="mt-6 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4">
          <p className="text-sm text-amber-200 font-body">
            Please sign in and open the completed cleaning from My Jobs to leave
            a tip — or use the tip link from your property stay card.
          </p>
          <a
            href="/customer/login?redirect=/customer/jobs"
            className="mt-3 inline-block text-sm font-heading font-semibold text-vm-cyan hover:underline"
          >
            Sign in →
          </a>
        </div>
      ) : null}

      {authMode && contextLoading ? (
        <p className="mt-6 text-sm text-white/50 font-body">Loading cleaning details…</p>
      ) : null}

      {authMode && contextError ? (
        <div className="mt-6 rounded-lg border border-amber-400/30 bg-amber-400/10 p-4">
          <p className="text-sm text-amber-200 font-body">{contextError}</p>
          {authMode === 'CUSTOMER' ? (
            <a
              href={
                /sign in/i.test(contextError)
                  ? '/customer/login?redirect=/customer/jobs'
                  : '/customer/jobs'
              }
              className="mt-3 inline-block text-sm font-heading font-semibold text-vm-cyan hover:underline"
            >
              {/sign in/i.test(contextError) ? 'Sign in →' : 'Back to My Jobs →'}
            </a>
          ) : null}
        </div>
      ) : null}

      {jobContext ? (
        <div className="mt-6 rounded-lg border border-white/15 bg-white/5 p-4 font-body text-sm text-white/85">
          <p className="font-heading font-semibold text-white">
            {jobContext.propertyLabel}
          </p>
          <p className="mt-1 text-white/55">
            {[
              jobContext.serviceType,
              formatTipServiceDate(jobContext.serviceDate),
              jobContext.jobReference,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
          {jobContext.serviceAcknowledgement ? (
            <p className="mt-2 text-white/45 text-xs">
              {jobContext.serviceAcknowledgement}
            </p>
          ) : null}
        </div>
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
