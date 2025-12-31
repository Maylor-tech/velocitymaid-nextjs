/**
 * Admin Investor Access Requests Page
 * 
 * /admin/investors/requests
 * 
 * Admin-only page to review investor access requests
 * Read-only, clean presentation
 */

"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface InvestorRequest {
  id: string;
  name: string;
  email: string;
  organization: string | null;
  interest: string | null;
  status: string;
  approvedAt: string | null;
  approvedBy: string | null;
  createdAt: string;
}

export default function InvestorRequestsPage() {
  const [requests, setRequests] = useState<InvestorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch("/api/admin/investors/requests", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch requests");
      }

      const data = await res.json();
      if (data.success) {
        setRequests(data.requests || []);
      } else {
        throw new Error(data.error || "Failed to fetch requests");
      }
    } catch (err: any) {
      console.error("Failed to fetch requests:", err);
      setError(err.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (id: string) => {
    if (!confirm("Approve this request and send approval email?")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/investors/requests/${id}/approve`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to approve request");
      }

      // Refresh the list
      await fetchRequests();
    } catch (err: any) {
      console.error("Failed to approve request:", err);
      alert(err.message || "Failed to approve request. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="rounded-md bg-red-50 border border-red-200 p-6">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-gray-900">
        Investor Access Requests
      </h1>

      <p className="mt-2 text-gray-600">
        Requests for access to confidential investor materials.
      </p>

      <div className="mt-8 divide-y border border-gray-200 rounded-md">
        {requests.length === 0 ? (
          <div className="p-6 text-sm text-gray-500 text-center">
            No requests yet.
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{request.name}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    {request.email} {request.organization ? `· ${request.organization}` : ""}
                  </div>
                  {request.interest && (
                    <div className="text-sm text-gray-500 mt-1">
                      Interest: {request.interest}
                    </div>
                  )}
                  <div className="text-xs text-gray-400 mt-2">
                    Requested: {new Date(request.createdAt).toLocaleString()}
                  </div>
                  {request.status === "APPROVED" && request.approvedAt && (
                    <div className="text-xs text-green-600 mt-1">
                      Approved: {new Date(request.approvedAt).toLocaleString()}
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  {request.status === "PENDING" ? (
                    <button
                      onClick={() => approveRequest(request.id)}
                      className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      Approve & Send
                    </button>
                  ) : (
                    <span className="inline-block text-sm text-green-700 font-medium">
                      ✓ Approved and sent
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

