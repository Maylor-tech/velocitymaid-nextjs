"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Calendar, MapPin, DollarSign, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

interface Job {
  id: string;
  status: string;
  customerName: string | null;
  serviceType: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  address: string | null;
  serviceLocation: string | null;
  totalPrice: number | null;
  currency: string | null;
  assignedAt: string | null;
  Branch: {
    id: string;
    name: string;
  } | null;
}

export default function CleanerJobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchJob = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cleaner/jobs/${jobId}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch job");
      }

      setJob(data.job);
    } catch (err: any) {
      console.error("Failed to fetch job:", err);
      setError(err.message || "Failed to load job");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!confirm("Accept this job? You'll be marked as on the way.")) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/cleaner/jobs/${jobId}/accept`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to accept job");
      }

      // Refresh job data
      await fetchJob();
      alert("Job accepted! You're now on the way. Customer has been notified.");
    } catch (err: any) {
      console.error("Failed to accept job:", err);
      alert(err.message || "Failed to accept job");
    } finally {
      setProcessing(false);
    }
  };

  const handleStart = async () => {
    if (!confirm("Start the job? This marks the service as in progress.")) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/cleaner/jobs/${jobId}/start`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to start job");
      }

      // Refresh job data
      await fetchJob();
      alert("Job started! Service is now in progress. Customer has been notified.");
    } catch (err: any) {
      console.error("Failed to start job:", err);
      alert(err.message || "Failed to start job");
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("Mark job as COMPLETED? This will create a payout and request a customer rating.")) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/cleaner/jobs/${jobId}/complete`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to complete job");
      }

      // Refresh job data
      await fetchJob();
      alert("Job completed! Payout created and customer rating requested.");
    } catch (err: any) {
      console.error("Failed to complete job:", err);
      alert(err.message || "Failed to complete job");
    } finally {
      setProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (
      !confirm(
        "Decline this job? It will be reassigned to another cleaner automatically."
      )
    ) {
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch(`/api/cleaner/jobs/${jobId}/decline`, {
        method: "PATCH",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to decline job");
      }

      // Redirect to jobs list
      router.push("/cleaner/jobs");
      // Show success message (alert for now, can be replaced with toast)
      alert("Job declined. It will be reassigned automatically.");
    } catch (err: any) {
      console.error("Failed to decline job:", err);
      alert(err.message || "Failed to decline job");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "TBD";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
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
      ON_THE_WAY: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-yellow-100 text-yellow-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/cleaner/jobs"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Jobs
          </Link>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || "Job not found"}
          </div>
        </div>
      </div>
    );
  }

  const canAccept = job.status === "ASSIGNED";
  const canStart = job.status === "ON_THE_WAY";
  const canComplete = job.status === "IN_PROGRESS";
  const canDecline = job.status === "ASSIGNED";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/cleaner/jobs"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Jobs
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold mb-2">
                {job.customerName || "Job Details"}
              </h1>
              <p className="text-gray-600 text-sm font-mono">{job.id}</p>
            </div>
            <span
              className={`px-3 py-1 rounded text-sm font-medium ${getStatusBadgeColor(
                job.status
              )}`}
            >
              {job.status.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {(canAccept || canStart || canComplete || canDecline) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Actions</h2>
            <div className="flex gap-4">
              {canAccept && (
                <button
                  onClick={handleAccept}
                  disabled={processing}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                    processing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  {processing ? "Processing..." : "Accept & On The Way"}
                </button>
              )}
              {canStart && (
                <button
                  onClick={handleStart}
                  disabled={processing}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                    processing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  {processing ? "Processing..." : "Start Service"}
                </button>
              )}
              {canComplete && (
                <button
                  onClick={handleComplete}
                  disabled={processing}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                    processing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  <CheckCircle className="w-5 h-5" />
                  {processing ? "Processing..." : "Complete Job"}
                </button>
              )}
              {canDecline && (
                <button
                  onClick={handleDecline}
                  disabled={processing}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                    processing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                  {processing ? "Processing..." : "Decline Job"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Job Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="font-semibold text-lg mb-4">Job Details</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-gray-600">
                  {formatDate(job.preferredDate)} at {formatTime(job.preferredTime)}
                </p>
              </div>
            </div>

            {job.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-gray-600">{job.address}</p>
                </div>
              </div>
            )}

            {job.serviceType && (
              <div>
                <p className="font-medium">Service Type</p>
                <p className="text-gray-600">{job.serviceType}</p>
              </div>
            )}

            {job.serviceLocation && (
              <div>
                <p className="font-medium">Service Location</p>
                <p className="text-gray-600">{job.serviceLocation}</p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Total Price</p>
                <p className="text-gray-600">
                  {formatPrice(job.totalPrice, job.currency)}
                </p>
              </div>
            </div>

            {job.Branch && (
              <div>
                <p className="font-medium">Branch</p>
                <p className="text-gray-600">{job.Branch.name}</p>
              </div>
            )}

            {job.assignedAt && (
              <div>
                <p className="font-medium">Assigned At</p>
                <p className="text-gray-600">
                  {new Date(job.assignedAt).toLocaleString("en-US")}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

