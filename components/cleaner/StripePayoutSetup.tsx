/**
 * Phase 3B: Stripe Payout Setup Component
 * 
 * Displays payout setup status and "Set up payouts" button
 */

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface StripeStatus {
  hasAccount: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  readyForPayouts: boolean;
  currentlyDue?: string[];
  eventuallyDue?: string[];
}

export function StripePayoutSetup() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<StripeStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isCreatingLink, setIsCreatingLink] = useState(false);

  useEffect(() => {
    const onboarding = searchParams.get("stripe_onboarding");
    if (onboarding === "success") {
      setSuccessMessage("Stripe onboarding submitted. Refreshing your status…");
    } else if (onboarding === "refresh") {
      setError("Please complete any remaining steps to finish payout setup.");
    }
    fetchStatus(onboarding === "success");
  }, [searchParams]);

  const fetchStatus = async (refresh = false) => {
    try {
      setError(null);
      const url = refresh
        ? "/api/cleaner/stripe/status?refresh=true"
        : "/api/cleaner/stripe/status";
      const res = await fetch(url);
      const data = await res.json();
      if (res.status === 401) {
        setError("Please log in as a cleaner to set up payouts.");
        return;
      }
      if (data.success) {
        setStatus(data.status);
        if (data.status?.readyForPayouts) {
          setSuccessMessage("Your payout account is ready.");
        }
      } else {
        setError(data.error || "Unable to load payout status.");
      }
    } catch (err) {
      console.error("Failed to fetch Stripe status:", err);
      setError("Unable to load payout status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetupPayouts = async () => {
    setIsCreatingLink(true);
    setError(null);
    try {
      const res = await fetch("/api/cleaner/stripe/connect", {
        method: "POST",
      });
      const data = await res.json();
      if (res.status === 401) {
        setError("Please log in as a cleaner to continue.");
        return;
      }
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Failed to create onboarding link. Please try again.");
      }
    } catch (err) {
      console.error("Failed to create onboarding link:", err);
      setError("Failed to create onboarding link. Please try again.");
    } finally {
      setIsCreatingLink(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-4 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-red-700 text-sm">
          Unable to load payout status. Please refresh the page.
        </p>
      </div>
    );
  }

  // Determine status badge
  let statusBadge: {
    label: string;
    className: string;
  };

  if (status.readyForPayouts) {
    statusBadge = {
      label: "Ready for Payouts",
      className: "bg-green-100 text-green-700",
    };
  } else if (status.hasAccount && status.currentlyDue && status.currentlyDue.length > 0) {
    statusBadge = {
      label: "Action Required",
      className: "bg-yellow-100 text-yellow-700",
    };
  } else if (status.hasAccount) {
    statusBadge = {
      label: "Setup In Progress",
      className: "bg-blue-100 text-blue-700",
    };
  } else {
    statusBadge = {
      label: "Not Set Up",
      className: "bg-vm-surface text-vm-text",
    };
  }

  return (
    <div className="rounded-xl border bg-white p-6 space-y-4">
      {successMessage && (
        <div className="rounded-md bg-green-50 p-3 text-green-800 text-sm">
          {successMessage}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-red-700 text-sm">{error}</div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Payout Setup</h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}
        >
          {statusBadge.label}
        </span>
      </div>

      {status.readyForPayouts ? (
        <div className="rounded-md bg-green-50 p-3 text-green-700 text-sm">
          ✅ Your payout account is set up and verified. You're ready to receive
          payments!
        </div>
      ) : status.hasAccount && status.currentlyDue && status.currentlyDue.length > 0 ? (
        <div className="space-y-3">
          <div className="rounded-md bg-yellow-50 p-3 text-yellow-700 text-sm">
            ⚠️ Action required: Please complete your payout setup to receive
            payments.
          </div>
          <button
            onClick={handleSetupPayouts}
            disabled={isCreatingLink}
            className="w-full px-4 py-2 bg-[#0A3D2F] text-white rounded-md hover:bg-[#083025] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingLink ? "Creating link..." : "Continue Setup"}
          </button>
        </div>
      ) : !status.hasAccount ? (
        <div className="space-y-3">
          <div className="rounded-md bg-vm-surface p-3 text-vm-text text-sm">
            Complete payout setup to receive your earnings. This takes just a
            few minutes.
          </div>
          <button
            onClick={handleSetupPayouts}
            disabled={isCreatingLink}
            className="w-full px-4 py-2 bg-[#0A3D2F] text-white rounded-md hover:bg-[#083025] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingLink ? "Setting up..." : "Set up payouts"}
          </button>
        </div>
      ) : (
        <div className="rounded-md bg-blue-50 p-3 text-blue-700 text-sm">
          Your payout setup is in progress. Please wait for verification to
          complete.
        </div>
      )}
    </div>
  );
}

