"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Users, Calendar, AlertTriangle, MessageSquare } from "lucide-react";
import Link from "next/link";

// 🚫 PRODUCTION: This route is disabled for launch
export const dynamic = "force-dynamic";

interface DashboardMetrics {
  jobsToday: number;
  jobsThisWeek: number;
  activeCleaners: number;
  jobsNeedingAttention: number;
  customerIssues: number;
  recentJobsCount: number;
}

export default function BranchOwnerDashboardPage() {
  // Block in production
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-vm-text mb-2">404</h1>
          <p className="text-vm-muted">Page not found</p>
        </div>
      </div>
    );
  }
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/branch-owner/dashboard");
      
      // Check if response is OK before parsing JSON
      if (!res.ok) {
        const errorText = await res.text();
        let errorMessage = `Error ${res.status}: ${res.statusText}`;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If not JSON, use the text or status
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }
      
      const data = await res.json();
      
      if (data.success) {
        setMetrics(data.metrics);
      } else {
        throw new Error(data.error || "Failed to load dashboard");
      }
    } catch (err: any) {
      console.error("Error fetching dashboard:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-vm-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const isAuthError = error.includes("Unauthorized") || error.includes("401");
    
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600 font-medium mb-2">{error}</p>
              {isAuthError && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Authentication Required:</strong> You need to set a branch owner authentication cookie.
                  </p>
                  <a
                    href="/branch-owner/test-auth"
                    className="inline-block px-4 py-2 bg-vm-warning text-white rounded-lg hover:bg-vm-warning text-sm"
                  >
                    Go to Test Auth Page →
                  </a>
                </div>
              )}
              <button
                onClick={fetchDashboard}
                className="mt-4 px-4 py-2 bg-vm-danger text-white rounded-lg hover:bg-vm-danger"
              >
                Try Again
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-vm-text">Branch Dashboard</h1>
          <p className="text-vm-muted mt-2">
            Operational overview for your branch
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Jobs Today */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-vm-muted">
                Jobs Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-vm-text">{metrics.jobsToday}</p>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          {/* Jobs This Week */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-vm-muted">
                Jobs This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-vm-text">{metrics.jobsThisWeek}</p>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          {/* Active Cleaners */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-vm-muted">
                Active Cleaners
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-vm-text">{metrics.activeCleaners}</p>
                <Users className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          {/* Jobs Needing Attention */}
          <Card className={metrics.jobsNeedingAttention > 0 ? "border-yellow-300 bg-yellow-50" : ""}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-vm-muted">
                Needs Attention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <p className="text-3xl font-bold text-vm-text">{metrics.jobsNeedingAttention}</p>
                <AlertTriangle className="w-8 h-8 text-yellow-600" />
              </div>
              {metrics.jobsNeedingAttention > 0 && (
                <Link href="/branch-owner/jobs?filter=attention">
                  <p className="text-xs text-yellow-700 mt-2 hover:underline">
                    View jobs →
                  </p>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Jobs Management */}
          <Card>
            <CardHeader>
              <CardTitle>Job Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-vm-text">Manage Jobs</p>
                  <p className="text-sm text-vm-muted">
                    Assign, reassign, or flag jobs for review
                  </p>
                </div>
                <Link href="/branch-owner/jobs">
                  <button className="px-4 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy">
                    View Jobs
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Cleaner Oversight */}
          <Card>
            <CardHeader>
              <CardTitle>Cleaner Oversight</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-vm-text">Manage Cleaners</p>
                  <p className="text-sm text-vm-muted">
                    View profiles, ratings, and request actions
                  </p>
                </div>
                <Link href="/branch-owner/cleaners">
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    View Cleaners
                  </button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Customer Issues Alert */}
        {metrics.customerIssues > 0 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-900">
                <MessageSquare className="w-5 h-5" />
                Customer Issues
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-orange-800">
                You have <strong>{metrics.customerIssues}</strong> customer issue(s) from this week.
              </p>
              <p className="text-sm text-orange-700 mt-2">
                Review ratings and escalate if needed.
              </p>
              <Link href="/branch-owner/escalate">
                <button className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                  Escalate Issues
                </button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Info Banner - No Financial Data */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Operational Dashboard
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  This dashboard shows operational metrics only. Financial data and payouts are managed by administrators.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


