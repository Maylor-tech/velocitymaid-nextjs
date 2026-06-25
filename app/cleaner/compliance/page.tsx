/**
 * Phase 3H.4: Cleaner Self-Serve Compliance Checklist
 * 
 * Displays compliance checklist with overall status and sections
 * Read-only; no sensitive data exposed
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  FileText,
  CreditCard,
  Receipt,
  Calendar,
} from "lucide-react";
import Link from "next/link";

type ComplianceStatus = "ALL_SET" | "ACTION_REQUIRED" | "UNDER_REVIEW";

interface ComplianceChecklistItem {
  id: string;
  label: string;
  status: "complete" | "incomplete" | "pending" | "review";
  description: string;
  actionUrl: string | null;
  actionLabel: string | null;
}

interface ComplianceChecklistSection {
  id: string;
  title: string;
  items: ComplianceChecklistItem[];
  allComplete: boolean;
}

interface ComplianceChecklistData {
  overallStatus: ComplianceStatus;
  sections: ComplianceChecklistSection[];
  summary: {
    totalItems: number;
    completedItems: number;
    incompleteItems: number;
    pendingItems: number;
  };
  readinessScore?: number; // Phase 3H.5: Individual readiness score (0-100)
  countdown?: {
    active: boolean;
    daysRemaining: number;
    phase: "NORMAL" | "WARNING" | "CRITICAL";
  }; // Phase 3H.7: Jan 31 Countdown (optional, soft notice)
}

export default function CleanerCompliancePage() {
  const router = useRouter();
  const [data, setData] = useState<ComplianceChecklistData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChecklist();
  }, []);

  const fetchChecklist = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/cleaner/compliance-checklist");
      const responseData = await res.json();

      if (!res.ok || !responseData.success) {
        throw new Error(responseData.error || "Failed to fetch compliance checklist");
      }

      setData(responseData);
    } catch (err: any) {
      console.error("Failed to fetch compliance checklist:", err);
      setError(err.message || "Failed to load compliance checklist");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: ComplianceStatus) => {
    switch (status) {
      case "ALL_SET":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-vm-success-bg text-green-800">
            <CheckCircle className="w-4 h-4" />
            All Set
          </span>
        );
      case "ACTION_REQUIRED":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-vm-danger-bg text-red-800">
            <AlertCircle className="w-4 h-4" />
            Action Required
          </span>
        );
      case "UNDER_REVIEW":
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-vm-warning-bg text-yellow-800">
            <Clock className="w-4 h-4" />
            Under Review
          </span>
        );
    }
  };

  const getItemIcon = (status: ComplianceChecklistItem["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "incomplete":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case "review":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
    }
  };

  const getSectionIcon = (sectionId: string) => {
    switch (sectionId) {
      case "stripe-connect":
        return <CreditCard className="w-6 h-6 text-blue-600" />;
      case "tax-profile":
        return <FileText className="w-6 h-6 text-green-600" />;
      case "statements":
        return <Receipt className="w-6 h-6 text-purple-600" />;
      default:
        return <CheckCircle className="w-6 h-6 text-vm-muted" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error || "Failed to load compliance checklist"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-vm-text mb-2">Compliance Checklist</h1>
          <p className="text-vm-muted">
            Complete these items to ensure uninterrupted payment processing
          </p>
        </div>

        {/* Archive Notice (Phase 3H.11) */}
        {new Date().getMonth() > 0 && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 text-xl">🗂️</div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Tax year closed
                </h3>
                <p className="text-sm text-blue-800">
                  Your information has been recorded for reporting. If you have questions, contact support.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overall Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-vm-text">Overall Status</h2>
            {getStatusBadge(data.overallStatus)}
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.summary.completedItems}
              </div>
              <div className="text-sm text-vm-muted">Complete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.summary.incompleteItems}
              </div>
              <div className="text-sm text-vm-muted">Incomplete</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {data.summary.pendingItems}
              </div>
              <div className="text-sm text-vm-muted">Pending/Review</div>
            </div>
          </div>

          {/* Readiness Score (Phase 3H.5) */}
          {data.readinessScore !== undefined && (
            <div className="mb-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-vm-text">
                  Jan 31 Readiness Score
                </span>
                <span className="text-2xl font-bold text-vm-text">
                  {data.readinessScore.toFixed(1)}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    data.readinessScore >= 80
                      ? "bg-vm-success"
                      : data.readinessScore >= 60
                      ? "bg-vm-warning"
                      : "bg-vm-danger"
                  }`}
                  style={{ width: `${data.readinessScore}%` }}
                />
              </div>
            </div>
          )}

          {/* Soft Countdown Notice (Phase 3H.7) */}
          {data.countdown?.active && (
            <div
              className={`mt-4 pt-4 border-t border-gray-200 ${
                data.countdown.phase === "CRITICAL"
                  ? "bg-red-50 border-red-200"
                  : data.countdown.phase === "WARNING"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-blue-50 border-blue-200"
              } rounded-lg p-3`}
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-vm-muted" />
                <span className="text-sm text-vm-text">
                  <strong>{data.countdown.daysRemaining} day{data.countdown.daysRemaining !== 1 ? "s" : ""}</strong> until Jan 31 tax deadline
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Sections */}
        {data.sections.map((section) => (
          <div
            key={section.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getSectionIcon(section.id)}
                  <h3 className="text-lg font-semibold text-vm-text">{section.title}</h3>
                </div>
                {section.allComplete && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-vm-success-bg text-green-800">
                    <CheckCircle className="w-3 h-3" />
                    Complete
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 space-y-4">
              {section.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">{getItemIcon(item.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-vm-text mb-1">
                          {item.label}
                        </h4>
                        <p className="text-sm text-vm-muted">{item.description}</p>
                      </div>
                      {item.actionUrl && item.actionLabel && (
                        <Link
                          href={item.actionUrl}
                          className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        >
                          {item.actionLabel}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Help Text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Need help?</strong> If you have questions about any of these requirements,
            please contact our support team. All information is encrypted and secure.
          </p>
        </div>
      </div>
    </div>
  );
}

