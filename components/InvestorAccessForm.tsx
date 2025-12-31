/**
 * Investor Access Request Form
 * 
 * Client component for capturing access requests
 * Simple form with clear expectations
 * Phase-appropriate gating - calm, not salesy
 */

"use client";

import { useState } from "react";

interface InvestorAccessFormProps {
  onSubmitted?: () => void;
}

export default function InvestorAccessForm({ onSubmitted }: InvestorAccessFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      organization: formData.get("organization") as string,
      interest: formData.get("interest") as string,
    };

    try {
      const res = await fetch("/api/investors/request-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || "Failed to submit request");
      }

      // Success - call callback to show pending notice
      onSubmitted?.();
    } catch (err: any) {
      console.error("Failed to submit request:", err);
      setError(err.message || "Failed to submit request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="mt-8 max-w-xl space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Full name
        </label>
        <input
          name="name"
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email address
        </label>
        <input
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Organization
        </label>
        <input
          name="organization"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Investment interest
        </label>
        <select
          name="interest"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Select...</option>
          <option value="Exploring opportunity">Exploring opportunity</option>
          <option value="Active diligence">Active diligence</option>
          <option value="Strategic partnership">Strategic partnership</option>
        </select>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="mt-4 inline-flex items-center rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Submitting..." : "Request access"}
      </button>
    </form>
  );
}

