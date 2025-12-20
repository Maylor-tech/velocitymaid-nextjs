"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CheckCircle2, XCircle, AlertCircle, User, Mail, MapPin } from "lucide-react";
import Link from "next/link";

interface Cleaner {
  id: string;
  name: string | null;
  email: string;
  isActive: boolean;
  homeZip: string | null;
  preferredCities: string[];
  stats: {
    totalJobs: number;
    completedJobs: number;
    avgRating: number | null;
    paymentMethodStatus: {
      exists: boolean;
      verified: boolean;
      status: string;
    };
    trainingStatus: string | null;
  };
}

export default function BranchOwnerCleanersPage() {
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchCleaners();
  }, []);

  const fetchCleaners = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/branch-owner/cleaners");
      const data = await res.json();
      
      if (data.success) {
        setCleaners(data.cleaners);
      } else {
        throw new Error(data.error || "Failed to load cleaners");
      }
    } catch (err: any) {
      console.error("Error fetching cleaners:", err);
      setError(err.message || "Failed to load cleaners");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (cleanerId: string, actionType: string) => {
    if (!confirm(`Are you sure you want to request ${actionType.toLowerCase()} for this cleaner?`)) {
      return;
    }

    const reason = prompt("Please provide a reason for this action:");
    if (!reason) return;

    const notes = prompt("Additional notes (optional):") || "";

    setActionLoading(cleanerId);
    try {
      const res = await fetch(`/api/branch-owner/cleaners/${cleanerId}/request-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          actionType,
          reason,
          notes,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(data.message || "Request submitted successfully");
      } else {
        throw new Error(data.error || "Failed to submit request");
      }
    } catch (err: any) {
      console.error("Error requesting action:", err);
      alert(err.message || "Failed to submit request");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading cleaners...</p>
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
              <Button onClick={fetchCleaners} variant="outline" className="mt-4">
                Try Again
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Cleaner Oversight</h1>
            <p className="text-gray-600 mt-2">
              View and manage cleaners assigned to your branch
            </p>
          </div>
          <Link href="/branch-owner/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Summary Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Users className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{cleaners.length}</p>
                <p className="text-sm text-gray-600">Active Cleaners</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cleaners List */}
        {cleaners.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No cleaners assigned to your branch</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {cleaners.map((cleaner) => (
              <Card key={cleaner.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-4">
                      {/* Cleaner Info */}
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <User className="w-5 h-5 text-gray-400" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {cleaner.name || "Unnamed Cleaner"}
                          </h3>
                          {cleaner.isActive ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-800">Inactive</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 ml-8">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{cleaner.email}</span>
                          </div>
                          {cleaner.homeZip && (
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              <span>{cleaner.homeZip}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ml-8">
                        <div>
                          <p className="text-xs text-gray-500">Total Jobs</p>
                          <p className="text-lg font-semibold">{cleaner.stats.totalJobs}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Completed</p>
                          <p className="text-lg font-semibold">{cleaner.stats.completedJobs}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Avg Rating</p>
                          <p className="text-lg font-semibold">
                            {cleaner.stats.avgRating ? `${cleaner.stats.avgRating}/5` : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Payment Method</p>
                          {cleaner.stats.paymentMethodStatus.verified ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600 mt-1" />
                          ) : (
                            <XCircle className="w-5 h-5 text-yellow-600 mt-1" />
                          )}
                        </div>
                      </div>

                      {/* Status Indicators */}
                      <div className="flex flex-wrap gap-2 ml-8">
                        {cleaner.stats.paymentMethodStatus.status === "verified" && (
                          <Badge className="bg-green-100 text-green-800">
                            Payment Verified
                          </Badge>
                        )}
                        {cleaner.stats.paymentMethodStatus.status === "pending" && (
                          <Badge className="bg-yellow-100 text-yellow-800">
                            Payment Pending
                          </Badge>
                        )}
                        {cleaner.stats.paymentMethodStatus.status === "none" && (
                          <Badge className="bg-red-100 text-red-800">
                            No Payment Method
                          </Badge>
                        )}
                        {cleaner.stats.trainingStatus && (
                          <Badge className="bg-blue-100 text-blue-800">
                            Training: {cleaner.stats.trainingStatus}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequestAction(cleaner.id, "FLAG_FOR_REVIEW")}
                        disabled={actionLoading === cleaner.id}
                      >
                        {actionLoading === cleaner.id ? "Submitting..." : "Flag for Review"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequestAction(cleaner.id, "SUSPEND")}
                        disabled={actionLoading === cleaner.id}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Request Suspension
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequestAction(cleaner.id, "REASSIGN")}
                        disabled={actionLoading === cleaner.id}
                      >
                        Request Reassignment
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Banner */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Read-Only View
                </p>
                <p className="text-xs text-blue-700 mt-1">
                  You can view cleaner profiles and request actions, but cannot edit payment methods or view payout amounts. All action requests require admin approval.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}




