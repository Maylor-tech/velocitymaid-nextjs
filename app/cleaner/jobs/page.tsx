"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Calendar, MapPin, DollarSign, AlertTriangle, RefreshCw } from "lucide-react";
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
  compensationAmount?: number | null;
  compensationBasis?: "FLAT" | "HOURLY" | "OTHER" | null;
  compensation?: {
    amount: number;
    currency: string;
    basis: string;
    basisLabel: string;
  } | null;
  currency: string | null;
  assignedAt: string | null;
  Branch: {
    id: string;
    name: string;
  } | null;
}

interface OfferCard {
  offerId: string;
  jobId: string;
  serviceType: string | null;
  serviceDate: string;
  preferredTime: string | null;
  location: { areaLabel: string | null };
  compensationAmount: number;
  compensationCurrency: string;
  compensationBasis?: "FLAT" | "HOURLY" | "OTHER";
  compensation?: {
    amount: number;
    currency: string;
    basis: string;
    basisLabel: string;
  };
  estimatedDurationMins?: number | null;
  expiresAt: string;
}

type TrainingState =
  | { kind: "loading" }
  | { kind: "unknown"; message: string }
  | {
      kind: "ready";
      status: string;
      modulesCompleted: number;
      modulesTotal: number;
    };

type OffersState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; offers: OfferCard[] };

