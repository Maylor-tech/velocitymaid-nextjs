"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Calendar, MapPin, DollarSign, CheckCircle, XCircle, Phone, Mail } from "lucide-react";
import Link from "next/link";
import { JobChecklistPanel } from "@/components/cleaner/JobChecklistPanel";
import { formatServiceDate } from "@/lib/dates/serviceDate";
import { JobTimer } from "@/components/cleaner/JobTimer";
import { JobPhotoCapture } from "@/components/cleaner/JobPhotoCapture";
import { EscalateIssueCard } from "@/components/cleaner/EscalateIssueCard";
import { isOfferExpiredByTimestamp } from "@/lib/dispatch/offerExpiry";

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
  compensationAmount?: number | null;
  compensationCurrency?: string | null;
  compensationBasis?: 'FLAT' | 'HOURLY' | 'OTHER' | null;
  compensation?: {
    amount: number;
    currency: string;
    basis: string;
    basisLabel: string;
  } | null;
  estimatedDurationMins?: number | null;
  currency: string | null;
  assignedAt: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  submittedForQcAt?: string | null;
  jobSpecificNotes?: string | null;
  property?: PropertyInstructions | null;
  Customer?: CustomerInfo | null;
  location?: { city: string | null; state: string | null; areaLabel: string | null };
  Branch: {
    id: string;
    name: string;
  } | null;
}

