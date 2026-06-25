"use client";

import { useState, useEffect } from "react";
import ContactForm from "./ContactForm";

export default function ContactConfirmation() {
  const [submitted, setSubmitted] = useState(false);

  // Listen for form submission from ContactForm
  useEffect(() => {
    const handleFormSubmit = () => {
      setSubmitted(true);
    };

    // Custom event from ContactForm
    window.addEventListener("contactFormSubmitted", handleFormSubmit);

    return () => {
      window.removeEventListener("contactFormSubmitted", handleFormSubmit);
    };
  }, []);

  if (!submitted) {
    return null;
  }

  return (
    <div className="mt-10 max-w-xl rounded-md border border-vm-border bg-vm-surface p-6">
      <h4 className="font-medium text-vm-text">
        Message received
      </h4>

      <p className="mt-2 text-vm-muted">
        Thank you for reaching out. Messages are reviewed thoughtfully to ensure
        context and alignment.
      </p>

      <p className="mt-2 text-sm text-vm-muted">
        You'll hear back shortly if there's a fit.
      </p>
    </div>
  );
}


