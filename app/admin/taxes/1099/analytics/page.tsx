/**
 * Phase 3H.12: Year-over-Year Compliance Analytics
 * 
 * /admin/taxes/1099/analytics
 * 
 * Strategic analytics dashboard showing trends across tax years
 * Read-only, admin-only, no sensitive data
 */

"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, Target, Calendar, Users, CheckCircle, AlertCircle, XCircle, FileText, Download } from "lucide-react";

interface YearData {
  year: number;
  finalScore: number;
  status: string;
  eligibleCleaners: number;
  verifiedW9Pct: number;
  addressCompletePct: number;
  archiveDate: string;
  archivedBy: string | null;
  blockers: Array<{ type: string; count: number }>;
  insights: string[];
}

interface AnalyticsData {
  success: boolean;
  years: YearData[];
  trends: {
    readinessImproving: boolean | null;
    avgScoreIncrease: number | null;
    blockerReduction: Record<string, number>;
  };
  efficiency: {
    medianDaysToSubmit: number | null;
    medianDaysToVerify: number | null;
    avgRemindersPerCleaner: number | null;
  };
}

const BLOCKER_LABELS: Record<string, string> = {
  W9_NOT_VERIFIED: "W-9 Not Verified",
  ADDRESS_INCOMPLETE: "Address Incomplete",
  STRIPE_PAYOUTS_DISABLED: "Stripe Payouts Disabled",
  NO_STATEMENTS: "No Statements",
};

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: any }> = {
  READY: {
    bg: "bg-green-100",
    text: "text-green-800",
    icon: CheckCircle,
  },
  AT_RISK: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    icon: AlertCircle,
  },
  NOT_READY: {
    bg: "bg-red-100",
    text: "text-red-800",
    icon: XCircle,
  },
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/1099/analytics");
      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to fetch analytics");
      }

      setData(result);
    } catch (err: any) {
      console.error("Failed to fetch analytics:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBoardSummary = () => {
    window.open("/api/admin/1099/board-summary.pdf", "_blank");
  };

  const handleDownloadInvestorSummary = () => {
    window.open("/api/admin/1099/investor-summary.pdf", "_blank");
  };

  const handleDownloadComplianceProcess = () => {
    window.open("/api/admin/1099/compliance-process.pdf", "_blank");
  };

  const handleDownloadSecurityOverview = () => {
    window.open("/api/admin/security-overview.pdf", "_blank");
  };

  const handleDownloadAuditLog = () => {
    window.open("/api/admin/audit-log/export", "_blank");
  };

  const handleDownloadLenderSummary = () => {
    window.open("/api/admin/1099/lender-summary.pdf", "_blank");
  };

  const handleDownloadDataRoom = async () => {
    try {
      const response = await fetch("/api/admin/data-room/export");
      if (!response.ok) {
        throw new Error("Failed to generate data room");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `VelocityMaid_Compliance_Data_Room_${new Date().toISOString().split("T")[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Show success message
      alert("✅ Data Room generated with signed checksum manifest");
    } catch (error) {
      console.error("Error downloading data room:", error);
      alert("Failed to generate data room. Please try again.");
    }
  };

  const handleDownloadPartnerPilotProposal = () => {
    const partnerName = prompt("Enter partner organization name:", "Partner Organization");
    if (!partnerName) return;
    
    const contactName = prompt("Enter contact name:", "VelocityMaid Team");
    const contactEmail = prompt("Enter contact email:", "admin@velocitymaid.com");
    const contactPhone = prompt("Enter contact phone:", "+1 (802) 555-1234");
    
    const params = new URLSearchParams({
      partner_name: partnerName || "Partner Organization",
      contact_name: contactName || "VelocityMaid Team",
      contact_email: contactEmail || "admin@velocitymaid.com",
      contact_phone: contactPhone || "+1 (802) 555-1234",
    });
    
    window.open(`/api/admin/partner-pilot-proposal.pdf?${params.toString()}`, "_blank");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = STATUS_COLORS[status] || STATUS_COLORS.NOT_READY;
    const Icon = statusConfig.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}
      >
        <Icon className="w-3 h-3" />
        {status.replace("_", " ")}
      </span>
    );
  };

  const getBlockerLabel = (type: string): string => {
    return BLOCKER_LABELS[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.years.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-gray-600">No archived tax years found. Analytics will be available after tax years are archived.</p>
          </div>
        </div>
      </div>
    );
  }

  const sortedYears = [...data.years].sort((a, b) => a.year - b.year);
  const maxScore = Math.max(...data.years.map((y) => y.finalScore), 100);

  // Get all unique blocker types across all years
  const allBlockerTypes = new Set<string>();
  data.years.forEach((year) => {
    year.blockers.forEach((b) => allBlockerTypes.add(b.type));
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Year-over-Year Compliance Analytics
            </h1>
            <p className="text-gray-600">
              Strategic insights and trends across tax years
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadBoardSummary}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              title="Download board-ready PDF summary (no sensitive data)"
            >
              <FileText className="w-4 h-4" />
              Board Summary
            </button>
            <button
              onClick={handleDownloadInvestorSummary}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              title="High-level compliance overview for investors & partners"
            >
              <FileText className="w-4 h-4" />
              Investor Summary
            </button>
            <button
              onClick={handleDownloadLenderSummary}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              title="Lender-focused compliance summary"
            >
              <FileText className="w-4 h-4" />
              Lender Summary
            </button>
            <button
              onClick={handleDownloadComplianceProcess}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              title="Compliance process overview (investors, board, auditors)"
            >
              <FileText className="w-4 h-4" />
              Process Doc
            </button>
            <button
              onClick={() => window.open("/api/admin/reports/w9-1099-workflow.pdf", "_blank")}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              title="W-9 & 1099 workflow description (auditors, accountants, investors)"
            >
              <FileText className="w-4 h-4" />
              W-9 Workflow
            </button>
            <button
              onClick={handleDownloadSecurityOverview}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              title="Security controls and data protection overview"
            >
              <FileText className="w-4 h-4" />
              Security Doc
            </button>
            <button
              onClick={handleDownloadAuditLog}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              title="Export audit log as CSV"
            >
              <Download className="w-4 h-4" />
              Audit Log
            </button>
            <button
              onClick={handleDownloadPartnerPilotProposal}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              title="Generate branded partner pilot proposal PDF (safe for legal + ops teams)"
            >
              <FileText className="w-4 h-4" />
              Partner Proposal
            </button>
          </div>
        </div>

        {/* Data Room Export */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                Compliance Data Room
              </h2>
              <p className="text-sm text-gray-600">
                One-click export of all compliance documentation for investors, auditors, and due diligence
              </p>
            </div>
            <button
              onClick={handleDownloadDataRoom}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
              title="Generates a governance-safe ZIP with cryptographic integrity verification (signed checksum manifest) for investors & auditors"
            >
              <Download className="w-5 h-5" />
              Download Data Room (ZIP)
            </button>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p>Includes: Governance summaries, tax compliance docs, security overview, audit logs, and sample exports</p>
            <p className="mt-1">No sensitive data • Read-only • Safe for sharing</p>
          </div>
        </div>

        {/* Trends Summary */}
        {data.trends.readinessImproving !== null && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-4">
              {data.trends.readinessImproving ? (
                <TrendingUp className="w-8 h-8 text-green-600" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-600" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Readiness Trend
                </h3>
                <p className="text-sm text-gray-600">
                  {data.trends.readinessImproving
                    ? "Compliance is improving year over year"
                    : "Compliance needs attention"}
                  {data.trends.avgScoreIncrease !== null &&
                    ` (avg ${data.trends.avgScoreIncrease > 0 ? "+" : ""}${data.trends.avgScoreIncrease.toFixed(1)} points per year)`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Section 1: Readiness Trend (Line Chart) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Readiness Score Trend
          </h2>
          <div className="relative h-64 flex items-end">
            {sortedYears.map((year, idx) => {
              const height = (year.finalScore / maxScore) * 100;
              const statusConfig = STATUS_COLORS[year.status] || STATUS_COLORS.NOT_READY;
              const isLast = idx === sortedYears.length - 1;
              const isFirst = idx === 0;

              return (
                <div
                  key={year.year}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div className="relative w-full flex items-end justify-center" style={{ height: "200px" }}>
                    <div
                      className={`w-16 rounded-t ${statusConfig.bg} transition-all hover:opacity-80 cursor-pointer`}
                      style={{ height: `${height}%` }}
                      title={`${year.year}: ${year.finalScore.toFixed(1)}/100`}
                    >
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-gray-700 whitespace-nowrap">
                        {year.finalScore.toFixed(0)}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-medium text-gray-700 mt-2">
                    {year.year}
                  </div>
                  <div className="text-xs text-gray-500">
                    {getStatusBadge(year.status)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Readiness Timeline Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Readiness Timeline
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Year
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Final Score
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Eligible Cleaners
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Verified W-9 %
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Archived
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedYears.map((year) => (
                  <tr key={year.year} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">
                      {year.year}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {year.finalScore.toFixed(1)}/100
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {getStatusBadge(year.status)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {year.eligibleCleaners}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {year.verifiedW9Pct}%
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-700">
                      {new Date(year.archiveDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Blocker Trends */}
        {allBlockerTypes.size > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Blocker Trends
            </h2>
            <div className="space-y-4">
              {sortedYears.map((year) => {
                const totalBlockers = year.blockers.reduce(
                  (sum, b) => sum + b.count,
                  0
                );

                return (
                  <div key={year.year} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">
                        {year.year}
                      </span>
                      <span className="text-gray-500">
                        {totalBlockers} blocker{totalBlockers !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex gap-1 h-8">
                      {Array.from(allBlockerTypes).map((blockerType) => {
                        const blocker = year.blockers.find(
                          (b) => b.type === blockerType
                        );
                        const count = blocker?.count || 0;
                        const width =
                          totalBlockers > 0 ? (count / totalBlockers) * 100 : 0;

                        if (count === 0) return null;

                        return (
                          <div
                            key={blockerType}
                            className="bg-blue-500 rounded transition-all hover:opacity-80"
                            style={{ width: `${width}%` }}
                            title={`${getBlockerLabel(blockerType)}: ${count}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Stacked bars show relative proportion of each blocker type per year
              </p>
            </div>
          </div>
        )}

        {/* Section 4: Operational Efficiency */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Operational Efficiency
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">
                Median Days to W-9 Submission
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {data.efficiency.medianDaysToSubmit !== null
                  ? `${data.efficiency.medianDaysToSubmit} days`
                  : "N/A"}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">
                Median Days to Verification
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {data.efficiency.medianDaysToVerify !== null
                  ? `${data.efficiency.medianDaysToVerify} days`
                  : "N/A"}
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">
                Avg Reminders per Cleaner
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {data.efficiency.avgRemindersPerCleaner !== null
                  ? data.efficiency.avgRemindersPerCleaner.toFixed(1)
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Leadership Insights */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Leadership Insights
          </h2>
          <div className="space-y-4">
            {sortedYears.map((year) => (
              <div key={year.year} className="border-l-4 border-blue-500 pl-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-gray-900">
                    {year.year} Insights:
                  </span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {year.insights.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

