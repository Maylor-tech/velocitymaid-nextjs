/**
 * Phase 3D: Admin Payout Dashboard - Batch List
 * 
 * Lists payout batches with status pills and actions
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Loader2,
  Plus,
  CheckCircle,
  PlayCircle,
  RotateCcw,
  XCircle,
  Filter,
  Calendar,
  DollarSign,
} from "lucide-react";
import Link from "next/link";

interface PayoutBatch {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalAmountCents: number;
  totalAmountDollars: string;
  transferCount: number;
  createdByAdminId: string | null;
  createdAt: string;
}

export default function AdminPayoutsPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<PayoutBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingBatchId, setProcessingBatchId] = useState<string | null>(null);
  const [creatingBatch, setCreatingBatch] = useState(false);
  const [createSuccess, setCreateSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchBatches();
  }, [statusFilter, page]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(`/api/admin/payout-batches?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setBatches(data.batches);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        throw new Error(data.error || "Failed to fetch batches");
      }
    } catch (err: any) {
      console.error("Error fetching batches:", err);
      setError(err.message || "Failed to load batches");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "APPROVED":
        return "bg-blue-100 text-blue-800";
      case "PROCESSING":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-green-100 text-green-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleApprove = async (batchId: string) => {
    if (!confirm("Approve this payout batch? This will allow it to be processed.")) {
      return;
    }

    try {
      setProcessingBatchId(batchId);
      const response = await fetch(`/api/admin/payout-batches/${batchId}/approve`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        await fetchBatches();
        alert("Batch approved successfully");
      } else {
        throw new Error(data.error || "Failed to approve batch");
      }
    } catch (err: any) {
      console.error("Error approving batch:", err);
      alert(err.message || "Failed to approve batch");
    } finally {
      setProcessingBatchId(null);
    }
  };

  const handleProcess = async (batchId: string) => {
    if (!confirm("Process this payout batch? This will execute Stripe transfers.")) {
      return;
    }

    try {
      setProcessingBatchId(batchId);
      const response = await fetch(`/api/admin/payout-batches/${batchId}/process`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        await fetchBatches();
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
      setProcessingBatchId(null);
    }
  };

  const handleRetry = async (batchId: string) => {
    if (!confirm("Retry failed transfers in this batch?")) {
      return;
    }

    try {
      setProcessingBatchId(batchId);
      const response = await fetch(`/api/admin/payout-batches/${batchId}/retry`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        await fetchBatches();
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
      setProcessingBatchId(null);
    }
  };

  const handleCancel = async (batchId: string) => {
    if (
      !confirm(
        "Cancel this payout batch? This will unlock ledger entries and delete all transfers. This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setProcessingBatchId(batchId);
      const response = await fetch(`/api/admin/payout-batches/${batchId}/cancel`, {
        method: "POST",
      });
      const data = await response.json();

      if (data.success) {
        await fetchBatches();
        alert("Batch canceled successfully");
      } else {
        throw new Error(data.error || "Failed to cancel batch");
      }
    } catch (err: any) {
      console.error("Error canceling batch:", err);
      alert(err.message || "Failed to cancel batch");
    } finally {
      setProcessingBatchId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
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

  const handleCreateBatch = async () => {
    const periodEnd = new Date();
    const periodStart = new Date();
    periodStart.setDate(periodStart.getDate() - 7);

    if (
      !confirm(
        `Create a new payout batch for ${formatDate(periodStart.toISOString())} to ${formatDate(periodEnd.toISOString())}?`
      )
    ) {
      return;
    }

    setCreatingBatch(true);
    setError(null);
    setCreateSuccess(null);

    try {
      const response = await fetch("/api/admin/payout-batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          periodStart: periodStart.toISOString(),
          periodEnd: periodEnd.toISOString(),
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to create payout batch");
      }

      setCreateSuccess(
        data.message ||
          `Batch created: ${data.summary?.eligibleCleaners ?? 0} cleaner(s), $${data.batch?.totalAmountDollars ?? "0.00"}`
      );
      await fetchBatches();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create batch";
      setError(message);
    } finally {
      setCreatingBatch(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payout Batches</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and process cleaner payout batches
            </p>
          </div>
          <button
            onClick={handleCreateBatch}
            disabled={creatingBatch}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creatingBatch ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Plus className="w-5 h-5" />
            )}
            {creatingBatch ? "Creating…" : "Create Batch"}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="DRAFT">Draft</option>
              <option value="APPROVED">Approved</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* Error / Success Messages */}
        {createSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-6">
            {createSuccess}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Loading batches...</p>
          </div>
        ) : batches.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <p className="text-gray-500">No payout batches found</p>
          </div>
        ) : (
          <>
            {/* Batches Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transfers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {batches.map((batch) => (
                    <tr key={batch.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDate(batch.periodStart)} - {formatDate(batch.periodEnd)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(batch.status)}`}
                        >
                          {batch.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {batch.totalAmountDollars}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {batch.transferCount} transfer{batch.transferCount !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDateTime(batch.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/payouts/${batch.id}`}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </Link>
                          {batch.status === "DRAFT" && (
                            <>
                              <button
                                onClick={() => handleApprove(batch.id)}
                                disabled={processingBatchId === batch.id}
                                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleCancel(batch.id)}
                                disabled={processingBatchId === batch.id}
                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                                title="Cancel"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {(batch.status === "APPROVED" || batch.status === "PROCESSING") && (
                            <>
                              <button
                                onClick={() => handleProcess(batch.id)}
                                disabled={processingBatchId === batch.id}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                                title="Process"
                              >
                                <PlayCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleRetry(batch.id)}
                                disabled={processingBatchId === batch.id}
                                className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded transition-colors disabled:opacity-50"
                                title="Retry Failed"
                              >
                                <RotateCcw className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}


