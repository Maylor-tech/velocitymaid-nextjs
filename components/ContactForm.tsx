"use client";

import { useState } from "react";
import { brandClasses } from "@/lib/brand/colors";

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    
    const roleMap: Record<string, string> = {
      'partner': 'Partner / Operator',
      'investor': 'Investor',
      'advisor': 'Advisor',
      'other': 'Other',
    };
    
    const role = roleMap[formData.get("role") as string] || formData.get("role") as string;
    
    const payload = {
      role,
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
      window.dispatchEvent(new CustomEvent("contactFormSubmitted"));
    } catch (err: unknown) {
      console.error("Failed to submit contact form:", err);
      setError(err instanceof Error ? err.message : "Failed to submit message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return null;
  }

  const fieldClass = `${brandClasses.input} mt-1`;

  return (
    <form onSubmit={handleSubmit} className="mt-8 max-w-xl space-y-4">
      {error && (
        <div className="rounded border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive font-sans">{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-2 text-sm text-vm-navy hover:underline font-sans"
          >
            Dismiss
          </button>
        </div>
      )}
      <div>
        <label className={brandClasses.label}>I&apos;m reaching out as a</label>
        <select name="role" required className={fieldClass}>
          <option value="">Select one</option>
          <option value="partner">Partner / Operator</option>
          <option value="investor">Investor</option>
          <option value="advisor">Advisor</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div>
        <label className={brandClasses.label}>Full name</label>
        <input name="name" required className={fieldClass} />
      </div>

      <div>
        <label className={brandClasses.label}>Email address</label>
        <input name="email" type="email" required className={fieldClass} />
      </div>

      <div>
        <label className={brandClasses.label}>Organization (optional)</label>
        <input name="organization" className={fieldClass} />
      </div>

      <div>
        <label className={brandClasses.label}>Message</label>
        <textarea name="message" rows={4} className={fieldClass} />
      </div>

      <button
        type="submit"
        disabled={loading}
        className={`mt-4 ${brandClasses.btnPrimary} disabled:opacity-50`}
      >
        {loading ? "Submitting…" : "Send message"}
      </button>
    </form>
  );
}
