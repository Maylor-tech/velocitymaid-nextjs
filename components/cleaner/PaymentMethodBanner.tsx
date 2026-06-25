"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";

interface PaymentMethodBannerProps {
  hasVerifiedPaymentMethod: boolean;
  paymentMethodPageUrl?: string;
}

export default function PaymentMethodBanner({
  hasVerifiedPaymentMethod,
  paymentMethodPageUrl = "/cleaner/payments",
}: PaymentMethodBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if banner was dismissed in this session
  useEffect(() => {
    if (hasVerifiedPaymentMethod) {
      // If payment method is verified, clear dismissal
      setIsDismissed(false);
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("payment-method-banner-dismissed");
      }
    } else {
      // Check if dismissed in this session
      if (typeof window !== "undefined") {
        const dismissed = sessionStorage.getItem("payment-method-banner-dismissed");
        setIsDismissed(dismissed === "true");
      }
    }
  }, [hasVerifiedPaymentMethod]);

  // Don't show if payment method is verified or if dismissed
  if (hasVerifiedPaymentMethod || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("payment-method-banner-dismissed", "true");
    }
  };

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 relative">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 text-yellow-600 hover:text-yellow-800 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-yellow-900 mb-1">
            ⚠️ Payment Method Required
          </h3>
          <p className="text-sm text-yellow-900 mb-3">
            Your payouts are ready but need a verified payment method.
            <br />
            Add your bank account now to receive payments.
            <br />
            This takes 2 minutes. Your earnings are safe.
          </p>
          <Link
            href={paymentMethodPageUrl}
            className="inline-flex items-center gap-2 px-4 py-2 bg-vm-warning text-white rounded-lg hover:bg-vm-warning transition-colors font-medium text-sm"
          >
            Add Payment Method
          </Link>
        </div>
      </div>
    </div>
  );
}












