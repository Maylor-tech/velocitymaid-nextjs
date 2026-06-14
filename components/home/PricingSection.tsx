"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

interface PricingPlan {
  name: string;
  price: string;
  per: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlight: boolean;
}

const njPricing: PricingPlan[] = [
  {
    name: "Basic clean",
    price: "$120",
    per: "per service",
    description: "Perfect for regular maintenance",
    features: [
      "Kitchen cleaning",
      "Bathroom cleaning",
      "Dusting & vacuuming",
      "Floor mopping",
      "Trash removal",
    ],
    cta: "Book Now",
    href: "/book?branch=new-jersey",
    highlight: false,
  },
  {
    name: "Deep clean",
    price: "$220",
    per: "per service",
    description: "Thorough top-to-bottom clean",
    features: [
      "Everything in Basic",
      "Inside oven & fridge",
      "Cabinet fronts",
      "Baseboards & edges",
      "Window sills",
    ],
    cta: "Book Now",
    href: "/book?branch=new-jersey",
    highlight: true,
  },
  {
    name: "Move-in / out",
    price: "$320",
    per: "per service",
    description: "Full property reset",
    features: [
      "Everything in Deep",
      "Inside all cabinets",
      "Walls spot-cleaned",
      "Appliances inside/out",
      "Deposit-ready finish",
    ],
    cta: "Book Now",
    href: "/book?branch=new-jersey",
    highlight: false,
  },
];

const vermontPricing: PricingPlan[] = [
  {
    name: "Turnover clean",
    price: "$225",
    per: "per turn",
    description: "Between-guest reset for STRs",
    features: [
      "Full kitchen reset",
      "All bathrooms cleaned",
      "Beds stripped & remade",
      "Floors vacuumed & mopped",
      "Photo report included",
    ],
    cta: "Book Vermont",
    href: "/vermont/host-intake",
    highlight: false,
  },
  {
    name: "Large property",
    price: "$275",
    per: "per turn",
    description: "4+ bed homes & extended area",
    features: [
      "Everything in Turnover",
      "Travel premium included",
      "Linen change add-on",
      "Priority scheduling",
      "Dedicated host support",
    ],
    cta: "Book Vermont",
    href: "/vermont/host-intake",
    highlight: true,
  },
  {
    name: "Deep clean",
    price: "$375",
    per: "per visit",
    description: "First visit or post-season reset",
    features: [
      "Full-day service",
      "Inside oven & fridge",
      "Baseboards & window sills",
      "Mudroom & laundry room",
      "Detailed photo report",
    ],
    cta: "Get a quote",
    href: "/vermont/host-intake",
    highlight: false,
  },
];

export default function PricingSection() {
  const [market, setMarket] = useState<"nj" | "vermont">("nj");

  const activePricing = market === "nj" ? njPricing : vermontPricing;

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-brand-ivory">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-brand-forest mb-4">
            Transparent Pricing
          </h2>
          <p className="text-xl text-brand-slate/70">
            No hidden fees, just clean homes
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-10">
          <button
            type="button"
            onClick={() => setMarket("nj")}
            className={`px-6 py-2 rounded-lg font-heading font-semibold text-sm transition-colors ${
              market === "nj"
                ? "bg-vm-navy text-white"
                : "bg-vm-surface text-vm-muted border border-vm-border hover:border-vm-cyan"
            }`}
          >
            New Jersey
          </button>
          <button
            type="button"
            onClick={() => setMarket("vermont")}
            className={`px-6 py-2 rounded-lg font-heading font-semibold text-sm transition-colors ${
              market === "vermont"
                ? "bg-vm-navy text-white"
                : "bg-vm-surface text-vm-muted border border-vm-border hover:border-vm-cyan"
            }`}
          >
            Vermont
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {activePricing.map((plan) => (
            <div
              key={plan.name}
              className={`bg-white p-8 rounded-2xl shadow-lg card-hover ${
                plan.highlight ? "ring-2 ring-brand-gold relative" : ""
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-brand-forest text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-bold text-brand-forest mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                <span className="text-4xl font-bold text-brand-gold">
                  {plan.price}
                </span>
                <span className="text-brand-slate/70"> {plan.per}</span>
              </div>
              <p className="text-brand-slate/70 mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center text-brand-slate/80"
                  >
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className={`block text-center py-3 px-6 rounded-full font-semibold transition ${
                  plan.highlight
                    ? "bg-brand-forest text-white hover:bg-brand-forest-hover"
                    : "bg-white text-brand-forest hover:bg-gray-200"
                }`}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>

        {market === "nj" && (
          <p className="text-center text-sm font-body text-vm-muted mt-6">
            Serving Newark, Jersey City, Paterson and surrounding areas.
            <a
              href="/locations/new-jersey"
              className="text-vm-cyan hover:underline ml-1"
            >
              Learn more about NJ cleaning →
            </a>
          </p>
        )}

        {market === "vermont" && (
          <p className="text-center text-sm font-body text-vm-muted mt-6">
            Locally operated from Ludlow, VT. Serving Okemo Valley, Middlebury,
            and surrounding areas.
            <a href="/vermont" className="text-vm-cyan hover:underline ml-1">
              Learn more about Vermont cleaning →
            </a>
          </p>
        )}

        <p className="text-center text-brand-slate/70 mt-8">
          *Prices may vary based on home size and condition. Contact us for a
          custom quote.
        </p>
      </div>
    </section>
  );
}
