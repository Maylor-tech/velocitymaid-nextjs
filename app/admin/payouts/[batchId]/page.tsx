/**
 * Phase 3D: Admin Payout Dashboard - Batch Detail
 * 
 * Shows batch details and transfers with read-only tables
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  PlayCircle,
  RotateCcw,
  XCircle,
  DollarSign,
  Users,
  Calendar,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface BatchDetail {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalAmountCents: number;
  totalAmountDollars: string;
  createdByAdminId: string | null;
  createdAt: string;
}

interface BatchAggregates {
  totalTransfers: number;
  totalAmountCents: number;
  totalAmountDollars: string;
  uniqueCleaners: number;
  statusBreakdown: Array<{
    status: string;
    count: number;
    amountCents: number;
    amountDollars: string;
  }>;
}

interface Transfer {
  id: string;
  cleanerId: string;
  cleaner: {
    id: string;
    name: string | null;
    email: string;
  };
  amountCents: number;
  amountDollars: string;
  currency: string;
  status: string;
  stripePayoutId: string | null;
  failureReason: string | null;
  lockedEntriesCount: number;
  lockedAmountCents: number;
  lockedAmountDollars: string;
  createdAt: string;
}

export default function AdminPayoutBatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId as string;

  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [aggregates, setAggregates] = useState<BatchAggregates | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [transfersPage, setTransfersPage] = useState(1);
  const [transfersTotalPages, setTransfersTotalPages] = useState(1);

  useEffect(() => {
    if (batchId) {
      fetchBatchDetails();
      fetchTransfers();
    }
  }, [batchId, transfersPage]);

  const fetchBatchDetails = async () => {
    try {
      const response = await fetch(`/api/admin/payout-batches/${batchId}`);
      const data = await response.json();

      if (data.success) {
        setBatch(data.batch);
        setAggregates(data.aggregates);
      } else {
        throw new Error(data.error || "Failed to fetch batch details");
      }
    } catch (err: any) {
      console.error("Error fetching batch details:", err);
      setError(err.message || "Failed to load batch details");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransfers = async () => {
    try {
      const params = new URLSearchParams();
      params.append("page", transfersPage.toString());
      params.append("limit", "50");

      const response = await fetch(
        `/api/admin/payout-batches/${batchId}/transfers?${params.toString()}`
      );
      const data = await response.json();

      if (data.success) {
        setTransfers(data.transfers);
        setTransfersTotalPages(data.pagination?.totalPages || 1);
      } else {
        throw new Error(data.error || "Failed to fetch transfers");
      }
    } catch (err: any) {
      console.error("Error fetching transfers:", err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-vm-text";
      case "APPROVED":
        return "bg-vm-cyan-tint text-blue-800";
      case "PROCESSING":
        return "bg-vm-warning-bg text-yellow-800";
      case "COMPLETED":
        return "bg-vm-success-bg text-green-800";
      case "FAILED":
        return "bg-vm-danger-bg text-red-800";
      case "PENDING":
        return "bg-gray-100 text-vm-text";
      case "PAID":
        return "bg-vm-success-bg text-green-800";
      default:
        return "bg-gray-100 text-vm-text";
    }
  };

  const handleApprove = async () => {
    if (!confirm("Approve this payout batch? This will allow it to be processed.")) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/payout-batches/${batchId}/approve`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        await fetchBatchDetails();
        alert("Batch approved successfully");
      } else {
        throw new Error(data.error || "Failed to approve batch");
      }
    } catch (err: any) {
      console.error("Error approving batch:", err);
      alert(err.message || "Failed to approve batch");
    } finally {
      setProcessing(false);
    }
  };

  const handleProcess = async () => {
    if (!confirm("Process this payout batch? This will execute Stripe transfers.")) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/payout-batches/${batchId}/process`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        await fetchBatchDetails();
        await fetchTransfers();
        alert(
          `Processed ${data.processing.processed} transfer(s). ${data.processing.succeeded} succeeded, ${data.processing.failed} failed.`
        );
      } else {
        throw new Error(data.error || "Failed to process batch");
      }
    } catch (err: any) {
      console.error("Error processing batch:", err);
      alert(err.message || "Failed to process batch");
    } finally {
      setProcessing(false);
    }
  };

  const handleRetry = async () => {
    if (!confirm("Retry failed transfers in this batch?")) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/payout-batches/${batchId}/retry`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        await fetchBatchDetails();
        await fetchTransfers();
        alert(
          `Retried ${data.retry.retried} transfer(s). ${data.retry.succeeded} succeeded, ${data.retry.failed} failed.`
        );
      } else {
        throw new Error(data.error || "Failed to retry batch");
      }
    } catch (err: any) {
      console.error("Error retrying batch:", err);
      alert(err.message || "Failed to retry batch");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (
      !confirm(
        "Cancel this payout batch? This will unlock ledger entries and delete all transfers. This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/payout-batches/${batchId}/cancel`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        router.push("/admin/payouts");
        alert("Batch canceled successfully");
      } else {
        throw new Error(data.error || "Failed to cancel batch");
      }
    } catch (err: any) {
      console.error("Error canceling batch:", err);
      alert(err.message || "Failed to cancel batch");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="text-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-vm-muted">Loading batch details...</p>
        </div>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/admin/payouts"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Batches
          </Link>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || "Batch not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/payouts"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Batches
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-vm-text">Payout Batch Details</h1>
              <p className="mt-1 text-sm text-vm-muted">
                {formatDate(batch.periodStart)} - {formatDate(batch.periodEnd)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(batch.status)}`}
              >
                {batch.status}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex gap-4">
          {batch.status === "DRAFT" && (
            <>
              <button
                onClick={handleApprove}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-vm-success text-white rounded-lg hover:bg-vm-success disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Approve Batch
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-vm-danger text-white rounded-lg hover:bg-vm-danger disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Cancel Batch
                  </>
                )}
              </button>
            </>
          )}
          {(batch.status === "APPROVED" || batch.status === "PROCESSING") && (
            <>
              <button
                onClick={handleProcess}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    Process Batch
                  </>
                )}
              </button>
              <button
                onClick={handleRetry}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-vm-warning text-white rounded-lg hover:bg-vm-warning disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    Retry Failed
                  </>
                )}
              </button>
            </>
          )}
        </div>

        {/* Batch Summary */}
        {aggregates && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-vm-muted">Total Amount</p>
                  <p className="text-2xl font-bold text-vm-text">{batch.totalAmountDollars}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-sm text-vm-muted">Total Transfers</p>
                  <p className="text-2xl font-bold text-vm-text">
                    {aggregates.totalTransfers}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <p className="text-sm text-vm-muted">Unique Cleaners</p>
                  <p className="text-2xl font-bold text-vm-text">
                    {aggregates.uniqueCleaners}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-orange-600" />
                <div>
                  <p className="text-sm text-vm-muted">Created</p>
                  <p className="text-sm font-medium text-vm-text">
                    {formatDateTime(batch.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Breakdown */}
        {aggregates && aggregates.statusBreakdown.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-lg font-semibold text-vm-text mb-4">Status Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {aggregates.statusBreakdown.map((status) => (
                <div key={status.status} className="text-center">
                  <p className="text-2xl font-bold text-vm-text">{status.count}</p>
                  <p className="text-sm text-vm-muted">{status.status}</p>
                  <p className="text-sm font-medium text-vm-text">{status.amountDollars}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transfers Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-vm-text">Transfers</h2>
          </div>
          {transfers.length === 0 ? (
            <div className="p-12 text-center text-vm-muted">No transfers found</div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Cleaner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Locked Entries
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Stripe Payout ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Failure Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transfers.map((transfer) => (
                    <tr key={transfer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-vm-text">
                            {transfer.cleaner.name || "N/A"}
                          </div>
                          <div className="text-sm text-vm-muted">{transfer.cleaner.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-vm-text">
                          {transfer.amountDollars}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transfer.status)}`}
                        >
                          {transfer.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-vm-muted">
                        {transfer.lockedEntriesCount} ({transfer.lockedAmountDollars})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-vm-muted">
                        {transfer.stripePayoutId ? (
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {transfer.stripePayoutId.substring(0, 20)}...
                          </code>
                        ) : (
                          <span className="text-vm-muted">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-vm-muted">
                        {transfer.failureReason ? (
                          <span className="text-red-600">{transfer.failureReason}</span>
                        ) : (
                          <span className="text-vm-muted">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Transfers Pagination */}
              {transfersTotalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => setTransfersPage((p) => Math.max(1, p - 1))}
                    disabled={transfersPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-vm-text bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-vm-text">
                    Page {transfersPage} of {transfersTotalPages}
                  </span>
                  <button
                    onClick={() => setTransfersPage((p) => Math.min(transfersTotalPages, p + 1))}
                    disabled={transfersPage === transfersTotalPages}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-vm-text bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