interface OfferPayload {
  offerId: string;
  jobId: string;
  serviceType: string | null;
  serviceDate: string;
  preferredTime: string | null;
  location: { areaLabel: string | null };
  compensationAmount: number;
  compensationCurrency: string;
  compensationBasis?: 'FLAT' | 'HOURLY' | 'OTHER';
  compensation?: {
    amount: number;
    currency: string;
    basis: string;
    basisLabel: string;
  };
  estimatedDurationMins?: number | null;
  expiresAt: string;
  operationalNotes: string | null;
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
  const [offer, setOffer] = useState<OfferPayload | null>(null);
  const [access, setAccess] = useState<"OFFER" | "ASSIGNED" | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

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
      setAccess(data.access === "OFFER" ? "OFFER" : "ASSIGNED");
      setOffer(data.offer ?? null);
    } catch (err: unknown) {
      console.error("Failed to fetch job:", err);
      setError(err instanceof Error ? err.message : "Failed to load job");
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOffer = async () => {
    if (!offer || !confirm("Accept this offer? You will be assigned and receive access details.")) {
      return;
    }
    setProcessing(true);
    try {
      const res = await fetch(`/api/cleaner/offers/${offer.offerId}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to accept offer");
      }
      await fetchJob();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to accept offer");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineOffer = async () => {
    if (!offer || !confirm("Decline this offer?")) return;
    const reason = window.prompt("Optional reason:") || "";
    setProcessing(true);
    try {
      const res = await fetch(`/api/cleaner/offers/${offer.offerId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to decline offer");
      }
      router.push("/cleaner/jobs");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to decline offer");
    } finally {
      setProcessing(false);
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
    if (
      !confirm(
        "Submit this job for QC? This does not invoice the customer. Admin reviews photos and checklist before billing."
      )
    ) {
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
          "Submitted for QC. Admin still reviews completion before invoicing."
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
        "Decline this assigned job? Ops will need to send a new offer."
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
      alert("Job declined. Ops can offer it to another cleaner.");
    } catch (err: unknown) {
      console.error("Failed to decline job:", err);
      alert(err instanceof Error ? err.message : "Failed to decline job");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "TBD";
    return formatServiceDate(dateStr, {
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
      AWAITING_QC: "bg-amber-100 text-amber-900",
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

  const canAccept = access === "ASSIGNED" && job.status === "ASSIGNED";
  const canStart = access === "ASSIGNED" && job.status === "ON_THE_WAY";
  const canComplete = access === "ASSIGNED" && job.status === "IN_PROGRESS";
  const canDecline = access === "ASSIGNED" && job.status === "ASSIGNED";
  const submittedForQc = access === "ASSIGNED" && job.status === "AWAITING_QC";
  const showChecklist =
    access === "ASSIGNED" &&
    (job.status === "ON_THE_WAY" ||
      job.status === "IN_PROGRESS" ||
      job.status === "AWAITING_QC" ||
      job.status === "COMPLETED");

  if (access === "OFFER" && offer) {
    const offerExpired = isOfferExpiredByTimestamp(offer, new Date(nowMs));
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/cleaner/jobs"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Jobs
          </Link>
          <h1 className="text-2xl font-semibold mb-2">
            {offerExpired ? "Offer expired" : "Job offer"}
          </h1>
          <p className="text-vm-muted mb-6">
            {offerExpired
              ? "This offer has expired. You can no longer accept or decline it."
              : "Accept to be assigned. Access codes and full address are shown after you accept."}
          </p>
          <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-3">
            <p><span className="text-vm-muted">Service:</span> {offer.serviceType || "Cleaning"}</p>
            <p><span className="text-vm-muted">Date:</span> {offer.serviceDate} {offer.preferredTime ? `at ${offer.preferredTime}` : ""}</p>
            <p><span className="text-vm-muted">Area:</span> {offer.location.areaLabel || "See details after accept"}</p>
            {offer.estimatedDurationMins != null && (
              <p><span className="text-vm-muted">Est. duration:</span> {offer.estimatedDurationMins} min</p>
            )}
            <p>
              <span className="text-vm-muted">Your pay:</span>{" "}
              {formatPrice(
                offer.compensation?.amount ?? offer.compensationAmount,
                offer.compensation?.currency || offer.compensationCurrency
              )}
              {offer.compensation?.basisLabel
                ? ` (${offer.compensation.basisLabel})`
                : ""}
            </p>
            <p>
              <span className="text-vm-muted">
                {offerExpired ? "Expired at:" : "Respond by:"}
              </span>{" "}
              {new Date(offer.expiresAt).toLocaleString()}
            </p>
            {offer.operationalNotes && (
              <p className="whitespace-pre-wrap"><span className="text-vm-muted">Notes:</span> {offer.operationalNotes}</p>
            )}
          </div>
          {offerExpired ? (
            <p className="font-medium text-red-700">Expired</p>
          ) : (
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleAcceptOffer}
              disabled={processing}
              className="px-6 py-3 rounded-lg font-semibold text-white bg-vm-success disabled:bg-gray-400"
            >
              {processing ? "Processing..." : "Accept offer"}
            </button>
            <button
              onClick={handleDeclineOffer}
              disabled={processing}
              className="px-6 py-3 rounded-lg font-semibold text-white bg-vm-danger disabled:bg-gray-400"
            >
              Decline
            </button>
          </div>
          )}
        </div>
      </div>
    );
  }

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
                  {processing ? "Processing..." : "Start Job"}
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
                  {processing ? "Processing..." : "Finish Job (submit for QC)"}
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

        {access === "ASSIGNED" && job.Customer && (
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
        )}

        {(job.property || job.jobSpecificNotes) && access === "ASSIGNED" && (
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
                <p className="font-medium">Your pay</p>
                <p className="text-vm-muted">
                  {formatPrice(
                    job.compensation?.amount ?? job.compensationAmount ?? null,
                    job.compensation?.currency || job.compensationCurrency || job.currency
                  )}
                  {job.compensation?.basisLabel
                    ? ` (${job.compensation.basisLabel})`
                    : ""}
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

        {(canStart || canComplete || submittedForQc || job.status === "COMPLETED") && (
          <div className="mb-6">
            <JobTimer
              startedAt={job.startedAt ?? null}
              completedAt={job.completedAt ?? job.submittedForQcAt ?? null}
            />
          </div>
        )}

        {submittedForQc && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            Submitted for QC. Admin reviews photos and checklist before the job is marked complete.
          </div>
        )}

        {access === "ASSIGNED" &&
          (job.status === "ON_THE_WAY" ||
            job.status === "IN_PROGRESS" ||
            job.status === "AWAITING_QC" ||
            job.status === "COMPLETED") && (
            <>
              <JobPhotoCapture jobId={jobId} uploadedBy="cleaner" />
              <EscalateIssueCard jobId={jobId} />
            </>
          )}

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
