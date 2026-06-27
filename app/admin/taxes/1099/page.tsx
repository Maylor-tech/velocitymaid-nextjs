/**
 * Phase 3H.2: Admin 1099 Dashboard
 * 
 * Displays 1099 candidates with year selector, filters, and threshold logic
 * Shows totals from PayoutTransfer where status=PAID and createdAt within year
 * Joins with CleanerTaxProfile (redacted) for W-9 status + tinLast4 + address
 * Never exposes full TIN in UI
 */

"use client";

import { useState, useEffect } from "react";
import {
  Loader2,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle,
  Calendar,
  DollarSign,
  Users,
  Target,
  TrendingUp,
} from "lucide-react";

interface Candidate {
  cleanerId: string;
  cleanerName: string | null;
  cleanerEmail: string;
  totalAmountCents: number;
  totalAmount: string;
  transferCount: number;
  taxProfileStatus: string | null;
  taxProfileVerified: boolean;
  tinType: string | null;
  tinLast4: string | null;
  legalName: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
}

interface Summary {
  totalCandidates: number;
  totalAmount: string;
  verifiedCount: number;
  unverifiedCount: number;
}

export default function Admin1099Page() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [threshold, setThreshold] = useState<number>(600);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all");
  const [readinessData, setReadinessData] = useState<{
    overallScore: number;
    eligibleCleanersCount: number;
    blockers: Array<{
      type: string;
      label: string;
      count: number;
      cleanerIds: string[];
    }>;
    countdown?: {
      active: boolean;
      daysRemaining: number;
      phase: "NORMAL" | "WARNING" | "CRITICAL";
    };
  } | null>(null);
  const [isArchived, setIsArchived] = useState(false);
  const [archiveData, setArchiveData] = useState<{
    archivedAt: string;
    archivedBy: string | null;
    readinessScore: number;
    status: string;
    summary: any;
  } | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [blockerFilter, setBlockerFilter] = useState<string | null>(null);
  const [callList, setCallList] = useState<Array<{
    cleanerId: string;
    cleanerName: string | null;
    cleanerEmail: string;
    cleanerPhone: string | null;
    priorityScore: number;
    issues: string[];
    w9Status: string | null;
    addressComplete: boolean;
    lastReminderSentAt: string | null;
    reminderCount: number;
    callScript: {
      type: string;
      title: string;
      script: string;
      followUps?: string[];
    };
    voicemailScript: {
      type: string;
      title: string;
      script: string;
    };
  }>>([]);
  const [callListLoading, setCallListLoading] = useState(false);
  const [selectedScript, setSelectedScript] = useState<{
    cleanerName: string | null;
    callScript: {
      type: string;
      title: string;
      script: string;
      followUps?: string[];
    };
    voicemailScript: {
      type: string;
      title: string;
      script: string;
    };
  } | null>(null);
  const [contactedCleaners, setContactedCleaners] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchCandidates();
    fetchReadiness();
    fetchCallList();
  }, [year, statusFilter, verifiedFilter]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Update threshold based on year (Option A: 600.01 for 2025, 2000.01 for 2026+)
      const newThreshold = year === 2025 ? 600.01 : 2000.01;
      setThreshold(newThreshold);

      const res = await fetch(`/api/admin/1099/${year}`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch 1099 candidates");
      }

      let filteredCandidates = data.candidates || [];

      // Phase 3H.11: Check archive status
      setIsArchived(data.archived || false);
      setArchiveData(data.archive || null);

      // Apply filters
      if (statusFilter !== "all") {
        filteredCandidates = filteredCandidates.filter(
          (c: Candidate) => c.taxProfileStatus === statusFilter
        );
      }

      if (verifiedFilter === "verified") {
        filteredCandidates = filteredCandidates.filter(
          (c: Candidate) => c.taxProfileVerified
        );
      } else if (verifiedFilter === "unverified") {
        filteredCandidates = filteredCandidates.filter(
          (c: Candidate) => !c.taxProfileVerified
        );
      }

      // Apply blocker filter if active
      if (blockerFilter && readinessData) {
        const blocker = readinessData.blockers.find((b) => b.type === blockerFilter);
        if (blocker) {
          filteredCandidates = filteredCandidates.filter((c: Candidate) =>
            blocker.cleanerIds.includes(c.cleanerId)
          );
        }
      }

      setCandidates(filteredCandidates);
      setSummary(data.summary || null);
    } catch (err: any) {
      console.error("Failed to fetch 1099 candidates:", err);
      setError(err.message || "Failed to load 1099 candidates");
      setCandidates([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadiness = async () => {
    try {
      setReadinessLoading(true);
      const res = await fetch(`/api/admin/1099/${year}/readiness`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to fetch readiness score");
      }

      setReadinessData({
        overallScore: data.overallScore,
        eligibleCleanersCount: data.eligibleCleanersCount,
        blockers: data.blockers || [],
      });
    } catch (err: any) {
      console.error("Failed to fetch readiness:", err);
      // Don't show error for readiness, just log it
    } finally {
      setReadinessLoading(false);
    }
  };

  const handleBlockerClick = (blockerType: string) => {
    setBlockerFilter(blockerType);
    // Refetch candidates to apply filter
    fetchCandidates();
  };

  const clearBlockerFilter = () => {
    setBlockerFilter(null);
    fetchCandidates();
  };

  const handleDownloadCandidates = () => {
    window.open(`/api/admin/1099/${year}/candidates.csv`, "_blank");
  };

  const handleDownloadIRIS = () => {
    if (
      !confirm(
        "IRIS export contains full TIN information. Only download if you are authorized to access this sensitive data. Continue?"
      )
    ) {
      return;
    }
    window.open(`/api/admin/1099/${year}/iris.csv`, "_blank");
  };

  const handleDownloadCallSheet = () => {
    window.open(`/api/admin/1099/${year}/call-sheet.pdf`, "_blank");
  };

  const getStatusBadge = (status: string | null, verified: boolean) => {
    if (verified) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-vm-success-bg text-vm-success">
          <CheckCircle className="w-3 h-3" />
          Verified
        </span>
      );
    }

    if (status === "SUBMITTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-vm-cyan-tint text-blue-800">
          <AlertCircle className="w-3 h-3" />
          Submitted
        </span>
      );
    }

    if (status === "REJECTED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-vm-danger-bg text-red-800">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-vm-text">
        <AlertCircle className="w-3 h-3" />
        No Tax Profile
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-vm-cyan-dark" />
          </div>
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
            <h1 className="text-3xl font-bold text-vm-text mb-2">1099 Tax Forms</h1>
            <p className="text-vm-muted">
              View and export 1099 candidates for tax reporting
            </p>
          </div>
        </div>

        {/* Archive Banner (Phase 3H.11) */}
        {isArchived && archiveData && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-2xl">🗂️</div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Tax year {year} archived on {new Date(archiveData.archivedAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </h3>
                <p className="text-sm text-blue-800 mb-3">
                  Records are locked for integrity. This year is read-only. Contact a super-admin for review access.
                </p>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-blue-600 font-medium">Final Score</div>
                      <div className="text-lg font-bold text-blue-900">
                        {archiveData.readinessScore.toFixed(1)}/100
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-600 font-medium">Status</div>
                      <div className="text-lg font-bold text-blue-900">
                        {archiveData.status}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-600 font-medium">Eligible Cleaners</div>
                      <div className="text-lg font-bold text-blue-900">
                        {archiveData.summary?.eligibleCleaners || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-600 font-medium">Verified W-9</div>
                      <div className="text-lg font-bold text-blue-900">
                        {archiveData.summary?.verifiedW9 || 0}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Year Selector & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-vm-text mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Tax Year
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                {Array.from({ length: 5 }, (_, i) => currentYear - i).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-vm-text mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Threshold
              </label>
              <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg">
                ${threshold.toLocaleString()}+
              </div>
              <p className="text-xs text-vm-muted mt-1">
                {year === 2025
                  ? "2025 threshold: $600.01"
                  : "2026+ threshold: $2,000.01"}
              </p>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleDownloadCandidates}
                className="flex items-center gap-2 px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={handleDownloadIRIS}
                className="flex items-center gap-2 px-4 py-2 bg-vm-success text-white rounded-lg hover:bg-vm-success"
              >
                <FileText className="w-4 h-4" />
                Export IRIS
              </button>
              {!isArchived && readinessData?.countdown?.active && callList.length > 0 && (
                <button
                  onClick={handleDownloadCallSheet}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  title="Download printable daily call sheet (PDF)"
                >
                  <FileText className="w-4 h-4" />
                  Download Call Sheet
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Readiness Score Card */}
        {readinessData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Target className="w-6 h-6 text-blue-600" />
                <h2 className="text-lg font-semibold text-vm-text">
                  Jan 31 Readiness Score
                </h2>
              </div>
              {readinessLoading && (
                <Loader2 className="w-4 h-4 animate-spin text-vm-muted" />
              )}
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-4xl font-bold text-vm-text">
                  {readinessData.overallScore.toFixed(1)}
                </span>
                <span className="text-lg text-vm-muted">/ 100</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    readinessData.overallScore >= 80
                      ? "bg-vm-success"
                      : readinessData.overallScore >= 60
                      ? "bg-vm-warning"
                      : "bg-vm-danger"
                  }`}
                  style={{ width: `${readinessData.overallScore}%` }}
                />
              </div>
              <p className="text-sm text-vm-muted mt-2">
                Based on {readinessData.eligibleCleanersCount} eligible cleaner
                {readinessData.eligibleCleanersCount !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Top Blockers */}
            {readinessData.blockers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-vm-text mb-3">
                  Top Blockers
                </h3>
                <div className="space-y-2">
                  {readinessData.blockers.slice(0, 5).map((blocker) => (
                    <button
                      key={blocker.type}
                      onClick={() => handleBlockerClick(blocker.type)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                        blockerFilter === blocker.type
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-vm-text">
                          {blocker.label}
                        </span>
                      </div>
                      <span className="text-sm text-vm-muted">
                        {blocker.count} cleaner{blocker.count !== 1 ? "s" : ""}
                      </span>
                    </button>
                  ))}
                </div>
                {blockerFilter && (
                  <button
                    onClick={clearBlockerFilter}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Clear filter
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Today's Focus Panel (Phase 3H.7) - Hidden if archived */}
        {!isArchived &&
          readinessData?.countdown?.active &&
          readinessData.countdown.daysRemaining <= 7 &&
          readinessData.blockers.length > 0 && (
            <div className="bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-300 rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
                <h2 className="text-lg font-semibold text-red-900">
                  Today's Focus
                </h2>
              </div>
              <p className="text-sm text-red-800 mb-4">
                With only <strong>{readinessData.countdown.daysRemaining} day{readinessData.countdown.daysRemaining !== 1 ? "s" : ""}</strong> remaining, prioritize these blockers:
              </p>
              <div className="space-y-3">
                {readinessData.blockers.slice(0, 3).map((blocker, index) => (
                  <div
                    key={blocker.type}
                    className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 bg-vm-danger-bg text-red-700 rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium text-vm-text">
                          {blocker.label}
                        </div>
                        <div className="text-sm text-vm-muted">
                          Affects {blocker.count} cleaner{blocker.count !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleBlockerClick(blocker.type)}
                      className="px-4 py-2 bg-vm-danger text-white rounded-lg hover:bg-vm-danger text-sm font-medium"
                    >
                      View Affected
                    </button>
                  </div>
                ))}
              </div>
            </div>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="text-sm text-vm-muted">Total Candidates</p>
                  <p className="text-2xl font-bold text-vm-text">
                    {summary.totalCandidates}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <DollarSign className="w-8 h-8 text-vm-success" />
                <div>
                  <p className="text-sm text-vm-muted">Total Amount</p>
                  <p className="text-2xl font-bold text-vm-text">
                    ${parseFloat(summary.totalAmount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-vm-success" />
                <div>
                  <p className="text-sm text-vm-muted">Verified</p>
                  <p className="text-2xl font-bold text-vm-text">
                    {summary.verifiedCount}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="text-sm text-vm-muted">Unverified</p>
                  <p className="text-2xl font-bold text-vm-text">
                    {summary.unverifiedCount}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Candidates Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-vm-text">
              1099 Candidates ({candidates.length})
            </h2>
          </div>

          {candidates.length === 0 ? (
            <div className="px-6 py-12 text-center text-vm-muted">
              No candidates found for {year}. Candidates must meet the ${threshold.toLocaleString()} threshold.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Cleaner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Tax Profile
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      TIN (Masked)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-vm-muted uppercase tracking-wider">
                      Transfers
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {candidates.map((candidate) => (
                    <tr key={candidate.cleanerId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-vm-text">
                            {candidate.cleanerName || "N/A"}
                          </div>
                          <div className="text-sm text-vm-muted">
                            {candidate.cleanerEmail}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(
                          candidate.taxProfileStatus,
                          candidate.taxProfileVerified
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-vm-text">
                          {candidate.tinLast4 || "N/A"}
                        </div>
                        {candidate.tinType && (
                          <div className="text-xs text-vm-muted">
                            {candidate.tinType}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-vm-text">
                          {candidate.legalName && (
                            <div className="font-medium mb-1">{candidate.legalName}</div>
                          )}
                          {candidate.addressLine1 || "N/A"}
                          {candidate.addressLine2 && (
                            <div>{candidate.addressLine2}</div>
                          )}
                          {(candidate.city || candidate.state || candidate.zipCode) && (
                            <div>
                              {[candidate.city, candidate.state, candidate.zipCode]
                                .filter(Boolean)
                                .join(", ")}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-medium text-vm-text">
                          ${parseFloat(candidate.totalAmount).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm text-vm-muted">
                          {candidate.transferCount}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

