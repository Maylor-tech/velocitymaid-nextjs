"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, MapPin, DollarSign } from "lucide-react";
import Link from "next/link";
import CleanerPortalNav from "@/components/cleaner/CleanerPortalNav";
import TrainingIncompleteBanner from "@/components/cleaner/TrainingIncompleteBanner";
import { formatServiceDate } from "@/lib/dates/serviceDate";

interface Job {
  id: string;
  status: string;
  customerName: string | null;
  serviceType: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  address: string | null;
  totalPrice: number | null;
  currency: string | null;
  assignedAt: string | null;
  Branch: {
    id: string;
    name: string;
  } | null;
}

export default function CleanerJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [training, setTraining] = useState<{
    status: string;
    modulesCompleted: number;
    modulesTotal: number;
  } | null>(null);

  useEffect(() => {
    fetch("/api/cleaner/training")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.status) {
          setTraining({
            status: json.status,
            modulesCompleted: json.modulesCompleted,
            modulesTotal: json.modulesTotal,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/cleaner/jobs?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          setError("Please log in at /cleaners/login to view your assigned jobs.");
          setTimeout(() => router.push("/cleaners/login"), 2000);
          return;
        }
        throw new Error(data.error || data.message || "Failed to fetch jobs");
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch jobs");
      }

      setJobs(data.jobs || []);
    } catch (err: any) {
      console.error("Failed to fetch jobs:", err);
      setError(err.message || "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "TBD";
    return formatServiceDate(dateStr, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return "TBD";
    return timeStr;
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (!price) return "—";
    const symbol = currency === "USD" ? "$" : currency || "$";
    return `${symbol}${price.toFixed(2)}`;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      ASSIGNED: "bg-purple-100 text-purple-800",
      ON_THE_WAY: "bg-vm-cyan-tint text-blue-800",
      IN_PROGRESS: "bg-vm-warning-bg text-yellow-800",
      COMPLETED: "bg-vm-success-bg text-vm-success",
      CANCELLED: "bg-vm-danger-bg text-red-800",
    };
    return colors[status] || "bg-gray-100 text-vm-text";
  };

  const getStatusAction = (status: string) => {
    if (status === "ASSIGNED") {
      return (
        <span className="text-sm text-blue-600 font-medium">
          Action Required
        </span>
      );
    }
    if (status === "ON_THE_WAY") {
      return (
        <span className="text-sm text-cyan-600 font-medium">
          On The Way
        </span>
      );
    }
    if (status === "IN_PROGRESS") {
      return (
        <span className="text-sm text-yellow-600 font-medium">
          In Progress
        </span>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <CleanerPortalNav />

        {training && training.status !== "CERTIFIED" && (
          <TrainingIncompleteBanner
            status={training.status}
            modulesCompleted={training.modulesCompleted}
            modulesTotal={training.modulesTotal}
          />
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">My Jobs</h1>
          <p className="text-vm-muted">View and manage your assigned jobs</p>
        </div>

        {/* Filter */}
        <div className="mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2 bg-white"
          >
            <option value="">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ON_THE_WAY">On The Way</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-vm-danger-bg border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Jobs List */}
        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-vm-muted">No jobs found</p>
            <p className="text-sm text-vm-muted mt-2">
              {statusFilter
                ? "Try changing the status filter"
                : "You don't have any assigned jobs yet"}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/cleaner/jobs/${job.id}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 block"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {job.customerName || "Customer"}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                          job.status
                        )}`}
                      >
                        {job.status.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div className="space-y-2 text-sm text-vm-muted">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {formatDate(job.preferredDate)} at{" "}
                          {formatTime(job.preferredTime)}
                        </span>
                      </div>

                      {job.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{job.address}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        <span>{formatPrice(job.totalPrice, job.currency)}</span>
                      </div>

                      {job.serviceType && (
                        <p className="text-vm-muted">{job.serviceType}</p>
                      )}

                      {job.Branch && (
                        <p className="text-xs text-vm-muted">
                          Branch: {job.Branch.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="ml-4 text-right flex flex-col items-end gap-2">
                    {getStatusAction(job.status)}
                    <span className="inline-flex items-center rounded-lg bg-vm-navy px-4 py-2 text-sm font-semibold text-white">
                      Open Job →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

