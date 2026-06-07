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
          className="border border-brand-forest/10 rounded-xl overflow-hidden bg-white shadow-sm"
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-brand-ivory/60 transition"
          >
            <span className="font-serif font-semibold text-brand-forest text-sm sm:text-base">
              {faq.question}
            </span>
            {openIndex === index ? (
              <ChevronUp className="w-5 h-5 text-brand-gold shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-brand-gold shrink-0" />
            )}
          </button>
          {openIndex === index && (
            <div className="px-5 py-4 bg-brand-ivory/40 border-t border-brand-forest/5 text-brand-slate/80 font-sans text-sm leading-relaxed">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
