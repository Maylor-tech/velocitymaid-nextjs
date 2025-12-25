"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Test Authentication Page for Branch Owners
 * 
 * This page helps you set the authentication cookie for testing.
 * In production, branch owners would log in through a proper login flow.
 */

export default function TestAuthPage() {
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setAuthCookie = async () => {
    if (!userId.trim()) {
      setStatus("Please enter a user ID");
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/branch-owner/test-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await res.json();

      if (data.success) {
        setStatus(`✅ Cookie set! Redirecting to dashboard...`);
        setTimeout(() => {
          window.location.href = "/branch-owner/dashboard";
        }, 1500);
      } else {
        setStatus(`❌ Error: ${data.error}`);
      }
    } catch (err: any) {
      setStatus(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Branch Owner Test Authentication</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch Owner User ID
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID with BRANCH_OWNER role"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-2">
              Get this from your database: SELECT id FROM "User" WHERE role = 'BRANCH_OWNER';
            </p>
          </div>

          <Button
            onClick={setAuthCookie}
            disabled={loading || !userId.trim()}
            className="w-full"
          >
            {loading ? "Setting Cookie..." : "Set Auth Cookie & Go to Dashboard"}
          </Button>

          {status && (
            <div className={`p-3 rounded-lg ${
              status.includes("✅") 
                ? "bg-green-50 text-green-800" 
                : "bg-red-50 text-red-800"
            }`}>
              {status}
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> This is a test page. In production, branch owners would log in through a proper authentication flow.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}










