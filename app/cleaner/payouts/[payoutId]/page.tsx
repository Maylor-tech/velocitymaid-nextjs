"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Send, AlertCircle, Download } from "lucide-react";
import Link from "next/link";

interface PayoutReceipt {
  id: string;
  jobId: string;
  cleanerId: string;
  branchId: string;
  grossAmount: number;
  cleanerAmount: number;
  platformFee: number;
  currency: string;
  status: string;
  paymentMethodSnapshot: any;
  createdAt: string;
  paidAt: string | null;
  executedAt: string | null;
  executionMethod: string | null;
  externalReferenceId: string | null;
  executionNote: string | null;
  Job: {
    id: string;
    customerName: string | null;
    serviceType: string | null;
    completedAt: string | null;
  } | null;
  Branch: {
    id: string;
    name: string;
  } | null;
}

export default function CleanerPayoutReceiptPage() {
  const params = useParams();
  const router = useRouter();
  const payoutId = params.payoutId as string;

  const [payout, setPayout] = useState<PayoutReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (payoutId) {
      fetchPayout();
    }
  }, [payoutId]);

  const fetchPayout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cleaner/payouts/${payoutId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch payout receipt");
      }

      setPayout(data.payout);
    } catch (err: any) {
      console.error("Failed to fetch payout:", err);
      setError(err.message || "Failed to load payout receipt");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatPrice = (amount: number, currency: string) => {
    const symbol = currency === "USD" ? "$" : currency || "$";
    return `${symbol}${amount.toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-vm-warning-bg text-yellow-800",
      READY: "bg-vm-warning-bg text-yellow-800",
      APPROVED: "bg-vm-cyan-tint text-blue-800",
      SENT: "bg-purple-100 text-purple-800",
      PAID: "bg-vm-success-bg text-green-800",
      FAILED: "bg-vm-danger-bg text-red-800",
      REJECTED: "bg-vm-danger-bg text-red-800",
    };
    return colors[status] || "bg-gray-100 text-vm-text";
  };

  const renderPaymentMethod = (snapshot: any) => {
    if (!snapshot) return <span className="text-vm-muted">—</span>;

    if (snapshot.methodType === "BANK") {
      return (
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-vm-text">Bank Name:</span>{" "}
            <span className="text-sm">{snapshot.bankName || "—"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-vm-text">Account Number:</span>{" "}
            <span className="text-sm font-mono">{snapshot.accountNumber || "—"}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-vm-text">Routing Number:</span>{" "}
            <span className="text-sm font-mono">{snapshot.routingNumber || "—"}</span>
          </div>
        </div>
      );
    } else {
      const handle = snapshot.handle || snapshot.email || snapshot.phone || "";
      return (
        <div>
          <span className="text-sm font-medium text-vm-text capitalize">
            {snapshot.methodType?.toLowerCase() || "Payment"}:
          </span>{" "}
          <span className="text-sm font-mono">{handle || "—"}</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !payout) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/cleaner/notifications"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Notifications
          </Link>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800">{error || "Payout receipt not found"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/cleaner/notifications"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Notifications
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-2">Payout Receipt</h1>
              <p className="text-vm-muted text-sm font-mono">Payout ID: {payout.id}</p>
            </div>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${getStatusBadge(
                payout.status
              )}`}
            >
              {payout.status}
            </span>
          </div>
        </div>

        {/* Receipt Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Amount Section */}
          <div className="border-b border-gray-200 pb-6 mb-6">
            <div className="text-center">
              <p className="text-sm text-vm-muted mb-2">Payout Amount</p>
              <p className="text-4xl font-bold text-vm-text">
                {formatPrice(payout.cleanerAmount, payout.currency)}
              </p>
              {payout.grossAmount !== payout.cleanerAmount && (
                <p className="text-sm text-vm-muted mt-2">
                  Gross: {formatPrice(payout.grossAmount, payout.currency)} • Platform Fee:{" "}
                  {formatPrice(payout.platformFee, payout.currency)}
                </p>
              )}
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-vm-text mb-3">Job Information</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-vm-muted">Job ID:</span>{" "}
                  <span className="font-mono">{payout.jobId}</span>
                </div>
                {payout.Job?.customerName && (
                  <div>
                    <span className="text-vm-muted">Customer:</span>{" "}
                    <span>{payout.Job.customerName}</span>
                  </div>
                )}
                {payout.Job?.serviceType && (
                  <div>
                    <span className="text-vm-muted">Service:</span>{" "}
                    <span className="capitalize">{payout.Job.serviceType}</span>
                  </div>
                )}
                {payout.Job?.completedAt && (
                  <div>
                    <span className="text-vm-muted">Completed:</span>{" "}
                    <span>{formatDate(payout.Job.completedAt)}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-vm-text mb-3">Branch Information</h3>
              <div className="space-y-2 text-sm">
                {payout.Branch?.name && (
                  <div>
                    <span className="text-vm-muted">Branch:</span>{" "}
                    <span>{payout.Branch.name}</span>
                  </div>
                )}
                <div>
                  <span className="text-vm-muted">Created:</span>{" "}
                  <span>{formatDate(payout.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="border-t border-gray-200 pt-6 mb-6">
            <h3 className="text-sm font-medium text-vm-text mb-3">Payment Method</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              {renderPaymentMethod(payout.paymentMethodSnapshot)}
            </div>
          </div>

          {/* Execution Details */}
          {payout.executedAt && (
            <div className="border-t border-gray-200 pt-6 mb-6">
              <h3 className="text-sm font-medium text-vm-text mb-3">Execution Details</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-vm-muted">Executed:</span>{" "}
                  <span>{formatDate(payout.executedAt)}</span>
                </div>
                {payout.executionMethod && (
                  <div>
                    <span className="text-vm-muted">Method:</span>{" "}
                    <span className="capitalize">{payout.executionMethod.toLowerCase()}</span>
                  </div>
                )}
                {payout.externalReferenceId && (
                  <div>
                    <span className="text-vm-muted">Reference ID:</span>{" "}
                    <span className="font-mono">{payout.externalReferenceId}</span>
                  </div>
                )}
                {payout.executionNote && (
                  <div>
                    <span className="text-vm-muted">Note:</span>{" "}
                    <span>{payout.executionNote}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paid Date */}
          {payout.paidAt && (
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <div>
                  <p className="font-medium">Confirmed Paid</p>
                  <p className="text-sm">{formatDate(payout.paidAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
















