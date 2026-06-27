"use client";

import Link from "next/link";
import { Suspense } from "react";
import { StripePayoutSetup } from "@/components/cleaner/StripePayoutSetup";

function ConnectContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <Link
            href="/cleaners/dashboard"
            className="text-sm font-medium text-[#0A3D2F] hover:underline"
          >
            ← Back to dashboard
          </Link>
          <span className="text-sm font-semibold text-vm-text">VelocityMaid</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="text-2xl font-semibold text-vm-text">Stripe payout setup</h1>
        <p className="mt-2 text-sm text-vm-muted">
          Connect your bank account to receive earnings. Setup is handled securely by
          Stripe.
        </p>
        <div className="mt-6">
          <StripePayoutSetup />
        </div>
      </main>
    </div>
  );
}

export default function StripeConnectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <p className="text-vm-muted">Loading payout setup…</p>
        </div>
      }
    >
      <ConnectContent />
    </Suspense>
  );
}
