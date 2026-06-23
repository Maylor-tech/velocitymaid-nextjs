"use client";

import { useState, FormEvent } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import TipSuccess from "./TipSuccess";

const PRESET_AMOUNTS = [5, 10, 15, 20, 25] as const;

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

type Step = 1 | 2 | 3;

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
        return_url: `${window.location.origin}/tip/success?amount=${amountDollars}${guestName ? `&guestName=${encodeURIComponent(guestName)}` : ""}`,
        payment_method_data: {
          billing_details: {
            name: guestName || undefined,
          },
        },
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Payment failed. Please try again.");
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
        ← Change amount
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
            ? "bg-vm-cyan/40 text-vm-navy/60 cursor-not-allowed"
            : "bg-vm-cyan text-vm-navy hover:bg-vm-cyan-dark"
        }`}
      >
        {submitting ? "Processing…" : `Leave a $${formattedAmount} tip`}
      </button>
      {error ? (
        <p className="mt-3 text-center text-sm text-red-400 font-body">{error}</p>
      ) : null}
    </form>
  );
}

export default function TipFlow() {
  const [step, setStep] = useState<Step>(1);
  const [selectedPreset, setSelectedPreset] = useState<
    (typeof PRESET_AMOUNTS)[number] | "custom" | null
  >(null);
  const [customAmount, setCustomAmount] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestMessage, setGuestMessage] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountDollars =
    selectedPreset === "custom"
      ? parseFloat(customAmount) || 0
      : selectedPreset ?? 0;

  const canContinue =
    amountDollars >= 1 && amountDollars <= 200 && !Number.isNaN(amountDollars);

  const handleContinue = async () => {
    if (!canContinue) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tip/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountDollars }),
      });

      const data = (await response.json()) as {
        clientSecret?: string;
        tipId?: string;
        error?: string;
      };

      if (!response.ok || !data.clientSecret) {
        throw new Error(data.error ?? "Could not start payment. Please try again.");
      }

      setClientSecret(data.clientSecret);
      setStep(2);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not start payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToAmount = () => {
    setStep(1);
    setClientSecret(null);
    setError(null);
  };

  if (step === 3) {
    return <TipSuccess amountDollars={amountDollars} guestName={guestName || undefined} />;
  }

  if (step === 2 && clientSecret) {
    return (
      <div className="max-w-md mx-auto w-full">
        <div className="mb-6">
          <label htmlFor="guest-name" className="sr-only">
            Your name
          </label>
          <input
            id="guest-name"
            type="text"
            value={guestName}
            onChange={(event) => setGuestName(event.target.value)}
            placeholder="Your name (optional — your cleaner will see this)"
            className="w-full bg-white/8 border border-white/15 rounded-lg px-4 py-3 text-white font-body placeholder:text-white/35 focus:outline-none focus:border-vm-cyan mb-3"
          />
          <label htmlFor="guest-message" className="sr-only">
            Message for your cleaner
          </label>
          <textarea
            id="guest-message"
            rows={3}
            value={guestMessage}
            onChange={(event) => setGuestMessage(event.target.value)}
            placeholder="Leave a message for your cleaner (optional)"
            className="w-full bg-white/8 border border-white/15 rounded-lg px-4 py-3 text-white font-body placeholder:text-white/35 focus:outline-none focus:border-vm-cyan resize-none mb-6"
          />
        </div>
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#00C2CB",
                colorBackground: "#162236",
                colorText: "#FFFFFF",
                colorDanger: "#f87171",
                fontFamily: "Inter, sans-serif",
                borderRadius: "8px",
              },
            },
          }}
        >
          <TipPaymentForm
            amountDollars={amountDollars}
            guestName={guestName}
            onBack={handleBackToAmount}
            onSuccess={() => setStep(3)}
          />
        </Elements>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto w-full">
      <div>
        <h1 className="font-heading text-2xl font-bold text-white">
          Your cleaner worked hard today.
        </h1>
        <p className="font-body text-sm text-white/55 mt-1">
          Leave a tip to show your appreciation.
        </p>
      </div>

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
                  ? "bg-vm-cyan border border-vm-cyan text-vm-navy font-heading font-bold scale-[1.02] rounded-lg py-3 ring-2 ring-vm-cyan ring-offset-2 ring-offset-vm-navy transition-all cursor-pointer"
                  : "bg-white/8 border border-white/15 text-white hover:bg-white/15 rounded-lg py-3 font-heading transition-all cursor-pointer"
              }
            >
              ${amount}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            setSelectedPreset("custom");
            setError(null);
          }}
          className={
            selectedPreset === "custom"
              ? "bg-vm-cyan border border-vm-cyan text-vm-navy font-heading font-bold scale-[1.02] rounded-lg py-3 ring-2 ring-vm-cyan ring-offset-2 ring-offset-vm-navy transition-all cursor-pointer"
              : "bg-white/8 border border-white/15 text-white hover:bg-white/15 rounded-lg py-3 font-heading transition-all cursor-pointer"
          }
        >
          Custom
        </button>
      </div>

      {selectedPreset === "custom" ? (
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

      <button
        type="button"
        onClick={handleContinue}
        disabled={!canContinue || loading}
        className={`mt-8 w-full rounded-lg py-4 text-base transition-colors ${
          canContinue && !loading
            ? "bg-vm-cyan text-vm-navy font-heading font-semibold hover:bg-vm-cyan-dark cursor-pointer"
            : "bg-vm-cyan/30 text-vm-navy/50 cursor-not-allowed"
        }`}
      >
        {loading ? "Loading…" : "Continue"}
      </button>

      {error ? (
        <p className="mt-3 text-center text-sm text-red-400 font-body">{error}</p>
      ) : null}
    </div>
  );
}
