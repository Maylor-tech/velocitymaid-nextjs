/**
 * Admin Command Center Dashboard
 * 
 * /admin
 * 
 * Operational command center: Awareness + Action
 * Every metric leads to an action. Every action updates a metric.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Mail, 
  Briefcase, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  Archive,
  MessageSquare,
  Users
} from "lucide-react";

interface DashboardMetrics {
  messages: {
    NEW: number;
    REVIEWED: number;
    REPLIED: number;
    ARCHIVED: number;
    total: number;
  };
  investorRequests: {
    PENDING: number;
    APPROVED: number;
    total: number;
  };
}

function MetricCard({
  title,
  count,
  status,
  href,
  icon: Icon,
  color,
}: {
  title: string;
  count: number;
  status?: string;
  href: string;
  icon: any;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 hover:shadow-sm transition-all"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-semibold text-gray-900 mt-1">{count}</p>
            {status && (
              <p className="text-xs text-gray-500 mt-1">{status}</p>
            )}
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-gray-400" />
      </div>
    </Link>
  );
}

export default function AdminCommandCenter() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMetrics();
    
    // Listen for status updates from inbox
    const handleStatusUpdate = () => {
      fetchMetrics();
    };
    window.addEventListener("messageStatusUpdated", handleStatusUpdate);
    
    return () => {
      window.removeEventListener("messageStatusUpdated", handleStatusUpdate);
    };
  }, []);

  // Refresh metrics when returning from inbox (router refresh)
  useEffect(() => {
    const handleFocus = () => {
      fetchMetrics();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch authoritative metrics from dedicated endpoint
      const metricsRes = await fetch("/api/admin/dashboard/metrics", {
        cache: "no-store",
      });
      const metricsData = await metricsRes.json();

      // Fetch investor requests
      const investorRes = await fetch("/api/admin/investors/requests", {
        cache: "no-store",
      });
      const investorData = await investorRes.json();

      if (metricsData.success && investorData.success) {
        const messageMetrics = metricsData.metrics || {};
        const investorRequests = investorData.requests || [];

        setMetrics({
          messages: {
            NEW: messageMetrics.NEW || 0,
            REVIEWED: messageMetrics.REVIEWED || 0,
            REPLIED: messageMetrics.REPLIED || 0,
            ARCHIVED: messageMetrics.ARCHIVED || 0,
            total: (messageMetrics.NEW || 0) + 
                   (messageMetrics.REVIEWED || 0) + 
                   (messageMetrics.REPLIED || 0) + 
                   (messageMetrics.ARCHIVED || 0),
          },
          investorRequests: {
            PENDING: investorRequests.filter((r: any) => r.status === "PENDING").length,
            APPROVED: investorRequests.filter((r: any) => r.status === "APPROVED").length,
            total: investorRequests.length,
          },
        });
      } else {
        throw new Error("Failed to fetch metrics");
      }
    } catch (err: any) {
      console.error("Failed to fetch dashboard metrics:", err);
      setError(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="rounded-md bg-red-50 border border-red-200 p-6">
          <p className="text-red-800">{error || "Failed to load dashboard"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Command Center</h1>
        <p className="mt-2 text-sm text-gray-600">
          Every inbound communication is tracked from first contact to resolution, with timestamps, responses, and status changes logged automatically.
        </p>
      </div>

      {/* Messages Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <MessageSquare className="w-5 h-5 mr-2" />
            Contact Messages
          </h2>
          <Link
            href="/admin/inbox"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
          >
            View all
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="New Messages"
            count={metrics.messages.NEW}
            status="Requires attention"
            href="/admin/inbox?status=NEW"
            icon={Mail}
            color="bg-amber-600"
          />
          <MetricCard
            title="Reviewed"
            count={metrics.messages.REVIEWED}
            status="In progress"
            href="/admin/inbox?status=REVIEWED"
            icon={Clock}
            color="bg-gray-600"
          />
          <MetricCard
            title="Replied"
            count={metrics.messages.REPLIED}
            status="Response sent"
            href="/admin/inbox?status=REPLIED"
            icon={CheckCircle2}
            color="bg-green-600"
          />
          <MetricCard
            title="Archived"
            count={metrics.messages.ARCHIVED}
            status="Completed"
            href="/admin/inbox?status=ARCHIVED"
            icon={Archive}
            color="bg-gray-400"
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Total: <span className="font-medium text-gray-900">{metrics.messages.total}</span> messages
          </p>
        </div>
      </div>

      {/* Investor Requests Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Briefcase className="w-5 h-5 mr-2" />
            Investor Access Requests
          </h2>
          <Link
            href="/admin/investors/requests"
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
          >
            View all
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetricCard
            title="Pending Approval"
            count={metrics.investorRequests.PENDING}
            status="Awaiting review"
            href="/admin/investors/requests?status=PENDING"
            icon={Clock}
            color="bg-yellow-600"
          />
          <MetricCard
            title="Approved"
            count={metrics.investorRequests.APPROVED}
            status="Access granted"
            href="/admin/investors/requests?status=APPROVED"
            icon={CheckCircle2}
            color="bg-green-600"
          />
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Total: <span className="font-medium text-gray-900">{metrics.investorRequests.total}</span> requests
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t pt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/admin/inbox"
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Open Inbox</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
          <Link
            href="/admin/investors/requests"
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Briefcase className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Review Investor Requests</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
          <Link
            href="/admin/contact/templates"
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-gray-600" />
              <span className="text-sm font-medium text-gray-900">Manage Reply Templates</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
          </Link>
        </div>
      </div>

      {/* Governance Statement */}
      <div className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="text-sm text-gray-700 italic text-center">
          "VelocityMaid treats communication as governance, not correspondence."
        </p>
        <p className="text-xs text-gray-500 text-center mt-2">
          Every interaction is logged, tracked, and auditable. No messages disappear. No responses go unrecorded.
        </p>
      </div>
    </div>
  );
}

