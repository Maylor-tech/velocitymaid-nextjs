"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, AlertCircle, Info, ArrowRight } from "lucide-react";
import Link from "next/link";

interface ReadinessStatus {
  eligible: boolean;
  blockers: Array<{
    reason: string;
    action: string;
    link?: string;
    severity: "error" | "warning" | "info";
  }>;
  paymentMethod: {
    exists: boolean;
    verified: boolean;
    status: string;
  };
  completedJobs: number;
  jobsReadyForPayout: number;
  pendingPayouts: number;
  cleanerActive: boolean;
}

export default function CleanerEarningsPage() {
  const [readiness, setReadiness] = useState<ReadinessStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReadiness();
  }, []);

  const fetchReadiness = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/cleaner/payout-readiness");
      const data = await res.json();
      
      if (data.success) {
        setReadiness(data.readiness);
      } else {
        throw new Error(data.error || "Failed to load payout readiness");
      }
    } catch (err: any) {
      console.error("Error fetching payout readiness:", err);
      setError(err.message || "Failed to load payout readiness");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading payout status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchReadiness} variant="outline" className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!readiness) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-gray-600">Unable to load payout status.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Earnings & Payouts</h1>
        <p className="text-gray-600 mt-2">
          Track your earnings and see when you'll receive payouts
        </p>
      </div>

      {/* Payout Readiness Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Badge */}
          <div className="flex items-center gap-3">
            {readiness.eligible ? (
              <>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-green-600">
                    Ready to Receive Payouts
                  </h3>
                  <p className="text-sm text-gray-600">
                    You have {readiness.jobsReadyForPayout} completed job(s) ready for payout.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-8 h-8 text-yellow-600" />
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-yellow-600">
                    Not Ready Yet
                  </h3>
                  <p className="text-sm text-gray-600">
                    Complete the requirements below to receive payouts.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Blockers List */}
          {readiness.blockers.length > 0 && (
            <div className="border rounded-lg p-4 bg-yellow-50 space-y-3">
              <h4 className="font-medium text-yellow-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                What's Blocking Payouts:
              </h4>
              <ul className="space-y-3">
                {readiness.blockers.map((blocker, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    {blocker.severity === "error" ? (
                      <XCircle className="w-5 h-5 mt-0.5 text-red-600 flex-shrink-0" />
                    ) : blocker.severity === "warning" ? (
                      <AlertCircle className="w-5 h-5 mt-0.5 text-yellow-600 flex-shrink-0" />
                    ) : (
                      <Info className="w-5 h-5 mt-0.5 text-blue-600 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {blocker.reason}
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        {blocker.action}
                      </p>
                      {blocker.link && (
                        <Link href={blocker.link}>
                          <Button
                            variant="link"
                            size="sm"
                            className="p-0 h-auto mt-1 text-blue-600"
                          >
                            Fix this <ArrowRight className="w-3 h-3 ml-1" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Eligibility Checklist */}
          <div className="border rounded-lg p-4 space-y-3">
            <h4 className="font-medium mb-2">Requirements Checklist:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {readiness.cleanerActive ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm">Account is active</span>
                {!readiness.cleanerActive && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Contact support)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {readiness.paymentMethod.exists ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm">Payment method added</span>
                {!readiness.paymentMethod.exists && (
                  <Link href="/cleaner/payments">
                    <Button variant="link" size="sm" className="p-0 h-auto ml-2">
                      Add →
                    </Button>
                  </Link>
                )}
              </div>

              <div className="flex items-center gap-2">
                {readiness.paymentMethod.verified ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="text-sm">Payment method verified</span>
                {!readiness.paymentMethod.verified && readiness.paymentMethod.exists && (
                  <span className="text-xs text-gray-500 ml-2">
                    (Pending admin verification)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {readiness.completedJobs > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-yellow-600" />
                )}
                <span className="text-sm">
                  Completed jobs ({readiness.completedJobs})
                </span>
              </div>

              <div className="flex items-center gap-2">
                {readiness.jobsReadyForPayout > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-yellow-600" />
                )}
                <span className="text-sm">
                  Jobs ready for payout ({readiness.jobsReadyForPayout})
                </span>
              </div>
            </div>
          </div>

          {/* Pending Payouts */}
          {readiness.pendingPayouts > 0 && (
            <div className="border rounded-lg p-4 bg-blue-50">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">
                  Pending Payouts: {readiness.pendingPayouts}
                </h4>
              </div>
              <p className="text-sm text-blue-700 mb-2">
                You have {readiness.pendingPayouts} payout(s) waiting for approval.
                You'll receive payment once they're approved and processed.
              </p>
              <p className="text-xs text-blue-600 italic">
                Pending payouts are processed once payment verification and payout schedule are complete.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Method Card (if not verified) */}
      {!readiness.paymentMethod.verified && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              {readiness.paymentMethod.exists
                ? "Your payment method is pending verification. An administrator will review it within 24 hours."
                : "Add a payment method to receive payouts. You can use bank transfer, Zelle, Venmo, Cash App, or PayPal."}
            </p>
            <Link href="/cleaner/payments">
              <Button>
                {readiness.paymentMethod.exists
                  ? "Update Payment Method"
                  : "Add Payment Method"}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {readiness.completedJobs}
              </p>
              <p className="text-sm text-gray-600 mt-1">Completed Jobs</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {readiness.jobsReadyForPayout}
              </p>
              <p className="text-sm text-gray-600 mt-1">Ready for Payout</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {readiness.pendingPayouts}
              </p>
              <p className="text-sm text-gray-600 mt-1">Pending Payouts</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
