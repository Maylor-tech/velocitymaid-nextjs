"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

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

function isTerminalStatus(status: string): boolean {
  return status === "COMPLETED" || status === "CANCELLED";
}

interface Job {
  id: string;
  status: string;
  customerName: string | null;
  serviceType: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  totalPrice: number | null;
  currency: string | null;
  createdAt: string;
  branchId: string;
  assignedCleanerId: string | null;
  assignedCleanerName: string | null;
  payoutStatus: string | null;
  ratingStatus: string | null;
  Branch: {
    name: string;
    id: string;
  } | null;
  User: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  JobPayout: Array<{
    id: string;
    cleanerAmount: number;
    status: string;
  }> | null;
}

interface Cleaner {
  id: string;
  name: string | null;
  email: string;
  primaryBranchId: string | null;
  isActive: boolean;
}

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [branchFilter, setBranchFilter] = useState<string>("");
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loadingCleaners, setLoadingCleaners] = useState(false);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, branchFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (branchFilter) params.append("branchId", branchFilter);

      const res = await fetch(`/api/admin/jobs?${params.toString()}`);
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "—";
    return timeStr;
  };

  const formatPrice = (price: number | null | string, currency: string | null) => {
    if (!price) return "—";
    // Convert to number if it's a string or Decimal
    const numPrice = typeof price === "string" ? parseFloat(price) : Number(price);
    if (isNaN(numPrice)) return "—";
    const symbol = currency === "USD" ? "$" : currency || "$";
    return `${symbol}${numPrice.toFixed(2)}`;
  };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    setUpdatingStatus(jobId);
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

      // Refresh jobs list
      await fetchJobs();
    } catch (err: any) {
      alert(err.message || "Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getActionButtons = (job: Job) => {
    const nextStatuses = getNextStatuses(job.status);
    const buttons: JSX.Element[] = [];

    if (isTerminalStatus(job.status)) {
      return (
        <span className="text-xs text-gray-400 italic">Done</span>
      );
    }

    // Primary action button (forward progression)
    const primaryNext = nextStatuses.find((s) => s !== "CANCELLED");
    if (primaryNext) {
      // Map status to button label based on current status
      const buttonLabels: Record<string, Record<string, string>> = {
        RECEIVED: { CONFIRMED: "→ CONFIRMED" },
        CONFIRMED: { ASSIGNED: "Assign" },
        ASSIGNED: { ON_THE_WAY: "→ ON THE WAY" },
        ON_THE_WAY: { IN_PROGRESS: "Start" },
        IN_PROGRESS: { COMPLETED: "Complete" },
      };
      const label =
        buttonLabels[job.status]?.[primaryNext] || `→ ${primaryNext}`;
      
      // For CONFIRMED or REASSIGN_PENDING status, show "Assign" button that opens modal
      // Only show if not already assigned and status allows assignment
      // Guardrails: Only allow assignment for CONFIRMED, REASSIGN_PENDING, or ASSIGNED (reassignment) statuses
      const canAssign = ["CONFIRMED", "REASSIGN_PENDING", "ASSIGNED"].includes(job.status) && !job.assignedCleanerId;
      if ((job.status === "CONFIRMED" || job.status === "REASSIGN_PENDING") && primaryNext === "ASSIGNED" && canAssign) {
        buttons.push(
          <button
            key="assign"
            onClick={() => {
              setSelectedJob(job);
              setAssignModalOpen(true);
              fetchCleanersForBranch(job.branchId);
            }}
            disabled={updatingStatus === job.id}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            Assign
          </button>
        );
      } else if (job.status === "ASSIGNED" && job.assignedCleanerId) {
        // Show "View Assignment" link when assigned
        buttons.push(
          <a
            key="view-assignment"
            href={`/admin/jobs/${job.id}`}
            className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          >
            View Assignment
          </a>
        );
      } else {
        buttons.push(
          <button
            key={primaryNext}
            onClick={() => updateJobStatus(job.id, primaryNext)}
            disabled={updatingStatus === job.id}
            className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {updatingStatus === job.id ? "..." : label}
          </button>
        );
      }
    }

    // For REASSIGN_PENDING, show "Reassign Cleaner" button
    if (job.status === "REASSIGN_PENDING") {
      buttons.push(
        <button
          key="reassign"
          onClick={() => {
            setSelectedJob(job);
            setAssignModalOpen(true);
            fetchCleanersForBranch(job.branchId);
          }}
          disabled={updatingStatus === job.id}
          className="text-xs px-2 py-1 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400"
        >
          Reassign Cleaner
        </button>
      );
    }

    // Cancel button (if not terminal and not REASSIGN_PENDING)
    // REASSIGN_PENDING jobs should not be cancelled automatically - they need reassignment
    if (nextStatuses.includes("CANCELLED") && job.status !== "REASSIGN_PENDING") {
      buttons.push(
        <button
          key="cancel"
          onClick={() => {
            if (confirm("Cancel this job?")) {
              updateJobStatus(job.id, "CANCELLED");
            }
          }}
          disabled={updatingStatus === job.id}
          className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400"
        >
          Cancel
        </button>
      );
    }

    return <div className="flex items-center gap-1">{buttons}</div>;
  };

  const fetchCleanersForBranch = async (branchId: string) => {
    setLoadingCleaners(true);
    try {
      const res = await fetch(`/api/admin/cleaners/by-branch?branchId=${branchId}`);
      const data = await res.json();
      if (data.success) {
        setCleaners(data.cleaners || []);
      } else {
        alert(data.error || "Failed to fetch cleaners");
        setCleaners([]);
      }
    } catch (err) {
      console.error("Failed to fetch cleaners:", err);
      alert("Failed to fetch cleaners");
      setCleaners([]);
    } finally {
      setLoadingCleaners(false);
    }
  };

  const assignCleaner = async (cleanerId: string) => {
    if (!selectedJob) return;

    setAssigning(true);
    try {
      const res = await fetch(`/api/admin/jobs/${selectedJob.id}/assign`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cleanerId }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Failed to assign cleaner");
        return;
      }

      // Close modal and refresh jobs
      setAssignModalOpen(false);
      setSelectedJob(null);
      await fetchJobs();
    } catch (err: any) {
      alert(err.message || "Failed to assign cleaner");
    } finally {
      setAssigning(false);
    }
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Job Queue</h1>
        <p className="text-gray-600">Operations Command Center</p>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">All Statuses</option>
          <option value="RECEIVED">Received</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="ON_THE_WAY">On The Way</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REASSIGN_PENDING">Reassign Pending</option>
        </select>

        <input
          type="text"
          placeholder="Branch ID (optional)"
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No jobs found
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Job ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Service
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Branch
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Cleaner
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Payout
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Rating
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-600">
                    {job.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {job.customerName || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {job.serviceType || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatDate(job.preferredDate)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatTime(job.preferredTime)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {job.Branch?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatPrice(job.totalPrice, job.currency)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {job.User?.name || (job.assignedCleanerId ? "—" : "—")}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                        job.status
                      )}`}
                    >
                      {job.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {job.JobPayout && job.JobPayout.length > 0 ? (
                      <span className="font-medium">
                        ${job.JobPayout[0].cleanerAmount.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {job.JobPayout && job.JobPayout.length > 0 ? (
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
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {job.ratingStatus && job.ratingStatus !== "NOT_REQUESTED" ? (
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          job.ratingStatus === "SUBMITTED"
                            ? "bg-green-100 text-green-800"
                            : job.ratingStatus === "PENDING"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {job.ratingStatus.replace(/_/g, " ")}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getActionButtons(job)}
                      <a
                        href={`/admin/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium ml-2"
                      >
                        View
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Cleaner Modal */}
      {assignModalOpen && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Assign Cleaner</h2>
              <button
                onClick={() => {
                  setAssignModalOpen(false);
                  setSelectedJob(null);
                  setCleaners([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Job: {selectedJob.customerName || "Unknown Customer"}
              </p>
              <p className="text-sm text-gray-600">
                Branch: {selectedJob.Branch?.name || "Unknown Branch"}
              </p>
            </div>

            {loadingCleaners ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : cleaners.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active cleaners found for this branch
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {cleaners.map((cleaner) => (
                  <button
                    key={cleaner.id}
                    onClick={() => assignCleaner(cleaner.id)}
                    disabled={assigning}
                    className="w-full text-left px-4 py-3 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="font-medium">{cleaner.name || "Unnamed Cleaner"}</div>
                    <div className="text-sm text-gray-600">{cleaner.email}</div>
                  </button>
                ))}
              </div>
            )}

            {assigning && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Assigning cleaner...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
