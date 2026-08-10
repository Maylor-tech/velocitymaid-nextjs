"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Calendar, MapPin, DollarSign, CheckCircle, XCircle, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { JobChecklistPanel } from "@/components/cleaner/JobChecklistPanel";

interface CustomerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}

interface PropertyInstructions {
  id: string;
  name: string;
  address: string;
  city: string | null;
  state: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  bedConfiguration: string | null;
  amenities: string[];
  restrictedAreas: string | null;
  supplyStorageLocation: string | null;
  trashInstructions: string | null;
  linenInstructions: string | null;
  standingInstructions: string | null;
  accessType: string | null;
  accessNotes: string | null;
  standardCheckoutTime: string | null;
  standardCheckinTime: string | null;
}

interface Job {
  id: string;
  status: string;
  paymentStatus?: string;
  customerName: string | null;
  serviceType: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  address: string | null;
  serviceLocation: string | null;
  totalPrice: number | null;
  currency: string | null;
  assignedAt: string | null;
  jobSpecificNotes?: string | null;
  property?: PropertyInstructions | null;
  Customer?: CustomerInfo | null;
  Branch: {
    id: string;
    name: string;
  } | null;
}

function authMessage(status: number, error?: string): string {
  if (status === 401) {
    return "Please log in at /cleaners/login with your cleaner email to view this job.";
  }
  if (status === 403) {
    return error || "This job is not assigned to your cleaner account. Log in with the assigned cleaner's email.";
  }
  if (status === 404) {
    return "Job not found. It may have been removed or reassigned.";
  }
  return error || "Failed to load job";
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
        if (res.status === 401) {
          setTimeout(() => router.push("/cleaners/login"), 2500);
        }
        setError(authMessage(res.status, data.error));
        setJob(null);
        return;
      }

      setJob(data.job);
    } catch (err: unknown) {
      console.error("Failed to fetch job:", err);
      setError(err instanceof Error ? err.message : "Failed to load job");
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

      await fetchJob();
      alert("Job accepted! You're now on the way.");
    } catch (err: unknown) {
      console.error("Failed to accept job:", err);
      alert(err instanceof Error ? err.message : "Failed to accept job");
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

      await fetchJob();
      alert("Job started! Service is now in progress.");
    } catch (err: unknown) {
      console.error("Failed to start job:", err);
      alert(err instanceof Error ? err.message : "Failed to start job");
    } finally {
      setProcessing(false);
    }
  };

  const handleComplete = async () => {
    if (!confirm("Mark job as COMPLETED? Customer will be prompted to pay any remaining balance.")) {
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

      await fetchJob();
      alert(
        data.message ||
          (data.job?.paymentStatus === "BALANCE_DUE"
            ? "Job completed. Customer balance is now due before payout."
            : "Job completed successfully.")
      );
    } catch (err: unknown) {
      console.error("Failed to complete job:", err);
      alert(err instanceof Error ? err.message : "Failed to complete job");
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

      router.push("/cleaner/jobs");
      alert("Job declined. It will be reassigned automatically.");
    } catch (err: unknown) {
      console.error("Failed to decline job:", err);
      alert(err instanceof Error ? err.message : "Failed to decline job");
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
      ON_THE_WAY: "bg-vm-cyan-tint text-blue-800",
      IN_PROGRESS: "bg-vm-warning-bg text-yellow-800",
      COMPLETED: "bg-vm-success-bg text-vm-success",
      CANCELLED: "bg-vm-danger-bg text-red-800",
    };
    return colors[status] || "bg-gray-100 text-vm-text";
  };

  const customerDisplayName =
    job?.Customer
      ? `${job.Customer.firstName} ${job.Customer.lastName}`.trim()
      : job?.customerName;

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
          <div className="bg-vm-danger-bg border border-red-400 text-red-700 px-4 py-3 rounded">
            {error || "Job not found"}
          </div>
          {error?.includes("log in") && (
            <Link
              href="/cleaners/login"
              className="mt-4 inline-block text-blue-600 hover:text-blue-800 font-medium"
            >
              Go to cleaner login →
            </Link>
          )}
        </div>
      </div>
    );
  }

  const canAccept = job.status === "ASSIGNED";
  const canStart = job.status === "ON_THE_WAY";
  const canComplete = job.status === "IN_PROGRESS";
  const canDecline = job.status === "ASSIGNED";
  const showChecklist =
    job.status === "ON_THE_WAY" ||
    job.status === "IN_PROGRESS" ||
    job.status === "COMPLETED";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
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
                {customerDisplayName || "Job Details"}
              </h1>
              <p className="text-vm-muted text-sm font-mono">{job.id}</p>
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

        {(canAccept || canStart || canComplete || canDecline) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="font-semibold mb-4">Actions</h2>
            <div className="flex flex-wrap gap-4">
              {canAccept && (
                <button
                  onClick={handleAccept}
                  disabled={processing}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
                    processing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-vm-success hover:bg-vm-success"
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
                      : "bg-vm-navy hover:bg-vm-navy"
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
                      : "bg-vm-success hover:bg-vm-success/90"
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
                      : "bg-vm-danger hover:bg-vm-danger"
                  }`}
                >
                  <XCircle className="w-5 h-5" />
                  {processing ? "Processing..." : "Decline Job"}
                </button>
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Customer</h2>
          <div className="space-y-3">
            {job.Customer?.email && (
              <div className="flex items-center gap-2 text-vm-text">
                <Mail className="w-4 h-4 text-vm-muted" />
                <a href={`mailto:${job.Customer.email}`} className="hover:underline">
                  {job.Customer.email}
                </a>
              </div>
            )}
            {job.Customer?.phone && (
              <div className="flex items-center gap-2 text-vm-text">
                <Phone className="w-4 h-4 text-vm-muted" />
                <a href={`tel:${job.Customer.phone}`} className="hover:underline">
                  {job.Customer.phone}
                </a>
              </div>
            )}
          </div>
        </div>

        {(job.property || job.jobSpecificNotes) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6 border-l-4 border-vm-navy">
            <h2 className="font-semibold text-lg mb-4">Property Instructions</h2>

            {job.property && (
              <div className="space-y-6">
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted mb-2">
                    Property overview
                  </h3>
                  <p className="font-medium text-vm-text">{job.property.name}</p>
                  <p className="text-vm-muted text-sm mt-1">
                    {job.property.address}
                    {job.property.city ? `, ${job.property.city}` : ""}
                    {job.property.state ? `, ${job.property.state}` : ""}
                  </p>
                  {(job.property.bedrooms != null ||
                    job.property.bathrooms != null ||
                    job.property.bedConfiguration) && (
                    <p className="text-vm-muted text-sm mt-2">
                      {job.property.bedrooms != null ? `${job.property.bedrooms} bed` : null}
                      {job.property.bedrooms != null && job.property.bathrooms != null
                        ? " · "
                        : null}
                      {job.property.bathrooms != null ? `${job.property.bathrooms} bath` : null}
                      {job.property.bedConfiguration
                        ? ` · ${job.property.bedConfiguration}`
                        : null}
                    </p>
                  )}
                  {job.property.amenities?.length > 0 && (
                    <p className="text-vm-muted text-sm mt-2">
                      Amenities: {job.property.amenities.join(", ")}
                    </p>
                  )}
                  {job.property.restrictedAreas && (
                    <p className="text-sm mt-2 text-amber-800">
                      Restricted: {job.property.restrictedAreas}
                    </p>
                  )}
                </section>

                {(job.property.accessType || job.property.accessNotes) && (
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted mb-2">
                      Access
                    </h3>
                    {job.property.accessType && (
                      <p className="text-vm-text">{job.property.accessType}</p>
                    )}
                    {job.property.accessNotes && (
                      <p className="text-vm-text whitespace-pre-wrap mt-1">
                        {job.property.accessNotes}
                      </p>
                    )}
                    {(job.property.standardCheckoutTime ||
                      job.property.standardCheckinTime) && (
                      <p className="text-vm-muted text-sm mt-2">
                        {job.property.standardCheckoutTime
                          ? `Checkout: ${job.property.standardCheckoutTime}`
                          : null}
                        {job.property.standardCheckoutTime &&
                        job.property.standardCheckinTime
                          ? " · "
                          : null}
                        {job.property.standardCheckinTime
                          ? `Check-in: ${job.property.standardCheckinTime}`
                          : null}
                      </p>
                    )}
                  </section>
                )}

                {(job.property.linenInstructions ||
                  job.property.supplyStorageLocation ||
                  job.property.trashInstructions) && (
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted mb-2">
                      Linens &amp; supplies
                    </h3>
                    {job.property.linenInstructions && (
                      <p className="text-vm-text">
                        Linens: {job.property.linenInstructions}
                      </p>
                    )}
                    {job.property.supplyStorageLocation && (
                      <p className="text-vm-text mt-1">
                        Supplies: {job.property.supplyStorageLocation}
                      </p>
                    )}
                    {job.property.trashInstructions && (
                      <p className="text-vm-text mt-1">
                        Trash: {job.property.trashInstructions}
                      </p>
                    )}
                  </section>
                )}

                {job.property.standingInstructions && (
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted mb-2">
                      Standard cleaning instructions
                    </h3>
                    <p className="text-vm-text whitespace-pre-wrap">
                      {job.property.standingInstructions}
                    </p>
                  </section>
                )}
              </div>
            )}

            {job.jobSpecificNotes && (
              <section className={job.property ? "mt-6 pt-6 border-t border-gray-200" : ""}>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-vm-muted mb-2">
                  Job-specific notes
                </h3>
                <p className="text-vm-text whitespace-pre-wrap">{job.jobSpecificNotes}</p>
              </section>
            )}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">Job Details</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-vm-muted mt-0.5" />
              <div>
                <p className="font-medium">Date & Time</p>
                <p className="text-vm-muted">
                  {formatDate(job.preferredDate)} at {formatTime(job.preferredTime)}
                </p>
              </div>
            </div>

            {job.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-vm-muted mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-vm-muted">{job.address}</p>
                </div>
              </div>
            )}

            {job.serviceType && (
              <div>
                <p className="font-medium">Service Type</p>
                <p className="text-vm-muted">{job.serviceType}</p>
              </div>
            )}

            {job.serviceLocation && (
              <div>
                <p className="font-medium">Service Location</p>
                <p className="text-vm-muted">{job.serviceLocation}</p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-vm-muted mt-0.5" />
              <div>
                <p className="font-medium">Total Price</p>
                <p className="text-vm-muted">
                  {formatPrice(job.totalPrice, job.currency)}
                </p>
              </div>
            </div>

            {job.Branch && (
              <div>
                <p className="font-medium">Branch</p>
                <p className="text-vm-muted">{job.Branch.name}</p>
              </div>
            )}

            {job.assignedAt && (
              <div>
                <p className="font-medium">Assigned At</p>
                <p className="text-vm-muted">
                  {new Date(job.assignedAt).toLocaleString("en-US")}
                </p>
              </div>
            )}
          </div>
        </div>

        {showChecklist && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="font-semibold text-lg mb-2">Service Checklist</h2>
            <JobChecklistPanel jobId={jobId} active={showChecklist} />
          </div>
        )}
      </div>
    </div>
  );
}
