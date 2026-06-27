"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  GraduationCap,
  ArrowLeft,
  UserPlus,
} from "lucide-react";
import {
  CLEANER_APPLICATION_STATUS_LABELS,
  isOpenCleanerApplication,
} from "@/lib/cleaners/applicationStatus";
import {
  formatAvailabilitySummary,
  formatExperienceSummary,
  formatServiceArea,
  formatTransportSummary,
  hasBackgroundConsent,
  hasReferences,
  safeBranchLocation,
  safeBranchName,
  type ApplicationListRow,
} from "@/lib/cleaners/formatApplicationSummary";

export default function CleanerApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationListRow[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [branches, setBranches] = useState<Array<{ id: string; name: string }>>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchBranches = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/branches");
      const data = await response.json();
      if (data.success && Array.isArray(data.branches)) {
        setBranches(data.branches.map((b: { id: string; name: string }) => ({ id: b.id, name: b.name })));
      }
    } catch (err) {
      console.error("Error fetching branches:", err);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (branchFilter !== "all") params.append("branchId", branchFilter);

      const response = await fetch(`/api/admin/cleaners/applications?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setApplications(Array.isArray(data.applications) ? data.applications : []);
        setNewCount(data.newCount ?? 0);
      } else {
        throw new Error(data.error || "Failed to fetch applications");
      }
    } catch (err: unknown) {
      console.error("Error fetching applications:", err);
      setError(err instanceof Error ? err.message : "Failed to load applications");
      setApplications([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, branchFilter]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleApprove = async (id: string) => {
    if (!confirm("Accept and convert this applicant into a cleaner profile?")) return;
    try {
      const response = await fetch(`/api/admin/cleaners/applications/${id}/approve`, { method: "POST" });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to approve");
      showToast("Application accepted — cleaner profile created");
      fetchApplications();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to approve", "error");
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm("Reject this application?")) return;
    try {
      const response = await fetch(`/api/admin/cleaners/applications/${id}/reject`, { method: "POST" });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to reject");
      showToast("Application rejected");
      fetchApplications();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to reject", "error");
    }
  };

  const handleInviteTraining = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/cleaners/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "TRAINING_INVITED" }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || "Failed to update");
      showToast("Training invitation recorded");
      fetchApplications();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to invite", "error");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACCEPTED":
      case "APPROVED":
        return "bg-vm-success-bg text-vm-success";
      case "REJECTED":
        return "bg-vm-danger-bg text-vm-danger";
      case "REVIEWING":
      case "TRAINING_INVITED":
        return "bg-vm-cyan-tint text-vm-navy";
      default:
        return "bg-vm-warning-bg text-vm-warning";
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  return (
    <div className="p-7 pb-24">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/admin/cleaners"
          className="mb-4 inline-flex items-center gap-1 font-body text-sm text-vm-cyan-dark hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Cleaners
        </Link>

        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-vm-navy">Cleaner Applications</h1>
            <p className="mt-1 font-body text-sm text-vm-muted">
              Review talent portal submissions and move candidates through certification.
            </p>
            {newCount > 0 && (
              <p className="mt-2 inline-flex rounded-full bg-vm-warning-bg px-3 py-1 font-body text-xs font-semibold text-vm-warning">
                {newCount} new application{newCount === 1 ? "" : "s"}
              </p>
            )}
          </div>
          <Link
            href="/admin/cleaners/new"
            className="inline-flex items-center gap-2 rounded-lg bg-vm-navy px-4 py-2.5 font-heading text-sm font-bold text-white hover:opacity-90"
          >
            <UserPlus className="h-4 w-4" /> Add team member
          </Link>
        </div>

        {toast && (
          <div
            className={`fixed right-4 top-4 z-50 rounded-lg px-5 py-3 font-body text-sm text-white shadow-lg ${
              toast.type === "success" ? "bg-vm-navy" : "bg-vm-danger"
            }`}
          >
            {toast.message}
          </div>
        )}

        <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-vm-border bg-vm-white p-4">
          <div>
            <label className="mb-1 block font-body text-xs font-semibold uppercase text-vm-muted">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy"
            >
              <option value="all">All</option>
              <option value="NEW">New</option>
              <option value="REVIEWING">Reviewing</option>
              <option value="TRAINING_INVITED">Training invited</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block font-body text-xs font-semibold uppercase text-vm-muted">Branch</label>
            <select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy"
            >
              <option value="all">All branches</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-vm-danger/30 bg-vm-danger-bg p-4 font-body text-sm text-vm-danger">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-vm-cyan" />
          </div>
        ) : applications.length === 0 ? (
          <div className="rounded-xl border border-vm-border bg-vm-white py-16 text-center">
            <p className="font-heading text-lg text-vm-navy">No cleaner applications yet.</p>
            <p className="mt-2 font-body text-sm text-vm-muted">
              When candidates apply at /cleaners/apply, they will appear here for review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="rounded-xl border border-vm-border bg-vm-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="font-heading text-lg font-semibold text-vm-navy">{app.name || "Applicant"}</h2>
                    <p className="font-body text-sm text-vm-muted">{app.email}</p>
                    <p className="font-body text-sm text-vm-muted">{app.phone || "—"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(app.status)}`}>
                    {CLEANER_APPLICATION_STATUS_LABELS[app.status] || app.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <Cell label="Location / area" value={formatServiceArea(app)} />
                  <Cell label="Branch" value={`${safeBranchName(app)} · ${safeBranchLocation(app)}`} />
                  <Cell label="Applied" value={formatDate(app.createdAt)} />
                  <Cell label="Experience" value={formatExperienceSummary(app)} />
                  <Cell label="Availability" value={formatAvailabilitySummary(app)} />
                  <Cell label="Transport" value={formatTransportSummary(app)} />
                  <Cell label="Background consent" value={hasBackgroundConsent(app) ? "Yes" : "—"} />
                  <Cell label="References" value={hasReferences(app) ? "Provided" : "—"} />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/cleaners/applications/${app.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-vm-border px-3 py-2 font-body text-sm text-vm-navy hover:bg-vm-surface"
                  >
                    <Eye className="h-4 w-4" /> View full application
                  </Link>
                  {isOpenCleanerApplication(app.status) && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleInviteTraining(app.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-vm-cyan bg-vm-cyan-tint px-3 py-2 font-body text-sm text-vm-navy"
                      >
                        <GraduationCap className="h-4 w-4" /> Invite to training
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApprove(app.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-vm-success px-3 py-2 font-body text-sm text-white"
                      >
                        <CheckCircle className="h-4 w-4" /> Convert to cleaner
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(app.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-vm-danger/30 px-3 py-2 font-body text-sm text-vm-danger"
                      >
                        <XCircle className="h-4 w-4" /> Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-body text-xs text-vm-muted">{label}</p>
      <p className="font-body text-sm font-medium text-vm-navy">{value}</p>
    </div>
  );
}
