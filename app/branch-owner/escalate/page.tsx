"use client";

// 🚫 PRODUCTION: This route is disabled for launch
export const dynamic = "force-dynamic";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BranchOwnerEscalatePage() {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">404</h1>
          <p className="text-gray-600">Page not found</p>
        </div>
      </div>
    );
  }
  
  const router = useRouter();
  const [issueType, setIssueType] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [relatedJobId, setRelatedJobId] = useState<string>("");
  const [relatedCleanerId, setRelatedCleanerId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/branch-owner/escalate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          issueType,
          reason,
          notes: notes || null,
          relatedJobId: relatedJobId || null,
          relatedCleanerId: relatedCleanerId || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/branch-owner/dashboard");
        }, 2000);
      } else {
        throw new Error(data.error || "Failed to escalate issue");
      }
    } catch (err: any) {
      console.error("Error escalating issue:", err);
      setError(err.message || "Failed to escalate issue");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Issue Escalated Successfully
              </h2>
              <p className="text-gray-600 mb-4">
                An administrator will review your escalation shortly.
              </p>
              <p className="text-sm text-gray-500">
                Redirecting to dashboard...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Escalate Issue</h1>
          <p className="text-gray-600 mt-2">
            Escalate an issue to administrators for review
          </p>
        </div>

        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-red-600">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Issue Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Issue Type */}
              <div>
                <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="issueType"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select issue type</option>
                  <option value="JOB_DISPUTE">Job Dispute</option>
                  <option value="CLEANER_ISSUE">Cleaner Issue</option>
                  <option value="CUSTOMER_COMPLAINT">Customer Complaint</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Reason */}
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <select
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select reason</option>
                  {issueType === "JOB_DISPUTE" && (
                    <>
                      <option value="PRICING_DISPUTE">Pricing Dispute</option>
                      <option value="SERVICE_QUALITY">Service Quality Issue</option>
                      <option value="SCHEDULING_CONFLICT">Scheduling Conflict</option>
                      <option value="CUSTOMER_REQUEST">Special Customer Request</option>
                    </>
                  )}
                  {issueType === "CLEANER_ISSUE" && (
                    <>
                      <option value="PERFORMANCE_ISSUE">Performance Issue</option>
                      <option value="ATTENDANCE_ISSUE">Attendance Issue</option>
                      <option value="BEHAVIOR_ISSUE">Behavior Issue</option>
                      <option value="SUSPENSION_REQUEST">Suspension Request</option>
                    </>
                  )}
                  {issueType === "CUSTOMER_COMPLAINT" && (
                    <>
                      <option value="QUALITY_COMPLAINT">Quality Complaint</option>
                      <option value="CLEANER_BEHAVIOR">Cleaner Behavior</option>
                      <option value="DAMAGE_CLAIM">Damage Claim</option>
                      <option value="REFUND_REQUEST">Refund Request</option>
                    </>
                  )}
                  {issueType === "OTHER" && (
                    <>
                      <option value="TECHNICAL_ISSUE">Technical Issue</option>
                      <option value="POLICY_QUESTION">Policy Question</option>
                      <option value="OTHER">Other</option>
                    </>
                  )}
                </select>
              </div>

              {/* Optional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="relatedJobId" className="block text-sm font-medium text-gray-700 mb-2">
                    Related Job ID (Optional)
                  </label>
                  <input
                    id="relatedJobId"
                    type="text"
                    value={relatedJobId}
                    onChange={(e) => setRelatedJobId(e.target.value)}
                    placeholder="Job ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="relatedCleanerId" className="block text-sm font-medium text-gray-700 mb-2">
                    Related Cleaner ID (Optional)
                  </label>
                  <input
                    id="relatedCleanerId"
                    type="text"
                    value={relatedCleanerId}
                    onChange={(e) => setRelatedCleanerId(e.target.value)}
                    placeholder="Cleaner ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Provide additional context about this issue..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={loading || !issueType || !reason}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? "Escalating..." : "Escalate to Admin"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  About Escalations
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  Escalated issues are reviewed by administrators. You'll be notified once the issue is resolved.
                  Use this for issues that require admin-level decisions or overrides.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}












