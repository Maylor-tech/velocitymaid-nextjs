"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface FAQ {
  question: string;
  answer: string;
}

interface FAQAccordionProps {
  faqs: FAQ[];
}

export default function FAQAccordion({ faqs }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => (
        <div
          key={index}
          className="border border-vm-navy/10 rounded-xl overflow-hidden bg-vm-white shadow-sm"
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-vm-surface transition"
          >
            <span className="font-heading font-semibold text-vm-navy text-sm sm:text-base">
              {faq.question}
            </span>
            {openIndex === index ? (
              <ChevronUp className="w-5 h-5 text-vm-cyan shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-vm-cyan shrink-0" />
            )}
          </button>
          {openIndex === index && (
            <div className="px-5 py-4 bg-vm-surface border-t border-vm-navy/5 text-vm-text font-body text-sm leading-relaxed">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
