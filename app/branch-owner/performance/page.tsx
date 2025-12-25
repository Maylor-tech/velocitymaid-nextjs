"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { AlertTriangle, CheckCircle2, Clock, Users, Calendar } from "lucide-react";
import Link from "next/link";

interface PerformanceData {
  cancellationRate: {
    value: number;
    flagged: boolean;
    threshold: number;
    totalJobs: number;
    cancelledJobs: number;
  };
  cleanerIssues: {
    flagged: boolean;
    cleaners: Array<{
      cleanerId: string;
      cleanerName: string;
      lowRatingCount: number;
    }>;
    count: number;
  };
  responseTime: {
    averageHours: number | null;
    slowResponseCount: number;
    flagged: boolean;
  };
  jobsNeedingAttention: {
    count: number;
    flagged: boolean;
  };
}

export default function BranchOwnerPerformancePage() {
  const [performance, setPerformance] = useState<PerformanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/branch-owner/performance");
      const data = await res.json();
      
      if (data.success) {
        setPerformance(data.performance);
      } else {
        throw new Error(data.error || "Failed to load performance metrics");
      }
    } catch (err: any) {
      console.error("Error fetching performance:", err);
      setError(err.message || "Failed to load performance metrics");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading performance metrics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!performance) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Performance Flags</h1>
            <p className="text-gray-600 mt-2">
              Internal metrics and flags for your branch
            </p>
          </div>
          <Link href="/branch-owner/dashboard">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Back to Dashboard
            </button>
          </Link>
        </div>

        {/* Cancellation Rate */}
        <Card className={performance.cancellationRate.flagged ? "border-yellow-200 bg-yellow-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {performance.cancellationRate.flagged ? (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
              Cancellation Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-3xl font-bold text-gray-900">
                  {performance.cancellationRate.value}%
                </span>
                {performance.cancellationRate.flagged ? (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    Above Threshold ({performance.cancellationRate.threshold}%)
                  </Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800">Within Normal Range</Badge>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {performance.cancellationRate.cancelledJobs} cancelled out of {performance.cancellationRate.totalJobs} total jobs (last 30 days)
              </p>
              {performance.cancellationRate.flagged && (
                <p className="text-sm text-yellow-700 mt-2">
                  ⚠️ Your cancellation rate is above the threshold. Review job assignments and customer communication.
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cleaner Issues */}
        <Card className={performance.cleanerIssues.flagged ? "border-orange-200 bg-orange-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {performance.cleanerIssues.flagged ? (
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              )}
              Cleaner Issues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {performance.cleanerIssues.flagged ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  {performance.cleanerIssues.count} cleaner(s) with repeated low ratings:
                </p>
                <div className="space-y-2">
                  {performance.cleanerIssues.cleaners.map((issue) => (
                    <div
                      key={issue.cleanerId}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{issue.cleanerName}</p>
                        <p className="text-xs text-gray-600">
                          {issue.lowRatingCount} low rating(s) in the last 30 days
                        </p>
                      </div>
                      <Link href={`/branch-owner/cleaners`}>
                        <button className="text-xs text-orange-600 hover:underline">
                          Review →
                        </button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm text-gray-600">No cleaners with repeated issues</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card className={performance.responseTime.flagged ? "border-red-200 bg-red-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {performance.responseTime.flagged ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <Clock className="w-5 h-5 text-blue-600" />
              )}
              Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {performance.responseTime.averageHours !== null
                      ? `${performance.responseTime.averageHours} hours`
                      : "N/A"}
                  </p>
                  <p className="text-xs text-gray-600">Average time from assignment to job date</p>
                </div>
                {performance.responseTime.flagged ? (
                  <Badge className="bg-red-100 text-red-800">Slow Response</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800">Good Response</Badge>
                )}
              </div>
              {performance.responseTime.slowResponseCount > 0 && (
                <p className="text-sm text-red-700">
                  ⚠️ {performance.responseTime.slowResponseCount} job(s) assigned but not started within 24 hours
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Jobs Needing Attention */}
        <Card className={performance.jobsNeedingAttention.flagged ? "border-yellow-200 bg-yellow-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              Jobs Needing Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {performance.jobsNeedingAttention.count}
                </p>
                <p className="text-sm text-gray-600">
                  Pending or assigned jobs past their scheduled date
                </p>
              </div>
              {performance.jobsNeedingAttention.flagged && (
                <Link href="/branch-owner/jobs?filter=attention">
                  <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700">
                    View Jobs →
                  </button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Internal Metrics Only
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  These performance flags are for internal use only. They help identify areas for improvement and guide data-informed conversations. No automatic penalties are applied.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}












