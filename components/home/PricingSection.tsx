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
  startingAt?: boolean;
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
    name: "Vacation rental turnover",
    price: "$175",
    per: "per turn",
    startingAt: true,
    description: "Between-guest reset for STRs — studio/1BR up to 5BR",
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
    name: "Deep cleaning",
    price: "$300",
    per: "per visit",
    startingAt: true,
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
    highlight: true,
  },
  {
    name: "Move in / move out",
    price: "$450",
    per: "per service",
    startingAt: true,
    description: "Full property reset",
    features: [
      "Everything in Deep Cleaning",
      "Inside all cabinets",
      "Walls spot-cleaned",
      "Appliances inside/out",
      "Deposit-ready finish",
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
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-vm-surface">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-heading font-bold text-vm-navy mb-4">
            Transparent Pricing
          </h2>
          <p className="text-xl text-vm-muted font-body">
            No hidden fees, just clean homes
          </p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-8">
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
              className={`bg-vm-white p-8 rounded-2xl shadow-lg card-hover ${
                plan.highlight ? "ring-2 ring-vm-cyan relative" : ""
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-vm-navy text-vm-white px-4 py-1 rounded-full text-sm font-heading font-semibold">
                    Most Popular
                  </span>
                </div>
              )}
              <h3 className="text-2xl font-heading font-bold text-vm-navy mb-2">
                {plan.name}
              </h3>
              <div className="mb-4">
                {plan.startingAt && (
                  <div className="text-xs font-body font-semibold uppercase tracking-wide text-vm-muted mb-1">
                    Starting at
                  </div>
                )}
                <span className="text-4xl font-heading font-bold text-vm-cyan">
                  {plan.price}
                </span>
                <span className="text-vm-muted font-body"> {plan.per}</span>
              </div>
              <p className="text-vm-muted font-body mb-6">{plan.description}</p>
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center text-vm-text font-body"
                  >
                    <CheckCircle className="w-5 h-5 text-vm-cyan mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <a
                href={plan.href}
                className={`block text-center py-3 px-6 rounded-full font-heading font-semibold transition ${
                  plan.highlight
                    ? "bg-vm-navy text-vm-white hover:bg-vm-navy/90"
                    : "bg-vm-white text-vm-navy border border-vm-navy/10 hover:bg-vm-surface"
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
              href="/new-jersey"
              className="text-vm-cyan hover:underline ml-1"
            >
              Learn more about NJ cleaning →
            </a>
          </p>
        )}

        {market === "vermont" && (
          <p className="text-center text-sm font-body text-vm-muted mt-6">
            Locally operated in Vermont&apos;s Okemo Valley, serving Ludlow,
            Middlebury, and surrounding towns.
            <a href="/vermont" className="text-vm-cyan hover:underline ml-1">
              Learn more about Vermont cleaning →
            </a>
          </p>
        )}

        {market === "vermont" && (
          <div className="mt-10 max-w-2xl mx-auto rounded-2xl border border-vm-navy/10 bg-vm-white p-6 sm:p-8 text-center">
            <h3 className="text-lg font-heading font-bold text-vm-navy mb-2">
              Project Cleaning &amp; Custom Quotes
            </h3>
            <p className="text-sm text-vm-muted font-body leading-relaxed">
              Jobs requiring more than one cleaner, excessive debris,
              post-construction cleanup, neglected properties, estate
              cleanouts, or labor beyond standard service levels are quoted
              individually — not covered by the flat rates above.
            </p>
            <a
              href="/vermont/host-intake"
              className="inline-block mt-4 text-vm-cyan font-heading font-semibold hover:underline"
            >
              Get a custom quote →
            </a>
          </div>
        )}

        <p className="text-center text-vm-muted font-body mt-8 max-w-2xl mx-auto">
          Pricing is based on the property size, condition, occupancy, labor
          requirements, and service scope represented at booking. Excessive
          soil or trash, construction debris, biohazards, pet waste,
          additional labor requirements, or conditions requiring additional
          cleaners may result in an adjusted quote before work begins.
        </p>
      </div>
    </section>
  );
}
