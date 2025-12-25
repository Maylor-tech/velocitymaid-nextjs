"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Calendar, MapPin, User, AlertCircle, CheckCircle2, XCircle, DollarSign, Lock } from "lucide-react";
import Link from "next/link";

interface Job {
  id: string;
  status: string;
  customerName: string | null;
  serviceType: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  address: string | null;
  assignedCleanerId: string | null;
  assignedAt: string | null;
  createdAt: string;
  completedAt: string | null;
  totalPrice: number | null; // Phase L: Read-only pricing
  currency: string | null;
  priceLockedAt: string | null; // Phase L: Pricing lock status
  Customer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  } | null;
  User: {  // Relation name is "User", not "assignedCleaner"
    id: string;
    name: string | null;
    email: string;
  } | null;
}

interface Cleaner {
  id: string;
  name: string | null;
  email: string;
}

export default function BranchOwnerJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [filter, setFilter] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [actionReason, setActionReason] = useState("");
  const [actionNotes, setActionNotes] = useState("");

  useEffect(() => {
    fetchJobs();
    fetchCleaners();
  }, [statusFilter, filter]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);
      if (filter) params.append("filter", filter);

      const res = await fetch(`/api/branch-owner/jobs?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setJobs(data.jobs || []);
      } else {
        throw new Error(data.error || "Failed to load jobs");
      }
    } catch (err: any) {
      console.error("Error fetching jobs:", err);
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const fetchCleaners = async () => {
    try {
      const res = await fetch("/api/branch-owner/cleaners");
      const data = await res.json();
      if (data.success) {
        setCleaners(data.cleaners || []);
      }
    } catch (err) {
      console.error("Error fetching cleaners:", err);
    }
  };

  const handleAction = async (action: string, jobId: string, cleanerId?: string) => {
    if (action === "assign" || action === "reassign") {
      if (!cleanerId) {
        setSelectedJob(jobId);
        setShowAssignModal(true);
        return;
      }
    } else if (action === "cancel") {
      setSelectedJob(jobId);
      setShowCancelModal(true);
      return;
    } else if (action === "flag") {
      setSelectedJob(jobId);
      setShowFlagModal(true);
      return;
    }

    await performAction(action, jobId, cleanerId);
  };

  const performAction = async (action: string, jobId: string, cleanerId?: string) => {
    setActionLoading(jobId);
    try {
      const res = await fetch("/api/branch-owner/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          jobId,
          cleanerId,
          reason: actionReason,
          notes: actionNotes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message || "Action completed successfully");
        setShowAssignModal(false);
        setShowCancelModal(false);
        setShowFlagModal(false);
        setActionReason("");
        setActionNotes("");
        setSelectedJob(null);
        fetchJobs();
      } else {
        throw new Error(data.error || "Failed to perform action");
      }
    } catch (err: any) {
      console.error("Error performing action:", err);
      alert(err.message || "Failed to perform action");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "TBD";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      assigned: "bg-purple-100 text-purple-800",
      confirmed: "bg-blue-100 text-blue-800",
      in_progress: "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status.toLowerCase()] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Management</h1>
            <p className="text-gray-600 mt-2">
              Manage jobs in your branch
            </p>
          </div>
          <Link href="/branch-owner/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status Filter
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Statuses</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Filter
                </label>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">All Jobs</option>
                  <option value="attention">Needs Attention</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        )}

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No jobs found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      {/* Job Header */}
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {job.customerName || `${job.Customer?.firstName} ${job.Customer?.lastName}` || "Unknown Customer"}
                        </h3>
                        <Badge className={getStatusBadgeColor(job.status)}>
                          {job.status.toUpperCase()}
                        </Badge>
                      </div>

                      {/* Job Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(job.preferredDate)} at {job.preferredTime || "TBD"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{job.address || "No address"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Service:</span>
                          <span>{job.serviceType || "N/A"}</span>
                        </div>
                        {job.User && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{job.User.name || job.User.email}</span>
                          </div>
                        )}
                        {/* Phase L: Read-only pricing display */}
                        {job.totalPrice && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: job.currency || 'USD',
                              }).format(Number(job.totalPrice))}
                            </span>
                            {job.priceLockedAt && (
                              <Lock className="w-3 h-3 text-gray-400" title="Pricing locked" />
                            )}
                          </div>
                        )}
                      </div>
                      {/* Phase L: Pricing managed by admin notice */}
                      {job.totalPrice && (
                        <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Pricing managed by admin</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-4">
                      {!job.assignedCleanerId ? (
                        <Button
                          size="sm"
                          onClick={() => handleAction("assign", job.id)}
                          disabled={actionLoading === job.id || job.status === "COMPLETED" || job.status === "CANCELLED"}
                          className={job.status === "COMPLETED" || job.status === "CANCELLED" ? "opacity-50 cursor-not-allowed" : ""}
                        >
                          Assign Cleaner
                        </Button>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction("reassign", job.id)}
                            disabled={actionLoading === job.id || job.status === "COMPLETED" || job.status === "CANCELLED"}
                            className={job.status === "COMPLETED" || job.status === "CANCELLED" ? "opacity-50 cursor-not-allowed" : ""}
                          >
                            Reassign
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction("flag", job.id)}
                            disabled={actionLoading === job.id}
                          >
                            Flag for Review
                          </Button>
                        </>
                      )}
                      {/* Hide Cancel button on already CANCELLED jobs */}
                      {job.status !== "CANCELLED" && job.status !== "COMPLETED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAction("cancel", job.id)}
                          disabled={actionLoading === job.id}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Assign Modal */}
        {showAssignModal && selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>Assign Cleaner</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Cleaner
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    onChange={(e) => {
                      if (e.target.value) {
                        performAction(selectedJob ? "assign" : "reassign", selectedJob!, e.target.value);
                      }
                    }}
                  >
                    <option value="">Choose a cleaner...</option>
                    {cleaners.map((cleaner) => (
                      <option key={cleaner.id} value={cleaner.id}>
                        {cleaner.name || cleaner.email}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedJob(null);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>Cancel Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Why are you cancelling this job?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCancelModal(false);
                      setSelectedJob(null);
                      setActionReason("");
                      setActionNotes("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => performAction("cancel", selectedJob)}
                    disabled={!actionReason || actionLoading === selectedJob}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    {actionLoading === selectedJob ? "Cancelling..." : "Cancel Job"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Flag Modal */}
        {showFlagModal && selectedJob && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="max-w-md w-full mx-4">
              <CardHeader>
                <CardTitle>Flag Job for Review</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={actionReason}
                    onChange={(e) => setActionReason(e.target.value)}
                    placeholder="Why does this job need admin review?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowFlagModal(false);
                      setSelectedJob(null);
                      setActionReason("");
                      setActionNotes("");
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => performAction("flag", selectedJob)}
                    disabled={!actionReason || actionLoading === selectedJob}
                    className="flex-1"
                  >
                    {actionLoading === selectedJob ? "Flagging..." : "Flag Job"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Info Banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Job Management Restrictions
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  You can assign, reassign, cancel, and flag jobs. You cannot change pricing, mark jobs as paid, or override completion rules. All actions are logged.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


