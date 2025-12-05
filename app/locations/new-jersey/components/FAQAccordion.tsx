"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
    <div className="space-y-4">
      {faqs.map((faq, index) => (
        <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition"
          >
            <span className="font-semibold text-[#0A3D2F]">{faq.question}</span>
            {openIndex === index ? (
              <ChevronUp className="w-5 h-5 text-[#0A3D2F]" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[#0A3D2F]" />
            )}
          </button>
          {openIndex === index && (
            <div className="px-6 py-4 bg-gray-50 text-gray-700">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
