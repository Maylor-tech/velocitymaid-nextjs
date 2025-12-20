"use client";

/**
 * Phase M: Assignment Queue Dashboard
 * 
 * Shows unassigned jobs ordered by SLA urgency.
 * Helps Branch Owner prioritize assignments.
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface AssignmentQueueItem {
  jobId: string;
  customerName: string | null;
  serviceType: string | null;
  preferredDate: string | null;
  preferredTime: string | null;
  address: string | null;
  createdAt: string;
  assignedAt: string | null;
  assignmentTimeMinutes: number | null;
  slaStatus: "pending" | "met" | "violated" | "outside_hours";
  urgency: "low" | "medium" | "high" | "critical";
}

export default function AssignmentQueuePage() {
  const [queue, setQueue] = useState<AssignmentQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);

  useEffect(() => {
    // Get branch ID from cookie or context
    // For now, we'll need to pass it or get it from auth
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      // TODO: Get branchId from auth context
      const branchIdParam = branchId || "miami"; // Fallback for now
      const res = await fetch(
        `/api/pilot/assignment-sla?branchId=${branchIdParam}&queue=true`
      );
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to fetch assignment queue");
        return;
      }

      setQueue(data.queue || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch assignment queue");
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-red-100 text-red-800 border-red-300";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-300";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "low":
        return "bg-gray-100 text-gray-800 border-gray-300";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSLAStatusIcon = (status: string) => {
    switch (status) {
      case "violated":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "met":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const minutes = Math.round((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes} minutes ago`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  };

  if (loading && queue.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center">Loading assignment queue...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  const violations = queue.filter((item) => item.slaStatus === "violated").length;
  const pending = queue.filter((item) => item.slaStatus === "pending").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Assignment Queue</h1>
        <p className="text-gray-600">
          Jobs waiting for assignment. SLA: 60 minutes during business hours.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{queue.length}</div>
            <div className="text-sm text-gray-600">Total Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">{violations}</div>
            <div className="text-sm text-gray-600">SLA Violations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">{pending}</div>
            <div className="text-sm text-gray-600">Within SLA</div>
          </CardContent>
        </Card>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        {queue.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-gray-500">
              No jobs in assignment queue
            </CardContent>
          </Card>
        ) : (
          queue.map((item) => (
            <Card key={item.jobId} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {item.customerName || "Unknown Customer"}
                      </h3>
                      <Badge className={getUrgencyColor(item.urgency)}>
                        {item.urgency.toUpperCase()}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {getSLAStatusIcon(item.slaStatus)}
                        <span className="text-sm text-gray-600">
                          {item.slaStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Service:</span>{" "}
                        {item.serviceType || "N/A"}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{" "}
                        {item.preferredDate
                          ? new Date(item.preferredDate).toLocaleDateString()
                          : "TBD"}
                        {item.preferredTime && ` at ${item.preferredTime}`}
                      </div>
                      <div>
                        <span className="font-medium">Address:</span>{" "}
                        {item.address || "No address"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Created {formatTimeAgo(item.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 text-right">
                    <a
                      href={`/branch-owner/jobs?jobId=${item.jobId}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Assign →
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}



