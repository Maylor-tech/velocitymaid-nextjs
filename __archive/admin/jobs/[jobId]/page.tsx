"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";

// Inline job status helpers (replacing @/lib/jobStatus import)
const VALID_TRANSITIONS: Record<string, string[]> = {
  RECEIVED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["ON_THE_WAY", "REASSIGN_PENDING", "CANCELLED"],
  ON_THE_WAY: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  REASSIGN_PENDING: ["ASSIGNED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

function getNextStatuses(current: string): string[] {
  return VALID_TRANSITIONS[current] || [];
}

interface Job {
  id: string;
  status: string;
  customerName: string | null;
  serviceType: string | null;
  serviceLocation: string | null;
  address: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  totalPrice: number | null;
  currency: string | null;
  paymentMethod: string | null;
  priceLockedAt: string | null; // Phase L: Pricing lock
  basePrice: number | null;
  modifiers: number | null;
  fees: number | null;
  tax: number | null;
  discountAmount: number | null;
  discountReason: string | null;
  createdAt: string;
  assignedAt: string | null;
  onTheWayAt: string | null;
  completedAt: string | null;
  ratingStatus: string | null;
  payoutStatus: string | null;
      cancelledAt: string | null;
      cancellationReason: string | null;
      jobQualityScore: number | null;
      appliedReferralCode: string | null;
      promoApplied: string | null;
      promoDiscount: number | null;
  JobPayout: Array<{
    id: string;
    grossAmount: number;
    cleanerAmount: number;
    platformFee: number;
    currency: string;
    status: string;
    rulesVersion: string;
    paidAt: string | null;
  }>;
  Branch: {
    id: string;
    name: string;
    slug: string;
  } | null;
  Customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  User: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    if (jobId) {
      fetchJob();
      fetchAuditLogs();
    }
  }, [jobId]);

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`/api/admin/audit/logs?entityType=Job&entityId=${jobId}`);
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    }
  };

  const fetchJob = async () => {
    setLoading(true);
    setError(null);
    try {
      // Use jobId parameter (the existing API route uses [jobId])
      const res = await fetch(`/api/admin/jobs/${jobId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to fetch job");
        return;
      }

      setJob(data.job);
    } catch (err: any) {
      setError(err.message || "Failed to fetch job");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: string) => {
    if (!confirm(`Change job status to ${newStatus}?`)) {
      return;
    }

    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/admin/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toStatus: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to update status");
        return;
      }

      // Refresh job data and audit logs
      await Promise.all([fetchJob(), fetchAuditLogs()]);
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return "—";
    const symbol = currency === "USD" ? "$" : currency || "$";
    return `${symbol}${price.toFixed(2)}`;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      RECEIVED: "bg-blue-100 text-blue-800",
      CONFIRMED: "bg-green-100 text-green-800",
      ASSIGNED: "bg-purple-100 text-purple-800",
      ON_THE_WAY: "bg-cyan-100 text-cyan-800",
      IN_PROGRESS: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-gray-100 text-gray-800",
      CANCELLED: "bg-red-100 text-red-800",
      REASSIGN_PENDING: "bg-orange-100 text-orange-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getNextStatusOptions = (currentStatus: string) => {
    return getNextStatuses(currentStatus);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </button>
        <div className="text-red-600">{error || "Job not found"}</div>
      </div>
    );
  }

  const nextStatusOptions = getNextStatusOptions(job.status);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Jobs
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Job Details</h1>
            <p className="text-gray-600 text-sm font-mono mt-1">{job.id}</p>
          </div>
          <span
            className={`px-3 py-1 rounded text-sm font-medium ${getStatusBadgeColor(
              job.status
            )}`}
          >
            {job.status}
          </span>
        </div>
      </div>

      {/* Status Actions */}
      {nextStatusOptions.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-medium mb-2">Update Status</h3>
          <div className="flex gap-2">
            {nextStatusOptions.map((status) => (
              <button
                key={status}
                onClick={() => updateStatus(status)}
                disabled={updatingStatus}
                className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                  updatingStatus
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {updatingStatus ? "Updating..." : `Mark as ${status}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Job Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Service Details */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-4">Service Details</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Service Type:</span>{" "}
              {job.serviceType || "—"}
            </div>
            {job.serviceLocation && (
              <div>
                <span className="font-medium">Service Location:</span>{" "}
                {job.serviceLocation}
              </div>
            )}
            {job.address && (
              <div>
                <span className="font-medium">Address:</span> {job.address}
              </div>
            )}
            <div>
              <span className="font-medium">Preferred Date:</span>{" "}
              {formatDate(job.preferredDate)}
            </div>
            <div>
              <span className="font-medium">Preferred Time:</span>{" "}
              {job.preferredTime || "—"}
            </div>
            <div>
              <span className="font-medium">Total Price:</span>{" "}
              {formatPrice(job.totalPrice, job.currency)}
              {/* Phase L: Pricing lock indicator */}
              {job.priceLockedAt && (
                <span className="ml-2 text-xs text-gray-500" title="Pricing is locked">
                  🔒 Locked
                </span>
              )}
            </div>
            {job.paymentMethod && (
              <div>
                <span className="font-medium">Payment Method:</span>{" "}
                {job.paymentMethod}
              </div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="border rounded-lg p-4">
          <h2 className="font-semibold text-lg mb-4">Customer Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Name:</span>{" "}
              {job.Customer
                ? `${job.Customer.firstName} ${job.Customer.lastName}`
                : job.customerName || "—"}
            </div>
            {job.Customer?.email && (
              <div>
                <span className="font-medium">Email:</span> {job.Customer.email}
              </div>
            )}
            {job.Customer?.phone && (
              <div>
                <span className="font-medium">Phone:</span> {job.Customer.phone}
              </div>
            )}
            {job.Branch && (
              <div>
                <span className="font-medium">Branch:</span> {job.Branch.name}
              </div>
            )}
          </div>
        </div>

        {/* Assigned Cleaner */}
        {job.User && (
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold text-lg mb-4">Assigned Cleaner</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Name:</span> {job.User.name}
              </div>
              <div>
                <span className="font-medium">Email:</span> {job.User.email}
              </div>
              {job.assignedAt && (
                <div>
                  <span className="font-medium">Assigned At:</span>{" "}
                  {formatDateTime(job.assignedAt)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline */}
        <div className="border rounded-lg p-4 md:col-span-2">
          <h2 className="font-semibold text-lg mb-4">Timeline</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium">Created:</span>{" "}
              {formatDateTime(job.createdAt)}
            </div>
            {job.assignedAt && (
              <div>
                <span className="font-medium">Assigned:</span>{" "}
                {formatDateTime(job.assignedAt)}
              </div>
            )}
            {job.onTheWayAt && (
              <div>
                <span className="font-medium">On The Way:</span>{" "}
                {formatDateTime(job.onTheWayAt)}
              </div>
            )}
            {job.completedAt && (
              <div>
                <span className="font-medium">Completed:</span>{" "}
                {formatDateTime(job.completedAt)}
              </div>
            )}
            {job.cancelledAt && (
              <div>
                <span className="font-medium">Cancelled:</span>{" "}
                {formatDateTime(job.cancelledAt)}
              </div>
            )}
          </div>

          {/* Payout Card */}
          {job.JobPayout && job.JobPayout.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-medium mb-3">Payout Details</h3>
              <div className="bg-white border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Gross Amount:</span>
                    <div className="font-semibold">
                      {job.JobPayout[0].currency === "USD" ? "$" : ""}
                      {job.JobPayout[0].grossAmount.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Cleaner Amount:</span>
                    <div className="font-semibold text-green-700">
                      {job.JobPayout[0].currency === "USD" ? "$" : ""}
                      {job.JobPayout[0].cleanerAmount.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Platform Fee:</span>
                    <div className="font-semibold text-gray-700">
                      {job.JobPayout[0].currency === "USD" ? "$" : ""}
                      {job.JobPayout[0].platformFee.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          job.JobPayout[0].status === "PAID"
                            ? "bg-green-100 text-green-800"
                            : job.JobPayout[0].status === "READY"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {job.JobPayout[0].status}
                      </span>
                    </div>
                  </div>
                </div>
                {job.JobPayout[0].paidAt && (
                  <div className="text-xs text-gray-500">
                    Paid at: {formatDateTime(job.JobPayout[0].paidAt)}
                  </div>
                )}
                {job.JobPayout[0].status !== "PAID" && (
                  <button
                    onClick={async () => {
                      if (!confirm("Mark this payout as PAID?")) return;
                      try {
                        const res = await fetch(
                          `/api/admin/payouts/${job.JobPayout[0].id}/mark-paid`,
                          { method: "PATCH" }
                        );
                        const data = await res.json();
                        if (res.ok && data.ok) {
                          alert("Payout marked as PAID");
                          window.location.reload();
                        } else {
                          alert(data.error || "Failed to mark payout as paid");
                        }
                      } catch (err: any) {
                        alert(err.message || "Failed to mark payout as paid");
                      }
                    }}
                    className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm font-medium"
                  >
                    Mark as PAID
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Rating Status */}
          {job.ratingStatus && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-medium mb-3">Rating Status</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      job.ratingStatus === "SUBMITTED"
                        ? "bg-green-100 text-green-800"
                        : job.ratingStatus === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {job.ratingStatus.replace(/_/g, " ")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Audit Log Timeline */}
          {auditLogs.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h3 className="font-medium mb-3">Status History</h3>
              <div className="space-y-2">
                {auditLogs
                  .filter((log) => log.action === "JOB_STATUS_UPDATED")
                  .map((log) => (
                    <div key={log.id} className="text-xs text-gray-600">
                      <span className="font-medium">
                        {log.actorName || "System"}
                      </span>{" "}
                      changed status from{" "}
                      <span className="font-medium">{log.changes?.from}</span> to{" "}
                      <span className="font-medium">{log.changes?.to}</span>{" "}
                      <span className="text-gray-400">
                        {formatDateTime(log.createdAt)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        {(job.appliedReferralCode ||
          job.promoApplied ||
          job.jobQualityScore ||
          job.cancellationReason) && (
          <div className="border rounded-lg p-4 md:col-span-2">
            <h2 className="font-semibold text-lg mb-4">Additional Information</h2>
            <div className="space-y-2 text-sm">
              {job.appliedReferralCode && (
                <div>
                  <span className="font-medium">Referral Code:</span>{" "}
                  {job.appliedReferralCode}
                </div>
              )}
              {job.promoApplied && (
                <div>
                  <span className="font-medium">Promo Code:</span>{" "}
                  {job.promoApplied}
                </div>
              )}
              {job.jobQualityScore && (
                <div>
                  <span className="font-medium">Quality Score:</span>{" "}
                  {job.jobQualityScore}/5
                </div>
              )}
              {job.cancellationReason && (
                <div>
                  <span className="font-medium">Cancellation Reason:</span>{" "}
                  {job.cancellationReason}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

