"use client";

import { useState } from "react";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      role: formData.get("role") as string,
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      organization: formData.get("organization") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to submit message");
      }

      setSubmitted(true);
      
      // Dispatch custom event to show confirmation
      window.dispatchEvent(new CustomEvent("contactFormSubmitted"));
    } catch (error: any) {
      console.error("Failed to submit contact form:", error);
      alert(error.message || "Failed to submit message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return null;
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 max-w-xl space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700">
          I'm reaching out as a
        </label>
        <select
          name="role"
          required
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Select one</option>
          <option value="partner">Partner / Operator</option>
          <option value="investor">Investor</option>
          <option value="advisor">Advisor</option>
          <option value="other">Other</option>
        </select>
      </div>

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
          Organization (optional)
        </label>
        <input
          name="organization"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Message
        </label>
        <textarea
          name="message"
          rows={4}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-4 inline-flex items-center rounded-md bg-gray-900 px-6 py-3 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Send message"}
      </button>
    </form>
  );
}