export default function CleanerJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [offersState, setOffersState] = useState<OffersState>({
    kind: "loading",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [training, setTraining] = useState<TrainingState>({ kind: "loading" });

  const loadTraining = async () => {
    setTraining({ kind: "loading" });
    try {
      const res = await fetch("/api/cleaner/training");
      if (!res.ok) {
        setTraining({
          kind: "unknown",
          message:
            "Training status could not be verified. Retry before assuming you are certified.",
        });
        return;
      }
      const json = await res.json();
      if (!json?.status) {
        setTraining({
          kind: "unknown",
          message:
            "Training status is unavailable. Contact ops if offers stay blocked.",
        });
        return;
      }
      setTraining({
        kind: "ready",
        status: json.status,
        modulesCompleted: json.modulesCompleted,
        modulesTotal: json.modulesTotal,
      });
    } catch {
      setTraining({
        kind: "unknown",
        message:
          "Training status could not be verified. Check your connection and retry.",
      });
    }
  };

  useEffect(() => {
    // Local WR-2 visual fixtures only — never active off loopback.
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const fixture = new URLSearchParams(window.location.search).get(
        "wr2Fixture"
      );
      const localOnly =
        host === "127.0.0.1" || host === "localhost";
      if (localOnly && fixture) {
        setLoading(false);
        if (fixture === "offers-error") {
          setOffersState({
            kind: "error",
            message:
              "Offers could not be loaded. Assigned jobs below may still be accurate.",
          });
          setTraining({
            kind: "ready",
            status: "CERTIFIED",
            modulesCompleted: 6,
            modulesTotal: 6,
          });
          return;
        }
        if (fixture === "offers-empty") {
          setOffersState({ kind: "ready", offers: [] });
          setJobs([]);
          setTraining({
            kind: "ready",
            status: "CERTIFIED",
            modulesCompleted: 6,
            modulesTotal: 6,
          });
          return;
        }
        if (fixture === "training-unknown") {
          setOffersState({ kind: "ready", offers: [] });
          setTraining({
            kind: "unknown",
            message:
              "Training status could not be verified. Retry before assuming you are certified.",
          });
          return;
        }
      }
    }
    loadTraining();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const fixture = new URLSearchParams(window.location.search).get(
        "wr2Fixture"
      );
      if (
        (host === "127.0.0.1" || host === "localhost") &&
        fixture
      ) {
        return;
      }
    }
    void fetchJobs();
    // statusFilter is the intentional refresh trigger for list fetches
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchJobs closes over statusFilter
  }, [statusFilter]);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    setOffersState({ kind: "loading" });
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.append("status", statusFilter);

      const [jobsRes, offersRes] = await Promise.all([
        fetch(`/api/cleaner/jobs?${params.toString()}`),
        fetch(`/api/cleaner/offers`),
      ]);
      const data = await jobsRes.json();
      let offersData: { success?: boolean; offers?: OfferCard[]; error?: string } =
        {};
      try {
        offersData = await offersRes.json();
      } catch {
        offersData = {};
      }

      if (!jobsRes.ok) {
        if (jobsRes.status === 401) {
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

      if (!offersRes.ok || !offersData.success) {
        setOffersState({
          kind: "error",
          message:
            offersData.error ||
            "Offers could not be loaded. Assigned jobs below may still be accurate.",
        });
      } else {
        setOffersState({
          kind: "ready",
          offers: offersData.offers || [],
        });
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
      setError(err instanceof Error ? err.message : "Failed to load jobs");
      setOffersState({
        kind: "error",
        message: "Offers could not be loaded.",
      });
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
    if (!timeStr) return "Window TBD";
    return timeStr;
  };

  const formatPrice = (price: number | null, currency: string | null) => {
    if (price == null) return "—";
    const symbol = currency === "USD" ? "$" : currency || "$";
    return `${symbol}${price.toFixed(2)}`;
  };

  const getStatusBadgeColor = (status: string) => {
    const colors: Record<string, string> = {
      ASSIGNED: "bg-vm-navy/10 text-vm-navy",
      ON_THE_WAY: "bg-vm-cyan-tint text-blue-800",
      IN_PROGRESS: "bg-vm-warning-bg text-yellow-800",
      AWAITING_QC: "bg-amber-100 text-amber-900",
      COMPLETED: "bg-vm-success-bg text-vm-success",
      CANCELLED: "bg-vm-danger-bg text-red-800",
    };
    return colors[status] || "bg-gray-100 text-vm-text";
  };

  const getStatusAction = (status: string) => {
    if (status === "ASSIGNED") {
      return (
        <span className="text-sm text-blue-600 font-medium">Action Required</span>
      );
    }
    if (status === "ON_THE_WAY") {
      return <span className="text-sm text-cyan-600 font-medium">On The Way</span>;
    }
    if (status === "IN_PROGRESS") {
      return (
        <span className="text-sm text-yellow-600 font-medium">In Progress</span>
      );
    }
    if (status === "AWAITING_QC") {
      return (
        <span className="text-sm text-amber-700 font-medium">Submitted for QC</span>
      );
    }
    return null;
  };

  const offers =
    offersState.kind === "ready" ? offersState.offers : [];
  const nextJob =
    jobs.find((j) =>
      ["ASSIGNED", "ON_THE_WAY", "IN_PROGRESS"].includes(j.status)
    ) || jobs[0];

  if (loading && offersState.kind === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <CleanerPortalNav />

        {training.kind === "ready" && training.status !== "CERTIFIED" && (
          <TrainingIncompleteBanner
            status={training.status}
            modulesCompleted={training.modulesCompleted}
            modulesTotal={training.modulesTotal}
          />
        )}

        {training.kind === "unknown" && (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-950">{training.message}</p>
            </div>
            <button
              type="button"
              onClick={loadTraining}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-950"
            >
              <RefreshCw className="w-4 h-4" />
              Retry training status
            </button>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold mb-1">My Jobs</h1>
            <p className="text-vm-muted text-sm">
              Offers, next assignment, and winter disruption escalation
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              fetchJobs();
              loadTraining();
            }}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-vm-border bg-white px-4 py-2 text-sm font-semibold text-vm-navy"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {nextJob && !statusFilter ? (
          <div className="mb-6 rounded-xl border border-vm-navy/20 bg-white p-4 sm:p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-vm-cyan-dark">
              Next assignment
            </p>
            <h2 className="mt-1 text-lg font-semibold text-vm-navy">
              {nextJob.customerName || "Customer"} ·{" "}
              {nextJob.serviceType || "Cleaning"}
            </h2>
            <p className="mt-2 text-sm text-vm-muted">
              {formatDate(nextJob.preferredDate)} · {formatTime(nextJob.preferredTime)}
            </p>
            {(typeof nextJob.compensationAmount === "number" ||
              typeof nextJob.compensation?.amount === "number") && (
              <p className="mt-2 text-sm font-medium text-vm-navy">
                Your pay:{" "}
                {formatPrice(
                  nextJob.compensation?.amount ??
                    nextJob.compensationAmount ??
                    null,
                  nextJob.compensation?.currency || nextJob.currency
                )}
                {nextJob.compensation?.basisLabel
                  ? ` (${nextJob.compensation.basisLabel})`
                  : ""}
              </p>
            )}
            <Link
              href={`/cleaner/jobs/${nextJob.id}`}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-vm-navy px-4 py-2 text-sm font-semibold text-white"
            >
              Open next job →
            </Link>
          </div>
        ) : null}

        <div className="mb-4">
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="min-h-[44px] border rounded-lg px-3 py-2 bg-white w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ON_THE_WAY">On The Way</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="AWAITING_QC">Submitted for QC</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {error && (
          <div className="bg-vm-danger-bg border border-red-400 text-red-700 px-4 py-3 rounded mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p>{error}</p>
            <button
              type="button"
              onClick={fetchJobs}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-red-400 px-4 py-2 text-sm font-semibold"
            >
              Retry jobs
            </button>
          </div>
        )}

        <div className="mb-6 rounded-lg border border-vm-border bg-white px-4 py-3 text-sm text-vm-muted">
          Winter disruptions (roads, storms, access): message VelocityMaid ops
          from the job detail page or call your branch contact before canceling.
          Do not accept unsafe travel conditions.
        </div>

        {!statusFilter && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Open offers</h2>
            {offersState.kind === "loading" ? (
              <div className="rounded-lg border border-vm-border bg-white p-6 flex items-center gap-2 text-sm text-vm-muted">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading offers…
              </div>
            ) : null}
            {offersState.kind === "error" ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-amber-950">{offersState.message}</p>
                <button
                  type="button"
                  onClick={fetchJobs}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-950"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry offers
                </button>
              </div>
            ) : null}
            {offersState.kind === "ready" && offers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-vm-border bg-white p-6 text-sm text-vm-muted">
                No open offers right now. Assigned jobs still appear below.
              </div>
            ) : null}
            {offers.length > 0 ? (
              <div className="grid gap-4">
                {offers.map((offer) => (
                  <Link
                    key={offer.offerId}
                    href={`/cleaner/jobs/${offer.jobId}`}
                    className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 sm:p-6 block border-l-4 border-vm-navy"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <span className="px-2 py-1 rounded text-xs font-medium bg-vm-navy/10 text-vm-navy">
                          Offer
                        </span>
                        <h3 className="text-lg font-semibold mt-2">
                          {offer.serviceType || "Cleaning"}
                        </h3>
                        <p className="text-sm text-vm-muted mt-1">
                          {offer.serviceDate}{" "}
                          {offer.preferredTime
                            ? `· ${offer.preferredTime}`
                            : "· Window TBD"}
                        </p>
                        {offer.location.areaLabel && (
                          <p className="text-sm text-vm-muted mt-1">
                            {offer.location.areaLabel}
                          </p>
                        )}
                        <p className="text-sm font-medium mt-2">
                          Your pay: $
                          {(
                            offer.compensation?.amount ??
                            offer.compensationAmount
                          ).toFixed(2)}
                          {offer.compensation?.basisLabel
                            ? ` (${offer.compensation.basisLabel})`
                            : ""}
                        </p>
                        {offer.estimatedDurationMins != null && (
                          <p className="text-sm text-vm-muted mt-1">
                            Est. {offer.estimatedDurationMins} min
                          </p>
                        )}
                      </div>
                      <span className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-vm-navy px-4 py-2 text-sm font-semibold text-white">
                        Review offer →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {jobs.length === 0 && offers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="font-heading text-lg font-semibold text-vm-navy">
              {statusFilter ? "No jobs in this filter" : "No assigned jobs yet"}
            </h2>
            <p className="mt-2 font-body text-sm text-vm-muted">
              {statusFilter
                ? "Try All Statuses or another filter to see open offers and other jobs."
                : "When ops sends you an offer, it will appear above this list. Assigned jobs show here after you accept."}
            </p>
            {!statusFilter &&
              training.kind === "ready" &&
              training.status !== "CERTIFIED" && (
                <p className="mt-3 font-body text-sm text-vm-navy">
                  Training: {training.modulesCompleted}/{training.modulesTotal}{" "}
                  modules — complete certification to stay eligible for offers.
                </p>
              )}
          </div>
        ) : (
          <div className="grid gap-4">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/cleaner/jobs/${job.id}`}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4 sm:p-6 block"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
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
                        <Calendar className="w-4 h-4 shrink-0" />
                        <span>
                          {formatDate(job.preferredDate)} ·{" "}
                          {formatTime(job.preferredTime)}
                        </span>
                      </div>

                      {job.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 shrink-0" />
                          <span>{job.address}</span>
                        </div>
                      )}

                      {(typeof job.compensationAmount === "number" ||
                        typeof job.compensation?.amount === "number") && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 shrink-0" />
                          <span>
                            Your pay:{" "}
                            {formatPrice(
                              job.compensation?.amount ??
                                job.compensationAmount ??
                                null,
                              job.compensation?.currency || job.currency
                            )}
                            {job.compensation?.basisLabel
                              ? ` (${job.compensation.basisLabel})`
                              : ""}
                          </span>
                        </div>
                      )}

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

                  <div className="sm:ml-4 sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-2">
                    {getStatusAction(job.status)}
                    <span className="inline-flex min-h-[44px] items-center rounded-lg bg-vm-navy px-4 py-2 text-sm font-semibold text-white">
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
