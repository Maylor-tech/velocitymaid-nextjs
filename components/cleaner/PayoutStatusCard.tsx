"use client";

import { useEffect, useState } from "react";
import { PayoutProgress } from "./PayoutProgress";
import { PayoutBlockers } from "./PayoutBlockers";

type EligibilityResponse = {
  eligible: boolean;
  blockerDetails: {
    code: string;
    label: string;
    message: string;
  }[];
  stats: {
    completedJobs: number;
    pendingJobs: number;
    disputedJobs: number;
    eligibleAmountCents: number;
  };
  rules: {
    minimumCompletedJobs: number;
  };
};

export function PayoutStatusCard() {
  const [data, setData] = useState<EligibilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/cleaner/payout-eligibility")
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setData(result);
        } else {
          setError(result.error || "Failed to load payout status");
        }
      })
      .catch((err) => {
        console.error("Error fetching payout eligibility:", err);
        setError("Unable to load payout status");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl border bg-white p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border bg-white p-6 text-red-600">
        <p className="text-sm">{error || "Unable to load payout status."}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Payout Status</h2>

        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            data.eligible
              ? "bg-green-100 text-green-700"
              : "bg-yellow-100 text-yellow-700"
          }`}
        >
          {data.eligible ? "Eligible" : "Not Eligible"}
        </span>
      </div>

      <PayoutProgress
        completedJobs={data.stats.completedJobs}
        minimumJobs={data.rules.minimumCompletedJobs}
        eligibleAmountCents={data.stats.eligibleAmountCents}
      />

      {!data.eligible && data.blockerDetails.length > 0 && (
        <PayoutBlockers blockers={data.blockerDetails} />
      )}

      {data.eligible && (
        <div className="rounded-md bg-green-50 p-3 text-green-700 text-sm">
          You're eligible for payout. Payments are processed automatically
          according to the platform schedule.
        </div>
      )}
    </div>
  );
}

